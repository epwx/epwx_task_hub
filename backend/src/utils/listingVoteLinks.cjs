'use strict';

const MAX_LINKS = 8;
const MAX_LABEL_LENGTH = 32;
const MAX_URL_LENGTH = 200;
const LABEL_PATTERN = /^[A-Za-z0-9 ._-]+$/;
const FORBIDDEN_URL_CHARS = /[<>"'\s]/;

function validateLabel(label) {
  if (!label || label.length > MAX_LABEL_LENGTH) return 'LABEL_LENGTH';
  if (!LABEL_PATTERN.test(label)) return 'LABEL_CHARS';
  return null;
}

function validateUrl(raw) {
  if (!raw || raw.length > MAX_URL_LENGTH) return 'URL_LENGTH';
  if (FORBIDDEN_URL_CHARS.test(raw)) return 'URL_CHARS';
  let url;
  try {
    url = new URL(raw);
  } catch {
    return 'URL_PARSE';
  }
  if (url.protocol !== 'https:') return 'URL_PROTOCOL';
  if (!url.hostname) return 'URL_HOST';
  if (url.username || url.password) return 'URL_USERINFO';
  return null;
}

// Parses LISTING_VOTE_LINKS ("Label|https://url,Label|https://url").
// Never throws: invalid entries are reported so the announcement path can log and continue.
function readVoteLinks(env = process.env) {
  const enabled = env.LISTING_VOTE_LINKS_ENABLED === 'true';
  const raw = typeof env.LISTING_VOTE_LINKS === 'string' ? env.LISTING_VOTE_LINKS : '';
  const links = [];
  const invalid = [];
  if (!enabled) return { enabled, links, invalid };

  const seen = new Set();
  raw.split(/[,\n]/).forEach((entry, index) => {
    const trimmed = entry.trim();
    if (!trimmed) return;
    const separator = trimmed.indexOf('|');
    if (separator === -1) {
      invalid.push({ index, reason: 'MISSING_SEPARATOR' });
      return;
    }
    const label = trimmed.slice(0, separator).trim();
    const url = trimmed.slice(separator + 1).trim();
    const reason = validateLabel(label) || validateUrl(url);
    if (reason) {
      invalid.push({ index, reason });
      return;
    }
    if (seen.has(url)) {
      invalid.push({ index, reason: 'DUPLICATE_URL' });
      return;
    }
    if (links.length >= MAX_LINKS) {
      invalid.push({ index, reason: 'TOO_MANY' });
      return;
    }
    seen.add(url);
    links.push({ label, url });
  });

  return { enabled, links, invalid };
}

function renderTelegramVoteBlock(links, escapeHtml) {
  if (!Array.isArray(links) || links.length === 0) return '';
  if (typeof escapeHtml !== 'function') throw new TypeError('escapeHtml function is required');
  return [
    '',
    '<b>Support EPWX</b> - one free vote a day on each site helps new users find us:',
    ...links.map((link) => `\u2022 <a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a>`),
  ].join('\n');
}

module.exports = {
  MAX_LINKS,
  MAX_LABEL_LENGTH,
  MAX_URL_LENGTH,
  readVoteLinks,
  renderTelegramVoteBlock,
};
