// ==UserScript==
// @name         PR Zen
// @namespace    https://github.com/pr-zen
// @version      0.3.0
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

  const BORDER_COLOR = 'rgba(255,255,255,0.12)';
  const AUTO_OPEN_MIN_WIDTH = 1600;
  const LOGO_SVG = '<svg width="24" height="24" viewBox="0 0 455 455" fill="currentColor"><path d="M221.199 284.106c6.965-.41 18.68-1.26 24.205 2.945 14.89 11.44-8.815 18.98-10.19 22.73-5.45 14.86 18.615 24.665 30.38 12.825 2.515-2.525 9.055-9.825 13.02-7.42 3.59 2.175 3.615 5.875 1.215 9.135-11.045 14.2-32.12 19.31-47.165 8.235l-4.185-4.28c-.84.945-1.88 2.18-2.79 2.995-12.959 11.635-34.652 8.435-46.008-3.945-2.725-2.97-6.433-8.57-2.009-11.795 6.45-4.6 9.89 5.345 14.268 8.135 7.21 4.6 18.895 6.315 25.684.115 4.47-4.08 4.73-8.75 4.955-14.365-6.155-2.665-13.587-6.795-14.795-13.955-1.43-8.48 7.098-10.705 13.415-11.355M274.439 253.816c8.145-.025 9.075 11.3 19.45 13.95 7.5 2.035 17.89.795 23.465-5.02 3.45-3.595 6.005-10.89 12.55-8.455 3.89 3.45 1.8 7.875-.44 11.44-9.93 11.675-17.605 13.73-32.785 13.335-10.295-.27-35.805-16.685-22.24-25.25M128.419 253.861c7.79-.195 9.827 11.56 19.265 13.645 8.055 1.78 16.16 2.47 22.773-3.89 3.689-3.545 7.528-11.77 13.599-9.525 3.797 3.335 1.726 8.175-.493 11.635-8.257 9.77-17.241 14.335-30.302 13.535a35.45 35.45 0 0 1-24.854-12.165c-4.005-4.665-6.102-9.385.012-13.235"/><path d="M84.271 69.003c26.321.837 53.475 20.217 73.387 36.044 27.553-8.259 49.249-11.241 78.046-10.65 21.56.516 42.94 4.068 63.51 10.55 5.69-3.929 11.15-8.836 16.89-12.79 10.701-7.376 54.745-33.996 64.025-18.096 8.72 14.938 10.5 42.187 8.655 59.69-.52 7.087-2.385 13.995-2.96 20.529 22.6 30.858 32.01 72.376 25.96 110.006-.79 4.94-2.115 10.945-2.66 15.74 6.558-.127 13.582.777 20.112 1.618l.408.052c6.815.87 13.805 1.691 20.57 2.83 4.23.715 6.525 5.595 2.765 8.53-1.17.98-3.645.866-5.055.886-13.995-1.001-27.83-4.211-41.935-3.871-1.85 6.005-3.645 10.465-6.014 16.275 7.285 1.62 46.144 9.256 46.444 17.64-1.595 4.24-4.47 4.59-8.449 3.415-14.205-4.2-28.816-9.945-43.606-11.725-17.95 32.235-50.45 48.62-83.78 59.92l-12.175 3.335c-14.165 4.54-40.285 5.856-55.08 6.926-25.405.755-59.913-.45-84.502-7.005l-12.949-3.231-.506-.22c-6.947-2.984-14.761-4.96-21.892-8.19-28.058-12.71-44.432-26.195-61.145-51.325-15.862 2.12-30.226 7.74-45.525 11.955-6.64 1.83-7.622-6.434-5.287-7.614 13.657-6.91 30.77-9.876 45.41-14.271a182 182 0 0 1-5.908-15.655c-14.95-.155-29.444 2.85-44.292 3.69-1.69.095-2.72-.425-3.96-1.56-1.32-2.8-1.202-6.565 2.376-7.39 13.856-3.185 28.426-3.745 42.53-5.43-9.288-46.086-3.884-86.876 23.837-125.788-5.615-24.288-6.315-45.336.72-69.652 1.448-5.008 5.82-15.366 12.035-15.168m110.054 139.493c-11.182-1.699-31.868-5.825-42.722-3.906-66.585 7.784-74.68 99.997-25.474 135.646 38.176 27.66 83.54 36.17 129.64 29.94a176.5 176.5 0 0 0 43.26-11.675c25.775-11.78 47.865-26.305 58.245-54.189 13.245-34.725 1.005-82.143-36.07-96.114-20.46-7.709-40.915-2.228-61.63.784-22.34 3.247-42.985 2.898-65.249-.486m171.9 103.74c-9.14 17.845-15.801 27.2-32.816 39.23-4.11 2.905-11.69 7.51-15.21 10.395l12.761-5.169c20.84-9.16 39.135-23.166 51.88-42.21-3.875-.55-13.23-1.481-16.615-2.246m-281.815.956-10.141 1.064c13.417 21.215 34.416 35.62 57.442 44.75 1.637.66 3.842 1.76 5.522 1.735-2.99-2.63-10.521-6.459-14.24-9.059-15.585-10.895-23.73-22.381-31.813-39.04zm-21.912-22.375c1.749 4.479 3.375 8.985 5.684 13.209 5.882-1.075 12.154-1.624 18.12-2.264l.768-.471c-.112-2.705-1.281-6.02-2.064-8.7-6.397-.615-16.261-1.774-22.508-1.774m330.751-.186c-5.92.43-15.87 1.185-21.56 2.375-.725 2.605-1.785 5.446-1.525 8.051 1 1.185.36.72 2.28.965 4.53.51 12.051 1.139 16.281 1.989 2.049-3.945 4.24-8.005 5.16-12.385-.43-.96-.101-.745-.636-.995m-22.18-210.904c-19.26 2.4-37.47 13.194-52.995 24.444-4.5 3.259-12.19 9.953-16.59 12.479-56.875-15.365-89.043-15.951-146.244.174-17.382-13.671-46.732-36.233-69.46-36.983-2.951 4.906-4.318 10.608-5.426 16.186-4.114 20.719-2.44 38.916 2.483 59.144-2.632 6.737-10.375 16.016-14.023 23.462a146.35 146.35 0 0 0-9.87 100.783c7.846.65 16.831 1.82 24.55 2.21-.514-26.635 4.666-47.453 23.223-67.327 32.823-35.153 77.221-15.23 117.588-13.852 42.499 1.451 89.084-22.803 124.389 12.203 7.57 7.332 13.51 16.731 17.755 26.294 6.475 17.452 7.115 24.037 6.825 42.677 7.74-.59 17.01-1.26 24.62-2.26 8.68-38.562 5.845-75.35-15.195-109.959-2.645-4.351-6.105-9.122-8.38-13.564 4.19-23.638 8.545-53.748-3.25-76.111"/></svg>';

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

  /**
   * Detect if a comment author is a bot by checking for a [bot] badge
   * in the timeline header or matching against configured bot patterns.
   * @param {Element|null} authorEl
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
    return BOT_PATTERNS.some(p => name.includes(p));
  }

  /**
   * Check if a bot comment contains alert keywords in headings, bold text,
   * or the first paragraph.
   * @param {Element} commentEl
   * @returns {boolean}
   */
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

  /**
   * Walk GitHub's timeline DOM to classify each comment as human, bot, or alert.
   * @returns {{ entries: Array, counts: {human: number, bot: number, alert: number} }}
   */
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

  /**
   * Collapse consecutive bot comments with the same author and title into
   * a single grouped entry.
   * @param {Array} entries
   * @returns {Array}
   */
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
        padding: 10px 18px 10px 12px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
        font-size: 13px;
        cursor: pointer;
        border: 1px solid ${BORDER_COLOR};
        box-shadow: 0 4px 24px rgba(0,0,0,0.24), 0 0 0 1px ${BORDER_COLOR};
        display: flex;
        align-items: center;
        gap: 10px;
        user-select: none;
        overflow: hidden;
        white-space: nowrap;
        transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                    padding 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                    border-radius 0.35s cubic-bezier(0.16, 1, 0.3, 1),
                    transform 0.15s ease,
                    box-shadow 0.15s ease;
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
      #przen-pill .przen-pill-logo {
        display: flex;
        align-items: center;
        flex-shrink: 0;
        line-height: 0;
        margin: -6px 0;
      }
      #przen-pill.przen-pill-mini {
        padding: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        justify-content: center;
        color: ${COLORS.muted};
      }
      #przen-pill.przen-pill-mini:hover {
        color: ${COLORS.text};
      }
      #przen-pill.przen-pill-mini svg {
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      #przen-pill.przen-pill-mini:hover svg {
        transform: rotate(90deg);
      }
      #przen-pill .przen-pill-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      #przen-pill.przen-pill-alert {
        border-color: ${COLORS.alert};
        box-shadow: 0 4px 24px rgba(0,0,0,0.32), 0 0 0 1px ${COLORS.alert};
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
      .przen-close {
        appearance: none;
        border: none;
        background: none;
        color: ${COLORS.muted};
        cursor: pointer;
        padding: 4px;
        margin-left: auto;
        line-height: 0;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: color 0.15s ease;
      }
      .przen-close:hover {
        color: ${COLORS.text};
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

  /**
   * Rebuild the pill DOM with logo and colored stat labels.
   * @param {HTMLElement} pill
   * @param {{human: number, bot: number, alert: number}} counts
   */
  function updatePill(pill, counts) {
    const parts = [];
    parts.push(`<span class="przen-pill-logo">${LOGO_SVG}</span>`);
    const entries = [
      { count: counts.human, color: COLORS.human, label: 'review' },
      { count: counts.bot, color: COLORS.bot, label: 'bot' },
      { count: counts.alert, color: COLORS.alert, label: 'alert' },
    ];
    for (const { count, color, label } of entries) {
      if (!count) continue;
      if (parts.length > 1) parts.push('<span class="przen-sep">&middot;</span>');
      parts.push(`<span class="przen-stat" style="color:${color}">${count} ${label}${count > 1 ? 's' : ''}</span>`);
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

  /**
   * Rebuild the panel: header legend + scrollable list of grouped entries.
   * @param {HTMLElement} panel
   * @param {Array} entries
   * @param {{human: number, bot: number, alert: number}} counts
   */
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

  /**
   * Smooth-scroll to a comment element and apply a temporary highlight outline.
   * @param {Element} el
   */
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
  let lastCounts = null;

  const CLOSE_SVG = '<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><line x1="3" y1="3" x2="11" y2="11"/><line x1="11" y1="3" x2="3" y2="11"/></svg>';

  /**
   * Animate the pill between full state (logo + stats) and mini state (close icon).
   * @param {boolean} toMini
   */
  function morphPill(toMini) {
    if (!pill) return;
    if (toMini) {
      const currentWidth = pill.offsetWidth;
      pill.style.width = currentWidth + 'px';
      pill.innerHTML = CLOSE_SVG;
      pill.offsetWidth;
      pill.classList.add('przen-pill-mini');
      pill.style.width = '';
    } else {
      pill.classList.remove('przen-pill-mini');
      if (lastCounts) {
        updatePill(pill, lastCounts);
        pill.classList.toggle('przen-pill-alert', lastCounts.alert > 0);
      }
      const targetWidth = pill.scrollWidth;
      pill.style.width = '40px';
      pill.offsetWidth;
      pill.style.width = targetWidth + 'px';
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
    morphPill(true);
    if (panel) panel.classList.add('przen-open');
  }

  /** Close the panel and restore the pill to its full stats display. */
  function closePanel() {
    if (!isOpen) return;
    isOpen = false;
    morphPill(false);
    if (panel) panel.classList.remove('przen-open');
  }

  function togglePanel() {
    isOpen ? closePanel() : openPanel();
  }

  /**
   * Main orchestrator: classify comments, update pill/panel, auto-open on
   * large screens. Guards against re-entrancy.
   */
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
      lastCounts = counts;
      if (!isOpen) {
        updatePill(pill, counts);
        pill.classList.toggle('przen-pill-alert', counts.alert > 0);
      }
      updatePanel(panel, entries, counts);
      if (!isOpen && window.innerWidth >= AUTO_OPEN_MIN_WIDTH) {
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
