import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { WORLD_DOTS } from "../lib/worldDots";
import { HQ, OFFICES, displayPosition, type Office } from "../lib/offices";

// Pinler tek kaynaktan (offices.ts); koordinatlar enlem/boylamdan türetilir
// (+ yakın pinler için küçük gösterim kaydırması; rota ucu da pinle aynı yerde).
const locations = OFFICES.map((o) => ({ ...o, ...displayPosition(o) }));

// Merkezden diğer her ofise bir ticaret rotası (TradeRoute paterni, inline SMIL;
// WorldMap SVG viewBox'ına (1000x500) absolute koordinatlarla çiziliyor).
const routes = locations.filter((l) => l.id !== HQ.id).map((l) => ({ from: HQ.id, to: l.id }));

const locationsById = new Map(locations.map((l) => [l.id, l]));

// Etiket yönü → konum sınıfları (yakın pinlerde çakışmayı önler).
const LABEL_SIDE: Record<NonNullable<Office["labelSide"]>, string> = {
  bottom: "left-1/2 top-full mt-1.5 -translate-x-1/2",
  top: "left-1/2 bottom-full mb-1.5 -translate-x-1/2",
  right: "left-full top-1/2 ml-2.5 -translate-y-1/2",
  left: "right-full top-1/2 mr-2.5 -translate-y-1/2",
};

export default function WorldMap() {
  const [active, setActive] = useState<string | null>(null);
  const reduced = useReducedMotion();
  // Her route'un <animate> elementine ref → harita viewport'a girince staggered
  // beginElement() ile tetiklenir (aşağıdaki startRoutes).
  const animateRefs = useRef<Array<SVGAnimateElement | null>>([]);
  const startedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  // Framer'ın onViewportEnter'ı pager (Lenis programatik scroll) ile güvenilir
  // tetiklenmiyordu → rotalar çizilmeden kalıyordu. Düz IntersectionObserver ile garanti.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          startRoutes();
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      ref={containerRef}
      className="relative aspect-[2/1] w-full"
      onViewportEnter={startRoutes}
      viewport={{ once: true }}
    >
      <svg viewBox="0 0 1000 500" className="h-full w-full" fill="none">
        {/* Dotted world map — gerçek coğrafyadan üretilen noktalar (dotted-map,
            build-time; koordinatlar worldDots.ts'e gömülü, 1000x500 viewBox). Kıtalar
            noktalarla çizilir; kenarlarda radial fade. Rotalar + şehir node'ları üstüne biner. */}
        <defs>
          <radialGradient id="wm-fade" cx="50%" cy="50%" r="80%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0.65" />
          </radialGradient>
          <mask id="wm-mask">
            <rect width="1000" height="500" fill="url(#wm-fade)" />
          </mask>
        </defs>
        <g mask="url(#wm-mask)">
          {WORLD_DOTS.map(([x, y], idx) => (
            <circle key={idx} cx={x} cy={y} r={2} fill="rgba(17,17,17,0.18)" />
          ))}
        </g>

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
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.1 }}
          className="absolute"
          style={{ left: `${loc.x}%`, top: `${loc.y}%`, transform: "translate(-50%, -50%)" }}
          onMouseEnter={() => setActive(loc.id)}
          onMouseLeave={() => setActive(null)}
        >
          {/* Nabız halkası dekoratif: hover hedefi 12px çekirdek (yakın pinlerde
              36px halkalar üst üste binip tooltip'i karıştırıyordu — Codex P2). */}
          <div className="pointer-events-none absolute -inset-3 rounded-full bg-[#22C55E]/20 animate-pulse" />
          <div className="relative h-3 w-3 rounded-full bg-[#22C55E] cursor-pointer" />

          {/* Kalıcı şehir etiketi (hover'da tooltip country+type ekler). Dar ekranda
              Avrupa pinleri sıkışıp etiketler üst üste biniyor → sm altında gizli;
              şehirler harita altındaki adres kartlarında zaten listeli. */}
          <span
            className={`pointer-events-none absolute hidden sm:block whitespace-nowrap text-[10px] font-medium tracking-wide text-[#1A1A1A]/75 ${LABEL_SIDE[loc.labelSide ?? "bottom"]}`}
          >
            {loc.city}
          </span>

          <AnimatePresence>
            {active === loc.id && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 whitespace-nowrap bg-white px-4 py-2 shadow-lg"
              >
                <p className="text-sm font-medium text-[#1A1A1A]">{loc.city}</p>
                <p className="text-xs text-[#999]">{loc.country} &middot; {loc.type === "HQ" ? "Headquarters" : "Office"}</p>
                <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </motion.div>
  );
}
