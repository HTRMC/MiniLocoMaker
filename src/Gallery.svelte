<script lang="ts">
  import { galleryEnabled, list, imageUrl } from './lib/gallery';
  import { tr } from './lib/engine.js';
  import { ui, t } from './lib/i18n.svelte';

  const rows = galleryEnabled ? list() : null;
</script>

<section class="hero">
  <h1>{t('heroTitle')}</h1>
  <p>{t('tagline')}</p>
  <a class="btn" href="#/new">+ {t('start')}</a>
</section>

<h2>{t('gallery')}</h2>
{#if !rows}
  <p class="hint">{t('notConfigured')}</p>
{:else}
  {#await rows}
    <p class="hint">{t('loading')}</p>
  {:then rows}
    {#if !rows.length}<p class="hint">{t('empty')}</p>{/if}
    <ul class="cards">
      {#each rows as r (r.id)}
        <li>
          <a href="#/play/{r.id}">
            <img src={imageUrl(r.image_path)} alt="" loading="lazy">
            <b>{tr(r.title, ui.lang)}</b>
            {#if r.author}<small>{t('by')} {r.author}</small>{/if}
          </a>
        </li>
      {/each}
    </ul>
  {:catch e}
    <p class="err">{t('error')}: {e.message}</p>
  {/await}
{/if}
