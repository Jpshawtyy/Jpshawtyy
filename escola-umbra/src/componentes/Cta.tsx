import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, MARCA} from '../tema';
import {FONTE_TEXTO, FONTE_TITULO} from '../fontes';
import {MOLA_PULO, mola} from '../anim';
import {TextoAjustado} from './TextoAjustado';
import {Pill} from './Pill';
import {Estrela} from './Estrela';
import type {CenaCta} from '../tipos';

// CTA final: logo, "SALVA pra próxima partida" e "segue @escolaumbratcg".
export const Cta: React.FC<{cena: CenaCta}> = ({cena}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const logo = mola(quadro, fps, 0, MOLA_PULO);
  const principal = mola(quadro, fps, 0.2, MOLA_PULO);
  const complemento = mola(quadro, fps, 0.5, MOLA_PULO);
  const marcador = mola(quadro, fps, 0.95, MOLA_PULO);
  const preenche = mola(quadro, fps, 1.35, MOLA_PULO);
  const seguir = mola(quadro, fps, 1.9, MOLA_PULO);
  const pulso = t > 2.4 ? 1 + 0.035 * Math.sin((t - 2.4) * 7) : 1;

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: AREA.x0,
          width: AREA.largura,
          top: 330,
          height: 1070,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img
          src={staticFile('logo.png')}
          style={{
            width: 230,
            height: 230,
            objectFit: 'contain',
            opacity: Math.min(1, 0.4 + logo * 1.5),
            transform: `scale(${0.4 + 0.6 * logo}) rotate(${(1 - logo) * -40 + Math.sin(t * 1.8) * 2}deg)`,
          }}
        />
        <div style={{marginTop: 30, transform: `scale(${0.7 + 0.3 * principal})`, opacity: Math.min(1, principal * 1.6)}}>
          <TextoAjustado texto={cena.principal ?? 'SALVA'} largura={AREA.largura - 90} maximo={200} fonte={FONTE_TITULO} peso={700} style={{color: CORES.ouro}} />
        </div>
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            opacity: Math.min(1, complemento * 1.6),
            transform: `translateY(${(1 - complemento) * 30}px)`,
          }}
        >
          {/* marcador de "salvar" que se preenche */}
          <svg width={54} height={70} viewBox="0 0 54 70" style={{transform: `scale(${(0.3 + 0.7 * marcador) * (1 + 0.25 * preenche * (1 - preenche) * 4)})`, opacity: marcador}}>
            <path d="M6 4 H48 V64 L27 48 L6 64 Z" fill={CORES.ouro} fillOpacity={preenche} stroke={CORES.ouro} strokeWidth={6} strokeLinejoin="round" />
          </svg>
          <div style={{fontFamily: FONTE_TEXTO, fontWeight: 500, fontSize: 58, letterSpacing: '-0.015em', color: CORES.texto}}>
            {cena.complemento ?? 'pra próxima partida'}
          </div>
        </div>
        <div style={{marginTop: 70, transform: `scale(${seguir * pulso})`, opacity: seguir}}>
          <Pill tamanho={40}>{cena.seguir ?? `segue ${MARCA}`}</Pill>
        </div>
      </div>
      <Estrela x={AREA.x0 + 90} y={470} tamanho={46} semente={21} atraso={0.5} />
      <Estrela x={AREA.x1 - 110} y={420} tamanho={34} semente={22} atraso={0.7} />
      <Estrela x={AREA.x1 - 70} y={1010} tamanho={50} semente={23} atraso={1.4} />
      <Estrela x={AREA.x0 + 60} y={1090} tamanho={32} semente={24} atraso={1.6} />
    </AbsoluteFill>
  );
};
