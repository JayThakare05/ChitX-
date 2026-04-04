import React, { useState, useEffect, useCallback } from 'react';

/**
 * Circular3DCarousel - A true 3D rotating cylinder carousel
 * Uses pure CSS 3D transforms (rotateY + translateZ) on a parent container.
 * Each card is placed on the surface of a cylinder and the whole cylinder rotates.
 */
export default function Circular3DCarousel({ items }) {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  
  const count = items?.length || 0;
  const angleStep = 360 / count;
  // Radius calculated so cards don't overlap:  cardWidth / (2 * tan(π/count))
  const radius = Math.round(280 / (2 * Math.tan(Math.PI / count)));

  // Auto-rotation
  useEffect(() => {
    if (isHovered) return;
    const id = setInterval(() => {
      setCurrentAngle(prev => prev - 0.3); // slow continuous rotation
    }, 16); // ~60fps
    return () => clearInterval(id);
  }, [isHovered]);

  // Navigate to specific card
  const goTo = useCallback((index) => {
    setCurrentAngle(-index * angleStep);
  }, [angleStep]);

  if (!items || count === 0) return null;

  return (
    <div className="relative w-full flex flex-col items-center gap-12">
      {/* 3D Scene */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{ 
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
          height: '480px',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Rotating cylinder */}
        <div
          style={{
            width: '280px',
            height: '380px',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: `rotateY(${currentAngle}deg)`,
            transition: isHovered ? 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
          }}
        >
          {items.map((item, i) => {
            const cardAngle = i * angleStep;
            return (
              <div
                key={i}
                onClick={() => goTo(i)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '280px',
                  height: '380px',
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${cardAngle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: 'hidden',
                  cursor: 'pointer',
                }}
              >
                <FeatureCard item={item} index={i} />
              </div>
            );
          })}
        </div>

        {/* Reflection/glow underneath */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full pointer-events-none"
          style={{
            width: `${radius * 2.5}px`,
            height: '120px',
            background: 'radial-gradient(ellipse, rgba(26,160,140,0.08) 0%, transparent 70%)',
            filter: 'blur(20px)',
          }}
        />
      </div>

      {/* Navigation dots */}
      <div className="flex gap-3 items-center justify-center">
        {items.map((_, i) => {
          // Calculate which card is closest to front
          const normalizedAngle = ((currentAngle % 360) + 360) % 360;
          const cardFrontAngle = (i * angleStep);
          const diff = Math.abs(((normalizedAngle + cardFrontAngle) % 360 + 360) % 360);
          const isActive = diff < angleStep / 2 || diff > 360 - angleStep / 2;
          
          return (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300"
              style={{
                width: isActive ? '32px' : '10px',
                height: '10px',
                borderRadius: '999px',
                background: isActive 
                  ? 'linear-gradient(135deg, #134e4a, #1aa08c)' 
                  : 'rgba(19,78,74,0.15)',
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label={`Go to feature ${i + 1}`}
            />
          );
        })}
      </div>

      {/* Hover hint */}
      <p className="text-[#134e4a]/25 text-[10px] font-bold uppercase tracking-[0.3em]">
        Hover to pause · Click to focus
      </p>
    </div>
  );
}

/* ─── Individual Feature Card ──────────────────────────────────── */
function FeatureCard({ item, index }) {
  // Per-card accent colors matching the teal theme
  const accents = [
    { bg: '#e8faf5', bar: '#1aa08c', glow: 'rgba(26,160,140,0.15)' },
    { bg: '#eef4ff', bar: '#4f7cff', glow: 'rgba(79,124,255,0.15)' },
    { bg: '#fef3e8', bar: '#e8913a', glow: 'rgba(232,145,58,0.15)' },
    { bg: '#edfaf7', bar: '#0d9488', glow: 'rgba(13,148,136,0.15)' },
    { bg: '#fdf2f8', bar: '#d946b8', glow: 'rgba(217,70,184,0.15)' },
    { bg: '#f0fdf4', bar: '#22c55e', glow: 'rgba(34,197,94,0.15)' },
  ];
  const accent = accents[index % accents.length];

  // Simulated chart data per card
  const chartData = [
    [40, 65, 45, 80, 60, 75, 55, 85, 50, 70],
    [30, 50, 70, 55, 85, 45, 65, 90, 40, 60],
    [55, 75, 35, 60, 80, 50, 70, 45, 85, 65],
    [70, 45, 60, 80, 35, 55, 75, 90, 50, 65],
    [45, 80, 55, 40, 70, 85, 60, 50, 75, 65],
    [60, 40, 75, 55, 85, 45, 70, 80, 50, 65],
  ];
  const bars = chartData[index % chartData.length];

  const Icon = item.icon;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '24px',
        background: '#ffffff',
        border: '1px solid rgba(19,78,74,0.06)',
        boxShadow: `
          0 20px 60px rgba(19,78,74,0.08),
          0 4px 20px rgba(19,78,74,0.04),
          inset 0 1px 0 rgba(255,255,255,0.9)
        `,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top accent bar */}
      <div style={{ 
        height: '4px', 
        background: `linear-gradient(90deg, ${accent.bar}, ${accent.bar}88)`,
        borderRadius: '0 0 4px 4px',
      }} />

      {/* Card content */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        padding: '28px 24px 20px',
        gap: '16px',
      }}>
        {/* Icon + Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: accent.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent.bar,
            flexShrink: 0,
          }}>
            <Icon size={24} />
          </div>
          <h3 style={{
            fontSize: '17px',
            fontWeight: 700,
            color: '#134e4a',
            lineHeight: 1.3,
            letterSpacing: '-0.02em',
            margin: 0,
          }}>
            {item.title}
          </h3>
        </div>

        {/* Description */}
        <p style={{
          fontSize: '13px',
          color: 'rgba(19,78,74,0.55)',
          lineHeight: 1.6,
          margin: 0,
          flex: 1,
        }}>
          {item.desc}
        </p>

        {/* Mini chart visualization - like the reference image */}
        <div style={{
          background: accent.bg,
          borderRadius: '16px',
          padding: '16px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Chart bars */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '4px',
            height: '60px',
            marginBottom: '10px',
          }}>
            {bars.map((h, bi) => (
              <div
                key={bi}
                style={{
                  flex: 1,
                  height: `${h}%`,
                  borderRadius: '4px 4px 2px 2px',
                  background: bi === 7 
                    ? accent.bar 
                    : `${accent.bar}30`,
                  transition: 'height 0.5s ease',
                }}
              />
            ))}
          </div>
          {/* Chart label row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 800,
              color: 'rgba(19,78,74,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              Analytics
            </span>
            <span style={{
              fontSize: '12px',
              fontWeight: 700,
              color: accent.bar,
            }}>
              +{Math.round(bars.reduce((a,b) => a+b, 0) / bars.length)}%
            </span>
          </div>
        </div>
      </div>

      {/* Subtle corner glow */}
      <div style={{
        position: 'absolute',
        top: '-40px',
        right: '-40px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: accent.glow,
        filter: 'blur(40px)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}
