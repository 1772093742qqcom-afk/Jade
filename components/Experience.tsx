import React, { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Stars as DreiStars, Sparkles, Html } from '@react-three/drei';
import * as THREE from 'three';
import { PostProcessing } from './PostProcessing';
import { Ocean } from './Ocean';
import { Pearl } from './Pearl';
import { Stars } from './Stars';
import { StarData } from '../types';

interface ExperienceProps {
  stars: StarData[];
  onStarClick: (id: number) => void;
  onStarView: (id: number) => void;
}

// Helper to generate textures procedurally
const useProceduralTexture = (
    drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, 
    resolution: number = 1024
) => {
    return useMemo(() => {
        const canvas = document.createElement('canvas');
        canvas.width = resolution;
        canvas.height = resolution;
        const ctx = canvas.getContext('2d');
        if (ctx) drawFn(ctx, resolution, resolution);
        return new THREE.CanvasTexture(canvas);
    }, []);
};

const GalaxyBackground: React.FC = () => {
    const texture = useProceduralTexture((ctx, w, h) => {
        // Lighter cosmic base
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#020210'); 
        gradient.addColorStop(0.5, '#100c20'); 
        gradient.addColorStop(1, '#020210');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Nebula Clouds
        for (let i = 0; i < 400; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const r = Math.random() * 300 + 50;
            const opacity = Math.random() * 0.15; 
            const colors = ['#3333aa', '#aa3399', '#00cccc', '#5511aa'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.globalAlpha = opacity;
            ctx.fill();
        }
        
        // Stars
        for (let i = 0; i < 1000; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            const size = Math.random() * 2;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = Math.random() * 0.9 + 0.1;
            ctx.fill();
        }
    }, 2048);

    return (
        <mesh>
            <sphereGeometry args={[400, 64, 64]} />
            <meshBasicMaterial map={texture} side={THREE.BackSide} />
        </mesh>
    );
};

// --- Base Planet Component ---
const BasePlanet: React.FC<{
    position: [number, number, number];
    appearDistance: number;
    scale: number;
    texture: THREE.Texture;
    color?: string;
    roughness?: number;
    rotationSpeed?: number;
    children?: React.ReactNode;
}> = ({ position, appearDistance, scale, texture, color = "#ffffff", roughness = 0.8, rotationSpeed = 0.002, children }) => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame(({ camera }) => {
        if (groupRef.current) {
            const dist = camera.position.length();
            let targetScale = 0;
            if (dist > appearDistance) {
                targetScale = Math.min(scale, (dist - appearDistance) / 10 * scale);
            }
            // Smooth lerp for scale appearance
            groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
            
            // Rotation
            groupRef.current.rotation.y += rotationSpeed;
        }
    });

    return (
        <group ref={groupRef} position={position} scale={[0,0,0]}>
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[1, 64, 64]} />
                <meshStandardMaterial map={texture} color={color} roughness={roughness} />
            </mesh>
            {children}
        </group>
    );
};

// --- Specific Planets ---

const Mercury: React.FC = () => {
    const map = useProceduralTexture((ctx, w, h) => {
        ctx.fillStyle = '#9e9e9e'; ctx.fillRect(0,0,w,h);
        // Craters
        for(let i=0; i<800; i++) {
            const x = Math.random()*w; const y = Math.random()*h; const r = Math.random()*5+1;
            ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
        }
    });
    return <BasePlanet position={[-15, 8, -20]} appearDistance={18} scale={1.2} texture={map} roughness={0.9} />;
};

const Venus: React.FC = () => {
    const map = useProceduralTexture((ctx, w, h) => {
        const grad = ctx.createLinearGradient(0,0,w,h);
        grad.addColorStop(0, '#e6c288'); grad.addColorStop(0.5, '#d4a66a'); grad.addColorStop(1, '#e6c288');
        ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
        // Clouds/Atmosphere turbulence
        for(let i=0; i<300; i++) {
            const x = Math.random()*w; const y = Math.random()*h;
            ctx.fillStyle = 'rgba(255,255,240,0.05)'; 
            ctx.fillRect(x,y, w/5, 2); // Streaks
        }
    });
    return <BasePlanet position={[-30, 12, -35]} appearDistance={25} scale={2} texture={map} roughness={0.6} />;
};

const Earth: React.FC = () => {
    const map = useProceduralTexture((ctx, w, h) => {
        // Ocean
        ctx.fillStyle = '#102b5a'; ctx.fillRect(0,0,w,h);
        // Continents (Green/Brown blobs)
        for(let i=0; i<30; i++) {
            const x = Math.random()*w; const y = Math.random()*h; const r = Math.random()*80+20;
            ctx.fillStyle = '#2d5e34'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
        }
        // Clouds
        for(let i=0; i<150; i++) {
            const x = Math.random()*w; const y = Math.random()*h; const r = Math.random()*30+10;
            ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
        }
    });
    return <BasePlanet position={[20, -5, -45]} appearDistance={32} scale={2.2} texture={map} roughness={0.5} />;
};

