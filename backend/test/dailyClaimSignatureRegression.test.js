const { ethers } = require('ethers');
const {
  verifyWalletSignature,
  buildDailyClaimMessages,
} = require('../src/utils/dailyClaimSignature.cjs');

function createWalletWithCaseDifference() {
  for (let i = 0; i < 20; i += 1) {
    const wallet = ethers.Wallet.createRandom();
    const checksumAddress = wallet.address;
    if (checksumAddress !== checksumAddress.toLowerCase()) {
      return wallet;
    }
  }

  throw new Error('Unable to generate checksum-cased wallet for regression test.');
}

describe('Daily claim signature regression', () => {
  it('accepts a signature signed with checksum-case wallet message via message variants', async () => {
    const wallet = createWalletWithCaseDifference();
    const checksumWallet = wallet.address;
    const normalizedWallet = checksumWallet.toLowerCase();
    const date = '2026-07-03';

    const checksumMessage = `EPWX Daily Claim for ${checksumWallet} on ${date}`;
    const signature = await wallet.signMessage(checksumMessage);

    // This is the pre-fix behavior that caused false negatives.
    const normalizedOnlyMessage = `EPWX Daily Claim for ${normalizedWallet} on ${date}`;
    const normalizedOnlyValid = await verifyWalletSignature(normalizedOnlyMessage, signature, normalizedWallet);
    expect(normalizedOnlyValid).toBe(false);

    // Regression guard: backend should verify against normalized/raw/checksum variants.
    const messageVariants = buildDailyClaimMessages(checksumWallet, normalizedWallet, date);
    expect(messageVariants).toContain(checksumMessage);
    expect(messageVariants).toContain(normalizedOnlyMessage);

    const valid = await verifyWalletSignature(messageVariants, signature, normalizedWallet);
    expect(valid).toBe(true);
  });

  it('accepts Telegram mini-app style normalized-wallet signature payloads', async () => {
    const wallet = createWalletWithCaseDifference();
    const checksumWallet = wallet.address;
    const normalizedWallet = checksumWallet.toLowerCase();
    const date = '2026-07-03';

    // Mini-app signs with normalized wallet and sends normalized wallet in payload.
    const normalizedMessage = `EPWX Daily Claim for ${normalizedWallet} on ${date}`;
    const signature = await wallet.signMessage(normalizedMessage);

    const messageVariants = buildDailyClaimMessages(normalizedWallet, normalizedWallet, date);
    expect(messageVariants).toContain(normalizedMessage);
    expect(messageVariants).toContain(`EPWX Daily Claim for ${checksumWallet} on ${date}`);

    const valid = await verifyWalletSignature(messageVariants, signature, normalizedWallet);
    expect(valid).toBe(true);
  });
});
