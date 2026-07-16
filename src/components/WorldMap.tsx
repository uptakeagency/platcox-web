import { useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface Location {
  id: string;
  city: string;
  country: string;
  type: string;
  x: number;
  y: number;
}

const locations: Location[] = [
  { id: "istanbul", city: "Istanbul", country: "Turkey", type: "HQ", x: 55, y: 32 },
  { id: "london", city: "London", country: "UK", type: "Office", x: 47, y: 25 },
  { id: "mumbai", city: "Mumbai", country: "India", type: "Partner", x: 66, y: 48 },
  { id: "dhaka", city: "Dhaka", country: "Bangladesh", type: "Sourcing", x: 70, y: 44 },
  { id: "shanghai", city: "Shanghai", country: "China", type: "Sourcing", x: 78, y: 36 },
  { id: "newyork", city: "New York", country: "USA", type: "Office", x: 25, y: 30 },
  { id: "dubai", city: "Dubai", country: "UAE", type: "Partner", x: 60, y: 42 },
  { id: "nairobi", city: "Nairobi", country: "Kenya", type: "Partner", x: 57, y: 55 },
  { id: "saopaulo", city: "São Paulo", country: "Brazil", type: "Partner", x: 30, y: 62 },
];

// HQ-merkezli ticaret rotaları (Phase 6 Task 6.2 — TradeRoute integration).
// Inline SMIL pattern: TradeRoute primitive'inin scaled versiyonu, WorldMap
// SVG viewBox'ına (1000x500) absolute koordinatlarla çiziliyor.
const routes: Array<{ from: string; to: string }> = [
  { from: "istanbul", to: "london" },
  { from: "istanbul", to: "newyork" },
  { from: "istanbul", to: "shanghai" },
  { from: "istanbul", to: "mumbai" },
  { from: "istanbul", to: "dubai" },
  { from: "istanbul", to: "dhaka" },
  { from: "istanbul", to: "nairobi" },
  { from: "istanbul", to: "saopaulo" },
];

const locationsById = new Map(locations.map((l) => [l.id, l]));

export default function WorldMap() {
  const [active, setActive] = useState<string | null>(null);
  const reduced = useReducedMotion();
  // Her route'un <animate> elementine ref → harita viewport'a girince staggered
  // beginElement() ile tetiklenir (aşağıdaki startRoutes).
  const animateRefs = useRef<Array<SVGAnimateElement | null>>([]);
  const startedRef = useRef(false);

  // Rotalar SADECE harita viewport'a girince çizilir (Codex P2 fix). Önceden
  // <animate begin="indefinite; {i*200}ms"> ile ${i*200}ms clause'u document-load'dan
  // sonra otomatik başlıyordu → fold-altı rotalar kullanıcı scroll etmeden bitiyordu.
  // Şimdi begin="indefinite" + burada staggered beginElement(). reduced-motion'da
  // çizim yok; rotalar global CSS ([data-motion-reduced-end-state] → stroke-dashoffset:0)
  // ile zaten end-state'te görünür.
  const startRoutes = () => {
    if (startedRef.current) return; // once
    startedRef.current = true;
    if (reduced) return;
    animateRefs.current.forEach((el, i) => {
      if (!el) return;
      window.setTimeout(() => el.beginElement(), i * 200);
    });
  };

  return (
    <motion.div
      className="relative aspect-[2/1] w-full"
      onViewportEnter={startRoutes}
      viewport={{ once: true }}
    >
      <svg viewBox="0 0 1000 500" className="h-full w-full" fill="none">
        {/* Simplified continent outlines */}
        <path d="M150,120 Q200,100 250,110 Q300,100 350,120 Q330,180 300,200 Q250,220 200,210 Q170,180 150,120Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <path d="M220,230 Q260,220 300,240 Q310,300 290,350 Q260,370 240,340 Q220,300 220,230Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <path d="M420,80 Q500,60 580,80 Q600,120 580,160 Q520,200 460,180 Q430,140 420,80Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <path d="M460,200 Q520,190 560,220 Q580,280 560,320 Q520,340 480,310 Q460,260 460,200Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <path d="M580,150 Q650,120 720,140 Q750,180 740,220 Q700,240 660,220 Q620,200 580,150Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <path d="M740,160 Q800,140 860,160 Q880,200 860,240 Q820,260 780,240 Q750,210 740,160Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

        {/* Trade routes — TradeRoute primitive paterni inline (Phase 6 Task 6.2).
            Viewport gating BaseLayout page-observer'ı yerine bu component'te
            yapılıyor (startRoutes + onViewportEnter) → data-motion-trigger YOK,
            böylece page observer ile çifte tetikleme olmaz; stagger korunur. */}
        {routes.map((route, i) => {
          const from = locationsById.get(route.from);
          const to = locationsById.get(route.to);
          if (!from || !to) return null;
          // Yüzde koordinatları SVG viewBox birimlerine (1000x500).
          const fx = from.x * 10;
          const fy = from.y * 5;
          const tx = to.x * 10;
          const ty = to.y * 5;
          const cx = (fx + tx) / 2;
          const cy = Math.min(fy, ty) - Math.abs(tx - fx) * 0.18;
          return (
            <g
              key={`route-${route.from}-${route.to}`}
              data-motion-reduced-end-state
            >
              <path
                d={`M ${fx} ${fy} Q ${cx} ${cy} ${tx} ${ty}`}
                fill="none"
                stroke="#22C55E"
                strokeOpacity={0.35}
                strokeWidth="1"
                pathLength="1"
                strokeDasharray="1"
                strokeDashoffset="1"
              >
                <animate
                  ref={(node) => {
                    animateRefs.current[i] = node as SVGAnimateElement | null;
                  }}
                  attributeName="stroke-dashoffset"
                  from="1"
                  to="0"
                  dur="1200ms"
                  keySplines="0.65 0 0.35 1"
                  calcMode="spline"
                  fill="freeze"
                  begin="indefinite"
                />
              </path>
            </g>
          );
        })}
      </svg>

      {locations.map((loc, i) => (
        <motion.div
          key={loc.id}
          initial={{ scale: 0, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 + i * 0.1 }}
          className="absolute"
          style={{ left: `${loc.x}%`, top: `${loc.y}%`, transform: "translate(-50%, -50%)" }}
          onMouseEnter={() => setActive(loc.id)}
          onMouseLeave={() => setActive(null)}
        >
          <div className="absolute -inset-3 rounded-full bg-[#22C55E]/20 animate-pulse" />
          <div className="relative h-3 w-3 rounded-full bg-[#22C55E] cursor-pointer" />

          <AnimatePresence>
            {active === loc.id && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 whitespace-nowrap bg-white px-4 py-2 shadow-lg"
              >
                <p className="text-sm font-medium text-[#1A1A1A]">{loc.city}</p>
                <p className="text-xs text-[#999]">{loc.country} &middot; {loc.type}</p>
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </motion.div>
  );
}
