import React, { useEffect, useState } from 'react';

interface ConfettiProps {
  onComplete: () => void;
}

// Confetti animation component for celebrating link creation
const Confetti: React.FC<ConfettiProps> = ({ onComplete }) => {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; color: string }>>([]);

  useEffect(() => {
    // Generate confetti pieces
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#6c5ce7', '#a29bfe'];
    const newPieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
    setPieces(newPieces);

    // Clean up after animation
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map(piece => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 animate-bounce-slow"
          style={{
            left: `${piece.left}%`,
            top: '-10px',
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: '3s'
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;