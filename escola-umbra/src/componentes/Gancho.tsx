import React from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES} from '../tema';
import {FONTE_TEXTO, FONTE_TITULO} from '../fontes';
import {MOLA_PULO, mola, trecho} from '../anim';
import {TextoAjustado} from './TextoAjustado';
import {Estrela} from './Estrela';
import type {CenaGancho} from '../tipos';

// Gancho: palavra ou frase gigante em dourado. Já está na tela no primeiro décimo de segundo.
export const Gancho: React.FC<{cena: CenaGancho}> = ({cena}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;

  const batida = mola(quadro, fps, 0, MOLA_PULO);
  // Já nasce visível no quadro 0 e cresce com um pulo curto (nunca passa da largura segura).
  const escala = 0.74 + 0.26 * batida;
  const linha = mola(quadro, fps, 0.3);
  const sub = mola(quadro, fps, 0.55, MOLA_PULO);
  const onda = trecho(t, [0.05, 0.7], [0, 1]);
  const centroY = 770;

  return (
    <AbsoluteFill>
      {/* anel que se abre quando a palavra bate */}
      <div
        style={{
          position: 'absolute',
          left: AREA.cx - 420,
          top: centroY - 420,
          width: 840,
          height: 840,
          borderRadius: '50%',
          boxShadow: `inset 0 0 0 ${6 * (1 - onda)}px ${CORES.ouro}`,
          opacity: (1 - onda) * 0.8,
          transform: `scale(${0.35 + onda * 0.85})`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: AREA.x0,
          width: AREA.largura,
          top: centroY - 300,
          height: 600,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{transform: `scale(${escala})`}}>
          <TextoAjustado
            texto={cena.texto}
            largura={AREA.largura - 60}
            maximo={230}
            fonte={FONTE_TITULO}
            peso={700}
            style={{color: CORES.ouro, textShadow: '0 10px 40px rgba(0,0,0,0.6)'}}
          />
        </div>
        <div
          style={{
            width: 360 * linha,
            height: 8,
            borderRadius: 8,
            background: CORES.ouro,
            marginTop: 30,
            opacity: linha,
          }}
        />
        {cena.subtitulo ? (
          <div
            style={{
              marginTop: 34,
              fontFamily: FONTE_TEXTO,
              fontWeight: 500,
              fontSize: 50,
              letterSpacing: '-0.01em',
              color: CORES.texto,
              textAlign: 'center',
              opacity: Math.min(1, sub * 1.5),
              transform: `translateY(${(1 - sub) * 26}px)`,
            }}
          >
            {cena.subtitulo}
          </div>
        ) : null}
      </div>
      <Estrela x={AREA.x0 + 60} y={centroY - 210} tamanho={54} semente={1} atraso={0.25} />
      <Estrela x={AREA.x1 - 70} y={centroY - 150} tamanho={38} semente={2} atraso={0.4} />
      <Estrela x={AREA.x1 - 150} y={centroY + 250} tamanho={46} semente={3} atraso={0.55} />
      <Estrela x={AREA.x0 + 130} y={centroY + 300} tamanho={30} semente={4} atraso={0.7} />
    </AbsoluteFill>
  );
};
