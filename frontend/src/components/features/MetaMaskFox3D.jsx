import React from 'react';
import { motion } from 'framer-motion';

/**
 * MetaMaskFox3D - Embeds the real MetaMask 3D fox model from Sketchfab
 * Auto-starts and auto-spins with a transparent background
 */
export default function MetaMaskFox3D({ size = 280 }) {
  // Sketchfab embed with autostart, autospin, transparent bg, no UI
  const embedUrl = 
    'https://sketchfab.com/models/d2a277a039cb40cdb6fca17d806fe7f6/embed' +
    '?autostart=1' +
    '&autospin=0.8' +
    '&camera=0' +
    '&transparent=1' +
    '&ui_animations=0' +
    '&ui_infos=0' +
    '&ui_stop=0' +
    '&ui_inspector=0' +
    '&ui_watermark_link=0' +
    '&ui_watermark=0' +
    '&ui_ar=0' +
    '&ui_help=0' +
    '&ui_settings=0' +
    '&ui_vr=0' +
    '&ui_fullscreen=0' +
    '&ui_annotations=0' +
    '&ui_hint=0' +
    '&ui_controls=0' +
    '&navigation=0' +
    '&scrollwheel=0' +
    '&dnt=1' +
    '&preload=1';

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Ambient glow behind the fox */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [0.9, 1.1, 0.9] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: '90%',
          height: '90%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(226,118,27,0.2) 0%, rgba(226,118,27,0.05) 50%, transparent 70%)',
          filter: 'blur(30px)',
          zIndex: 0,
        }}
      />

      {/* Outer orbital ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: '-12px',
          borderRadius: '50%',
          border: '1.5px solid rgba(173,235,221,0.1)',
          borderTopColor: 'rgba(173,235,221,0.3)',
          borderRightColor: 'rgba(226,118,27,0.2)',
        }}
      />

      {/* Inner orbital ring */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          inset: '8px',
          borderRadius: '50%',
          border: '1px dashed rgba(26,160,140,0.12)',
          borderBottomColor: 'rgba(226,118,27,0.25)',
        }}
      />

      {/* The actual 3D Sketchfab model */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          zIndex: 2,
          position: 'relative',
        }}
      >
        <iframe
          title="MetaMask Fox 3D"
          src={embedUrl}
          style={{
            width: size + 200,
            height: size + 260,
            border: 'none',
            marginLeft: '-100px',
            marginTop: '-80px',
            pointerEvents: 'none',
            display: 'block',
          }}
          allow="autoplay; fullscreen; xr-spatial-tracking"
          loading="lazy"
        />
        {/* Overlay blocks all Sketchfab UI interaction */}
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          cursor: 'default',
        }} />
      </div>

      {/* Pulsing glow underneath */}
      <motion.div
        animate={{ scaleX: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: '-5px',
          width: '55%',
          height: '14px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(226,118,27,0.3) 0%, transparent 70%)',
          filter: 'blur(8px)',
          zIndex: 1,
        }}
      />

      {/* Label */}
      <div
        style={{
          position: 'absolute',
          bottom: '-22px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '9px',
          fontWeight: 800,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: 'rgba(173,235,221,0.3)',
          whiteSpace: 'nowrap',
        }}
      >
        MetaMask · Web3
      </div>
    </div>
  );
}
