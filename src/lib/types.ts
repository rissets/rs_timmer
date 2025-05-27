
export type TimerMode = 'work' | 'shortBreak' | 'longBreak';
export type BackgroundAnimationType = 'none' | 'gradientFlow' | 'rain' | 'snow' | 'starfield' | 'bubbles' | 'fireflies';
export type SessionType = 'general' | 'work' | 'learning';

export interface Settings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundscapeWork?: string;
  soundscapeBreak?: string;
  volume: number;
  notificationsEnabled: boolean;
  backgroundAnimation: BackgroundAnimationType;
  mouseTrailEffectEnabled: boolean;
  showCoachMarks: boolean;
  // customSoundscapeUrls: Record<string, string>; // Removed, will be handled by IndexedDB/Firebase Storage
}

export interface SessionRecord {
  id: string;
  startTime: number;
  endTime: number;
  mode: TimerMode;
  durationMinutes: number;
  completed: boolean;
}

export interface SoundscapeOption {
  id: string;
  nameKey: string;
  type: 'noise' | 'tone' | 'binaural' | 'patternLoop' | 'ocean' | 'fireplace' | 'userUploaded';
  params?: {
    type?: 'white' | 'pink' | 'brown' | 'off' | Tone.ToneOscillatorType;
    frequency?: number;
    notes?: string[];
    oscillator?: Tone.ToneOscillatorType | Partial<Tone.OscillatorOptions>;
    envelope?: Partial<Tone.EnvelopeOptions>;
    baseFrequency?: number;
    beatFrequency?: number;
    volumeAdjustment?: number;
    autoFilter?: any;
    synthOptions?: any;
    bpm?: number;
    instruments?: any[];
    effects?: any;
    sequence?: any[];
    subdivision?: string;
    duration?: string;
    loopEnd?: string;
    indexedDbId?: number;
    mimeType?: string;
    // audioSrc?: string; // Removed, direct URL input is replaced by uploads
  };
}


export interface AiSessionSummary {
  summary: string;
  improvements: string;
}

export interface BackgroundAnimationOption {
  id: BackgroundAnimationType;
  nameKey: string;
}


export interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export interface SummarizeSessionInput {
  sessionDetails: string;
  sessionType?: SessionType;
}

export interface ChatMessage {
  id:string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface DefinedWordEntry {
  id: string; // Using string for ID for flexibility, can be Date.now().toString()
  word: string;
  englishDefinition: string;
  indonesianDefinition: string;
}

// For IndexedDB storage of user soundscapes
export interface UserSoundscapeRecord {
  id?: number; // Auto-incremented by IndexedDB
  name: string;
  mimeType: string;
  data: ArrayBuffer;
}

// For displaying in settings (without full data)
export interface UserSoundscapeListItem {
    id: number;
    name: string;
}
