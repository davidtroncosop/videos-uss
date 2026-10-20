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

const {fontFamily} = loadFont('normal', {weights: ['600', '700'], subsets: ['latin', 'latin-ext']});

export const TOTAL_H = 1920; // 64 s @ 30 fps
const XFADE = 15;
const END_FROM = 1775;

// ---------- Tomas ----------
type Shot = {
  from: number;
  dur: number;
  src: string;
  kind: 'video' | 'photo';
  startSec?: number;
  layout?: 'full' | 'portrait'; // portrait = material vertical en recuadro sobre fondo desenfocado
  pos?: string;
  zoom?: number;
  dark?: number;
  push?: 'in' | 'out';
};

const SHOTS: Shot[] = [
  // Teletón
  {from: 165, dur: 105, src: 'fotos/conce_4.jpg', kind: 'photo', push: 'in'},
  {from: 255, dur: 105, src: 'fotos/ptomontt_12.jpg', kind: 'photo', push: 'out'},
  {from: 345, dur: 105, src: 'fotos/ptomontt_2.jpg', kind: 'photo', layout: 'portrait', pos: '50% 40%'},
  // Concepción
  {from: 435, dur: 135, src: 'clips/conce_1.mp4', kind: 'video', startSec: 0, dark: 0.62},
  {from: 555, dur: 95, src: 'fotos/conce_2.jpg', kind: 'photo', push: 'in'},
  {from: 635, dur: 130, src: 'fotos/conce_5.jpg', kind: 'photo', push: 'out'},
  // Puerto Montt (clip principal recortado arriba para sacar subtítulos)
  {from: 750, dur: 105, src: 'clips/ptomontt_1.mp4', kind: 'video', startSec: 21.6, layout: 'portrait', zoom: 1.55, pos: '50% 10%'},
  {from: 840, dur: 105, src: 'clips/ptomontt_3.mp4', kind: 'video', startSec: 2.5, dark: 0.62},
  {from: 930, dur: 105, src: 'clips/ptomontt_2.mp4', kind: 'video', startSec: 11},
  {from: 1020, dur: 130, src: 'clips/ptomontt_1.mp4', kind: 'video', startSec: 44.5, layout: 'portrait', zoom: 1.55, pos: '50% 10%'},
  // Santiago
  {from: 1135, dur: 105, src: 'clips/stgo_2.mp4', kind: 'video', startSec: 1, layout: 'portrait'},
  {from: 1225, dur: 125, src: 'clips/stgo_1.mp4', kind: 'video', startSec: 3, layout: 'portrait'},
  {from: 1335, dur: 130, src: 'clips/stgo_3.mp4', kind: 'video', startSec: 2, layout: 'portrait'},
  // Valdivia (zoom para sacar subtítulos quemados)
  {from: 1450, dur: 200, src: 'clips/valdivia_1.mp4', kind: 'video', startSec: 4.2, layout: 'portrait', zoom: 1.45, pos: '50% 18%'},
  // Cierre
  {from: 1635, dur: 155, src: 'fotos/ptomontt_10.jpg', kind: 'photo', push: 'in'},
];

// ---------- Textos ----------
type Txt = {from: number; dur: number; lines: string[]; big?: string[]; place: 'center' | 'bottomRight' | 'topRight'};

const TEXTS: Txt[] = [
  {from: 10, dur: 165, lines: ['Hay quienes hablan de inclusión', 'y quienes la construyen'], place: 'center'},
  {from: 190, dur: 255, lines: ['Estudiantes que crean', 'soluciones reales para'], big: ['Teletón'], place: 'bottomRight'},
  {from: 465, dur: 295, lines: ['Ideas que toman', 'forma en'], big: ['Concepción'], place: 'bottomRight'},
  {from: 780, dur: 365, lines: ['Manos que se', 'diseñan en'], big: ['Puerto Montt'], place: 'bottomRight'},
  {from: 1165, dur: 295, lines: ['Tecnología que', 'se mueve en'], big: ['Santiago'], place: 'bottomRight'},
  {from: 1480, dur: 160, lines: ['Nutrición que', 'se piensa en'], big: ['Valdivia'], place: 'bottomRight'},
  {from: 1655, dur: 120, lines: ['Universidad', 'San Sebastián'], big: ['Ilumina el futuro'], place: 'topRight'},
];

// ---------- Componentes ----------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const grade = (dark = 1) => `brightness(${0.8 * dark}) contrast(1.12) saturate(0.82)`;

