import React from 'react';
import { AgentStatus, CinemaProject } from '../../types';

interface MobileControlsProps {
  title: string;
  setTitle: (v: string) => void;
  script: string;
  setScript: (v: string) => void;
  onAnalyze: () => void;
  onRender: () => void;
  onClose: () => void;
  project: CinemaProject;
  setProject: (p: CinemaProject) => void;
}

const CinemaControlsMobile: React.FC<MobileControlsProps> = ({ 
  title, setTitle, script, setScript, onAnalyze, onRender, onClose, project, setProject 
}) => {
  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Produção Mobile</h3>
        <button onClick={onClose} className="text-[10px] font-black text-indigo-400 uppercase">Fechar</button>
      </div>

      <div className="space-y-4">
        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Título do Filme</label>
        <input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none"
        />
      </div>

      <div className="space-y-4">
        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Roteiro Narrative</label>
        <textarea 
          value={script}
          onChange={(e) => setScript(e.target.value)}
          className="w-full h-32 bg-black border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => { onAnalyze(); onClose(); }}
          className="py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest"
        >
          Orquestrar
        </button>
        <button 
          onClick={onRender}
          className="py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest"
        >
          Masterizar
        </button>
      </div>

      <div className="p-6 bg-zinc-900/50 rounded-[2rem] border border-white/5 space-y-4">
        <span className="text-[9px] font-black text-zinc-500 uppercase">Aspect Ratio</span>
        <div className="grid grid-cols-3 gap-2">
          {['16:9', '9:16', '1:1'].map(ratio => (
            <button 
              key={ratio}
              onClick={() => setProject({ ...project, aspectRatio: ratio as any })}
              className={`py-2 rounded-xl text-[10px] font-bold border transition-all ${project.aspectRatio === ratio ? 'bg-white text-black' : 'bg-black text-zinc-500 border-white/5'}`}
            >
              {ratio}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CinemaControlsMobile;
