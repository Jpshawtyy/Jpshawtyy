import React from 'react';
import {useLayout} from '../layout';
import {AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, MARCA} from '../tema';
import {FONTE_TEXTO} from '../fontes';
import {MOLA_PULO, mola} from '../anim';
import {Pill} from './Pill';
import {TituloArena, TracoOuro} from './Arena';
import type {CenaCta} from '../tipos';

// CTA final: emblema, "SALVA pra próxima partida" e "segue @escolaumbratcg".
export const Cta: React.FC<{cena: CenaCta}> = ({cena}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const logo = mola(quadro, fps, 0, MOLA_PULO);
  const principal = mola(quadro, fps, 0.2, MOLA_PULO);
  const traco = mola(quadro, fps, 0.4);
  const complemento = mola(quadro, fps, 0.5, MOLA_PULO);
  const marcador = mola(quadro, fps, 0.95, MOLA_PULO);
  const preenche = mola(quadro, fps, 1.35, MOLA_PULO);
  const seguir = mola(quadro, fps, 1.9, MOLA_PULO);
  const pulso = t > 2.4 ? 1 + 0.035 * Math.sin((t - 2.4) * 7) : 1;
  // com o Kai e o Faísca embaixo, o texto sobe e fica mais compacto
  const comKai = useLayout().kai === 'cta';

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          left: AREA.x0,
          width: AREA.largura,
          top: comKai ? 300 : 330,
          height: comKai ? 660 : 1070,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Img
          src={staticFile('logo.png')}
          style={{
            width: comKai ? 170 : 260,
            height: comKai ? 170 : 260,
            objectFit: 'contain',
            filter: 'drop-shadow(0 14px 30px rgba(0,0,0,0.6))',
            opacity: Math.min(1, 0.4 + logo * 1.5),
            transform: `scale(${0.4 + 0.6 * logo}) rotate(${(1 - logo) * -120 + Math.sin(t * 1.4) * 3}deg)`,
          }}
        />
        <div style={{marginTop: 34, transform: `scale(${0.7 + 0.3 * principal})`, opacity: Math.min(1, principal * 1.6)}}>
          <TituloArena texto={cena.principal ?? 'SALVA'} largura={AREA.largura - 60} maximo={comKai ? 170 : 210} />
        </div>
        <TracoOuro largura={220} progresso={traco} style={{marginTop: 26}} />
        <div
          style={{
            marginTop: 26,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            opacity: Math.min(1, complemento * 1.6),
            transform: `translateY(${(1 - complemento) * 30}px)`,
          }}
        >
          {/* marcador de "salvar" que se preenche */}
          <svg width={50} height={66} viewBox="0 0 54 70" style={{transform: `scale(${(0.3 + 0.7 * marcador) * (1 + 0.25 * preenche * (1 - preenche) * 4)})`, opacity: marcador}}>
            <path d="M6 4 H48 V64 L27 48 L6 64 Z" fill={CORES.ouro} fillOpacity={preenche} stroke={CORES.ouro} strokeWidth={6} strokeLinejoin="round" />
          </svg>
          <div style={{fontFamily: FONTE_TEXTO, fontWeight: 600, fontSize: 56, color: CORES.texto}}>{cena.complemento ?? 'pra próxima partida'}</div>
        </div>
        <div style={{marginTop: comKai ? 36 : 64, transform: `scale(${seguir * pulso})`, opacity: seguir}}>
          <Pill cor="vermelho" tamanho={38}>
            {cena.seguir ?? `segue ${MARCA}`}
          </Pill>
        </div>
      </div>
    </AbsoluteFill>
  );
};
