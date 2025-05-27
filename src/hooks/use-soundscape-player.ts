
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import type { SoundscapeOption, Settings } from '@/lib/types';
import { SOUNDSCAPE_OPTIONS, DEFAULT_SETTINGS } from '@/lib/constants';
import { getSoundscape as getSoundscapeFromDB } from '@/lib/audio-storage'; // For fetching uploaded sounds

interface UseSoundscapePlayerProps {
  volume: number;
  settings: Settings;
  isSettingsLoaded: boolean;
}

interface ActivePatternElements {
  synths: (Tone.Synth<any> | Tone.NoiseSynth | Tone.MembraneSynth | Tone.PluckSynth | Tone.PolySynth<any> | Tone.MetalSynth)[];
  sequences: Tone.Sequence[];
  parts: Tone.Part[];
  loops: Tone.Loop[];
  effects: (Tone.Reverb | Tone.Volume | Tone.AutoFilter | Tone.Panner | Tone.FeedbackDelay | Tone.Chorus | Tone.Filter | Tone.LFO)[];
  masterVolumeNode?: Tone.Volume;
  noiseSource?: Tone.Noise; // For ocean
  autoFilter?: Tone.AutoFilter; // For ocean
}

interface SoundscapePlayer {
  playSound: (soundscapeId?: string) => Promise<void>;
  stopSound: () => void;
  isReady: boolean;
  isPlaying: boolean;
}

const scheduleDelay = 0.05; // 50ms delay for scheduling transport-based events

