// Insight engine — turns raw discovery data into actionable findings.
// Every finding is derived purely from what was scanned; nothing is hardcoded
// about any particular deployment. Each finding: { severity, category, title,
// detail, recommendation, fixCmd? }. Severity drives ordering in the UI.

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

// Ports that are routine to expose publicly; anything else public is flagged.
const COMMON_PUBLIC_PORTS = new Set([80, 443, 22]);
// Data-store ports that should essentially never face the public internet.
const SENSITIVE_PORTS = new Set([27017, 3306, 5432, 6379, 11211, 9200, 5984, 9042, 8086, 27018, 27019]);

function pushSorted(list) {
  return list.sort((a, b) => (SEV_ORDER[a.severity] - SEV_ORDER[b.severity]) || a.title.localeCompare(b.title));
}

function generateInsights(d) {
  const findings = [];
  const add = (f) => findings.push(f);

  // ---- Memory / swap -----------------------------------------------------
  if (d.memory.totalMb) {
    if (d.memory.usagePct != null && d.memory.usagePct >= 90) {
      add({
        severity: 'high',
        category: 'Performance',
        title: 'Memory nearly exhausted',
        detail: `RAM is at ${d.memory.usagePct}% (${d.memory.usedMb} MB of ${d.memory.totalMb} MB used).`,
        recommendation: 'Investigate the top memory consumers below, or resize the instance. Sustained high memory risks the OOM killer terminating services.',
      });
    }
    const lowRam = d.memory.totalMb <= 1200;
    if ((d.memory.swapTotalMb || 0) === 0 && lowRam) {
      add({
        severity: 'medium',
        category: 'Reliability',
        title: 'No swap on a low-memory host',
        detail: `This host has ${d.memory.totalMb} MB RAM and no swap configured. Small instances can hit the OOM killer under load spikes.`,
        recommendation: 'Add a swap file sized ~1.5× RAM as a safety margin against memory spikes.',
        fixCmd: 'sudo fallocate -l 1.5G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile && echo "/swapfile swap swap defaults 0 0" | sudo tee -a /etc/fstab',
      });
    }
  }

  // ---- CPU / load --------------------------------------------------------
  if (d.cpu.load1 != null && d.cpu.cores) {
    const ratio = d.cpu.load1 / d.cpu.cores;
    if (ratio >= 1.5) {
      add({
        severity: 'high',
        category: 'Performance',
        title: 'CPU load exceeds capacity',
        detail: `1-minute load average is ${d.cpu.load1} across ${d.cpu.cores} core(s) (${Math.round(ratio * 100)}% of capacity).`,
        recommendation: 'Processes are queueing for CPU. Identify the busiest process below, or scale up cores.',
      });
    }
  }

  // ---- Disk --------------------------------------------------------------
  for (const disk of d.disks) {
    if (disk.usePct >= 90) {
      add({
        severity: disk.usePct >= 95 ? 'critical' : 'high',
        category: 'Reliability',
        title: `Disk almost full: ${disk.mount}`,
        detail: `${disk.mount} is ${disk.usePct}% full (${disk.availMb} MB free of ${disk.sizeMb} MB).`,
        recommendation: 'Free space or expand the volume. A full disk will crash writes for databases, logs, and app state.',
      });
    }
  }

  // ---- Exposed sensitive ports ------------------------------------------
  for (const p of d.ports) {
    if (p.public && SENSITIVE_PORTS.has(p.port)) {
      add({
        severity: 'critical',
        category: 'Security',
        title: `Data store exposed publicly on :${p.port}`,
        detail: `${p.process || 'A service'} is listening on ${p.address}:${p.port}, which is reachable from any network interface.`,
        recommendation: 'Bind this service to 127.0.0.1, or restrict it with a security group / firewall. Public database ports are a common breach vector.',
      });
    }
  }
  // Non-standard public ports (informational grouping)
  const otherPublic = d.ports.filter((p) => p.public && p.proto === 'tcp' && !COMMON_PUBLIC_PORTS.has(p.port) && !SENSITIVE_PORTS.has(p.port));
  if (otherPublic.length) {
    add({
      severity: 'low',
      category: 'Security',
      title: `${otherPublic.length} non-standard port(s) exposed publicly`,
      detail: otherPublic.map((p) => `:${p.port} (${p.process || 'unknown'})`).join(', '),
      recommendation: 'Confirm each of these should be internet-facing. Close or firewall any that only need local/VPC access.',
    });
  }

  // ---- SSH hardening -----------------------------------------------------
  const sshd = d.security.sshd || {};
  if (sshd.permitRootLogin && /^yes/i.test(sshd.permitRootLogin)) {
    add({
      severity: 'high',
      category: 'Security',
      title: 'Root SSH login is permitted',
      detail: 'sshd_config has PermitRootLogin yes.',
      recommendation: 'Set "PermitRootLogin no" and use a sudo user. Direct root login removes an accountability and brute-force barrier.',
      fixCmd: "sudo sed -i 's/^#\\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config && sudo systemctl restart sshd",
    });
  }
  if (sshd.passwordAuthentication && /^yes/i.test(sshd.passwordAuthentication)) {
    add({
      severity: 'medium',
      category: 'Security',
      title: 'SSH password authentication enabled',
      detail: 'sshd_config has PasswordAuthentication yes.',
      recommendation: 'Prefer key-only auth ("PasswordAuthentication no") to eliminate password brute-forcing.',
    });
  }
  if (d.security.firewall === 'inactive') {
    add({
      severity: 'medium',
      category: 'Security',
      title: 'Host firewall inactive',
      detail: 'ufw reports inactive. Only the cloud security group (if any) is filtering traffic.',
      recommendation: 'Enable a host firewall as defense-in-depth, allowing only the ports you actually serve.',
    });
  }

  // ---- SSL certificates --------------------------------------------------
  for (const cert of d.ssl) {
    if (cert.daysLeft == null) continue;
    if (cert.daysLeft < 0) {
      add({
        severity: 'critical',
        category: 'Security',
        title: `SSL certificate expired: ${cert.domain}`,
        detail: `Certificate for ${cert.domain} expired ${Math.abs(cert.daysLeft)} day(s) ago.`,
        recommendation: 'Renew immediately — visitors are seeing browser security warnings.',
        fixCmd: 'sudo certbot renew --force-renewal',
      });
    } else if (cert.daysLeft <= 14) {
      add({
        severity: 'high',
        category: 'Security',
        title: `SSL certificate expiring soon: ${cert.domain}`,
        detail: `Certificate for ${cert.domain} expires in ${cert.daysLeft} day(s).`,
        recommendation: 'Confirm auto-renewal (certbot.timer) is active, or renew manually.',
        fixCmd: 'sudo certbot renew',
      });
    }
  }

  // ---- Failed services ---------------------------------------------------
  const failed = d.services.filter((s) => s.active === 'failed' || s.sub === 'failed');
  for (const s of failed) {
    add({
      severity: 'medium',
      category: 'Reliability',
      title: `Service failed: ${s.name}`,
      detail: `${s.name} is in a failed state${s.description ? ' — ' + s.description : ''}.`,
      recommendation: `Inspect logs with: journalctl -u ${s.unit} -n 50`,
    });
  }

  // ---- Idle / unused deployments ----------------------------------------
  // Enabled service units that are not running = installed but inactive.
  const inactiveEnabled = d.services.filter(
    (s) => s.enabled === 'enabled' && s.active !== 'active' && s.active !== 'failed'
  );
  if (inactiveEnabled.length) {
    add({
      severity: 'low',
      category: 'Cleanup',
      title: `${inactiveEnabled.length} enabled service(s) not running`,
      detail: inactiveEnabled.slice(0, 8).map((s) => s.name).join(', ') + (inactiveEnabled.length > 8 ? ', …' : ''),
      recommendation: 'These are set to start at boot but are currently stopped. Disable any you no longer need so they stop consuming boot time and attention.',
    });
  }

  // ---- Docker ------------------------------------------------------------
  if (d.docker.installed) {
    const stopped = d.docker.containers.filter((c) => c.state !== 'running');
    if (stopped.length) {
      add({
        severity: 'low',
        category: 'Cleanup',
        title: `${stopped.length} stopped Docker container(s)`,
        detail: stopped.map((c) => c.name).join(', '),
        recommendation: 'Remove containers you no longer need to reclaim disk and reduce clutter.',
        fixCmd: 'docker container prune -f',
      });
    }
    // Reclaimable docker space
    const df = d.docker.df || [];
    const reclaimable = df.reduce((sum, r) => {
      const m = (r.reclaimable || '').match(/([\d.]+)\s*([KMGT]?B)/i);
      if (!m) return sum;
      const mult = { B: 1, KB: 1e3, MB: 1e6, GB: 1e9, TB: 1e12 }[m[2].toUpperCase()] || 1;
      return sum + parseFloat(m[1]) * mult;
    }, 0);
    if (reclaimable > 2e9) {
      add({
        severity: 'low',
        category: 'Cost',
        title: `${(reclaimable / 1e9).toFixed(1)} GB reclaimable from Docker`,
        detail: 'Unused images, build cache, and volumes are occupying disk space.',
        recommendation: 'Prune to reclaim disk — this can defer or avoid a volume resize.',
        fixCmd: 'docker system prune -af --volumes',
      });
    }
  }

  // ---- Packages / patching ----------------------------------------------
  if (d.packages.upgradable && d.packages.upgradable > 0) {
    add({
      severity: d.packages.upgradable > 30 ? 'medium' : 'low',
      category: 'Security',
      title: `${d.packages.upgradable} package update(s) pending`,
      detail: `The package manager reports ${d.packages.upgradable} upgradable package(s).`,
      recommendation: 'Apply updates to pick up security patches.',
      fixCmd: 'sudo apt-get update && sudo apt-get upgrade -y',
    });
  }
  if (d.packages.rebootRequired) {
    add({
      severity: 'medium',
      category: 'Reliability',
      title: 'Reboot required',
      detail: 'A pending kernel or library update needs a reboot to take effect.',
      recommendation: 'Schedule a reboot during a maintenance window.',
    });
  }

  // ---- Heavy processes ---------------------------------------------------
  const heavy = d.processes.filter((p) => p.cpu >= 50 || p.mem >= 40);
  for (const p of heavy.slice(0, 3)) {
    add({
      severity: 'medium',
      category: 'Performance',
      title: `High resource process: ${p.command.split(/\s/)[0].split('/').pop()}`,
      detail: `pid ${p.pid} (${p.user}) is using ${p.cpu}% CPU and ${p.mem}% memory (${p.rssMb} MB RSS).`,
      recommendation: 'Verify this workload is expected. If it is a runaway or leaking process, restart or cap it (cgroups / container memory limits).',
    });
  }

  // ---- Databases co-located ---------------------------------------------
  if (d.databases.length && (d.memory.totalMb || 0) <= 2200) {
    add({
      severity: 'info',
      category: 'Cost',
      title: 'Database running on the compute host',
      detail: `Detected ${d.databases.map((x) => x.type).join(', ')} on a ${d.memory.totalMb} MB instance.`,
      recommendation: 'On small hosts, co-locating the database with the app competes for RAM. A managed database (or larger instance) improves reliability under load.',
    });
  }

  // ---- Positive note when clean -----------------------------------------
  if (findings.length === 0) {
    add({
      severity: 'info',
      category: 'Health',
      title: 'No issues detected',
      detail: 'Resource usage, exposed ports, SSH config, certificates, and services all look healthy.',
      recommendation: 'Keep monitoring — re-run the scan after deployments or config changes.',
    });
  }

  return pushSorted(findings);
}

// Compact scorecard the overview uses (counts by severity + category tallies).
function summarizeInsights(findings) {
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  const byCategory = {};
  for (const f of findings) {
    bySeverity[f.severity] = (bySeverity[f.severity] || 0) + 1;
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;
  }
  const actionable = findings.filter((f) => f.severity !== 'info').length;
  return { total: findings.length, actionable, bySeverity, byCategory };
}

module.exports = { generateInsights, summarizeInsights };
