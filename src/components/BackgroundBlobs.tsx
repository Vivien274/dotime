import React from 'react'

interface BackgroundBlobsProps {
  theme: 'light' | 'dark'
}

export const BackgroundBlobs: React.FC<BackgroundBlobsProps> = ({ theme }) => {
  const isDark = theme === 'dark'

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0"
      aria-hidden="true"
    >
      {/* Blob 1 : Haut droite - Teinte orange profond / coucher de soleil */}
      <div
        className="absolute animate-blob-1"
        style={{
          top: '-8%',
          right: '-12%',
          width: 'clamp(320px, 45vw, 550px)',
          height: 'clamp(320px, 45vw, 550px)',
          background: isDark
            ? 'radial-gradient(circle, rgba(255, 110, 0, 0.22) 0%, rgba(255, 140, 20, 0.08) 65%, transparent 80%)'
            : 'radial-gradient(circle, rgba(255, 87, 34, 0.55) 0%, rgba(255, 122, 0, 0.35) 60%, transparent 80%)',
          filter: 'blur(65px)',
          transform: 'translate3d(0, 0, 0)',
        }}
      />

      {/* Blob 2 : Milieu gauche - Teinte pêche ambrée dorée / éclat lumineux */}
      <div
        className="absolute animate-blob-2"
        style={{
          top: '32%',
          left: '-15%',
          width: 'clamp(340px, 48vw, 600px)',
          height: 'clamp(340px, 48vw, 600px)',
          background: isDark
            ? 'radial-gradient(circle, rgba(255, 160, 40, 0.15) 0%, rgba(255, 110, 0, 0.05) 65%, transparent 80%)'
            : 'radial-gradient(circle, rgba(255, 209, 128, 0.65) 0%, rgba(255, 167, 38, 0.4) 60%, transparent 80%)',
          filter: 'blur(75px)',
          transform: 'translate3d(0, 0, 0)',
        }}
      />

      {/* Blob 3 : Bas droite - Teinte braise chaleureuse orangée */}
      <div
        className="absolute animate-blob-3"
        style={{
          bottom: '-5%',
          right: '-10%',
          width: 'clamp(360px, 50vw, 620px)',
          height: 'clamp(360px, 50vw, 620px)',
          background: isDark
            ? 'radial-gradient(circle, rgba(230, 81, 0, 0.18) 0%, rgba(200, 60, 0, 0.05) 65%, transparent 80%)'
            : 'radial-gradient(circle, rgba(255, 111, 0, 0.5) 0%, rgba(255, 145, 0, 0.3) 60%, transparent 80%)',
          filter: 'blur(70px)',
          transform: 'translate3d(0, 0, 0)',
        }}
      />

      {/* Blob 4 : Haut gauche/centre - Teinte abricot douce en suspension */}
      <div
        className="absolute animate-blob-4"
        style={{
          top: '12%',
          left: '15%',
          width: 'clamp(260px, 35vw, 420px)',
          height: 'clamp(260px, 35vw, 420px)',
          background: isDark
            ? 'radial-gradient(circle, rgba(255, 140, 0, 0.12) 0%, transparent 75%)'
            : 'radial-gradient(circle, rgba(255, 224, 130, 0.6) 0%, rgba(255, 183, 77, 0.35) 60%, transparent 80%)',
          filter: 'blur(60px)',
          transform: 'translate3d(0, 0, 0)',
        }}
      />
    </div>
  )
}
