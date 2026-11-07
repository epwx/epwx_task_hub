import { Wallet } from 'ethers';
import { jest } from '@jest/globals';
import {
  createAdminClaimAuthorizationMessage,
  createTaskSubmissionAuthorizationMessage,
  verifyAndConsumeAuthorization,
} from '../src/utils/signedAuthorization.js';

describe('signed authorization', () => {
  it('accepts a matching task signature and persists its one-time identity', async () => {
    const wallet = Wallet.createRandom();
    const issuedAt = new Date().toISOString();
    const nonce = '1234567890abcdef1234567890abcdef';
    const message = createTaskSubmissionAuthorizationMessage({
      wallet: wallet.address,
      campaignId: 7,
      twitterUsername: 'EPWX_User',
      issuedAt,
      nonce,
    });
    const signature = await wallet.signMessage(message);
    const authorizationModel = { create: jest.fn().mockResolvedValue({}) };

    const result = await verifyAndConsumeAuthorization({
      authorization: { issuedAt, nonce, signature },
      expectedWallet: wallet.address,
      purpose: 'task-submit:7',
      message,
      authorizationModel,
    });

    expect(result).toEqual({ ok: true, wallet: wallet.address.toLowerCase() });
    expect(authorizationModel.create).toHaveBeenCalledWith(expect.objectContaining({
      walletAddress: wallet.address.toLowerCase(),
      purpose: 'task-submit:7',
    }));
  });

  it('rejects a signature from a different wallet', async () => {
    const expectedWallet = Wallet.createRandom();
    const signer = Wallet.createRandom();
    const issuedAt = new Date().toISOString();
    const nonce = '1234567890abcdef1234567890abcdef';
    const message = createTaskSubmissionAuthorizationMessage({
      wallet: expectedWallet.address,
      campaignId: 7,
      twitterUsername: 'epwx_user',
      issuedAt,
      nonce,
    });
    const signature = await signer.signMessage(message);

    const result = await verifyAndConsumeAuthorization({
      authorization: { issuedAt, nonce, signature },
      expectedWallet: expectedWallet.address,
      purpose: 'task-submit:7',
      message,
      authorizationModel: { create: jest.fn() },
    });

    expect(result.status).toBe(403);
  });

  it('binds admin authorization to the claim action and rejects replay', async () => {
    const wallet = Wallet.createRandom();
    const issuedAt = new Date().toISOString();
    const nonce = 'abcdef1234567890abcdef1234567890';
    const message = createAdminClaimAuthorizationMessage({
      wallet: wallet.address,
      claimId: 42,
      action: 'settle',
      issuedAt,
      nonce,
    });
    const signature = await wallet.signMessage(message);
    const replayError = new Error('duplicate');
    replayError.name = 'SequelizeUniqueConstraintError';

    const result = await verifyAndConsumeAuthorization({
      authorization: { issuedAt, nonce, signature },
      expectedWallet: wallet.address,
      purpose: 'claim:42:settle',
      message,
      allowedWallets: [wallet.address.toLowerCase()],
      authorizationModel: { create: jest.fn().mockRejectedValue(replayError) },
    });

    expect(result).toEqual({
      ok: false,
      status: 409,
      error: 'This wallet authorization has already been used.',
    });
  });
});
