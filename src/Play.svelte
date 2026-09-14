<script lang="ts">
  import Player from './Player.svelte';
  import { load } from './lib/gallery';
  import { t } from './lib/i18n.svelte';
  import type { Game } from './lib/types';

  let { id }: { id: string } = $props();
  const game = $derived(load(id));

  function copy(g: Game) {
    try { localStorage.setItem('mlm-draft', JSON.stringify(g)); } catch { /* storage full or blocked */ }
    location.hash = '#/new';
  }
</script>

{#await game}
  <p class="hint">{t('loading')}</p>
{:then g}
  <Player game={g} />
  <div class="row"><button onclick={() => copy(g)}>✎ {t('editCopy')}</button></div>
{:catch e}
  <p class="err">{t('error')}: {e.message}</p>
{/await}
