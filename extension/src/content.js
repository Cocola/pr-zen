'use strict';

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  enabled: true,
  minBotComments: 3,
  botPatterns: [
    '[bot]', 'github-actions', 'dependabot', 'codecov', 'sonarcloud',
    'vercel', 'netlify', 'renovate', 'claude-code-review', 'copilot',
    'coderabbit', 'gemini-code-assist', 'codeclimate', 'snyk',
    'bors', 'rustbot', 'rust-timer', 'rust-log-analyzer', 'triagebot',
    'k8s-ci-robot', 'k8s-triage-robot', 'fejta-bot', 'typescript-bot',
    'libc-bot', 'rust-highfive', 'chromium-wpt-export-bot',
  ],
  alertKeywords: [
    'failed', 'error', 'decreased', 'below threshold',
    'critical', 'vulnerability', 'blocked',
  ],
};

const COLORS = {
  human: 'var(--przen-human)',
  bot: 'var(--przen-bot)',
  alert: 'var(--przen-alert)',
  muted: 'var(--przen-muted)',
};

const TYPE_LABELS = { human: 'Reviews', bot: 'Bots', alert: 'Alerts' };
const HIGHLIGHT_DURATION = 2000;
const LOGO_SVG = '<svg width="24" height="24" viewBox="0 0 455 455" fill="currentColor"><path d="M221.199 284.106c6.965-.41 18.68-1.26 24.205 2.945 14.89 11.44-8.815 18.98-10.19 22.73-5.45 14.86 18.615 24.665 30.38 12.825 2.515-2.525 9.055-9.825 13.02-7.42 3.59 2.175 3.615 5.875 1.215 9.135-11.045 14.2-32.12 19.31-47.165 8.235l-4.185-4.28c-.84.945-1.88 2.18-2.79 2.995-12.959 11.635-34.652 8.435-46.008-3.945-2.725-2.97-6.433-8.57-2.009-11.795 6.45-4.6 9.89 5.345 14.268 8.135 7.21 4.6 18.895 6.315 25.684.115 4.47-4.08 4.73-8.75 4.955-14.365-6.155-2.665-13.587-6.795-14.795-13.955-1.43-8.48 7.098-10.705 13.415-11.355M274.439 253.816c8.145-.025 9.075 11.3 19.45 13.95 7.5 2.035 17.89.795 23.465-5.02 3.45-3.595 6.005-10.89 12.55-8.455 3.89 3.45 1.8 7.875-.44 11.44-9.93 11.675-17.605 13.73-32.785 13.335-10.295-.27-35.805-16.685-22.24-25.25M128.419 253.861c7.79-.195 9.827 11.56 19.265 13.645 8.055 1.78 16.16 2.47 22.773-3.89 3.689-3.545 7.528-11.77 13.599-9.525 3.797 3.335 1.726 8.175-.493 11.635-8.257 9.77-17.241 14.335-30.302 13.535a35.45 35.45 0 0 1-24.854-12.165c-4.005-4.665-6.102-9.385.012-13.235"/><path d="M84.271 69.003c26.321.837 53.475 20.217 73.387 36.044 27.553-8.259 49.249-11.241 78.046-10.65 21.56.516 42.94 4.068 63.51 10.55 5.69-3.929 11.15-8.836 16.89-12.79 10.701-7.376 54.745-33.996 64.025-18.096 8.72 14.938 10.5 42.187 8.655 59.69-.52 7.087-2.385 13.995-2.96 20.529 22.6 30.858 32.01 72.376 25.96 110.006-.79 4.94-2.115 10.945-2.66 15.74 6.558-.127 13.582.777 20.112 1.618l.408.052c6.815.87 13.805 1.691 20.57 2.83 4.23.715 6.525 5.595 2.765 8.53-1.17.98-3.645.866-5.055.886-13.995-1.001-27.83-4.211-41.935-3.871-1.85 6.005-3.645 10.465-6.014 16.275 7.285 1.62 46.144 9.256 46.444 17.64-1.595 4.24-4.47 4.59-8.449 3.415-14.205-4.2-28.816-9.945-43.606-11.725-17.95 32.235-50.45 48.62-83.78 59.92l-12.175 3.335c-14.165 4.54-40.285 5.856-55.08 6.926-25.405.755-59.913-.45-84.502-7.005l-12.949-3.231-.506-.22c-6.947-2.984-14.761-4.96-21.892-8.19-28.058-12.71-44.432-26.195-61.145-51.325-15.862 2.12-30.226 7.74-45.525 11.955-6.64 1.83-7.622-6.434-5.287-7.614 13.657-6.91 30.77-9.876 45.41-14.271a182 182 0 0 1-5.908-15.655c-14.95-.155-29.444 2.85-44.292 3.69-1.69.095-2.72-.425-3.96-1.56-1.32-2.8-1.202-6.565 2.376-7.39 13.856-3.185 28.426-3.745 42.53-5.43-9.288-46.086-3.884-86.876 23.837-125.788-5.615-24.288-6.315-45.336.72-69.652 1.448-5.008 5.82-15.366 12.035-15.168m110.054 139.493c-11.182-1.699-31.868-5.825-42.722-3.906-66.585 7.784-74.68 99.997-25.474 135.646 38.176 27.66 83.54 36.17 129.64 29.94a176.5 176.5 0 0 0 43.26-11.675c25.775-11.78 47.865-26.305 58.245-54.189 13.245-34.725 1.005-82.143-36.07-96.114-20.46-7.709-40.915-2.228-61.63.784-22.34 3.247-42.985 2.898-65.249-.486m171.9 103.74c-9.14 17.845-15.801 27.2-32.816 39.23-4.11 2.905-11.69 7.51-15.21 10.395l12.761-5.169c20.84-9.16 39.135-23.166 51.88-42.21-3.875-.55-13.23-1.481-16.615-2.246m-281.815.956-10.141 1.064c13.417 21.215 34.416 35.62 57.442 44.75 1.637.66 3.842 1.76 5.522 1.735-2.99-2.63-10.521-6.459-14.24-9.059-15.585-10.895-23.73-22.381-31.813-39.04zm-21.912-22.375c1.749 4.479 3.375 8.985 5.684 13.209 5.882-1.075 12.154-1.624 18.12-2.264l.768-.471c-.112-2.705-1.281-6.02-2.064-8.7-6.397-.615-16.261-1.774-22.508-1.774m330.751-.186c-5.92.43-15.87 1.185-21.56 2.375-.725 2.605-1.785 5.446-1.525 8.051 1 1.185.36.72 2.28.965 4.53.51 12.051 1.139 16.281 1.989 2.049-3.945 4.24-8.005 5.16-12.385-.43-.96-.101-.745-.636-.995m-22.18-210.904c-19.26 2.4-37.47 13.194-52.995 24.444-4.5 3.259-12.19 9.953-16.59 12.479-56.875-15.365-89.043-15.951-146.244.174-17.382-13.671-46.732-36.233-69.46-36.983-2.951 4.906-4.318 10.608-5.426 16.186-4.114 20.719-2.44 38.916 2.483 59.144-2.632 6.737-10.375 16.016-14.023 23.462a146.35 146.35 0 0 0-9.87 100.783c7.846.65 16.831 1.82 24.55 2.21-.514-26.635 4.666-47.453 23.223-67.327 32.823-35.153 77.221-15.23 117.588-13.852 42.499 1.451 89.084-22.803 124.389 12.203 7.57 7.332 13.51 16.731 17.755 26.294 6.475 17.452 7.115 24.037 6.825 42.677 7.74-.59 17.01-1.26 24.62-2.26 8.68-38.562 5.845-75.35-15.195-109.959-2.645-4.351-6.105-9.122-8.38-13.564 4.19-23.638 8.545-53.748-3.25-76.111"/></svg>';
const AUTO_OPEN_MIN_WIDTH = 1600;
const STICKY_HEADER_OFFSET = 80;

