import engineSrc from './engine.js?raw';
import { tr, W, H } from './engine.js';
import type { Game } from './types';

export const FORMATS = ['pdf', 'svg', 'png', 'jpeg', 'webp', 'html', 'json'] as const;
export type Format = (typeof FORMATS)[number];

function save(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

async function raster(svg: string, type: string, scale = 3): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = W * scale;
    c.height = H * scale;
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise<Blob | null>(r => c.toBlob(r, type, 0.92));
    if (!blob || blob.type !== type) throw new Error(`${type} is not supported by this browser`);
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function pdf(svg: string): Promise<Blob> {
  const [{ jsPDF }] = await Promise.all([import('jspdf'), import('svg2pdf.js')]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const holder = document.createElement('div'); // svg2pdf needs the SVG in the document for computed styles
  holder.style.cssText = 'position:fixed;left:-10000px;top:0';
  holder.innerHTML = svg;
  document.body.append(holder);
  try {
    const pw = doc.internal.pageSize.getWidth(), ph = doc.internal.pageSize.getHeight();
    const s = Math.min((pw - 40) / W, (ph - 40) / H);
    await doc.svg(holder.firstElementChild!, { x: (pw - W * s) / 2, y: (ph - H * s) / 2, width: W * s, height: H * s });
  } finally {
    holder.remove();
  }
  return doc.output('blob');
}

/** Standalone, offline-playable HTML file: the engine source plus the game data. */
function html(game: Game, lang: string): Blob {
  const title = tr(game.title, lang).replace(/[&<>]/g, c => `&#${c.charCodeAt(0)};`);
  const data = JSON.stringify(game).replace(/</g, '\\u003c');
  return new Blob([
    `<!doctype html>\n<html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>\n` +
      `<body style="margin:0 auto;padding:16px;max-width:860px;background:#f4f1ea">\n<div id="game"></div>\n` +
      `<script type="application/json" id="data">${data}<\/script>\n` +
      `<script type="module">\n${engineSrc}\nmount(document.getElementById('game'), JSON.parse(document.getElementById('data').textContent), { lang: '${lang}' });\n<\/script>\n</body></html>`,
  ], { type: 'text/html' });
}

export async function exportGame(fmt: Format, game: Game, sheetSvg: string, lang: string) {
  const name = (tr(game.title, lang) || 'mini-loco').replace(/[^\p{L}\p{N}-]+/gu, '_');
  const blob =
    fmt === 'svg' ? new Blob([sheetSvg], { type: 'image/svg+xml' })
    : fmt === 'pdf' ? await pdf(sheetSvg)
    : fmt === 'html' ? html(game, lang)
    : fmt === 'json' ? new Blob([JSON.stringify(game)], { type: 'application/json' })
    : await raster(sheetSvg, `image/${fmt}`);
  save(blob, `${name}.${fmt === 'jpeg' ? 'jpg' : fmt}`);
}
