<script lang="ts">
  import Gallery from './Gallery.svelte';
  import Editor from './Editor.svelte';
  import Play from './Play.svelte';
  import { ui, t, setLang } from './lib/i18n.svelte';

  // Hash routes (work on GitHub Pages without server rewrites): #/  #/new  #/play/<id>
  let hash = $state(location.hash);
  $effect(() => {
    const f = () => (hash = location.hash);
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  });
  const route = $derived(hash.slice(2).split('/'));
  $effect(() => { document.documentElement.lang = ui.lang; });
</script>

<header>
  <div class="bar">
    <a href="#/" class="brand"><span class="logo" aria-hidden="true"><i></i><i></i><i></i><i></i></span>Mini-loco Maker</a>
    <nav>
      <a href="#/" class:active={route[0] !== 'new'}>{t('gallery')}</a>
      <a href="#/new" class:active={route[0] === 'new'}>{t('create')}</a>
      <button class="ghost" onclick={() => setLang(ui.lang === 'nl' ? 'en' : 'nl')}>{ui.lang === 'nl' ? 'EN' : 'NL'}</button>
    </nav>
  </div>
</header>

<main>
  {#if route[0] === 'new'}
    <Editor />
  {:else if route[0] === 'play' && route[1]}
    {#key route[1]}<Play id={route[1]} />{/key}
  {:else}
    <Gallery />
  {/if}
</main>