let config = { ...DEFAULT_CONFIG };

// ── Load config from storage ─────────────────────────────────────────────────

function loadConfig() {
  return new Promise(resolve => {
    if (chrome?.storage?.sync) {
      chrome.storage.sync.get(DEFAULT_CONFIG, (stored) => {
        config = { ...DEFAULT_CONFIG, ...stored };
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Listen for config changes from popup
if (chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes) => {
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key in config) config[key] = newValue;
    }
    lastDataHash = ''; // Force rebuild on config change
    if (changes.enabled) {
      changes.enabled.newValue ? refresh() : cleanup();
    } else {
      refresh();
    }
  });
}

// ── Classification ───────────────────────────────────────────────────────────

/**
 * Detect if a comment author is a bot by checking for a [bot] badge
 * in the timeline header or matching against configured bot patterns.
 * @param {Element|null} authorEl - The author link element
 * @returns {boolean}
 */
function isBot(authorEl) {
  if (!authorEl) return false;
  const name = authorEl.textContent.trim().toLowerCase();
  const parent = authorEl.closest('.timeline-comment-header') ||
                 authorEl.closest('.TimelineItem-header') ||
                 authorEl.parentElement;
  if (parent) {
    const badge = parent.querySelector('.Label--secondary, .Label');
    if (badge && badge.textContent.trim().toLowerCase() === 'bot') return true;
  }
  return config.botPatterns.some(p => name.includes(p));
}

/**
 * Check if a bot comment contains alert keywords in headings, bold text,
 * or the first paragraph. Avoids matching code snippets.
 * @param {Element} commentEl - The timeline comment element
 * @returns {boolean}
 */
function isAlert(commentEl) {
  const body = commentEl.querySelector('.comment-body, .markdown-body');
  if (!body) return false;

  // Check headings and bold text first (high signal)
  const headings = body.querySelectorAll('h1, h2, h3, strong, b');
  const headingText = [...headings].map(h => h.textContent.toLowerCase()).join(' ');
  if (config.alertKeywords.some(kw => headingText.includes(kw))) return true;

  // Check first paragraph only (summary area, avoids matching code snippets)
  const firstP = body.querySelector('p');
  if (firstP) {
    const pText = firstP.textContent.toLowerCase();
    if (config.alertKeywords.some(kw => pText.includes(kw))) return true;
  }

  return false;
}

function extractTitle(item) {
  const body = item.querySelector('.comment-body, .markdown-body');
  if (!body) return '';
  const heading = body.querySelector('h1, h2, h3');
  if (heading) {
    const text = heading.textContent.trim();
    if (text.length > 2) return text;
  }
  const strong = body.querySelector('strong, b');
  if (strong) {
    const text = strong.textContent.trim();
    if (text.length > 2 && text.length < 80) return text;
  }
  return '';
}

/**
 * Walk GitHub's timeline DOM to classify each comment as human, bot, or alert.
 * Deduplicates via a seen-Set and extracts metadata (author, title, preview, time).
 * @returns {{ entries: Array<{el: Element, author: string, title: string, preview: string, timestamp: string, timeAgo: string, type: 'human'|'bot'|'alert'}>, counts: {human: number, bot: number, alert: number} }}
 */
function classifyComments() {
  const timelineItems = document.querySelectorAll('.js-timeline-item');
  const entries = [];
  const counts = { human: 0, bot: 0, alert: 0 };
  const seen = new Set();

  timelineItems.forEach(wrapper => {
    const item = wrapper.querySelector('.timeline-comment') ||
                 wrapper.querySelector('.TimelineItem') ||
                 wrapper;
    if (seen.has(item)) return;

    const authorEl = item.querySelector('.author, [data-hovercard-type="user"]');
    if (!authorEl) return;

    const body = item.querySelector('.comment-body, .markdown-body');
    const rawText = body ? body.textContent.trim().replace(/\s+/g, ' ') : '';

    const author = authorEl.textContent.trim();
    const title = extractTitle(item);
    const preview = title || rawText.slice(0, 120) || 'Review';

    // Skip items with no useful content (commits, etc.) unless they're from a bot
    const botDetected = isBot(authorEl);
    if (!rawText && !botDetected) return;

    seen.add(item);

    const timeEl = item.querySelector('relative-time, time');
    const timestamp = timeEl
      ? (timeEl.getAttribute('datetime') || timeEl.getAttribute('title') || '')
      : '';
    const timeAgo = timeEl ? timeEl.textContent.trim() : '';

    let type = 'human';
    if (isBot(authorEl)) {
      type = isAlert(item) ? 'alert' : 'bot';
    }
    counts[type]++;

    entries.push({ el: item, author, title, preview, timestamp, timeAgo, type });
  });

  return { entries, counts };
}

// ── Grouping ─────────────────────────────────────────────────────────────────

/**
 * Collapse consecutive bot comments with the same author and title into
 * a single grouped entry. Mutates the loop index to skip merged items.
 * @param {Array} entries - Classified comment entries from classifyComments()
 * @returns {Array} Grouped entries, where grouped items have `groupCount` and `groupEntries`
 */
function groupEntries(entries) {
  const grouped = [];

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    if (entry.type === 'bot') {
      const siblings = [entry];
      while (
        i + 1 < entries.length &&
        entries[i + 1].type === 'bot' &&
        entries[i + 1].author === entry.author &&
        entries[i + 1].title === entry.title &&
        entry.title
      ) {
        i++;
        siblings.push(entries[i]);
      }

      if (siblings.length > 1) {
        grouped.push({
          ...siblings[siblings.length - 1],
          groupCount: siblings.length,
          groupEntries: siblings,
        });
      } else {
        grouped.push(entry);
      }
    } else {
      grouped.push(entry);
    }
  }

  return grouped;
}

// ── UI ───────────────────────────────────────────────────────────────────────

function createPill() {
  const pill = document.createElement('div');
  pill.id = 'przen-pill';
  pill.setAttribute('role', 'button');
  pill.setAttribute('tabindex', '0');
  pill.setAttribute('aria-label', 'PR Zen — Toggle navigator (Alt+Z)');
  pill.setAttribute('aria-expanded', 'false');
  pill.setAttribute('aria-controls', 'przen-panel');
  pill.setAttribute('aria-live', 'polite');
  document.body.appendChild(pill);
  return pill;
}

function createPanel() {
  const panel = document.createElement('div');
  panel.id = 'przen-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'PR Zen navigator');
  document.body.appendChild(panel);
  return panel;
}

/**
 * Rebuild the pill DOM with logo and colored stat labels.
 * @param {HTMLElement} pill - The pill element
 * @param {{human: number, bot: number, alert: number}} counts
 */
function updatePill(pill, counts) {
  pill.textContent = '';
  const logo = document.createElement('span');
  logo.className = 'przen-pill-logo';
  logo.innerHTML = LOGO_SVG;
  pill.appendChild(logo);

  const entries = [
    { count: counts.human, color: COLORS.human, label: 'review' },
    { count: counts.bot, color: COLORS.bot, label: 'bot' },
    { count: counts.alert, color: COLORS.alert, label: 'alert' },
  ];
  let first = true;
  for (const { count, color, label } of entries) {
    if (!count) continue;
    if (!first) {
      const sep = document.createElement('span');
      sep.className = 'przen-sep';
      sep.textContent = '\u00b7';
      pill.appendChild(sep);
    }
    const stat = document.createElement('span');
    stat.className = 'przen-stat';
    stat.style.color = color;
    stat.textContent = `${count} ${label}${count > 1 ? 's' : ''}`;
    pill.appendChild(stat);
    first = false;
  }
}

function renderHeader(panel, counts) {
  const header = document.createElement('div');
  header.className = 'przen-header';

  for (const [type, label] of Object.entries(TYPE_LABELS)) {
    if (!counts[type]) continue;
    const item = document.createElement('div');
    item.className = 'przen-legend-item';

    const dot = document.createElement('span');
    dot.className = 'przen-legend-dot';
    dot.style.background = COLORS[type];

    const text = document.createElement('span');
    const countSpan = document.createElement('span');
    countSpan.className = 'przen-legend-count';
    countSpan.textContent = counts[type];
    text.appendChild(countSpan);
    text.appendChild(document.createTextNode(` ${label}`));

    item.appendChild(dot);
    item.appendChild(text);
    header.appendChild(item);
  }

  panel.appendChild(header);
}

let itemIndex = 0;

function renderItem(list, entry) {
  const color = COLORS[entry.type];
  const item = document.createElement('div');
  item.className = `przen-item${entry.type === 'alert' ? ' przen-item-alert' : ''}`;
  item.setAttribute('role', 'option');
  item.setAttribute('tabindex', '-1');
  item.setAttribute('aria-label', `${entry.type}: ${entry.title || entry.author} — ${entry.preview.slice(0, 60)}`);
  // Stagger delay: cap at 15 items (450ms max) so long lists don't feel slow
  const delay = Math.min(itemIndex, 15) * 30;
  item.style.animationDelay = `${delay}ms`;
  itemIndex++;
  entry.panelItem = item;

  const row = document.createElement('div');
  row.className = 'przen-item-row';

  const dot = document.createElement('span');
  dot.className = 'przen-dot';
  dot.style.background = color;
  row.appendChild(dot);

  // Title is the primary info (e.g. "Review Claude", "Vercel Preview")
  const titleText = entry.title || entry.author;
  const titleSpan = document.createElement('span');
  titleSpan.className = 'przen-item-title';
  titleSpan.textContent = titleText;
  row.appendChild(titleSpan);

  if (entry.groupCount > 1) {
    const badge = document.createElement('span');
    badge.className = 'przen-item-badge';
    badge.textContent = `\u00d7${entry.groupCount}`;
    row.appendChild(badge);
  }

  if (entry.timeAgo) {
    const timeSpan = document.createElement('span');
    timeSpan.className = 'przen-item-time';
    timeSpan.textContent = entry.timeAgo;
    if (entry.timestamp) timeSpan.title = new Date(entry.timestamp).toLocaleString();
    row.appendChild(timeSpan);
  }

  // Secondary line: author (if title exists) or preview
  const secondarySpan = document.createElement('div');
  secondarySpan.className = 'przen-item-secondary';
  if (entry.title) {
    secondarySpan.textContent = entry.author;
  } else {
    secondarySpan.textContent = entry.preview;
  }

  item.appendChild(row);
  item.appendChild(secondarySpan);

  item.addEventListener('click', () => {
    setActiveItem(item);
    scrollToAndHighlight(entry.el);
  });

  list.appendChild(item);
}

/**
 * Rebuild the panel: header legend + scrollable list of grouped entries.
 * @param {HTMLElement} panel
 * @param {Array} entries - Classified entries from classifyComments()
 * @param {{human: number, bot: number, alert: number}} counts
 */
function updatePanel(panel, entries, counts) {
  panel.innerHTML = '';
  itemIndex = 0;
  renderHeader(panel, counts);

  const list = document.createElement('div');
  list.id = 'przen-panel-list';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'PR comments');
  list.setAttribute('tabindex', '0');

  if (!entries.length) {
    const empty = document.createElement('div');
    empty.className = 'przen-empty';
    empty.textContent = 'No comments found';
    list.appendChild(empty);
  } else {
    const grouped = groupEntries(entries);
    grouped.forEach(entry => renderItem(list, entry));
  }

  panel.appendChild(list);
}

