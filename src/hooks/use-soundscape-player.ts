
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
  effects: (Tone.Reverb | Tone.Volume | Tone.AutoFilter | Tone.Panner | Tone.FeedbackDelay | Tone.Chorus | Tone.Filter | Tone.LFO)[];
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
    Tone.Transport.stop(); 

    activePatternElements.current.loops.forEach(loop => {
      if (loop && !loop.disposed) {
        loop.dispose();
      }
    });
    activePatternElements.current.parts.forEach(part => {
      if (part && !part.disposed) {
        part.clear();
        part.dispose();
      }
    });
    activePatternElements.current.sequences.forEach(seq => {
      if (seq && !seq.disposed) {
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
        if (effect instanceof Tone.AutoFilter && !effect.disposed) (effect as Tone.AutoFilter).stop(0);
        // LFO is not explicitly stopped here as it's usually tied to a param that stops with the node.
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
    if (typeof window !== 'undefined') {
      if (Tone.context.state !== 'running') {
        // Defer Tone.start()
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
      tonePlayer.current.dispose();
      tonePlayer.current = null;
    }
    if (polySynthPlayer.current && !polySynthPlayer.current.disposed && activePlayerType.current === 'polysynth') {
      polySynthPlayer.current.releaseAll(now);
      polySynthPlayer.current.dispose();
      polySynthPlayer.current = null;
    }
    if (activePlayerType.current === 'binaural') {
        if (tonePlayerLeft.current && !tonePlayerLeft.current.disposed) {
          tonePlayerLeft.current.triggerRelease(now);
          tonePlayerLeft.current.dispose();
          tonePlayerLeft.current = null;
        }
        if (tonePlayerRight.current && !tonePlayerRight.current.disposed) {
          tonePlayerRight.current.triggerRelease(now);
          tonePlayerRight.current.dispose();
          tonePlayerRight.current = null;
        }
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

    // Transport management for pattern-based sounds
    const transportSensitiveTypes = ['patternLoop', 'ocean', 'fireplace'];
    if (transportSensitiveTypes.includes(selectedSoundscape.type)) {
        if (Tone.Transport.state !== "started") {
            Tone.Transport.start(Tone.now() + 0.05); 
        }
        if (!activePatternElements.current.masterVolumeNode || activePatternElements.current.masterVolumeNode.disposed) {
            const newMasterVol = new Tone.Volume(finalGainValue).toDestination();
            activePatternElements.current.masterVolumeNode = newMasterVol;
            activePatternElements.current.effects.push(newMasterVol);
        } else {
            activePatternElements.current.masterVolumeNode.volume.linearRampTo(finalGainValue, 0.1);
        }
    }
    
    const attackTime = Tone.now() + 0.05; // Consistent attack time for direct synth triggers

    switch (selectedSoundscape.type) {
      case 'noise':
        if (selectedSoundscape.params.type !== 'off') {
          if (!generalNoisePlayer.current || generalNoisePlayer.current.disposed) {
            generalNoisePlayer.current = new Tone.Noise(selectedSoundscape.params.type).toDestination();
          } else {
            generalNoisePlayer.current.type = selectedSoundscape.params.type;
          }
          generalNoisePlayer.current.volume.value = finalGainValue;
          generalNoisePlayer.current.start(attackTime); 
          setIsPlaying(true);
        }
        break;
      case 'tone':
        const { notes, frequency, type: oscType = 'sine', envelope } = selectedSoundscape.params;
        
        if (notes && Array.isArray(notes)) {
          activePlayerType.current = 'polysynth';
          const polySynthOptions: Tone.PolySynthOptions<Tone.Synth<Tone.SynthOptions>> = {
             oscillator: { type: oscType as Tone.ToneOscillatorType }
          };
          if (envelope && typeof envelope === 'object') { 
            polySynthOptions.envelope = envelope;
          } else {
            polySynthOptions.envelope = { attack: 0.01, decay: 0.2, sustain: 0.5, release: 0.8 };
          }

          polySynthPlayer.current = new Tone.PolySynth(Tone.Synth, polySynthOptions).toDestination();
          polySynthPlayer.current.volume.value = finalGainValue;
          polySynthPlayer.current.triggerAttack(notes, attackTime);

        } else { 
          activePlayerType.current = 'tone';
          const synthOptions: Partial<Tone.SynthOptions> = { 
            oscillator: { type: oscType as Tone.ToneOscillatorType } 
          };
          if (envelope && typeof envelope === 'object') { 
            synthOptions.envelope = envelope;
          } else {
            synthOptions.envelope = { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 };
          }
          
          tonePlayer.current = new Tone.Synth(synthOptions).toDestination();
          tonePlayer.current.volume.value = finalGainValue;
          tonePlayer.current.triggerAttack(frequency || 440, attackTime);
        }
        setIsPlaying(true);
        break;
      case 'binaural':
        const { baseFrequency = 100, beatFrequency = 8 } = selectedSoundscape.params;
        const freqLeft = baseFrequency - beatFrequency / 2;
        const freqRight = baseFrequency + beatFrequency / 2;

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
        
        tonePlayerLeft.current = new Tone.Synth(synthOptionsBinaural);
        if(tonePlayerLeft.current && pannerL && !pannerL.disposed) { // Removed !synth.disposed checks here as they are new
            tonePlayerLeft.current.disconnect().connect(pannerL);
            tonePlayerLeft.current.volume.value = finalGainValue;
            tonePlayerLeft.current.triggerAttack(freqLeft, attackTime);
        }
        
        tonePlayerRight.current = new Tone.Synth(synthOptionsBinaural);
        if(tonePlayerRight.current && pannerR && !pannerR.disposed) { // Removed !synth.disposed checks here
            tonePlayerRight.current.disconnect().connect(pannerR);
            tonePlayerRight.current.volume.value = finalGainValue;
            tonePlayerRight.current.triggerAttack(freqRight, attackTime);
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
            activePatternElements.current.noiseSource = oceanNoise;

            const autoFilterParams = selectedSoundscape.params.autoFilter;
            const autoFilter = new Tone.AutoFilter({
                ...autoFilterParams,
                baseFrequency: autoFilterParams.baseFrequency || 200, 
            }).connect(activePatternElements.current.masterVolumeNode);
            activePatternElements.current.effects.push(autoFilter);
            
            oceanNoise.connect(autoFilter);
            
            // Use Tone.Transport.scheduleOnce for transport-synced starts
            const oceanScheduleTime = Tone.Transport.now() + 0.05; 
            Tone.Transport.scheduleOnce((transportTime) => { 
                if (autoFilter && !autoFilter.disposed) autoFilter.start(transportTime);
                if (oceanNoise && !oceanNoise.disposed) oceanNoise.start(transportTime);
            }, oceanScheduleTime);
            
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

        const crackleLoop = new Tone.Loop(transportTime => { 
            if (fireNoiseSynth && !fireNoiseSynth.disposed) {
                fireNoiseSynth.volume.value = finalGainValue - (Math.random() * 6);
                const randomOffset = 0.001 + (Math.random() * 0.049); 
                // Ensure triggerAttackRelease is scheduled on the transport time
                fireNoiseSynth.triggerAttackRelease("32n", transportTime + randomOffset);
            }
        }, "16n").start(Tone.Transport.now() + 0.05); 

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
          const synthOptionsResolved = {...instrumentDef.synthOptions}; // Clone to avoid modifying constants
          
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

          const patternScheduleTime = Tone.Transport.now() + 0.05; 

          if (instrumentDef.pattern && instrumentDef.subdivision) {
            const seq = new Tone.Sequence((transportTime, note) => {
              if (note && synth && !synth.disposed) synth.triggerAttackRelease(note, instrumentDef.duration || '8n', transportTime);
            }, instrumentDef.pattern, instrumentDef.subdivision).start(patternScheduleTime);
            activePatternElements.current.sequences.push(seq);
          } else if (instrumentDef.sequence) { 
            const part = new Tone.Part((transportTime, value) => {
              if(synth && !synth.disposed && value.notes) synth.triggerAttackRelease(value.notes, value.duration, transportTime);
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
