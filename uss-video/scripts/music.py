"""Pista original de 64 s, cinematográfica y ascendente (sin loops).

Uso: python music.py salida.wav
Progresión I–V–vi–IV en Re mayor a 96 bpm; las capas entran de a poco
siguiendo las secciones del video y resuelven en el cierre.
"""
import sys
import wave

import numpy as np

SR = 44100
DUR = 64.0
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT
N = int(SR * DUR)
t_all = np.arange(N) / SR
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


# Re mayor: D  A  Bm  G  (fundamentales en octava 3)
CHORDS = [
    [50, 57, 62, 66],  # D
    [45, 52, 57, 61],  # A
    [47, 54, 59, 62],  # Bm
    [43, 50, 55, 59],  # G
]
ARP = [
    [62, 66, 69, 74, 69, 66, 69, 74],
    [61, 64, 69, 73, 69, 64, 69, 73],
    [62, 66, 71, 74, 71, 66, 71, 74],
    [62, 67, 71, 74, 71, 67, 71, 74],
]


def env_adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def pad_note(f, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for det in (-0.12, 0.0, 0.11):
        ff = f * 2 ** (det / 12)
        for h, amp in ((1, 1.0), (2, 0.35), (3, 0.15), (4, 0.06)):
            s += amp * np.sin(2 * np.pi * ff * h * t + rng.uniform(0, 6.28))
    return s * env_adsr(n, 1.2, 1.2) / 6


def pluck(f, dur=1.6, bright=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = (np.sin(2 * np.pi * f * t) + 0.4 * bright * np.sin(4 * np.pi * f * t) * np.exp(-t * 6)
         + 0.15 * bright * np.sin(6 * np.pi * f * t) * np.exp(-t * 9))
    return s * np.exp(-t * 3.2) * env_adsr(n, 0.004, 0.05)


def kick(dur=0.45):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 48 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7)


def add(buf, sig, start):
    i = int(start * SR)
    j = min(N, i + len(sig))
    if i < N:
        buf[i:j] += sig[: j - i]


def ramp(t0, t1, v0, v1):
    """Curva de volumen por tiempo (para las entradas de capas)."""
    return np.clip((t_all - t0) / max(t1 - t0, 1e-6), 0, 1) * (v1 - v0) + v0


pad = np.zeros(N)
arp = np.zeros(N)
bass = np.zeros(N)
drums = np.zeros(N)
shimmer = np.zeros(N)

nbars = int(np.ceil(DUR / BAR))
for b in range(nbars):
    t0 = b * BAR
    ch = CHORDS[b % 4]
    last = t0 + BAR >= DUR - 8.5  # zona de cierre
    if last:
        ch = CHORDS[0]
    for n in ch:
        add(pad, pad_note(midi(n), BAR + 1.4), t0)
    # arpegio desde el compás 2
    if b >= 2 and not last:
        for k, n in enumerate(ARP[b % 4]):
            add(arp, pluck(midi(n), bright=0.6 + 0.4 * min(b / 14, 1)), t0 + k * BEAT / 2)
    # bajo desde el compás 6
    if b >= 6 and not last:
        root = ch[0] - 12
        for k in range(4):
            add(bass, pluck(midi(root), 1.0, 0.2) * 0.9, t0 + k * BEAT)
    # pulso suave desde el compás 10
    if 10 <= b and not last:
        for k in range(4):
            add(drums, kick() * (1.0 if k % 2 == 0 else 0.55), t0 + k * BEAT)
    # brillo agudo desde el compás 14
    if b >= 14 and not last:
        for k, n in enumerate(ARP[b % 4][::2]):
            add(shimmer, pluck(midi(n + 12), 2.2, 0.3), t0 + k * BEAT + BEAT / 2)

# acorde final largo
for n in CHORDS[0] + [74, 78]:
    add(pad, pad_note(midi(n), 8.0) * 0.8, DUR - 8.5)
add(arp, pluck(midi(74), 4.0), DUR - 8.5)
add(arp, pluck(midi(78), 4.0) * 0.6, DUR - 8.0)

mix = (pad * ramp(0, 6, 0.25, 0.55)
       + arp * ramp(4, 20, 0.18, 0.32)
       + bass * 0.32
       + drums * ramp(25, 30, 0, 0.42)
       + shimmer * ramp(35, 42, 0, 0.12))


def reverb(x, secs=2.6, wet=0.32):
    n = int(secs * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 3.0)
    ir /= np.sqrt(np.sum(ir ** 2))
    L = 1 << int(np.ceil(np.log2(len(x) + n)))
    y = np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)[: len(x)]
    return (1 - wet) * x + wet * y


left = reverb(mix + 0.02 * np.roll(arp, 300))
right = reverb(mix + 0.02 * np.roll(arp, -300))
st = np.stack([left, right], 1)
fade = np.ones(N)
fade[: int(0.8 * SR)] = np.linspace(0, 1, int(0.8 * SR))
fade[-int(3 * SR):] = np.linspace(1, 0, int(3 * SR)) ** 1.5
st *= fade[:, None]
st = np.tanh(st / np.max(np.abs(st)) * 1.4) * 0.89

with wave.open(sys.argv[1], 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
