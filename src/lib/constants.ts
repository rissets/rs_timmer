
import type { Settings, SoundscapeOption, BackgroundAnimationOption, SessionType, SelectOptionWithTranslation } from '@/lib/types';

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
  mouseTrailEffectEnabled: false,
  showCoachMarks: true,
};

// Note: 'name' properties are now translation keys
export const SOUNDSCAPE_OPTIONS: SelectOptionWithTranslation[] = [
  { id: 'none', nameKey: 'soundscapes.none', type: 'noise', params: { type: 'off' } },
  { id: 'whiteNoise', nameKey: 'soundscapes.whiteNoise', type: 'noise', params: { type: 'white', volume: -6 } },
  { id: 'pinkNoise', nameKey: 'soundscapes.pinkNoise', type: 'noise', params: { type: 'pink', volume: -6 } },
  { id: 'brownNoise', nameKey: 'soundscapes.brownNoise', type: 'noise', params: { type: 'brown', volume: -6 } },
  { id: 'gentleRain', nameKey: 'soundscapes.gentleRain', type: 'noise', params: { type: 'pink', volume: -18 } },
  { id: 'focusTone', nameKey: 'soundscapes.focusTone', type: 'tone', params: { frequency: 440, type: 'sine' } },
  { id: 'deepDrone', nameKey: 'soundscapes.deepDrone', type: 'tone', params: { frequency: 80, type: 'sine', volume: -10 } },
  { id: 'windyAmbience', nameKey: 'soundscapes.windyAmbience', type: 'noise', params: { type: 'pink', volume: -20 } },
  { id: 'alphaBinaural', nameKey: 'soundscapes.alphaBinaural', type: 'binaural', params: { baseFrequency: 100, beatFrequency: 8, volume: -15 } },
  {
    id: 'ambientPad',
    nameKey: 'soundscapes.ambientPad',
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
    nameKey: 'soundscapes.calmingChimes',
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
    nameKey: 'soundscapes.gentlePianoChord',
    type: 'tone',
    params: {
      notes: ['C4', 'G4', 'E5'],
      oscillator: 'triangle',
      envelope: { attack: 0.02, decay: 1, sustain: 0.3, release: 1.5 },
      volume: -16,
    }
  },
  {
    id: 'lofiBeat',
    nameKey: 'soundscapes.lofiBeat',
    type: 'patternLoop',
    params: {
      bpm: 85,
      volumeAdjustment: -18,
      instruments: [
        {
          name: 'chords',
          synthType: 'PolySynth',
          synthOptions: { oscillator: { type: 'fmsquare' }, envelope: { attack: 0.2, decay: 0.5, sustain: 0.3, release: 1 } },
          sequence: [ { time: '0:0', notes: ['A#2', 'D3', 'F3', 'G#3'], duration: '1m' }, { time: '1:0', notes: ['G2', 'C3', 'D#3', 'F3'], duration: '1m' } ],
        },
        {
          name: 'kick',
          synthType: 'MembraneSynth',
          synthOptions: { octaves: 4, pitchDecay: 0.1, envelope: { attack: 0.001, decay: 0.3, sustain: 0.01, release: 0.2 } },
          pattern: ['C1', null, 'C1', null, 'C1', 'C1', null, 'C1'],
          subdivision: '8n',
        },
        {
          name: 'snare',
          synthType: 'NoiseSynth',
          synthOptions: { noise: { type: 'pink' }, envelope: { attack: 0.005, decay: 0.15, sustain: 0, release: 0.1 } },
          pattern: [null, null, 'C2', null, null, null, 'C2', null],
          subdivision: '8n',
        },
        {
          name: 'hihat',
          synthType: 'NoiseSynth',
          synthOptions: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }, volume: -10 },
          pattern: ['C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3'],
          subdivision: '8n',
        }
      ],
    }
  },
  {
    id: 'classicalExcerpt',
    nameKey: 'soundscapes.classicalExcerpt',
    type: 'patternLoop',
    params: {
      bpm: 70,
      volumeAdjustment: -12,
      instruments: [
        {
          name: 'stringsPad',
          synthType: 'PolySynth',
          synthOptions: {
            oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
            envelope: { attack: 1.5, decay: 0.5, sustain: 1, release: 2.5 }
          },
          sequence: [
            { time: '0:0', notes: ['C3', 'E3', 'G3'], duration: '2m' },
            { time: '2:0', notes: ['A2', 'C3', 'E3'], duration: '2m' },
            { time: '4:0', notes: ['F2', 'A2', 'C3'], duration: '2m' },
            { time: '6:0', notes: ['G2', 'B2', 'D3'], duration: '2m' },
          ]
        }
      ],
      effects: {
        reverb: { wet: 0.3, decay: 5 }
      }
    }
  }
];

export const BACKGROUND_ANIMATION_OPTIONS: SelectOptionWithTranslation[] = [
  { id: 'none', nameKey: 'backgroundAnimations.none' },
  { id: 'gradientFlow', nameKey: 'backgroundAnimations.gradientFlow' },
  { id: 'rain', nameKey: 'backgroundAnimations.rain' },
  { id: 'snow', nameKey: 'backgroundAnimations.snow' },
  { id: 'starfield', nameKey: 'backgroundAnimations.starfield' },
  { id: 'bubbles', nameKey: 'backgroundAnimations.bubbles' },
];

export const SESSION_TYPE_OPTIONS: { id: SessionType; nameKey: string }[] = [
  { id: 'general', nameKey: 'sessionTypes.general' },
  { id: 'work', nameKey: 'sessionTypes.work' },
  { id: 'learning', nameKey: 'sessionTypes.learning' },
];

export const APP_NAME = "RS";
