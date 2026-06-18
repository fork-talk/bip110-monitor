#!/usr/bin/env node

import { writeFileSync } from 'node:fs';

const BTCNODES_SUMMARY = 'https://btcnodes.io/api/summary';
const MEMPOOL_BLOCKS = 'https://mempool.space/api/blocks';

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

console.log('Fetching blocks from mempool.space...');
const blocks = await fetchJSON(MEMPOOL_BLOCKS);
const slim = blocks.map(b => ({ height: b.height, version: b.version, timestamp: b.timestamp }));
writeFileSync(dir + 'blocks.json', JSON.stringify(slim, null, 2) + '\n');
console.log(`  blocks.json: ${slim.length} blocks, tip ${slim[0].height.toLocaleString()}`);

console.log('Done.');