const Mars: React.FC = () => {
    const map = useProceduralTexture((ctx, w, h) => {
        ctx.fillStyle = '#c1440e'; ctx.fillRect(0,0,w,h);
        // Dark patches
        for(let i=0; i<60; i++) {
            const x = Math.random()*w; const y = Math.random()*h; const r = Math.random()*40+10;
            ctx.fillStyle = 'rgba(50,10,0,0.1)'; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
        }
    });
    return <BasePlanet position={[35, 15, -60]} appearDistance={40} scale={1.5} texture={map} roughness={0.8} />;
};

const Jupiter: React.FC = () => {
    const map = useProceduralTexture((ctx, w, h) => {
        const grad = ctx.createLinearGradient(0,0,0,h);
        grad.addColorStop(0.0, '#5c4a3d');
        grad.addColorStop(0.2, '#d6c1a8');
        grad.addColorStop(0.3, '#a87b65');
        grad.addColorStop(0.5, '#e3dccb');
        grad.addColorStop(0.6, '#bf8f70');
        grad.addColorStop(0.8, '#d6c1a8');
        grad.addColorStop(1.0, '#5c4a3d');
        ctx.fillStyle = grad; ctx.fillRect(0,0,w,h);
        
        // Great Red Spot
        ctx.beginPath();
        ctx.ellipse(w*0.6, h*0.6, w*0.1, h*0.06, 0, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(160, 60, 40, 0.8)';
        ctx.fill();
    });
    return <BasePlanet position={[-50, 25, -80]} appearDistance={50} scale={6} texture={map} roughness={0.4} />;
};

const Saturn: React.FC = () => {
    const map = useProceduralTexture((ctx, w, h) => {
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0.0, '#bca');
        grad.addColorStop(0.2, '#e3dccb');
        grad.addColorStop(0.5, '#f0e6cf'); 
        grad.addColorStop(0.8, '#d9cba5');
        grad.addColorStop(1.0, '#bca');
        ctx.fillStyle = grad; 
        ctx.fillRect(0, 0, w, h);
    });

    const ringMap = useProceduralTexture((ctx, w, h) => {
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0.0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.2, 'rgba(210, 200, 180, 0.4)');
        gradient.addColorStop(0.4, 'rgba(210, 200, 180, 0.9)');
        gradient.addColorStop(0.5, 'rgba(0,0,0,0.1)'); // Gap
        gradient.addColorStop(0.6, 'rgba(210, 200, 180, 0.7)');
        gradient.addColorStop(1.0, 'rgba(0,0,0,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }, 256);

    return (
        <BasePlanet position={[60, 30, -100]} appearDistance={60} scale={5} texture={map} roughness={0.5}>
            <mesh rotation={[Math.PI / 2.2, 0, 0]}>
                <ringGeometry args={[1.4, 2.4, 128]} />
                <meshStandardMaterial 
                    map={ringMap} 
                    side={THREE.DoubleSide} 
                    transparent 
                    opacity={0.9} 
                    color="#cec2a5"
                />
            </mesh>
        </BasePlanet>
    );
};

// Shooting Star Component
const ShootingStar: React.FC = () => {
    const mesh = useRef<THREE.Mesh>(null);
    const material = useRef<THREE.MeshBasicMaterial>(null);
    
    // Timer to track intervals
    const timer = useRef(0);
    const isAnimating = useRef(false);
    const progress = useRef(0);
    
    // Start and End vectors
    const startPos = useRef(new THREE.Vector3());
    const endPos = useRef(new THREE.Vector3());

    // Meteor Colors
    const colors = ['#ffddaa', '#aaddff', '#ffccff', '#ccffcc', '#ffffaa', '#ffaa88'];

    useFrame((state, delta) => {
        if (!isAnimating.current) {
            timer.current += delta;
            if (timer.current >= 7) { 
                timer.current = 0;
                isAnimating.current = true;
                progress.current = 0;
                const r = 120; // Increased radius for larger scene
                const theta1 = Math.random() * Math.PI * 2;
                const phi1 = Math.acos(Math.random() * 0.6); 
                startPos.current.setFromSphericalCoords(r, phi1, theta1);
                
                const theta2 = theta1 + (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random());
                const phi2 = Math.min(Math.PI / 2, phi1 + 0.5 + Math.random() * 0.5); 
                endPos.current.setFromSphericalCoords(r, phi2, theta2);
                
                if (mesh.current) {
                    mesh.current.position.copy(startPos.current);
                    mesh.current.lookAt(endPos.current);
                    const randomColor = colors[Math.floor(Math.random() * colors.length)];
                    if (material.current) material.current.color.set(randomColor);
                }
            }
        } else {
            progress.current += delta * 0.8; 
            if (progress.current >= 1) {
                isAnimating.current = false;
                if (mesh.current) mesh.current.scale.set(0,0,0);
            } else {
                if (mesh.current) {
                    mesh.current.position.lerpVectors(startPos.current, endPos.current, progress.current);
                    const s = Math.sin(progress.current * Math.PI);
                    mesh.current.scale.set(s, s, s * 40); 
                    mesh.current.visible = true;
                }
            }
        }
    });

    return (
        <group>
            <mesh ref={mesh} visible={false}>
                <cylinderGeometry args={[0.5, 0, 1, 8]} rotation={[Math.PI / 2, 0, 0]} />
                <meshBasicMaterial 
                    ref={material} 
                    transparent 
                    opacity={0.8} 
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                />
            </mesh>
        </group>
    );