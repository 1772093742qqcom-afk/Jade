import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import '../types';

export const Ocean: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Generate a procedural normal map texture with flow streaks
  const normalMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    if (context) {
      // Base
      context.fillStyle = '#8080ff'; 
      context.fillRect(0, 0, 1024, 1024);
      
      // Flow Streaks (Long ellipses) - INCREASED count for more waves
      for (let i = 0; i < 12000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const width = 100 + Math.random() * 250; 
        const height = 4 + Math.random() * 8;
        const angle = (Math.random() - 0.5) * 0.2; 
        
        context.save();
        context.translate(x, y);
        context.rotate(angle);
        
        const shade = Math.floor(Math.random() * 255);
        context.fillStyle = `rgba(${shade}, ${shade}, 255, 0.15)`; // Slightly increased opacity
        context.beginPath();
        context.ellipse(0, 0, width, height, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      // High Density Ripples - INCREASED count
      for (let i = 0; i < 200000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const r = Math.random() * 4 + 1; 
        const shade = Math.floor(Math.random() * 200); 
        context.fillStyle = `rgba(${shade}, ${shade}, 255, 0.12)`; 
        context.beginPath();
        context.arc(x, y, r, 0, Math.PI * 2);
        context.fill();
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4); 
    return texture;
  }, []);

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Animate texture offset for flow
      normalMap.offset.x += delta * 0.06; // Faster flow
      normalMap.offset.y += delta * 0.01; // Slight drift
    }
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <planeGeometry args={[200, 200, 256, 256]} />
      <meshStandardMaterial 
        normalMap={normalMap}
        normalScale={new THREE.Vector2(2, 2)}
        color="#003366" 
        roughness={0.05}
        metalness={0.8}
        emissive="#001133" 
        emissiveIntensity={0.3}
      />
    </mesh>
  );
};