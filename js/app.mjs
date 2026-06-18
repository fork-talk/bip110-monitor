import { fetchNodeSummary, fetchBlockRange, fetchTipHeight } from './api.mjs';
import { getTimeline, getRetargetInfo } from './timeline.mjs';
import {
  renderSummary,
  renderImplementations,
  renderBip110Bar,
  renderOpReturnBar,
  renderBlocks,
  renderTimeline,
  renderRetarget,
  renderError,
  renderLastUpdated,
  renderSnapshotNotice,
} from './render.mjs';

const BIT4 = 1 << 4;

async function loadNodeData() {
  try {
    const data = await fetchNodeSummary();
    renderSummary(data);
    renderImplementations(data);
    renderBip110Bar(data);
    renderOpReturnBar(data);
    if (data.fromSnapshot) {
      renderSnapshotNotice('summary', data.snapshot);
    }
  } catch (err) {
    renderError('summary', 'Failed to load node data: ' + err.message);
  }
}

async function loadBlockData() {
  try {
    let tipHeight;
    try {
      tipHeight = await fetchTipHeight();
    } catch {
      tipHeight = null;
    }

    const { blocks, fromSnapshot } = await fetchBlockRange(150);

    if (!tipHeight && blocks.length) {
      tipHeight = blocks[0].height;
    }

    renderBlocks(blocks);

    if (tipHeight) {
      const timeline = getTimeline(tipHeight);
      renderTimeline(timeline, tipHeight);

      const retarget = getRetargetInfo(tipHeight);
      const signalingInPeriod = blocks
        .filter(b => b.height >= retarget.periodStart && b.height <= retarget.periodEnd)
        .filter(b => (b.version & BIT4) !== 0)
        .length;
      renderRetarget(retarget, signalingInPeriod);
    }

    if (fromSnapshot) {
      renderSnapshotNotice('blocks-section');
    }
  } catch (err) {
    renderError('blocks-section', 'Failed to load block data: ' + err.message);
  }
}

async function init() {
  await Promise.all([loadNodeData(), loadBlockData()]);
  renderLastUpdated();
}

init();
