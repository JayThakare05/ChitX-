import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

// ─── Root wrapper: positions the floating pill ────────────────────────────────
export function Navbar({ children, className = '' }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex justify-center pt-5 px-4 pointer-events-none ${className}`}>
      <motion.div
        initial={false}
        animate={scrolled ? 'scrolled' : 'top'}
        variants={{
          top: {
            maxWidth: '860px',
            borderRadius: '9999px',
            boxShadow: '0 2px 20px rgba(19,78,74,0.08)',
            backgroundColor: 'rgba(255,255,255,0.96)',
            paddingLeft: '20px',
            paddingRight: '20px',
          },
          scrolled: {
            maxWidth: '720px',
            borderRadius: '9999px',
            boxShadow: '0 8px 32px rgba(19,78,74,0.14)',
            backgroundColor: 'rgba(255,255,255,0.98)',
            paddingLeft: '16px',
            paddingRight: '16px',
          },
        }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="w-full pointer-events-auto border border-[#e0f2ed]"
      >
        {children}
      </motion.div>
    </div>
  );
}

// ─── Desktop pill body ────────────────────────────────────────────────────────
export function NavBody({ children, className = '' }) {
  return (
    <div className={`h-14 hidden md:flex items-center justify-between w-full ${className}`}>
      {children}
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
export function NavbarLogo({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 focus:outline-none shrink-0"
    >
      <div className="w-7 h-7 rounded-lg bg-[#134e4a] flex items-center justify-center text-white">
        <span className="font-bold text-xs leading-none">C</span>
      </div>
      <span className="text-base font-bold tracking-tight text-[#134e4a]">ChitX</span>
    </button>
  );
}

// ─── Desktop nav links ────────────────────────────────────────────────────────
export function NavItems({ items = [], className = '' }) {
  const [hovered, setHovered] = useState(null);

  return (
    <div className={`hidden md:flex items-center gap-1 ${className}`}>
      {items.map((item, i) => (
        <a
          key={i}
          href={item.link}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
          className="relative px-4 py-1.5 text-sm font-medium text-[#134e4a]/65 hover:text-[#134e4a] transition-colors rounded-full"
        >
          {/* Hover pill background */}
          {hovered === i && (
            <motion.span
              layoutId="nav-hover-bg"
              className="absolute inset-0 rounded-full bg-[#134e4a]/6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
          <span className="relative z-10">{item.name}</span>
        </a>
      ))}
    </div>
  );
}

// ─── Button variants ──────────────────────────────────────────────────────────
export function NavbarButton({ children, variant = 'primary', className = '', onClick }) {
  if (variant === 'secondary') {
    return (
      <button
        onClick={onClick}
        className={`px-4 py-1.5 text-sm font-semibold rounded-full text-[#134e4a] hover:bg-[#134e4a]/6 transition-all focus:outline-none ${className}`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 text-sm font-semibold rounded-full bg-[#134e4a] text-white hover:bg-[#0f3d3a] transition-all shadow-md shadow-[#134e4a]/20 focus:outline-none ${className}`}
    >
      {children}
    </button>
  );
}

// ─── Mobile container ─────────────────────────────────────────────────────────
export function MobileNav({ children, className = '' }) {
  return (
    <div className={`md:hidden ${className}`}>
      {children}
    </div>
  );
}

// ─── Mobile header row ────────────────────────────────────────────────────────
export function MobileNavHeader({ children, className = '' }) {
  return (
    <div className={`h-14 flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}

// ─── Hamburger toggle ─────────────────────────────────────────────────────────
export function MobileNavToggle({ isOpen, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-full text-[#134e4a] hover:bg-[#134e4a]/8 transition-colors"
      aria-label={isOpen ? 'Close menu' : 'Open menu'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
            <X size={18} />
          </motion.span>
        ) : (
          <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
            <Menu size={18} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

// ─── Mobile dropdown ──────────────────────────────────────────────────────────
export function MobileNavMenu({ isOpen, onClose, children, className = '' }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="mobile-menu"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`mt-1 rounded-2xl bg-white border border-[#e0f2ed] shadow-xl overflow-hidden ${className}`}
        >
          <div className="px-5 py-5 flex flex-col gap-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
