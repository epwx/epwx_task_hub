import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import express from 'express';
import request from 'supertest';

const TwitterCampaign = {
  create: jest.fn(async (data) => ({ id: 1, ...data })),
  findByPk: jest.fn(),
};
const Claim = { findAll: jest.fn(async () => []) };

jest.unstable_mockModule('../src/middleware/adminAuthorization.js', () => ({
  requireSignedAdmin: (req, res, next) => next(),
}));
jest.unstable_mockModule('../src/models/index.js', () => ({ TwitterCampaign, Claim }));

const { default: twitterCampaignsRouter } = await import('../src/routes/twitterCampaigns.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/twitter-campaigns', twitterCampaignsRouter);
  return app;
}

describe('twitter campaign reward amount', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  it('saves an edited reward amount instead of the fixed default', async () => {
    const campaign = { id: 7, taskType: 'retweet', rewardAmount: '100000', expiresAt: null, save: jest.fn(async () => {}) };
    TwitterCampaign.findByPk.mockResolvedValueOnce(campaign);

    const res = await request(app)
      .put('/api/twitter-campaigns/7')
      .send({ rewardAmount: '250000.5', admin: '0xadmin' })
      .expect(200);

    expect(campaign.rewardAmount).toBe('250000.5');
    expect(campaign.save).toHaveBeenCalled();
    expect(res.body.campaign.rewardAmount).toBe('250000.5');
  });

  it('keeps the existing reward amount when none is sent on update', async () => {
    const campaign = { id: 7, taskType: 'retweet', rewardAmount: '500000', expiresAt: null, save: jest.fn(async () => {}) };
    TwitterCampaign.findByPk.mockResolvedValueOnce(campaign);

    await request(app).put('/api/twitter-campaigns/7').send({ title: 'New title' }).expect(200);

    expect(campaign.rewardAmount).toBe('500000');
  });

  it('rejects a non-positive or non-numeric reward amount on update', async () => {
    const campaign = { id: 7, taskType: 'retweet', rewardAmount: '100000', expiresAt: null, save: jest.fn(async () => {}) };
    TwitterCampaign.findByPk.mockResolvedValue(campaign);

    await request(app).put('/api/twitter-campaigns/7').send({ rewardAmount: '0' }).expect(400);
    await request(app).put('/api/twitter-campaigns/7').send({ rewardAmount: '1e6' }).expect(400);

    expect(campaign.save).not.toHaveBeenCalled();
  });

  it('uses the submitted reward amount when creating a campaign', async () => {
    await request(app)
      .post('/api/twitter-campaigns/add')
      .send({ code: 'Spring', title: 'Spring', tweetUrl: 'https://x.example/p/1', taskType: 'retweet', rewardAmount: '300000' })
      .expect(200);

    expect(TwitterCampaign.create).toHaveBeenCalledWith(expect.objectContaining({ rewardAmount: '300000' }));
  });
});
