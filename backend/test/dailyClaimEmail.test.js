const {
  isReadyReminderEligible,
  isSuccessRetryEligible,
} = require('../src/utils/dailyClaimEmail.cjs');

const verifiedPreference = {
  emailVerifiedAt: '2026-09-25T10:00:00.000Z',
  remindersEnabled: true,
  successEmailsEnabled: true,
  unsubscribedAt: null,
  lastReminderClaimId: null,
  lastSuccessClaimId: null,
  pendingSuccessClaimId: 42,
};

describe('Daily Claim email eligibility', () => {
  it('retries the paid claim explicitly marked as pending', () => {
    const claim = { id: 42, status: 'paid', claimedAt: '2026-09-26T10:00:00.000Z' };
    expect(isSuccessRetryEligible(verifiedPreference, claim)).toBe(true);
  });

  it('does not send an unrelated or already delivered payment confirmation', () => {
    const staleClaim = { id: 41, status: 'paid', claimedAt: '2026-09-24T10:00:00.000Z' };
    const deliveredClaim = { id: 42, status: 'paid', claimedAt: '2026-09-26T10:00:00.000Z' };

    expect(isSuccessRetryEligible(verifiedPreference, staleClaim)).toBe(false);
    expect(isSuccessRetryEligible({ ...verifiedPreference, lastSuccessClaimId: 42 }, deliveredClaim)).toBe(false);
  });

  it('does not send disabled or unsubscribed payment confirmations', () => {
    const claim = { id: 42, status: 'paid', claimedAt: '2026-09-26T10:00:00.000Z' };
    expect(isSuccessRetryEligible({ ...verifiedPreference, successEmailsEnabled: false }, claim)).toBe(false);
    expect(isSuccessRetryEligible({ ...verifiedPreference, unsubscribedAt: new Date() }, claim)).toBe(false);
  });

  it('sends a reminder only when the 24-hour wait has elapsed', () => {
    const claim = { id: 42, claimedAt: '2026-09-26T10:00:00.000Z' };
    expect(isReadyReminderEligible(verifiedPreference, claim, '2026-09-27T09:59:59.000Z')).toBe(false);
    expect(isReadyReminderEligible(verifiedPreference, claim, '2026-09-27T10:00:00.000Z')).toBe(true);
    expect(isReadyReminderEligible({ ...verifiedPreference, lastReminderClaimId: 42 }, claim, '2026-09-27T10:00:00.000Z')).toBe(false);
  });
});