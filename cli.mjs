#!/usr/bin/env node

const BTCNODES_SUMMARY = 'https://btcnodes.io/api/summary';
const MEMPOOL_BLOCKS = 'https://mempool.space/api/blocks';
const MEMPOOL_TIP = 'https://mempool.space/api/blocks/tip/height';
const BIT4 = 1 << 4;

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

  console.log('\n  BIP-110 SIGNALING');
  console.log(`  Yes: ${(bip110Yes.nodes || 0).toLocaleString()} (${(bip110Yes.percent || 0).toFixed(2)}%)`);
  console.log(`  No:  ${(bip110No.nodes || 0).toLocaleString()} (${(bip110No.percent || 0).toFixed(2)}%)`);

  console.log('\n  OP_RETURN POLICY');
  console.log(`  Legacy (83-byte): ${(opLegacy.nodes || 0).toLocaleString()} (${(opLegacy.percent || 0).toFixed(2)}%)`);
  console.log(`  New (100KB):      ${(opNew.nodes || 0).toLocaleString()} (${(opNew.percent || 0).toFixed(2)}%)`);
}

async function printBlockData() {
  const tipHeight = await fetchJSON(MEMPOOL_TIP);
  let blocks = [];
  let height = null;

  while (blocks.length < 150) {
    const url = height ? `${MEMPOOL_BLOCKS}/${height}` : MEMPOOL_BLOCKS;
    const batch = await fetchJSON(url);
    if (!batch.length) break;
    blocks.push(...batch);
    height = batch[batch.length - 1].height - 1;
  }
  blocks = blocks.slice(0, 150);

  const signaling = blocks.filter(b => (b.version & BIT4) !== 0).length;
  const pct = (signaling / blocks.length * 100).toFixed(2);

  console.log('\n  BLOCK SIGNALING (last 150 blocks)');
  console.log('  ' + hr());
  console.log(`  Tip height: ${tipHeight.toLocaleString()}`);
  console.log(`  Signaling bit 4: ${signaling}/${blocks.length} (${pct}%)`);
  console.log(`  Threshold: 1,109/2,016 (55%)`);

  const retargetStart = Math.floor(tipHeight / 2016) * 2016;
  const retargetEnd = retargetStart + 2015;
  const inPeriod = blocks.filter(b => b.height >= retargetStart);
  const sigInPeriod = inPeriod.filter(b => (b.version & BIT4) !== 0).length;

  console.log(`\n  CURRENT RETARGET PERIOD`);
  console.log(`  ${retargetStart.toLocaleString()} - ${retargetEnd.toLocaleString()}`);
  console.log(`  Blocks mined: ${(tipHeight - retargetStart + 1).toLocaleString()} / 2,016`);
  console.log(`  Signaling (sampled): ${sigInPeriod} / ${inPeriod.length}`);
}

const args = process.argv.slice(2);
const nodesOnly = args.includes('--nodes-only');
const blocksOnly = args.includes('--blocks-only');

try {
  if (!blocksOnly) await printNodeData();
  if (!nodesOnly) await printBlockData();
  console.log('');
} catch (err) {
  console.error('Error:', err.message);
  process.exit(1);
}
