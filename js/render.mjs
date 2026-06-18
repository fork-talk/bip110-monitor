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

export function renderSignaling(data) {
  const container = $('signaling-current');
  const pct = data.pct || 0;
  const total = data.totalBlocks || 0;
  const signaling = data.signalingCount || 0;
  const remaining = data.periodEnd - data.tip;

  container.innerHTML = `
    <div class="grid">
      <div class="stat-box">
        <span class="stat-label">Period ${data.periodNum}</span>
        <span class="stat-value accent">${signaling} / ${formatNum(total)}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Signal Rate</span>
        <span class="stat-value accent">${formatPct(pct)}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Blocks Left</span>
        <span class="stat-value">${formatNum(remaining)}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Tip</span>
        <span class="stat-value">${formatNum(data.tip)}</span>
      </div>
    </div>
  `;

  const tbody = $('period-body');
  const periods = (data.periods || []).slice().reverse();
  const totalSignaling = periods.reduce((s, p) => s + p.signalingCount, 0) + signaling;

  tbody.innerHTML = [
    `<tr class="current-period">
      <td>${data.periodNum} (current)</td>
      <td>${signaling}</td>
      <td>${formatNum(total)}</td>
      <td>${formatPct(pct)}</td>
      <td class="bar-cell">
        <div class="mini-bar"><div class="mini-bar-fill signal-bar" style="width: ${Math.max(pct / 55 * 100, pct > 0 ? 2 : 0).toFixed(1)}%"></div></div>
      </td>
    </tr>`,
    ...periods.map(p => `
      <tr>
        <td>${p.periodNum}</td>
        <td>${p.signalingCount}</td>
        <td>${formatNum(p.totalBlocks)}</td>
        <td>${formatPct(p.pct)}</td>
        <td class="bar-cell">
          <div class="mini-bar"><div class="mini-bar-fill signal-bar" style="width: ${Math.max(p.pct / 55 * 100, p.signalingCount > 0 ? 2 : 0).toFixed(1)}%"></div></div>
        </td>
      </tr>
    `),
  ].join('');

  $('signaling-total').textContent = `Total signaling blocks across all tracked periods: ${totalSignaling}. Threshold for activation: 1,109 / 2,016 (55%) in any single period.`;
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

export function renderRetarget(data) {
  const el = $('retarget-info');
  el.classList.remove('loading');

  const signaling = data.signalingCount || 0;
  const total = data.totalBlocks || 0;
  const remaining = data.periodEnd - data.tip;
  const threshold = 1109;
  const needed = Math.max(0, threshold - signaling);
  const possible = signaling + remaining;
  const canReach = possible >= threshold;
  const pct = total > 0 ? (signaling / total * 100).toFixed(2) : '0';

  el.innerHTML = `
    <div class="grid" style="margin-bottom: 12px">
      <div class="stat-box">
        <span class="stat-label">Period</span>
        <span class="stat-value">${formatNum(data.periodStart)} - ${formatNum(data.periodEnd)}</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Progress</span>
        <span class="stat-value">${formatNum(total)} / 2,016</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Signaling</span>
        <span class="stat-value accent">${formatNum(signaling)} (${pct}%)</span>
      </div>
      <div class="stat-box">
        <span class="stat-label">Still Needed</span>
        <span class="stat-value">${needed > 0 ? formatNum(needed) : 'Threshold met!'}</span>
      </div>
    </div>
    <p class="note">
      ${canReach
        ? `Threshold of ${formatNum(threshold)} (55%) is still reachable this period.`
        : `Threshold of ${formatNum(threshold)} (55%) is no longer reachable this period.`
      }
      ${formatNum(remaining)} blocks remaining.
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
