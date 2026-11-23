import React from 'react';
import {Composition, Still} from 'remotion';
import {Capa} from './Capa';
import {TestePersonagens} from './personagens/Teste';
import {BANNER_PADRAO, BannerLoja, PerfilLiga, PerfilLoja} from './Loja';
import {Aula} from './Aula';
import {STORY_PADRAO, Story, duracaoStory} from './Story';
import {CLIPE_PADRAO, Clipe, duracaoClipe} from './clipe/Clipe';
import type {PropsAula} from './tipos';
import {planejar} from './tempo';
import {VIDEO} from './tema';

// Roteiro mínimo, só para o Remotion Studio abrir sem um roteiro de verdade.
const PROPS_PADRAO: PropsAula = {
  roteiro: {
    serie: 'Do zero ao campeonato',
    numero: 1,
    titulo_capa: 'o turno',
    cenas: [{tipo: 'gancho', texto: 'o turno', subtitulo: 'como funciona', duracao: 3}],
  },
  cartas: {},
};

export const Root: React.FC = () => (
  <>
    <Composition
      id="Aula"
      component={Aula}
      width={VIDEO.largura}
      height={VIDEO.altura}
      fps={VIDEO.fps}
      durationInFrames={90}
      defaultProps={PROPS_PADRAO}
      calculateMetadata={({props}) => ({durationInFrames: planejar(props.roteiro, props.cartas).totalQuadros})}
    />
    <Still id="Capa" component={Capa} width={VIDEO.largura} height={VIDEO.altura} defaultProps={PROPS_PADRAO} />
    <Still id="BannerLargo" component={BannerLoja} width={2400} height={800} defaultProps={{...BANNER_PADRAO, largura: 2400, altura: 800}} />
    <Still id="Banner16x9" component={BannerLoja} width={1920} height={1080} defaultProps={{...BANNER_PADRAO, titulo: 'CARTAS\nAVULSAS', largura: 1920, altura: 1080}} />
    <Composition id="TestePersonagens" component={TestePersonagens} width={1080} height={1080} fps={30} durationInFrames={120} defaultProps={{kai: 'acenando', faisca: 'feliz'}} />
    <Composition
      id="Clipe"
      component={Clipe}
      width={VIDEO.largura}
      height={VIDEO.altura}
      fps={VIDEO.fps}
      durationInFrames={90}
      defaultProps={CLIPE_PADRAO}
      calculateMetadata={({props}) => ({durationInFrames: Math.round(duracaoClipe(props) * VIDEO.fps)})}
    />
    <Composition
      id="StoryVideo"
      component={Story}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={90}
      defaultProps={{...STORY_PADRAO, animado: true}}
      calculateMetadata={({props}) => ({durationInFrames: Math.round(duracaoStory(props.pagina) * 30)})}
    />
    <Still id="Story" component={Story} width={1080} height={1920} defaultProps={STORY_PADRAO} />
    <Still id="PerfilLiga" component={PerfilLiga} width={1080} height={1080} defaultProps={{lado: 1080}} />
    <Still id="Perfil" component={PerfilLoja} width={1080} height={1080} defaultProps={{lado: 1080}} />
  </>
);
