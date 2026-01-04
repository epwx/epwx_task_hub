const request = require('supertest');
const app = require('../src/index');
jest.mock('../src/models', () => {
  const actual = jest.requireActual('../src/models');
  let mockDuplicate = false;
  const CashbackClaim = {
    findOne: jest.fn(async ({ where }) => CashbackClaim.mockDuplicate ? { id: 1, ...where } : null),
    create: jest.fn(async (data) => ({ ...data, id: 1, status: 'pending' })),
    destroy: jest.fn(async () => {}),
    findAll: jest.fn(async () => [{ id: 1, wallet: '0xTestWallet123', txHash: '0xTestTxHash123', amount: '1000', cashbackAmount: '30', status: 'pending', claimedAt: new Date() }]),
    findByPk: jest.fn(async (id) => id === 1 ? { id: 1, status: 'pending', save: jest.fn(async function() { this.status = 'paid'; return this; }) } : null),
    mockDuplicate: mockDuplicate
  };
  return {
    ...actual,
    CashbackClaim
  };
});
const { CashbackClaim } = require('../src/models');

describe('EPWX Cashback API', () => {
  const testWallet = '0xTestWallet123';
  const testTxHash = '0xTestTxHash123';
  const testAmount = '1000';

  beforeAll(async () => {
    // Clean up any test data
    await CashbackClaim.destroy({ where: { wallet: testWallet, txHash: testTxHash } });
  });

  afterAll(async () => {
    await CashbackClaim.destroy({ where: { wallet: testWallet, txHash: testTxHash } });
  });

  it('should fetch purchase transactions (mocked)', async () => {
    const res = await request(app)
      .get(`/api/epwx/purchases?wallet=${testWallet}&hours=3`)
      .expect(200);
    expect(Array.isArray(res.body.transactions)).toBe(true);
  });

  it('should allow claiming cashback for a transaction', async () => {
    const res = await request(app)
      .post('/api/epwx/claim')
      .send({ wallet: testWallet, txHash: testTxHash, amount: testAmount })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.claim.wallet).toBe(testWallet);
    expect(res.body.claim.txHash).toBe(testTxHash);
    expect(res.body.claim.amount).toBe(testAmount);
    expect(res.body.claim.cashbackAmount).toBe((parseFloat(testAmount) * 0.03).toString());
  });

  it('should not allow duplicate claims', async () => {
    CashbackClaim.mockDuplicate = true;
    const res = await request(app)
      .post('/api/epwx/claim')
      .send({ wallet: testWallet, txHash: testTxHash, amount: testAmount })
      .expect(400);
    expect(res.body.error).toMatch(/already claimed/i);
    CashbackClaim.mockDuplicate = false;
  });

  it('should allow admin to fetch all claims', async () => {
    const res = await request(app)
      .get('/api/epwx/claims?admin=0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735')
      .expect(200);
    expect(Array.isArray(res.body.claims)).toBe(true);
  });

  it('should allow admin to mark claim as paid', async () => {
    const claim = await CashbackClaim.create({ wallet: testWallet, txHash: '0xTestTxHashMarkPaid', amount: testAmount, cashbackAmount: (parseFloat(testAmount) * 0.03).toString(), status: 'pending' });
    const res = await request(app)
      .post('/api/epwx/claims/mark-paid')
      .send({ admin: '0xc3F5E57Ed34fA3492616e9b20a0621a87FdD2735', claimId: claim.id })
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.claim.status).toBe('paid');
  });
});
