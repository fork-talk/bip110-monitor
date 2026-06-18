const MILESTONES = [
  { name: 'Signaling begins', height: null, timestamp: 1764547200, note: 'Timestamp-based' },
  { name: 'Mandatory signaling start', height: 961632 },
  { name: 'Mandatory signaling end', height: 963647 },
  { name: 'Lock-in (latest)', height: 963648 },
  { name: 'Activation (latest)', height: 965664 },
  { name: 'Auto-expiry', height: 1018080 },
];

const RETARGET_INTERVAL = 2016;
const ACTIVATION_THRESHOLD = 0.55;
const THRESHOLD_BLOCKS = Math.ceil(RETARGET_INTERVAL * ACTIVATION_THRESHOLD);

export function estimateDate(currentHeight, targetHeight, avgBlockTime = 600) {
  const blocksAhead = targetHeight - currentHeight;
  const secondsAhead = blocksAhead * avgBlockTime;
  return new Date(Date.now() + secondsAhead * 1000);
}

export function getTimeline(currentHeight) {
  return MILESTONES.map(m => {
    let estDate;
    if (m.timestamp) {
      estDate = new Date(m.timestamp * 1000);
    } else {
      estDate = estimateDate(currentHeight, m.height);
    }
    return { ...m, estDate };
  });
}

export function getRetargetInfo(currentHeight) {
  const periodStart = Math.floor(currentHeight / RETARGET_INTERVAL) * RETARGET_INTERVAL;
  const periodEnd = periodStart + RETARGET_INTERVAL - 1;
  const blocksInPeriod = currentHeight - periodStart + 1;
  const blocksRemaining = periodEnd - currentHeight;
  const periodNumber = Math.floor(currentHeight / RETARGET_INTERVAL);

  return {
    periodStart,
    periodEnd,
    blocksInPeriod,
    blocksRemaining,
    periodNumber,
    threshold: THRESHOLD_BLOCKS,
    thresholdPct: ACTIVATION_THRESHOLD * 100,
  };
}

export { RETARGET_INTERVAL, ACTIVATION_THRESHOLD, THRESHOLD_BLOCKS };
