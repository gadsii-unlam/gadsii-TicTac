import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Mask, Path, Pattern, Rect, Stop, SvgXml } from 'react-native-svg';
import { headerLogo, stackedColor, stackedDark } from './logos';

// Íconos de trazo 24×24, trazo 2, extremos redondeados (design system Nodo UNLaM).
const ICONS = {
  bell: ['M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9', 'M13.73 21a2 2 0 0 1-3.46 0'],
  bellOff: ['M13.73 21a2 2 0 0 1-3.46 0M18.63 13A17.89 17.89 0 0 1 18 8M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14M18 8a6 6 0 0 0-9.33-5M1 1l22 22'],
  calendar: ['M16 2v4M8 2v4M3 10h18'],
  calendarCheck: ['M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4'],
  pin: ['M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'],
  gradCap: ['M22 10L12 5 2 10l10 5 10-5z', 'M6 12v5c3 3 9 3 12 0v-5'],
  clock: ['M12 6v6l4 2'],
  arrowLeft: ['M19 12H5M12 19l-7-7 7-7'],
  menu: ['M3 6h18M3 12h18M3 18h18'],
  chevronLeft: ['M15 18l-6-6 6-6'],
  chevronRight: ['M9 18l6-6-6-6'],
  arrowRight: ['M5 12h14M12 5l7 7-7 7'],
  check: ['M20 6L9 17l-5-5'],
  chevronDown: ['M6 9l6 6 6-6'],
  wifiOff: ['M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a15.91 15.91 0 0 1 4.7-2.88M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01'],
  externalLink: ['M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3'],
  close: ['M18 6L6 18M6 6l12 12'],
  home: ['M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', 'M9 22V12h6v10'],
  filter: ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  image: ['M21 15l-5-5L5 21'],
  settings: [
    'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z',
  ],
};
// Formas adicionales por ícono (círculos y rectángulos del set original).
const calendarFrame = <Rect x="3" y="4" width="18" height="18" rx="2" />;
const ICON_SHAPES = {
  calendar: calendarFrame,
  calendarCheck: calendarFrame,
  pin: <Circle cx="12" cy="10" r="3" />,
  clock: <Circle cx="12" cy="12" r="10" />,
  settings: <Circle cx="12" cy="12" r="3" />,
  image: [<Rect key="r" x="3" y="3" width="18" height="18" rx="2" />, <Circle key="c" cx="8.5" cy="8.5" r="1.5" />],
};

export function Icon({ name, size = 20, color = '#18223A', filled = false, strokeWidth = 2, style }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
      <G
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={filled ? color : 'none'}
      >
        {ICONS[name].map(d => <Path key={d} d={d} />)}
        {ICON_SHAPES[name]}
      </G>
    </Svg>
  );
}

// Círculo verde con tilde, usado en la bienvenida.
export function CheckBadge({ size = 28, color = '#128268' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx="12" cy="12" r="11" fill={color} />
      <Path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const LOGOS = {
  header: { xml: headerLogo, ratio: 298.7 / 64 },
  stacked: { xml: stackedColor, ratio: 141.2 / 103 },
  stackedDark: { xml: stackedDark, ratio: 141.2 / 103 },
};

// Logo Nodo UNLaM del design system; `height` define el tamaño y el ancho sale de su proporción.
export function Logo({ variant = 'header', height = 30 }) {
  const logo = LOGOS[variant];
  return (
    <View accessible accessibilityRole="image" accessibilityLabel="Nodo UNLaM">
      <SvgXml xml={logo.xml} width={Math.round(height * logo.ratio)} height={height} />
    </View>
  );
}

let tramaSeq = 0;

// Trama de nodos: red dispersa de nodos y conexiones, con un único nodo anillo por módulo.
export function Trama({ palette, tile = 170, fade = false }) {
  const id = useRef(++tramaSeq).current;
  const { bg, line, node, ring } = palette;
  const pattern = `trama-${id}`;
  const content = (
    <>
      <Rect width="100%" height="100%" fill={bg} />
      <Rect width="100%" height="100%" fill={`url(#${pattern})`} />
    </>
  );
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id={pattern} width={tile} height={tile} patternUnits="userSpaceOnUse" viewBox="0 0 200 200">
          <G fill="none" stroke={line} strokeWidth="1.4" strokeLinecap="round">
            <Line x1="30" y1="40" x2="112" y2="24" />
            <Line x1="112" y1="24" x2="172" y2="96" />
            <Line x1="30" y1="40" x2="72" y2="118" />
            <Line x1="72" y1="118" x2="172" y2="96" />
            <Line x1="72" y1="118" x2="142" y2="166" />
            <Line x1="142" y1="166" x2="22" y2="178" />
            <Line x1="22" y1="178" x2="30" y2="240" />
            <Line x1="22" y1="-22" x2="30" y2="40" />
            <Line x1="172" y1="96" x2="230" y2="40" />
            <Line x1="-28" y1="96" x2="30" y2="40" />
            <Line x1="142" y1="166" x2="112" y2="224" />
            <Line x1="142" y1="-34" x2="112" y2="24" />
            <Line x1="172" y1="96" x2="222" y2="178" />
            <Line x1="-28" y1="96" x2="22" y2="178" />
          </G>
          <G fill={node}>
            <Circle cx="30" cy="40" r="4" />
            <Circle cx="112" cy="24" r="4" />
            <Circle cx="172" cy="96" r="4" />
            <Circle cx="72" cy="118" r="4" />
            <Circle cx="22" cy="178" r="4" />
          </G>
          <Circle cx="142" cy="166" r="7" fill={ring} />
          <Circle cx="142" cy="166" r="3" fill={bg} />
        </Pattern>
        {fade ? (
          <>
            <LinearGradient id={`${pattern}-g`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity="1" />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
            </LinearGradient>
            <Mask id={`${pattern}-m`} x="0" y="0" width="100%" height="100%">
              <Rect width="100%" height="100%" fill={`url(#${pattern}-g)`} />
            </Mask>
          </>
        ) : null}
      </Defs>
      {fade ? <G mask={`url(#${pattern}-m)`}>{content}</G> : content}
    </Svg>
  );
}
