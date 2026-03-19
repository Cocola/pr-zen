// ==UserScript==
// @name         PR Zen
// @namespace    https://github.com/pr-zen
// @version      0.2.1
// @description  Floating navigator for noisy GitHub Pull Requests 🐙🧘
// @author       PR Zen
// @match        https://github.com/*/*/pull/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────────────────────

  const BOT_PATTERNS = [
    '[bot]', 'github-actions', 'dependabot', 'codecov', 'sonarcloud',
    'vercel', 'netlify', 'renovate', 'claude-code-review', 'copilot',
    'coderabbit', 'gemini-code-assist', 'codeclimate', 'snyk',
    'bors', 'rustbot', 'rust-timer', 'rust-log-analyzer', 'triagebot',
    'k8s-ci-robot', 'k8s-triage-robot', 'fejta-bot', 'typescript-bot',
    'libc-bot', 'rust-highfive', 'chromium-wpt-export-bot',
  ];

  const BORDER_COLOR = 'rgba(255,255,255,0.06)';

  const ALERT_KEYWORDS = [
    'failed', 'error', 'decreased', 'below threshold',
    'critical', 'vulnerability', 'blocked',
  ];

  const COLORS = {
    human: '#34d399',
    bot: '#94a3b8',
    alert: '#f87171',
    bg: '#1c1c1e',
    text: '#f5f5f7',
    muted: '#6b7280',
    highlight: '#6366f1',
  };

  const TYPE_LABELS = { human: 'Reviews', bot: 'Bots', alert: 'Alerts' };

  const MIN_BOT_COMMENTS = 3;
  const HIGHLIGHT_DURATION = 2000;
  const PANEL_MAX_HEIGHT = 480;
  const STICKY_HEADER_OFFSET = 80;

  // ── Classification ─────────────────────────────────────────────────────────

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
    return BOT_PATTERNS.some(p => name.includes(p));
  }

  function isAlert(commentEl) {
    const body = commentEl.querySelector('.comment-body, .markdown-body');
    if (!body) return false;
    const text = body.textContent.toLowerCase();
    return ALERT_KEYWORDS.some(kw => text.includes(kw));
  }

  function extractTitle(item) {
    const body = item.querySelector('.comment-body, .markdown-body');
    if (!body) return '';

    // Try to extract a heading (h1-h3) as the title
    const heading = body.querySelector('h1, h2, h3');
    if (heading) {
      const text = heading.textContent.trim();
      if (text.length > 2) return text;
    }

    // Try first <strong> or <b> as fallback title
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

  // ── Grouping consecutive identical bot entries ─────────────────────────────

  function groupEntries(entries) {
    const grouped = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];

      // Only group bot entries (not alerts, not humans)
      if (entry.type === 'bot') {
        // Look ahead for consecutive entries with same author + same title
        const siblings = [entry];
        while (
          i + 1 < entries.length &&
          entries[i + 1].type === 'bot' &&
          entries[i + 1].author === entry.author &&
          entries[i + 1].title === entry.title &&
          entry.title // only group if there's a title to match
        ) {
          i++;
          siblings.push(entries[i]);
        }

        if (siblings.length > 1) {
          // Create a group entry pointing to the latest one
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

  // ── UI ─────────────────────────────────────────────────────────────────────

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #przen-pill {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        background: ${COLORS.bg};
        color: ${COLORS.text};
        border-radius: 24px;
        padding: 10px 18px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        font-size: 13px;
        cursor: pointer;
        border: 1px solid ${BORDER_COLOR};
        box-shadow: 0 4px 24px rgba(0,0,0,0.24);
        display: flex;
        align-items: center;
        gap: 10px;
        user-select: none;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        line-height: 1;
      }
      #przen-pill:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.32);
      }
      #przen-pill .przen-stat {
        font-weight: 600;
        font-variant-numeric: tabular-nums;
      }
      #przen-pill .przen-sep {
        color: ${COLORS.muted};
        font-weight: 400;
      }

      #przen-panel {
        position: fixed;
        bottom: 72px;
        right: 24px;
        z-index: 99998;
        background: ${COLORS.bg};
        color: ${COLORS.text};
        border-radius: 16px;
        width: 380px;
        max-height: ${PANEL_MAX_HEIGHT}px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.36);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        font-size: 13px;
        display: flex;
        flex-direction: column;
        opacity: 0;
        transform: translateY(8px) scale(0.98);
        pointer-events: none;
        transition: opacity 0.2s ease, transform 0.2s ease;
      }
      #przen-panel.przen-open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      /* ── Scrollbar ── */
      #przen-panel-list {
        overflow-y: auto;
        max-height: ${PANEL_MAX_HEIGHT - 44}px;
        scrollbar-width: thin;
        scrollbar-color: transparent transparent;
        padding: 4px 0 8px;
      }
      #przen-panel-list:hover {
        scrollbar-color: rgba(255,255,255,0.15) transparent;
      }
      #przen-panel-list::-webkit-scrollbar {
        width: 6px;
      }
      #przen-panel-list::-webkit-scrollbar-track {
        background: transparent;
      }
      #przen-panel-list::-webkit-scrollbar-thumb {
        background: transparent;
        border-radius: 3px;
        transition: background 0.2s;
      }
      #przen-panel-list:hover::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.15);
      }
      #przen-panel-list::-webkit-scrollbar-thumb:hover {
        background: rgba(255,255,255,0.25);
      }

      /* ── Legend header ── */
      .przen-header {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 10px 16px 8px;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        flex-shrink: 0;
      }
      .przen-legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        color: ${COLORS.muted};
        font-weight: 500;
      }
      .przen-legend-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
      }
      .przen-legend-count {
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      /* ── Items ── */
      .przen-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .przen-item {
        padding: 8px 16px;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 3px;
        transition: background 0.15s ease;
        border-left: 3px solid transparent;
      }
      .przen-item:hover {
        background: rgba(255,255,255,0.06);
      }
      .przen-item.przen-active {
        background: rgba(255,255,255,0.08);
        border-left-color: ${COLORS.highlight};
      }
      .przen-item-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .przen-item-author {
        font-weight: 600;
        font-size: 13px;
      }
      .przen-item-badge {
        font-size: 10px;
        font-weight: 600;
        padding: 1px 5px;
        border-radius: 4px;
        background: rgba(255,255,255,0.08);
        color: ${COLORS.muted};
        flex-shrink: 0;
      }
      .przen-item-time {
        font-size: 11px;
        color: ${COLORS.muted};
        white-space: nowrap;
        flex-shrink: 0;
        margin-left: auto;
      }
      .przen-item-preview {
        color: ${COLORS.muted};
        font-size: 12px;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        padding-left: 16px;
      }

      .przen-highlight {
        outline: 2px solid ${COLORS.highlight};
        outline-offset: 2px;
        border-radius: 6px;
        transition: outline-color ${HIGHLIGHT_DURATION}ms ease;
      }
      .przen-highlight-fade {
        outline-color: transparent;
      }

      .przen-empty {
        color: ${COLORS.muted};
        padding: 24px 16px;
        text-align: center;
        font-style: italic;
      }
    `;
    document.head.appendChild(style);
  }

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
    parts.push('<span style="font-size:16px;line-height:1">🐙</span>');
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

  function renderItem(list, entry) {
    const color = COLORS[entry.type];
    const item = document.createElement('div');
    item.className = 'przen-item';
    entry.panelItem = item;

    // Row: dot + author + optional group badge + time
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

    // Legend header
    renderHeader(panel, counts);

    // Scrollable list
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
        setTimeout(() => {
          el.classList.add('przen-highlight-fade');
        }, 50);
        setTimeout(() => {
          el.classList.remove('przen-highlight', 'przen-highlight-fade');
        }, HIGHLIGHT_DURATION + 100);
      }, 100);
    };
    window.addEventListener('scroll', onScrollEnd, { passive: true });
    onScrollEnd();
  }

  // ── Main ───────────────────────────────────────────────────────────────────

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
    if (isRefreshing) return;
    isRefreshing = true;

    try {
      const { entries, counts } = classifyComments();
      const totalBots = counts.bot + counts.alert;

      if (totalBots < MIN_BOT_COMMENTS) {
        if (pill) pill.style.display = 'none';
        if (panel) { panel.classList.remove('przen-open'); }
        return;
      }

      if (!pill) {
        injectStyles();
        pill = createPill();
        panel = createPanel();
        pill.addEventListener('click', (e) => {
          e.stopPropagation();
          togglePanel();
        });
        panel.addEventListener('click', (e) => {
          e.stopPropagation();
        });
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

  // Close panel on outside click
  document.addEventListener('mousedown', (e) => {
    if (!isOpen || !pill || !panel) return;
    if (pill.contains(e.target) || panel.contains(e.target)) return;
    closePanel();
  });

  // Keyboard shortcut Alt+Z
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.key === 'z') {
      e.preventDefault();
      if (pill && pill.style.display !== 'none') {
        togglePanel();
      }
    }
    // Escape to close
    if (e.key === 'Escape' && isOpen) {
      closePanel();
    }
  });

  // Initial run
  refresh();

  // MutationObserver for GitHub SPA (Turbo) navigation
  let debounceTimer = null;
  const observer = new MutationObserver((mutations) => {
    const isOwnMutation = mutations.every(m => {
      const t = m.target;
      if (t.id === 'przen-pill' || t.id === 'przen-panel' || t.id === 'przen-panel-list') return true;
      if (t.closest && (t.closest('#przen-pill') || t.closest('#przen-panel'))) return true;
      if (m.type === 'attributes' && m.attributeName === 'class') {
        const cl = t.className || '';
        if (cl.includes('przen-highlight')) return true;
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

  const target = document.querySelector('#discussion_bucket') || document.body;
  observer.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  document.addEventListener('turbo:load', () => {
    if (/\/pull\/\d+/.test(location.pathname)) {
      cleanup();
      setTimeout(refresh, 300);
    } else {
      cleanup();
    }
  });
})();
