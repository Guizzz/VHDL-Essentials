import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CHANGELOG_MD = join(ROOT, 'CHANGELOG.md');
const OUTPUT_MD = join(ROOT, 'docs', 'development', 'changelog.md');

const CATEGORY_CLASS = {
  added: 'tl-added',
  fixed: 'tl-fixed',
  changed: 'tl-changed',
  removed: 'tl-removed',
  improved: 'tl-improved',
  refactored: 'tl-changed',
  documentation: 'tl-added',
  feature: 'tl-added',
  notes: '',
};

const CATEGORY_ORDER = ['added', 'fixed', 'changed', 'removed', 'improved', 'refactored', 'documentation', 'feature', 'notes'];

function code(text)
{
  return text.replace(/`([^`]+)`/g, '<code>$1</code>');
}

function escapeHtml(text)
{
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function issueLinks(text)
{
  return text.replace(/\(#(\d+)\)/g, '<a href="https://github.com/Guizzz/VHDL-Essentials/issues/$1" target="_blank">#$1</a>');
}

function parseChangelog(text)
{
  const versions = [];
  let currentVer = null;
  let currentCat = null;

  const lines = text.split('\n');

  for (let i = 0; i < lines.length; i++)
  {
    const line = lines[i];

    // Version header: ## [X.Y.Z] - YYYY-MM-DD
    const verMatch = line.match(/^## \[([\d.]+)]\s*-\s*(\d{4}-\d{2}-\d{2})/);
    if (verMatch)
    {
      currentVer = {
        version: verMatch[1],
        date: verMatch[2],
        categories: {},
        notes: [],
      };
      versions.push(currentVer);
      currentCat = null;
      continue;
    }

    if (!currentVer) { continue; }

    // Category header: ### CategoryName
    const catMatch = line.match(/^###\s+(\w+)/);
    if (catMatch)
    {
      currentCat = catMatch[1].toLowerCase();
      if (!currentVer.categories[currentCat])
      {
        currentVer.categories[currentCat] = [];
      }
      continue;
    }

    // List item: - text, possibly with continuation lines
    if (line.trimStart().startsWith('- '))
    {
      const item = line.trimStart().slice(2).trim();
      if (currentCat && currentVer.categories[currentCat])
      {
        currentVer.categories[currentCat].push(item);
      }
      continue;
    }

    // Continuation lines (indented or non-empty lines after a list item)
    if (currentCat && currentVer.categories[currentCat] && currentVer.categories[currentCat].length > 0)
    {
      const trimmed = line.trim();
      if (trimmed && !line.startsWith('##') && !line.startsWith('###'))
      {
        const lastIdx = currentVer.categories[currentCat].length - 1;
        currentVer.categories[currentCat][lastIdx] += ' ' + trimmed;
      }
    }

    // Non-category notes (like "First public release")
    if (!currentCat && line.trim() && !line.startsWith('##') && !line.startsWith('###') && !line.startsWith('#'))
    {
      currentVer.notes.push(line.trim());
    }
  }

  return versions;
}

function renderTimeline(versions)
{
  const groups = {};

  for (const ver of versions)
  {
    const year = ver.date.slice(0, 4);
    if (!groups[year]) { groups[year] = []; }
    groups[year].push(ver);
  }

  const years = Object.keys(groups).sort();

  let html = '# Changelog\n\n<div class="vp-timeline">\n';

  for (const year of years)
  {
    html += `\n<div class="tl-year">\n  <span class="tl-year-label">${year}</span>\n</div>\n`;

    const vers = groups[year];

    for (let vi = 0; vi < vers.length; vi++)
    {
      const ver = vers[vi];
      const dotClass = ver.version === '0.1.0'
        ? 'tl-dot tl-dot-first'
        : vi < 1 ? 'tl-dot' : 'tl-dot';

      html += `\n<div class="tl-entry">\n  <div class="${dotClass}"></div>\n  <div class="tl-card">\n`;
      html += `    <div class="tl-version">\n`;
      html += `      <a href="https://github.com/Guizzz/VHDL-Essentials/releases/tag/v${ver.version}" target="_blank">v${ver.version}</a>\n`;
      html += `      <span class="tl-date">${ver.date}</span>\n`;
      html += `    </div>\n`;

      // Render categories in preferred order
      for (const cat of CATEGORY_ORDER)
      {
        if (!ver.categories[cat] || ver.categories[cat].length === 0) { continue; }

        // Notes are rendered separately below as tl-note
        if (cat === 'notes') { continue; }

        const cssClass = CATEGORY_CLASS[cat] || '';
        html += `    <div class="tl-section ${cssClass}">\n`;
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        html += `      <div class="tl-heading">${label}</div>\n`;
        html += `      <ul>\n`;

        for (const item of ver.categories[cat])
        {
          html += `        <li>${issueLinks(code(escapeHtml(item)))}</li>\n`;
        }

        html += `      </ul>\n`;
        html += `    </div>\n`;
      }

      // Notes category renders as tl-note instead of section
      if (ver.categories['notes'] && ver.categories['notes'].length > 0)
      {
        for (const note of ver.categories['notes'])
        {
          html += `    <div class="tl-note">${issueLinks(code(escapeHtml(note)))}</div>\n`;
        }
      }

      // Standalone notes (e.g. "First public release")
      for (const note of ver.notes)
      {
        html += `    <div class="tl-note">${issueLinks(code(escapeHtml(note)))}</div>\n`;
      }

      html += `  </div>\n</div>\n`;
    }
  }

  html += '\n</div>\n';
  return html;
}

function main()
{
  const md = readFileSync(CHANGELOG_MD, 'utf-8');
  const versions = parseChangelog(md);
  const html = renderTimeline(versions);
  writeFileSync(OUTPUT_MD, html, 'utf-8');
  console.log(`✓ Generated ${OUTPUT_MD} (${versions.length} versions)`);
}

main();
