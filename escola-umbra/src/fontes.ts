import {loadFont as carregarUnbounded} from '@remotion/google-fonts/Unbounded';
import {loadFont as carregarInter} from '@remotion/google-fonts/Inter';
import {loadFont as carregarMono} from '@remotion/google-fonts/JetBrainsMono';

// Só os pesos da identidade: Unbounded 700, Inter 400/500, JetBrains Mono 500.
const unbounded = carregarUnbounded('normal', {weights: ['700'], subsets: ['latin']});
const inter = carregarInter('normal', {weights: ['400', '500'], subsets: ['latin']});
const mono = carregarMono('normal', {weights: ['500'], subsets: ['latin']});

export const FONTE_TITULO = unbounded.fontFamily;
export const FONTE_TEXTO = inter.fontFamily;
export const FONTE_MONO = mono.fontFamily;

// Resolve quando as três fontes terminaram de carregar. Quem mede texto precisa esperar por isto.
export const fontesProntas: Promise<unknown> = Promise.all([unbounded.waitUntilDone(), inter.waitUntilDone(), mono.waitUntilDone()]);
