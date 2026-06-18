function $(id) { return document.getElementById(id); }

function formatNum(n) {
  return n != null ? n.toLocaleString() : '-';
}

function formatPct(n) {
  return n != null ? n.toFixed(2) + '%' : '-';
}

function formatDate(d) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function renderSummary(data) {
  const setVal = (id, value, cls) => {
    const box = $(id);
    const el = box.querySelector('.stat-value');
    el.textContent = value;
    el.classList.remove('loading');
    if (cls) el.classList.add(cls);
  };

  setVal('stat-total', formatNum(data.totalNodes));
  setVal('stat-knots', `${formatNum(data.knots.nodes)} (${formatPct(data.knots.percent)})`, 'green');
  setVal('stat-bip110', `${formatNum(data.bip110.yes.nodes)} (${formatPct(data.bip110.yes.percent)})`, 'accent');
  setVal('stat-legacy', `${formatNum(data.opReturn.legacy.nodes)} (${formatPct(data.opReturn.legacy.percent)})`, 'blue');
}

export function renderImplementations(data) {
  const tbody = $('impl-body');
  const maxNodes = Math.max(...data.implementations.map(i => i.nodes));

  tbody.innerHTML = data.implementations
    .filter(i => i.nodes > 0)
    .map(i => `
      <tr>
        <td>${i.label}</td>
        <td>${formatNum(i.nodes)}</td>
        <td>${formatPct(i.percent)}</td>
        <td class="bar-cell">
          <div class="mini-bar">
            <div class="mini-bar-fill" style="width: ${(i.nodes / maxNodes * 100).toFixed(1)}%"></div>
          </div>
        </td>
      </tr>
    `).join('');
}

export function renderBip110Bar(data) {
  const pct = data.bip110.yes.percent || 0;
  $('bip110-bar').querySelector('.bar-fill').style.width = pct + '%';
  $('bip110-bar').querySelector('.bar-fill').classList.remove('loading');
  $('bip110-yes').textContent = `${formatNum(data.bip110.yes.nodes)} signaling (${formatPct(pct)})`;
  $('bip110-no').textContent = `${formatNum(data.bip110.no.nodes)} not signaling`;
}

export function renderOpReturnBar(data) {
  const legacyPct = data.opReturn.legacy.percent || 0;
  $('opreturn-bar').querySelector('.bar-fill').style.width = legacyPct + '%';
  $('opreturn-bar').querySelector('.bar-fill').classList.remove('loading');
  $('opreturn-legacy').textContent = `${formatNum(data.opReturn.legacy.nodes)} legacy 83-byte (${formatPct(legacyPct)})`;
  $('opreturn-new').textContent = `${formatNum(data.opReturn.new.nodes)} new 100KB (${formatPct(data.opReturn.new.percent)})`;
}

export function renderBlocks(blocks) {
  const grid = $('block-grid');
  const BIT4 = 1 << 4;

  let signaling = 0;
  const total = blocks.length;

  const els = blocks.map(b => {
    const signals = (b.version & BIT4) !== 0;
    if (signals) signaling++;
    const cls = signals ? 'signal' : 'no-signal';
    return `<span class="block ${cls}" title="#${b.height} - ${signals ? 'SIGNALING' : 'no signal'} (0x${b.version.toString(16)})"></span>`;
  });

  grid.innerHTML = els.join('');

  const stats = $('block-stats');
  const pct = total > 0 ? (signaling / total * 100).toFixed(2) : '0';
  stats.innerHTML = `
    <strong>${signaling}/${total}</strong> blocks signaling bit 4 (${pct}%) in the last ${total} blocks.
    Threshold: 1,109/2,016 (55%).
  `;
}

export function renderTimeline(timeline, currentHeight) {
  const tbody = $('timeline-body');
  tbody.innerHTML = timeline.map(m => {
    const isPast = m.height && m.height <= currentHeight;
    const cls = isPast ? 'style="opacity: 0.5"' : '';
    const heightStr = m.height ? formatNum(m.height) : m.note || '-';
    return `
      <tr ${cls}>
        <td>${m.name}</td>
        <td>${heightStr}</td>
        <td>${formatDate(m.estDate)}</td>
      </tr>
    `;
  }).join('');

  $('timeline-note').textContent = `Estimates based on current height ${formatNum(currentHeight)} and 10-minute average block time.`;
}

export function renderRetarget(info, signalingInPeriod) {
  const el = $('retarget-info');
  el.classList.remove('loading');

  const pct = info.blocksInPeriod > 0
    ? (signalingInPeriod / info.blocksInPeriod * 100).toFixed(2)
    : '0';

  const needed = Math.max(0, info.threshold - signalingInPeriod);
  const possible = signalingInPeriod + info.blocksRemaining;
  const canReach = possible >= info.threshold;

  el.innerHTML = `
    <div class="grid" style="margin-bottom: 12px">
      <div class="stat-box">
        <span class="stat-label">Period</span>
        <span class="stat-value">${formatNum(info.periodStart)} - ${formatNum(info.periodEnd)}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Progress</span>
        <span class="stat-value">${formatNum(info.blocksInPeriod)} / 2,016</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Signaling</span>
        <span class="stat-value accent">${formatNum(signalingInPeriod)} (${pct}%)</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Still Needed</span>
        <span class="stat-value">${needed > 0 ? formatNum(needed) : 'Threshold met!'}</span>
      </div>
    </div>
    <p class="note">
      ${canReach
        ? `Threshold of ${info.threshold} (${info.thresholdPct}%) is still reachable this period.`
        : `Threshold of ${info.threshold} (${info.thresholdPct}%) is no longer reachable this period.`
      }
      ${info.blocksRemaining} blocks remaining.
    </p>
  `;
}

export function renderError(sectionId, msg) {
  const el = $(sectionId);
  if (el) {
    const err = document.createElement('p');
    err.className = 'error';
    err.textContent = msg;
    el.appendChild(err);
  }
}

export function renderSnapshotNotice(sectionId, snapshotTs) {
  const el = $(sectionId);
  if (!el) return;
  const note = document.createElement('p');
  note.className = 'snapshot-notice';
  const dateStr = snapshotTs
    ? new Date(snapshotTs * 1000).toLocaleString()
    : 'unknown';
  note.textContent = snapshotTs
    ? `Using cached snapshot from ${dateStr} (live API blocked by CORS)`
    : 'Using cached snapshot (live API unavailable)';
  el.appendChild(note);
}

export function renderLastUpdated() {
  $('last-updated').textContent = `Last updated: ${new Date().toLocaleString()}`;
}
