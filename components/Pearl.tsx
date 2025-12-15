import React from 'react';
import { Float } from '@react-three/drei';

export const Pearl: React.FC = () => {
  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group position={[0, 1, 0]}>
        <mesh castShadow receiveShadow>
            <sphereGeometry args={[2.5, 64, 64]} />
            <meshPhysicalMaterial 
                color="#ffffff" 
                emissive="#ffffff"
                emissiveIntensity={1.2}
                roughness={0.3}
                metalness={0.1} 
                transmission={0.2}
                thickness={10} 
                clearcoat={1}
                clearcoatRoughness={0.1}
                iridescence={0.8}
                iridescenceIOR={1.33}
                ior={1.4}
            />
        </mesh>
        
        {/* Inner white glow */}
        <pointLight intensity={5} distance={10} color="#ffffff" decay={2} />
        
        {/* Orange Backlight */}
        <pointLight 
            position={[0, 0, -3.5]} 
            intensity={60} 
            distance={15} 
            color="#ff9900" 
            decay={2}
        />
      </group>
    </Float>
  );
};