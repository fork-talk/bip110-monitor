const BTCNODES_SUMMARY = 'https://btcnodes.io/api/summary';
const BIP110_MONITOR = 'https://bip110monitor.com/api';

const SNAPSHOT_NODES = './data/nodes.json';
const SNAPSHOT_SIGNALING = './data/signaling.json';

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

export async function fetchSignaling() {
  try {
    const data = await fetchJSON(BIP110_MONITOR);
    return { data, fromSnapshot: false };
  } catch {
    const data = await fetchJSON(SNAPSHOT_SIGNALING);
    return { data, fromSnapshot: true };
  }
}
