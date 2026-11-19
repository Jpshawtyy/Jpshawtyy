// Personagens 3D (Kai e Faísca): carrega o .glb, toca as animações do Blender de forma
// determinística (o mesmo quadro sempre dá a mesma pose) e mexe a boca conforme a narração.

import React, {useEffect, useLayoutEffect, useMemo, useState} from 'react';
import {continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import * as THREE from 'three';
import {useThree} from '@react-three/fiber';
import {GLTFLoader, type GLTF} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {clone as clonarComEsqueleto} from 'three/examples/jsm/utils/SkeletonUtils.js';
import type {Boca} from '../tipos';

export type NomePersonagem = 'kai' | 'faisca';

export const ANIMACOES = {
  kai: ['parado', 'acenando', 'falando', 'apontando', 'comemorando', 'joinha', 'pensando'],
  faisca: ['parado', 'feliz', 'apontando', 'curioso', 'em_pe', 'falando'],
} as const;

// Um gesto começa num segundo (da cena) e vale até o próximo.
export type Gesto = {em: number; animacao: string};

const cache = new Map<string, Promise<GLTF>>();
const carregar = (url: string) => {
  if (!cache.has(url)) cache.set(url, new GLTFLoader().loadAsync(url));
  return cache.get(url)!;
};

const TRANSICAO = 0.35; // segundos de mistura entre um gesto e o próximo

export const Personagem: React.FC<{
  nome: NomePersonagem;
  gestos: Gesto[]; // em ordem; o primeiro deve começar em 0
  boca?: Boca; // abertura e arredondamento da boca por quadro do vídeo (0 a 1), vindos da narração
  posicao?: [number, number, number];
  rotacaoY?: number;
  escala?: number;
  olhar?: 'esq' | 'dir' | 'cima' | null;
}> = ({nome, gestos, boca, posicao = [0, 0, 0], rotacaoY = 0, escala = 1, olhar = null}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const [gltf, setGltf] = useState<GLTF | null>(null);
  const [espera] = useState(() => delayRender(`carregando ${nome}.glb`));

  useEffect(() => {
    carregar(staticFile(`personagens/${nome}.glb`))
      .then((g) => setGltf(g))
      .catch((e) => {
        console.error(`não consegui carregar ${nome}.glb`, e);
        continueRender(espera);
      });
  }, [nome, espera]);

  // cópia própria do modelo (com esqueleto), mixer e uma ação por animação
  const montado = useMemo(() => {
    if (!gltf) return null;
    const cena = clonarComEsqueleto(gltf.scene) as THREE.Object3D;
    const rosto: THREE.Mesh[] = [];
    cena.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.frustumCulled = false;
        if (m.morphTargetDictionary) rosto.push(m);
      }
    });
    const mixer = new THREE.AnimationMixer(cena);
    const acoes = new Map<string, THREE.AnimationAction>();
    for (const clipe of gltf.animations) {
      const acao = mixer.clipAction(clipe);
      acao.play();
      acao.setEffectiveWeight(0);
      acoes.set(clipe.name, acao);
    }
    if (typeof window !== 'undefined' && (window as unknown as {DEPURAR_3D?: boolean}).DEPURAR_3D === true) {
      const caixa = new THREE.Box3().setFromObject(cena);
      let malhas = 0;
      cena.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) malhas++;
      });
      console.log(`[3d] ${nome}: ${malhas} malhas, ${gltf.animations.length} animações, caixa ${JSON.stringify(caixa.min)} ${JSON.stringify(caixa.max)}`);
    }
    return {cena, mixer, acoes, rosto};
  }, [gltf]);

  // só libera a captura do quadro depois que o modelo entrou na cena e foi desenhado
  // (o ThreeCanvas do Remotion só redesenha quando o quadro muda; aqui forçamos um desenho)
  const advance = useThree((estado) => estado.advance);
  useEffect(() => {
    if (!montado) return;
    advance(performance.now());
    const id = requestAnimationFrame(() => {
      advance(performance.now());
      continueRender(espera);
    });
    return () => cancelAnimationFrame(id);
  }, [montado, espera, advance]);

  // A pose é aplicada no efeito de layout e o quadro é desenhado logo em seguida. Antes ela era
  // aplicada durante o render e, com várias abas renderizando em paralelo, cada aba às vezes desenhava
  // a pose de outro quadro (olhos piscando sem parar, boca fora do tempo).
  useLayoutEffect(() => {
    if (!montado) return;
    aplicarPose(montado, nome, gestos, boca, quadro, fps, olhar);
    advance(performance.now());
    const h = delayRender(`desenhando ${nome} no quadro ${quadro}`);
    const id = requestAnimationFrame(() => {
      aplicarPose(montado, nome, gestos, boca, quadro, fps, olhar);
      advance(performance.now());
      continueRender(h);
    });
    return () => {
      cancelAnimationFrame(id);
      continueRender(h);
    };
  }, [montado, nome, gestos, boca, quadro, fps, olhar, advance]);

  if (!montado) return null;

  return <primitive object={montado.cena} position={posicao} rotation={[0, rotacaoY, 0]} scale={escala} />;
};

