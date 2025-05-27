
import type { Settings, SoundscapeOption, BackgroundAnimationOption, SessionType } from '@/lib/types';

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
  showCoachMarks: true, // Default to true for first-time users, can be turned off
};

export const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  { id: 'none', name: 'None', type: 'noise', params: { type: 'off' } },
  { id: 'whiteNoise', name: 'White Noise', type: 'noise', params: { type: 'white', volume: -6 } },
  { id: 'pinkNoise', name: 'Pink Noise', type: 'noise', params: { type: 'pink', volume: -6 } },
  { id: 'brownNoise', name: 'Brown Noise', type: 'noise', params: { type: 'brown', volume: -6 } },
  { id: 'gentleRain', name: 'Gentle Rain (Simulated)', type: 'noise', params: { type: 'pink', volume: -18 } }, // Simulating rain with heavily filtered pink noise
  { id: 'focusTone', name: 'Focus Tone (440Hz Sine)', type: 'tone', params: { frequency: 440, type: 'sine' } },
  { id: 'deepDrone', name: 'Deep Drone (80Hz Sine)', type: 'tone', params: { frequency: 80, type: 'sine', volume: -10 } },
  { id: 'windyAmbience', name: 'Windy Ambience', type: 'noise', params: { type: 'pink', volume: -20 } }, // Using pink noise with low volume for wind
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
  {
    id: 'lofiBeat',
    name: 'Lofi Beat (Synth)',
    type: 'patternLoop',
    params: {
      bpm: 85,
      volumeAdjustment: -18, // Overall gain adjustment for this pattern in dB
      instruments: [
        { 
          name: 'chords', 
          synthType: 'PolySynth', 
          synthOptions: { oscillator: { type: 'fmsquare' }, envelope: { attack: 0.2, decay: 0.5, sustain: 0.3, release: 1 } },
          sequence: [ { time: '0:0', notes: ['A#2', 'D3', 'F3', 'G#3'], duration: '1m' }, { time: '1:0', notes: ['G2', 'C3', 'D#3', 'F3'], duration: '1m' } ], // Am7, Gm7 vibe
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
          synthOptions: { noise: { type: 'white' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }, volume: -10 }, // hihats quieter
          pattern: ['C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3', 'C3'],
          subdivision: '8n',
        }
      ],
    }
  },
  {
    id: 'classicalExcerpt',
    name: 'Classical Snippet (Synth)',
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
            { time: '0:0', notes: ['C3', 'E3', 'G3'], duration: '2m' },    // C Major
            { time: '2:0', notes: ['A2', 'C3', 'E3'], duration: '2m' },    // A minor
            { time: '4:0', notes: ['F2', 'A2', 'C3'], duration: '2m' },    // F Major
            { time: '6:0', notes: ['G2', 'B2', 'D3'], duration: '2m' },    // G Major
          ]
        }
      ],
      effects: {
        reverb: { wet: 0.3, decay: 5 }
      }
    }
  }
];

export const BACKGROUND_ANIMATION_OPTIONS: BackgroundAnimationOption[] = [
  { id: 'none', name: 'None' },
  { id: 'gradientFlow', name: 'Gradient Flow' },
  { id: 'rain', name: 'Rain Effect' },
  { id: 'snow', name: 'Snow Effect' },
  { id: 'starfield', name: 'Starfield Effect' },
  { id: 'bubbles', name: 'Floating Bubbles Effect' },
];

export const SESSION_TYPE_OPTIONS: { id: SessionType; name: string }[] = [
  { id: 'general', name: 'General Reflection' },
  { id: 'work', name: 'Work Focus' },
  { id: 'learning', name: 'Learning Focus' },
];

export const APP_NAME = "Zenith Timer";

