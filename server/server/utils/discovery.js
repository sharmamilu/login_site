// Generic server discovery: one tolerant shell script + a section parser.
// Nothing here is predefined — every value shown in the UI is read from the
// connected server at scan time. Commands that fail (missing tool, no sudo)
// simply yield empty sections that the parser treats as "not present".

// NOTE: written to avoid `${` sequences so it can live in a JS template literal.
const DISCOVERY_SCRIPT = `
export LC_ALL=C
SUDO=""
if sudo -n true 2>/dev/null; then SUDO="sudo -n"; fi
echo "===SEC:SUDO==="
if [ -n "$SUDO" ]; then echo "yes"; else echo "no"; fi
echo "===SEC:OS==="
echo "HOSTNAME:$(hostname 2>/dev/null)"
echo "KERNEL:$(uname -r 2>/dev/null)"
echo "ARCH:$(uname -m 2>/dev/null)"
echo "OSNAME:$(. /etc/os-release 2>/dev/null && echo "$PRETTY_NAME")"
echo "UPTIME:$(uptime -p 2>/dev/null)"
echo "BOOTED:$(uptime -s 2>/dev/null)"
echo "VIRT:$(systemd-detect-virt 2>/dev/null)"
echo "CORES:$(nproc 2>/dev/null)"
echo "CPUMODEL:$(grep -m1 'model name' /proc/cpuinfo 2>/dev/null | cut -d: -f2-)"
echo "LOADAVG:$(cat /proc/loadavg 2>/dev/null)"
echo "PUBIP:$(curl -s --max-time 3 https://checkip.amazonaws.com 2>/dev/null)"
echo "===SEC:CPU==="
top -bn2 -d 0.7 2>/dev/null | grep -i 'cpu(s)' | tail -1
echo "===SEC:MEM==="
free -m 2>/dev/null
echo "===SEC:DISK==="
df -PBM 2>/dev/null | grep -Ev 'tmpfs|devtmpfs|overlay|squashfs|udev|efivarfs'
echo "===SEC:PORTS==="
($SUDO ss -ltnup 2>/dev/null || ss -ltnup 2>/dev/null || $SUDO netstat -ltnup 2>/dev/null || netstat -ltnup 2>/dev/null)
echo "===SEC:PROCS==="
ps axo pid,user:20,%cpu,%mem,rss,etime,args --sort=-%cpu 2>/dev/null | head -41
echo "--BYMEM--"
ps axo pid,user:20,%cpu,%mem,rss,etime,args --sort=-%mem 2>/dev/null | head -21
echo "===SEC:SERVICES==="
systemctl list-units --type=service --all --no-pager --no-legend --plain 2>/dev/null
echo "===SEC:UNITFILES==="
systemctl list-unit-files --type=service --no-pager --no-legend --plain 2>/dev/null
echo "===SEC:PACKAGES==="
if command -v dpkg >/dev/null 2>&1; then
  echo "MANAGER:apt"
  echo "COUNT:$(dpkg -l 2>/dev/null | grep -c '^ii')"
  echo "UPGRADABLE:$(timeout 5 apt-get -s upgrade 2>/dev/null | grep -c '^Inst ' || echo '0')"
elif command -v rpm >/dev/null 2>&1; then
  echo "MANAGER:rpm"
  echo "COUNT:$(rpm -qa 2>/dev/null | wc -l)"
elif command -v apk >/dev/null 2>&1; then
  echo "MANAGER:apk"
  echo "COUNT:$(apk info 2>/dev/null | wc -l)"
else
  echo "MANAGER:unknown"
fi
if [ -f /var/run/reboot-required ]; then echo "REBOOT:yes"; else echo "REBOOT:no"; fi
echo "===SEC:DOCKER==="
if command -v docker >/dev/null 2>&1; then
  DOCKER="docker"
  if ! docker info >/dev/null 2>&1; then
    if [ -n "$SUDO" ]; then DOCKER="$SUDO docker"; fi
  fi
  echo "VERSION:$($DOCKER version --format '{{.Server.Version}}' 2>/dev/null)"
  echo "--CONTAINERS--"
  $DOCKER ps -a --format '{{.Names}}|{{.Image}}|{{.State}}|{{.Status}}|{{.Ports}}' 2>/dev/null
  echo "--STATS--"
  timeout 5 $DOCKER stats --no-stream --format '{{.Name}}|{{.CPUPerc}}|{{.MemUsage}}|{{.MemPerc}}' 2>/dev/null
  echo "--IMAGES--"
  $DOCKER images --format '{{.Repository}}:{{.Tag}}|{{.Size}}|{{.CreatedSince}}' 2>/dev/null
  echo "--DF--"
  timeout 5 $DOCKER system df --format '{{.Type}}|{{.TotalCount}}|{{.Active}}|{{.Size}}|{{.Reclaimable}}' 2>/dev/null
else
  echo "VERSION:none"
fi
echo "===SEC:NGINX==="
if command -v nginx >/dev/null 2>&1; then
  echo "INSTALLED:yes"
  echo "VERSIONLINE:$(nginx -v 2>&1)"
  (timeout 5 $SUDO nginx -T 2>/dev/null || timeout 5 nginx -T 2>/dev/null) | sed 's/^[[:space:]]*//' | grep -E '^(server [{]|upstream |server [^;]*;|server_name |listen |proxy_pass |ssl_certificate |root |[}])'
else
  echo "INSTALLED:no"
fi
echo "===SEC:APACHE==="
if command -v apache2ctl >/dev/null 2>&1; then
  echo "INSTALLED:yes"
  apache2ctl -S 2>&1 | head -40
elif command -v httpd >/dev/null 2>&1; then
  echo "INSTALLED:yes"
  httpd -S 2>&1 | head -40
else
  echo "INSTALLED:no"
fi
echo "===SEC:SSL==="
for d in /etc/letsencrypt/live/*/; do
  if [ -d "$d" ]; then
    domain=$(basename "$d")
    end=$($SUDO openssl x509 -enddate -noout -in "$d/cert.pem" 2>/dev/null | cut -d= -f2)
    issuer=$($SUDO openssl x509 -issuer -noout -in "$d/cert.pem" 2>/dev/null | sed 's/^issuer=//')
    echo "CERT:$domain|$end|$issuer"
  fi
done
echo "===SEC:NETCONF==="
echo "--ADDRS--"
ip -o addr show 2>/dev/null | awk '{print $2"|"$3"|"$4}'
echo "--ROUTE--"
ip route show default 2>/dev/null
echo "--DNS--"
grep -i '^nameserver' /etc/resolv.conf 2>/dev/null
echo "===SEC:SECURITY==="
echo "--SSHD--"
grep -Ei '^[[:space:]]*(PermitRootLogin|PasswordAuthentication|Port)[[:space:]]' /etc/ssh/sshd_config 2>/dev/null
echo "--UFW--"
($SUDO ufw status 2>/dev/null | head -1) || echo "unavailable"
echo "--WHO--"
who 2>/dev/null
echo "===SEC:CRON==="
crontab -l 2>/dev/null | grep -Ev '^[[:space:]]*(#|$)' | head -20
echo "===SEC:END==="
`;

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

