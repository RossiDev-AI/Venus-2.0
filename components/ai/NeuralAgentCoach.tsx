import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight, Sparkles, Activity, ShieldCheck, Cpu, Terminal } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useVenusStore } from '../../store/useVenusStore';

const NeuralAgentCoach: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);
  
  const { sceneTextContext, activePreset, addSessionEvent } = useVenusStore();

  const getAgentAdvice = async () => {
    setIsConsulting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analise o status do estúdio:
        Contexto Visual: [${sceneTextContext.join(', ')}]
        Preset Ativo: ${activePreset?.name || 'V-NUS DEFAULT'}
        
        Aja como um Diretor Técnico de IA. Sugira:
        1. Refinamento de prompt focado em fidelidade física.
        2. Um ajuste exato nos pesos Z_STRUCTURE ou Z_TEXTURE para compensar o contexto.
        Seja extremamente técnico e conciso (máximo 300 caracteres).`
      });
      setAdvice(response.text || "Kernel em standby...");
      addSessionEvent("Consultation: Technical Director optimized latent trajectory.");
    } catch (e) {
      setAdvice("Falha crítica de comunicação neural. Verifique conexão.");
    } finally {
      setIsConsulting(false);
    }
  };

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[1000] flex items-center">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#0a0a0c] border-l border-y border-white/10 p-4 rounded-l-[2rem] text-indigo-400 hover:text-white transition-all shadow-2xl group flex flex-col items-center gap-3"
      >
        <Brain size={22} className={isConsulting ? "animate-pulse" : "group-hover:scale-110 transition-transform"} />
        <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 450 }}
            animate={{ x: 0 }}
            exit={{ x: 450 }}
            className="w-80 h-[520px] bg-[#0c0c0e]/95 backdrop-blur-3xl border-l border-white/10 shadow-[-30px_0_80px_rgba(0,0,0,0.8)] p-8 flex flex-col gap-6 rounded-l-[3rem]"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600/10 rounded-xl">
                  <ShieldCheck size={16} className="text-indigo-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Technical Director</span>
                  <span className="text-[7px] mono text-zinc-600 uppercase">Agent v1.2 // Consensus Layer</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/5 rounded-full"><ChevronRight size={18} className="text-zinc-600" /></button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 pr-2">
              {advice ? (
                <div className="space-y-4 animate-in fade-in duration-500">
                  <div className="text-[11px] mono text-zinc-300 leading-relaxed bg-black/50 p-6 rounded-[2rem] border border-white/5 whitespace-pre-wrap selection:bg-indigo-500/30">
                    <Terminal size={12} className="mb-3 text-indigo-500 opacity-50" />
                    {advice}
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-1 bg-indigo-500/20 rounded-full overflow-hidden">
                      <motion.div initial={{ x: -100 }} animate={{ x: 100 }} transition={{ repeat: Infinity, duration: 2 }} className="h-full w-20 bg-indigo-500" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 gap-4">
                  <Cpu size={48} className="text-zinc-700" />
                  <p className="text-[10px] uppercase font-black tracking-widest leading-relaxed">Sincronizando com o<br/>DNA do estúdio...</p>
                </div>
              )}
            </div>

            <button 
              onClick={getAgentAdvice}
              disabled={isConsulting}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              {isConsulting ? "Consultando Oráculo..." : "Get Technical Audit"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NeuralAgentCoach;
