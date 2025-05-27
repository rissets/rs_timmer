
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import type { SoundscapeOption, Settings, UserSoundscapeRecord } from '@/lib/types';
import { SOUNDSCAPE_OPTIONS, DEFAULT_SETTINGS } from '@/lib/constants';
import { getSoundscape as getSoundscapeFromDB } from '@/lib/audio-storage';

const scheduleDelay = 0.05; // 50ms delay for scheduling transport-based events

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
  oceanNoise?: Tone.Noise;
  autoFilter?: Tone.AutoFilter;
  lfo?: Tone.LFO; // Added for ocean effect cleanup
}

interface SoundscapePlayer {
  playSound: (soundscapeId?: string) => Promise<void>;
  stopSound: () => void;
  isReady: boolean;
  isPlaying: boolean;
}

export function useSoundscapePlayer({
  volume,
  settings: propSettings,
  isSettingsLoaded,
}: UseSoundscapePlayerProps): SoundscapePlayer {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const settings = isSettingsLoaded && propSettings ? propSettings : DEFAULT_SETTINGS;

  const tonePlayer = useRef<Tone.Synth | null>(null);
  const polySynthPlayer = useRef<Tone.PolySynth | null>(null);
  const tonePlayerLeft = useRef<Tone.Synth | null>(null);
  const tonePlayerRight = useRef<Tone.Synth | null>(null);
  const generalNoisePlayer = useRef<Tone.Noise | null>(null);
  
  const htmlAudioPlayer = useRef<HTMLAudioElement | null>(null);
  const currentObjectUrl = useRef<string | null>(null);

  const activePatternElements = useRef<ActivePatternElements>({
    synths: [],
    sequences: [],
    parts: [],
    loops: [],
    effects: [],
  });
  const activePlayerType = useRef<SoundscapeOption['type'] | null>(null);
  const lastPlayedSoundscapeIdRef = useRef<string | undefined>(undefined);

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
        part.stop(0); // Ensure part itself is stopped if necessary, before clearing events.
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
        if (typeof (synth as any).releaseAll === 'function') (synth as any).releaseAll(Tone.now());
        else if (typeof (synth as any).triggerRelease === 'function') (synth as any).triggerRelease(Tone.now());
        else if (typeof (synth as any).stop === 'function') (synth as any).stop(Tone.now());
        synth.dispose();
      }
    });
    
    if (activePatternElements.current.oceanNoise && !activePatternElements.current.oceanNoise.disposed) {
      activePatternElements.current.oceanNoise.stop(Tone.now());
      activePatternElements.current.oceanNoise.dispose();
    }
    activePatternElements.current.oceanNoise = undefined;

    if (activePatternElements.current.autoFilter && !activePatternElements.current.autoFilter.disposed) {
      if (typeof activePatternElements.current.autoFilter.stop === 'function') {
        activePatternElements.current.autoFilter.stop(Tone.now());
      }
      activePatternElements.current.autoFilter.dispose();
    }
    activePatternElements.current.autoFilter = undefined;

    if (activePatternElements.current.lfo && !activePatternElements.current.lfo.disposed) {
        activePatternElements.current.lfo.stop(Tone.now());
        activePatternElements.current.lfo.dispose();
    }
    activePatternElements.current.lfo = undefined;

    activePatternElements.current.effects.forEach(effect => {
      if (effect && !effect.disposed && typeof effect.dispose === 'function') {
        effect.dispose();
      }
    });
    
    if (activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
      activePatternElements.current.masterVolumeNode.dispose();
    }
    activePatternElements.current.masterVolumeNode = undefined;
    
    Tone.Transport.cancel(0); // Clear any remaining scheduled events on the transport
    activePatternElements.current = { synths: [], sequences: [], parts: [], loops: [], effects: [] }; // Reset the structure
  }, []);

  const stopSound = useCallback(() => {
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

    if (['patternLoop', 'ocean', 'fireplace'].includes(activePlayerType.current || '')) {
      cleanupPattern();
    }

    if (htmlAudioPlayer.current && activePlayerType.current === 'userUploaded') {
      htmlAudioPlayer.current.pause();
      htmlAudioPlayer.current.removeAttribute('src'); // Use removeAttribute for src
      htmlAudioPlayer.current.load(); // Explicitly call load to reset the player
      if (currentObjectUrl.current) {
        URL.revokeObjectURL(currentObjectUrl.current);
        currentObjectUrl.current = null;
      }
      // Remove event listeners if any were attached and not self-cleaned
      // This part is tricky without named functions; often, {once: true} handles it.
      // For critical paths, ensure listeners are explicitly removed if not using {once: true}.
    }

    setIsPlaying(false);
    activePlayerType.current = null;
  }, [cleanupPattern]);

  useEffect(() => {
    if (typeof window !== 'undefined' && !htmlAudioPlayer.current) {
      htmlAudioPlayer.current = new Audio();
      htmlAudioPlayer.current.loop = true; // Set loop for HTML5 audio
    }

    const initializeTone = async () => {
      if (Tone.context.state !== 'running') {
        try {
          await Tone.start();
          setIsReady(true);
        } catch (e) {
          console.error("Failed to start Tone.js AudioContext:", e);
          setIsReady(false);
        }
      } else {
        setIsReady(true);
      }
    };
    initializeTone();

    return () => {
      stopSound();
      if (htmlAudioPlayer.current) {
        htmlAudioPlayer.current.pause();
        htmlAudioPlayer.current.removeAttribute('src');
        htmlAudioPlayer.current.load();
      }
      if (currentObjectUrl.current) {
        URL.revokeObjectURL(currentObjectUrl.current);
        currentObjectUrl.current = null;
      }
      activePatternElements.current.effects.forEach(effect => {
        if (effect instanceof Tone.Panner && !effect.disposed) effect.dispose();
      });
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
        await Tone.start();
        setIsReady(true);
      } catch (e) {
        console.error("Failed to start Tone.js in playSound:", e);
        return;
      }
    }

    stopSound();

    if (!soundscapeId || soundscapeId === 'none') {
      lastPlayedSoundscapeIdRef.current = undefined;
      return;
    }
    
    let selectedSoundscape: SoundscapeOption | undefined;

    if (soundscapeId.startsWith('user_')) {
        const dbIdStr = soundscapeId.split('_')[1];
        const dbId = parseInt(dbIdStr, 10);
        if (!isNaN(dbId)) {
            try {
              const userSoundRecord = await getSoundscapeFromDB(dbId);
              if (userSoundRecord) {
                  selectedSoundscape = {
                      id: soundscapeId,
                      nameKey: userSoundRecord.name, // This is the actual name, not a key
                      type: 'userUploaded',
                      params: { 
                        indexedDbId: dbId, 
                        mimeType: userSoundRecord.mimeType, 
                        volumeAdjustment: 0 // Default, can be customized if needed
                      }
                  };
              } else {
                console.warn("User sound record not found in DB for id:", dbId);
              }
            } catch (error) {
                console.error("Error fetching user sound from DB:", error);
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

    const baseGainValue = Tone.gainToDb(volume * 0.5); // Default gain for synths
    const htmlVolumeValue = volume * 0.5; // Default volume for HTML audio
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
            const audioSrcToPlay = `user_sound_${selectedSoundscape.params.indexedDbId}`; // For logging

            // Thoroughly reset player and revoke old URL if it exists
            if (currentObjectUrl.current) {
                URL.revokeObjectURL(currentObjectUrl.current);
                currentObjectUrl.current = null;
            }
            if (htmlAudioPlayer.current) {
                htmlAudioPlayer.current.pause();
                htmlAudioPlayer.current.removeAttribute('src');
                htmlAudioPlayer.current.load(); // Reset player
            }
            
            try {
                const soundData = await getSoundscapeFromDB(selectedSoundscape.params.indexedDbId);
                if (soundData && soundData.data) {
                    const blob = new Blob([soundData.data], { type: soundData.mimeType });
                    currentObjectUrl.current = URL.createObjectURL(blob); // Store new URL
                    
                    const player = htmlAudioPlayer.current;
                    if (player) {
                        player.src = currentObjectUrl.current;
                        player.volume = finalHtmlVolume;
                        player.load(); // Ensure new source is loaded

                        const handleCanPlayThrough = () => {
                            player.play()
                                .then(() => setIsPlaying(true))
                                .catch(playError => {
                                    console.error("Error trying to play user uploaded audio:", audioSrcToPlay, playError);
                                    setIsPlaying(false);
                                    if (currentObjectUrl.current) {
                                        URL.revokeObjectURL(currentObjectUrl.current);
                                        currentObjectUrl.current = null;
                                    }
                                });
                            player.removeEventListener('canplaythrough', handleCanPlayThrough);
                            player.removeEventListener('error', handleMediaError);
                        };

                        const handleMediaError = (event: Event) => {
                            console.error("Media error on HTML audio element:", audioSrcToPlay, (event.target as HTMLAudioElement).error);
                            setIsPlaying(false);
                            if (currentObjectUrl.current) {
                                URL.revokeObjectURL(currentObjectUrl.current);
                                currentObjectUrl.current = null;
                            }
                            player.removeEventListener('canplaythrough', handleCanPlayThrough);
                            player.removeEventListener('error', handleMediaError);
                        };
                        
                        player.addEventListener('canplaythrough', handleCanPlayThrough, { once: true });
                        player.addEventListener('error', handleMediaError, { once: true });
                    }
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
          if (generalNoisePlayer.current && !generalNoisePlayer.current.disposed) generalNoisePlayer.current.dispose();
          generalNoisePlayer.current = new Tone.Noise(selectedSoundscape.params.type as Tone.NoiseType).toDestination();
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
        } else {
            synthOptions.envelope = { attack: 0.005, decay: 0.1, sustain: 1, release: 0.5 };
        }

        if (notes && Array.isArray(notes)) {
          if (polySynthPlayer.current) polySynthPlayer.current.dispose();
          polySynthPlayer.current = new Tone.PolySynth(Tone.Synth, synthOptions).toDestination();
          polySynthPlayer.current.volume.value = finalGainValue;
          polySynthPlayer.current.triggerAttack(notes, Tone.now() + scheduleDelay);
        } else {
          if (tonePlayer.current) tonePlayer.current.dispose();
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
        const binauralSynthOpts: Partial<Tone.SynthOptions> = { 
            oscillator: { type: 'sine' as Tone.ToneOscillatorType }, 
            envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 0.5 }
        };

        if (tonePlayerLeft.current) tonePlayerLeft.current.dispose();
        if (tonePlayerRight.current) tonePlayerRight.current.dispose();
        
        activePatternElements.current.effects = activePatternElements.current.effects.filter(ef => {
            if(ef instanceof Tone.Panner && !ef.disposed) ef.dispose();
            return !(ef instanceof Tone.Panner);
        });

        const pannerL = new Tone.Panner(-1).toDestination();
        const pannerR = new Tone.Panner(1).toDestination();
        activePatternElements.current.effects.push(pannerL, pannerR);

        tonePlayerLeft.current = new Tone.Synth(binauralSynthOpts).connect(pannerL);
        tonePlayerLeft.current.volume.value = finalGainValue;
        
        tonePlayerRight.current = new Tone.Synth(binauralSynthOpts).connect(pannerR);
        tonePlayerRight.current.volume.value = finalGainValue;

        tonePlayerLeft.current.triggerAttack(freqLeft, Tone.now() + scheduleDelay);
        tonePlayerRight.current.triggerAttack(freqRight, Tone.now() + scheduleDelay);
        
        setIsPlaying(true);
        break;
      case 'ocean':
        if (!activePatternElements.current.masterVolumeNode || activePatternElements.current.masterVolumeNode.disposed) {
            console.error("Master volume node not available for ocean soundscape.");
            cleanupPattern(); setIsPlaying(false); return;
        }
        // Cleanup previous ocean-specific nodes if they exist and are not disposed
        if (activePatternElements.current.oceanNoise && !activePatternElements.current.oceanNoise.disposed) activePatternElements.current.oceanNoise.dispose();
        if (activePatternElements.current.autoFilter && !activePatternElements.current.autoFilter.disposed) activePatternElements.current.autoFilter.dispose();
        
        activePatternElements.current.oceanNoise = new Tone.Noise("brown");
        const autoFilterParams = selectedSoundscape.params?.autoFilter || {};
        activePatternElements.current.autoFilter = new Tone.AutoFilter({
            frequency: autoFilterParams.frequency || "4m",
            baseFrequency: autoFilterParams.baseFrequency || 100,
            octaves: autoFilterParams.octaves || 5,
            filter: autoFilterParams.filter || { type: "lowpass" as const, rolloff: -24 as const, Q: 3 },
            wet: 1
        }).connect(activePatternElements.current.masterVolumeNode);
        
        activePatternElements.current.effects.push(activePatternElements.current.autoFilter);
        activePatternElements.current.oceanNoise.connect(activePatternElements.current.autoFilter);

        // Schedule start on transport
        Tone.Transport.scheduleOnce((transportTime) => {
            if (activePatternElements.current.autoFilter && !activePatternElements.current.autoFilter.disposed) activePatternElements.current.autoFilter.start(transportTime);
            if (activePatternElements.current.oceanNoise && !activePatternElements.current.oceanNoise.disposed) activePatternElements.current.oceanNoise.start(transportTime);
        }, scheduleDelay);
        setIsPlaying(true);
        break;
      case 'fireplace':
        if (!activePatternElements.current.masterVolumeNode || activePatternElements.current.masterVolumeNode.disposed) {
            console.error("Master volume node not available for fireplace soundscape.");
            cleanupPattern(); setIsPlaying(false); return;
        }
        const fireSynthOptions = selectedSoundscape.params?.synthOptions || {
            noise: { type: 'pink' as const },
            envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.02 }
        };
        const fireNoiseSynth = new Tone.NoiseSynth(fireSynthOptions).connect(activePatternElements.current.masterVolumeNode);
        activePatternElements.current.synths.push(fireNoiseSynth);

        const crackleLoop = new Tone.Loop(transportTime => {
            if (fireNoiseSynth && !fireNoiseSynth.disposed) {
                const randomOffset = 0.001 + (Math.random() * 0.049); // Ensure positive, small offset
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
             cleanupPattern(); setIsPlaying(false); return;
        }
        const { bpm, instruments, effects: patternEffectsParams } = selectedSoundscape.params || {};
        Tone.Transport.bpm.value = bpm || 120;

        (instruments || []).forEach((instrumentDef: any) => {
          let synth: any;
          const synthOptionsResolved = {...instrumentDef.synthOptions};
          if (!synthOptionsResolved.envelope && (instrumentDef.synthType === 'Synth' || instrumentDef.synthType === 'PolySynth')) {
            synthOptionsResolved.envelope = { attack: 0.01, decay: 0.4, sustain: 1, release: 0.4 };
          }

          switch(instrumentDef.synthType) {
            case 'MembraneSynth': synth = new Tone.MembraneSynth(synthOptionsResolved); break;
            case 'NoiseSynth': synth = new Tone.NoiseSynth(synthOptionsResolved); break;
            case 'PluckSynth': synth = new Tone.PluckSynth(synthOptionsResolved); break;
            case 'PolySynth': synth = new Tone.PolySynth(Tone.Synth, synthOptionsResolved); break; // Assuming Tone.Synth as base for PolySynth
            case 'MetalSynth': synth = new Tone.MetalSynth(synthOptionsResolved); break;
            case 'Synth': default: synth = new Tone.Synth(synthOptionsResolved); break;
          }
          
          if (activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
            synth.connect(activePatternElements.current.masterVolumeNode);
          } else {
            synth.toDestination(); // Fallback if masterVolumeNode is somehow not available
          }
          activePatternElements.current.synths.push(synth);

          if (instrumentDef.pattern && instrumentDef.subdivision) {
            const seq = new Tone.Sequence((transportTime, note) => {
              if (note && synth && !synth.disposed) {
                 if (typeof synth.triggerAttackRelease === 'function') {
                    synth.triggerAttackRelease(note, instrumentDef.duration || '8n', transportTime);
                 } else if (typeof synth.triggerAttack === 'function') { // For synths like NoiseSynth that might only have triggerAttack
                    synth.triggerAttack(transportTime);
                 }
              }
            }, instrumentDef.pattern, instrumentDef.subdivision).start(scheduleDelay);
            activePatternElements.current.sequences.push(seq);
          } else if (instrumentDef.sequence) { // For more complex, timed sequences
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
        // Apply effects like reverb if defined
        if (patternEffectsParams?.reverb && activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
           const reverb = new Tone.Reverb(patternEffectsParams.reverb).toDestination(); // Reverb goes to final destination
           activePatternElements.current.masterVolumeNode.disconnect(Tone.Destination); // Disconnect master from direct output
           activePatternElements.current.masterVolumeNode.connect(reverb); // Connect master to reverb
           activePatternElements.current.effects.push(reverb);
        }
        setIsPlaying(true);
        break;
      default:
        console.warn("Unknown or unhandled soundscape type:", selectedSoundscape.type);
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
        const dbIdStr = currentSoundscapeId.split('_')[1];
        const dbId = parseInt(dbIdStr, 10);
        if (!isNaN(dbId)) {
            // We assume the sound is 'userUploaded' type based on prefix.
            // The specific name or MIME type isn't crucial for volume adjustment.
            selectedSound = {
                id: currentSoundscapeId,
                nameKey: 'User Sound', // Placeholder, not used for volume
                type: 'userUploaded',
                params: { indexedDbId: dbId, volumeAdjustment: 0 } // Default vol adjustment
            };
        }
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

