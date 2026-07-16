export interface NewsEntryLike { id: string; data: { title: string; date: Date } }
export interface TickerItem { title: string; href: string }
export interface TickerModel { items: TickerItem[]; animate: boolean }

// Haberleri yeniden-eskiye sırala, ticker item'larına çevir, sayı-guard'ı hesapla.
export function buildTicker(entries: NewsEntryLike[]): TickerModel {
  const items = [...entries]
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime())
    .map((e) => ({ title: e.data.title, href: `/news/${e.id}` }));
  return { items, animate: items.length >= 4 };
}