function splitSections(raw) {
  const sections = {};
  let current = null;
  for (const line of raw.split('\n')) {
    const marker = line.match(/^===SEC:([A-Z]+)===\s*$/);
    if (marker) {
      current = marker[1];
      sections[current] = [];
      continue;
    }
    if (current) sections[current].push(line.replace(/\r$/, ''));
  }
  return sections;
}

function splitSubsections(lines) {
  const subs = {};
  let current = '_';
  subs[current] = [];
  for (const line of lines) {
    const marker = line.match(/^--([A-Z]+)--\s*$/);
    if (marker) {
      current = marker[1];
      subs[current] = [];
      continue;
    }
    subs[current].push(line);
  }
  return subs;
}

function kvLines(lines) {
  const map = {};
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx > 0) map[line.slice(0, idx)] = line.slice(idx + 1).trim();
  }
  return map;
}

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

// ---------------------------------------------------------------------------
// Section parsers
// ---------------------------------------------------------------------------

function parseOs(lines) {
  const kv = kvLines(lines);
  const load = (kv.LOADAVG || '').split(/\s+/);
  return {
    overview: {
      hostname: kv.HOSTNAME || null,
      os: kv.OSNAME || null,
      kernel: kv.KERNEL || null,
      arch: kv.ARCH || null,
      virtualization: kv.VIRT && kv.VIRT !== 'none' ? kv.VIRT : null,
      uptime: (kv.UPTIME || '').replace(/^up\s+/, '') || null,
      booted: kv.BOOTED || null,
      publicIp: kv.PUBIP || null,
      cpuModel: kv.CPUMODEL || null,
      cores: num(kv.CORES),
    },
    load: {
      load1: num(load[0]),
      load5: num(load[1]),
      load15: num(load[2]),
    },
  };
}

