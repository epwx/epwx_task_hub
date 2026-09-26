function parsePolicyList(value, transform = (item) => item) {
  return new Set(
    String(value || '')
      .split(',')
      .map((item) => transform(item.trim()))
      .filter(Boolean),
  );
}

function getRequestCountryCode(headers = {}) {
  const value = headers['cf-ipcountry'] || headers['x-vercel-ip-country'] || headers['x-country-code'] || '';
  return String(Array.isArray(value) ? value[0] : value).trim().toUpperCase();
}

function validateDailyDrawEligibility({
  wallet,
  ageConfirmed,
  jurisdictionConfirmed,
  countryCode,
  blockedCountryCodes,
  blockedWallets,
}) {
  const normalizedWallet = String(wallet || '').trim().toLowerCase();
  if (ageConfirmed !== true) {
    return { eligible: false, status: 403, code: 'AGE_CONFIRMATION_REQUIRED', error: 'You must confirm that you are at least 18 years old.' };
  }
  if (jurisdictionConfirmed !== true) {
    return { eligible: false, status: 403, code: 'JURISDICTION_CONFIRMATION_REQUIRED', error: 'You must confirm that participation is permitted in your jurisdiction.' };
  }
  if (blockedWallets.has(normalizedWallet)) {
    return { eligible: false, status: 451, code: 'WALLET_NOT_ELIGIBLE', error: 'This wallet is not eligible for Daily Reward Draw participation.' };
  }
  if (countryCode && blockedCountryCodes.has(countryCode.toUpperCase())) {
    return { eligible: false, status: 451, code: 'JURISDICTION_NOT_ELIGIBLE', error: 'Daily Reward Draw participation is not available in your jurisdiction.' };
  }
  return { eligible: true };
}

module.exports = {
  getRequestCountryCode,
  parsePolicyList,
  validateDailyDrawEligibility,
};