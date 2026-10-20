// Versión 16:9 con el estilo de marca USS ("Ilumina el futuro"):
// imagen luminosa, tarjetas de vidrio abajo a la izquierda, logo de agua arriba a la derecha
// y cierre claro con logo a color + franja azul marino.
import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  interpolate,
  OffthreadVideo,
  Sequence,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Montserrat';

const {fontFamily} = loadFont('normal', {weights: ['400', '500', '700'], subsets: ['latin', 'latin-ext']});

export const TOTAL_USS = 3240; // 108 s @ 30 fps (canción completa)
const XF = 18;
const END_FROM = Math.round((0.04 + 58.2 * (60 / 139.5) * 4) * 30); // justo antes del clímax
const NAVY = '#102b42';
const GOLD = '#c6b27e';

// ---------- Tomas ----------
// Todo va cortado a compás de la música (139,5 bpm → 1 compás = 1,7204 s).
const BAR_S = (60 / 139.5) * 4;
const bar = (n: number) => Math.round((0.04 + n * BAR_S) * 30);

type Shot = {
  from: number;
  dur: number;
  src: string;
  kind: 'video' | 'photo';
  startSec?: number;
  layout?: 'full' | 'portrait';
  pos?: string;
  zoom?: number;
  push?: 'in' | 'out';
  square?: boolean; // recuadro cuadrado (logos/gráficas)
};
type ShotSpec = Omit<Shot, 'from' | 'dur'> & {bars: number};

// Secuencia continua: cada toma dura N compases y se funde con la siguiente.
const SPEC: ShotSpec[] = [
  // Intro (compases 0–12)
  {bars: 2, src: 'fotos/ptomontt_10.jpg', kind: 'photo', push: 'in'},
  {bars: 2, src: 'fotos/conce_5.jpg', kind: 'photo', push: 'out'},
  {bars: 2, src: 'fotos/ptomontt_17.jpg', kind: 'photo', push: 'in'},
  {bars: 2, src: 'clips/stgo_1.mp4', kind: 'video', startSec: 14, layout: 'portrait'},
  {bars: 2, src: 'fotos/ptomontt_12.jpg', kind: 'photo', push: 'out'},
  {bars: 2, src: 'fotos/ptomontt_4.jpg', kind: 'photo', push: 'in'},
  // Santiago (12–24)
  {bars: 2, src: 'clips/stgo_2.mp4', kind: 'video', startSec: 0.5, layout: 'portrait'},
  {bars: 2, src: 'clips/stgo_1.mp4', kind: 'video', startSec: 3, layout: 'portrait'},
  {bars: 2, src: 'clips/stgo_3.mp4', kind: 'video', startSec: 2, layout: 'portrait'},
  {bars: 2, src: 'clips/stgo_2.mp4', kind: 'video', startSec: 4.2, layout: 'portrait'},
  {bars: 2, src: 'clips/stgo_1.mp4', kind: 'video', startSec: 8, layout: 'portrait'},
  {bars: 2, src: 'clips/stgo_3.mp4', kind: 'video', startSec: 9, layout: 'portrait'},
  // Concepción (24–33)
  {bars: 1, src: 'fotos/conce_1.jpg', kind: 'photo', layout: 'portrait'},
  {bars: 1, src: 'fotos/conce_3.jpg', kind: 'photo', layout: 'portrait'},
  {bars: 3, src: 'clips/conce_1.mp4', kind: 'video', startSec: 0},
  {bars: 2, src: 'fotos/conce_4.jpg', kind: 'photo', push: 'in'},
  {bars: 2, src: 'fotos/conce_2.jpg', kind: 'photo', push: 'out'},
  // Valdivia (33–43)
  {bars: 4, src: 'clips/valdivia_1.mp4', kind: 'video', startSec: 4.2, layout: 'portrait', zoom: 1.45, pos: '50% 18%'},
  {bars: 3, src: 'clips/valdivia_1.mp4', kind: 'video', startSec: 13, layout: 'portrait', zoom: 1.45, pos: '50% 18%'},
  {bars: 3, src: 'fotos/nutriready_logo.jpg', kind: 'photo', layout: 'portrait', square: true},
  // Puerto Montt (43–56)
  {bars: 2, src: 'clips/ptomontt_1.mp4', kind: 'video', startSec: 21.4, layout: 'portrait', zoom: 1.55, pos: '50% 10%'},
  {bars: 1, src: 'fotos/ptomontt_1.jpg', kind: 'photo', layout: 'portrait'},
  {bars: 1, src: 'fotos/ptomontt_2.jpg', kind: 'photo', layout: 'portrait'},
  {bars: 1, src: 'fotos/ptomontt_19.jpg', kind: 'photo', layout: 'portrait'},
  {bars: 1, src: 'fotos/ptomontt_24.jpg', kind: 'photo', layout: 'portrait'},
  {bars: 1, src: 'fotos/ptomontt_22.jpg', kind: 'photo', push: 'in'},
  {bars: 1, src: 'fotos/ptomontt_20.jpg', kind: 'photo', layout: 'portrait'},
  {bars: 1, src: 'fotos/ptomontt_21.jpg', kind: 'photo', layout: 'portrait'},
  {bars: 2, src: 'clips/ptomontt_3.mp4', kind: 'video', startSec: 2.5},
  {bars: 2, src: 'clips/ptomontt_2.mp4', kind: 'video', startSec: 11},
  // Cierre (56–58, se funde con la tarjeta final)
  {bars: 3, src: 'clips/ptomontt_1.mp4', kind: 'video', startSec: 44.0, layout: 'portrait', zoom: 1.55, pos: '50% 10%'},
];