function setActiveItem(panelItem) {
  if (!panel) return;
  panel.querySelectorAll('.przen-item.przen-active').forEach(el => {
    el.classList.remove('przen-active');
  });
  panelItem.classList.add('przen-active');
  panelItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearHighlights() {
  document.querySelectorAll('.przen-highlight, .przen-highlight-fade').forEach(el => {
    el.classList.remove('przen-highlight', 'przen-highlight-fade');
  });
}

/**
 * Smooth-scroll to a comment element and apply a temporary highlight outline.
 * Uses a scroll-end debounce to avoid highlighting during momentum scroll.
 * @param {Element} el - The target comment element in the GitHub timeline
 */
function scrollToAndHighlight(el) {
  clearHighlights();

  const top = el.getBoundingClientRect().top + window.scrollY - STICKY_HEADER_OFFSET;
  window.scrollTo({ top, behavior: 'smooth' });

  let scrollTimeout;
  const onScrollEnd = () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      window.removeEventListener('scroll', onScrollEnd);
      el.classList.add('przen-highlight');
      setTimeout(() => el.classList.add('przen-highlight-fade'), 50);
      setTimeout(() => {
        el.classList.remove('przen-highlight', 'przen-highlight-fade');
      }, HIGHLIGHT_DURATION + 100);
    }, 100);
  };
  window.addEventListener('scroll', onScrollEnd, { passive: true });
  onScrollEnd();
}

