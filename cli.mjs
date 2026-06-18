#!/usr/bin/env node

const BTCNODES_SUMMARY = 'https://btcnodes.io/api/summary';
const BIP110_MONITOR = 'https://bip110monitor.com/api';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

function pad(str, len, align = 'left') {
  str = String(str);
  return align === 'right' ? str.padStart(len) : str.padEnd(len);
}

function hr(len = 60) {
  return '-'.repeat(len);
}

async function printNodeData() {
  const data = await fetchJSON(BTCNODES_SUMMARY);
  const sd = data.software_distribution || {};
  const impls = sd.implementations || [];
  const bip110 = sd.bip110_signal || [];
  const opReturn = sd.op_return_policy || [];

  const bip110Yes = bip110.find(s => s.id === 'bip110_signaling') || {};
  const bip110No = bip110.find(s => s.id === 'non_bip110') || {};
  const opLegacy = opReturn.find(s => s.id === 'rest_of_nodes_relay') || {};
  const opNew = opReturn.find(s => s.id === 'uncapped_data') || {};

  console.log('\n  BIP-110 ADOPTION MONITOR');
  console.log('  ' + hr());
  console.log(`  Total nodes: ${data.total_nodes.toLocaleString()}`);
  console.log(`  Source: btcnodes.io | ${new Date().toISOString()}`);
  console.log('  ' + hr());

  console.log('\n  IMPLEMENTATIONS');
  console.log('  ' + pad('Name', 22) + pad('Nodes', 8, 'right') + pad('%', 10, 'right'));
  console.log('  ' + hr(40));
  for (const i of impls.filter(i => i.nodes > 0)) {
    console.log('  ' + pad(i.label, 22) + pad(i.nodes.toLocaleString(), 8, 'right') + pad(i.percent.toFixed(2) + '%', 10, 'right'));
  }

  console.log('\n  BIP-110 NODE SIGNALING');
  console.log(`  Yes: ${(bip110Yes.nodes || 0).toLocaleString()} (${(bip110Yes.percent || 0).toFixed(2)}%)`);
  console.log(`  No:  ${(bip110No.nodes || 0).toLocaleString()} (${(bip110No.percent || 0).toFixed(2)}%)`);

  console.log('\n  OP_RETURN POLICY');
  console.log(`  Legacy (83-byte): ${(opLegacy.nodes || 0).toLocaleString()} (${(opLegacy.percent || 0).toFixed(2)}%)`);
  console.log(`  New (100KB):      ${(opNew.nodes || 0).toLocaleString()} (${(opNew.percent || 0).toFixed(2)}%)`);
}

async function printSignalingData() {
  const data = await fetchJSON(BIP110_MONITOR);

  const remaining = data.periodEnd - data.tip;
  const periods = data.periods || [];
  const totalSig = periods.reduce((s, p) => s + p.signalingCount, 0) + data.signalingCount;

  console.log('\n  BLOCK SIGNALING (bip110monitor.com)');
  console.log('  ' + hr());
  console.log(`  Tip: ${data.tip.toLocaleString()} | Period: ${data.periodNum}`);
  console.log(`  This period: ${data.signalingCount}/${data.totalBlocks} (${data.pct.toFixed(2)}%)`);
  console.log(`  Blocks remaining: ${remaining.toLocaleString()}`);
  console.log(`  Threshold: 1,109/2,016 (55%)`);

  console.log('\n  PERIOD HISTORY');
  console.log('  ' + pad('Period', 10) + pad('Signal', 10, 'right') + pad('Total', 10, 'right') + pad('%', 10, 'right'));
  console.log('  ' + hr(40));
  console.log('  ' + pad(`${data.periodNum}*`, 10) + pad(String(data.signalingCount), 10, 'right') + pad(String(data.totalBlocks), 10, 'right') + pad(data.pct.toFixed(2) + '%', 10, 'right'));
  for (const p of [...periods].reverse()) {
    console.log('  ' + pad(String(p.periodNum), 10) + pad(String(p.signalingCount), 10, 'right') + pad(String(p.totalBlocks), 10, 'right') + pad(p.pct.toFixed(2) + '%', 10, 'right'));
  }
  console.log(`\n  Total signaling blocks: ${totalSig}`);
  console.log('  * = current period');
}

const args = process.argv.slice(2);
const nodesOnly = args.includes('--nodes-only');
const blocksOnly = args.includes('--blocks-only');

try {
  if (!blocksOnly) await printNodeData();
  if (!nodesOnly) await printSignalingData();
  console.log('');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
