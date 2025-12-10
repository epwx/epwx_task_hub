const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);

const EPWX_TOKEN = process.env.EPWX_TOKEN_ADDRESS;
const TASK_MANAGER = process.env.TASK_MANAGER_CONTRACT;
const EPWX_WETH_PAIR = process.env.EPWX_WETH_PAIR;

// ABIs
const TASK_MANAGER_ABI = [
  'function createCampaign(string taskType, string targetUrl, uint256 rewardPerTask, uint256 maxCompletions, uint256 durationInDays) external returns (uint256)',
  'function submitCompletion(uint256 campaignId, address user) external returns (uint256)',
  'function verifyCompletion(uint256 completionId, bool approved) external',
  'function batchVerifyCompletions(uint256[] completionIds, bool[] approvals) external',
  'function campaigns(uint256) external view returns (address advertiser, string taskType, string targetUrl, uint256 rewardPerTask, uint256 maxCompletions, uint256 completedCount, uint256 escrowedAmount, uint256 deadline, bool active)',
  'function hasCompleted(uint256 campaignId, address user) external view returns (bool)',
  'function getCampaign(uint256 campaignId) external view returns (address, string, string, uint256, uint256, uint256, uint256, bool)',
  'function pendingRewards(address user) external view returns (uint256)',
  'function claimRewards() external',
  'event CampaignCreated(uint256 indexed campaignId, address indexed advertiser, string taskType, uint256 rewardPerTask, uint256 maxCompletions, uint256 deadline)',
  'event TaskCompleted(uint256 indexed campaignId, address indexed user, uint256 completionId)',
  'event TaskVerified(uint256 indexed completionId, uint256 indexed campaignId, address indexed user, bool approved)'
];

const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)'
];

const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)'
];

// Contract instances
const taskManagerContract = new ethers.Contract(TASK_MANAGER, TASK_MANAGER_ABI, provider);
const epwxTokenContract = new ethers.Contract(EPWX_TOKEN, ERC20_ABI, provider);
const pairContract = new ethers.Contract(EPWX_WETH_PAIR, PAIR_ABI, provider);

// Verifier wallet (for submitting and verifying tasks)
const verifierWallet = new ethers.Wallet(process.env.VERIFIER_PRIVATE_KEY, provider);
const taskManagerWithSigner = taskManagerContract.connect(verifierWallet);

module.exports = {
  provider,
  taskManagerContract,
  taskManagerWithSigner,
  epwxTokenContract,
  pairContract,
  EPWX_TOKEN,
  TASK_MANAGER
};
