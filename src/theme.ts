// src/theme.ts
import {StyleSheet} from 'react-native';

export const T = {
  bg: '#0A1F2E',
  surface: '#0f2a3d',
  card: '#142d40',
  border: '#1e3a50',
  borderLt: '#2a4d66',
  accent: '#DAA520',
  accentBg: 'rgba(218,165,32,0.12)',
  text: '#C0C0C0',
  dim: '#8899aa',
  muted: '#2a4a60',
  danger: '#d9534f',
  dangerBg: 'rgba(217,83,79,0.12)',
  success: '#4caf8a',
  successBg: 'rgba(76,175,138,0.12)',
  info: '#7B9FE8',
  infoBg: 'rgba(123,159,232,0.12)',
  // Light mode flag for consumers that need to adapt
  isLight: false,
};

export const TLight = {
  bg: '#7A8A99',
  surface: '#8a99a8',
  card: '#95a3b0',
  border: '#6a7a88',
  borderLt: '#5a6a78',
  accent: '#DAA520',
  accentBg: 'rgba(218,165,32,0.18)',
  // Dark text in light mode = Obsidian Blue
  text: '#0A1F2E',
  dim: '#1e3a50',
  muted: '#3a5060',
  danger: '#d9534f',
  dangerBg: 'rgba(217,83,79,0.15)',
  success: '#2e7a5a',
  successBg: 'rgba(46,122,90,0.15)',
  info: '#2a5aaa',
  infoBg: 'rgba(42,90,170,0.15)',
  isLight: true,
};

export const accentTextStyle = (_isLight: boolean) => ({});

export const PALETTE = [
  '#DAA520', '#7B9FE8', '#E87BA8', '#7BE8C4',
  '#A87BE8', '#E8A87B', '#6EC9A9', '#E87B7B',
  '#85B4E8', '#C97BE8', '#B4E885', '#E8C97B',
];

export const Fonts = {
  display: 'Georgia',
  body: 'System',
};
