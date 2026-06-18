import { fetchNodeSummary, fetchSignaling } from './api.mjs';
import { getTimeline } from './timeline.mjs';
import {
  renderSummary,
  renderImplementations,
  renderBip110Bar,
  renderOpReturnBar,
  renderSignaling,
  renderTimeline,
  renderRetarget,
  renderError,
  renderLastUpdated,
  renderSnapshotNotice,
} from './render.mjs';

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

async function loadSignalingData() {
  try {
    const { data, fromSnapshot } = await fetchSignaling();

    renderSignaling(data);

    const timeline = getTimeline(data.tip);
    renderTimeline(timeline, data.tip);
    renderRetarget(data);

    if (fromSnapshot) {
      renderSnapshotNotice('signaling-section');
    }
  } catch (err) {
    renderError('signaling-section', 'Failed to load signaling data: ' + err.message);
  }
}

async function init() {
  await Promise.all([loadNodeData(), loadSignalingData()]);
  renderLastUpdated();
}

init();