function parseCpuUsage(lines) {
  // "%Cpu(s):  5.9 us,  2.0 sy,  0.0 ni, 91.8 id, ..."
  for (const line of lines) {
    const idle = line.match(/([\d.]+)\s*(?:%?\s*)id\b/i);
    if (idle) return Math.max(0, Math.min(100, 100 - parseFloat(idle[1])));
  }
  return null;
}

function parseMem(lines) {
  const mem = { totalMb: null, usedMb: null, availableMb: null, usagePct: null, swapTotalMb: 0, swapUsedMb: 0 };
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (/^Mem:?$/i.test(parts[0])) {
      mem.totalMb = num(parts[1]);
      mem.usedMb = num(parts[2]);
      mem.availableMb = num(parts[6]) ?? num(parts[3]);
      if (mem.totalMb && mem.usedMb != null) {
        mem.usagePct = Math.round((mem.usedMb / mem.totalMb) * 1000) / 10;
      }
    } else if (/^Swap:?$/i.test(parts[0])) {
      mem.swapTotalMb = num(parts[1]) || 0;
      mem.swapUsedMb = num(parts[2]) || 0;
    }
  }
  return mem;
}

function parseDisks(lines) {
  const disks = [];
  for (const line of lines) {
    const m = line.trim().match(/^(\S+)\s+(\d+)M\s+(\d+)M\s+(\d+)M\s+(\d+)%\s+(\/.*)$/);
    if (m) {
      disks.push({
        filesystem: m[1],
        sizeMb: parseInt(m[2], 10),
        usedMb: parseInt(m[3], 10),
        availMb: parseInt(m[4], 10),
        usePct: parseInt(m[5], 10),
        mount: m[6],
      });
    }
  }
  return disks;
}

