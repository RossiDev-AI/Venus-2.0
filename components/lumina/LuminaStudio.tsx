
// LUMINA STUDIO - PROTOCOLO CHASSI LIMPO (V-NUS 2.0)
// Foco: Renderizar o Canvas sem erros de Objeto/React.

import { Tldraw } from 'tldraw';
import { AppSettings } from '../../types';

// 1. VINCULAÇÃO EXPLÍCITA AO REACT GLOBAL
// Isso impede que o bundler tente injetar uma segunda cópia do React, que causa o Erro #31 e conflitos de Hooks.
const React = (window as any).React;
const { useState, useEffect } = React;

interface LuminaStudioProps {
  settings: AppSettings;
}

const LuminaStudio = ({ settings }: LuminaStudioProps) => {
  const [isMounted, setIsMounted] = useState(false);

  // Garante que o componente só renderize no cliente após o DOM estar pronto
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100dvh',
        backgroundColor: '#000000',
        overflow: 'hidden',
        zIndex: 0,
        touchAction: 'none' // Previne scroll elástico no iOS
      }}
    >
      <Tldraw
        inferDarkMode
        components={{
          // Desativa toda a UI padrão para garantir leveza inicial
          HelpMenu: null,
          MainMenu: null,
          NavigationPanel: null,
          PageMenu: null,
          DebugPanel: null,
          SharePanel: null,
          StylePanel: null,
          Minimap: null
        }}
      />
      
      {/* Indicador Visual de Chassi Limpo */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 1000,
        opacity: 0.5
      }}>
        <span style={{ 
          fontSize: '10px', 
          fontFamily: 'monospace', 
          color: '#4ade80', 
          textTransform: 'uppercase', 
          fontWeight: 'bold',
          letterSpacing: '2px'
        }}>
          V-NUS KERNEL ONLINE
        </span>
      </div>
    </div>
  );
};

export default LuminaStudio;