// ── Main ─────────────────────────────────────────────────────────────────────

let pill = null;
let panel = null;
let wasOffConversation = false;
let isOpen = false;
let isRefreshing = false;
let lastDataHash = '';
let hasAnimated = false;
let lastCounts = null;

const CLOSE_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>';

/**
 * Animate the pill between its full state (logo + stats) and mini state (close icon).
 * Measures widths before/after to enable CSS width transitions.
 * @param {boolean} toMini - true to collapse to circle, false to expand back
 */
function morphPill(toMini) {
  if (!pill) return;
  if (toMini) {
    // Capture current width before collapsing
    const currentWidth = pill.offsetWidth;
    pill.style.width = currentWidth + 'px';
    pill.innerHTML = CLOSE_SVG;
    // Force layout so the browser registers the explicit width
    pill.offsetWidth;    pill.classList.add('przen-pill-mini');
    pill.style.width = '';
  } else {
    // Expand: measure target width, then animate to it
    pill.classList.remove('przen-pill-mini');
    if (lastCounts) {
      updatePill(pill, lastCounts);
      pill.classList.toggle('przen-pill-alert', lastCounts.alert > 0);
    }
    // Measure natural width
    const targetWidth = pill.scrollWidth;
    // Start from mini size
    pill.style.width = '40px';
    pill.offsetWidth;    pill.style.width = targetWidth + 'px';
    // Clean up after transition
    const onEnd = () => {
      pill.style.width = '';
      pill.removeEventListener('transitionend', onEnd);
    };
    pill.addEventListener('transitionend', onEnd);
  }
}

