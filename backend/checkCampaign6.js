// Usage: node checkCampaign6.js
// This script checks campaign #6 on the TaskManager contract using your .env config
require('dotenv').config();
const { ethers } = require('ethers');

const TASK_MANAGER = process.env.TASK_MANAGER_CONTRACT;
const BASE_RPC_URL = process.env.BASE_RPC_URL;

const TASK_MANAGER_ABI = [
  'function campaigns(uint256) external view returns (address advertiser, string taskType, string targetUrl, uint256 rewardPerTask, uint256 maxCompletions, uint256 completedCount, uint256 escrowedAmount, uint256 deadline, bool active)'
];

async function main() {
  const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);
  const contract = new ethers.Contract(TASK_MANAGER, TASK_MANAGER_ABI, provider);
  try {
    const campaignId = 6;
    const campaign = await contract.campaigns(campaignId);
    console.log('Campaign #6:', campaign);
    if (!campaign.advertiser || campaign.advertiser === ethers.ZeroAddress) {
      console.log('Campaign #6 does not exist.');
    } else {
      console.log('Advertiser:', campaign.advertiser);
      console.log('Task Type:', campaign.taskType);
      console.log('Target URL:', campaign.targetUrl);
      console.log('Reward Per Task:', campaign.rewardPerTask.toString());
      console.log('Max Completions:', campaign.maxCompletions.toString());
      console.log('Completed Count:', campaign.completedCount.toString());
      console.log('Escrowed Amount:', campaign.escrowedAmount.toString());
      console.log('Deadline:', campaign.deadline.toString());
      console.log('Active:', campaign.active);
    }
  } catch (err) {
    console.error('Error fetching campaign #6:', err.message);
    console.error(err);
  }
}

main();
