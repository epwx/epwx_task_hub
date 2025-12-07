const axios = require('axios');
const { ethers } = require('ethers');
const { pairContract } = require('./blockchain');

const WETH_ADDRESS = '0x4200000000000000000000000000000000000006';
const EPWX_TOKEN = process.env.EPWX_TOKEN_ADDRESS;

/**
 * Get ETH price in USD from CoinGecko
 */
async function getETHPriceUSD() {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      {
        params: {
          ids: 'ethereum',
          vs_currencies: 'usd'
        }
      }
    );
    return response.data.ethereum.usd;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    throw error;
  }
}

/**
 * Get EPWX price from PancakeSwap pair
 */
async function getEPWXPrice() {
  try {
    // Get reserves from pair
    const [reserve0, reserve1] = await pairContract.getReserves();
    const token0 = await pairContract.token0();
    
    // Determine which reserve is EPWX and which is WETH
    const isEPWXToken0 = token0.toLowerCase() === EPWX_TOKEN.toLowerCase();
    const epwxReserve = isEPWXToken0 ? reserve0 : reserve1;
    const wethReserve = isEPWXToken0 ? reserve1 : reserve0;
    
    // Format reserves with correct decimals (EPWX has 9 decimals, WETH has 18)
    const epwxReserveFormatted = Number(ethers.formatUnits(epwxReserve, 9));
    const wethReserveFormatted = Number(ethers.formatEther(wethReserve));
    
    // Calculate EPWX price in WETH
    const epwxPriceInWETH = wethReserveFormatted / epwxReserveFormatted;
    
    // Get ETH price in USD
    const ethPriceUSD = await getETHPriceUSD();
    
    // Calculate EPWX price in USD
    const epwxPriceUSD = epwxPriceInWETH * ethPriceUSD;
    
    // Calculate liquidity
    const liquidityUSD = wethReserveFormatted * ethPriceUSD * 2;
    
    return {
      priceUSD: epwxPriceUSD,
      priceWETH: epwxPriceInWETH,
      priceETH: epwxPriceInWETH, // Same as WETH
      epwxReserve: epwxReserveFormatted,
      wethReserve: wethReserveFormatted,
      liquidityUSD: liquidityUSD,
      marketCap: epwxPriceUSD * 80e12, // 80 trillion total supply
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error fetching EPWX price:', error);
    throw error;
  }
}

/**
 * Convert USD to EPWX amount
 */
async function convertUSDToEPWX(usdAmount) {
  const priceData = await getEPWXPrice();
  return Math.floor(usdAmount / priceData.priceUSD);
}

/**
 * Convert EPWX to USD amount
 */
async function convertEPWXToUSD(epwxAmount) {
  const priceData = await getEPWXPrice();
  return epwxAmount * priceData.priceUSD;
}

module.exports = {
  getETHPriceUSD,
  getEPWXPrice,
  convertUSDToEPWX,
  convertEPWXToUSD
};
