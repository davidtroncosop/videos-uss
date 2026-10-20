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
  useVideoConfig,
} from 'remotion';
import {loadFont} from '@remotion/google-fonts/Montserrat';

const {fontFamily} = loadFont('normal', {weights: ['600', '700'], subsets: ['latin', 'latin-ext']});

export const TOTAL = 1230; // 41 s @ 30 fps
const XFADE = 15;

// ---------- Tomas ----------
type Shot = {
  from: number;
  dur: number;
  src: string;
  kind: 'video' | 'photo';
  startSec?: number;
  fit?: 'cover' | 'contain'; // contain = producto horizontal sobre fondo desenfocado
  pos?: string; // object-position
  zoom?: number; // escala base (para recortar subtítulos quemados)
  dark?: number; // brillo extra (renders con fondo blanco)
  push?: 'in' | 'out';
};

const SHOTS: Shot[] = [
  // Apertura sobre footage
  {from: 135, dur: 100, src: 'fotos/conce_4.jpg', kind: 'photo', push: 'in'},
  {from: 220, dur: 95, src: 'fotos/ptomontt_2.jpg', kind: 'photo', push: 'out', pos: '50% 40%'},
  // Concepción
  {from: 300, dur: 90, src: 'clips/conce_1.mp4', kind: 'video', startSec: 0, fit: 'contain', dark: 0.62},
  {from: 375, dur: 80, src: 'fotos/conce_2.jpg', kind: 'photo', push: 'in'},
  // Puerto Montt
  {from: 440, dur: 90, src: 'clips/ptomontt_3.mp4', kind: 'video', startSec: 2.5, fit: 'contain', dark: 0.62},
  {from: 515, dur: 85, src: 'clips/ptomontt_2.mp4', kind: 'video', startSec: 11, pos: '45% 50%'},
  {from: 585, dur: 75, src: 'fotos/ptomontt_21.jpg', kind: 'photo', push: 'in', dark: 0.8},
  // Santiago
  {from: 645, dur: 90, src: 'clips/stgo_2.mp4', kind: 'video', startSec: 1},
  {from: 720, dur: 90, src: 'clips/stgo_1.mp4', kind: 'video', startSec: 3},
  {from: 795, dur: 85, src: 'clips/stgo_3.mp4', kind: 'video', startSec: 2},
  // Valdivia (zoom para sacar subtítulos quemados)
  {from: 865, dur: 135, src: 'clips/valdivia_1.mp4', kind: 'video', startSec: 4.2, zoom: 1.45, pos: '50% 18%'},
  // Cierre
  {from: 985, dur: 125, src: 'fotos/ptomontt_10.jpg', kind: 'photo', push: 'in'},
];

// ---------- Textos ----------
type Txt = {
  from: number;
  dur: number;
  lines: string[];
  big?: string[];
  place: 'center' | 'bottomRight' | 'topRight';
};

const TEXTS: Txt[] = [
  {from: 10, dur: 135, lines: ['Hay quienes hablan', 'de inclusión y quienes', 'la construyen'], place: 'center'},
  {from: 160, dur: 145, lines: ['Estudiantes que crean', 'soluciones reales para'], big: ['Teletón'], place: 'bottomRight'},
  {from: 315, dur: 135, lines: ['Ideas que toman', 'forma en'], big: ['Concepción'], place: 'bottomRight'},
  {from: 455, dur: 195, lines: ['Manos que se', 'diseñan en'], big: ['Puerto Montt'], place: 'bottomRight'},
  {from: 660, dur: 210, lines: ['Tecnología que', 'se mueve en'], big: ['Santiago'], place: 'bottomRight'},
  {from: 880, dur: 110, lines: ['Nutrición que', 'se piensa en'], big: ['Valdivia'], place: 'bottomRight'},
  {from: 1000, dur: 100, lines: ['Universidad', 'San Sebastián'], big: ['Ilumina el futuro'], place: 'topRight'},
];

