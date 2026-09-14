<script lang="ts">
  import Player from './Player.svelte';
  import { shrink } from './lib/image';
  import { galleryEnabled, publish } from './lib/gallery';
  import { parseImport } from './lib/importer';
  import { ui, t } from './lib/i18n.svelte';
  import type { Game } from './lib/types';

  const blank = (): Game => ({
    title: { nl: '', en: '' },
    question: { nl: '', en: '' },
    image: '',
    items: Array.from({ length: 12 }, (_, i) => ({ label: String.fromCharCode(65 + i), nl: '', en: '' })),
  });

  function restore(): Game | null {
    try { return JSON.parse(localStorage.getItem('mlm-draft') ?? 'null'); } catch { return null; }
  }

  let game = $state<Game>(restore() ?? blank());
  let preview = $state<Game | null>(null);
  let author = $state(''), consent = $state(false), busy = $state(false), status = $state('');
  let paste = $state(''), importErr = $state('');

  $effect(() => {
    const s = JSON.stringify(game);
    try { localStorage.setItem('mlm-draft', s); } catch { /* quota or blocked: draft just isn't remembered */ }
  });

  const filled = (g: Game) => g.items.filter(i => i.label.trim() && (i.nl.trim() || i.en.trim()));
  const problems = $derived([!game.image && t('needImage'), filled(game).length < 12 && t('needItems')].filter(Boolean));
  const clean = (): Game => { const g = $state.snapshot(game); return { ...g, items: filled(g) }; };

  async function setImage(f: File) {
    game.image = await shrink(f);
  }

  function importText(text: string) {
    try {
      const r = parseImport(text, ui.lang);
      if (!r.items.length) throw new Error();
      if (filled(game).length && !confirm(t('confirmReplace'))) return;
      if ('image' in r) game = { ...blank(), ...r }; else game.items = r.items;
      preview = null;
      importErr = '';
      paste = '';
    } catch {
      importErr = t('badFile');
    }
  }

  // Picked, dropped or pasted files: images become the picture, anything else is imported as tiles.
  function openFile(f?: File | null) {
    if (!f) return;
    if (f.type.startsWith('image/')) setImage(f); else f.text().then(importText);
  }

  function picked(e: Event) {
    const input = e.target as HTMLInputElement;
    openFile(input.files?.[0]);
    input.value = '';
  }

  function dropped(e: DragEvent) {
    if (!e.dataTransfer?.files.length) return;
    e.preventDefault();
    openFile(e.dataTransfer.files[0]);
  }

  function pasted(e: ClipboardEvent) {
    // Excel also puts a picture of copied cells on the clipboard, so only take an image when there is no text.
    const cb = e.clipboardData;
    const f = cb && !cb.types.includes('text/plain') && [...cb.files].find(f => f.type.startsWith('image/'));
    if (f) { e.preventDefault(); setImage(f); }
  }

  function addRow() {
    const last = game.items.at(-1)?.label ?? '@';
    game.items.push({ label: last.length === 1 ? String.fromCharCode(last.charCodeAt(0) + 1) : '', nl: '', en: '' });
  }

  function reset() {
    if (confirm(t('confirmReset'))) { game = blank(); preview = null; }
  }

  async function doPublish() {
    busy = true;
    status = '';
    try {
      location.hash = `#/play/${await publish(clean(), author.trim())}`;
    } catch (e) {
      status = `${t('error')}: ${(e as Error).message}`;
    }
    busy = false;
  }
</script>

<svelte:window ondragover={e => e.preventDefault()} ondrop={dropped} onpaste={pasted} />

<h1>{t('create')}</h1>
<div class="editor">
  <section class="card">
    <h2><span class="step">1</span>{t('stepText')}</h2>
    <div class="pair">
      <label><span>{t('title')} <small>NL</small></span><input bind:value={game.title.nl}></label>
      <label><span>{t('title')} <small>EN</small></span><input bind:value={game.title.en}></label>
    </div>
    <div class="pair">
      <label><span>{t('question')} <small>NL</small></span><input bind:value={game.question.nl}></label>
      <label><span>{t('question')} <small>EN</small></span><input bind:value={game.question.en}></label>
    </div>
  </section>

  <section class="card">
    <h2><span class="step">2</span>{t('image')}</h2>
    <label class="drop">
      <input type="file" accept="image/*" class="sr-only" onchange={picked}>
      {#if game.image}<img src={game.image} alt="">{/if}
      <span>{t('dropImage')}</span>
    </label>
  </section>

  <section class="card">
    <h2><span class="step">3</span>{t('answers')}</h2>
    <p class="hint">{t('itemsHint')}</p>
    <div class="table-wrap">
      <table class="items">
        <thead><tr><th>{t('label')}</th><th>{t('answer')} NL</th><th>{t('answer')} EN</th><th></th></tr></thead>
        <tbody>
          {#each game.items as item, i}
            <tr>
              <td><input class="label" bind:value={item.label} maxlength="4"></td>
              <td><input bind:value={item.nl}></td>
              <td><input bind:value={item.en}></td>
              <td><button class="icon" onclick={() => game.items.splice(i, 1)} aria-label={t('remove')} title={t('remove')}>✕</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <div class="row">
      <button onclick={addRow}>+ {t('addRow')}</button>
      <button class="ghost" onclick={reset}>{t('reset')}</button>
    </div>

    <details class="import" open={!filled(game).length}>
      <summary>{t('import')}</summary>
      <p class="hint">{t('importHint')}</p>
      <textarea bind:value={paste} rows="6" placeholder={'1;kern;nucleus\n2;celwand;cell wall\n3;vacuole;vacuole'}></textarea>
      <div class="row">
        <button class="primary" onclick={() => importText(paste)} disabled={!paste.trim()}>{t('importBtn')}</button>
        <label class="btn"><input type="file" accept=".csv,.tsv,.txt,.json,.html,text/*" class="sr-only" onchange={picked}>{t('open')}</label>
        {#if importErr}<span class="err">{importErr}</span>{/if}
      </div>
    </details>
  </section>

  <section class="card">
    <h2><span class="step">4</span>{t('stepPlay')}</h2>
    <div class="row">
      <button class="primary" onclick={() => (preview = clean())} disabled={problems.length > 0}>▶ {t('preview')}</button>
      {#each problems as p}<span class="err">{p}</span>{/each}
    </div>
  </section>

  {#if preview}
    {#key preview}<Player game={preview} />{/key}
    <section class="card publish">
      <h2>{t('publish')}</h2>
      {#if galleryEnabled}
        <label>{t('author')}<input bind:value={author} maxlength="60"></label>
        <label class="check"><input type="checkbox" bind:checked={consent}> {t('consent')}</label>
        <div><button class="primary" onclick={doPublish} disabled={!consent || busy}>{t('publish')}</button></div>
        {#if status}<p class="err">{status}</p>{/if}
      {:else}
        <p class="hint">{t('notConfigured')}</p>
      {/if}
    </section>
  {/if}
</div>
