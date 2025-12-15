import React, { useState } from 'react';
import { Html, Float, useCursor } from '@react-three/drei';
import { StarData } from '../types';

interface StarsProps {
  data: StarData[];
  onStarClick: (id: number) => void;
  onStarView: (id: number) => void;
}

const StarShape: React.FC<{ isActive: boolean; onClick: (e: any) => void; onHover: (v: boolean) => void }> = ({ isActive, onClick, onHover }) => {
  return (
    <group 
        onClick={onClick}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
        scale={isActive ? 0.8 : 0.5} // Active stars are larger
    >
        {/* Core */}
        <mesh>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial 
                color={isActive ? "#fffdd0" : "#ffffff"} 
                toneMapped={false} 
            />
        </mesh>
        
        {/* Rays */}
        <mesh scale={[0.02, 1.5, 0.02]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial 
                color={isActive ? "#fff5cc" : "#fffacd"} 
                transparent 
                opacity={isActive ? 1 : 0.6} 
                toneMapped={false} 
            />
        </mesh>
        
        <mesh rotation={[0, 0, Math.PI / 2]} scale={[0.02, 1.5, 0.02]}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial 
                color={isActive ? "#fff5cc" : "#fffacd"} 
                transparent 
                opacity={isActive ? 1 : 0.6} 
                toneMapped={false} 
            />
        </mesh>

        {/* Extra glow */}
        {isActive && (
            <mesh>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial color="#ffddaa" transparent opacity={0.3} toneMapped={false} />
            </mesh>
        )}
    </group>
  );
};

// Robust Image Component that handles errors
const SafeImage: React.FC<{ src: string; className?: string; onClick?: (e: any) => void }> = ({ src, className, onClick }) => {
    const [hasError, setHasError] = useState(false);

    if (hasError) {
        return (
            <div 
                className={`${className} flex items-center justify-center bg-slate-800 border border-slate-600 text-slate-500`} 
                onClick={onClick}
            >
                <div className="text-center">
                    <div className="text-2xl mb-1">⚠</div>
                    <div className="text-[8px] uppercase tracking-widest">Image Lost</div>
                </div>
            </div>
        );
    }

    return (
        <img 
            src={src} 
            className={className} 
            onClick={onClick}
            onError={() => setHasError(true)}
            alt="memory"
        />
    );
};

const Star: React.FC<{ star: StarData; onStarClick: (id: number) => void; onStarView: (id: number) => void }> = ({ star, onStarClick, onStarView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [expandedImgIndex, setExpandedImgIndex] = useState<number | null>(null);
  
  useCursor(hovered);

  const handleClick = (e: any) => {
      e.stopPropagation();
      if (star.isActive) {
          if (!isOpen) {
              onStarView(star.id);
          }
          setIsOpen(!isOpen);
          setExpandedImgIndex(null); // Reset expansion on open/close
      } else {
          onStarClick(star.id);
      }
  };

  const handleEdit = (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen(false);
      onStarClick(star.id);
  };

  return (
    <group position={star.position}>
        <Float speed={1 + Math.random()} rotationIntensity={0.5} floatIntensity={0.5}>
            <StarShape isActive={star.isActive} onClick={handleClick} onHover={setHovered} />
            <pointLight 
                distance={star.isActive ? 6 : 3} 
                intensity={star.isActive ? 3 : 0.5} 
                color={star.isActive ? "#ffeedd" : "#ffffff"} 
            />
        </Float>

        {/* Content Popup */}
        {isOpen && star.isActive && (
            <Html position={[0, 0.5, 0]} center className="pointer-events-none z-50">
                <div 
                    className="bg-black/90 backdrop-blur-md border border-cyan-500/50 p-4 rounded-lg text-center shadow-[0_0_30px_rgba(0,200,255,0.2)] pointer-events-auto transform transition-all animate-fade-in-up flex flex-col"
                    style={{ width: '90vw', maxWidth: '500px', maxHeight: '80vh' }}
                >
                    
                    {/* Header */}
                    <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2 text-right">
                        Opens: {star.viewCount}
                    </div>

                    {/* Image Area - Interactive Grid */}
                    {star.images && star.images.length > 0 && (
                        <div className="w-full h-64 mb-3 transition-all duration-300 ease-in-out shrink-0">
                            {expandedImgIndex === null ? (
                                // Default 2x2 Grid (or less if fewer images)
                                <div className={`grid gap-1 h-full w-full ${star.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2 grid-rows-2'}`}>
                                    {star.images.map((img, idx) => (
                                        <div key={idx} className="relative w-full h-full overflow-hidden rounded group">
                                            <SafeImage 
                                                src={img} 
                                                className="w-full h-full object-cover cursor-pointer group-hover:scale-110 transition-transform duration-500" 
                                                onClick={(e) => { e.stopPropagation(); setExpandedImgIndex(idx); }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                // Expanded Layout: One Big, Others Squeezed on Right
                                <div className="flex h-full gap-2">
                                    {/* The Expanded Image */}
                                    <div 
                                        className="flex-grow h-full cursor-pointer relative overflow-hidden rounded border border-cyan-400/50 shadow-lg"
                                        onClick={(e) => { e.stopPropagation(); setExpandedImgIndex(null); }}
                                    >
                                        <SafeImage 
                                            src={star.images[expandedImgIndex]} 
                                            className="w-full h-full object-contain bg-black/50" 
                                        />
                                        <div className="absolute bottom-2 right-2 text-[10px] text-white/50 uppercase tracking-widest bg-black/50 px-2 rounded">
                                            Click to restore
                                        </div>
                                    </div>
                                    
                                    {/* The "Squeezed" Column */}
                                    {star.images.length > 1 && (
                                        <div className="flex flex-col gap-1 w-16 shrink-0 h-full overflow-y-auto custom-scrollbar">
                                            {star.images.map((img, idx) => {
                                                if (idx === expandedImgIndex) return null;
                                                return (
                                                    <SafeImage 
                                                        key={idx} 
                                                        src={img} 
                                                        className="w-full h-16 object-cover rounded opacity-60 hover:opacity-100 cursor-pointer transition-opacity border border-white/10"
                                                        onClick={(e) => { e.stopPropagation(); setExpandedImgIndex(idx); }}
                                                    />
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Text Area */}
                    {star.text && (
                        <div className="overflow-y-auto pr-2 custom-scrollbar text-left grow min-h-0">
                             <p className="text-cyan-50 font-serif text-sm leading-relaxed whitespace-pre-wrap">{star.text}</p>
                        </div>
                    )}
                    
                    <div className="mt-3 flex justify-between items-center shrink-0">
                        <button 
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} 
                            className="text-[10px] text-slate-400 hover:text-white uppercase tracking-widest"
                        >
                            Close
                        </button>
                        
                        {star.viewCount >= 10 && (
                            <button 
                                onClick={handleEdit}
                                className="text-[10px] bg-cyan-900/50 hover:bg-cyan-700/50 text-cyan-200 px-3 py-1 rounded border border-cyan-500/30 uppercase tracking-widest transition-colors"
                            >
                                Edit Star
                            </button>
                        )}
                    </div>
                </div>
            </Html>
        )}
    </group>
  );
};

export const Stars: React.FC<StarsProps> = ({ data, onStarClick, onStarView }) => {
  return (
    <group>
      {data.map((star) => (
        <Star key={star.id} star={star} onStarClick={onStarClick} onStarView={onStarView} />
      ))}
    </group>
  );
};