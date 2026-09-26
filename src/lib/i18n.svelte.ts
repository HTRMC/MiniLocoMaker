import type { Lang } from './types';

const en = {
  gallery: 'Gallery',
  create: 'Create',
  heroTitle: 'Make your own mini-loco',
  tagline: 'Upload a picture with numbers or letters, fill in the answers, and your exercise is ready. Students drag the tiles onto the right answers; the pattern on the back shows whether everything is correct.',
  start: 'Make a game',
  loading: 'Loading…',
  empty: 'No games published yet.',
  notConfigured: 'The public gallery is not configured (Supabase settings missing).',
  by: 'by',
  error: 'Error',
  stepText: 'Title and question',
  title: 'Title',
  question: 'Question',
  image: 'Image',
  dropImage: 'Click, drop an image here or paste it with Ctrl+V',
  answers: 'Tiles and answers',
  itemsHint: 'Label = the letter or number on the small tile (as in your image). Give the answer in Dutch, English or both. At least 12 rows; every game picks 12 at random. Use | for a line break.',
  label: 'Label',
  answer: 'Answer',
  remove: 'Remove',
  addRow: 'Add row',
  reset: 'Start over',
  confirmReset: 'Clear this game and start over?',
  import: 'Import from Excel, CSV, text or JSON',
  importHint: 'One tile per line: label ; NL ; EN (tabs or commas work too). Paste cells from Excel or Google Sheets, or a list like "1. nucleus". You can also drop a file anywhere on this page.',
  importBtn: 'Import',
  open: 'Choose file',
  confirmReplace: 'Replace the current tiles with the import?',
  badFile: 'No tiles found. Check the format.',
  stepPlay: 'Play and share',
  preview: 'Play / preview',
  needImage: 'Add an image.',
  needItems: 'Fill in at least 12 rows.',
  exportAs: 'Export worksheet as',
  layout: 'Layout',
  classic: 'Landscape (standard)',
  wide: 'Landscape, large image',
  portrait: 'Portrait, 2 × 6',
  grid: 'Portrait, 3 × 4 (large boxes)',
  download: 'Download',
  publish: 'Publish to gallery',
  author: 'Your name (optional)',
  consent: 'I own the rights to this image and text, and I agree this game becomes publicly visible.',
  editCopy: 'Edit a copy',
};

const nl: typeof en = {
  gallery: 'Galerij',
  create: 'Maken',
  heroTitle: 'Maak je eigen mini-loco',
  tagline: 'Upload een afbeelding met nummers of letters, vul de antwoorden in en je oefening is klaar. Leerlingen slepen de vakjes naar het goede antwoord; het patroon op de achterkant laat zien of alles klopt.',
  start: 'Maak een spel',
  loading: 'Laden…',
  empty: 'Nog geen spellen gepubliceerd.',
  notConfigured: 'De openbare galerij is niet ingesteld (Supabase-instellingen ontbreken).',
  by: 'door',
  error: 'Fout',
  stepText: 'Titel en vraag',
  title: 'Titel',
  question: 'Vraag',
  image: 'Afbeelding',
  dropImage: 'Klik, sleep een afbeelding hierheen of plak met Ctrl+V',
  answers: 'Vakjes en antwoorden',
  itemsHint: 'Label = de letter of het nummer op het kleine vakje (zoals in je afbeelding). Geef het antwoord in het Nederlands, Engels of allebei. Minstens 12 rijen; elk spel kiest er 12 willekeurig. Gebruik | voor een nieuwe regel.',
  label: 'Label',
  answer: 'Antwoord',
  remove: 'Verwijderen',
  addRow: 'Rij toevoegen',
  reset: 'Opnieuw beginnen',
  confirmReset: 'Dit spel wissen en opnieuw beginnen?',
  import: 'Importeren uit Excel, CSV, tekst of JSON',
  importHint: 'Eén vakje per regel: label ; NL ; EN (tabs of komma\'s mogen ook). Plak cellen uit Excel of Google Sheets, of een lijstje als "1. kern". Je kunt ook een bestand ergens op deze pagina neerzetten.',
  importBtn: 'Importeren',
  open: 'Bestand kiezen',
  confirmReplace: 'De huidige vakjes vervangen door de import?',
  badFile: 'Geen vakjes gevonden. Controleer het formaat.',
  stepPlay: 'Spelen en delen',
  preview: 'Spelen / voorbeeld',
  needImage: 'Voeg een afbeelding toe.',
  needItems: 'Vul minstens 12 rijen in.',
  exportAs: 'Werkblad exporteren als',
  layout: 'Indeling',
  classic: 'Liggend (standaard)',
  wide: 'Liggend, grote afbeelding',
  portrait: 'Staand, 2 × 6',
  grid: 'Staand, 3 × 4 (grote vakken)',
  download: 'Downloaden',
  publish: 'Publiceren in galerij',
  author: 'Je naam (optioneel)',
  consent: 'Ik heb de rechten op deze afbeelding en tekst, en ik ga ermee akkoord dat dit spel openbaar zichtbaar wordt.',
  editCopy: 'Kopie bewerken',
};

function initial(): Lang {
  try {
    const s = localStorage.getItem('mlm-lang');
    if (s === 'nl' || s === 'en') return s;
  } catch { /* storage blocked */ }
  return navigator.language.toLowerCase().startsWith('nl') ? 'nl' : 'en';
}

export const ui = $state({ lang: initial() });
export const t = (k: keyof typeof en) => (ui.lang === 'nl' ? nl : en)[k];
export function setLang(l: Lang) {
  ui.lang = l;
  try { localStorage.setItem('mlm-lang', l); } catch { /* storage blocked */ }
}
