const {
  MAX_LINKS, readVoteLinks, renderTelegramVoteBlock,
} = require('../src/utils/listingVoteLinks.cjs');

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const valid = 'CoinSniper|https://coinsniper.net/coin/95195,CoinMooner|https://coinmooner.com/coins/epowerx-on-base-epwx';

describe('listing vote link configuration', () => {
  test('is disabled unless the flag is exactly the string true', () => {
    for (const flag of [undefined, '', 'false', '1', 'yes', 'TRUE', ' true']) {
      const result = readVoteLinks({ LISTING_VOTE_LINKS_ENABLED: flag, LISTING_VOTE_LINKS: valid });
      expect(result).toEqual({ enabled: false, links: [], invalid: [] });
    }
  });

  test('parses comma or newline separated Label|URL entries when enabled', () => {
    const result = readVoteLinks({ LISTING_VOTE_LINKS_ENABLED: 'true', LISTING_VOTE_LINKS: valid.replace(',', '\n ') });
    expect(result.enabled).toBe(true);
    expect(result.invalid).toEqual([]);
    expect(result.links).toEqual([
      { label: 'CoinSniper', url: 'https://coinsniper.net/coin/95195' },
      { label: 'CoinMooner', url: 'https://coinmooner.com/coins/epowerx-on-base-epwx' },
    ]);
  });

  test('returns empty links without throwing when the list is missing or blank', () => {
    expect(readVoteLinks({ LISTING_VOTE_LINKS_ENABLED: 'true' })).toEqual({ enabled: true, links: [], invalid: [] });
    expect(readVoteLinks({ LISTING_VOTE_LINKS_ENABLED: 'true', LISTING_VOTE_LINKS: ' , ,' })).toEqual({ enabled: true, links: [], invalid: [] });
  });

  test('rejects unsafe or malformed entries individually and keeps the valid ones', () => {
    const list = [
      'NoSeparator https://a.example',
      'Plain|http://insecure.example/vote',
      'Script|javascript:alert(1)',
      'Creds|https://user:pass@site.example/vote',
      'Bad<Label>|https://site.example/one',
      'Quote|https://site.example/"onmouseover=x',
      `TooLong|https://site.example/${'a'.repeat(200)}`,
      `${'L'.repeat(33)}|https://site.example/two`,
      'Good One|https://site.example/good',
      'Good Two|https://site.example/good2',
    ].join(',');
    const result = readVoteLinks({ LISTING_VOTE_LINKS_ENABLED: 'true', LISTING_VOTE_LINKS: list });
    expect(result.links).toEqual([
      { label: 'Good One', url: 'https://site.example/good' },
      { label: 'Good Two', url: 'https://site.example/good2' },
    ]);
    expect(result.invalid).toEqual([
      { index: 0, reason: 'MISSING_SEPARATOR' },
      { index: 1, reason: 'URL_PROTOCOL' },
      { index: 2, reason: 'URL_PROTOCOL' },
      { index: 3, reason: 'URL_USERINFO' },
      { index: 4, reason: 'LABEL_CHARS' },
      { index: 5, reason: 'URL_CHARS' },
      { index: 6, reason: 'URL_LENGTH' },
      { index: 7, reason: 'LABEL_LENGTH' },
    ]);
  });

  test('drops duplicate URLs and caps the list at the maximum', () => {
    const entries = Array.from({ length: MAX_LINKS + 2 }, (_, i) => `Site ${i}|https://site${i}.example/vote`);
    entries.splice(1, 0, 'Dupe|https://site0.example/vote');
    const result = readVoteLinks({ LISTING_VOTE_LINKS_ENABLED: 'true', LISTING_VOTE_LINKS: entries.join(',') });
    expect(result.links).toHaveLength(MAX_LINKS);
    expect(result.links[0]).toEqual({ label: 'Site 0', url: 'https://site0.example/vote' });
    expect(result.links.map((l) => l.url)).not.toContain('https://site9.example/vote');
    expect(result.invalid).toEqual([
      { index: 1, reason: 'DUPLICATE_URL' },
      { index: MAX_LINKS + 1, reason: 'TOO_MANY' },
      { index: MAX_LINKS + 2, reason: 'TOO_MANY' },
    ]);
  });
});

describe('Telegram vote block rendering', () => {
  test('renders nothing for an empty or non-array list', () => {
    expect(renderTelegramVoteBlock([], escapeHtml)).toBe('');
    expect(renderTelegramVoteBlock(undefined, escapeHtml)).toBe('');
  });

  test('renders a header and one escaped anchor per link', () => {
    const block = renderTelegramVoteBlock([
      { label: 'CoinSniper', url: 'https://coinsniper.net/coin/95195' },
      { label: 'A & B', url: 'https://site.example/?a=1&b=2' },
    ], escapeHtml);
    expect(block.startsWith('\n<b>Support EPWX</b>')).toBe(true);
    expect(block).toContain('\u2022 <a href="https://coinsniper.net/coin/95195">CoinSniper</a>');
    expect(block).toContain('\u2022 <a href="https://site.example/?a=1&amp;b=2">A &amp; B</a>');
    expect(block).not.toMatch(/[^&]&[^a]/);
  });

  test('requires an escape function', () => {
    expect(() => renderTelegramVoteBlock([{ label: 'x', url: 'https://a.example' }])).toThrow(TypeError);
  });
});
