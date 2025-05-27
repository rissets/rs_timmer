import type { Settings, SoundscapeOption } from '@/lib/types';

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
};

export const SOUNDSCAPE_OPTIONS: SoundscapeOption[] = [
  { id: 'none', name: 'None', type: 'noise', params: { type: 'off' } },
  { id: 'whiteNoise', name: 'White Noise', type: 'noise', params: { type: 'white' } },
  { id: 'pinkNoise', name: 'Pink Noise', type: 'noise', params: { type: 'pink' } },
  { id: 'brownNoise', name: 'Brown Noise', type: 'noise', params: { type: 'brown' } },
  { id: 'gentleRain', name: 'Gentle Rain (placeholder)', type: 'noise', params: { type: 'pink', playbackRate: 0.5, volume: -12 } }, // Example of custom params
  { id: 'focusTone', name: 'Focus Tone (440Hz)', type: 'tone', params: { frequency: 440, type: 'sine' } },
];

export const APP_NAME = "Zenith Timer";