export function useSoundscapePlayer({
  volume,
  settings: propSettings,
  isSettingsLoaded,
}: UseSoundscapePlayerProps): SoundscapePlayer {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const settings = isSettingsLoaded && propSettings ? propSettings : DEFAULT_SETTINGS;

  // Refs for Tone.js synths
  const tonePlayer = useRef<Tone.Synth | null>(null);
  const polySynthPlayer = useRef<Tone.PolySynth | null>(null);
  const tonePlayerLeft = useRef<Tone.Synth | null>(null);
  const tonePlayerRight = useRef<Tone.Synth | null>(null);
  const generalNoisePlayer = useRef<Tone.Noise | null>(null);
  
  // For HTML5 Audio (used for user-uploaded files)
  const htmlAudioPlayer = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrl = useRef<string | null>(null); // To store and revoke object URLs

  const activePatternElements = useRef<ActivePatternElements>({
    synths: [],
    sequences: [],
    parts: [],
    loops: [],
    effects: [],
  });
  const activePlayerType = useRef<SoundscapeOption['type'] | null>(null);
  const lastPlayedSoundscapeIdRef = useRef<string | undefined>(undefined);

  const cleanupDisposedSynths = useCallback(() => {
    const disposeSynth = (synthRef: React.MutableRefObject<any>) => {
        if (synthRef.current && !synthRef.current.disposed) {
            if (typeof synthRef.current.releaseAll === 'function') synthRef.current.releaseAll(Tone.now());
            else if (typeof synthRef.current.triggerRelease === 'function') synthRef.current.triggerRelease(Tone.now());
            else if (typeof synthRef.current.stop === 'function') synthRef.current.stop(Tone.now());
            synthRef.current.dispose();
        }
        synthRef.current = null;
    };
    
    disposeSynth(tonePlayer);
    disposeSynth(polySynthPlayer);
    disposeSynth(tonePlayerLeft);
    disposeSynth(tonePlayerRight);
    disposeSynth(generalNoisePlayer);
  }, []);

  const cleanupPattern = useCallback(() => {
    Tone.Transport.stop(); // Stop transport first

    activePatternElements.current.loops.forEach(loop => {
      if (loop && !loop.disposed) {
        loop.stop(0); // Stop loop immediately on transport timeline
        loop.dispose();
      }
    });
    activePatternElements.current.parts.forEach(part => {
      if (part && !part.disposed) {
        part.stop(0); // Stop part immediately
        part.clear();
        part.dispose();
      }
    });
    activePatternElements.current.sequences.forEach(seq => {
      if (seq && !seq.disposed) {
        seq.stop(0); // Stop sequence immediately
        seq.clear();
        seq.dispose();
      }
    });

    activePatternElements.current.synths.forEach(synth => {
      if (synth && !synth.disposed) {
        if (typeof (synth as any).releaseAll === 'function') (synth as any).releaseAll(Tone.now());
        else if (typeof (synth as any).triggerRelease === 'function') (synth as any).triggerRelease(Tone.now());
        else if (typeof (synth as any).stop === 'function') (synth as any).stop(Tone.now());
        synth.dispose();
      }
    });
    
    if (activePatternElements.current.noiseSource && !activePatternElements.current.noiseSource.disposed) {
        activePatternElements.current.noiseSource.stop(Tone.now());
        activePatternElements.current.noiseSource.dispose();
    }
    activePatternElements.current.noiseSource = undefined;

    if (activePatternElements.current.autoFilter && !activePatternElements.current.autoFilter.disposed) {
        activePatternElements.current.autoFilter.stop?.(Tone.now()); // Stop if it has a start/stop method
        activePatternElements.current.autoFilter.dispose();
    }
    activePatternElements.current.autoFilter = undefined;

    activePatternElements.current.effects.forEach(effect => {
      if (effect && !effect.disposed && typeof effect.dispose === 'function') {
        effect.dispose();
      }
    });
    
    if (activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
      activePatternElements.current.masterVolumeNode.dispose();
    }
    activePatternElements.current.masterVolumeNode = undefined;
    
    Tone.Transport.cancel(0); // Clear all scheduled events on transport
    activePatternElements.current = { synths: [], sequences: [], parts: [], loops: [], effects: [] };
  }, []);

  const stopSound = useCallback(() => {
    // Dispose Tone.js synths that are directly managed by refs
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

    // Cleanup pattern-based sounds (which includes synths, loops, effects etc. in activePatternElements)
    if (['patternLoop', 'ocean', 'fireplace'].includes(activePlayerType.current || '')) {
      cleanupPattern();
    }

    // Handle HTML5 audio player
    if (htmlAudioPlayer.current && (activePlayerType.current === 'userUploaded')) {
      htmlAudioPlayer.current.pause();
      htmlAudioPlayer.current.removeAttribute('src'); // Remove src
      htmlAudioPlayer.current.load(); // Reset player state
      if (currentObjectUrl.current) {
        URL.revokeObjectURL(currentObjectUrl.current);
        currentObjectUrl.current = null;
      }
    }

    setIsPlaying(false);
    activePlayerType.current = null; // Reset active player type
  }, [cleanupPattern]);

  useEffect(() => {
    // Initialize HTML5 audio player
    if (typeof window !== 'undefined' && !htmlAudioPlayer.current) {
      htmlAudioPlayer.current = new Audio();
      htmlAudioPlayer.current.loop = true;
    }

    // Initialize Tone.js context
    const initializeTone = async () => {
      if (Tone.context.state !== 'running') {
        try {
          await Tone.start();
          setIsReady(true);
          console.log("Tone.js AudioContext started.");
        } catch (e) {
          console.error("Failed to start Tone.js AudioContext:", e);
          setIsReady(false); // Explicitly set to false if Tone.start fails
        }
      } else {
        setIsReady(true);
      }
    };
    initializeTone();

    return () => {
      stopSound(); // Cleanup on component unmount
      if (htmlAudioPlayer.current) {
        htmlAudioPlayer.current.pause();
        htmlAudioPlayer.current.removeAttribute('src');
        htmlAudioPlayer.current.load();
        htmlAudioPlayer.current = null; // Release the reference
      }
      if (currentObjectUrl.current) {
        URL.revokeObjectURL(currentObjectUrl.current);
        currentObjectUrl.current = null;
      }
      lastPlayedSoundscapeIdRef.current = undefined;
    };
  }, [stopSound]);

  const playSound = useCallback(async (soundscapeId?: string) => {
    if (!isSettingsLoaded || !settings) {
      console.warn("playSound called before settings are loaded or settings object is invalid.");
      return;
    }
    
    if (!isReady && soundscapeId && soundscapeId !== 'none') {
      try {
        await Tone.start(); // Ensure Tone is started
        setIsReady(true);
      } catch (e) {
        console.error("Failed to start Tone.js in playSound:", e);
        return;
      }
    }

    stopSound(); // Stop any currently playing sound before starting a new one

    if (!soundscapeId || soundscapeId === 'none') {
      lastPlayedSoundscapeIdRef.current = undefined;
      return;
    }
    
    let selectedSoundscape: SoundscapeOption | undefined;
    if (soundscapeId.startsWith('user_')) {
        const dbId = parseInt(soundscapeId.split('_')[1], 10);
        if (!isNaN(dbId)) {
            const userSound = await getSoundscapeFromDB(dbId);
            if (userSound) {
                selectedSoundscape = {
                    id: soundscapeId,
                    nameKey: userSound.name, // Use the actual name
                    type: 'userUploaded',
                    params: { indexedDbId: dbId, mimeType: userSound.mimeType, volumeAdjustment: 0 } // Add default volumeAdjustment
                };
            }
        }
    } else {
        selectedSoundscape = SOUNDSCAPE_OPTIONS.find(s => s.id === soundscapeId);
    }


    if (!selectedSoundscape) {
      console.warn("Selected soundscape not found:", soundscapeId);
      lastPlayedSoundscapeIdRef.current = undefined;
      return;
    }

    lastPlayedSoundscapeIdRef.current = soundscapeId;
    activePlayerType.current = selectedSoundscape.type;

    const baseGainValue = Tone.gainToDb(volume * 0.5);
    const htmlVolumeValue = volume * 0.5;
    const soundscapeVolumeAdjustment = selectedSoundscape.params?.volumeAdjustment || 0;
    const finalGainValue = baseGainValue + soundscapeVolumeAdjustment;
    const finalHtmlVolume = Math.max(0, Math.min(1, htmlVolumeValue * Math.pow(10, soundscapeVolumeAdjustment / 20)));

    const transportSensitiveTypes: SoundscapeOption['type'][] = ['patternLoop', 'ocean', 'fireplace'];
    if (transportSensitiveTypes.includes(selectedSoundscape.type)) {
      if (activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
        activePatternElements.current.masterVolumeNode.dispose();
      }
      activePatternElements.current.masterVolumeNode = new Tone.Volume(finalGainValue).toDestination();
      activePatternElements.current.effects.push(activePatternElements.current.masterVolumeNode);
      
      if (Tone.Transport.state !== "started") {
        Tone.Transport.start(Tone.now() + scheduleDelay);
      }
    }

    switch (selectedSoundscape.type) {
      case 'userUploaded':
        if (htmlAudioPlayer.current && selectedSoundscape.params?.indexedDbId) {
            const audioSrcToPlay = `user_sound_${selectedSoundscape.params.indexedDbId}`; // For logging/identification
            try {
                const soundData = await getSoundscapeFromDB(selectedSoundscape.params.indexedDbId);
                if (soundData && soundData.data) {
                    const blob = new Blob([soundData.data], { type: soundData.mimeType });
                    if (currentObjectUrl.current) { 
                        URL.revokeObjectURL(currentObjectUrl.current); // Revoke previous before creating new
                    }
                    currentObjectUrl.current = URL.createObjectURL(blob);
                    
                    htmlAudioPlayer.current.src = currentObjectUrl.current;
                    htmlAudioPlayer.current.volume = finalHtmlVolume;
                    htmlAudioPlayer.current.load(); // Explicitly load the new source
                    await htmlAudioPlayer.current.play();
                    setIsPlaying(true);
                } else {
                     console.warn("User uploaded sound data not found in DB or data is empty:", selectedSoundscape.params.indexedDbId);
                     setIsPlaying(false);
                }
            } catch (error: any) {
                console.error("Error playing user uploaded audio:", audioSrcToPlay, error);
                setIsPlaying(false);
            }
        }
        break;
      case 'noise':
        if (selectedSoundscape.params?.type && selectedSoundscape.params.type !== 'off') {
          generalNoisePlayer.current = new Tone.Noise(selectedSoundscape.params.type as Tone.NoiseType).toDestination();
          generalNoisePlayer.current.volume.value = finalGainValue;
          generalNoisePlayer.current.start(Tone.now() + scheduleDelay);
          setIsPlaying(true);
        }
        break;
      case 'tone':
        const { notes, frequency, type: oscType = 'sine', envelope } = selectedSoundscape.params || {};
        let synthOptions: Partial<Tone.SynthOptions> = { oscillator: { type: oscType as Tone.ToneOscillatorType } };
        if (envelope && typeof envelope === 'object') {
            synthOptions.envelope = envelope as Tone.EnvelopeOptions;
        }

        if (notes && Array.isArray(notes)) {
          polySynthPlayer.current = new Tone.PolySynth(Tone.Synth, synthOptions).toDestination();
          polySynthPlayer.current.volume.value = finalGainValue;
          Tone.Transport.scheduleOnce((time) => {
              if (polySynthPlayer.current && !polySynthPlayer.current.disposed) {
                  polySynthPlayer.current.triggerAttack(notes, time);
              }
          }, scheduleDelay);
        } else {
          tonePlayer.current = new Tone.Synth(synthOptions).toDestination();
          tonePlayer.current.volume.value = finalGainValue;
          Tone.Transport.scheduleOnce((time) => {
            if (tonePlayer.current && !tonePlayer.current.disposed) {
                tonePlayer.current.triggerAttack(frequency || 440, time);
            }
          }, scheduleDelay);
        }
         if (Tone.Transport.state !== "started" && (notes && Array.isArray(notes))) { // Only start transport if needed by polysynth
            Tone.Transport.start(Tone.now() + scheduleDelay);
        } else if (!(notes && Array.isArray(notes)) && tonePlayer.current) { // For single tone, ensure it plays if transport isn't involved
            // No transport start needed for single triggerAttack with Tone.now() + offset
             if (tonePlayer.current && !tonePlayer.current.disposed && !(frequency || 440)) {
                // if frequency is null/undefined, we might need to ensure it's scheduled with Tone.now if not using transport
                // However, the scheduleOnce should handle this. Re-evaluating if still an issue.
                // For now, the scheduleOnce should be sufficient.
             }
        }
        setIsPlaying(true);
        break;
      case 'binaural':
        const { baseFrequency = 100, beatFrequency = 8 } = selectedSoundscape.params || {};
        const freqLeft = baseFrequency - beatFrequency / 2;
        const freqRight = baseFrequency + beatFrequency / 2;
        const binauralSynthOpts: Partial<Tone.SynthOptions> = { oscillator: { type: 'sine' as Tone.ToneOscillatorType }, envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 0.5 }};

        const pannerL = new Tone.Panner(-1).toDestination();
        const pannerR = new Tone.Panner(1).toDestination();
        activePatternElements.current.effects.push(pannerL, pannerR);

        tonePlayerLeft.current = new Tone.Synth(binauralSynthOpts).connect(pannerL);
        tonePlayerLeft.current.volume.value = finalGainValue;
        
        tonePlayerRight.current = new Tone.Synth(binauralSynthOpts).connect(pannerR);
        tonePlayerRight.current.volume.value = finalGainValue;

        Tone.Transport.scheduleOnce((time) => {
            if(tonePlayerLeft.current && !tonePlayerLeft.current.disposed) tonePlayerLeft.current.triggerAttack(freqLeft, time);
            if(tonePlayerRight.current && !tonePlayerRight.current.disposed) tonePlayerRight.current.triggerAttack(freqRight, time);
        }, scheduleDelay);
        if (Tone.Transport.state !== "started") {
            Tone.Transport.start(Tone.now() + scheduleDelay);
        }
        setIsPlaying(true);
        break;
      case 'ocean':
        if (!activePatternElements.current.masterVolumeNode || activePatternElements.current.masterVolumeNode.disposed) {
            console.error("Master volume node not available for ocean soundscape.");
            cleanupPattern();
            setIsPlaying(false);
            return;
        }
        const oceanNoise = new Tone.Noise("brown");
        activePatternElements.current.noiseSource = oceanNoise;

        const autoFilterParams = selectedSoundscape.params?.autoFilter || {};
        const oceanAutoFilter = new Tone.AutoFilter({
            frequency: autoFilterParams.frequency || "4m", // Slower frequency for wave-like effect
            baseFrequency: autoFilterParams.baseFrequency || 100,
            octaves: autoFilterParams.octaves || 5,
            filter: autoFilterParams.filter || { type: "lowpass" as const, rolloff: -24 as const, Q: 3 },
            wet: 1
        }).connect(activePatternElements.current.masterVolumeNode);
        activePatternElements.current.autoFilter = oceanAutoFilter;
        activePatternElements.current.effects.push(oceanAutoFilter);
        
        oceanNoise.connect(oceanAutoFilter);
        
        Tone.Transport.scheduleOnce((transportTime) => {
            if (oceanAutoFilter && !oceanAutoFilter.disposed) oceanAutoFilter.start(transportTime);
            if (oceanNoise && !oceanNoise.disposed) oceanNoise.start(transportTime);
        }, scheduleDelay);

        setIsPlaying(true);
        break;
      case 'fireplace':
        if (!activePatternElements.current.masterVolumeNode || activePatternElements.current.masterVolumeNode.disposed) {
            console.error("Master volume node not available for fireplace soundscape.");
            cleanupPattern();
            setIsPlaying(false);
            return;
        }
        const fireSynthOptions = selectedSoundscape.params?.synthOptions || {
            noise: { type: 'pink' as const },
            envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.02 }
        };
        const fireNoiseSynth = new Tone.NoiseSynth(fireSynthOptions).connect(activePatternElements.current.masterVolumeNode);
        activePatternElements.current.synths.push(fireNoiseSynth);

        const crackleLoop = new Tone.Loop(transportTime => {
            if (fireNoiseSynth && !fireNoiseSynth.disposed) {
                fireNoiseSynth.volume.value = finalGainValue - (Math.random() * 6);
                const randomOffset = 0.001 + (Math.random() * 0.049); // Ensure offset is always positive and small
                fireNoiseSynth.triggerAttackRelease("32n", transportTime + randomOffset);
            }
        }, "16n").start(scheduleDelay); // Start loop on transport
        crackleLoop.probability = 0.6;
        activePatternElements.current.loops.push(crackleLoop);
        setIsPlaying(true);
        break;
      case 'patternLoop':
        if (!activePatternElements.current.masterVolumeNode || activePatternElements.current.masterVolumeNode.disposed) {
             console.error("Master volume node not available for pattern loop.");
             cleanupPattern();
             setIsPlaying(false);
             return;
        }
        const { bpm, instruments, effects: patternEffectsParams } = selectedSoundscape.params || {};
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
            case 'PolySynth': synth = new Tone.PolySynth(Tone.Synth, synthOptionsResolved); break;
            case 'MetalSynth': synth = new Tone.MetalSynth(synthOptionsResolved); break;
            case 'Synth': default: synth = new Tone.Synth(synthOptionsResolved); break;
          }
          
          if (activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
            synth.connect(activePatternElements.current.masterVolumeNode);
          } else {
            synth.toDestination(); // Fallback, though masterVolumeNode should exist
          }
          activePatternElements.current.synths.push(synth);

          if (instrumentDef.pattern && instrumentDef.subdivision) {
            const seq = new Tone.Sequence((transportTime, note) => {
              if (note && synth && !synth.disposed && typeof synth.triggerAttackRelease === 'function') {
                 synth.triggerAttackRelease(note, instrumentDef.duration || '8n', transportTime);
              } else if (note && synth && !synth.disposed && typeof synth.triggerAttack === 'function') { // For synths like NoiseSynth that only have triggerAttack
                 synth.triggerAttack(note, transportTime);
              }
            }, instrumentDef.pattern, instrumentDef.subdivision).start(scheduleDelay);
            activePatternElements.current.sequences.push(seq);
          } else if (instrumentDef.sequence) { // For more complex sequences (array of objects with time, notes, duration)
            const part = new Tone.Part((transportTime, value) => {
              if(synth && !synth.disposed && value.notes && typeof synth.triggerAttackRelease === 'function') {
                synth.triggerAttackRelease(value.notes, value.duration, transportTime);
              }
            }, instrumentDef.sequence).start(scheduleDelay);
            part.loop = true;
            if (instrumentDef.loopEnd) part.loopEnd = instrumentDef.loopEnd;
            activePatternElements.current.parts.push(part);
          }
        });
        if (patternEffectsParams?.reverb && activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
           const reverb = new Tone.Reverb(patternEffectsParams.reverb).toDestination(); // Reverb goes to destination
           activePatternElements.current.masterVolumeNode.disconnect(Tone.Destination); // Disconnect direct path
           activePatternElements.current.masterVolumeNode.connect(reverb); // Connect volume node to reverb
           activePatternElements.current.effects.push(reverb);
        }
        setIsPlaying(true);
        break;
      default:
        activePlayerType.current = null;
        lastPlayedSoundscapeIdRef.current = undefined;
        setIsPlaying(false);
    }
  }, [isReady, volume, stopSound, cleanupPattern, settings, isSettingsLoaded]);

  useEffect(() => {
    if (!isSettingsLoaded || !settings || !isPlaying || !isReady || !lastPlayedSoundscapeIdRef.current) {
      return;
    }

    const currentSoundscapeId = lastPlayedSoundscapeIdRef.current;
    let selectedSound: SoundscapeOption | undefined;

    if (currentSoundscapeId.startsWith('user_')) {
        // For user sounds, the type is 'userUploaded'. Params like volumeAdjustment are expected.
        const dbId = parseInt(currentSoundscapeId.split('_')[1], 10);
        // We need to find the name or rely on a default volume adjustment for user sounds if not stored
        // For now, assume a default volumeAdjustment if not specifically fetched/stored with user sound metadata
        selectedSound = {
            id: currentSoundscapeId,
            nameKey: 'User Sound', // Placeholder nameKey
            type: 'userUploaded',
            params: { indexedDbId: dbId, volumeAdjustment: settings.customSoundscapeUrls?.[currentSoundscapeId]?.volumeAdjustment || 0 }
        };
    } else {
        selectedSound = SOUNDSCAPE_OPTIONS.find(s => s.id === currentSoundscapeId);
    }


    if (!selectedSound) return;

    const soundscapeVolAdj = selectedSound.params?.volumeAdjustment || 0;
    const activeType = activePlayerType.current;

    if (activeType === 'userUploaded' && htmlAudioPlayer.current) {
      const htmlVol = volume * 0.5;
      htmlAudioPlayer.current.volume = Math.max(0, Math.min(1, htmlVol * Math.pow(10, soundscapeVolAdj / 20) ));
    } else {
      const baseGain = Tone.gainToDb(volume * 0.5);
      const finalGain = baseGain + soundscapeVolAdj;

      if (activeType === 'noise' && generalNoisePlayer.current && !generalNoisePlayer.current.disposed) {
        generalNoisePlayer.current.volume.linearRampToValueAtTime(finalGain, Tone.now() + 0.1);
      } else if (activeType === 'tone') {
        if (tonePlayer.current && !tonePlayer.current.disposed) {
            tonePlayer.current.volume.linearRampToValueAtTime(finalGain, Tone.now() + 0.1);
        }
        if (polySynthPlayer.current && !polySynthPlayer.current.disposed) {
            polySynthPlayer.current.volume.linearRampToValueAtTime(finalGain, Tone.now() + 0.1);
        }
      } else if (activeType === 'binaural') {
        if (tonePlayerLeft.current && !tonePlayerLeft.current.disposed) tonePlayerLeft.current.volume.linearRampToValueAtTime(finalGain, Tone.now() + 0.1);
        if (tonePlayerRight.current && !tonePlayerRight.current.disposed) tonePlayerRight.current.volume.linearRampToValueAtTime(finalGain, Tone.now() + 0.1);
      } else if (['patternLoop', 'ocean', 'fireplace'].includes(activeType || '') && activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
        activePatternElements.current.masterVolumeNode.volume.linearRampToValueAtTime(finalGain, Tone.now() + 0.1);
      }
    }
  }, [volume, isPlaying, isReady, settings, isSettingsLoaded]);

  return { playSound, stopSound, isReady, isPlaying };
}

