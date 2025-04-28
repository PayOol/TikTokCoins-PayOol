import { useEffect, useState } from 'react';

interface ConfettiProps {
  duration?: number;
}

export const Confetti = ({ duration = 3000 }: ConfettiProps) => {
  const [pieces, setPieces] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    rotation: number;
    color: string;
    delay: number;
  }>>([]);

  useEffect(() => {
    // Générer les pièces de confettis
    const colors = [
      'var(--tiktok-red)',
      'var(--tiktok-blue)',
      'var(--tiktok-cyan)',
      '#FFD700', // Or
      '#9C27B0', // Violet
      '#00E676', // Vert
    ];
    
    const newPieces = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100, // Position X en pourcentage
      y: -10 - Math.random() * 20, // Position Y initiale au-dessus de l'écran
      size: 5 + Math.random() * 15, // Taille entre 5 et 20px
      rotation: Math.random() * 360, // Rotation initiale
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 500, // Délai avant de commencer l'animation
    }));
    
    setPieces(newPieces);
    
    // Nettoyer les confettis après la durée spécifiée
    const timer = setTimeout(() => {
      setPieces([]);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [duration]);
  
  if (pieces.length === 0) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute confetti-piece"
          style={{
            left: `${piece.x}%`,
            top: `${piece.y}%`,
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            transform: `rotate(${piece.rotation}deg)`,
            opacity: 0.8,
            animation: `fall ${1 + Math.random() * 2}s linear forwards ${piece.delay}ms, 
                        sway ${2 + Math.random() * 3}s ease-in-out infinite alternate ${piece.delay}ms`,
          }}
        />
      ))}
    </div>
  );
};
