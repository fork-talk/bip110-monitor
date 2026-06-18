#!/usr/bin/env node

import { writeFileSync } from 'node:fs';

const BTCNODES_SUMMARY = 'https://btcnodes.io/api/summary';
const BIP110_MONITOR = 'https://bip110monitor.com/api';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

const dir = new URL('./data/', import.meta.url).pathname;

console.log('Fetching node data from btcnodes.io...');
const nodeData = await fetchJSON(BTCNODES_SUMMARY);
const trimmed = {
  total_nodes: nodeData.total_nodes,
  snapshot: nodeData.snapshot,
  software_distribution: nodeData.software_distribution,
  top_clients: (nodeData.top_clients || []).slice(0, 15),
};
writeFileSync(dir + 'nodes.json', JSON.stringify(trimmed, null, 2) + '\n');
console.log(`  nodes.json: ${trimmed.total_nodes.toLocaleString()} nodes, snapshot ${new Date(trimmed.snapshot * 1000).toISOString()}`);

console.log('Fetching signaling data from bip110monitor.com...');
const signaling = await fetchJSON(BIP110_MONITOR);
writeFileSync(dir + 'signaling.json', JSON.stringify(signaling, null, 2) + '\n');
const totalSig = (signaling.periods || []).reduce((s, p) => s + p.signalingCount, 0) + signaling.signalingCount;
console.log(`  signaling.json: period ${signaling.periodNum}, ${signaling.signalingCount}/${signaling.totalBlocks} this period, ${totalSig} total`);

console.log('Done.');
