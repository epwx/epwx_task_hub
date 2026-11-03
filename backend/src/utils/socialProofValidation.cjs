function assertSignal(value, name) {
  if (!value || typeof value !== 'object' || typeof value.matched !== 'boolean') {
    throw new Error(`Analyzer result is missing ${name}.matched.`);
  }
  const confidence = Number(value.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error(`Analyzer result has invalid ${name}.confidence.`);
  }
  return { matched: value.matched, confidence };
}

function validateAnalyzerResult(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Analyzer result must be an object.');
  }
  const signals = value.signals;
  if (!signals || typeof signals !== 'object') {
    throw new Error('Analyzer result is missing signals.');
  }
  const confidence = Number(value.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error('Analyzer result has invalid confidence.');
  }
  return {
    confidence,
    signals: {
      imageReadable: assertSignal(signals.imageReadable, 'imageReadable'),
      socialPlatform: assertSignal(signals.socialPlatform, 'socialPlatform'),
      targetPost: assertSignal(signals.targetPost, 'targetPost'),
      account: assertSignal(signals.account, 'account'),
      taskAction: assertSignal(signals.taskAction, 'taskAction'),
      mismatch: Boolean(signals.mismatch),
    },
    reasonCodes: Array.isArray(value.reasonCodes)
      ? value.reasonCodes.filter((entry) => typeof entry === 'string').slice(0, 20)
      : [],
  };
}

module.exports = { validateAnalyzerResult };
