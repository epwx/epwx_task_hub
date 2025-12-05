// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TaskManager
 * @dev Manages social media task campaigns and rewards distribution
 */
contract TaskManager is Ownable, ReentrancyGuard {
    IERC20 public immutable epwxToken;
    
    struct Campaign {
        address advertiser;
        string taskType; // "like", "repost", "comment", "follow"
        string targetUrl;
        uint256 rewardPerTask;
        uint256 maxCompletions;
        uint256 completedCount;
        uint256 escrowedAmount;
        uint256 deadline;
        bool active;
    }
    
    struct Completion {
        address user;
        uint256 campaignId;
        uint256 timestamp;
        bool verified;
        bool paid;
    }
    
    // Campaign ID counter
    uint256 public campaignIdCounter;
    
    // Mapping from campaign ID to Campaign
    mapping(uint256 => Campaign) public campaigns;
    
    // Mapping from campaign ID to user address to completion status
    mapping(uint256 => mapping(address => bool)) public hasCompleted;
    
    // Mapping from completion ID to Completion
    mapping(uint256 => Completion) public completions;
    uint256 public completionIdCounter;
    
    // Mapping from user to pending rewards
    mapping(address => uint256) public pendingRewards;
    
    // Authorized verifiers
    mapping(address => bool) public verifiers;
    
    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed advertiser,
        string taskType,
        uint256 rewardPerTask,
        uint256 maxCompletions,
        uint256 deadline
    );
    
    event TaskCompleted(
        uint256 indexed campaignId,
        address indexed user,
        uint256 completionId
    );
    
    event TaskVerified(
        uint256 indexed completionId,
        uint256 indexed campaignId,
        address indexed user,
        bool approved
    );
    
    event RewardClaimed(address indexed user, uint256 amount);
    
    event CampaignCancelled(uint256 indexed campaignId, uint256 refundAmount);
    
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);
    
    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner(), "Not authorized verifier");
        _;
    }
    
    constructor(address _epwxToken) Ownable(msg.sender) {
        require(_epwxToken != address(0), "Invalid token address");
        epwxToken = IERC20(_epwxToken);
        verifiers[msg.sender] = true; // Owner is default verifier
    }
    
    /**
     * @dev Create a new campaign
     */
    function createCampaign(
        string memory _taskType,
        string memory _targetUrl,
        uint256 _rewardPerTask,
        uint256 _maxCompletions,
        uint256 _durationInDays
    ) external nonReentrant returns (uint256) {
        require(_maxCompletions > 0, "Invalid max completions");
        require(_rewardPerTask > 0, "Invalid reward amount");
        require(_durationInDays > 0 && _durationInDays <= 90, "Invalid duration");
        
        uint256 totalRequired = _rewardPerTask * _maxCompletions;
        
        // Transfer EPWX tokens from advertiser to contract
        require(
            epwxToken.transferFrom(msg.sender, address(this), totalRequired),
            "EPWX transfer failed"
        );
        
        uint256 campaignId = campaignIdCounter++;
        uint256 deadline = block.timestamp + (_durationInDays * 1 days);
        
        campaigns[campaignId] = Campaign({
            advertiser: msg.sender,
            taskType: _taskType,
            targetUrl: _targetUrl,
            rewardPerTask: _rewardPerTask,
            maxCompletions: _maxCompletions,
            completedCount: 0,
            escrowedAmount: totalRequired,
            deadline: deadline,
            active: true
        });
        
        emit CampaignCreated(
            campaignId,
            msg.sender,
            _taskType,
            _rewardPerTask,
            _maxCompletions,
            deadline
        );
        
        return campaignId;
    }
    
    /**
     * @dev Submit a task completion (called by backend after user submits)
     */
    function submitCompletion(uint256 _campaignId, address _user) 
        external 
        onlyVerifier 
        returns (uint256) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        
        require(campaign.active, "Campaign not active");
        require(block.timestamp <= campaign.deadline, "Campaign expired");
        require(campaign.completedCount < campaign.maxCompletions, "Campaign full");
        require(!hasCompleted[_campaignId][_user], "Already completed");
        
        uint256 completionId = completionIdCounter++;
        
        completions[completionId] = Completion({
            user: _user,
            campaignId: _campaignId,
            timestamp: block.timestamp,
            verified: false,
            paid: false
        });
        
        hasCompleted[_campaignId][_user] = true;
        
        emit TaskCompleted(_campaignId, _user, completionId);
        
        return completionId;
    }
    
    /**
     * @dev Verify and approve task completion
     */
    function verifyCompletion(uint256 _completionId, bool _approved) 
        public 
        onlyVerifier 
        nonReentrant 
    {
        Completion storage completion = completions[_completionId];
        require(!completion.verified, "Already verified");
        
        completion.verified = true;
        
        if (_approved) {
            Campaign storage campaign = campaigns[completion.campaignId];
            require(campaign.active, "Campaign not active");
            
            campaign.completedCount++;
            
            // Add reward to user's pending balance
            pendingRewards[completion.user] += campaign.rewardPerTask;
            completion.paid = true;
            
            // Auto-complete campaign if all slots filled
            if (campaign.completedCount >= campaign.maxCompletions) {
                campaign.active = false;
            }
        }
        
        emit TaskVerified(_completionId, completion.campaignId, completion.user, _approved);
    }
    
    /**
     * @dev Batch verify multiple completions
     */
    function batchVerifyCompletions(uint256[] memory _completionIds, bool[] memory _approvals) 
        external 
        onlyVerifier 
    {
        require(_completionIds.length == _approvals.length, "Array length mismatch");
        
        for (uint256 i = 0; i < _completionIds.length; i++) {
            verifyCompletion(_completionIds[i], _approvals[i]);
        }
    }
    
    /**
     * @dev Users claim their accumulated rewards
     */
    function claimRewards() external nonReentrant {
        uint256 amount = pendingRewards[msg.sender];
        require(amount > 0, "No rewards to claim");
        
        pendingRewards[msg.sender] = 0;
        
        require(epwxToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit RewardClaimed(msg.sender, amount);
    }
    
    /**
     * @dev Cancel campaign and refund unused funds
     */
    function cancelCampaign(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(msg.sender == campaign.advertiser, "Not campaign owner");
        require(campaign.active, "Campaign not active");
        
        campaign.active = false;
        
        uint256 remainingSlots = campaign.maxCompletions - campaign.completedCount;
        uint256 refundAmount = remainingSlots * campaign.rewardPerTask;
        
        if (refundAmount > 0) {
            require(epwxToken.transfer(campaign.advertiser, refundAmount), "Refund failed");
        }
        
        emit CampaignCancelled(_campaignId, refundAmount);
    }
    
    /**
     * @dev Auto-expire campaign after deadline and refund unused funds
     */
    function expireCampaign(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.active, "Campaign not active");
        require(block.timestamp > campaign.deadline, "Campaign not expired yet");
        
        campaign.active = false;
        
        uint256 remainingSlots = campaign.maxCompletions - campaign.completedCount;
        uint256 refundAmount = remainingSlots * campaign.rewardPerTask;
        
        if (refundAmount > 0) {
            require(epwxToken.transfer(campaign.advertiser, refundAmount), "Refund failed");
        }
        
        emit CampaignCancelled(_campaignId, refundAmount);
    }
    
    /**
     * @dev Get campaign details
     */
    function getCampaign(uint256 _campaignId) 
        external 
        view 
        returns (
            address advertiser,
            string memory taskType,
            string memory targetUrl,
            uint256 rewardPerTask,
            uint256 maxCompletions,
            uint256 completedCount,
            uint256 deadline,
            bool active
        ) 
    {
        Campaign storage campaign = campaigns[_campaignId];
        return (
            campaign.advertiser,
            campaign.taskType,
            campaign.targetUrl,
            campaign.rewardPerTask,
            campaign.maxCompletions,
            campaign.completedCount,
            campaign.deadline,
            campaign.active
        );
    }
    
    /**
     * @dev Add verifier
     */
    function addVerifier(address _verifier) external onlyOwner {
        require(_verifier != address(0), "Invalid address");
        verifiers[_verifier] = true;
        emit VerifierAdded(_verifier);
    }
    
    /**
     * @dev Remove verifier
     */
    function removeVerifier(address _verifier) external onlyOwner {
        verifiers[_verifier] = false;
        emit VerifierRemoved(_verifier);
    }
}
