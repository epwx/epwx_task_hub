const sharp = require('sharp');
const { MAX_IMAGE_WINNERS, MAX_PNG_BYTES, buildWinnerImageSvg, renderWinnerImage } =
  require('../src/utils/dailyDrawWinnerImage.cjs');

const draw = { drawDate: '2026-10-19' };
const config = { frontendUrl: 'https://tasks.epowex.com', nextDrawTime: '00:05' };
const winners = Array.from({ length: 5 }, (_, index) => ({
  rank: index + 1, wallet: `0x${String(index + 1).padStart(40, '0')}`,
  prizeAmount: '1000000', status: 'pending',
}));

test('winner-card SVG contains branded headline, ordered rows, shortened wallets, prizes, and pending statuses', () => {
  const svg = buildWinnerImageSvg(draw, [...winners].reverse(), config);
  expect(svg).toContain('DAILY DRAW WINNERS');
  expect(svg).toContain('2026-10-19 | Base Network');
  expect(svg).toContain('1,000,000 EPWX');
  expect(svg.match(/>PENDING</g)).toHaveLength(5);
  expect(svg).not.toContain('>PAID<');
  expect(svg).not.toContain('All payouts confirmed');
  expect(svg.indexOf('WINNER #1')).toBeLessThan(svg.indexOf('WINNER #2'));
  expect(svg).toContain('0x000000...000001');
  expect(svg).toContain('tasks.epowex.com | Next draw: 00:05 UTC');
  expect(svg).toContain('eligibility rules apply');
  for (const winner of winners) expect(svg).not.toContain(winner.wallet);
});

test('paid badges and confirmed wording match stored transaction evidence, including mixed winners', () => {
  const confirmed = winners.map((winner) => ({
    ...winner, status: 'paid', txHash: `0x${'a'.repeat(64)}`, paidAt: '2026-10-20T00:06:00Z',
  }));
  const paidSvg = buildWinnerImageSvg(draw, confirmed, config);
  expect(paidSvg.match(/>PAID</g)).toHaveLength(5);
  expect(paidSvg).toContain('All payouts confirmed');
  confirmed[2].txHash = null;
  const mixed = buildWinnerImageSvg(draw, confirmed, config);
  expect(mixed.match(/>PAID</g)).toHaveLength(4);
  expect(mixed.match(/>PENDING</g)).toHaveLength(1);
  expect(mixed).toContain('4 of 5 payouts confirmed - others pending');
});

test('large draws explicitly disclose card limit and direct readers to complete results', () => {
  const many = Array.from({ length: 50 }, (_, index) => ({
    ...winners[0], rank: index + 1,
  }));
  const svg = buildWinnerImageSvg(draw, many, config);
  expect(svg.match(/WINNER #/g)).toHaveLength(MAX_IMAGE_WINNERS);
  expect(svg).toContain('Showing 10 of 50 winners - full results by draw date on website');
  expect(svg).toContain('height="1840"');
});

test('renders a real PNG at expected dimensions and under the media upload limit', async () => {
  const png = await renderWinnerImage(draw, winners, config);
  expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const metadata = await sharp(png).metadata();
  expect(metadata).toMatchObject({ format: 'png', width: 1000, height: 1130 });
  expect(png.length).toBeLessThan(MAX_PNG_BYTES);
});

test('escapes dynamic XML and refuses to clip exceptionally long prize values', () => {
  const svg = buildWinnerImageSvg(draw, winners, { ...config, nextDrawTime: '<script>&"' });
  expect(svg).not.toContain('<script>');
  expect(svg).toContain('&lt;script&gt;&amp;&quot;');
  expect(() => buildWinnerImageSvg(draw, [{ ...winners[0], prizeAmount: '9'.repeat(100) }], config))
    .toThrow('IMAGE_PRIZE_TOO_LONG');
});