/** Open the panel and morph the pill into a mini close button. */
function openPanel() {
  if (isOpen) return;
  isOpen = true;
  if (pill) pill.setAttribute('aria-expanded', 'true');
  morphPill(true);
  if (panel) {
    panel.classList.add('przen-open');
    if (!hasAnimated) {
      hasAnimated = true;
      panel.classList.add('przen-animating');
      setTimeout(() => panel.classList.remove('przen-animating'), 600);
    }
    const firstItem = panel.querySelector('.przen-item');
    if (firstItem) setTimeout(() => firstItem.focus(), 150);
  }
}

/** Close the panel and restore the pill to its full stats display. */
function closePanel() {
  if (!isOpen) return;
  isOpen = false;
  if (pill) pill.setAttribute('aria-expanded', 'false');
  morphPill(false);
  if (panel) panel.classList.remove('przen-open');
  if (pill) setTimeout(() => pill.focus(), 200);
}

function togglePanel() {
  isOpen ? closePanel() : openPanel();
}

function isConversationTab() {
  // URL-based detection is more reliable than DOM selectors
  const path = location.pathname;
  if (/\/pull\/\d+\/(commits|files|checks|changes)/.test(path)) return false;
  return true;
}

/**
 * Main orchestrator: classify comments, update pill/panel, auto-open on
 * large screens. Guards against re-entrancy and skips if data hasn't changed.
 */
