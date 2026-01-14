import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Wand2, Palette, Sun, Database, ChevronUp, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { useVenusStore } from '../../store/useVenusStore';
import { LUMINA_PRESETS } from '../../presets';

type TabType = 'Geração' | 'Croma' | 'Luz' | 'Vault';

const MobileBottomHUD: React.FC = () => {
  const { activePreset, setActivePreset, setSynthesizing } = useVenusStore();
  const [activeTab, setActiveTab] = useState<TabType>('Geração');
  const [isOpen, setIsOpen] = useState(false);

  const updateGrading = (key: string, val: number) => {
    if (!activePreset) {
      // Inicializa com o primeiro preset se nenhum estiver ativo
      const base = LUMINA_PRESETS[0];
      setActivePreset({ ...base, grading: { ...base.grading, [key]: val } });
      return;
    }
    setActivePreset({
      ...activePreset,
      grading: { ...activePreset.grading, [key]: val }
    });
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.velocity.y > 20 || info.offset.y > 100) setIsOpen(false);
    else if (info.velocity.y < -20 || info.offset.y < -100) setIsOpen(true);
  };

  const renderSlider = (label: string, key: string, min: number, max: number, step: number) => {
    const val = (activePreset?.grading as any)?.[key] ?? (min + max) / 2;
    return (
      <div className="space-y-4 py-2">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
          <span className="text-[10px] mono text-indigo-400 font-bold">{val.toFixed(2)}</span>
        </div>
        <div className="relative h-6 flex items-center">
          <div className="absolute w-full h-[2px] bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
              style={{ width: `${((val - min) / (max - min)) * 100}%` }} 
            />
          </div>
          <input 
            type="range" min={min} max={max} step={step} value={val}
            onChange={(e) => updateGrading(key, parseFloat(e.target.value))}
            className="absolute w-full h-full opacity-0 cursor-pointer z-10"
          />
          {/* Custom Thumb Visual */}
          <div 
            className="absolute w-5 h-5 bg-white border-2 border-indigo-500 rounded-full shadow-lg pointer-events-none transition-transform active:scale-125"
            style={{ left: `calc(${((val - min) / (max - min)) * 100}% - 10px)` }}
          />
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial="closed"
      animate={isOpen ? "open" : "closed"}
      variants={{
        open: { y: '0%' },
        closed: { y: '88%' }
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.05}
      onDragEnd={handleDragEnd}
      className="fixed inset-x-0 bottom-0 z-[1000] bg-black/80 backdrop-blur-2xl border-t border-indigo-500/20 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(0,0,0,0.8)] flex flex-col h-[65vh]"
    >
      {/* Drag Handle & Minimal Nav */}
      <div className="flex flex-col items-center py-4 shrink-0">
        <div className="w-12 h-1 bg-zinc-800 rounded-full mb-4" />
        
        <div className="flex justify-around w-full px-4">
          {[
            { id: 'Geração', icon: <Wand2 size={18} /> },
            { id: 'Croma', icon: <Palette size={18} /> },
            { id: 'Luz', icon: <Sun size={18} /> },
            { id: 'Vault', icon: <Database size={18} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as TabType); setIsOpen(true); }}
              className={`p-3 rounded-2xl transition-all flex flex-col items-center gap-1 ${activeTab === tab.id ? 'text-indigo-400 scale-110' : 'text-zinc-600'}`}
            >
              {tab.icon}
              <span className="text-[7px] font-black uppercase tracking-tighter">{tab.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Controls Content */}
      <div className="flex-1 overflow-y-auto px-8 pb-12 custom-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8 pt-4"
          >
            {activeTab === 'Geração' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Meta-Directive</label>
                  <textarea 
                    className="w-full h-24 bg-white/5 border border-white/10 rounded-2xl p-4 text-xs text-white outline-none focus:border-indigo-500/40"
                    placeholder="Refine a síntese aqui..."
                  />
                </div>
                <button 
                  onClick={() => setSynthesizing(true)}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] shadow-xl shadow-indigo-900/40"
                >
                  Regenerar DNA
                </button>
              </div>
            )}

            {activeTab === 'Croma' && (
              <div className="space-y-4">
                {renderSlider('Saturação', 'saturation', 0, 2, 0.01)}
                {renderSlider('Contraste', 'contrast', 0.5, 1.5, 0.01)}
                {renderSlider('Matiz (Hue)', 'hue', -180, 180, 1)}
              </div>
            )}

            {activeTab === 'Luz' && (
              <div className="space-y-4">
                {renderSlider('Exposição', 'exposure', -2, 2, 0.01)}
                {renderSlider('Brilho', 'brightness', 0.5, 1.5, 0.01)}
                {renderSlider('Industrial Bloom', 'bloom', 0, 1, 0.01)}
              </div>
            )}

            {activeTab === 'Vault' && (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="aspect-square bg-white/5 border border-white/10 rounded-xl animate-pulse" />
                ))}
                <p className="col-span-3 text-center text-[8px] text-zinc-600 uppercase font-black py-4">Sincronizando com Vault Repository...</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Toggle State (Haptic Sim) */}
      <button 
        onClick={() => { 
          setIsOpen(!isOpen);
          if (navigator.vibrate) navigator.vibrate(5);
        }}
        className="absolute -top-12 left-1/2 -translate-x-1/2 w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center border border-indigo-400 shadow-2xl text-white md:hidden"
      >
        <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
          <ChevronUp size={20} />
        </motion.div>
      </button>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 0px; }
      `}</style>
    </motion.div>
  );
};

export default MobileBottomHUD;