import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

const INITIAL_ALERTS = [{ id: 1, message: "Register #3 is idle", type: "warning", time: "Just now" }];
const NEW_ALERTS = [
  { id: 2, message: "Drive-Thru wait time exceeds 150s target", type: "error", time: "Now" },
  { id: 3, message: "Wet floor detected – slip risk in Kitchen", type: "warning", time: "Now" },
  { id: 4, message: "Cold chain violation: Temp at -14°C", type: "error", time: "Now" }
];

export default function DecisionEngineDemo() {
  const [activeTab, setActiveTab] = useState<'tracking' | 'video' | 'assistant'>('tracking');
  
  // App Shell
  return (
    <div className="w-full max-w-5xl mx-auto mt-12 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 font-sans shadow-2xl flex flex-col h-[550px] md:h-[500px]">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-800 bg-zinc-900/40">
        <div className="flex space-x-6">
          <button 
            onClick={() => setActiveTab('tracking')}
            className={`text-sm font-medium transition-colors relative py-2 ${activeTab === 'tracking' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Live Tracking
            {activeTab === 'tracking' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 rounded-t" />}
          </button>
          <button 
            onClick={() => setActiveTab('video')}
            className={`text-sm font-medium transition-colors relative py-2 ${activeTab === 'video' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Video Analytics
            {activeTab === 'video' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />}
          </button>
          <button 
            onClick={() => setActiveTab('assistant')}
            className={`text-sm font-medium transition-colors relative py-2 ${activeTab === 'assistant' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            AI Assistant
            {activeTab === 'assistant' && <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-t" />}
          </button>
        </div>
        <span className="text-zinc-500 text-sm tracking-wider uppercase font-semibold">C.O.D.E</span>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'tracking' && <LiveTrackingView key="tracking" />}
          {activeTab === 'video' && <VideoAnalyticsView key="video" />}
          {activeTab === 'assistant' && <AIAssistantView key="assistant" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// 1. LIVE TRACKING VIEW
// -------------------------------------------------------------
function LiveTrackingView() {
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activeAlertIndex < NEW_ALERTS.length) {
        setAlerts((prev) => [NEW_ALERTS[activeAlertIndex], ...prev].slice(0, 4));
        setActiveAlertIndex((prev) => prev + 1);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [activeAlertIndex]);

  const generateDots = (count: number, colorClass: string) => {
    return Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={`${colorClass}-${i}`}
        className={`absolute w-2 h-2 rounded-full ${colorClass}`}
        initial={{ x: Math.random() * 250, y: Math.random() * 150 }}
        animate={{ x: Math.random() * 250, y: Math.random() * 150 }}
        transition={{ duration: Math.random() * 5 + 3, repeat: Infinity, repeatType: "reverse", ease: "linear" }}
      />
    ));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      className="flex flex-col md:flex-row h-full w-full"
    >
      <div className="flex-1 p-6 flex flex-col">
        <div className="relative flex-1 border border-zinc-800 bg-zinc-900/50 rounded-xl overflow-hidden mt-2">
          <div className="absolute inset-0 z-0 opacity-10" style={{ backgroundImage: "linear-gradient(#4f4f4f 1px, transparent 1px), linear-gradient(90deg, #4f4f4f 1px, transparent 1px)", backgroundSize: "20px 20px"}} />
          
          <div className="absolute inset-6 border border-zinc-700/50 rounded flex">
            <div className="w-1/3 border-r border-zinc-700/50 p-2 text-xs text-zinc-500 font-mono">SALON</div>
            <div className="w-1/3 border-r border-zinc-700/50 p-2 text-xs text-zinc-500 font-mono">MUTFAK</div>
            <div className="w-1/3 p-2 text-xs text-zinc-500 font-mono">DRIVE-THRU</div>
          </div>
          <div className="absolute inset-6 z-10">
            {generateDots(6, "bg-orange-400")} {/* Personnel */}
            {generateDots(10, "bg-blue-400")} {/* Customers */}
            {generateDots(2, "bg-purple-400")} {/* Managers */}
          </div>
        </div>
      </div>

      <div className="w-full md:w-80 border-l border-zinc-800 bg-zinc-900/20 p-6 flex flex-col">
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="text-xs text-zinc-500 mb-1">Service Time</div>
            <div className="text-xl font-medium text-emerald-400">142s</div>
            <div className="text-[10px] text-zinc-600">Target 150s</div>
          </div>
          <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800">
            <div className="text-xs text-zinc-500 mb-1">Occupancy</div>
            <div className="text-xl font-medium text-blue-400">76%</div>
            <div className="text-[10px] text-zinc-600">Optimal</div>
          </div>
        </div>
        <h4 className="text-zinc-100 font-medium mb-4 flex justify-between items-center">
          Live AI Alerts <span className="bg-emerald-500 w-2 h-2 rounded-full animate-pulse"></span>
        </h4>
        <div className="flex-1 flex flex-col gap-3 relative overflow-hidden">
          <AnimatePresence>
            {alerts.map((alert) => (
              <motion.div key={alert.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className={`p-3 rounded-lg border text-sm ${alert.type === "error" ? "bg-red-500/10 border-red-500/20 text-red-200" : "bg-orange-500/10 border-orange-500/20 text-orange-200"}`}>
                <div className="flex justify-between items-start mb-1"><span className="font-medium text-xs">{alert.type === "error" ? "CRITICAL" : "NOTICE"}</span><span className="text-[10px] opacity-60">{alert.time}</span></div>
                <p className="opacity-90">{alert.message}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// -------------------------------------------------------------
// 2. VIDEO ANALYTICS VIEW
// -------------------------------------------------------------
function VideoAnalyticsView() {
  const TrackingBox = ({ id, startPos }: { id:string, startPos: any }) => (
    <motion.div
      className="absolute border-2 border-emerald-500 rounded bg-emerald-500/10 flex items-end"
      initial={startPos}
      animate={{ x: startPos.x + (Math.random() * 40 - 20), y: startPos.y + (Math.random() * 20 - 10) }}
      transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
    >
      <span className="bg-emerald-500 text-zinc-950 text-[8px] font-bold px-1 m-[-2px]">{id}</span>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col md:flex-row h-full w-full">
      <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Camera 1 */}
        <div className="border border-zinc-800 rounded-lg bg-zinc-900/60 relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent"></div>
          <div className="p-2 border-b border-zinc-800 flex justify-between text-xs text-zinc-500 font-mono z-10">
            <span>CAM-01: KASA</span> <span className="text-red-400 animate-pulse">● REC</span>
          </div>
          <div className="flex-1 relative z-10">
            <TrackingBox id="PERSON 89%" startPos={{ x: 40, y: 30, width: 60, height: 120 }} />
            <TrackingBox id="PERSON 94%" startPos={{ x: 140, y: 50, width: 55, height: 110 }} />
          </div>
        </div>
        
        {/* Camera 2 */}
        <div className="border border-zinc-800 rounded-lg bg-zinc-900/60 relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 to-transparent"></div>
          <div className="p-2 border-b border-zinc-800 flex justify-between text-xs text-zinc-500 font-mono z-10">
            <span>CAM-02: DRIVE THRU</span> <span className="text-red-400 animate-pulse">● REC</span>
          </div>
          <div className="flex-1 relative z-10">
            <TrackingBox id="VEHICLE 99%" startPos={{ x: 80, y: 60, width: 140, height: 80 }} />
          </div>
        </div>
      </div>
      
      {/* Event Log sidebar */}
      <div className="w-full md:w-80 border-l border-zinc-800 bg-zinc-900/20 p-6 flex flex-col">
        <h4 className="text-zinc-100 font-medium mb-4">Event Stream</h4>
        <div className="flex-1 flex flex-col gap-2 relative overflow-hidden font-mono text-xs">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded">17:42:01 - CAM-01: Detected 2 Persons (Q_Time: 40s)</div>
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded">17:42:15 - CAM-02: Vehicle cleared pickup</div>
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded">17:43:08 - CAM-01: Detected 3 Persons</div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-2 bg-zinc-800 border border-zinc-700 text-zinc-400 rounded">Scanning...</motion.div>
        </div>
      </div>
    </motion.div>
  );
}

// -------------------------------------------------------------
// 3. AI ASSISTANT VIEW
// -------------------------------------------------------------
function AIAssistantView() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello. I am the C.O.D.E Operations Assistant. How can I help optimize your workflow today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    // Simulate user asking a question, then ai responding
    const timer1 = setTimeout(() => {
      setMessages(prev => [...prev, { role: 'user', text: "What's our current drive-thru bottleneck?" }]);
      setIsTyping(true);
    }, 1500);

    const timer2 = setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { role: 'assistant', text: "Analyzing live feeds... The bottleneck is at Window 1 (Payment). Average wait time is 42s above target due to POS terminal delays. I recommend routing 30% of traffic to Window 2." }]);
    }, 4000);

    return () => { clearTimeout(timer1); clearTimeout(timer2); };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col h-full w-full">
      <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
        {messages.map((msg, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] p-4 rounded-xl text-sm ${msg.role === 'user' ? 'bg-zinc-100 text-zinc-900 rounded-tr-sm font-medium' : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-tl-sm'}`}>
              <span className="block text-[10px] opacity-50 mb-1 font-mono uppercase tracking-wider">{msg.role === 'user' ? 'Operation Manager' : 'C.O.D.E AI'}</span>
              {msg.text}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="bg-zinc-800 border border-zinc-700 p-3 rounded-xl rounded-tl-sm flex gap-1">
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
              <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Fake Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-900/30">
        <div className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-sm text-zinc-500 flex items-center justify-between">
          <span>Type a command or ask a question...</span>
          <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center">
            <span className="text-zinc-400 text-xs text-center border-l border-transparent">⏎</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
