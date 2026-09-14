export type Lang = 'nl' | 'en';
export type Text = { nl: string; en: string };
export type Item = Text & { label: string };
export type Game = { title: Text; question: Text; image: string; items: Item[] };
