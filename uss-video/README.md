# Desafío USS × Teletón — videos Demo Day

Proyecto [Remotion](https://www.remotion.dev/) con los videos de los segundos lugares por sede.

## Composiciones (`src/Root.tsx`)

| ID | Formato | Descripción |
|---|---|---|
| `DesafioUSS` | 1920×1080, 108 s | **Versión final** estilo USS (tarjetas de vidrio, logo, cierre claro), cortada a compás de la música |
| `DesafioHorizontal` | 1920×1080, 64 s | Versión anterior, estilo "Hay quienes adoptan el futuro…" |
| `DesafioTeleton` | 1080×1920, 41 s | Versión vertical para redes |

Textos y tomas se editan en las listas `SPEC` y `CARDS` al inicio de `src/DesafioUSS.tsx`.

## Material (no versionado)

Va en `public/` (ver `.gitignore`):

- `public/clips/` — `conce_1.mp4`, `ptomontt_1..3.mp4`, `stgo_1..3.mp4`, `valdivia_1.mp4`
- `public/fotos/` — `conce_*.jpg`, `ptomontt_*.jpg`, `nutriready_logo.jpg`
- `public/music_oficial_full.m4a` — música oficial (108 s)
- `public/logo.svg`, `public/logo-color.svg` — logo USS (sí versionados)

`scripts/music.py` genera una pista alternativa original (requiere numpy).

## Uso

```bash
npm install
npx remotion studio
npx remotion render src/index.ts DesafioUSS out/USS_DemoDay.mp4
```
