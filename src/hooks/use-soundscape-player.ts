
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import type { SoundscapeOption, Settings } from '@/lib/types';
import { SOUNDSCAPE_OPTIONS, DEFAULT_SETTINGS } from '@/lib/constants';

interface UseSoundscapePlayerProps {
  volume: number; // 0-1
  settings: Settings;
  isSettingsLoaded: boolean; // Added this prop
}

interface ActivePatternElements {
  synths: (Tone.Synth<any> | Tone.NoiseSynth | Tone.MembraneSynth | Tone.PluckSynth | Tone.PolySynth<any> | Tone.MetalSynth)[];
  sequences: Tone.Sequence[];
  parts: Tone.Part[];
  loops: Tone.Loop[];
  effects: (Tone.Reverb | Tone.Volume | Tone.AutoFilter | Tone.Panner | Tone.FeedbackDelay | Tone.Chorus | Tone.Filter | Tone.LFO)[];
  masterVolumeNode?: Tone.Volume;
  noiseSource?: Tone.Noise;
  autoFilter?: Tone.AutoFilter;
  lfo?: Tone.LFO; // For ocean effect if we re-add it
}

interface SoundscapePlayer {
  playSound: (soundscapeId?: string) => Promise<void>;
  stopSound: () => void;
  isReady: boolean;
  isPlaying: boolean;
}

