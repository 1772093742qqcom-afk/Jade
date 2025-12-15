import React from 'react';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

export const PostProcessing: React.FC = () => {
  return (
    <EffectComposer enableNormalPass={false}>
      <Noise opacity={0.05} blendFunction={BlendFunction.OVERLAY} />
      
      {/* Intense Bloom for the Pearl and Stars */}
      <Bloom 
        luminanceThreshold={0.8} 
        mipmapBlur 
        intensity={1.5} 
        radius={0.4}
      />
      
      <Vignette eskil={false} offset={0.1} darkness={0.8} />
    </EffectComposer>
  );
};