function refresh() {
  if (isRefreshing || !config.enabled) return;
  isRefreshing = true;

  try {
    const onConversation = isConversationTab();
    if (!onConversation) {
      if (pill) pill.style.display = 'none';
      if (panel) panel.classList.remove('przen-open');
      isOpen = false;
      wasOffConversation = true;
      return;
    }
    if (wasOffConversation) {
      lastDataHash = ''; // Force rebuild — DOM refs are stale after tab switch
      wasOffConversation = false;
    }

    const { entries, counts } = classifyComments();
    const total = counts.human + counts.bot + counts.alert;
    const totalBots = counts.bot + counts.alert;

    // Still loading — show spinner only if pill already exists
    if (total === 0) {
      if (pill) {
        pill.classList.add('przen-pill-muted');
        pill.innerHTML = '<span class="przen-spinner"></span>';
      }
      return;
    }

    if (totalBots < config.minBotComments) {
      if (pill) {
        pill.style.display = 'none';
        pill.classList.remove('przen-pill-muted');
      }
      if (panel) panel.classList.remove('przen-open');
      isOpen = false;
      return;
    }

    if (pill) pill.classList.remove('przen-pill-muted');

    if (!pill) {
      pill = createPill();
      panel = createPanel();
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePanel();
      });
      panel.addEventListener('click', (e) => e.stopPropagation());
    }

    pill.style.display = 'flex';

    // Skip rebuild if data hasn't changed
    const hash = entries.map(e => `${e.author}:${e.type}:${e.timestamp}`).join('|');
    if (hash === lastDataHash) return;
    const isUpdate = lastDataHash !== '';
    lastDataHash = hash;

    lastCounts = counts;
    if (!isOpen) {
      updatePill(pill, counts);
      pill.classList.toggle('przen-pill-alert', counts.alert > 0);
    }
    updatePanel(panel, entries, counts);
    if (isUpdate) {
      requestAnimationFrame(() => {
        pill.classList.add('przen-pill-pulse');
        setTimeout(() => pill.classList.remove('przen-pill-pulse'), 800);
      });
    } else if (!isOpen && window.innerWidth >= AUTO_OPEN_MIN_WIDTH) {
      openPanel();
    }
  } finally {
    isRefreshing = false;
  }
}

