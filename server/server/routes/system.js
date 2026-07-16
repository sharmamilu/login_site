const express = require('express');
const router = express.Router();
const dns = require('dns').promises;
const { Client } = require('ssh2');
const auth = require('../middleware/auth');
const { DISCOVERY_SCRIPT, parseDiscovery } = require('../utils/discovery');
const { generateInsights, summarizeInsights } = require('../utils/insights');

// Known CDN / edge signatures keyed off resolved CNAME chains and IP ownership.
const CDN_SIGNATURES = [
  { pattern: /cloudfront\.net/i, provider: 'AWS CloudFront' },
  { pattern: /elb\.amazonaws\.com/i, provider: 'AWS Elastic Load Balancer' },
  { pattern: /amazonaws\.com/i, provider: 'AWS' },
  { pattern: /cloudflare/i, provider: 'Cloudflare' },
  { pattern: /fastly/i, provider: 'Fastly' },
  { pattern: /akamai|akamaiedge/i, provider: 'Akamai' },
  { pattern: /azureedge\.net|trafficmanager\.net/i, provider: 'Azure CDN' },
  { pattern: /googleusercontent|ghs\.google|1e100\.net/i, provider: 'Google' },
  { pattern: /netlify/i, provider: 'Netlify' },
  { pattern: /vercel|now\.sh/i, provider: 'Vercel' },
  { pattern: /githubusercontent|github\.io/i, provider: 'GitHub Pages' },
];

function withTimeout(promise, ms = 2000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
}

async function analyzeDomain(domain) {
  const result = { domain, cname: null, addresses: [], cdn: null, resolves: false };
  try {
    const cnames = await withTimeout(dns.resolveCname(domain), 1500).catch(() => []);
    if (cnames.length) result.cname = cnames[0];
  } catch (_) { /* no CNAME */ }
  try {
    const addrs = await withTimeout(dns.resolve4(domain), 1500).catch(() => []);
    result.addresses = addrs;
    result.resolves = addrs.length > 0 || !!result.cname;
  } catch (_) { /* unresolved */ }

  const haystack = [result.cname || '', ...result.addresses].join(' ');
  for (const sig of CDN_SIGNATURES) {
    if (sig.pattern.test(haystack) || (result.cname && sig.pattern.test(result.cname))) {
      result.cdn = sig.provider;
      break;
    }
  }
  // Reverse-lookup the A records to catch CDNs that only show in PTR/ownership.
  if (!result.cdn && result.addresses.length) {
    for (const ip of result.addresses.slice(0, 2)) {
      const ptrs = await withTimeout(dns.reverse(ip), 1500).catch(() => []);
      const ptrJoin = ptrs.join(' ');
      const sig = CDN_SIGNATURES.find((s) => s.pattern.test(ptrJoin));
      if (sig) { result.cdn = sig.provider; break; }
    }
  }
  return result;
}

function runDiscoveryOverSsh({ host, port, username, privateKey, passphrase, password }) {
  return new Promise((resolve, reject) => {
    const conn = new Client();
    let settled = false;
    const done = (fn, arg) => { if (!settled) { settled = true; fn(arg); } };

    const hardTimeout = setTimeout(() => {
      try { conn.end(); } catch (_) { /* noop */ }
      const err = new Error('Timed out while running discovery on the server.');
      err.code = 'SCAN_TIMEOUT';
      done(reject, err);
    }, 45000);

    conn.on('ready', () => {
      conn.exec(DISCOVERY_SCRIPT, { pty: false }, (err, stream) => {
        if (err) {
          clearTimeout(hardTimeout);
          try { conn.end(); } catch (_) { /* noop */ }
          return done(reject, err);
        }
        let output = '';
        stream.on('data', (data) => { output += data.toString(); });
        stream.stderr.on('data', () => { /* tolerate per-command stderr */ });
        stream.on('close', () => {
          clearTimeout(hardTimeout);
          try { conn.end(); } catch (_) { /* noop */ }
          done(resolve, output);
        });
      });
    });

    conn.on('error', (err) => {
      clearTimeout(hardTimeout);
      done(reject, err);
    });

    const connectOptions = {
      host,
      port: port || 22,
      username,
      readyTimeout: 15000,
      keepaliveInterval: 5000,
    };
    if (privateKey) {
      connectOptions.privateKey = privateKey;
      if (passphrase) connectOptions.passphrase = passphrase;
    } else if (password) {
      connectOptions.password = password;
    }

    try {
      conn.connect(connectOptions);
    } catch (err) {
      clearTimeout(hardTimeout);
      done(reject, err);
    }
  });
}

