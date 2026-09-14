// Public gallery on Supabase, via its REST APIs directly (no supabase-js needed for 3 calls).
import { dataUrl } from './image';
import type { Game } from './types';

const BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const KEY = import.meta.env.VITE_SUPABASE_KEY as string | undefined;
export const galleryEnabled = Boolean(BASE && KEY);

export type Row = { id: string; author: string | null; image_path: string; created_at: string; title: Game['title'] };

async function req(path: string, init: RequestInit = {}) {
  // Legacy anon keys are JWTs and also go in Authorization; new sb_publishable_ keys only in apikey.
  const auth = KEY?.startsWith('eyJ') ? { Authorization: `Bearer ${KEY}` } : {};
  const r = await fetch(BASE + path, { ...init, headers: { apikey: KEY!, ...auth, ...(init.headers as object) } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  return r;
}

export const imageUrl = (path: string) => `${BASE}/storage/v1/object/public/images/${encodeURIComponent(path)}`;

export const list = async (): Promise<Row[]> =>
  (await req('/rest/v1/games?select=id,author,image_path,created_at,title:data->title&order=created_at.desc&limit=500')).json();

export async function load(id: string): Promise<Game> {
  const [row] = await (await req(`/rest/v1/games?select=data,image_path&id=eq.${encodeURIComponent(id)}`)).json();
  if (!row) throw new Error('not found');
  const img = await fetch(imageUrl(row.image_path));
  return { ...row.data, image: await dataUrl(await img.blob()) }; // data URL so exports never hit canvas tainting
}

export async function publish(game: Game, author: string): Promise<string> {
  const img = await (await fetch(game.image)).blob();
  const path = `${crypto.randomUUID()}.${img.type.split('/')[1]}`;
  await req(`/storage/v1/object/images/${path}`, { method: 'POST', headers: { 'Content-Type': img.type }, body: img });
  const { image: _, ...data } = game;
  const res = await req('/rest/v1/games?select=id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ author: author || null, data, image_path: path }),
  });
  return (await res.json())[0].id;
}