function cleanup() {
  if (pill) { pill.remove(); pill = null; }
  if (panel) { panel.remove(); panel = null; }
  isOpen = false;
  lastDataHash = '';
  hasAnimated = false;
}

// Close on outside click
document.addEventListener('mousedown', (e) => {
  if (!isOpen || !pill || !panel) return;
  if (pill.contains(e.target) || panel.contains(e.target)) return;
  closePanel();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.altKey && (e.code === 'KeyZ' || e.code === 'KeyW')) {
    e.preventDefault();
    if (pill && pill.style.display !== 'none') togglePanel();
  }
  if (e.key === 'Escape' && isOpen) closePanel();

  // Arrow key navigation within panel
  if (!isOpen || !panel) return;
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Enter') return;

  const items = [...panel.querySelectorAll('.przen-item')];
  if (!items.length) return;

  const focused = document.activeElement;
  const idx = items.indexOf(focused);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    const next = idx < items.length - 1 ? idx + 1 : 0;
    items[next].focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    const prev = idx > 0 ? idx - 1 : items.length - 1;
    items[prev].focus();
  } else if (e.key === 'Enter' && idx >= 0) {
    e.preventDefault();
    items[idx].click();
  }
});

// MutationObserver for GitHub SPA
let debounceTimer = null;
const observer = new MutationObserver((mutations) => {
  const isOwnMutation = mutations.every(m => {
    const t = m.target;
    if (t.id === 'przen-pill' || t.id === 'przen-panel' || t.id === 'przen-panel-list') return true;
    if (t.closest && (t.closest('#przen-pill') || t.closest('#przen-panel'))) return true;
    if (m.type === 'attributes' && m.attributeName === 'class') {
      if ((t.className || '').includes('przen-highlight')) return true;
    }
    return false;
  });
  if (isOwnMutation) return;

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (/\/pull\/\d+/.test(location.pathname)) {
      refresh();
    } else {
      cleanup();
    }
  }, 500);
});

document.addEventListener('turbo:load', () => {
  if (/\/pull\/\d+/.test(location.pathname)) {
    cleanup();
    setTimeout(refresh, 300);
  } else {
    cleanup();
  }
});

// ── Init ─────────────────────────────────────────────────────────────────────

loadConfig().then(() => {
  if (!config.enabled) return;
  refresh();

  const target = document.querySelector('#discussion_bucket') || document.body;
  observer.observe(target, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });
});
