import type { Game, Item, Lang } from './types';

/** One CSV/TSV line into trimmed cells. "Quoted; cells" and "" escapes work. */
// ponytail: no multi-line quoted cells; add if spreadsheets with line breaks inside cells show up.
function cells(line: string, sep: string): string[] {
  const out = [''];
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"' && (quoted || !out[out.length - 1].trim())) {
      if (quoted && line[i + 1] === '"') { out[out.length - 1] += '"'; i++; } else quoted = !quoted;
    } else if (c === sep && !quoted) out.push('');
    else out[out.length - 1] += c;
  }
  return out.map(s => s.trim());
}

const HEADER = /^(label|nr\.?|no\.?|#|letter|nummer|number|vakje|tile)$/i;

/** 3+ cells: label, NL, EN. 2 cells: label, answer. 1 cell: "1. answer", "A - answer" or just the answer. */
function toItem(r: string[], i: number, lang: Lang): Item {
  if (r.length >= 3) return { label: r[0], nl: r[1], en: r[2] };
  let [label, answer] = r.length === 2 ? r : [String(i + 1), r[0]];
  const m = r.length === 1 && r[0].match(/^([\p{L}\p{N}]{1,4})\s*(?:[.:=)]|\s-)\s*(.+)$/u);
  if (m) [, label, answer] = m;
  return { label, nl: lang === 'nl' ? answer : '', en: lang === 'en' ? answer : '' };
}

/**
 * Tiles (or a whole game) from pasted or opened text: project .json, exported .html,
 * a JSON array, CSV/TSV (Excel, Google Sheets) or plain lines. Answers without a language go to `lang`.
 */
export function parseImport(text: string, lang: Lang): Partial<Game> & { items: Item[] } {
  const html = text.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/);
  const src = (html ? html[1] : text).trim();
  if (/^[[{]/.test(src)) {
    const j = JSON.parse(src);
    if (!Array.isArray(j)) {
      if (!Array.isArray(j?.items)) throw new Error('no items');
      return j;
    }
    return {
      items: j.map((r, i) => Array.isArray(r) ? toItem(r.map(String), i, lang)
        : r && typeof r === 'object' ? { label: String(r.label ?? i + 1), nl: String(r.nl ?? ''), en: String(r.en ?? '') }
        : toItem([String(r)], i, lang)),
    };
  }
  const lines = src.split(/\r?\n/).filter(l => l.trim());
  // ponytail: separator guessed from the first line, so a plain list with a comma there splits into cells.
  const sep = ['\t', ';', ','].find(s => lines[0]?.includes(s));
  const rows = lines.map(l => (sep ? cells(l, sep) : [l.trim()]));
  if (HEADER.test(rows[0]?.[0] ?? '')) rows.shift();
  return { items: rows.map((r, i) => toItem(r, i, lang)) };
}
