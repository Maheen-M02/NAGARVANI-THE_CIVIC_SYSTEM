import React from 'react';

const NagarVaniLogo = ({ size = 60, className = '' }) => {
  return (
    <div 
      className={`nagarvani-logo ${className}`}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* CSS-based logo that matches the design */}
      <div style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1e40af 0%, #0ea5e9 50%, #22c55e 100%)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        {/* City buildings silhouette */}
        <div style={{
          position: 'absolute',
          bottom: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '1px'
        }}>
          <div style={{ width: '3px', height: '8px', background: '#1e3a8a', borderRadius: '1px 1px 0 0' }} />
          <div style={{ width: '4px', height: '12px', background: '#1e3a8a', borderRadius: '1px 1px 0 0' }} />
          <div style={{ width: '3px', height: '6px', background: '#1e3a8a', borderRadius: '1px 1px 0 0' }} />
          <div style={{ width: '4px', height: '10px', background: '#1e3a8a', borderRadius: '1px 1px 0 0' }} />
        </div>
        
        {/* Megaphone icon */}
        <div style={{
          position: 'absolute',
          top: '25%',
          right: '20%',
          fontSize: size * 0.3,
          transform: 'rotate(15deg)'
        }}>
          📢
        </div>
        
        {/* NV letters */}
        <div style={{
          fontSize: size * 0.35,
          fontWeight: '900',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
          letterSpacing: '-1px'
        }}>
          NV
        </div>
      </div>
    </div>
  );
};

export default NagarVaniLogo;