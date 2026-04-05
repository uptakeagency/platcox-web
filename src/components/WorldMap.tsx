import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

export default function WorldMap() {
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="relative aspect-[2/1] w-full">
      <svg viewBox="0 0 1000 500" className="h-full w-full" fill="none">
        {/* Simplified continent outlines */}
        <path d="M150,120 Q200,100 250,110 Q300,100 350,120 Q330,180 300,200 Q250,220 200,210 Q170,180 150,120Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <path d="M220,230 Q260,220 300,240 Q310,300 290,350 Q260,370 240,340 Q220,300 220,230Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <path d="M420,80 Q500,60 580,80 Q600,120 580,160 Q520,200 460,180 Q430,140 420,80Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <path d="M460,200 Q520,190 560,220 Q580,280 560,320 Q520,340 480,310 Q460,260 460,200Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <path d="M580,150 Q650,120 720,140 Q750,180 740,220 Q700,240 660,220 Q620,200 580,150Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
        <path d="M740,160 Q800,140 860,160 Q880,200 860,240 Q820,260 780,240 Q750,210 740,160Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
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
    </div>
  );
}
