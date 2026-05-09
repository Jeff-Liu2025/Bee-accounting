import React from 'react';

interface BeeIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const BeeIcon: React.FC<BeeIconProps> = ({ size = 24, className = '', animate = false }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className={`${animate ? 'animate-bee-fly' : ''} ${className}`}
    >
      {/* 翅膀 */}
      <ellipse cx="20" cy="22" rx="12" ry="8" fill="rgba(255,255,255,0.7)" stroke="#E8A838" strokeWidth="1.5" className={animate ? 'animate-wing-flap origin-right' : ''} />
      <ellipse cx="44" cy="22" rx="12" ry="8" fill="rgba(255,255,255,0.7)" stroke="#E8A838" strokeWidth="1.5" className={animate ? 'animate-wing-flap origin-left' : ''} />
      {/* 身体 */}
      <ellipse cx="32" cy="36" rx="14" ry="18" fill="#E8A838" />
      {/* 条纹 */}
      <path d="M20 30h24M18 36h28M20 42h24" stroke="#2C2416" strokeWidth="3" strokeLinecap="round" />
      {/* 眼睛 */}
      <circle cx="28" cy="26" r="2.5" fill="#2C2416" />
      <circle cx="36" cy="26" r="2.5" fill="#2C2416" />
      <circle cx="28.5" cy="25.5" r="0.8" fill="white" />
      <circle cx="36.5" cy="25.5" r="0.8" fill="white" />
      {/* 触角 */}
      <path d="M28 20c-2-4-4-6-6-6M36 20c2-4 4-6 6-6" stroke="#2C2416" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="22" cy="14" r="2" fill="#E8A838" />
      <circle cx="42" cy="14" r="2" fill="#E8A838" />
      {/* 尾针 */}
      <path d="M32 54l-2 6h4l-2-6z" fill="#2C2416" />
    </svg>
  );
};

interface HoneyDropProps {
  className?: string;
}

export const HoneyDrop: React.FC<HoneyDropProps> = ({ className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <div className="w-3 h-3 rounded-full bg-gradient-to-b from-[#E8A838] to-[#D49420]" />
      <div className="absolute top-2 left-1 w-1 bg-gradient-to-b from-[#E8A838] to-transparent animate-honey-drip rounded-full" />
    </div>
  );
};

interface PollenParticleProps {
  className?: string;
  delay?: number;
}

export const PollenParticle: React.FC<PollenParticleProps> = ({ className = '', delay = 0 }) => {
  return (
    <div
      className={`w-2 h-2 rounded-full bg-gradient-to-br from-[#FFE135] to-[#FF9F1C] animate-pollen-float ${className}`}
      style={{ animationDelay: `${delay}s` }}
    />
  );
};

interface HexagonProps {
  size?: number;
  className?: string;
  filled?: boolean;
  style?: React.CSSProperties;
}

export const Hexagon: React.FC<HexagonProps> = ({ size = 40, className = '', filled = false, style }) => {
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 60 69"
      className={className}
      style={style}
    >
      <path
        d="M30 0l25.98 15v30L30 60 4.02 45V15z"
        fill={filled ? 'rgba(232, 168, 56, 0.15)' : 'none'}
        stroke="rgba(232, 168, 56, 0.3)"
        strokeWidth="1.5"
      />
    </svg>
  );
};

interface HiveBackgroundProps {
  className?: string;
}

export const HiveBackground: React.FC<HiveBackgroundProps> = ({ className = '' }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* 蜂巢图案 */}
      <div className="absolute inset-0 hive-pattern opacity-50" />
      {/* 漂浮的花粉 */}
      <PollenParticle className="absolute top-[10%] left-[15%]" delay={0} />
      <PollenParticle className="absolute top-[25%] right-[20%]" delay={1} />
      <PollenParticle className="absolute top-[60%] left-[10%]" delay={2} />
      <PollenParticle className="absolute top-[75%] right-[15%]" delay={0.5} />
      <PollenParticle className="absolute top-[40%] left-[80%]" delay={1.5} />
      <PollenParticle className="absolute top-[85%] left-[50%]" delay={2.5} />
      {/* 装饰六边形 */}
      <Hexagon size={60} className="absolute top-[5%] right-[5%] opacity-20 animate-hex-pulse" />
      <Hexagon size={40} className="absolute top-[15%] left-[8%] opacity-15 animate-hex-pulse" style={{ animationDelay: '1s' }} />
      <Hexagon size={50} className="absolute bottom-[20%] right-[10%] opacity-20 animate-hex-pulse" style={{ animationDelay: '2s' }} />
      <Hexagon size={35} className="absolute bottom-[10%] left-[15%] opacity-15 animate-hex-pulse" style={{ animationDelay: '0.5s' }} />
    </div>
  );
};

interface BeeTrailProps {
  className?: string;
}

export const BeeTrail: React.FC<BeeTrailProps> = ({ className = '' }) => {
  return (
    <svg className={`absolute pointer-events-none ${className}`} width="200" height="100" viewBox="0 0 200 100">
      <path
        d="M0 50 Q50 10, 100 50 T200 50"
        fill="none"
        stroke="rgba(232, 168, 56, 0.2)"
        strokeWidth="2"
        strokeDasharray="5,5"
      />
      <circle cx="0" cy="50" r="3" fill="#E8A838" opacity="0.4">
        <animate attributeName="cx" from="0" to="200" dur="3s" repeatCount="indefinite" />
        <animate attributeName="cy" values="50;10;50;90;50" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};
