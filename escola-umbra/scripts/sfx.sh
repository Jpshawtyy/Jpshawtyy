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
# boing: mola, frequência oscilando e caindo
$F -f lavfi -i "aevalsrc='0.5*sin(2*PI*(180*t+60*sin(2*PI*9*t)*exp(-3*t)/(2*PI*9)*9))*exp(-3.5*t)':d=0.8:s=44100" boing.wav
# pop: bolha estourando (adesivo aparecendo)
$F -f lavfi -i "aevalsrc='0.7*sin(2*PI*(900*t-2600*t*t))*exp(-38*t)':d=0.15:s=44100" pop.wav
# ding: sininho do contador
$F -f lavfi -i "aevalsrc='(0.35*sin(2*PI*1568*t)+0.18*sin(2*PI*3136*t)+0.08*sin(2*PI*4704*t))*exp(-5*t)':d=1.0:s=44100" ding.wav
# trombone triste: quatro notas descendo (wah wah wah waaah)
$F -f lavfi -i "aevalsrc='0.3*(2*(mod(t*(if(lt(t,0.32),311,if(lt(t,0.64),294,if(lt(t,0.96),277,262+4*sin(2*PI*6*t))))),1))-1)*(0.6+0.4*sin(PI*mod(t,0.32)/0.32))*if(lt(t,0.96),1,exp(-1.8*(t-0.96)))':d=2.0:s=44100" -af "lowpass=f=1800,volume=1.3" trombone.wav
# boom: estrondo grave e longo, com eco (o "boom" dramático dos memes)
$F -f lavfi -i "aevalsrc='0.95*tanh(2.5*sin(2*PI*(38*t+30*(1-exp(-6*t))))*exp(-2.2*t))':d=1.8:s=44100" -af "aecho=0.8:0.6:120:0.35,volume=1.2,alimiter=limit=0.95" boom.wav
# buzina: acorde de serra em três toques (ba-ba-baaa), com vibrato
$F -f lavfi -i "aevalsrc='0.22*((2*mod(t*(466+6*sin(2*PI*7*t)),1)-1)+(2*mod(t*(587+6*sin(2*PI*7*t)),1)-1)+(2*mod(t*(698+6*sin(2*PI*7*t)),1)-1))*(between(t,0,0.12)+between(t,0.18,0.3)+between(t,0.36,1.1))*min(1,(1.1-t)*6)':d=1.15:s=44100" -af "lowpass=f=3500,highpass=f=200,volume=1.1,alimiter=limit=0.95" buzina.wav
# arranhão: disco sendo puxado (ruído com o tom indo e voltando)
$F -f lavfi -i "aevalsrc='0.6*sin(2*PI*(300*t+120*sin(2*PI*5*t)))*exp(-3*t)*(0.5+0.5*sin(2*PI*14*t))':d=0.45:s=44100" -f lavfi -i "anoisesrc=color=white:duration=0.45:amplitude=0.25:seed=5" -filter_complex "[1]bandpass=f=2500:width_type=h:w=2000[n];[0][n]amix=inputs=2:normalize=0,afade=t=out:st=0.3:d=0.15" arranhao.wav
# tique: contagem regressiva
$F -f lavfi -i "aevalsrc='0.6*sin(2*PI*1200*t)*exp(-40*t)+0.3*sin(2*PI*2400*t)*exp(-60*t)':d=0.2:s=44100" tique.wav
ls -la