const SHOTS: Shot[] = (() => {
  let b = 0;
  return SPEC.map(({bars, ...rest}) => {
    const from = bar(b);
    b += bars;
    return {...rest, from, dur: bar(b) - from + XF};
  });
})();

// ---------- Tarjetas ----------
type Card = {from: number; dur: number; eyebrow: string; title: string; sub: string};
const card = (b0: number, b1: number, eyebrow: string, title: string, sub: string): Card => ({
  from: bar(b0) + 10, dur: bar(b1) - bar(b0) - 10, eyebrow, title, sub,
});

const CARDS: Card[] = [
  card(0, 12, 'Demo Day · Desafío USS × Teletón', 'Segundos lugares por sede', 'Santiago, Concepción, Valdivia y Puerto Montt'),
  card(12, 24, '2° lugar · Sede Santiago', 'Prótesis mioeléctrica', 'Electrónica, sensores y piezas impresas en 3D'),
  card(24, 33, '2° lugar · Sede Concepción', 'Órtesis de pierna', 'Diseñada desde el boceto hasta el prototipo'),
  card(33, 43, '2° lugar · Sede Valdivia', 'NutriReady', 'App para facilitar la evaluación nutricional de niñas y niños'),
  card(43, 56, '2° lugar · Sede Puerto Montt', 'Prótesis mioeléctrica', 'Con cámara e inteligencia artificial que reconoce objetos'),
  card(56, 58.4, 'Universidad San Sebastián', 'Ilumina el futuro', 'Gracias a todos los equipos que aceptaron el desafío'),
];

// ---------- Utilidades ----------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const GRADE = 'brightness(1.04) contrast(1.06) saturate(1.1) sepia(0.05)';

