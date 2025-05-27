
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import type { SoundscapeOption } from '@/lib/types';
import { SOUNDSCAPE_OPTIONS } from '@/lib/constants';

interface UseSoundscapePlayerProps {
  volume: number; // 0-1
}

interface ActivePatternElements {
  synths: (Tone.Synth<any> | Tone.NoiseSynth | Tone.MembraneSynth | Tone.PluckSynth | Tone.PolySynth<any>)[];
  sequences: Tone.Sequence[];
  parts: Tone.Part[];
  loops: Tone.Loop[];
  effects: (Tone.Reverb | Tone.Volume | Tone.AutoFilter | Tone.LFO | Tone.Panner)[];
  masterVolumeNode?: Tone.Volume;
  noiseSource?: Tone.Noise; // For specific noise types like ocean
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
  
  const activePatternElements = useRef<ActivePatternElements>({ synths: [], sequences: [], parts: [], loops: [], effects: [] });
  const activePlayerType = useRef<'noise' | 'tone' | 'polysynth' | 'binaural' | 'patternLoop' | 'ocean' | 'fireplace' | null>(null);
  const lastPlayedSoundscapeIdRef = useRef<string | undefined>(undefined);

  const cleanupPattern = useCallback(() => {
    Tone.Transport.stop(); // Stop transport first

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
      if (effect && typeof effect.dispose === 'function' && !(effect as any).disposed) {
        if (typeof (effect as Tone.LFO).stop === 'function') (effect as Tone.LFO).stop(0);
        if (typeof (effect as Tone.AutoFilter).stop === 'function') (effect as Tone.AutoFilter).stop(0);
        effect.dispose();
      }
    });
    
    if (activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
        activePatternElements.current.masterVolumeNode.dispose();
    }
    