function classifySshError(err) {
  const msg = (err && err.message) || '';
  if (/Encrypted private key detected|no passphrase given|bad passphrase|integrity check failed/i.test(msg)) {
    if (/bad passphrase|integrity check failed/i.test(msg)) {
      return { status: 401, body: { error: 'BAD_PASSPHRASE', message: 'The passphrase for this private key is incorrect.' } };
    }
    return { status: 401, body: { error: 'PASSPHRASE_REQUIRED', message: 'This private key is encrypted. A passphrase is required.' } };
  }
  if (/Cannot parse privateKey|Malformed|Unsupported key format|OpenSSH/i.test(msg) && /key/i.test(msg)) {
    return { status: 400, body: { error: 'BAD_KEY', message: 'The PEM key could not be parsed. Make sure it is a valid private key file.' } };
  }
  if (/All configured authentication methods failed/i.test(msg)) {
    return { status: 401, body: { error: 'AUTH_FAILED', message: 'Authentication failed. Check the username and key/password for this host.' } };
  }
  if (/ETIMEDOUT|Timed out while|timeout/i.test(msg) || err.code === 'SCAN_TIMEOUT') {
    return { status: 504, body: { error: 'TIMEOUT', message: 'Could not reach the host on port 22. Check the IP address and that the security group allows SSH.' } };
  }
  if (/ECONNREFUSED/i.test(msg)) {
    return { status: 502, body: { error: 'REFUSED', message: 'The host refused the SSH connection on this port.' } };
  }
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(msg)) {
    return { status: 400, body: { error: 'BAD_HOST', message: 'The host address could not be resolved.' } };
  }
  return { status: 500, body: { error: 'SSH_ERROR', message: msg || 'SSH connection failed.' } };
}

// POST /api/system/discover  (JWT protected)
// Body: { host, port?, username?, authMethod: 'key'|'password', pemKey?, passphrase?, password? }
router.post('/discover', auth, async (req, res) => {
  const { host, port, username, authMethod, pemKey, passphrase, password } = req.body || {};

  if (!host || !String(host).trim()) {
    return res.status(400).json({ error: 'MISSING_HOST', message: 'A host IP address or domain is required.' });
  }
  const useKey = authMethod !== 'password';
  if (useKey && !pemKey) {
    return res.status(400).json({ error: 'MISSING_KEY', message: 'A PEM private key is required for key-based authentication.' });
  }
  if (!useKey && !password) {
    return res.status(400).json({ error: 'MISSING_PASSWORD', message: 'A password is required for password authentication.' });
  }

  const started = Date.now();
  try {
    const rawOutput = await runDiscoveryOverSsh({
      host: String(host).trim(),
      port: port ? parseInt(port, 10) : 22,
      username: (username && String(username).trim()) || 'ubuntu',
      privateKey: useKey ? pemKey : undefined,
      passphrase: useKey ? (passphrase || undefined) : undefined,
      password: useKey ? undefined : password,
    });

    if (!rawOutput.includes('===SEC:END===')) {
      return res.status(502).json({
        error: 'INCOMPLETE_SCAN',
        message: 'Connected, but the discovery scan did not complete. The account may lack shell access.',
      });
    }

    const discovery = parseDiscovery(rawOutput);

    // Node-side DNS/CDN analysis in parallel for every domain found on the server.
    const edge = await Promise.all(
      discovery.domains.slice(0, 12).map((domain) =>
        analyzeDomain(domain).catch(() => ({
          domain,
          cname: null,
          addresses: [],
          cdn: null,
          resolves: false,
        }))
      )
    );
    discovery.edge = edge;

    const insights = generateInsights(discovery);
    const summary = summarizeInsights(insights);

    return res.json({
      connectedTo: { host: String(host).trim(), username: (username && String(username).trim()) || 'ubuntu' },
      scannedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      discovery,
      insights,
      summary,
    });
  } catch (err) {
    const mapped = classifySshError(err);
    return res.status(mapped.status).json(mapped.body);
  }
});

module.exports = router;
