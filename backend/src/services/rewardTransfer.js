import { ethers } from 'ethers';
import { epwxTokenWithSigner } from './blockchain.js';
import rewardAmountUtils from '../utils/rewardTransferAmount.cjs';

export const EPWX_TOKEN_DECIMALS = 9;

export const { getGrossRewardAmount } = rewardAmountUtils;

export async function distributeEpwxReward(wallet, amount, options = {}) {
  const token = options.token || epwxTokenWithSigner;
  if (!token) {
    const error = new Error('Token signer is unavailable. Check blockchain environment configuration.');
    error.code = 'TOKEN_SIGNER_UNAVAILABLE';
    throw error;
  }

  const grossAmount = getGrossRewardAmount(amount, options.feeBps);
  const tx = await token.transfer(wallet, ethers.parseUnits(grossAmount.toString(), EPWX_TOKEN_DECIMALS));
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) {
    const error = new Error('Token transfer did not confirm successfully.');
    error.code = 'TOKEN_TRANSFER_FAILED';
    error.txHash = tx.hash;
    throw error;
  }

  return { paid: true, txHash: tx.hash };
}