type Montado = {cena: THREE.Object3D; mixer: THREE.AnimationMixer; acoes: Map<string, THREE.AnimationAction>; rosto: THREE.Mesh[]};

// Piscada em intervalos irregulares (entre 2,6 e 4,6 s), sempre igual para o mesmo quadro.
const piscadaEm = (t: number, semente: number) => {
  let inicio = 0.8 + semente;
  for (let k = 0; inicio <= t + 1; k++) {
    const d = t - inicio;
    if (d >= 0 && d < 0.2) return d < 0.07 ? d / 0.07 : 1 - (d - 0.07) / 0.13;
    const sorteio = Math.abs(Math.sin((k + 1) * 12.9898 + semente * 78.233) * 43758.5453) % 1;
    inicio += 2.6 + sorteio * 2;
  }
  return 0;
};

const aplicarPose = (
  {mixer, acoes, rosto}: Montado,
  nome: NomePersonagem,
  gestos: Gesto[],
  boca: Boca | undefined,
  quadro: number,
  fps: number,
  olhar: 'esq' | 'dir' | 'cima' | null,
) => {
  const t = quadro / fps;
  // peso de cada gesto neste instante (mistura suave na troca)
  const pesos = new Map<string, number>();
  gestos.forEach((g, i) => {
    const fim = gestos[i + 1]?.em ?? Infinity;
    if (t < g.em || t >= fim + TRANSICAO) return;
    const entra = i === 0 ? 1 : Math.min(1, (t - g.em) / TRANSICAO);
    const sai = t < fim ? 1 : Math.max(0, 1 - (t - fim) / TRANSICAO);
    const p = Math.min(entra, sai);
    pesos.set(g.animacao, Math.max(pesos.get(g.animacao) ?? 0, p));
  });
  let total = 0;
  pesos.forEach((p) => (total += p));
  acoes.forEach((acao, nomeClipe) => {
    const p = (pesos.get(nomeClipe) ?? 0) / Math.max(1e-6, total);
    acao.enabled = true;
    acao.setEffectiveWeight(p);
    const inicio = [...gestos].reverse().find((g) => g.animacao === nomeClipe && g.em <= t)?.em ?? 0;
    const d = acao.getClip().duration || 1;
    acao.time = (((t - inicio) % d) + d) % d;
  });
  mixer.update(0);

  // Rosto. As animações do Blender já trazem boca e piscadas próprias; aqui elas são substituídas:
  // a boca segue a narração e a piscada é uma só, em intervalos naturais.
  const i = Math.max(0, quadro);
  const abre = boca ? (boca.aberta[Math.min(boca.aberta.length - 1, i)] ?? 0) : null;
  const redondo = boca ? (boca.o[Math.min(boca.o.length - 1, i)] ?? 0) : 0;
  const piscar = piscadaEm(t, nome === 'kai' ? 0 : 1.3);
  for (const m of rosto) {
    const dic = m.morphTargetDictionary!;
    const inf = m.morphTargetInfluences!;
    if (abre !== null && dic.aberta !== undefined) {
      // "o" arredonda a boca no lugar de abrir larga; "fechada" é a boca em repouso, entre as sílabas
      inf[dic.aberta] = abre * 1.3 * (1 - 0.45 * redondo); // um pouco além do limite do Blender, para ler bem no celular
      if (dic.o !== undefined) inf[dic.o] = abre * redondo * 0.9;
      if (dic.fechada !== undefined) inf[dic.fechada] = 0.7 * Math.max(0, 1 - abre * 1.6);
    }
    if (dic.piscar !== undefined) inf[dic.piscar] = piscar;
    for (const lado of ['esq', 'dir', 'cima'] as const) {
      const chave = `olhar_${lado}`;
      if (dic[chave] !== undefined && olhar === lado) inf[dic[chave]] = 0.6;
    }
  }
};

// Luz no estilo da marca: principal quente pela frente, contraluz vermelha atrás e preenchimento dourado.
export const LuzArena: React.FC = () => (
  <>
    <ambientLight intensity={0.55} />
    <hemisphereLight args={['#FFF3DC', '#2A0A0E', 0.6]} />
    <directionalLight position={[1.2, 2.4, 3]} intensity={2.4} color="#FFF1DA" />
    <directionalLight position={[-2.5, 1.8, -2]} intensity={2.2} color="#E5323F" />
    <directionalLight position={[2.5, 1.2, -1.5]} intensity={1.2} color="#F0C160" />
  </>
);

// Aponta a câmera para um ponto da cena (o three.js olha para a origem por padrão).
export const MirarCamera: React.FC<{alvo: [number, number, number]}> = ({alvo}) => {
  const camera = useThree((estado) => estado.camera);
  camera.lookAt(alvo[0], alvo[1], alvo[2]);
  camera.updateMatrixWorld();
  return null;
};
