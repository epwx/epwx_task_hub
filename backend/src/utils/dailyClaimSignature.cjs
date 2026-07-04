const { ethers } = require('ethers');

const ERC1271_MAGIC_VALUE = '0x1626ba7e';

let baseRpcProvider = null;

function getBaseRpcProvider() {
  if (!baseRpcProvider) {
    const rpcUrl = process.env.BASE_RPC_URL || process.env.RPC_URL;
    if (!rpcUrl) {
      return null;
    }

    baseRpcProvider = new ethers.JsonRpcProvider(rpcUrl);
  }

  return baseRpcProvider;
}

async function verifyWalletSignature(messageOrMessages, signature, walletAddress) {
  const messages = Array.isArray(messageOrMessages)
    ? messageOrMessages
    : [messageOrMessages];
  const uniqueMessages = [...new Set(messages.filter((value) => typeof value === 'string' && value.trim()))];

  for (const message of uniqueMessages) {
    try {
      const recovered = ethers.verifyMessage(message, signature).toLowerCase();
      if (recovered === walletAddress) {
        return true;
      }
    } catch {
      // Fall through to ERC-1271 verification for smart wallets.
    }
  }

  const provider = getBaseRpcProvider();
  if (!provider) {
    return false;
  }

  try {
    const code = await provider.getCode(walletAddress);
    if (!code || code === '0x') {
      return false;
    }

    const isValidSignatureAbi = ['function isValidSignature(bytes32 hash, bytes signature) view returns (bytes4 magicValue)'];
    const contract = new ethers.Contract(walletAddress, isValidSignatureAbi, provider);
    for (const message of uniqueMessages) {
      const digest = ethers.hashMessage(message);
      const result = await contract.isValidSignature(digest, signature);
      if (String(result).toLowerCase() === ERC1271_MAGIC_VALUE) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.warn('[daily-claim] Smart wallet signature verification failed:', error?.message || error);
    return false;
  }
}

function buildDailyClaimMessages(walletInput, normalizedWallet, dateString) {
  const candidates = [normalizedWallet];
  const rawWallet = typeof walletInput === 'string' ? walletInput.trim() : '';
  if (rawWallet) {
    candidates.push(rawWallet);
  }

  try {
    candidates.push(ethers.getAddress(normalizedWallet));
  } catch {
    // Ignore checksum conversion failures and continue with available candidates.
  }

  const uniqueWallets = [...new Set(candidates.filter((value) => typeof value === 'string' && value.trim()))];
  return uniqueWallets.map((walletAddress) => `EPWX Daily Claim for ${walletAddress} on ${dateString}`);
}

module.exports = {
  verifyWalletSignature,
  buildDailyClaimMessages,
};