// ---------- Componentes ----------
const fadeEnvelope = (f: number, dur: number, inF = XFADE, outF = XFADE) =>
  interpolate(f, [0, inF, dur - outF, dur], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

const grade = (dark = 1) => `brightness(${0.8 * dark}) contrast(1.12) saturate(0.82)`;

const ShotView: React.FC<{s: Shot}> = ({s}) => {
  const f = useCurrentFrame();
  const opacity = fadeEnvelope(f, s.dur);
  const t = f / s.dur;
  const base = s.zoom ?? 1;
  const push = s.push === 'out' ? interpolate(t, [0, 1], [1.1, 1.02]) : interpolate(t, [0, 1], [1.02, 1.1]);
  const scale = base * push;
  const media = (style: React.CSSProperties) =>
    s.kind === 'video' ? (
      <OffthreadVideo src={staticFile(s.src)} startFrom={Math.round((s.startSec ?? 0) * 30)} muted style={style} />
    ) : (
      <Img src={staticFile(s.src)} style={style} />
    );
  const fill: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', objectPosition: s.pos ?? '50% 50%'};

  return (
    <AbsoluteFill style={{opacity}}>
      {s.fit === 'contain' ? (
        <>
          <AbsoluteFill style={{filter: `blur(40px) ${grade(0.3)}`, transform: 'scale(1.3)'}}>{media(fill)}</AbsoluteFill>
          <AbsoluteFill style={{filter: grade(s.dark), transform: `scale(${scale * 1.15})`, WebkitMaskImage: 'linear-gradient(180deg, transparent 30%, black 40%, black 60%, transparent 70%)', maskImage: 'linear-gradient(180deg, transparent 30%, black 40%, black 60%, transparent 70%)'}}>
            {media({width: '100%', height: '100%', objectFit: 'contain'})}
          </AbsoluteFill>
        </>
      ) : (
        <AbsoluteFill style={{filter: grade(s.dark), transform: `scale(${scale})`, transformOrigin: s.pos ?? '50% 50%'}}>
          {media(fill)}
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const Line: React.FC<{text: string; delay: number; size: number; weight: number; fadeOut: number}> = ({
  text, delay, size, weight, fadeOut,
}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - delay, [0, 22], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: weight,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        lineHeight: 1.12,
        opacity: p * fadeOut,
        filter: `blur(${(1 - p) * 10}px)`,
        transform: `translateY(${(1 - p) * 10}px)`,
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
};

const TextBlock: React.FC<{t: Txt}> = ({t}) => {
  const f = useCurrentFrame();
  const fadeOut = interpolate(f, [t.dur - 18, t.dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const center = t.place === 'center';
  const wrap: React.CSSProperties = center
    ? {justifyContent: 'center', alignItems: 'center', textAlign: 'center'}
    : {
        alignItems: 'flex-end',
        textAlign: 'right',
        paddingRight: 140,
        justifyContent: t.place === 'topRight' ? 'flex-start' : 'flex-end',
        paddingTop: t.place === 'topRight' ? 560 : 0,
        paddingBottom: t.place === 'bottomRight' ? 470 : 0,
      };
  const small = center ? 50 : 40;
  return (
    <AbsoluteFill
      style={{
        ...wrap,
        display: 'flex',
        flexDirection: 'column',
        color: 'white',
        fontFamily,
        textShadow: '0 2px 18px rgba(0,0,0,0.55)',
      }}
    >
      {t.lines.map((l, i) => (
        <Line key={l} text={l} delay={i * 6} size={small} weight={700} fadeOut={fadeOut} />
      ))}
      {t.big?.map((l, i) => (
        <div key={l} style={{marginTop: 14}}>
          <Line text={l} delay={t.lines.length * 6 + 10 + i * 6} size={t.place === 'topRight' ? 44 : 58} weight={600} fadeOut={fadeOut} />
        </div>
      ))}
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%), linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)',
    }}
  />
);

// Haz de luz azul (motivo "ilumina" de la referencia)
const Beam: React.FC<{intensity: number}> = ({intensity}) => {
  const f = useCurrentFrame();
  const flicker = 0.92 + 0.08 * Math.sin(f / 4) * Math.sin(f / 11);
  return (
    <AbsoluteFill style={{opacity: intensity * flicker, mixBlendMode: 'screen'}}>
      <div
        style={{
          position: 'absolute', left: '50%', bottom: 760, width: 190, height: 1400, transform: 'translateX(-50%)',
          background: 'linear-gradient(0deg, rgba(150,190,255,0.95) 0%, rgba(110,150,255,0.35) 45%, rgba(90,130,255,0) 100%)',
          clipPath: 'polygon(46% 100%, 54% 100%, 100% 0, 0 0)',
          filter: 'blur(14px)',
        }}
      />
      <div
        style={{
          position: 'absolute', left: '50%', bottom: 760, width: 46, height: 1400, transform: 'translateX(-50%)',
          background: 'linear-gradient(0deg, rgba(235,245,255,1) 0%, rgba(170,200,255,0.4) 50%, rgba(170,200,255,0) 100%)',
          clipPath: 'polygon(40% 100%, 60% 100%, 100% 0, 0 0)',
          filter: 'blur(4px)',
        }}
      />
      <div
        style={{
          position: 'absolute', left: '50%', bottom: 700, width: 520, height: 140, transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse, rgba(160,195,255,0.55), rgba(0,0,0,0) 70%)',
        }}
      />
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const {durationInFrames: d} = useVideoConfig();
  const dur = TOTAL - 1095;
  const bg = interpolate(f, [0, XFADE], [0, 1], {extrapolateRight: 'clamp'});
  const beam = interpolate(f, [5, 45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const logo = interpolate(f, [25, 55], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  const tag = interpolate(f, [50, 75], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const out = interpolate(f, [dur - 20, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  void d;
  return (
    <AbsoluteFill style={{opacity: bg * out, background: 'radial-gradient(ellipse at 50% 60%, #0c1a2a 0%, #03070c 70%)'}}>
      <Beam intensity={beam} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', flexDirection: 'column', paddingTop: 520}}>
        <Img
          src={staticFile('logo.svg')}
          style={{width: 760, opacity: logo, filter: `blur(${(1 - logo) * 12}px)`, transform: `scale(${0.96 + logo * 0.04})`}}
        />
        <div
          style={{
            marginTop: 70, fontFamily, fontWeight: 600, fontSize: 30, letterSpacing: '0.32em', color: '#c6b27e',
            textTransform: 'uppercase', opacity: tag,
          }}
        >
          Desafío USS × Teletón
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const DesafioTeleton: React.FC = () => (
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
    <Sequence from={1095}>
      <EndCard />
    </Sequence>
    <Audio src={staticFile('music.m4a')} />
  </AbsoluteFill>
);
