
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import type { SoundscapeOption } from '@/lib/types';
import { SOUNDSCAPE_OPTIONS } from '@/lib/constants';

interface UseSoundscapePlayerProps {
  volume: number; // 0-1
}

interface ActivePatternElements {
  synths: (Tone.Synth<any> | Tone.NoiseSynth | Tone.MembraneSynth | Tone.PluckSynth | Tone.PolySynth<any> | Tone.MetalSynth)[];
  sequences: Tone.Sequence[];
  parts: Tone.Part[];
  loops: Tone.Loop[];
  effects: (Tone.Reverb | Tone.Volume | Tone.AutoFilter | Tone.Panner | Tone.FeedbackDelay | Tone.Chorus | Tone.Filter)[];
  masterVolumeNode?: Tone.Volume;
  noiseSource?: Tone.Noise;
}

interface SoundscapePlayer {
  playSound: (soundscapeId?: string) => Promise<void>;
  stopSound: () => void;
  isReady: boolean;
  isPlaying: boolean;
}

export function useSoundscapePlayer({ volume }: UseSoundscapePlayerProps): SoundscapePlayer {
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const generalNoisePlayer = useRef<Tone.Noise | null>(null);
  const tonePlayer = useRef<Tone.Synth | null>(null);
  const polySynthPlayer = useRef<Tone.PolySynth | null>(null);
  const tonePlayerLeft = useRef<Tone.Synth | null>(null);
  const tonePlayerRight = useRef<Tone.Synth | null>(null);
  
  const activePatternElements = useRef<ActivePatternElements>({ synths: [], sequences: [], parts: [], loops: [], effects: [], noiseSource: undefined, masterVolumeNode: undefined });
  const activePlayerType = useRef<'noise' | 'tone' | 'polysynth' | 'binaural' | 'patternLoop' | 'ocean' | 'fireplace' | null>(null);
  const lastPlayedSoundscapeIdRef = useRef<string | undefined>(undefined);

  const cleanupPattern = useCallback(() => {
    Tone.Transport.stop(); // Stop transport first

    activePatternElements.current.loops.forEach(loop => {
      if (loop && !loop.disposed) {
        // loop.stop(0); // Transport.stop should handle this
        loop.dispose();
      }
    });
    activePatternElements.current.parts.forEach(part => {
      if (part && !part.disposed) {
        // part.stop(0); // Transport.stop should handle this
        part.clear();
        part.dispose();
      }
    });
    activePatternElements.current.sequences.forEach(seq => {
      if (seq && !seq.disposed) {
        // seq.stop(0); // Transport.stop should handle this
        seq.clear();
        seq.dispose();
      }
    });
    
    activePatternElements.current.synths.forEach(synth => {
      if (synth && !synth.disposed) {
        if (typeof (synth as any).releaseAll === 'function') {
          (synth as any).releaseAll();
        } else if (typeof (synth as any).triggerRelease === 'function') {
          (synth as any).triggerRelease();
        }
        synth.dispose();
      }
    });

    if (activePatternElements.current.noiseSource && !activePatternElements.current.noiseSource.disposed) {
        activePatternElements.current.noiseSource.stop(0);
        activePatternElements.current.noiseSource.dispose();
    }
    
    activePatternElements.current.effects.forEach(effect => {
      if (effect && !effect.disposed && typeof effect.dispose === 'function') {
        if (typeof (effect as Tone.AutoFilter).stop === 'function' && !(effect as Tone.AutoFilter).disposed) (effect as Tone.AutoFilter).stop(0);
        effect.dispose();
      }
    });
    
    if (activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
        activePatternElements.current.masterVolumeNode.dispose();
    }
    
    Tone.Transport.cancel(0); // Clear any remaining transport events
    activePatternElements.current = { synths: [], sequences: [], parts: [], loops: [], effects: [], noiseSource: undefined, masterVolumeNode: undefined };
  }, []);


  useEffect(() => {
    // const initTone = async () => { // Not used directly anymore
    //   await Tone.start();
    //   setIsReady(true);
    //   console.log("AudioContext started, Tone.js ready.");
    // };

    if (typeof window !== 'undefined') {
      if (Tone.context.state !== 'running') {
        // Defer Tone.start() to be called on first playSound or interaction
      } else {
        setIsReady(true);
      }
    }
    
    return () => {
      if (generalNoisePlayer.current && !generalNoisePlayer.current.disposed) {
        generalNoisePlayer.current.stop();
        generalNoisePlayer.current.dispose();
      }
      if (tonePlayer.current && !tonePlayer.current.disposed) {
        tonePlayer.current.triggerRelease();
        tonePlayer.current.dispose();
      }
      if (polySynthPlayer.current && !polySynthPlayer.current.disposed) {
        polySynthPlayer.current.releaseAll();
        polySynthPlayer.current.dispose();
      }
      if (tonePlayerLeft.current && !tonePlayerLeft.current.disposed) {
        tonePlayerLeft.current.triggerRelease(); // Ensure release before dispose
        tonePlayerLeft.current.dispose();
      }
      if (tonePlayerRight.current && !tonePlayerRight.current.disposed) {
        tonePlayerRight.current.triggerRelease(); // Ensure release before dispose
        tonePlayerRight.current.dispose();
      }
      
      cleanupPattern();
      
      generalNoisePlayer.current = null;
      tonePlayer.current = null;
      polySynthPlayer.current = null;
      tonePlayerLeft.current = null;
      tonePlayerRight.current = null;
      
      activePlayerType.current = null;
      lastPlayedSoundscapeIdRef.current = undefined;
    };
  }, [cleanupPattern]);

  const stopSound = useCallback(() => {
    const now = Tone.now();
    if (generalNoisePlayer.current && !generalNoisePlayer.current.disposed && activePlayerType.current === 'noise') {
      generalNoisePlayer.current.stop(now);
    }
    if (tonePlayer.current && !tonePlayer.current.disposed && activePlayerType.current === 'tone') {
      tonePlayer.current.triggerRelease(now);
    }
    if (polySynthPlayer.current && !polySynthPlayer.current.disposed && activePlayerType.current === 'polysynth') {
      polySynthPlayer.current.releaseAll(now);
    }
    if (activePlayerType.current === 'binaural') {
        if (tonePlayerLeft.current && !tonePlayerLeft.current.disposed) tonePlayerLeft.current.triggerRelease(now);
        if (tonePlayerRight.current && !tonePlayerRight.current.disposed) tonePlayerRight.current.triggerRelease(now);
    }
    if (['patternLoop', 'ocean', 'fireplace'].includes(activePlayerType.current || '')) {
      cleanupPattern(); // This already handles stopping Transport and disposing elements
    }
    setIsPlaying(false);
  }, [cleanupPattern]);

  const playSound = useCallback(async (soundscapeId?: string) => {
    if (!isReady) {
      try {
        await Tone.start();
        setIsReady(true);
      } catch (e) {
        console.error("Failed to start Tone.js in playSound, requires user interaction:", e);
        return;
      }
    }
    if (!soundscapeId || soundscapeId === 'none') {
      stopSound();
      activePlayerType.current = null;
      lastPlayedSoundscapeIdRef.current = undefined;
      return;
    }

    const selectedSoundscape = SOUNDSCAPE_OPTIONS.find(s => s.id === soundscapeId);
    if (!selectedSoundscape) {
      stopSound();
      activePlayerType.current = null;
      lastPlayedSoundscapeIdRef.current = undefined;
      return;
    }
    
    if (Tone.context.state !== 'running') {
        try {
          await Tone.start();
        } catch (e) {
          console.warn("Tone.start() in playSound needed user gesture:", e);
          setIsReady(false); // Set back to false if it failed
          return;
        }
    }

    stopSound(); // Stop any currently playing sound first

    const baseGainValue = Tone.gainToDb(volume * 0.5);
    const soundscapeVolumeAdjustment = selectedSoundscape.params?.volumeAdjustment || 0;
    const finalGainValue = baseGainValue + soundscapeVolumeAdjustment;

    lastPlayedSoundscapeIdRef.current = soundscapeId;
    activePlayerType.current = selectedSoundscape.type as any;

    // For sounds that use Tone.Transport, ensure it's managed correctly
    const transportSensitiveTypes = ['patternLoop', 'ocean', 'fireplace', 'tone', 'binaural', 'polysynth'];
    if (transportSensitiveTypes.includes(selectedSoundscape.type)) {
        if (Tone.Transport.state !== "started") {
            // Start transport slightly in the future to ensure it's ready for scheduling
            Tone.Transport.start(Tone.now() + 0.02); 
        }
    }

    if (['patternLoop', 'ocean', 'fireplace'].includes(selectedSoundscape.type)) {
        const patternMasterVol = new Tone.Volume(finalGainValue).toDestination();
        activePatternElements.current.masterVolumeNode = patternMasterVol;
        activePatternElements.current.effects.push(patternMasterVol);
    }

    switch (selectedSoundscape.type) {
      case 'noise':
        if (selectedSoundscape.params.type !== 'off') {
          if (!generalNoisePlayer.current || generalNoisePlayer.current.disposed) {
            generalNoisePlayer.current = new Tone.Noise(selectedSoundscape.params.type).toDestination();
          } else {
            generalNoisePlayer.current.type = selectedSoundscape.params.type;
          }
          generalNoisePlayer.current.volume.value = finalGainValue;
          generalNoisePlayer.current.start(Tone.now() + 0.01); // Small delay for start
          setIsPlaying(true);
        }
        break;
      case 'tone':
        const { notes, frequency, type: oscType = 'sine', envelope } = selectedSoundscape.params;
        const scheduleDelay = Tone.Transport.now() + 0.05; // 50ms delay from transport's current time

        if (notes && Array.isArray(notes)) {
          activePlayerType.current = 'polysynth'; // Explicitly set for PolySynth path
          const polySynthOptions: Tone.PolySynthOptions<Tone.Synth<Tone.SynthOptions>> = {
             oscillator: { type: oscType as Tone.ToneOscillatorType }
          };
          if (envelope) {
            polySynthOptions.envelope = envelope;
          } else {
            polySynthOptions.envelope = { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 };
          }

          if (!polySynthPlayer.current || polySynthPlayer.current.disposed) {
            polySynthPlayer.current = new Tone.PolySynth(Tone.Synth, polySynthOptions).toDestination();
          } else {
            if(polySynthPlayer.current && !polySynthPlayer.current.disposed){
                polySynthPlayer.current.set(polySynthOptions);
            }
          }
          if(polySynthPlayer.current && !polySynthPlayer.current.disposed){
             polySynthPlayer.current.volume.value = finalGainValue;
             Tone.Transport.scheduleOnce((time) => {
                if (polySynthPlayer.current && !polySynthPlayer.current.disposed) {
                    polySynthPlayer.current.triggerAttack(notes, time);
                }
             }, scheduleDelay);
          }
        } else { // Single tone
          const synthOptions: Partial<Tone.SynthOptions> = { oscillator: { type: oscType as Tone.ToneOscillatorType } };
          if (envelope) {
            synthOptions.envelope = envelope;
          }

          if (!tonePlayer.current || tonePlayer.current.disposed) {
            tonePlayer.current = new Tone.Synth(synthOptions).toDestination();
          } else {
             if(tonePlayer.current && !tonePlayer.current.disposed) {
                const currentOscType = tonePlayer.current.oscillator.type;
                const currentEnv = tonePlayer.current.get().envelope as Tone.EnvelopeOptions;
                
                let optionsChanged = currentOscType !== oscType;
                if (envelope) {
                    if (!currentEnv || Object.keys(envelope).some(key => envelope[key as keyof Tone.EnvelopeOptions] !== currentEnv[key as keyof Tone.EnvelopeOptions])) {
                        optionsChanged = true;
                    }
                }
                if (optionsChanged) {
                    tonePlayer.current.set(synthOptions);
                }
             }
          }
          if(tonePlayer.current && !tonePlayer.current.disposed) {
            tonePlayer.current.volume.value = finalGainValue;
            Tone.Transport.scheduleOnce((time) => {
                if (tonePlayer.current && !tonePlayer.current.disposed) {
                    tonePlayer.current.triggerAttack(frequency || 440, time);
                }
            }, scheduleDelay);
          }
        }
        setIsPlaying(true);
        break;
      case 'binaural':
        const { baseFrequency = 100, beatFrequency = 8 } = selectedSoundscape.params;
        const freqLeft = baseFrequency - beatFrequency / 2;
        const freqRight = baseFrequency + beatFrequency / 2;
        const binauralScheduleDelay = Tone.Transport.now() + 0.05;


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
        
        const synthOptionsBinaural: Partial<Tone.SynthOptions> = { oscillator: { type: 'sine' as Tone.ToneOscillatorType }, envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 0.5 }};
        
        if (!tonePlayerLeft.current || tonePlayerLeft.current.disposed) tonePlayerLeft.current = new Tone.Synth(synthOptionsBinaural);
        if(tonePlayerLeft.current && !tonePlayerLeft.current.disposed && pannerL && !pannerL.disposed) {
            tonePlayerLeft.current.disconnect().connect(pannerL);
            tonePlayerLeft.current.volume.value = finalGainValue;
            Tone.Transport.scheduleOnce((time) => {
                if (tonePlayerLeft.current && !tonePlayerLeft.current.disposed) {
                    tonePlayerLeft.current.triggerAttack(freqLeft, time);
                }
            }, binauralScheduleDelay);
        }
        
        if (!tonePlayerRight.current || tonePlayerRight.current.disposed) tonePlayerRight.current = new Tone.Synth(synthOptionsBinaural);
        if(tonePlayerRight.current && !tonePlayerRight.current.disposed && pannerR && !pannerR.disposed) {
            tonePlayerRight.current.disconnect().connect(pannerR);
            tonePlayerRight.current.volume.value = finalGainValue;
             Tone.Transport.scheduleOnce((time) => {
                if (tonePlayerRight.current && !tonePlayerRight.current.disposed) {
                    tonePlayerRight.current.triggerAttack(freqRight, time);
                }
            }, binauralScheduleDelay);
        }
        
        setIsPlaying(true);
        break;
      case 'ocean':
        try {
            if (!activePatternElements.current.masterVolumeNode || activePatternElements.current.masterVolumeNode.disposed) {
                console.error("Master volume node not available for ocean soundscape.");
                cleanupPattern(); // Ensure cleanup if critical node is missing
                setIsPlaying(false);
                return;
            }

            const oceanNoise = new Tone.Noise("brown");
            const autoFilter = new Tone.AutoFilter(selectedSoundscape.params.autoFilter);
            
            oceanNoise.connect(autoFilter);
            autoFilter.connect(activePatternElements.current.masterVolumeNode);
            
            activePatternElements.current.noiseSource = oceanNoise;
            activePatternElements.current.effects.push(autoFilter);

            // Start nodes slightly in the future, on the transport timeline if possible
            const oceanStartTime = Tone.Transport.now() + 0.05;
             Tone.Transport.scheduleOnce((time) => {
                if (autoFilter && !autoFilter.disposed) autoFilter.start(time);
                if (oceanNoise && !oceanNoise.disposed) oceanNoise.start(time);
            }, oceanStartTime);
            
            setIsPlaying(true);
        } catch (e) {
            console.error("Error setting up ocean soundscape:", e);
            cleanupPattern();
            setIsPlaying(false);
        }
        break;
      case 'fireplace':
        const fireNoiseSynth = new Tone.NoiseSynth(selectedSoundscape.params.synthOptions);
        if (activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
            fireNoiseSynth.connect(activePatternElements.current.masterVolumeNode);
        } else {
            fireNoiseSynth.toDestination(); 
        }
        activePatternElements.current.synths.push(fireNoiseSynth);

        const crackleLoop = new Tone.Loop(time => {
            if (fireNoiseSynth && !fireNoiseSynth.disposed) {
                fireNoiseSynth.volume.value = finalGainValue - (Math.random() * 6);
                const randomOffset = 0.001 + (Math.random() * 0.049); 
                fireNoiseSynth.triggerAttackRelease("32n", time + randomOffset);
            }
        }, "16n").start(Tone.Transport.now() + 0.05); // Start loop slightly in future on transport

        crackleLoop.probability = 0.6;
        activePatternElements.current.loops.push(crackleLoop);
        
        setIsPlaying(true);
        break;
      case 'patternLoop':
        const { bpm, instruments, effects: patternEffectsParams } = selectedSoundscape.params;
        
        if (!activePatternElements.current.masterVolumeNode || activePatternElements.current.masterVolumeNode.disposed) {
            const fallbackMasterVol = new Tone.Volume(finalGainValue).toDestination();
            activePatternElements.current.effects.push(fallbackMasterVol);
            activePatternElements.current.masterVolumeNode = fallbackMasterVol;
        }

        Tone.Transport.bpm.value = bpm;

        instruments.forEach((instrumentDef: any) => {
          let synth: any;
          const synthOptionsResolved = instrumentDef.synthOptions || {};
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

          if (instrumentDef.pattern && instrumentDef.subdivision) {
            const seq = new Tone.Sequence((time, note) => {
              if (note && synth && !synth.disposed) synth.triggerAttackRelease(note, instrumentDef.duration || '8n', time);
            }, instrumentDef.pattern, instrumentDef.subdivision).start(Tone.Transport.now() + 0.05);
            activePatternElements.current.sequences.push(seq);
          } else if (instrumentDef.sequence) { 
            const part = new Tone.Part((time, value) => {
              if(synth && !synth.disposed) synth.triggerAttackRelease(value.notes, value.duration, time);
            }, instrumentDef.sequence).start(Tone.Transport.now() + 0.05);
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

  }, [isReady, volume, stopSound, cleanupPattern]);
  
  useEffect(() => {
    if (isPlaying && isReady && lastPlayedSoundscapeIdRef.current) {
      const currentSoundscapeId = lastPlayedSoundscapeIdRef.current;
      const selectedSound = SOUNDSCAPE_OPTIONS.find(s => s.id === currentSoundscapeId);
      
      if (!selectedSound) return;

      const soundscapeVolAdj = selectedSound.params?.volumeAdjustment || 0;
      const baseGain = Tone.gainToDb(volume * 0.5); 
      const finalGain = baseGain + soundscapeVolAdj; 

      const activeType = activePlayerType.current;

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
  }, [volume, isPlaying, isReady]);

  return { playSound, stopSound, isReady, isPlaying };
}

    