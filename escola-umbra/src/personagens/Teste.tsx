import React from 'react';
import {AbsoluteFill} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import {LuzArena, MirarCamera, Personagem} from './Personagem';

// Composição de teste: Kai e Faísca lado a lado, para conferir o render 3D.
export const TestePersonagens: React.FC<{kai: string; faisca: string}> = ({kai, faisca}) => (
  <AbsoluteFill style={{backgroundColor: '#0A0A0D'}}>
    <ThreeCanvas width={1080} height={1080} camera={{position: [0, 0.85, 3.6], fov: 30}} gl={{antialias: true, preserveDrawingBuffer: true}}>
      <MirarCamera alvo={[0, 0.8, 0]} />
      <LuzArena />
      <Personagem nome="kai" gestos={[{em: 0, animacao: kai}]} posicao={[-0.35, 0, 0]} rotacaoY={0.2} />
      <Personagem nome="faisca" gestos={[{em: 0, animacao: faisca}]} posicao={[0.55, 0.55, 0.2]} rotacaoY={-0.3} />
    </ThreeCanvas>
  </AbsoluteFill>
);
