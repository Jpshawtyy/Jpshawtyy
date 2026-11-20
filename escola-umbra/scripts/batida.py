"""Gera uma batida original (estilo phonk) sincronizada com o vídeo, sem direitos de terceiros.

Uso (com o Python do narrador, que já tem numpy):
  .narrador/venv/bin/python scripts/batida.py --bpm 128 --total 17.2 --drop 9.375 --saida musica/liga-inauguracao.wav

Estrutura:
  0 -> drop - 1 compasso   intro abafada (pad escuro, bumbo filtrado, chimbal baixo)
  último compasso antes    virada: caixa acelerando, riser, e o último tempo em silêncio
  drop -> fim              batida cheia: bumbo, palma, chimbal com rolos, 808 e cowbell
"""

import argparse
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def env(n, decai):
    t = np.arange(n) / SR
    return np.exp(-decai * t)


def bumbo(dur=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    freq = 48 + 110 * np.exp(-32 * t)
    fase = 2 * np.pi * np.cumsum(freq) / SR
    clique = rng.standard_normal(n) * np.exp(-400 * t) * 0.3
    return np.tanh(1.6 * np.sin(fase) * np.exp(-5.5 * t)) + clique


def palma(dur=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ruido = np.diff(rng.standard_normal(n + 1))
    # três batidinhas rápidas, como palma
    e = sum(np.exp(-60 * np.clip(t - d, 0, None)) * (t >= d) for d in (0, 0.012, 0.024))
    tom = np.sin(2 * np.pi * 200 * t) * np.exp(-30 * t)
    return 0.45 * ruido * e * np.exp(-14 * t) + 0.25 * tom


def chimbal(dur=0.06, aberto=False):
    n = int((0.25 if aberto else dur) * SR)
    ruido = np.diff(np.diff(rng.standard_normal(n + 2)))
    return 0.18 * ruido * env(n, 12 if aberto else 75)


def oitocentos(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    deslize = freq * (1 + 0.5 * np.exp(-25 * t))  # entra deslizando de cima
    fase = 2 * np.pi * np.cumsum(deslize) / SR
    return np.tanh(2.2 * np.sin(fase)) * np.exp(-1.2 * t) * 0.55


def cowbell(freq, dur=0.22):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sign(np.sin(2 * np.pi * freq * t)) + np.sign(np.sin(2 * np.pi * freq * 1.48 * t))
    s = np.convolve(s, np.ones(6) / 6, mode='same')  # tira a aspereza
    return 0.16 * s * np.exp(-11 * t)


def prato(dur=1.6):
    n = int(dur * SR)
    ruido = np.diff(rng.standard_normal(n + 1))
    return 0.25 * ruido * env(n, 2.6)


def pad(freqs, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for d in (-0.6, 0.6):
            s += 2 * ((t * (f + d)) % 1) - 1
    s = np.convolve(s, np.ones(80) / 80, mode='same')  # escuro (passa-baixa simples)
    a = np.minimum(1, t / 0.4) * np.minimum(1, (dur - t) / 0.3)
    return 0.05 * s * a


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ruido = rng.standard_normal(n)
    agudo = np.diff(ruido, prepend=0)
    p = t / dur
    som = (1 - p) * ruido * 0.2 + p * agudo * 0.6
    tom = np.sin(2 * np.pi * np.cumsum(200 + 1400 * p**2) / SR) * 0.15
    return (som * 0.25 + tom) * p**1.5


def colocar(trilha, som, inicio, ganho=1.0):
    i = int(inicio * SR)
    if i >= len(trilha):
        return
    f = min(len(trilha), i + len(som))
    trilha[i:f] += som[: f - i] * ganho


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--bpm', type=float, default=128)
    ap.add_argument('--total', type=float, required=True)
    ap.add_argument('--drop', type=float, required=True)
    ap.add_argument('--saida', required=True)
    a = ap.parse_args()

    tempo = 60 / a.bpm
    compasso = 4 * tempo
    trilha = np.zeros(int((a.total + 2) * SR))
    virada = a.drop - compasso

    # intro: pad em ré menor e bumbo abafado
    colocar(trilha, pad([146.8, 174.6, 220.0], virada), 0, 1.0)
    b = 0.0
    while b < virada - 1e-6:
        abafado = np.convolve(bumbo(), np.ones(40) / 40, mode='same')
        colocar(trilha, abafado, b, 0.55)
        colocar(trilha, chimbal(), b + tempo / 2, 0.35)
        b += tempo

    # virada: caixa acelerando + riser; o último tempo fica em silêncio
    colocar(trilha, riser(compasso - tempo), virada, 1.0)
    # tempo 1 em colcheias, tempo 2 em semicolcheias, tempo 3 em fusas; o tempo 4 fica em silêncio
    pancadas = []
    for tempo_i, divisao in enumerate((2, 4, 8)):
        for k in range(divisao):
            pancadas.append(virada + tempo_i * tempo + k * tempo / divisao)
    for k, p in enumerate(pancadas):
        colocar(trilha, palma(), p, 0.3 + 0.55 * k / len(pancadas))

    # drop
    colocar(trilha, prato(), a.drop, 1.0)
    notas = [73.4, 73.4, 87.3, 65.4]  # ré, ré, fá, dó (graves)
    melodia = [587, 0, 698, 587, 0, 880, 0, 698, 587, 0, 698, 0, 1046, 880, 698, 0]  # 16 semicolcheias
    c = 0
    inicio = a.drop
    while inicio < a.total - 1e-6:
        for tempo_i in range(4):
            bt = inicio + tempo_i * tempo
            if bt >= a.total:
                break
            if tempo_i in (0, 2) or (tempo_i == 3 and c % 2 == 1):
                colocar(trilha, bumbo(), bt, 0.9)
            if tempo_i in (1, 3):
                colocar(trilha, palma(), bt, 0.8)
            for s in range(4):
                colocar(trilha, chimbal(), bt + s * tempo / 4, 0.55 if s % 2 == 0 else 0.35)
            if tempo_i == 3 and c % 2 == 0:  # rolinho de chimbal em tercina
                for s in range(3):
                    colocar(trilha, chimbal(), bt + tempo / 2 + s * tempo / 6, 0.4)
        colocar(trilha, oitocentos(notas[c % 4], compasso * 0.95), inicio, 0.9)
        for s, f in enumerate(melodia):
            if f:
                colocar(trilha, cowbell(f), inicio + s * tempo / 4, 0.9)
        inicio += compasso
        c += 1

    trilha = trilha[: int(a.total * SR)]
    fim = int(0.5 * SR)
    trilha[-fim:] *= np.linspace(1, 0, fim)
    trilha = np.tanh(trilha * 1.2)
    trilha *= 0.89 / max(1e-6, np.abs(trilha).max())
    dados = (trilha * 32767).astype(np.int16)
    with wave.open(a.saida, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(dados.tobytes())
    print(f'{a.saida}: {a.total:.2f} s, drop em {a.drop:.3f} s, {a.bpm:g} bpm')


if __name__ == '__main__':
    main()
