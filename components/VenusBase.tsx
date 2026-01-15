
// V-NUS 2.0 - MARCO ZERO
// Dependência Zero. Apenas React Global.

const React = (window as any).React;
const { useState } = React;

const VenusBase = () => {
  const [status, setStatus] = useState('Sistema em Espera');

  const handleActivate = () => {
    console.log('IA Ativa');
    setStatus('IA Ativa - Kernel Online');
  };

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
      backgroundColor: '#000000', 
      color: '#e5e5e5', 
      height: '100dvh',
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    }}>
      <h1 style={{ 
        fontSize: '1.5rem', 
        fontWeight: '900', 
        textTransform: 'uppercase', 
        letterSpacing: '0.1em',
        marginBottom: '1.5rem',
        color: '#ffffff'
      }}>
        V-nus 2.0: Reinicializado
      </h1>

      <div style={{
        padding: '1rem',
        marginBottom: '2rem',
        border: '1px solid #333',
        borderRadius: '12px',
        fontSize: '0.8rem',
        color: '#888'
      }}>
        Status: <span style={{ color: '#4ade80', fontWeight: 'bold' }}>{status}</span>
      </div>

      <button
        onClick={handleActivate}
        style={{
          padding: '16px 32px',
          backgroundColor: '#4f46e5',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)'
        }}
      >
        Ativar Console
      </button>
    </div>
  );
};

export default VenusBase;
