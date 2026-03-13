'use strict';

// ── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG = {
  enabled: true,
  minBotComments: 3,
  botPatterns: [
    '[bot]', 'github-actions', 'dependabot', 'codecov', 'sonarcloud',
    'vercel', 'netlify', 'renovate', 'claude-code-review', 'copilot',
  ],
  alertKeywords: [
    'failed', 'error', 'decreased', 'below threshold',
    'critical', 'vulnerability', 'blocked',
  ],
};

const COLORS = {
  human: '#34d399',
  bot: '#94a3b8',
  alert: '#f87171',
  muted: '#6b7280',
};

const TYPE_LABELS = { human: 'Reviews', bot: 'Bots', alert: 'Alerts' };
const HIGHLIGHT_DURATION = 2000;
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
    if (changes.enabled) {
      changes.enabled.newValue ? refresh() : cleanup();
    } else {
      refresh();
    }
  });
}

// ── Classification ───────────────────────────────────────────────────────────

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

function isAlert(commentEl) {
  const body = commentEl.querySelector('.comment-body, .markdown-body');
  if (!body) return false;
  const text = body.textContent.toLowerCase();
  return config.alertKeywords.some(kw => text.includes(kw));
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

function classifyComments() {
  const timelineItems = document.querySelectorAll('.js-timeline-item');
  const entries = [];
  const counts = { human: 0, bot: 0, alert: 0 };
  const seen = new Set();

  timelineItems.forEach(wrapper => {
    const item = wrapper.querySelector('.timeline-comment') ||
                 wrapper.querySelector('.TimelineItem');
    if (!item || seen.has(item)) return;
    seen.add(item);

    const authorEl = item.querySelector('.author, [data-hovercard-type="user"]');
    if (!authorEl) return;

    const body = item.querySelector('.comment-body, .markdown-body');
    const rawText = body ? body.textContent.trim().replace(/\s+/g, ' ') : '';
    if (!rawText) return;

    const author = authorEl.textContent.trim();
    const title = extractTitle(item);
    const preview = title || rawText.slice(0, 120);

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
  pill.title = 'PR Zen — Toggle navigator (Alt+Z)';
  document.body.appendChild(pill);
  return pill;
}

function createPanel() {
  const panel = document.createElement('div');
  panel.id = 'przen-panel';
  document.body.appendChild(panel);
  return panel;
}

function updatePill(pill, counts) {
  const parts = [];
  const iconUrl = chrome?.runtime?.getURL ? chrome.runtime.getURL('icons/icon-48.png') : '';
  if (iconUrl) {
    parts.push(`<img class="przen-pill-icon" src="${iconUrl}" alt="PR Zen">`);
  } else {
    parts.push('<span style="font-size:16px;line-height:1">🐙</span>');
  }
  if (counts.human) {
    parts.push(`<span class="przen-stat" style="color:${COLORS.human}">${counts.human} review${counts.human > 1 ? 's' : ''}</span>`);
  }
  if (counts.bot) {
    if (parts.length > 1) parts.push('<span class="przen-sep">&middot;</span>');
    parts.push(`<span class="przen-stat" style="color:${COLORS.bot}">${counts.bot} bot${counts.bot > 1 ? 's' : ''}</span>`);
  }
  if (counts.alert) {
    if (parts.length > 1) parts.push('<span class="przen-sep">&middot;</span>');
    parts.push(`<span class="przen-stat" style="color:${COLORS.alert}">${counts.alert} alert${counts.alert > 1 ? 's' : ''}</span>`);
  }
  pill.innerHTML = parts.join('');
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
    text.innerHTML = `<span class="przen-legend-count">${counts[type]}</span> ${label}`;

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
  item.className = 'przen-item';
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

  const authorSpan = document.createElement('span');
  authorSpan.className = 'przen-item-author';
  authorSpan.textContent = entry.author;
  row.appendChild(authorSpan);

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

  const previewSpan = document.createElement('div');
  previewSpan.className = 'przen-item-preview';
  previewSpan.textContent = entry.preview;

  item.appendChild(row);
  item.appendChild(previewSpan);

  item.addEventListener('click', () => {
    setActiveItem(item);
    scrollToAndHighlight(entry.el);
  });

  list.appendChild(item);
}

function updatePanel(panel, entries, counts) {
  panel.innerHTML = '';
  itemIndex = 0;
  renderHeader(panel, counts);

  const list = document.createElement('div');
  list.id = 'przen-panel-list';

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

function scrollToAndHighlight(el) {
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
let isOpen = false;
let isRefreshing = false;

function openPanel() {
  if (isOpen) return;
  isOpen = true;
  if (panel) panel.classList.add('przen-open');
}

function closePanel() {
  if (!isOpen) return;
  isOpen = false;
  if (panel) panel.classList.remove('przen-open');
}

function togglePanel() {
  isOpen ? closePanel() : openPanel();
}

function refresh() {
  if (isRefreshing || !config.enabled) return;
  isRefreshing = true;

  try {
    const { entries, counts } = classifyComments();
    const totalBots = counts.bot + counts.alert;

    if (totalBots < config.minBotComments) {
      if (pill) pill.style.display = 'none';
      if (panel) panel.classList.remove('przen-open');
      return;
    }

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
    updatePill(pill, counts);
    updatePanel(panel, entries, counts);
  } finally {
    isRefreshing = false;
  }
}

function cleanup() {
  if (pill) { pill.remove(); pill = null; }
  if (panel) { panel.remove(); panel = null; }
  isOpen = false;
}

// Close on outside click
document.addEventListener('mousedown', (e) => {
  if (!isOpen || !pill || !panel) return;
  if (pill.contains(e.target) || panel.contains(e.target)) return;
  closePanel();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 'z') {
    e.preventDefault();
    if (pill && pill.style.display !== 'none') togglePanel();
  }
  if (e.key === 'Escape' && isOpen) closePanel();
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
