import { motion } from 'motion/react';

interface BakeryItemProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

export function Cupcake({ size = 100, animate = true, className = '' }: BakeryItemProps) {
  const MotionComponent = animate ? motion.div : 'div';
  const animationProps = animate ? {
    animate: {
      y: [0, -10, 0],
      rotate: [-2, 2, -2],
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
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Wrapper */}
        <path d="M 25 50 L 30 85 L 70 85 L 75 50 Z" fill="#FFD93D" stroke="#1A1A1A" strokeWidth="3"/>
        
        {/* Frosting */}
        <ellipse cx="50" cy="50" rx="28" ry="18" fill="#FF6B9D" stroke="#1A1A1A" strokeWidth="3"/>
        <ellipse cx="40" cy="42" rx="15" ry="12" fill="#FF6B9D"/>
        <ellipse cx="60" cy="42" rx="15" ry="12" fill="#FF6B9D"/>
        <ellipse cx="50" cy="38" rx="12" ry="10" fill="#FFB3D9"/>
        
        {/* Cherry on top */}
        <circle cx="50" cy="30" r="6" fill="#E63946" stroke="#1A1A1A" strokeWidth="2"/>
        <path d="M 50 30 Q 48 20, 45 18" stroke="#4CAF50" strokeWidth="2" fill="none"/>
      </svg>
    </MotionComponent>
  );
}

export function Donut({ size = 100, animate = true, className = '' }: BakeryItemProps) {
  const MotionComponent = animate ? motion.div : 'div';
  const animationProps = animate ? {
    animate: {
      rotate: [0, 360],
    },
    transition: {
      duration: 10,
      repeat: Infinity,
      ease: "linear"
    }
  } : {};

  return (
    <MotionComponent 
      className={`relative inline-block ${className}`}
      style={{ width: size, height: size }}
      {...animationProps}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Donut body */}
        <circle cx="50" cy="50" r="35" fill="#FFD93D" stroke="#1A1A1A" strokeWidth="3"/>
        <circle cx="50" cy="50" r="15" fill="#FFF9F0" stroke="#1A1A1A" strokeWidth="3"/>
        
        {/* Frosting */}
        <path d="M 50 15 A 35 35 0 0 1 85 50 A 35 35 0 0 1 50 85 A 35 35 0 0 1 15 50 A 35 35 0 0 1 50 15 Z M 50 35 A 15 15 0 0 0 35 50 A 15 15 0 0 0 50 65 A 15 15 0 0 0 65 50 A 15 15 0 0 0 50 35 Z" 
              fill="#FF6B9D"/>
        
        {/* Sprinkles */}
        <rect x="35" y="25" width="3" height="8" fill="#4169E1" rx="1.5"/>
        <rect x="55" y="30" width="3" height="8" fill="#FFD93D" rx="1.5" transform="rotate(45 56.5 34)"/>
        <rect x="68" y="45" width="3" height="8" fill="#A8CC00" rx="1.5" transform="rotate(90 69.5 49)"/>
        <rect x="65" y="65" width="3" height="8" fill="#FF8C42" rx="1.5" transform="rotate(135 66.5 69)"/>
        <rect x="45" y="70" width="3" height="8" fill="#9B6DD6" rx="1.5"/>
        <rect x="25" y="60" width="3" height="8" fill="#E63946" rx="1.5" transform="rotate(45 26.5 64)"/>
      </svg>
    </MotionComponent>
  );
}

export function Cookie({ size = 100, animate = true, className = '' }: BakeryItemProps) {
  const MotionComponent = animate ? motion.div : 'div';
  const animationProps = animate ? {
    animate: {
      scale: [1, 1.1, 1],
    },
    transition: {
      duration: 2,
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
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Cookie base */}
        <circle cx="50" cy="50" r="35" fill="#D4A373" stroke="#1A1A1A" strokeWidth="3"/>
        
        {/* Chocolate chips */}
        <circle cx="40" cy="40" r="5" fill="#5D4037"/>
        <circle cx="60" cy="45" r="6" fill="#5D4037"/>
        <circle cx="45" cy="60" r="5" fill="#5D4037"/>
        <circle cx="65" cy="60" r="4" fill="#5D4037"/>
        <circle cx="50" cy="35" r="4" fill="#5D4037"/>
        <circle cx="35" cy="55" r="5" fill="#5D4037"/>
      </svg>
    </MotionComponent>
  );
}

export function Croissant({ size = 100, animate = true, className = '' }: BakeryItemProps) {
  const MotionComponent = animate ? motion.div : 'div';
  const animationProps = animate ? {
    animate: {
      rotate: [-5, 5, -5],
    },
    transition: {
      duration: 4,
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
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Croissant shape */}
        <path d="M 20 60 Q 30 40, 50 50 Q 70 60, 80 50 L 75 65 Q 65 70, 50 65 Q 35 60, 25 70 Z" 
              fill="#FFD93D" stroke="#1A1A1A" strokeWidth="3"/>
        <path d="M 30 55 Q 40 50, 50 55" stroke="#E8B931" strokeWidth="2" fill="none"/>
        <path d="M 50 55 Q 60 60, 70 55" stroke="#E8B931" strokeWidth="2" fill="none"/>
      </svg>
    </MotionComponent>
  );
}

export function IceCream({ size = 100, animate = true, className = '' }: BakeryItemProps) {
  const MotionComponent = animate ? motion.div : 'div';
  const animationProps = animate ? {
    animate: {
      y: [0, -8, 0],
    },
    transition: {
      duration: 2.5,
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
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        {/* Cone */}
        <path d="M 40 50 L 50 85 L 60 50 Z" fill="#E8B931" stroke="#1A1A1A" strokeWidth="3"/>
        <line x1="43" y1="58" x2="47" y2="75" stroke="#D4A373" strokeWidth="1.5"/>
        <line x1="50" y1="58" x2="50" y2="78" stroke="#D4A373" strokeWidth="1.5"/>
        <line x1="57" y1="58" x2="53" y2="75" stroke="#D4A373" strokeWidth="1.5"/>
        
        {/* Ice cream scoops */}
        <circle cx="50" cy="40" r="18" fill="#FFB3D9" stroke="#1A1A1A" strokeWidth="3"/>
        <circle cx="50" cy="25" r="15" fill="#4169E1" stroke="#1A1A1A" strokeWidth="3"/>
        
        {/* Sprinkles */}
        <rect x="45" y="20" width="2" height="6" fill="#FFD93D" rx="1"/>
        <rect x="54" y="18" width="2" height="6" fill="#FF6B9D" rx="1" transform="rotate(30 55 21)"/>
      </svg>
    </MotionComponent>
  );
}
