#!/usr/bin/env bash
# Gera os efeitos sonoros da série Deck do Dia em public/sfx/ (sintetizados com ffmpeg, sem direitos de terceiros).
set -euo pipefail
cd "$(dirname "$0")/../public/sfx"
F="ffmpeg -loglevel error -y"
# whoosh: ruído rosa filtrado, sobe e desce
$F -f lavfi -i "anoisesrc=color=pink:duration=0.45:amplitude=0.9:seed=7" -af "bandpass=f=1400:width_type=h:w=1800,afade=t=in:d=0.18:curve=exp,afade=t=out:st=0.2:d=0.25,volume=2.2" -ar 44100 whoosh.wav
# impacto: grave que cai de 120 Hz para 40 Hz, com um estalo de ruído no começo
$F -f lavfi -i "aevalsrc='0.9*sin(2*PI*(40*t+10*(1-exp(-8*t))))*exp(-5*t)':d=0.7:s=44100" \
   -f lavfi -i "anoisesrc=color=white:duration=0.06:amplitude=0.6:seed=3" \
   -filter_complex "[1]highpass=f=1500,afade=t=out:d=0.06[n];[0][n]amix=inputs=2:normalize=0,alimiter=limit=0.95" impacto.wav
# carta: estalinho curto de papel
$F -f lavfi -i "anoisesrc=color=white:duration=0.05:amplitude=0.7:seed=11" -af "highpass=f=2500,afade=t=out:d=0.05:curve=exp,volume=1.4" -ar 44100 carta.wav
# brilho: duas notas agudas que piscam e somem
$F -f lavfi -i "aevalsrc='(0.25*sin(2*PI*2637*t)+0.2*sin(2*PI*3951*t))*exp(-4*t)*(0.6+0.4*sin(2*PI*18*t))':d=0.9:s=44100" brilho.wav
# subida: chirp de 300 a 1400 Hz para a contagem do número
$F -f lavfi -i "aevalsrc='0.22*sin(2*PI*(300*t+550*t*t))*min(1,t*4)':d=1.0:s=44100" -af "afade=t=out:st=0.85:d=0.15" subida.wav
ls -la
