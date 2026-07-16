import { test, expect } from "bun:test";
import { buildTicker } from "./ticker";

const mk = (id: string, y: number, title: string) => ({ id, data: { title, date: new Date(y, 0, 1) } });

test("tarihe göre yeniden-eskiye sıralar", () => {
  const { items } = buildTicker([mk("a", 2024, "Eski"), mk("b", 2026, "Yeni"), mk("c", 2025, "Orta")]);
  expect(items.map((i) => i.title)).toEqual(["Yeni", "Orta", "Eski"]);
});

test("href /news/<id> üretir", () => {
  const { items } = buildTicker([mk("ai-ticaret", 2025, "T")]);
  expect(items[0].href).toBe("/news/ai-ticaret");
});

test("4'ten az başlıkta animate=false", () => {
  expect(buildTicker([mk("a", 2025, "1"), mk("b", 2025, "2"), mk("c", 2025, "3")]).animate).toBe(false);
});

test("4+ başlıkta animate=true", () => {
  const e = [1, 2, 3, 4].map((n) => mk("id" + n, 2025, "" + n));
  expect(buildTicker(e).animate).toBe(true);
});

test("boş girişte items=[] ve animate=false", () => {
  expect(buildTicker([])).toEqual({ items: [], animate: false });
});