const ShotView: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, XF, s.dur - XF, s.dur], [0, 1, 1, 0], clamp);
  const t = f / s.dur;
  // Entrada: leve zoom de asentamiento + movimiento lento continuo
  const settle = interpolate(f, [0, XF * 1.5], [1.05, 1], {...clamp, easing: ease});
  const drift = s.push === 'out' ? interpolate(t, [0, 1], [1.07, 1.0]) : interpolate(t, [0, 1], [1.0, 1.07]);
  const scale = (s.zoom ?? 1) * settle * drift;
  const media = (style: React.CSSProperties) =>
    s.kind === 'video' ? (
      <OffthreadVideo src={staticFile(s.src)} startFrom={Math.round((s.startSec ?? 0) * 30)} muted style={style} />
    ) : (
      <Img src={staticFile(s.src)} style={style} />
    );
  const fill: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', objectPosition: s.pos ?? '50% 50%'};

  if (s.layout === 'portrait') {
    return (
      <AbsoluteFill style={{opacity}}>
        <AbsoluteFill style={{filter: `blur(60px) brightness(0.75) saturate(1.2)`, transform: 'scale(1.25)'}}>{media(fill)}</AbsoluteFill>
        <AbsoluteFill style={{background: 'linear-gradient(120deg, rgba(16,43,66,0.55), rgba(16,43,66,0.15))'}} />
        <div
          style={{
            position: 'absolute', right: s.square ? 220 : 300, top: s.square ? 160 : 70, width: s.square ? 760 : 532, height: s.square ? 760 : 940, overflow: 'hidden', borderRadius: 28,
            boxShadow: '0 30px 80px rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          <AbsoluteFill style={{filter: GRADE, transform: `scale(${scale})`, transformOrigin: s.pos ?? '50% 50%'}}>
            {media(fill)}
          </AbsoluteFill>
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{opacity, filter: GRADE, transform: `scale(${scale})`, transformOrigin: s.pos ?? '50% 50%'}}>
      {media(fill)}
    </AbsoluteFill>
  );
};

const GlassCard: React.FC<{c: Card}> = ({c}) => {
  const f = useCurrentFrame();
  const inP = interpolate(f, [0, 24], [0, 1], {...clamp, easing: ease});
  const outP = interpolate(f, [c.dur - 18, c.dur], [1, 0], clamp);
  const line = (d: number) => {
    const p = interpolate(f - d, [0, 20], [0, 1], {...clamp, easing: ease});
    return {opacity: p, transform: `translateY(${(1 - p) * 14}px)`};
  };
  const progress = interpolate(f, [10, c.dur - 18], [0, 1], clamp);
  return (
    <AbsoluteFill style={{opacity: outP}}>
      <div style={{position: 'absolute', left: 110, bottom: 110, fontFamily, color: 'white'}}>
        <div
          style={{
            padding: '30px 40px 32px', borderRadius: 26, maxWidth: 1000,
            background: 'linear-gradient(135deg, rgba(16,43,66,0.55), rgba(16,43,66,0.25))',
            backdropFilter: 'blur(22px) saturate(1.3)', WebkitBackdropFilter: 'blur(22px) saturate(1.3)',
            border: '1px solid rgba(255,255,255,0.35)', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
            opacity: inP, transform: `translateY(${(1 - inP) * 30}px)`,
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 24, fontWeight: 500, ...line(6)}}>
            <span style={{width: 9, height: 9, borderRadius: 9, background: GOLD, boxShadow: `0 0 12px ${GOLD}`}} />
            {c.eyebrow}
          </div>
          <div style={{fontSize: 66, fontWeight: 700, lineHeight: 1.08, marginTop: 8, letterSpacing: '-0.01em', whiteSpace: 'nowrap', ...line(12)}}>{c.title}</div>
          <div style={{fontSize: 27, fontWeight: 400, lineHeight: 1.3, marginTop: 12, ...line(18)}}>{c.sub}</div>
        </div>
        <div style={{marginTop: 18, height: 3, width: 220, background: 'rgba(255,255,255,0.3)', borderRadius: 3, overflow: 'hidden', opacity: inP}}>
          <div style={{height: '100%', width: `${progress * 100}%`, background: 'white'}} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Watermark: React.FC = () => {
  const f = useCurrentFrame();
  const o = interpolate(f, [10, 30, END_FROM - 10, END_FROM + 5], [0, 0.92, 0.92, 0], clamp);
  return <Img src={staticFile('logo.svg')} style={{position: 'absolute', right: 70, top: 56, width: 230, opacity: o}} />;
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const dur = TOTAL_USS - END_FROM;
  const bg = interpolate(f, [0, XF], [0, 1], clamp);
  const logo = interpolate(f, [12, 45], [0, 1], {...clamp, easing: ease});
  const band = interpolate(f, [30, 55], [0, 1], {...clamp, easing: ease});
  const out = interpolate(f, [dur - 15, dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: bg * out, background: 'linear-gradient(180deg, #f6f7f8 0%, #e6e9ec 100%)'}}>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: 140}}>
        <Img src={staticFile('logo-color.svg')} style={{width: 720, opacity: logo, transform: `translateY(${(1 - logo) * 20}px)`}} />
      </AbsoluteFill>
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0, height: 140, background: NAVY,
          transform: `translateY(${(1 - band) * 140}px)`, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 110px', fontFamily,
        }}
      >
        <div style={{color: GOLD, fontSize: 26, fontWeight: 500, letterSpacing: '0.04em'}}>Desafío USS × Teletón</div>
        <div style={{color: 'white', fontSize: 34, fontWeight: 700}}>uss.cl</div>
      </div>
    </AbsoluteFill>
  );
};

export const DesafioUSS: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: NAVY}}>
    {SHOTS.map((s) => (
      <Sequence key={s.src + s.from} from={s.from} durationInFrames={s.dur} premountFor={30}>
        <ShotView s={s} />
      </Sequence>
    ))}
    {/* degradado suave para legibilidad de las tarjetas */}
    <AbsoluteFill style={{background: 'linear-gradient(20deg, rgba(8,24,40,0.55) 0%, rgba(8,24,40,0) 50%)'}} />
    {CARDS.map((c) => (
      <Sequence key={c.from} from={c.from} durationInFrames={c.dur}>
        <GlassCard c={c} />
      </Sequence>
    ))}
    <Watermark />
    <Sequence from={END_FROM}>
      <EndCard />
    </Sequence>
    <Audio src={staticFile('music_oficial_full.m4a')} />
  </AbsoluteFill>
);
