const {
  buildReadyReminderCopy,
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

  it('preserves reminder consent, verification, unsubscribe, and string-id deduplication', () => {
    const claim = { id: 42, claimedAt: '2026-09-26T10:00:00.000Z' };
    const now = '2026-09-27T10:00:00.000Z';
    for (const preference of [
      { ...verifiedPreference, remindersEnabled: false },
      { ...verifiedPreference, emailVerifiedAt: null },
      { ...verifiedPreference, unsubscribedAt: now },
      { ...verifiedPreference, lastReminderClaimId: '42' },
    ]) {
      expect(isReadyReminderEligible(preference, claim, now)).toBe(false);
    }
  });
});

describe('Personalized claim-ready reminder copy', () => {
  const claim = { id: 42, claimedAt: '2026-09-26T10:00:00.000Z', streakDay: 4 };

  it('previews the next day and entries using backend streak rules', () => {
    const copy = buildReadyReminderCopy(claim, '2026-09-27T10:00:00.000Z');
    expect(copy.subject).toBe('Your EPWX claim is ready: Day 5, 3 draw entries');
    expect(copy.paragraphs).toContain('Your next successful claim unlocks Day 5 with 3 draw entries.');
  });

  it('uses an explicit UTC continuation deadline and eligibility caveat', () => {
    const copy = buildReadyReminderCopy(claim, '2026-09-27T10:00:00.000Z');
    expect(copy.paragraphs[2]).toBe(`To continue this streak, complete your next claim no later than ${new Date('2026-09-28T10:00:00.000Z').toUTCString()}.`);
    expect(copy.paragraphs.join(' ')).toContain('Entries do not guarantee a win. Existing eligibility rules apply.');
  });

  it('restarts rather than promising expired streak benefits', () => {
    const copy = buildReadyReminderCopy(claim, '2026-09-28T10:00:00.001Z');
    expect(copy.subject).toBe('Your EPWX claim is ready: Day 1, 1 draw entry');
    expect(copy.paragraphs[2]).toBe('Start a fresh seven-day streak with your next successful claim.');
  });

  it('continues exactly at the 48-hour boundary', () => {
    expect(buildReadyReminderCopy(claim, '2026-09-28T10:00:00.000Z').subject)
      .toBe('Your EPWX claim is ready: Day 5, 3 draw entries');
  });

  it('explains the new cycle after day seven', () => {
    const copy = buildReadyReminderCopy({ ...claim, streakDay: 7 }, '2026-09-27T10:00:00.000Z');
    expect(copy.subject).toBe('Your EPWX claim is ready: Day 1, 1 draw entry');
    expect(copy.paragraphs[2]).toContain('Seven-day cycle complete!');
  });

  it('starts day one when legacy history has no streak day', () => {
    expect(buildReadyReminderCopy({ claimedAt: claim.claimedAt }, '2026-09-27T10:00:00.000Z').subject)
      .toBe('Your EPWX claim is ready: Day 1, 1 draw entry');
  });

  it.each([
    [claim, '2026-09-27T09:59:59.999Z'],
    [claim, 'invalid'],
    [{ ...claim, claimedAt: 'invalid' }, '2026-09-27T10:00:00.000Z'],
  ])('rejects invalid timing instead of sending misleading copy', (previousClaim, now) => {
    expect(() => buildReadyReminderCopy(previousClaim, now)).toThrow('Cannot personalize a reminder');
  });
});