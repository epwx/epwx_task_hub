function normalizeEmailIdentity(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function selectEmailOwner(preferences) {
  return [...(preferences || [])]
    .filter(preference => preference?.wallet && normalizeEmailIdentity(preference?.email))
    .sort((left, right) => {
      const leftTime = Date.parse(left.createdAt || '') || 0;
      const rightTime = Date.parse(right.createdAt || '') || 0;
      if (leftTime !== rightTime) return leftTime - rightTime;
      return String(left.id || '').localeCompare(String(right.id || ''));
    })[0] || null;
}

function isEmailOwner(preferences, wallet) {
  const owner = selectEmailOwner(preferences);
  return Boolean(owner && owner.wallet.toLowerCase() === String(wallet || '').toLowerCase());
}

module.exports = {
  normalizeEmailIdentity,
  selectEmailOwner,
  isEmailOwner,
};
