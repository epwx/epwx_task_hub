const {
  getRequestCountryCode,
  parsePolicyList,
  validateDailyDrawEligibility,
} = require('../src/utils/dailyDrawEligibility.cjs');

const wallet = '0x0000000000000000000000000000000000000001';

function validate(overrides = {}) {
  return validateDailyDrawEligibility({
    wallet,
    ageConfirmed: true,
    jurisdictionConfirmed: true,
    countryCode: 'US',
    blockedCountryCodes: parsePolicyList('CU,IR,KP,SY', (item) => item.toUpperCase()),
    blockedWallets: parsePolicyList('', (item) => item.toLowerCase()),
    ...overrides,
  });
}

describe('Daily Reward Draw eligibility policy', () => {
  it('requires adult and jurisdiction confirmations', () => {
    expect(validate({ ageConfirmed: false }).code).toBe('AGE_CONFIRMATION_REQUIRED');
    expect(validate({ jurisdictionConfirmed: false }).code).toBe('JURISDICTION_CONFIRMATION_REQUIRED');
  });

  it('blocks configured countries and wallets', () => {
    expect(validate({ countryCode: 'IR' })).toMatchObject({ eligible: false, status: 451 });
    expect(validate({ blockedWallets: new Set([wallet]) })).toMatchObject({ eligible: false, code: 'WALLET_NOT_ELIGIBLE' });
  });

  it('accepts eligible participants and normalizes trusted country headers', () => {
    expect(getRequestCountryCode({ 'cf-ipcountry': 'us' })).toBe('US');
    expect(validate()).toEqual({ eligible: true });
  });
});