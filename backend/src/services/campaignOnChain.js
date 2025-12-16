const { taskManagerWithSigner } = require('./blockchain');

async function createCampaignOnChain(taskType, targetUrl, rewardPerTask, maxCompletions, durationInDays) {
  // rewardPerTask should be a string or BigInt in smallest unit (e.g., wei)
  const tx = await taskManagerWithSigner.createCampaign(
    taskType,
    targetUrl,
    rewardPerTask,
    maxCompletions,
    durationInDays
  );
  const receipt = await tx.wait();
  // Find the CampaignCreated event
  const event = receipt.events.find(e => e.event === 'CampaignCreated');
  if (!event) throw new Error('No CampaignCreated event found');
  return {
    campaignId: event.args.campaignId.toString(),
    transactionHash: receipt.transactionHash
  };
}

module.exports = {
  createCampaignOnChain
};
