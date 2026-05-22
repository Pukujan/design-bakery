import { motion } from 'motion/react';

interface FlowerCharacterProps {
  color?: string;
  size?: number;
  animate?: boolean;
  showFace?: boolean;
  showArms?: boolean;
  className?: string;
}

export function FlowerCharacter({ 
  color = '#FF6B9D', 
  size = 120, 
  animate = true,
  showFace = true,
  showArms = false,
  className = ''
}: FlowerCharacterProps) {
  const petals = 6;
  const centerSize = size * 0.35;
  const petalSize = size * 0.35;

  const MotionComponent = animate ? motion.div : 'div';
  const animationProps = animate ? {
    animate: {
      rotate: [0, 5, -5, 0],
      scale: [1, 1.05, 1],
    },
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  } : {};

  return (
    <MotionComponent 
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      {...animationProps}
    >
      {/* Petals */}
      <svg width={size} height={size} viewBox="0 0 120 120" className="absolute inset-0">
        {[...Array(petals)].map((_, i) => {
          const angle = (i * 360) / petals;
          return (
            <g key={i} transform={`rotate(${angle} 60 60)`}>
              <ellipse
                cx="60"
                cy="30"
                rx={petalSize * 0.6}
                ry={petalSize}
                fill={color}
                opacity="0.95"
              />
            </g>
          );
        })}
      </svg>

      {/* Center face */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ 
          width: centerSize, 
          height: centerSize,
          backgroundColor: '#FFD93D',
          border: '3px solid #1A1A1A'
        }}
      >
        {showFace && (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Eyes */}
            <div className="absolute top-[35%] left-[30%] w-2 h-2 bg-black rounded-full" />
            <div className="absolute top-[35%] right-[30%] w-2 h-2 bg-black rounded-full" />
            {/* Smile */}
            <div 
              className="absolute top-[50%] left-1/2 -translate-x-1/2 w-4 h-2 border-b-2 border-black rounded-b-full"
            />
          </div>
        )}
      </div>

      {/* Arms */}
      {showArms && (
        <>
          <div 
            className="absolute top-1/2 left-0 w-8 h-3 rounded-full"
            style={{ 
              backgroundColor: color,
              transform: 'translateY(-50%) rotate(-20deg)',
              transformOrigin: 'right center'
            }}
          />
          <div 
            className="absolute top-1/2 right-0 w-8 h-3 rounded-full"
            style={{ 
              backgroundColor: color,
              transform: 'translateY(-50%) rotate(20deg)',
              transformOrigin: 'left center'
            }}
          />
        </>
      )}
    </MotionComponent>
  );
}
