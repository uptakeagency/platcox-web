// Ofis/şube listesi — tek kaynak. Harita pinleri (WorldMap) ve adres kartları
// (LocationsSection) buradan beslenir. Adresler faturalardan/kullanıcıdan alındı.
export type OfficeType = "HQ" | "Office";

export interface Office {
  id: string;
  city: string;
  country: string;
  type: OfficeType;
  lines: string[];
  lat: number;
  lng: number;
  /** Pin etiketi yönü; komşu pinlerle çakışmayı önlemek için (varsayılan: alt). */
  labelSide?: "top" | "bottom" | "left" | "right";
  /** Yalnızca gösterim için küçük kaydırma (harita yüzdesi): birbirine 5-10px
      düşen pinler (Guangzhou / Hong Kong / Xiamen) ayrışsın. Gerçek koordinat lat/lng. */
  nudge?: { x: number; y: number };
}

export const OFFICES: Office[] = [
  {
    id: "istanbul",
    city: "Istanbul",
    country: "Turkey",
    type: "HQ",
    lines: ["Kültür Mah, Nisbetiye Cad. Akmerkez No:54", "Beşiktaş / Istanbul, Türkiye 34349"],
    lat: 41.01,
    lng: 28.98,
  },
  {
    id: "leeds",
    city: "Leeds",
    country: "United Kingdom",
    type: "Office",
    lines: ["Bruntcliffe Trading Estate, Howden Clough Lane", "Leeds LS27 0TF"],
    lat: 53.75,
    lng: -1.6,
    labelSide: "top",
  },
  {
    id: "barcelona",
    city: "Barcelona",
    country: "Spain",
    type: "Office",
    lines: ["Cami Ral 6, Nave 18", "08800 Vilanova i la Geltrú, Barcelona"],
    lat: 41.22,
    lng: 1.73,
  },
  {
    id: "newdelhi",
    city: "New Delhi",
    country: "India",
    type: "Office",
    lines: ["10th Floor, International Trade Tower, Nehru Place", "New Delhi, Delhi 110019"],
    lat: 28.61,
    lng: 77.21,
  },
  {
    id: "reilingen",
    city: "Reilingen",
    country: "Germany",
    type: "Office",
    lines: ["Wilhelmstrasse 78", "68799 Reilingen"],
    lat: 49.3,
    lng: 8.57,
    labelSide: "top",
  },
  {
    id: "dubai",
    city: "Dubai",
    country: "United Arab Emirates",
    type: "Office",
    lines: ["Jebel Ali Free Zone, PO Box 80794", "Dubai"],
    lat: 25.02,
    lng: 55.06,
  },
  {
    id: "tenerife",
    city: "Tenerife",
    country: "Spain",
    type: "Office",
    lines: [
      "Avenida El Paso s/n, Edificio Multiusos 1ª Planta",
      "Polígono Industrial Los Majuelos",
      "38108 La Laguna, Santa Cruz de Tenerife",
    ],
    lat: 28.48,
    lng: -16.32,
  },
  {
    id: "budapest",
    city: "Budapest",
    country: "Hungary",
    type: "Office",
    lines: ["Újvilág u. 50-52", "1145 Budapest"],
    lat: 47.5,
    lng: 19.1,
  },
  {
    id: "hongkong",
    city: "Hong Kong",
    country: "Hong Kong SAR",
    type: "Office",
    lines: ["Unit 1501, 15/F, Yue Xiu Building", "160-174 Lockhart Road, Wan Chai"],
    lat: 22.28,
    lng: 114.17,
    nudge: { x: 0.6, y: 1.5 },
  },
  {
    id: "guangzhou",
    city: "Guangzhou",
    country: "China",
    type: "Office",
    lines: ["501, Building C, Zhizaogu Innovation Park", "Huangpu District, Guangzhou"],
    lat: 23.1,
    lng: 113.46,
    labelSide: "top",
    nudge: { x: -1.2, y: -2 },
  },
  {
    id: "xiamen",
    city: "Xiamen",
    country: "China",
    type: "Office",
    lines: ["No.69 Huli St., Huli Ind. Zone", "Xiamen 361006"],
    lat: 24.52,
    lng: 118.13,
    labelSide: "right",
    nudge: { x: 1.2, y: -1.5 },
  },
];

export const HQ = OFFICES.find((o) => o.type === "HQ")!;

// worldDots.ts'i üreten dotted-map ızgarasının projeksiyonu (Mercator) ve
// kara sınır kutusu. Pinler aynı formülle türetilir → noktalarla hizalı kalır.
const REGION = { lat: { min: -56, max: 71 }, lng: { min: -168, max: 168 } };

const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));

/** Enlem/boylam → harita yüzdesi (0–100). */
export function projectToMap({ lat, lng }: { lat: number; lng: number }): { x: number; y: number } {
  const x = ((lng - REGION.lng.min) / (REGION.lng.max - REGION.lng.min)) * 100;
  const top = mercY(REGION.lat.max);
  const bottom = mercY(REGION.lat.min);
  const y = ((top - mercY(lat)) / (top - bottom)) * 100;
  return { x, y };
}

/** Pinin ekrandaki yeri: projeksiyon + (varsa) gösterim kaydırması. */
export function displayPosition(o: Office): { x: number; y: number } {
  const p = projectToMap(o);
  return { x: p.x + (o.nudge?.x ?? 0), y: p.y + (o.nudge?.y ?? 0) };
}
