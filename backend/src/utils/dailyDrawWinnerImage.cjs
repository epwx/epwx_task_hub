const sharp = require('sharp');
const { announcementDetails } = require('./dailyDrawX.cjs');

const MAX_IMAGE_WINNERS = 10;
const WIDTH = 1000;
const MAX_PNG_BYTES = 5 * 1024 * 1024;

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;',
  })[character]);
}

function trophy(x, y, scale = 1) {
  return `<g transform="translate(${x} ${y}) scale(${scale})" fill="none" stroke="#59d35a" stroke-width="3" stroke-linejoin="round">
    <path d="M12 4h24v13c0 16-24 16-24 0zM12 8H4v8c0 7 8 9 12 9M36 8h8v8c0 7-8 9-12 9M24 29v10M14 42h20"/>
  </g>`;
}

function buildWinnerImageSvg(draw, winners, config) {
  const details = announcementDetails(draw, winners, config.frontendUrl);
  const shown = details.rows.slice(0, MAX_IMAGE_WINNERS);
  const height = 420 + shown.length * 142;
  const footer = `${new URL(details.resultsUrl).host}${config.nextDrawTime ? ` | Next draw: ${config.nextDrawTime} UTC` : ''}`;
  const footerFontSize = Math.min(21, Math.floor(880 / (footer.length * 0.65)));
  if (footerFontSize < 14) throw new Error('DAILY_DRAW_X_IMAGE_FOOTER_TOO_LONG');
  const allPaid = details.paidCount === details.rows.length;
  const payment = allPaid ? 'All payouts confirmed' : `${details.paidCount} of ${details.rows.length} payouts confirmed - others pending`;
  const rows = shown.map((winner, index) => {
    const y = 270 + index * 142;
    const label = winner.paid ? 'PAID' : 'PENDING';
    const color = winner.paid ? '#59d35a' : '#f0c46a';
    const prize = `${winner.prize} EPWX`;
    // Fit unusually large integer prizes without rounding or clipping.
    const fontSize = Math.min(26, Math.floor(600 / (prize.length * 0.65)));
    if (fontSize < 14) throw new Error('DAILY_DRAW_X_IMAGE_PRIZE_TOO_LONG');
    return `<g>
      <rect x="48" y="${y}" width="904" height="122" rx="20" fill="#101d29" stroke="#293747"/>
      ${trophy(72, y + 20)}
      <text x="144" y="${y + 38}" font-size="27" font-weight="700" fill="#ffffff">WINNER #${winner.rank}</text>
      <text x="144" y="${y + 72}" font-family="monospace" font-size="23" fill="#aab8c7">${escapeXml(winner.wallet)}</text>
      <text x="144" y="${y + 104}" font-size="${fontSize}" font-weight="700" fill="#59d35a">${escapeXml(prize)}</text>
      <rect x="748" y="${y + 38}" width="174" height="46" rx="23" fill="${winner.paid ? '#193f2d' : '#40351d'}"/>
      <text x="835" y="${y + 68}" font-size="22" font-weight="700" fill="${color}" text-anchor="middle">${label}</text>
    </g>`;
  }).join('');
  const overflow = details.rows.length > shown.length
    ? `Showing ${shown.length} of ${details.rows.length} winners - full results by draw date on website`
    : payment;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">
    <defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#091725"/><stop offset="1" stop-color="#030a12"/></linearGradient></defs>
    <rect width="${WIDTH}" height="${height}" rx="36" fill="url(#bg)"/>
    <rect x="1" y="1" width="998" height="${height - 2}" rx="36" fill="none" stroke="#304254"/>
    <g font-family="DejaVu Sans, Arial, sans-serif">
      <text x="500" y="80" text-anchor="middle" fill="#59d35a" font-size="59" font-weight="800">EPWX</text>
      <text x="500" y="130" text-anchor="middle" fill="#ffffff" font-size="34" font-weight="700">DAILY DRAW WINNERS</text>
      <text x="500" y="169" text-anchor="middle" fill="#aab8c7" font-size="24">${escapeXml(details.date)} | Base Network</text>
      <path d="M280 199h170M550 199h170" stroke="#397749" stroke-width="2"/>
      ${trophy(478, 180, 0.9)}
      <text x="500" y="244" text-anchor="middle" fill="#c2cfdb" font-size="22">Congratulations to our ${details.rows.length} selected winners!</text>
      ${rows}
      <text x="500" y="${height - 116}" text-anchor="middle" fill="#c2cfdb" font-size="18">${escapeXml(overflow)}</text>
      <text x="500" y="${height - 76}" text-anchor="middle" fill="#ffffff" font-size="22">Claim daily - eligibility rules apply</text>
      <text x="500" y="${height - 40}" text-anchor="middle" fill="#59d35a" font-size="${footerFontSize}">${escapeXml(footer)}</text>
    </g>
  </svg>`;
}

async function renderWinnerImage(draw, winners, config) {
  const svg = buildWinnerImageSvg(draw, winners, config);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  if (png.length > MAX_PNG_BYTES) throw new Error('DAILY_DRAW_X_IMAGE_TOO_LARGE');
  return png;
}

module.exports = { MAX_IMAGE_WINNERS, MAX_PNG_BYTES, buildWinnerImageSvg, renderWinnerImage };
