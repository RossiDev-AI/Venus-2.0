import React from 'react';
import { createRoot } from 'react-dom/client';
import { Tldraw } from 'tldraw';
import LuminaHUD from './components/lumina/LuminaHUD';
import { useVenusStore } from './store/useVenusStore';

function VenusApp() {
  // Conectamos ao store global para persistência de estado
  const setSynthesizing = useVenusStore((s) => s.setSynthesizing);

  const handleCommand = (cmd: string) => {
    console.log("Kernel Command Committed:", cmd);
    // Exemplo: Trigger de animação de síntese
    setSynthesizing(true);
    setTimeout(() => setSynthesizing(false), 3000);
  };

  return (
    <div className="relative w-screen h-screen bg-black select-none overflow-hidden">
      {/* Camada 2: HUD Overlay Interativo */}
      <LuminaHUD 
        onActivateCinema={() => console.log("CinemaLab Activated")}
        onCommand={handleCommand}
      />

      {/* Camada 1: Kernel do Canvas Tldraw */}
      <div className="absolute inset-0 z-0">
        <Tldraw 
          inferDarkMode
          persistenceKey="v-nus-production-v2"
          components={{
            HelpMenu: null,
            SharePanel: null,
            MainMenu: null,
            NavigationPanel: null,
            PageMenu: null
          }}
        />
      </div>

      {/* Camada 0: Status de Rodapé Industrial */}
      <div className="fixed bottom-4 left-6 z-[100] pointer-events-none opacity-40">
         <span className="text-[9px] mono font-black text-indigo-500 uppercase tracking-[0.4em]">
           V-NUS KERNEL ONLINE // READY
         </span>
      </div>
    </div>
  );
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<VenusApp />);
}
