'use strict';

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

const $ = (id) => document.getElementById(id);

function load() {
  chrome.storage.sync.get(DEFAULT_CONFIG, (cfg) => {
    $('enabled').checked = cfg.enabled;
    $('minBotComments').value = cfg.minBotComments;
    $('botPatterns').value = cfg.botPatterns.join('\n');
    $('alertKeywords').value = cfg.alertKeywords.join('\n');
  });
}

function save(key, value) {
  chrome.storage.sync.set({ [key]: value });
}

function parseLines(text) {
  return text.split('\n').map(l => l.trim()).filter(Boolean);
}

$('enabled').addEventListener('change', (e) => {
  save('enabled', e.target.checked);
});

$('minBotComments').addEventListener('change', (e) => {
  const val = Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 3));
  e.target.value = val;
  save('minBotComments', val);
});

$('botPatterns').addEventListener('change', (e) => {
  save('botPatterns', parseLines(e.target.value));
});

$('alertKeywords').addEventListener('change', (e) => {
  save('alertKeywords', parseLines(e.target.value));
});

load();
