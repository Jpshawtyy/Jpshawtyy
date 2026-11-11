import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import type {Cena, PropsAula} from './tipos';
import {legendasDaCena, planejar} from './tempo';
import {Fundo} from './componentes/Fundo';
import {Guias, Moldura} from './componentes/Moldura';
import {LegendaDinamica} from './componentes/Legenda';
import {Gancho} from './componentes/Gancho';
import {ListaPassos} from './componentes/ListaPassos';
import {Riscado} from './componentes/Riscado';
import {Piramide} from './componentes/Piramide';
import {Comparacao} from './componentes/Comparacao';
import {CartaDestaque} from './componentes/CartaDestaque';
import {Cta} from './componentes/Cta';
import {Mesa} from './mesa/Mesa';
import {trecho} from './anim';

// Cada tipo de cena do roteiro aponta para um componente.
const desenharCena = (cena: Cena, props: PropsAula, duracao: number, inicio: number): React.ReactNode => {
  switch (cena.tipo) {
    case 'gancho':
      return <Gancho cena={cena} />;
    case 'lista':
      return <ListaPassos cena={cena} duracao={duracao} />;
    case 'riscado':
      return <Riscado cena={cena} duracao={duracao} />;
    case 'piramide':
      return <Piramide cena={cena} duracao={duracao} />;
    case 'comparacao':
      return <Comparacao cena={cena} cartas={props.cartas} />;
    case 'carta_destaque':
      return <CartaDestaque cena={cena} cartas={props.cartas} />;
    case 'cta':
      return <Cta cena={cena} />;
    case 'mesa':
      return <Mesa cena={cena} cartas={props.cartas} duracao={duracao} falas={props.palavras} inicioDaCena={inicio} />;
    default:
      return null;
  }
};

// Saída seca: a cena some nos últimos 4 quadros, antes de a próxima entrar.
const Saida: React.FC<{quadros: number; ultima: boolean; children: React.ReactNode}> = ({quadros, ultima, children}) => {
  const quadro = useCurrentFrame();
  // o último quadro ainda tem um resto da cena: nunca fica um quadro vazio na troca
  const some = ultima ? 1 : trecho(quadro, [quadros - 4, quadros], [1, 0.1]);
  return <AbsoluteFill style={{opacity: some, transform: `scale(${1 + (1 - some) * 0.03})`}}>{children}</AbsoluteFill>;
};

export const Aula: React.FC<PropsAula> = (props) => {
  const {roteiro, cartas, audio, palavras, guias} = props;
  const quadro = useCurrentFrame();
  const plano = useMemo(() => planejar(roteiro, cartas), [roteiro, cartas]);
  const atual = plano.cenas.find((c) => quadro >= c.de && quadro < c.de + c.quadros);

  return (
    <AbsoluteFill style={{backgroundColor: '#0A0A0C'}}>
      <Fundo inicios={plano.cenas.map((c) => c.de)} suave={atual?.cena.tipo === 'mesa'} />
      {plano.cenas.map((c, i) => (
        <Sequence key={i} from={c.de} durationInFrames={c.quadros} name={`${i + 1} · ${c.cena.tipo}`}>
          <Saida quadros={c.quadros} ultima={i === plano.cenas.length - 1}>
            {desenharCena(c.cena, props, c.duracao, c.inicio)}
            {c.cena.tipo !== 'mesa' ? (
              <LegendaDinamica legendas={legendasDaCena(c.cena, c.duracao)} falas={palavras} inicioDaCena={c.inicio} />
            ) : null}
          </Saida>
        </Sequence>
      ))}
      <Moldura numero={roteiro.numero} serie={roteiro.serie} />
      {audio?.narracao ? <Audio src={staticFile(audio.narracao)} volume={audio.narracaoVolume ?? 1} /> : null}
      {audio?.musica ? <Audio src={staticFile(audio.musica)} volume={audio.musicaVolume ?? 0.15} loop /> : null}
      {guias ? <Guias /> : null}
    </AbsoluteFill>
  );
};
