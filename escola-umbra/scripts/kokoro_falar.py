"""Fala frases com o Kokoro (voz neural local). Chamado pelo scripts/narrador.ts.

Uso: python kokoro_falar.py <pasta do modelo> <voz> <velocidade>
Entrada (stdin): JSON com uma lista de {"texto": "...", "saida": "arquivo.wav"}.
"""
import glob
import json
import os
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

pasta, voz, velocidade = sys.argv[1], sys.argv[2], float(sys.argv[3])

# O Kokoro lê as vozes de um arquivo só; monta esse arquivo com as vozes baixadas.
vozes = {}
for arquivo in glob.glob(os.path.join(pasta, "vozes", "*.bin")):
    nome = os.path.splitext(os.path.basename(arquivo))[0]
    vozes[nome] = np.fromfile(arquivo, dtype=np.float32).reshape(-1, 1, 256)
if voz not in vozes:
    sys.exit(f"A voz {voz} não está em {pasta}/vozes")
conjunto = os.path.join(pasta, "vozes.npz")
np.savez(conjunto, **vozes)

idioma = {"p": "pt-br", "a": "en-us", "b": "en-gb", "e": "es", "f": "fr-fr", "i": "it"}.get(voz[0], "pt-br")
kokoro = Kokoro(os.path.join(pasta, "model.onnx"), conjunto)
for frase in json.load(sys.stdin):
    audio, taxa = kokoro.create(frase["texto"], voice=voz, speed=velocidade, lang=idioma)
    sf.write(frase["saida"], audio, taxa)
