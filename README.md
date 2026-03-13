<p align="center">
  <img src="assets/logo.png" alt="PR Zen" width="180" />
</p>

<h1 align="center">PR Zen</h1>

<p align="center">
  <strong>Floating navigator for noisy GitHub Pull Requests</strong><br>
  Navigate long PR timelines without losing your mind.
</p>

<p align="center">
  <a href="#install">Install</a> · <a href="#features">Features</a> · <a href="#how-it-works">How it works</a> · <a href="#keyboard-shortcuts">Shortcuts</a> · <a href="#privacy">Privacy</a>
</p>

---

## The Problem

Modern GitHub PRs accumulate dozens of bot comments — CI, SonarCloud, Codecov, Vercel previews, code review bots — that are **useful and should be read**, but:

- Too much scrolling to navigate between items
- No overview of the timeline
- Human reviews get buried under bot noise
- No way to tell which bot report is an alert vs. informational

PR Zen doesn't hide anything. It gives you a **bird's-eye view** of the entire PR conversation.

## Install

### Chrome Extension (recommended)

Install from the [Chrome Web Store](https://chrome.google.com/webstore/detail/cngllfifbbjllfeloceeiihafomekdee) — or load unpacked from the `extension/` folder for development.

### Userscript (legacy)

> Requires [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Edge, Safari)

1. Install Tampermonkey for your browser
2. Click **[Install PR Zen userscript](pr-zen.user.js?raw=true)** (or open the raw file URL in Tampermonkey)
3. Visit any GitHub Pull Request — the pill appears automatically

## Features

**Floating Pill** — sits in the bottom-right corner showing live stats:
`2 reviews · 21 bots · 4 alerts`

**Timeline Panel** — click the pill (or press `Alt+Z`) to open a chronological timeline of all PR comments, classified by type:

| Color | Type | Description |
|-------|------|-------------|
| 🟢 Green | Reviews | Human comments and reviews |
| ⚪ Gray | Bots | Informational bot reports (Vercel, SonarCloud, etc.) |
| 🔴 Red | Alerts | Bot reports containing failures, errors, or vulnerabilities |

**Smart titles** — extracts the heading from each comment (e.g. "Review Claude", "Quality Gate passed", "Vercel Preview") instead of showing raw text.

**Grouped entries** — consecutive identical bot reports are collapsed into a single entry with a count badge (`×4`).

**Click to navigate** — click any item to smooth-scroll to that comment, with a temporary highlight.

**Light & dark mode** — adapts to your system theme via `prefers-color-scheme`.

**Accessible** — WCAG AA: full keyboard navigation, ARIA roles, focus management, `prefers-reduced-motion` support.

**Configurable** — customize bot patterns, alert keywords, and activation threshold from the extension popup.

**Works with GitHub SPA** — handles Turbo/pjax navigation without breaking.

**Conditional activation** — the pill only appears on PRs with 3+ bot comments. Clean PRs stay clean.

## How it Works

PR Zen is a Chrome extension (Manifest V3) with zero dependencies. It:

1. Scans `.js-timeline-item` elements in the PR conversation
2. Classifies each comment as human, bot, or alert using author patterns and content keywords
3. Renders a floating pill + timeline panel with vanilla DOM manipulation
4. Uses `MutationObserver` to stay in sync with GitHub's dynamic DOM

### Bot detection

Pattern matching on username: `[bot]`, `github-actions`, `dependabot`, `codecov`, `sonarcloud`, `vercel`, `netlify`, `renovate`, `claude-code-review`, `copilot`.

### Alert detection

Keywords in comment body: `failed`, `error`, `decreased`, `below threshold`, `critical`, `vulnerability`, `blocked`.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Z` | Toggle the navigator panel |
| `↑` `↓` | Navigate between items |
| `Enter` | Scroll to selected item |
| `Escape` | Close the panel |

## Privacy

PR Zen does not collect, transmit, or store any personal data. See [Privacy Policy](PRIVACY.md).

## License

[MIT](LICENSE) — Made by [Cocola](https://github.com/Cocola)