export function useSoundscapePlayer({
  volume,
  settings: propSettings, // Renamed to avoid conflict with internal state
  isSettingsLoaded,      // Destructure new prop
}: UseSoundscapePlayerProps): SoundscapePlayer {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Use DEFAULT_SETTINGS as a fallback if propSettings is not ready
  const settings = isSettingsLoaded && propSettings ? propSettings : DEFAULT_SETTINGS;

  const generalNoisePlayer = useRef<Tone.Noise | null>(null);
  const tonePlayer = useRef<Tone.Synth | null>(null);
  const polySynthPlayer = useRef<Tone.PolySynth | null>(null);
  const tonePlayerLeft = useRef<Tone.Synth | null>(null);
  const tonePlayerRight = useRef<Tone.Synth | null>(null);

  const htmlAudioPlayer = useRef<HTMLAudioElement | null>(null);

  const activePatternElements = useRef<ActivePatternElements>({
    synths: [],
    sequences: [],
    parts: [],
    loops: [],
    effects: [],
    noiseSource: undefined,
    masterVolumeNode: undefined,
    autoFilter: undefined,
  });
  const activePlayerType = useRef<'noise' | 'tone' | 'polysynth' | 'binaural' | 'patternLoop' | 'ocean' | 'fireplace' | 'url' | null>(null);
  const lastPlayedSoundscapeIdRef = useRef<string | undefined>(undefined);

  const scheduleDelay = 0.05; // 50ms, used for scheduling Tone.js events

  const cleanupSimpleSynths = useCallback(() => {
    if (tonePlayer.current && !tonePlayer.current.disposed) {
      tonePlayer.current.triggerRelease(Tone.now());
      tonePlayer.current.dispose();
      tonePlayer.current = null;
    }
    if (polySynthPlayer.current && !polySynthPlayer.current.disposed) {
      polySynthPlayer.current.releaseAll(Tone.now());
      polySynthPlayer.current.dispose();
      polySynthPlayer.current = null;
    }
    if (tonePlayerLeft.current && !tonePlayerLeft.current.disposed) {
      tonePlayerLeft.current.triggerRelease(Tone.now());
      tonePlayerLeft.current.dispose();
      tonePlayerLeft.current = null;
    }
    if (tonePlayerRight.current && !tonePlayerRight.current.disposed) {
      tonePlayerRight.current.triggerRelease(Tone.now());
      tonePlayerRight.current.dispose();
      tonePlayerRight.current = null;
    }
    if (generalNoisePlayer.current && !generalNoisePlayer.current.disposed) {
      generalNoisePlayer.current.stop(Tone.now());
      generalNoisePlayer.current.dispose();
      generalNoisePlayer.current = null;
    }
  }, []);

  const cleanupPattern = useCallback(() => {
    Tone.Transport.stop();

    activePatternElements.current.loops.forEach(loop => {
      if (loop && !loop.disposed) {
        loop.stop(0);
        loop.dispose();
      }
    });
    activePatternElements.current.parts.forEach(part => {
      if (part && !part.disposed) {
        part.stop(0);
        part.clear();
        part.dispose();
      }
    });
    activePatternElements.current.sequences.forEach(seq => {
      if (seq && !seq.disposed) {
        seq.stop(0);
        seq.clear();
        seq.dispose();
      }
    });

    activePatternElements.current.synths.forEach(synth => {
      if (synth && !synth.disposed) {
        if (typeof (synth as any).releaseAll === 'function') {
          (synth as any).releaseAll(Tone.now());
        } else if (typeof (synth as any).triggerRelease === 'function') {
          (synth as any).triggerRelease(Tone.now());
        } else if (typeof (synth as any).stop === 'function') {
           (synth as any).stop(Tone.now());
        }
        synth.dispose();
      }
    });

    if (activePatternElements.current.noiseSource && !activePatternElements.current.noiseSource.disposed) {
      activePatternElements.current.noiseSource.stop(Tone.now());
      activePatternElements.current.noiseSource.dispose();
      activePatternElements.current.noiseSource = undefined;
    }
    if (activePatternElements.current.autoFilter && !activePatternElements.current.autoFilter.disposed) {
      // AutoFilter might not have a stop method if it's just a filter node
      // It will be disposed with effects
      activePatternElements.current.autoFilter.dispose();
      activePatternElements.current.autoFilter = undefined;
    }
    if (activePatternElements.current.lfo && !activePatternElements.current.lfo.disposed) {
        activePatternElements.current.lfo.stop(Tone.now());
        activePatternElements.current.lfo.dispose();
        activePatternElements.current.lfo = undefined;
    }

    activePatternElements.current.effects.forEach(effect => {
      if (effect && !effect.disposed && typeof effect.dispose === 'function') {
        effect.dispose();
      }
    });

    if (activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
      activePatternElements.current.masterVolumeNode.dispose();
      activePatternElements.current.masterVolumeNode = undefined;
    }

    Tone.Transport.cancel(0);
    activePatternElements.current = { synths: [], sequences: [], parts: [], loops: [], effects: [] };
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      htmlAudioPlayer.current = new Audio();
      htmlAudioPlayer.current.loop = true;

      if (Tone.context.state !== 'running') {
        // Defer Tone.start()
      } else {
        setIsReady(true);
      }
    }

    return () => {
      cleanupSimpleSynths();
      cleanupPattern();

      if (htmlAudioPlayer.current) {
        htmlAudioPlayer.current.pause();
        htmlAudioPlayer.current.src = "";
        htmlAudioPlayer.current = null;
      }

      activePlayerType.current = null;
      lastPlayedSoundscapeIdRef.current = undefined;
    };
  }, [cleanupSimpleSynths, cleanupPattern]);

  const stopSound = useCallback(() => {
    cleanupSimpleSynths();
    if (['patternLoop', 'ocean', 'fireplace'].includes(activePlayerType.current || '')) {
      cleanupPattern();
    }

    if (htmlAudioPlayer.current && activePlayerType.current === 'url') {
      htmlAudioPlayer.current.pause();
      htmlAudioPlayer.current.currentTime = 0;
      htmlAudioPlayer.current.src = "";
    }

    setIsPlaying(false);
  }, [cleanupSimpleSynths, cleanupPattern]);

  const playSound = useCallback(async (soundscapeId?: string) => {
    if (!isSettingsLoaded || !settings) { // Guard against settings not being loaded
      console.warn("playSound called before settings are loaded.");
      return;
    }
    if (!isReady && soundscapeId && soundscapeId !== 'none') {
      try {
        await Tone.start();
        setIsReady(true);
      } catch (e) {
        console.error("Failed to start Tone.js in playSound:", e);
        return;
      }
    }

    stopSound();

    if (!soundscapeId || soundscapeId === 'none') {
      activePlayerType.current = null;
      lastPlayedSoundscapeIdRef.current = undefined;
      return;
    }

    const selectedSoundscape = SOUNDSCAPE_OPTIONS.find(s => s.id === soundscapeId) as SoundscapeOption | undefined;
    if (!selectedSoundscape) {
      activePlayerType.current = null;
      lastPlayedSoundscapeIdRef.current = undefined;
      return;
    }

    lastPlayedSoundscapeIdRef.current = soundscapeId;
    activePlayerType.current = selectedSoundscape.type as any;

    const baseGainValue = Tone.gainToDb(volume * 0.5);
    const htmlVolumeValue = volume * 0.5;
    const soundscapeVolumeAdjustment = selectedSoundscape.params?.volumeAdjustment || 0;
    const finalGainValue = baseGainValue + soundscapeVolumeAdjustment;
    const finalHtmlVolume = Math.max(0, Math.min(1, htmlVolumeValue + (soundscapeVolumeAdjustment / 20)));

    const transportSensitiveTypes = ['patternLoop', 'ocean', 'fireplace'];
    if (transportSensitiveTypes.includes(selectedSoundscape.type)) {
      if (!activePatternElements.current.masterVolumeNode || activePatternElements.current.masterVolumeNode.disposed) {
        const newMasterVol = new Tone.Volume(finalGainValue).toDestination();
        activePatternElements.current.masterVolumeNode = newMasterVol;
        activePatternElements.current.effects.push(newMasterVol);
      } else {
        activePatternElements.current.masterVolumeNode.volume.linearRampTo(finalGainValue, 0.1);
      }
      if (Tone.Transport.state !== "started") {
        Tone.Transport.start(Tone.now() + scheduleDelay);
      }
    }

    switch (selectedSoundscape.type) {
      case 'url':
        if (htmlAudioPlayer.current) {
          const customUrl = settings.customSoundscapeUrls?.[soundscapeId];
          const audioSrcToPlay = customUrl || selectedSoundscape.params?.audioSrc;

          if (audioSrcToPlay) {
            try {
              htmlAudioPlayer.current.src = audioSrcToPlay;
              htmlAudioPlayer.current.volume = finalHtmlVolume;
              await htmlAudioPlayer.current.play();
              setIsPlaying(true);
            } catch (error) {
              console.error("Error playing URL audio:", audioSrcToPlay, error);
              setIsPlaying(false);
            }
          } else {
            console.warn("No audio source for URL soundscape:", soundscapeId);
            setIsPlaying(false);
          }
        }
        break;
      case 'noise':
        if (selectedSoundscape.params?.type !== 'off') {
          generalNoisePlayer.current = new Tone.Noise(selectedSoundscape.params?.type as Tone.NoiseType).toDestination();
          generalNoisePlayer.current.volume.value = finalGainValue;
          generalNoisePlayer.current.start(Tone.now() + scheduleDelay);
          setIsPlaying(true);
        }
        break;
      case 'tone':
        const { notes, frequency, type: oscType = 'sine', envelope: envParam } = selectedSoundscape.params || {};
        let synthOptions: Partial<Tone.SynthOptions> = { oscillator: { type: oscType as Tone.ToneOscillatorType } };
        if (envParam && typeof envParam === 'object') {
          synthOptions.envelope = envParam as Tone.EnvelopeOptions;
        }

        if (notes && Array.isArray(notes)) {
          activePlayerType.current = 'polysynth';
          polySynthPlayer.current = new Tone.PolySynth(Tone.Synth, synthOptions).toDestination();
          polySynthPlayer.current.volume.value = finalGainValue;
          polySynthPlayer.current.triggerAttack(notes, Tone.now() + scheduleDelay);
        } else {
          activePlayerType.current = 'tone';
          tonePlayer.current = new Tone.Synth(synthOptions).toDestination();
          tonePlayer.current.volume.value = finalGainValue;
          tonePlayer.current.triggerAttack(frequency || 440, Tone.now() + scheduleDelay);
        }
        setIsPlaying(true);
        break;
      case 'binaural':
        const { baseFrequency = 100, beatFrequency = 8 } = selectedSoundscape.params || {};
        const freqLeft = baseFrequency - beatFrequency / 2;
        const freqRight = baseFrequency + beatFrequency / 2;
        const binauralSynthOptions: Partial<Tone.SynthOptions> = { oscillator: { type: 'sine' as Tone.ToneOscillatorType }, envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 0.5 }};

        let pannerL = activePatternElements.current.effects.find(e => e instanceof Tone.Panner && Math.abs((e as Tone.Panner).pan.value + 1) < 0.01) as Tone.Panner | undefined;
        if (!pannerL || pannerL.disposed) {
            pannerL = new Tone.Panner(-1).toDestination();
            activePatternElements.current.effects.push(pannerL);
        }
        let pannerR = activePatternElements.current.effects.find(e => e instanceof Tone.Panner && Math.abs((e as Tone.Panner).pan.value - 1) < 0.01) as Tone.Panner | undefined;
        if (!pannerR || pannerR.disposed) {
            pannerR = new Tone.Panner(1).toDestination();
            activePatternElements.current.effects.push(pannerR);
        }

        tonePlayerLeft.current = new Tone.Synth(binauralSynthOptions);
        if(tonePlayerLeft.current && pannerL && !pannerL.disposed) {
            tonePlayerLeft.current.disconnect().connect(pannerL);
            tonePlayerLeft.current.volume.value = finalGainValue;
            tonePlayerLeft.current.triggerAttack(freqLeft, Tone.now() + scheduleDelay);
        }

        tonePlayerRight.current = new Tone.Synth(binauralSynthOptions);
        if(tonePlayerRight.current && pannerR && !pannerR.disposed) {
            tonePlayerRight.current.disconnect().connect(pannerR);
            tonePlayerRight.current.volume.value = finalGainValue;
            tonePlayerRight.current.triggerAttack(freqRight, Tone.now() + scheduleDelay);
        }
        setIsPlaying(true);
        break;
      case 'ocean':
        try {
            if (!activePatternElements.current.masterVolumeNode || activePatternElements.current.masterVolumeNode.disposed) {
                console.error("Master volume node not available for ocean soundscape.");
                cleanupPattern();
                setIsPlaying(false);
                return;
            }

            const oceanNoise = new Tone.Noise("brown");
            activePatternElements.current.noiseSource = oceanNoise; // Store for cleanup

            const autoFilterParams = selectedSoundscape.params?.autoFilter;
            const autoFilter = new Tone.AutoFilter({
                ...(autoFilterParams || {}),
                frequency: autoFilterParams?.frequency || "2m",
                baseFrequency: autoFilterParams?.baseFrequency || 200,
                octaves: autoFilterParams?.octaves || 4,
                filter: autoFilterParams?.filter || { type: "lowpass" as const, rolloff: -12 as const, Q: 1.5 }
            }).connect(activePatternElements.current.masterVolumeNode);
            activePatternElements.current.autoFilter = autoFilter;
            activePatternElements.current.effects.push(autoFilter);

            oceanNoise.connect(autoFilter);
            
            Tone.Transport.scheduleOnce((transportTime) => {
                if (autoFilter && !autoFilter.disposed) autoFilter.start(transportTime);
                if (oceanNoise && !oceanNoise.disposed) oceanNoise.start(transportTime);
            }, scheduleDelay);

            setIsPlaying(true);
        } catch (e) {
            console.error("Error setting up ocean soundscape:", e);
            cleanupPattern();
            setIsPlaying(false);
        }
        break;
      case 'fireplace':
        const fireSynthOptions = selectedSoundscape.params?.synthOptions || {
            noise: { type: 'pink' as const },
            envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.02 }
        };
        const fireNoiseSynth = new Tone.NoiseSynth(fireSynthOptions);
        if (activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
            fireNoiseSynth.connect(activePatternElements.current.masterVolumeNode);
        } else {
            fireNoiseSynth.toDestination();
        }
        activePatternElements.current.synths.push(fireNoiseSynth);

        const crackleLoop = new Tone.Loop(transportTime => {
            if (fireNoiseSynth && !fireNoiseSynth.disposed) {
                fireNoiseSynth.volume.value = finalGainValue - (Math.random() * 6);
                const randomOffset = 0.001 + (Math.random() * 0.049);
                fireNoiseSynth.triggerAttackRelease("32n", transportTime + randomOffset);
            }
        }, "16n").start(scheduleDelay);
        crackleLoop.probability = 0.6;
        activePatternElements.current.loops.push(crackleLoop);

        setIsPlaying(true);
        break;
      case 'patternLoop':
        const { bpm, instruments, effects: patternEffectsParams } = selectedSoundscape.params || {};

        if (!activePatternElements.current.masterVolumeNode || activePatternElements.current.masterVolumeNode.disposed) {
            const fallbackMasterVol = new Tone.Volume(finalGainValue).toDestination();
            activePatternElements.current.effects.push(fallbackMasterVol);
            activePatternElements.current.masterVolumeNode = fallbackMasterVol;
        }

        Tone.Transport.bpm.value = bpm || 120;

        (instruments || []).forEach((instrumentDef: any) => {
          let synth: any;
          const synthOptionsResolved = {...instrumentDef.synthOptions};

          if (!synthOptionsResolved.envelope && (instrumentDef.synthType === 'Synth' || instrumentDef.synthType === 'PolySynth')) {
            synthOptionsResolved.envelope = { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.4 };
          }

          switch(instrumentDef.synthType) {
            case 'MembraneSynth': synth = new Tone.MembraneSynth(synthOptionsResolved); break;
            case 'NoiseSynth': synth = new Tone.NoiseSynth(synthOptionsResolved); break;
            case 'PluckSynth': synth = new Tone.PluckSynth(synthOptionsResolved); break;
            case 'PolySynth': default: synth = new Tone.PolySynth(Tone.Synth, synthOptionsResolved); break;
            case 'Synth': synth = new Tone.Synth(synthOptionsResolved); break;
          }

          if(activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
            synth.connect(activePatternElements.current.masterVolumeNode);
          } else {
            synth.toDestination();
          }
          activePatternElements.current.synths.push(synth);

          const patternScheduleTime = scheduleDelay; // Schedule relative to transport start

          if (instrumentDef.pattern && instrumentDef.subdivision) {
            const seq = new Tone.Sequence((transportTime, note) => {
              if (note && synth && !synth.disposed && typeof synth.triggerAttackRelease === 'function') {
                 synth.triggerAttackRelease(note, instrumentDef.duration || '8n', transportTime);
              } else if (note && synth && !synth.disposed && typeof synth.triggerAttack === 'function') { // For PolySynth with array of notes
                 synth.triggerAttack(note, transportTime);
              }
            }, instrumentDef.pattern, instrumentDef.subdivision).start(patternScheduleTime);
            activePatternElements.current.sequences.push(seq);
          } else if (instrumentDef.sequence) {
            const part = new Tone.Part((transportTime, value) => {
              if(synth && !synth.disposed && value.notes && typeof synth.triggerAttackRelease === 'function') synth.triggerAttackRelease(value.notes, value.duration, transportTime);
            }, instrumentDef.sequence).start(patternScheduleTime);
            part.loop = true;
            if (instrumentDef.loopEnd) part.loopEnd = instrumentDef.loopEnd;
            activePatternElements.current.parts.push(part);
          }
        });

        if (patternEffectsParams?.reverb && activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
           const reverb = new Tone.Reverb(patternEffectsParams.reverb).toDestination();
           if(activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
             activePatternElements.current.masterVolumeNode.disconnect(Tone.Destination);
             activePatternElements.current.masterVolumeNode.connect(reverb);
           }
           activePatternElements.current.effects.push(reverb);
        }

        setIsPlaying(true);
        break;
      default:
        activePlayerType.current = null;
        lastPlayedSoundscapeIdRef.current = undefined;
        setIsPlaying(false);
    }

  }, [isReady, volume, stopSound, cleanupPattern, cleanupSimpleSynths, settings, isSettingsLoaded]); // Added isSettingsLoaded

  useEffect(() => {
    if (!isSettingsLoaded || !settings) return; // Guard

    if (isPlaying && lastPlayedSoundscapeIdRef.current && isReady) {
      const currentSoundscapeId = lastPlayedSoundscapeIdRef.current;
      const selectedSound = SOUNDSCAPE_OPTIONS.find(s => s.id === currentSoundscapeId) as SoundscapeOption | undefined;

      if (!selectedSound) return;

      const soundscapeVolAdj = selectedSound.params?.volumeAdjustment || 0;
      const activeType = activePlayerType.current;

      if (activeType === 'url' && htmlAudioPlayer.current) {
        const htmlVol = volume * 0.5;
        htmlAudioPlayer.current.volume = Math.max(0, Math.min(1, htmlVol + (soundscapeVolAdj / 20)));
      } else {
        const baseGain = Tone.gainToDb(volume * 0.5);
        const finalGain = baseGain + soundscapeVolAdj;

        if (activeType === 'noise' && generalNoisePlayer.current && !generalNoisePlayer.current.disposed) {
          generalNoisePlayer.current.volume.linearRampTo(finalGain, 0.1);
        } else if (activeType === 'tone' && tonePlayer.current && !tonePlayer.current.disposed) {
          tonePlayer.current.volume.linearRampTo(finalGain, 0.1);
        } else if (activeType === 'polysynth' && polySynthPlayer.current && !polySynthPlayer.current.disposed) {
          polySynthPlayer.current.volume.linearRampTo(finalGain, 0.1);
        } else if (activeType === 'binaural') {
          if (tonePlayerLeft.current && !tonePlayerLeft.current.disposed) tonePlayerLeft.current.volume.linearRampTo(finalGain, 0.1);
          if (tonePlayerRight.current && !tonePlayerRight.current.disposed) tonePlayerRight.current.volume.linearRampTo(finalGain, 0.1);
        } else if (['patternLoop', 'ocean', 'fireplace'].includes(activeType || '') && activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
          activePatternElements.current.masterVolumeNode.volume.linearRampTo(finalGain, 0.1);
        }
      }
    }
  }, [volume, isPlaying, isReady, settings, isSettingsLoaded]); // Added isSettingsLoaded

  return { playSound, stopSound, isReady, isPlaying };
}