const ShotView: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, XFADE, s.dur - XFADE, s.dur], [0, 1, 1, 0], clamp);
  const t = f / s.dur;
  const push = s.push === 'out' ? interpolate(t, [0, 1], [1.1, 1.02]) : interpolate(t, [0, 1], [1.02, 1.08]);
  const scale = (s.zoom ?? 1) * push;
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
        <AbsoluteFill style={{filter: `blur(50px) ${grade(0.32)}`, transform: 'scale(1.2)'}}>{media(fill)}</AbsoluteFill>
        <div
          style={{
            position: 'absolute', left: 330, top: 0, width: 608, height: 1080, overflow: 'hidden',
            boxShadow: '0 0 80px rgba(0,0,0,0.6)',
          }}
        >
          <AbsoluteFill style={{filter: grade(s.dark), transform: `scale(${scale})`, transformOrigin: s.pos ?? '50% 50%'}}>
            {media(fill)}
          </AbsoluteFill>
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{opacity, filter: grade(s.dark), transform: `scale(${scale})`, transformOrigin: s.pos ?? '50% 50%'}}>
      {media(fill)}
    </AbsoluteFill>
  );
};

const Line: React.FC<{text: string; delay: number; size: number; weight: number; fadeOut: number}> = ({
  text, delay, size, weight, fadeOut,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - delay, [0, 22], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  return (
    <div
      style={{
        fontSize: size, fontWeight: weight, letterSpacing: '0.14em', textTransform: 'uppercase', lineHeight: 1.12,
        opacity: p * fadeOut, filter: `blur(${(1 - p) * 10}px)`, transform: `translateY(${(1 - p) * 10}px)`,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

const TextBlock: React.FC<{t: Txt}> = ({t}) => {
  const f = useCurrentFrame();
  const fadeOut = interpolate(f, [t.dur - 18, t.dur], [1, 0], clamp);
  const center = t.place === 'center';
  const wrap: React.CSSProperties = center
    ? {justifyContent: 'center', alignItems: 'center', textAlign: 'center'}
    : {
        alignItems: 'flex-end', textAlign: 'right', paddingRight: 170,
        justifyContent: t.place === 'topRight' ? 'flex-start' : 'flex-end',
        paddingTop: t.place === 'topRight' ? 170 : 0,
        paddingBottom: t.place === 'bottomRight' ? 170 : 0,
      };
  const small = center ? 44 : 36;
  return (
    <AbsoluteFill
      style={{...wrap, display: 'flex', flexDirection: 'column', color: 'white', fontFamily, textShadow: '0 2px 18px rgba(0,0,0,0.55)'}}
    >
      {t.lines.map((l, i) => (
        <Line key={l} text={l} delay={i * 6} size={small} weight={700} fadeOut={fadeOut} />
      ))}
      {t.big?.map((l, i) => (
        <div key={l} style={{marginTop: 14}}>
          <Line text={l} delay={t.lines.length * 6 + 10 + i * 6} size={t.place === 'topRight' ? 40 : 54} weight={600} fadeOut={fadeOut} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55) 100%), linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)',
    }}
  />
);

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const dur = TOTAL_H - END_FROM;
  const bg = interpolate(f, [0, XFADE], [0, 1], clamp);
  const logo = interpolate(f, [15, 50], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const tag = interpolate(f, [45, 70], [0, 1], clamp);
  const out = interpolate(f, [dur - 20, dur], [1, 0], clamp);
  return (
    <AbsoluteFill style={{opacity: bg * out, background: 'radial-gradient(ellipse at 50% 50%, #0b1826 0%, #03070c 75%)'}}>
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
        <Img
          src={staticFile('logo.svg')}
          style={{width: 760, opacity: logo, filter: `blur(${(1 - logo) * 12}px)`, transform: `scale(${0.96 + logo * 0.04})`}}
        />
        <div
          style={{
            marginTop: 60, fontFamily, fontWeight: 600, fontSize: 28, letterSpacing: '0.32em', color: '#c6b27e',
            textTransform: 'uppercase', opacity: tag,
          }}
        >
          Desafío USS × Teletón
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const DesafioHorizontal: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#020306'}}>
    {SHOTS.map((s) => (
      <Sequence key={s.src + s.from} from={s.from} durationInFrames={s.dur} premountFor={30}>
        <ShotView s={s} />
      </Sequence>
    ))}
    <Vignette />
    {TEXTS.map((t) => (
      <Sequence key={t.from} from={t.from} durationInFrames={t.dur}>
        <TextBlock t={t} />
      </Sequence>
    ))}
    <Sequence from={END_FROM}>
      <EndCard />
    </Sequence>
    <Audio src={staticFile('music_long.m4a')} />
  </AbsoluteFill>
);
