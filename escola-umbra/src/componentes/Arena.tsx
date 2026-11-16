// Peças da identidade "Estilo Arena": título inclinado com sombra vermelha, traço dourado,
// etiqueta em paralelogramo, painel vermelho pontilhado e listras douradas.

import React from 'react';
import {CORES} from '../tema';
import {FONTE_MONO, FONTE_TITULO} from '../fontes';
import {TextoAjustado} from './TextoAjustado';

export const INCLINACAO = -9; // graus do itálico dos títulos

// Sombra vermelha deslocada, como no guia, mais uma sombra escura suave para separar do fundo.
export const sombraTitulo = (tamanho: number) => {
  const d = Math.max(2, Math.round(tamanho * 0.045));
  return `${d}px ${d}px 0 ${CORES.vermelho}, ${d * 2}px ${d * 3}px ${d * 5}px rgba(0,0,0,0.55)`;
};

// Título em maiúsculas, branco, inclinado e com sombra vermelha. Ajusta o tamanho à largura.
export const TituloArena: React.FC<{
  texto: string;
  largura: number;
  maximo: number;
  cor?: string;
  style?: React.CSSProperties;
}> = ({texto, largura, maximo, cor = CORES.texto, style}) => {
  const maiusculo = texto.toLocaleUpperCase('pt-BR');
  return (
    <div style={{transform: `skewX(${INCLINACAO}deg)`, ...style}}>
      <TextoAjustado
        texto={maiusculo}
        // a inclinação ocupa um pouco de largura extra
        largura={largura - maximo * 0.18}
        maximo={maximo}
        fonte={FONTE_TITULO}
        peso={400}
        espacamento="0.01em"
        alturaLinha={0.98}
        style={{color: cor, textShadow: sombraTitulo(maximo * 0.85)}}
      />
    </div>
  );
};

// Traço dourado: uma barra longa e dois tracinhos, inclinados.
export const TracoOuro: React.FC<{largura?: number; progresso?: number; style?: React.CSSProperties}> = ({largura = 200, progresso = 1, style}) => {
  const alto = Math.max(5, largura * 0.045);
  const partes = [
    {w: largura, cor: CORES.ouro},
    {w: largura * 0.16, cor: 'rgba(240,193,96,0.7)'},
    {w: largura * 0.09, cor: 'rgba(240,193,96,0.45)'},
  ];
  return (
    <div style={{display: 'flex', gap: alto * 1.4, alignItems: 'center', ...style}}>
      {partes.map((p, i) => (
        <div
          key={i}
          style={{
            width: p.w * Math.max(0, Math.min(1, progresso * 1.6 - i * 0.3)),
            height: alto,
            background: p.cor,
            transform: 'skewX(-30deg)',
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
};

// Etiqueta: caixa vermelha em paralelogramo + texto dourado "// complemento".
export const Etiqueta: React.FC<{
  rotulo: string;
  complemento?: string;
  tamanho?: number;
  cor?: 'vermelho' | 'ouro';
  style?: React.CSSProperties;
}> = ({rotulo, complemento, tamanho = 24, cor = 'vermelho', style}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: tamanho * 0.7, whiteSpace: 'nowrap', ...style}}>
    <div
      style={{
        background: cor === 'vermelho' ? CORES.vermelho : CORES.ouro,
        transform: 'skewX(-14deg)',
        padding: `${tamanho * 0.32}px ${tamanho * 0.75}px`,
        boxShadow: '0 6px 16px rgba(0,0,0,0.45)',
      }}
    >
      <div
        style={{
          transform: 'skewX(14deg)',
          fontFamily: FONTE_MONO,
          fontWeight: 700,
          fontSize: tamanho,
          lineHeight: 1,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: cor === 'vermelho' ? CORES.pillVermelhoTexto : CORES.pillOuroTexto,
          marginRight: '-0.18em',
        }}
      >
        {rotulo}
      </div>
    </div>
    {complemento ? (
      <div
        style={{
          fontFamily: FONTE_MONO,
          fontWeight: 700,
          fontSize: tamanho,
          lineHeight: 1,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: CORES.ouro,
        }}
      >
        {'// '}
        {complemento}
      </div>
    ) : null}
  </div>
);

// Fundo vermelho dos painéis: degradê + pontilhado (meio-tom).
export const fundoVermelho = (angulo = 135): React.CSSProperties => ({
  backgroundColor: CORES.vermelho,
  backgroundImage: [
    'radial-gradient(rgba(10,10,13,0.2) 1.7px, transparent 2px)',
    `linear-gradient(${angulo}deg, ${CORES.vermelho} 0%, #B8202D 55%, ${CORES.vermelhoEscuro} 100%)`,
  ].join(', '),
  backgroundSize: '15px 15px, 100% 100%',
});

// Listras douradas em diagonal (uma fina e escura, outra grossa e brilhante), como no guia.
// "brilho" (0 a 1) move um reflexo de luz pela listra grossa.
export const ListrasOuro: React.FC<{
  x: number;
  y: number;
  altura: number;
  inclinacao?: number; // quanto a listra anda para a direita do pé ao topo
  brilho?: number;
  escala?: number;
}> = ({x, y, altura, inclinacao = altura * 0.36, brilho = 0, escala = 1}) => {
  const listra = (dx: number, grossura: number, fundo: string, key: string) => (
    <div
      key={key}
      style={{
        position: 'absolute',
        left: x + dx * escala,
        top: y,
        width: inclinacao + grossura * escala,
        height: altura,
        clipPath: `polygon(${inclinacao}px 0, ${inclinacao + grossura * escala}px 0, ${grossura * escala}px 100%, 0 100%)`,
        background: fundo,
      }}
    />
  );
  const reflexo = `linear-gradient(180deg, #B8862E 0%, ${CORES.ouro} ${20 + brilho * 60}%, #FFF3C4 ${24 + brilho * 60}%, ${CORES.ouro} ${30 + brilho * 60}%, #9C7024 100%)`;
  return (
    <>
      {listra(0, 9, 'linear-gradient(180deg, #8C6A2C, #5A4520)', 'fina')}
      {listra(24, 22, reflexo, 'grossa')}
    </>
  );
};
