const BTCNODES_SUMMARY = 'https://btcnodes.io/api/summary';
const MEMPOOL_BLOCKS = 'https://mempool.space/api/blocks';
const MEMPOOL_TIP = 'https://mempool.space/api/blocks/tip/height';

const SNAPSHOT_NODES = './data/nodes.json';
const SNAPSHOT_BLOCKS = './data/blocks.json';

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

function parseNodeData(data) {
  const sd = data.software_distribution || {};
  const impls = sd.implementations || [];
  const bip110 = sd.bip110_signal || [];
  const opReturn = sd.op_return_policy || [];

  const bip110Yes = bip110.find(s => s.id === 'bip110_signaling') || {};
  const bip110No = bip110.find(s => s.id === 'non_bip110') || {};
  const opLegacy = opReturn.find(s => s.id === 'rest_of_nodes_relay') || {};
  const opNew = opReturn.find(s => s.id === 'uncapped_data') || {};

  return {
    totalNodes: data.total_nodes,
    snapshot: data.snapshot,
    fromSnapshot: !!data._fromSnapshot,
    implementations: impls,
    knots: impls.find(i => i.key === 'bitcoin-knots') || { nodes: 0, percent: 0 },
    core: impls.find(i => i.key === 'bitcoin-core') || { nodes: 0, percent: 0 },
    bip110: { yes: bip110Yes, no: bip110No },
    opReturn: { legacy: opLegacy, new: opNew },
    categories: sd.categories || {},
    topClients: data.top_clients || [],
  };
}

export async function fetchNodeSummary() {
  try {
    const data = await fetchJSON(BTCNODES_SUMMARY);
    return parseNodeData(data);
  } catch {
    const data = await fetchJSON(SNAPSHOT_NODES);
    data._fromSnapshot = true;
    return parseNodeData(data);
  }
}

export async function fetchBlocks(startHeight) {
  const url = startHeight
    ? `${MEMPOOL_BLOCKS}/${startHeight}`
    : MEMPOOL_BLOCKS;
  return fetchJSON(url);
}

export async function fetchTipHeight() {
  return fetchJSON(MEMPOOL_TIP);
}

export async function fetchBlockRange(count = 150) {
  try {
    const blocks = [];
    let height = null;

    while (blocks.length < count) {
      const batch = await fetchBlocks(height);
      if (!batch.length) break;
      blocks.push(...batch);
      height = batch[batch.length - 1].height - 1;
    }

    return { blocks: blocks.slice(0, count), fromSnapshot: false };
  } catch {
    const blocks = await fetchJSON(SNAPSHOT_BLOCKS);
    return { blocks, fromSnapshot: true };
  }
}
