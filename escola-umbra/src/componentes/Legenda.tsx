import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {AREA, CORES, MOLDURA} from '../tema';
import {FONTE_TEXTO} from '../fontes';
import {MOLA_PULO, mola, trecho} from '../anim';
import type {LegendaPronta, PalavraFalada} from '../tipos';

type Palavra = {texto: string; chave: boolean};

// "Você *compra* uma carta" -> palavras, com a marcada entre asteriscos em dourado.
export const quebrarPalavras = (texto: string): Palavra[] => {
  const palavras: Palavra[] = [];
  let chave = false;
  for (const pedaco of texto.split(/(\*)/)) {
    if (pedaco === '*') {
      chave = !chave;
      continue;
    }
    for (const p of pedaco.split(/\s+/).filter(Boolean)) palavras.push({texto: p, chave});
  }
  // junta pontuação solta ("carta" + ",") na palavra anterior
  return palavras.reduce<Palavra[]>((lista, p) => {
    if (/^[.,!?;:]+$/.test(p.texto) && lista.length > 0) lista[lista.length - 1].texto += p.texto;
    else lista.push({...p});
    return lista;
  }, []);
};

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');

// Acha, na transcrição da narração, o momento em que cada palavra da legenda é falada.
const temposDaFala = (palavras: Palavra[], falas: PalavraFalada[], de: number, ate: number): (number | null)[] => {
  const janela = falas.filter((f) => f.inicio >= de - 0.4 && f.inicio < ate + 0.4);
  let cursor = 0;
  return palavras.map((p) => {
    const alvo = normalizar(p.texto);
    for (let i = cursor; i < Math.min(janela.length, cursor + 6); i++) {
      if (normalizar(janela[i].palavra) === alvo) {
        cursor = i + 1;
        return janela[i].inicio;
      }
    }
    return null;
  });
};

// Legenda dinâmica: grande, no centro-baixo, palavra por palavra, palavra-chave em dourado.
export const LegendaDinamica: React.FC<{
  legendas: LegendaPronta[];
  falas?: PalavraFalada[]; // transcrição, com tempos absolutos do vídeo
  inicioDaCena?: number; // segundo absoluto em que a cena começa
  tamanho?: number;
  base?: number;
}> = ({legendas, falas, inicioDaCena = 0, tamanho = 52, base = MOLDURA.legendaBase}) => {
  const quadro = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = quadro / fps;
  const atual = legendas.find((l) => t >= l.em && t < l.ate);
  if (!atual) return null;

  const palavras = quebrarPalavras(atual.texto);
  const duracao = atual.ate - atual.em;
  // Sem narração: as palavras entram em sequência rápida, ocupando no máximo 45% do tempo da legenda.
  const passo = Math.min(0.13, (duracao * 0.45) / Math.max(1, palavras.length));
  const falados = falas?.length ? temposDaFala(palavras, falas, inicioDaCena + atual.em, inicioDaCena + atual.ate) : null;
  const some = trecho(t, [atual.ate - 0.12, atual.ate], [1, 0]);

  return (
    <div
      style={{
        position: 'absolute',
        left: AREA.x0 + 10,
        width: AREA.largura - 20,
        bottom: 1920 - base,
        display: 'flex',
        justifyContent: 'center',
        opacity: some,
      }}
    >
      <div
        style={{
          fontFamily: FONTE_TEXTO,
          fontWeight: 500,
          fontSize: tamanho,
          lineHeight: 1.16,
          letterSpacing: '-0.01em',
          textAlign: 'center',
          textWrap: 'balance',
          color: CORES.texto,
          maxWidth: 800,
          textShadow: '0 2px 0 rgba(10,10,12,0.9), 0 0 22px rgba(10,10,12,0.95), 0 0 44px rgba(10,10,12,0.9)',
        }}
      >
        {palavras.map((p, i) => {
          const falado = falados?.[i];
          const entraEm = falado !== null && falado !== undefined ? falado - inicioDaCena : atual.em + i * passo;
          const e = mola(quadro, fps, entraEm, MOLA_PULO);
          return (
            <React.Fragment key={i}>
              <span
                style={{
                  display: 'inline-block',
                  color: p.chave ? CORES.ouro : CORES.texto,
                  opacity: Math.min(1, e * 1.6),
                  transform: `translateY(${(1 - e) * 16}px) scale(${0.86 + 0.14 * e})`,
                }}
              >
                {p.texto}
              </span>
              {i < palavras.length - 1 ? ' ' : null}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
