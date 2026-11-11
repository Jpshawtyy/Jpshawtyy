import React, {useEffect, useState} from 'react';
import {continueRender, delayRender} from 'remotion';
import {fitText} from '@remotion/layout-utils';
import {fontesProntas} from '../fontes';

// Texto que escolhe sozinho o maior tamanho de letra que cabe na largura (e não passa de "maximo").
// Aceita quebra de linha com "\n".
export const TextoAjustado: React.FC<{
  texto: string;
  largura: number;
  maximo: number;
  fonte: string;
  peso: number;
  espacamento?: string;
  alturaLinha?: number;
  style?: React.CSSProperties;
}> = ({texto, largura, maximo, fonte, peso, espacamento = '-0.02em', alturaLinha = 1.02, style}) => {
  const [tamanho, setTamanho] = useState<number | null>(null);
  const [espera] = useState(() => delayRender('medindo o texto ajustado'));
  const linhas = texto.split('\n');

  useEffect(() => {
    let vivo = true;
    // Mede só depois de a fonte carregar de verdade; antes disso a medida sairia com a fonte reserva.
    fontesProntas.then(() => {
      if (!vivo) return;
      const tamanhos = linhas.map(
        (linha) => fitText({text: linha, withinWidth: largura, fontFamily: fonte, fontWeight: peso, letterSpacing: espacamento}).fontSize,
      );
      setTamanho(Math.floor(Math.min(maximo, ...tamanhos)));
      continueRender(espera);
    });
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, largura, maximo, fonte, peso, espacamento]);

  return (
    <div
      style={{
        fontFamily: fonte,
        fontWeight: peso,
        fontSize: tamanho ?? maximo * 0.5,
        lineHeight: alturaLinha,
        letterSpacing: espacamento,
        textAlign: 'center',
        whiteSpace: 'nowrap',
        visibility: tamanho === null ? 'hidden' : 'visible',
        ...style,
      }}
    >
      {linhas.map((linha, i) => (
        <div key={i}>{linha}</div>
      ))}
    </div>
  );
};
