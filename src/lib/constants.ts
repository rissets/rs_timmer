
import type { Settings, SoundscapeOption, BackgroundAnimationOption, SessionType } from '@/lib/types';

export const DEFAULT_SETTINGS: Settings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartPomodoros: true,
  soundscapeWork: 'whiteNoise',
  soundscapeBreak: 'gentleRainSimulated',
  volume: 0.5,
  notificationsEnabled: true,
  backgroundAnimation: 'gradientFlow',
  mouseTrailEffectEnabled: false,
  showCoachMarks: true,
  customSoundscapeUrls: {},
};

// Note: 'name' properties are now translation keys
export const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  { id: 'none', nameKey: 'soundscapes.none', type: 'noise', params: { type: 'off' } },
  { id: 'whiteNoise', nameKey: 'soundscapes.whiteNoise', type: 'noise', params: { type: 'white', volumeAdjustment: -6 } },
  { id: 'pinkNoise', nameKey: 'soundscapes.pinkNoise', type: 'noise', params: { type: 'pink', volumeAdjustment: -6 } },
  { id: 'brownNoise', nameKey: 'soundscapes.brownNoise', type: 'noise', params: { type: 'brown', volumeAdjustment: -6 } },
  { 
    id: 'gentleRainSimulated', 
    nameKey: 'soundscapes.gentleRainSimulated', 
    type: 'noise', 
    params: { 
      type: 'pink', 
      volumeAdjustment: -18, 
    } 
  },
  { 
    id: 'oceanWavesSynth', 
    nameKey: 'soundscapes.oceanWavesSynth', 
    type: 'ocean', 
    params: { 
      volumeAdjustment: -12,
      autoFilter: { // Parameters for the AutoFilter to simulate waves
        frequency: "4m", // Speed of the LFO controlling the filter
        baseFrequency: 200, // Center frequency of the filter
        octaves: 5, // Range of the filter sweep
        filter: { type: "lowpass" as const, rolloff: -24 as const, Q: 3 },
      }
    } 
  },
  { 
    id: 'cracklingFireplaceSynth', 
    nameKey: 'soundscapes.cracklingFireplaceSynth', 
    type: 'fireplace', 
    params: { 
      volumeAdjustment: -15,
      synthOptions: { // Parameters for the NoiseSynth
        noise: { type: 'pink' as const }, 
        envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.02 } 
      }
    } 
  },
  { 
    id: 'focusTone', 
    nameKey: 'soundscapes.focusTone', 
    type: 'tone', 
    params: { 
      frequency: 440, 
      type: 'sine',
      envelope: { attack: 0.005, decay: 0.1, sustain: 1, release: 0.5 }
    } 
  },
  { 
    id: 'deepDrone', 
    nameKey: 'soundscapes.deepDrone', 
    type: 'tone', 
    params: { 
      frequency: 80, 
      type: 'sine', 
      volumeAdjustment: -10,
      envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 1 }
    } 
  },
  { 
    id: 'windyAmbience', 
    nameKey: 'soundscapes.windyAmbience', 
    type: 'noise', 
    params: { 
      type: 'pink', 
      volumeAdjustment: -20 
    } 
  },
  { 
    id: 'alphaBinaural', 
    nameKey: 'soundscapes.alphaBinaural', 
    type: 'binaural', 
    params: { 
      baseFrequency: 100, 
      beatFrequency: 8, 
      volumeAdjustment: -15,
    } 
  },
  {
    id: 'ambientPad',
    nameKey: 'soundscapes.ambientPad',
    type: 'tone', 
    params: {
      notes: ['C3', 'E3', 'G3', 'B4'],
      oscillator: { type: 'fatsine' as const }, 
      envelope: { attack: 2, decay: 1, sustain: 0.9, release: 4 },
      volumeAdjustment: -20,
    }
  },
  {
    id: 'calmingChimes',
    nameKey: 'soundscapes.calmingChimes',
    type: 'tone', 
    params: {
      notes: ['C6', 'E6', 'G6', 'A6'], 
      oscillator: { type: 'triangle' as const }, 
      envelope: { attack: 0.01, decay: 1.5, sustain: 0.05, release: 2 },
      volumeAdjustment: -18,
    }
  },
  {
    id: 'gentlePianoChord', 
    nameKey: 'soundscapes.gentlePianoChord',
    type: 'tone', 
    params: {
      notes: ['C4', 'G4', 'E5'], 
      oscillator: { type: 'triangle' as const }, 
      envelope: { attack: 0.02, decay: 1, sustain: 0.3, release: 1.5 },
      volumeAdjustment: -16,
    }
  },
  {
    id: 'simplePianoMelodySynth', 
    nameKey: 'soundscapes.simplePianoMelodySynth',
    type: 'patternLoop',
    params: {
      bpm: 70,
      volumeAdjustment: -18,
      instruments: [
        {
          name: 'pianoMelody',
          synthType: 'Synth', 
          synthOptions: { oscillator: { type: 'triangle8' as const }, envelope: { attack: 0.01, decay: 0.6, sustain: 0.1, release: 1 } },
          sequence: [ 
            { time: '0:0', notes: 'C4', duration: '4n' }, { time: '0:1', notes: 'E4', duration: '4n' },
            { time: '0:2', notes: 'G4', duration: '4n' }, { time: '0:3', notes: 'C5', duration: '4n' },
            { time: '1:0', notes: 'B4', duration: '2n' }, { time: '1:2', notes: 'G4', duration: '2n.' }, 
            { time: '2:0', notes: 'A4', duration: '4n' }, { time: '2:1', notes: 'F4', duration: '4n' },
            { time: '2:2', notes: 'D4', duration: '4n' }, { time: '2:3', notes: 'G4', duration: '4n' },
            { time: '3:0', notes: 'C4', duration: '1m' } 
          ],
        }
      ]
    }
  },
  {
    id: 'classicalExcerptSynth', 
    nameKey: 'soundscapes.classicalExcerptSynth',
    type: 'patternLoop',
    params: {
      bpm: 70,
      volumeAdjustment: -12,
      instruments: [
        {
          name: 'stringsPad',
          synthType: 'PolySynth',
          synthOptions: {
            oscillator: { type: 'fatsawtooth' as const, count: 3, spread: 30 }, 
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
  },
  {
    id: 'dreamyLullabySynth', 
    nameKey: 'soundscapes.dreamyLullabySynth',
    type: 'patternLoop',
    params: {
      bpm: 60, 
      volumeAdjustment: -22, 
      instruments: [
        {
          name: 'melody',
          synthType: 'Synth', 
          synthOptions: {
            oscillator: { type: 'triangle' as const }, 
            envelope: { attack: 0.1, decay: 0.5, sustain: 0.3, release: 1 },
          },
          sequence: [ 
            { time: '0:0:0', notes: 'C5', duration: '2n' },
            { time: '0:2:0', notes: 'D5', duration: '2n' },
            { time: '1:0:0', notes: 'E5', duration: '1m' },
            { time: '2:0:0', notes: 'G5', duration: '2n' },
            { time: '2:2:0', notes: 'A5', duration: '2n' },
            { time: '3:0:0', notes: 'G5', duration: '1m' },
            { time: '4:0:0', notes: 'E5', duration: '2n' },
            { time: '4:2:0', notes: 'D5', duration: '2n' },
            { time: '5:0:0', notes: 'C5', duration: '1m' },
          ],
        },
        {
          name: 'pad',
          synthType: 'PolySynth',
          synthOptions: {
            oscillator: { type: 'fatsine' as const, count: 3, spread: 40 }, 
            envelope: { attack: 2, decay: 1, sustain: 1, release: 3 }, 
            volume: -6 
          },
          sequence: [ 
            { time: '0:0:0', notes: ['C3', 'G3', 'E4'], duration: '1m' },
            { time: '2:0:0', notes: ['F3', 'C4', 'A4'], duration: '1m' },
            { time: '4:0:0', notes: ['G3', 'D4', 'B4'], duration: '1m' },
          ]
        }
      ],
      effects: {
        reverb: { wet: 0.4, decay: 4 } 
      }
    }
  },
];

export const BACKGROUND_ANIMATION_OPTIONS: BackgroundAnimationOption[] = [
  { id: 'none', nameKey: 'backgroundAnimations.none' },
  { id: 'gradientFlow', nameKey: 'backgroundAnimations.gradientFlow' },
  { id: 'rain', nameKey: 'backgroundAnimations.rain' },
  { id: 'snow', nameKey: 'backgroundAnimations.snow' },
  { id: 'starfield', nameKey: 'backgroundAnimations.starfield' },
  { id: 'bubbles', nameKey: 'backgroundAnimations.bubbles' },
  { id: 'fireflies', nameKey: 'backgroundAnimations.fireflies' },
];

export const SESSION_TYPE_OPTIONS: { id: SessionType; nameKey: string }[] = [
  { id: 'general', nameKey: 'sessionTypes.general' },
  { id: 'work', nameKey: 'sessionTypes.work' },
  { id: 'learning', nameKey: 'sessionTypes.learning' },
];

export const APP_NAME = "RS";

    