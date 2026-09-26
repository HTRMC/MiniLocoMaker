<script lang="ts">
  import { mount, LAYOUTS } from './lib/engine.js';
  import { exportGame, FORMATS, type Format } from './lib/export';
  import { ui, t } from './lib/i18n.svelte';
  import type { Game } from './lib/types';

  let { game }: { game: Game } = $props();
  let el: HTMLDivElement;
  let handle: ReturnType<typeof mount>;
  let fmt = $state<Format>('pdf'), layout = $state<string>(LAYOUTS[0]), busy = $state(false), err = $state('');

  $effect(() => { handle = mount(el, game, { lang: ui.lang }); });

  async function download() {
    busy = true;
    err = '';
    try {
      await exportGame(fmt, $state.snapshot(game), handle.sheet(layout), handle.lang());
    } catch (e) {
      err = `${t('error')}: ${(e as Error).message}`;
    }
    busy = false;
  }
</script>

<div class="card">
  <div bind:this={el}></div>
  <div class="toolbar">
    <label class="inline">{t('exportAs')}
      <select bind:value={fmt}>
        {#each FORMATS as f}<option value={f}>{f.toUpperCase()}</option>{/each}
      </select>
    </label>
    {#if fmt !== 'html' && fmt !== 'json'}
      <label class="inline">{t('layout')}
        <select bind:value={layout}>
          {#each LAYOUTS as l}<option value={l}>{t(l)}</option>{/each}
        </select>
      </label>
    {/if}
    <button onclick={download} disabled={busy}>⬇ {t('download')}</button>
    {#if err}<span class="err">{err}</span>{/if}
  </div>
</div>