function parsePorts(lines) {
  const ports = [];
  const seen = new Set();
  for (const line of lines) {
    if (!/LISTEN|UNCONN/i.test(line)) continue;
    const proto = /^udp/i.test(line.trim()) ? 'udp' : 'tcp';
    // local address:port — first token that looks like addr:port after the state columns
    const addrMatch = line.match(/([\d.]+|\*|\[[0-9a-fA-F:*]*\]|[0-9a-fA-F:]*::[0-9a-fA-F:]*):(\d+)\s/);
    if (!addrMatch) continue;
    let address = addrMatch[1].replace(/^\[|\]$/g, '');
    const port = parseInt(addrMatch[2], 10);
    // process: ss format users:(("name",pid=N,...)) or netstat "pid/name"
    let process = null;
    let pid = null;
    const ssProc = line.match(/users:\(\("([^"]+)",pid=(\d+)/);
    const nsProc = line.match(/(\d+)\/([\w.-]+)/);
    if (ssProc) {
      process = ssProc[1];
      pid = parseInt(ssProc[2], 10);
    } else if (nsProc) {
      pid = parseInt(nsProc[1], 10);
      process = nsProc[2];
    }
    const isPublic = address === '0.0.0.0' || address === '*' || address === '::' || address === '';
    const key = proto + ':' + address + ':' + port + ':' + (process || '');
    if (seen.has(key)) continue;
    seen.add(key);
    ports.push({ proto, address: address || '::', port, process, pid, public: isPublic });
  }
  return ports.sort((a, b) => a.port - b.port);
}

function parseProcesses(lines) {
  const subs = splitSubsections(lines);
  const rows = [...(subs._ || []), ...(subs.BYMEM || [])];
  const procs = [];
  const seen = new Set();
  for (const line of rows) {
    const m = line.match(/^\s*(\d+)\s+(\S+)\s+([\d.]+)\s+([\d.]+)\s+(\d+)\s+(\S+)\s+(.+)$/);
    if (!m) continue;
    const pid = parseInt(m[1], 10);
    if (seen.has(pid)) continue;
    seen.add(pid);
    procs.push({
      pid,
      user: m[2],
      cpu: parseFloat(m[3]),
      mem: parseFloat(m[4]),
      rssMb: Math.round(parseInt(m[5], 10) / 1024),
      etime: m[6],
      command: m[7].slice(0, 160),
    });
  }
  return procs;
}

function parseServices(lines, unitFileLines) {
  const enabledMap = {};
  for (const line of unitFileLines || []) {
    const m = line.trim().match(/^(\S+\.service)\s+(\S+)/);
    if (m) enabledMap[m[1]] = m[2];
  }
  const services = [];
  for (const line of lines) {
    const clean = line.replace(/^[●○*\s]+/, '').trim();
    const m = clean.match(/^(\S+\.service)\s+(\S+)\s+(\S+)\s+(\S+)\s*(.*)$/);
    if (!m) continue;
    services.push({
      name: m[1].replace(/\.service$/, ''),
      unit: m[1],
      load: m[2],
      active: m[3],
      sub: m[4],
      description: m[5] || '',
      enabled: enabledMap[m[1]] || null,
    });
  }
  return services;
}

function parsePackages(lines) {
  const kv = kvLines(lines);
  return {
    manager: kv.MANAGER || 'unknown',
    count: num(kv.COUNT),
    upgradable: num(kv.UPGRADABLE),
    rebootRequired: kv.REBOOT === 'yes',
  };
}

function parseDocker(lines) {
  const subs = splitSubsections(lines);
  const kv = kvLines(subs._ || []);
  const version = kv.VERSION && kv.VERSION !== 'none' ? kv.VERSION : null;
  const installed = version !== null || (subs.CONTAINERS || []).some((l) => l.includes('|'));

  const statsMap = {};
  for (const line of subs.STATS || []) {
    const p = line.split('|');
    if (p.length >= 4) statsMap[p[0]] = { cpu: p[1], mem: p[2], memPct: p[3] };
  }
  const containers = [];
  for (const line of subs.CONTAINERS || []) {
    const p = line.split('|');
    if (p.length < 4) continue;
    containers.push({
      name: p[0],
      image: p[1],
      state: p[2].toLowerCase(),
      status: p[3],
      ports: p[4] || '',
      stats: statsMap[p[0]] || null,
    });
  }
  const images = [];
  for (const line of subs.IMAGES || []) {
    const p = line.split('|');
    if (p.length >= 2) images.push({ name: p[0], size: p[1], created: p[2] || '' });
  }
  const df = [];
  for (const line of subs.DF || []) {
    const p = line.split('|');
    if (p.length >= 4) {
      df.push({ type: p[0], count: p[1], active: p[2], size: p[3], reclaimable: p[4] || '' });
    }
  }
  return { installed: installed || version !== null, version, containers, images, df };
}

function parseNginx(lines) {
  const kv = kvLines(lines.filter((l) => l.startsWith('INSTALLED:') || l.startsWith('VERSIONLINE:')));
  const installed = kv.INSTALLED === 'yes';
  const version = (kv.VERSIONLINE || '').replace(/^nginx version:\s*/i, '') || null;
  const sites = [];
  const upstreams = {};
  let block = null; // 'server' | 'upstream'
  let site = null;
  let upstreamName = null;
  for (const raw of lines) {
    const line = raw.trim().replace(/;$/, '');
    if (/^server\s*\{/.test(line)) {
      block = 'server';
      site = { serverNames: [], listens: [], proxyPass: [], root: null, sslCerts: [] };
      sites.push(site);
      continue;
    }
    if (/^upstream\s+/.test(line)) {
      block = 'upstream';
      upstreamName = line.replace(/^upstream\s+/, '').replace(/\s*\{.*/, '');
      upstreams[upstreamName] = [];
      continue;
    }
    if (line === '}') {
      block = null;
      continue;
    }
    if (block === 'upstream' && /^server\s+\S+/.test(line)) {
      upstreams[upstreamName].push(line.replace(/^server\s+/, '').split(/\s+/)[0]);
      continue;
    }
    if (block === 'server' && site) {
      if (line.startsWith('server_name ')) {
        site.serverNames.push(...line.replace('server_name ', '').split(/\s+/).filter(Boolean));
      } else if (line.startsWith('listen ')) {
        site.listens.push(line.replace('listen ', ''));
      } else if (line.startsWith('proxy_pass ')) {
        site.proxyPass.push(line.replace('proxy_pass ', ''));
      } else if (line.startsWith('root ') && !site.root) {
        site.root = line.replace('root ', '');
      } else if (line.startsWith('ssl_certificate ')) {
        site.sslCerts.push(line.replace('ssl_certificate ', ''));
      }
    }
  }
  // resolve proxy_pass through upstream blocks
  for (const s of sites) {
    s.upstreamTargets = [];
    for (const pp of s.proxyPass) {
      const target = pp.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const name = target.split(':')[0];
      if (upstreams[name]) s.upstreamTargets.push(...upstreams[name]);
      else s.upstreamTargets.push(target);
    }
    s.ssl = s.listens.some((l) => l.includes('443') || l.includes('ssl')) || s.sslCerts.length > 0;
  }
  return { installed, version, sites: sites.filter((s) => s.serverNames.length || s.listens.length || s.proxyPass.length), upstreams };
}

function parseApache(lines) {
  const installed = lines.some((l) => l.startsWith('INSTALLED:yes'));
  const vhosts = [];
  for (const line of lines) {
    const m = line.match(/port\s+(\d+)\s+namevhost\s+(\S+)/i);
    if (m) vhosts.push({ port: parseInt(m[1], 10), domain: m[2] });
  }
  return { installed, vhosts };
}

function parseSsl(lines) {
  const certs = [];
  for (const line of lines) {
    if (!line.startsWith('CERT:')) continue;
    const [domain, notAfter, issuer] = line.slice(5).split('|');
    let daysLeft = null;
    const exp = notAfter ? new Date(notAfter) : null;
    if (exp && !isNaN(exp)) daysLeft = Math.floor((exp - Date.now()) / 86400000);
    certs.push({ domain, expires: notAfter || null, issuer: issuer || null, daysLeft });
  }
  return certs;
}

function parseNetconf(lines) {
  const subs = splitSubsections(lines);
  const interfaces = [];
  for (const line of subs.ADDRS || []) {
    const p = line.split('|');
    if (p.length >= 3 && p[1] === 'inet') interfaces.push({ name: p[0], address: p[2] });
  }
  return {
    interfaces,
    defaultRoute: (subs.ROUTE || []).join(' ').trim() || null,
    dns: (subs.DNS || []).map((l) => l.replace(/^nameserver\s+/i, '').trim()).filter(Boolean),
  };
}

function parseSecurity(lines) {
  const subs = splitSubsections(lines);
  const sshd = {};
  for (const line of subs.SSHD || []) {
    const m = line.trim().match(/^(\w+)\s+(.+)$/);
    if (m) sshd[m[1].toLowerCase()] = m[2].trim();
  }
  const ufwLine = (subs.UFW || []).join(' ').trim();
  let firewall = 'unknown';
  if (/active/i.test(ufwLine) && !/inactive/i.test(ufwLine)) firewall = 'active';
  else if (/inactive/i.test(ufwLine)) firewall = 'inactive';
  const sessions = (subs.WHO || []).map((l) => l.trim()).filter(Boolean);
  return {
    sshd: {
      permitRootLogin: sshd.permitrootlogin || null,
      passwordAuthentication: sshd.passwordauthentication || null,
      port: sshd.port || null,
    },
    firewall,
    sessions,
  };
}

// ---------------------------------------------------------------------------
// Derived detection (from discovered data only)
// ---------------------------------------------------------------------------

const DB_ENGINES = [
  { pattern: /mongod/i, type: 'MongoDB' },
  { pattern: /mysqld|mariadb/i, type: 'MySQL/MariaDB' },
  { pattern: /postgres/i, type: 'PostgreSQL' },
  { pattern: /redis-server|redis(?![\w-])/i, type: 'Redis' },
  { pattern: /memcached/i, type: 'Memcached' },
  { pattern: /elasticsearch/i, type: 'Elasticsearch' },
  { pattern: /clickhouse/i, type: 'ClickHouse' },
  { pattern: /couchdb/i, type: 'CouchDB' },
  { pattern: /cassandra/i, type: 'Cassandra' },
  { pattern: /influxd/i, type: 'InfluxDB' },
];

function detectDatabases({ ports, processes, docker }) {
  // Group by engine type; a single engine may be seen through several signals
  // (a listening port, a process, a container). We merge those into one entry
  // and keep the strongest evidence, rather than counting the same store twice.
  const byType = new Map();
  const record = (type, via, detail, port) => {
    if (!byType.has(type)) byType.set(type, { type, vias: new Set(), details: [], port: null });
    const entry = byType.get(type);
    entry.vias.add(via);
    if (!entry.details.includes(detail)) entry.details.push(detail);
    if (port != null && entry.port == null) entry.port = port;
  };

  for (const p of ports) {
    if (!p.process) continue;
    for (const db of DB_ENGINES) {
      if (db.pattern.test(p.process)) record(db.type, 'port', p.process + ' listening on :' + p.port, p.port);
    }
  }
  for (const proc of processes) {
    const bin = proc.command.split(/\s/)[0];
    for (const db of DB_ENGINES) {
      if (db.pattern.test(bin)) record(db.type, 'process', bin.split('/').pop() + ' (pid ' + proc.pid + ')');
    }
  }
  for (const c of docker.containers || []) {
    for (const db of DB_ENGINES) {
      if (db.pattern.test(c.image) || db.pattern.test(c.name)) {
        record(db.type, 'container', c.name + ' [' + c.image + '] — ' + c.state);
      }
    }
  }

  return [...byType.values()].map((e) => ({
    type: e.type,
    via: [...e.vias].join(' + '),
    detail: e.details.join(' · '),
    port: e.port,
  }));
}

function collectDomains({ nginx, apache, ssl }) {
  const domains = new Set();
  const valid = (d) =>
    d && d.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(d) && d !== '_' && !d.startsWith('*') && !/localhost/i.test(d);
  for (const site of nginx.sites || []) for (const n of site.serverNames) if (valid(n)) domains.add(n);
  for (const v of apache.vhosts || []) if (valid(v.domain)) domains.add(v.domain);
  for (const c of ssl || []) if (valid(c.domain)) domains.add(c.domain);
  return [...domains];
}

// ---------------------------------------------------------------------------

function parseDiscovery(raw) {
  const sec = splitSections(raw);
  const { overview, load } = parseOs(sec.OS || []);
  const cpuUsage = parseCpuUsage(sec.CPU || []);
  const memory = parseMem(sec.MEM || []);
  const disks = parseDisks(sec.DISK || []);
  const ports = parsePorts(sec.PORTS || []);
  const processes = parseProcesses(sec.PROCS || []);
  const services = parseServices(sec.SERVICES || [], sec.UNITFILES || []);
  const packages = parsePackages(sec.PACKAGES || []);
  const docker = parseDocker(sec.DOCKER || []);
  const nginx = parseNginx(sec.NGINX || []);
  const apache = parseApache(sec.APACHE || []);
  const ssl = parseSsl(sec.SSL || []);
  const network = parseNetconf(sec.NETCONF || []);
  const security = parseSecurity(sec.SECURITY || []);
  const cron = (sec.CRON || []).map((l) => l.trim()).filter(Boolean);
  const hasSudo = (sec.SUDO || []).join('').includes('yes');

  return {
    overview,
    hasSudo,
    cpu: { usagePct: cpuUsage, ...load, cores: overview.cores },
    memory,
    disks,
    ports,
    processes,
    services,
    packages,
    docker,
    web: { nginx, apache },
    ssl,
    network,
    security,
    cron,
    databases: detectDatabases({ ports, processes, docker }),
    domains: collectDomains({ nginx, apache, ssl }),
  };
}

module.exports = { DISCOVERY_SCRIPT, parseDiscovery };
