
import React, { useState } from 'react';
import { 
  Zap, 
  Film, 
  Cpu, 
  Command
} from 'lucide-react';
import { useVenusStore } from '../../store/useVenusStore';

interface LuminaHUDProps {
  onActivateCinema: () => void;
  onCommand: (cmd: string) => void;
}

const LuminaHUD: React.FC<LuminaHUDProps> = ({ onActivateCinema, onCommand }) => {
  const [inputValue, setInputValue] = useState('');
  const isEngineActive = useVenusStore((state) => !state.isPaused);
  const systemLoad = 42; // Placeholder estático ou via store

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      onCommand(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none flex flex-col justify-between p-6 md:p-10">
      <div className="flex justify-between items-start w-full">
        <div className="pointer-events-auto flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full shadow-2xl">
          <div className="relative">
            <Cpu size={18} className={`${isEngineActive ? 'text-indigo-400' : 'text-zinc-600'}`} />
            {isEngineActive && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-500 leading-none mb-1">Neural Kernel</span>
            <span className={`text-[10px] font-bold uppercase ${isEngineActive ? 'text-indigo-300' : 'text-zinc-700'}`}>
              {isEngineActive ? 'Sync: Active' : 'Kernel: Standby'}
            </span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-6 bg-black/40 backdrop-blur-xl border border-white/10 px-8 py-3 rounded-2xl shadow-2xl">
           <div className="flex flex-col items-end">
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">GPU Load</span>
              <div className="flex items-center gap-3">
                 <div className="w-20 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[42%]" />
                 </div>
                 <span className="text-[10px] mono font-black text-white">{systemLoad}%</span>
              </div>
           </div>
           <div className="h-8 w-[1px] bg-white/10" />
           <button 
             onClick={onActivateCinema}
             className="flex items-center gap-2 text-zinc-400 hover:text-white transition-all group"
           >
              <Film size={18} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">CinemaLab</span>
           </button>
        </div>
      </div>

      <div className="flex justify-center w-full pb-8">
        <div className="pointer-events-auto w-full max-w-2xl group">
          <div className="relative flex items-center">
            <div className="absolute left-6 text-zinc-500 group-focus-within:text-indigo-400 transition-colors">
              <Command size={18} />
            </div>
            
            <input 
              type="text"
              value={inputValue || ''}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Synthesize latent prompt or run system command..."
              className="w-full bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] pl-16 pr-32 py-6 text-sm text-white outline-none focus:border-indigo-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all placeholder:text-zinc-700"
            />

            <div className="absolute right-4 flex items-center gap-2">
              <button 
                className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-xl transition-all active:scale-95"
                onClick={() => {
                  if(inputValue.trim()) {
                    onCommand(inputValue);
                    setInputValue('');
                  }
                }}
              >
                <Zap size={18} fill="currentColor" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuminaHUD;