    Tone.Transport.cancel(0); 
    activePatternElements.current = { synths: [], sequences: [], parts: [], loops: [], effects: [], noiseSource: undefined, masterVolumeNode: undefined };
  }, []);


  useEffect(() => {
    const initTone = async () => {
      await Tone.start();
      setIsReady(true);
      console.log("AudioContext started, Tone.js ready.");
    };

    if (typeof window !== 'undefined') {
      if (Tone.context.state !== 'running') {
        // No need to call initTone() here, Tone.start() will be called on first playSound
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
        tonePlayerLeft.current.triggerRelease();
        tonePlayerLeft.current.dispose();
      }
      if (tonePlayerRight.current && !tonePlayerRight.current.disposed) {
        tonePlayerRight.current.triggerRelease();
        tonePlayerRight.current.dispose();
      }
      
      activePatternElements.current.effects.forEach(effect => {
        if (effect && !effect.disposed && typeof (effect as any).dispose === 'function') {
          effect.dispose();
        }
      });
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
    if (generalNoisePlayer.current && !generalNoisePlayer.current.disposed && activePlayerType.current === 'noise') {
      generalNoisePlayer.current.stop();
    }
    if (tonePlayer.current && !tonePlayer.current.disposed && activePlayerType.current === 'tone') {
      tonePlayer.current.triggerRelease();
    }
    if (polySynthPlayer.current && !polySynthPlayer.current.disposed && activePlayerType.current === 'polysynth') {
      polySynthPlayer.current.releaseAll();
    }
    if (activePlayerType.current === 'binaural') {
        if (tonePlayerLeft.current && !tonePlayerLeft.current.disposed) tonePlayerLeft.current.triggerRelease();
        if (tonePlayerRight.current && !tonePlayerRight.current.disposed) tonePlayerRight.current.triggerRelease();
    }
    if (['patternLoop', 'ocean', 'fireplace'].includes(activePlayerType.current || '')) {
      cleanupPattern();
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
          setIsReady(false); 
          return;
        }
    }

    stopSound(); 

    const baseGainValue = Tone.gainToDb(volume * 0.5); 
    const soundscapeVolumeAdjustment = selectedSoundscape.params?.volumeAdjustment || 0;
    const finalGainValue = baseGainValue + soundscapeVolumeAdjustment;

    lastPlayedSoundscapeIdRef.current = soundscapeId; 
    activePlayerType.current = selectedSoundscape.type as any;

    if (['patternLoop', 'ocean', 'fireplace'].includes(selectedSoundscape.type)) {
        const patternMasterVol = new Tone.Volume(finalGainValue).toDestination();
        activePatternElements.current.effects.push(patternMasterVol);
        activePatternElements.current.masterVolumeNode = patternMasterVol;
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
          generalNoisePlayer.current.start();
          setIsPlaying(true);
        }
        break;
      case 'tone':
        const { notes, frequency, type: oscType = 'sine', envelope } = selectedSoundscape.params;
        if (notes && Array.isArray(notes)) { 
          if (!polySynthPlayer.current || polySynthPlayer.current.disposed) {
            polySynthPlayer.current = new Tone.PolySynth(Tone.Synth, {
              oscillator: { type: oscType as Tone.ToneOscillatorType },
              envelope: envelope || { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
            }).toDestination();
          } else {
            if(polySynthPlayer.current && !polySynthPlayer.current.disposed){
                polySynthPlayer.current.set({ oscillator: { type: oscType as Tone.ToneOscillatorType }, envelope });
            }
          }
          if(polySynthPlayer.current && !polySynthPlayer.current.disposed){
             polySynthPlayer.current.volume.value = finalGainValue;
             polySynthPlayer.current.triggerAttack(notes);
          }
          activePlayerType.current = 'polysynth'; 
        } else { 
          if (!tonePlayer.current || tonePlayer.current.disposed) {
            tonePlayer.current = new Tone.Synth({ oscillator: { type: oscType as Tone.ToneOscillatorType }, envelope }).toDestination();
          } else {
             if(tonePlayer.current && !tonePlayer.current.disposed) {
                tonePlayer.current.set({ oscillator: { type: oscType as Tone.ToneOscillatorType }, envelope });
             }
          }
          if(tonePlayer.current && !tonePlayer.current.disposed) {
            tonePlayer.current.volume.value = finalGainValue;
            tonePlayer.current.triggerAttack(frequency || 440);
          }
        }
        setIsPlaying(true);
        break;
      case 'binaural':
        const { baseFrequency = 100, beatFrequency = 8 } = selectedSoundscape.params;
        const freqLeft = baseFrequency - beatFrequency / 2;
        const freqRight = baseFrequency + beatFrequency / 2;

        const pannerL = new Tone.Panner(-1).toDestination();
        const pannerR = new Tone.Panner(1).toDestination();
        activePatternElements.current.effects.push(pannerL, pannerR);
        
        const synthOptionsBinaural = { oscillator: { type: 'sine' as Tone.ToneOscillatorType }, envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 0.5 }};
        
        if (!tonePlayerLeft.current || tonePlayerLeft.current.disposed) tonePlayerLeft.current = new Tone.Synth(synthOptionsBinaural);
        if(tonePlayerLeft.current && !tonePlayerLeft.current.disposed) {
            tonePlayerLeft.current.disconnect().connect(pannerL);
            tonePlayerLeft.current.volume.value = finalGainValue;
            tonePlayerLeft.current.triggerAttack(freqLeft);
        }
        
        if (!tonePlayerRight.current || tonePlayerRight.current.disposed) tonePlayerRight.current = new Tone.Synth(synthOptionsBinaural);
        if(tonePlayerRight.current && !tonePlayerRight.current.disposed) {
            tonePlayerRight.current.disconnect().connect(pannerR);
            tonePlayerRight.current.volume.value = finalGainValue;
            tonePlayerRight.current.triggerAttack(freqRight);
        }
        
        setIsPlaying(true);
        break;
      case 'ocean':
        try {
            const oceanNoise = new Tone.Noise("brown");
            const autoFilter = new Tone.AutoFilter({
                frequency: "4m", // Modulating frequency for the filter's LFO
                baseFrequency: 100, // Starting base frequency of the filter
                octaves: 3, // Range of the filter sweep
                filter: { type: "lowpass", rolloff: -12, Q: 1 }
            });

            const lfo = new Tone.LFO({
                frequency: "8m", // LFO frequency - how fast the baseFrequency of AutoFilter sweeps
                min: 200,        // Min value for the AutoFilter's baseFrequency
                max: 1000,       // Max value for the AutoFilter's baseFrequency
                amplitude: 0.5   // Modulation depth for the LFO
            });

            // Connect the audio graph
            oceanNoise.connect(autoFilter);
            if (activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
                autoFilter.connect(activePatternElements.current.masterVolumeNode);
            } else {
                autoFilter.toDestination(); // Fallback if masterVolumeNode is not available
            }
            
            // Critical: Ensure autoFilter.baseFrequency is a valid Signal object before connecting LFO
            if (autoFilter.baseFrequency && typeof autoFilter.baseFrequency.connect === 'function') {
                 lfo.connect(autoFilter.baseFrequency);
            } else {
                console.error("autoFilter.baseFrequency is not a connectable Signal for LFO.");
                // Fallback or skip LFO connection if baseFrequency is not a valid Signal.
                // This prevents the error but the LFO modulation won't occur.
            }

            // Store nodes for cleanup
            activePatternElements.current.noiseSource = oceanNoise;
            activePatternElements.current.effects.push(autoFilter, lfo);

            // Start nodes
            autoFilter.start(); // Start the AutoFilter's internal LFO (if any) and make it process audio
            lfo.start();      // Start the external LFO
            oceanNoise.start(); // Start producing noise

            if (Tone.Transport.state !== "started") {
                Tone.Transport.start(); // Ensure transport is running for LFOs/AutoFilters that might sync to it
            }
            setIsPlaying(true);
        } catch (e) {
            console.error("Error setting up ocean soundscape:", e);
            // Ensure cleanup if setup fails
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
                const randomOffset = 0.001 + (Math.random() * 0.049); // e.g. 0.001s to 0.05s
                fireNoiseSynth.triggerAttackRelease("32n", time + randomOffset);
            }
        }, "16n").start(0); 

        crackleLoop.probability = 0.6; 
        activePatternElements.current.loops.push(crackleLoop);
        
        if (Tone.Transport.state !== "started") {
            Tone.Transport.start();
        }
        setIsPlaying(true);
        break;
      case 'patternLoop':
        const { bpm, instruments, effects: patternEffectsParams } = selectedSoundscape.params;
        
        if (!activePatternElements.current.masterVolumeNode) {
            const fallbackMasterVol = new Tone.Volume(finalGainValue).toDestination();
            activePatternElements.current.effects.push(fallbackMasterVol);
            activePatternElements.current.masterVolumeNode = fallbackMasterVol;
        }

        Tone.Transport.bpm.value = bpm;

        instruments.forEach((instrumentDef: any) => {
          let synth: any;
          switch(instrumentDef.synthType) {
            case 'MembraneSynth': synth = new Tone.MembraneSynth(instrumentDef.synthOptions); break;
            case 'NoiseSynth': synth = new Tone.NoiseSynth(instrumentDef.synthOptions); break;
            case 'PluckSynth': synth = new Tone.PluckSynth(instrumentDef.synthOptions); break;
            case 'PolySynth': default: synth = new Tone.PolySynth(Tone.Synth, instrumentDef.synthOptions); break;
            case 'Synth': synth = new Tone.Synth(instrumentDef.synthOptions); break;
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
            }, instrumentDef.pattern, instrumentDef.subdivision).start(0);
            activePatternElements.current.sequences.push(seq);
          } else if (instrumentDef.sequence) {
            const part = new Tone.Part((time, value) => {
              if(synth && !synth.disposed) synth.triggerAttackRelease(value.notes, value.duration, time);
            }, instrumentDef.sequence).start(0);
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

        if (Tone.Transport.state !== "started") {
             Tone.Transport.start();
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
      const baseGainValue = Tone.gainToDb(volume * 0.5);
      const finalGain = baseGainValue + soundscapeVolAdj;

      const activeType = activePlayerType.current;

      if (activeType === 'noise' && generalNoisePlayer.current && !generalNoisePlayer.current.disposed) {
        generalNoisePlayer.current.volume.linearRampTo(finalGain, 0.1);
      } else if (activeType === 'tone' && tonePlayer.current && !tonePlayer.current.disposed) {
        tonePlayer.current.volume.linearRampTo(finalGain, 0.1);
      } else if (activeType === 'polysynth' && polySynthPlayer.current && !polySynthPlayer.current.disposed) {
        polySynthPlayer.current.volume.linearRampTo(finalGain, 0.1);
      } else if (activeType === 'binaural' && tonePlayerLeft.current && !tonePlayerLeft.current.disposed && tonePlayerRight.current && !tonePlayerRight.current.disposed) {
        tonePlayerLeft.current.volume.linearRampTo(finalGain, 0.1);
        tonePlayerRight.current.volume.linearRampTo(finalGain, 0.1);
      } else if (['patternLoop', 'ocean', 'fireplace'].includes(activeType || '') && activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
        activePatternElements.current.masterVolumeNode.volume.linearRampTo(finalGain, 0.1);
      }
    }
  }, [volume, isPlaying, isReady]);

  return { playSound, stopSound, isReady, isPlaying };
}

