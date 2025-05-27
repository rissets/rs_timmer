
import type { Settings, SoundscapeOption, BackgroundAnimationOption } from '@/lib/types';

export const DEFAULT_SETTINGS: Settings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartPomodoros: true,
  soundscapeWork: 'whiteNoise',
  soundscapeBreak: 'gentleRain',
  volume: 0.5,
  notificationsEnabled: true,
  backgroundAnimation: 'gradientFlow',
  mouseTrailEffectEnabled: false, // Default for new mouse trail setting
};

export const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  { id: 'none', name: 'None', type: 'noise', params: { type: 'off' } },
  { id: 'whiteNoise', name: 'White Noise', type: 'noise', params: { type: 'white', volume: -6 } },
  { id: 'pinkNoise', name: 'Pink Noise', type: 'noise', params: { type: 'pink', volume: -6 } },
  { id: 'brownNoise', name: 'Brown Noise', type: 'noise', params: { type: 'brown', volume: -6 } },
  { id: 'gentleRain', name: 'Gentle Rain (Simulated)', type: 'noise', params: { type: 'pink', volume: -18 } },
  { id: 'focusTone', name: 'Focus Tone (440Hz Sine)', type: 'tone', params: { frequency: 440, type: 'sine' } },
  { id: 'deepDrone', name: 'Deep Drone (80Hz Sine)', type: 'tone', params: { frequency: 80, type: 'sine', volume: -10 } },
  { id: 'windyAmbience', name: 'Windy Ambience', type: 'noise', params: { type: 'pink', volume: -20 } },
  { id: 'alphaBinaural', name: 'Alpha Binaural (8Hz Beat)', type: 'binaural', params: { baseFrequency: 100, beatFrequency: 8, volume: -15 } },
  {
    id: 'ambientPad',
    name: 'Ambient Pad',
    type: 'tone', 
    params: {
      notes: ['C3', 'E3', 'G3', 'B4'], 
      oscillator: 'fatsine', 
      envelope: { attack: 2, decay: 1, sustain: 0.9, release: 4 }, 
      volume: -20, 
    }
  },
  {
    id: 'calmingChimes',
    name: 'Calming Chimes',
    type: 'tone', 
    params: {
      notes: ['C6', 'E6', 'G6', 'A6'], 
      oscillator: 'triangle', 
      envelope: { attack: 0.01, decay: 1.5, sustain: 0.05, release: 2 }, 
      volume: -18,
    }
  },
  {
    id: 'gentlePianoChord',
    name: 'Gentle Piano Chord',
    type: 'tone', 
    params: {
      notes: ['C4', 'G4', 'E5'], 
      oscillator: 'triangle', 
      envelope: { attack: 0.02, decay: 1, sustain: 0.3, release: 1.5 }, 
      volume: -16,
    }
  },
];

export const BACKGROUND_ANIMATION_OPTIONS: BackgroundAnimationOption[] = [
  { id: 'none', name: 'None' },
  { id: 'gradientFlow', name: 'Gradient Flow' },
  { id: 'rain', name: 'Rain Effect' },
  { id: 'snow', name: 'Snow Effect' },
  { id: 'starfield', name: 'Starfield Effect' },
  { id: 'bubbles', name: 'Floating Bubbles Effect' },
];

export const APP_NAME = "Zenith Timer";
