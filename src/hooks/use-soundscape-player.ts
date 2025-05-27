
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import type { SoundscapeOption } from '@/lib/types';
import { SOUNDSCAPE_OPTIONS } from '@/lib/constants';

interface UseSoundscapePlayerProps {
  volume: number; // 0-1
}

interface ActivePatternElements {
  synths: Tone.Synth<any>[]; // Using Tone.Synth<any> as a base type for various synths
  sequences: Tone.Sequence[];
  parts: Tone.Part[];
  effects: (Tone.Reverb | Tone.Volume)[]; // Add other effect types if needed
  masterVolumeNode?: Tone.Volume;
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
  
  const noisePlayer = useRef<Tone.Noise | null>(null);
  const tonePlayer = useRef<Tone.Synth | null>(null); 
  const polySynthPlayer = useRef<Tone.PolySynth | null>(null); 
  const tonePlayerLeft = useRef<Tone.Synth | null>(null); 
  const tonePlayerRight = useRef<Tone.Synth | null>(null); 
  const pannerLeft = useRef<Tone.Panner | null>(null);
  const pannerRight = useRef<Tone.Panner | null>(null);

  const activePatternElements = useRef<ActivePatternElements>({ synths: [], sequences: [], parts: [], effects: [] });
  const activePlayerType = useRef<'noise' | 'tone' | 'polysynth' | 'binaural' | 'patternLoop' | null>(null);
  const lastPlayedSoundscapeIdRef = useRef<string | undefined>(undefined);

  const cleanupPattern = useCallback(() => {
    // 1. Stop the main transport. This should also stop scheduled parts/sequences.
    Tone.Transport.stop();

    // 2. Clear and dispose individual parts and sequences
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

    // 3. Dispose of synthesizers
    activePatternElements.current.synths.forEach(synth => {
      if (synth && !synth.disposed) {
        synth.dispose();
      }
    });

    // 4. Dispose of effects
    activePatternElements.current.effects.forEach(effect => {
      if (effect && typeof effect.dispose === 'function' && !(effect as any).disposed) {
        effect.dispose();
      }
    });
    
    // Ensure masterVolumeNode is also explicitly disposed if it exists and isn't already handled
    if (activePatternElements.current.masterVolumeNode && 
        typeof activePatternElements.current.masterVolumeNode.dispose === 'function' &&
        !activePatternElements.current.masterVolumeNode.disposed) {
        try {
            activePatternElements.current.masterVolumeNode.dispose();
        } catch (e) {
            // console.warn("Redundant disposal attempt for masterVolumeNode during cleanupPattern:", e);
        }
    }
    
    // 5. Cancel any remaining events on the transport itself after parts/sequences are handled
    Tone.Transport.cancel(0); 

    activePatternElements.current = { synths: [], sequences: [], parts: [], effects: [] }; // Reset the ref
  }, []);


  useEffect(() => {
    const initTone = async () => {
      await Tone.start();
      setIsReady(true);
      console.log("AudioContext started, Tone.js ready.");
    };

    if (typeof window !== 'undefined') {
      if (Tone.context.state !== 'running') {
        // Try to start, but don't block if it needs a user gesture for the first time.
        // Subsequent calls from playSound will attempt Tone.start() again.
        initTone().catch(err => console.warn("Initial Tone.start() attempt might need user gesture:", err));
      } else {
        setIsReady(true);
      }
    }
    
    return () => {
      // General cleanup on component unmount
      if (noisePlayer.current && !noisePlayer.current.disposed) {
        noisePlayer.current.stop();
        noisePlayer.current.dispose();
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
      if (pannerLeft.current && !pannerLeft.current.disposed) pannerLeft.current.dispose();
      if (pannerRight.current && !pannerRight.current.disposed) pannerRight.current.dispose();
      
      cleanupPattern(); // Ensure pattern elements are cleaned up too
      
      noisePlayer.current = null;
      tonePlayer.current = null;
      polySynthPlayer.current = null;
      tonePlayerLeft.current = null;
      tonePlayerRight.current = null;
      pannerLeft.current = null;
      pannerRight.current = null;

      activePlayerType.current = null;
      lastPlayedSoundscapeIdRef.current = undefined;
    };
  }, [cleanupPattern]);

  const stopSound = useCallback(() => {
    if (noisePlayer.current && !noisePlayer.current.disposed && (activePlayerType.current === 'noise' || !activePlayerType.current)) {
      noisePlayer.current.stop();
    }
    if (tonePlayer.current && !tonePlayer.current.disposed && (activePlayerType.current === 'tone' || !activePlayerType.current)) {
      tonePlayer.current.triggerRelease();
    }
    if (polySynthPlayer.current && !polySynthPlayer.current.disposed && (activePlayerType.current === 'polysynth' || !activePlayerType.current)) {
      polySynthPlayer.current.releaseAll();
    }
    if (activePlayerType.current === 'binaural' || !activePlayerType.current) {
        if (tonePlayerLeft.current && !tonePlayerLeft.current.disposed) tonePlayerLeft.current.triggerRelease();
        if (tonePlayerRight.current && !tonePlayerRight.current.disposed) tonePlayerRight.current.triggerRelease();
    }
    if (activePlayerType.current === 'patternLoop') {
      cleanupPattern();
    }
    setIsPlaying(false);
  }, [cleanupPattern]);

  const playSound = useCallback(async (soundscapeId?: string) => {
    if (!isReady) {
      console.warn("Sound player not ready yet. Attempting to start Tone.js...");
      try {
        await Tone.start();
        setIsReady(true);
        console.log("Tone.js started by playSound.");
      } catch (e) {
        console.error("Failed to start Tone.js in playSound, requires user interaction:", e);
        return; // Exit if Tone.js cannot be started
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
      console.warn(`Soundscape with id ${soundscapeId} not found.`);
      stopSound();
      activePlayerType.current = null;
      lastPlayedSoundscapeIdRef.current = undefined;
      return;
    }
    
    if (Tone.context.state !== 'running') {
        try {
          await Tone.start();
          console.log("AudioContext re-started by playSound");
        } catch (e) {
          console.error("Failed to re-start AudioContext in playSound:", e);
          setIsReady(false); 
          return;
        }
    }

    stopSound(); 

    const baseGainValue = Tone.gainToDb(volume * 0.5); 
    const soundscapeVolumeAdjustment = selectedSoundscape.params?.volumeAdjustment || selectedSoundscape.params?.volume || 0;
    const finalGainValue = baseGainValue + soundscapeVolumeAdjustment;

    lastPlayedSoundscapeIdRef.current = soundscapeId; 

    switch (selectedSoundscape.type) {
      case 'noise':
        if (selectedSoundscape.params.type !== 'off') {
          if (!noisePlayer.current || noisePlayer.current.disposed) {
            noisePlayer.current = new Tone.Noise(selectedSoundscape.params.type).toDestination();
          } else {
            noisePlayer.current.type = selectedSoundscape.params.type;
          }
          noisePlayer.current.volume.value = finalGainValue;
          noisePlayer.current.start();
          activePlayerType.current = 'noise';
          setIsPlaying(true);
        }
        break;
      case 'tone':
        const { notes, frequency, type: oscType = 'sine', envelope } = selectedSoundscape.params;
        if (notes && Array.isArray(notes)) { 
          if (!polySynthPlayer.current || polySynthPlayer.current.disposed) {
            // @ts-ignore PolySynth can take specific synth type as first arg
            polySynthPlayer.current = new Tone.PolySynth(Tone.Synth, {
              oscillator: { type: oscType },
              envelope: envelope || { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
            }).toDestination();
          } else {
            polySynthPlayer.current.set({ oscillator: { type: oscType }, envelope });
          }
          polySynthPlayer.current.volume.value = finalGainValue;
          polySynthPlayer.current.triggerAttack(notes);
          activePlayerType.current = 'polysynth';
        } else { 
          if (!tonePlayer.current || tonePlayer.current.disposed) {
            tonePlayer.current = new Tone.Synth({ oscillator: { type: oscType }, envelope }).toDestination();
          } else {
            tonePlayer.current.set({ oscillator: { type: oscType }, envelope });
          }
          tonePlayer.current.volume.value = finalGainValue;
          tonePlayer.current.triggerAttack(frequency || 440);
          activePlayerType.current = 'tone';
        }
        setIsPlaying(true);
        break;
      case 'binaural':
        const { baseFrequency = 100, beatFrequency = 8 } = selectedSoundscape.params;
        const freqLeft = baseFrequency - beatFrequency / 2;
        const freqRight = baseFrequency + beatFrequency / 2;

        if (!pannerLeft.current || pannerLeft.current.disposed) pannerLeft.current = new Tone.Panner(-1).toDestination();
        if (!pannerRight.current || pannerRight.current.disposed) pannerRight.current = new Tone.Panner(1).toDestination();
        
        const synthOptionsBinaural = { oscillator: { type: 'sine' }, envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 0.5 }};
        
        if (!tonePlayerLeft.current || tonePlayerLeft.current.disposed) tonePlayerLeft.current = new Tone.Synth(synthOptionsBinaural);
        tonePlayerLeft.current.disconnect().connect(pannerLeft.current);
        tonePlayerLeft.current.volume.value = finalGainValue;
        tonePlayerLeft.current.triggerAttack(freqLeft);
        
        if (!tonePlayerRight.current || tonePlayerRight.current.disposed) tonePlayerRight.current = new Tone.Synth(synthOptionsBinaural);
        tonePlayerRight.current.disconnect().connect(pannerRight.current);
        tonePlayerRight.current.volume.value = finalGainValue;
        tonePlayerRight.current.triggerAttack(freqRight);
        
        activePlayerType.current = 'binaural';
        setIsPlaying(true);
        break;
      case 'patternLoop':
        const { bpm, instruments, effects: patternEffectsParams } = selectedSoundscape.params;
        
        // Create a new master volume node for this pattern instance
        const patternMasterVol = new Tone.Volume(finalGainValue).toDestination();
        activePatternElements.current.effects.push(patternMasterVol); // Add to effects for disposal
        activePatternElements.current.masterVolumeNode = patternMasterVol;

        Tone.Transport.bpm.value = bpm;

        instruments.forEach((instrument: any) => {
          let synth: any;
          switch(instrument.synthType) {
            case 'MembraneSynth':
              synth = new Tone.MembraneSynth(instrument.synthOptions);
              break;
            case 'NoiseSynth':
              synth = new Tone.NoiseSynth(instrument.synthOptions);
              break;
            case 'PolySynth':
            default:
              // @ts-ignore PolySynth can take specific synth type as first arg
              synth = new Tone.PolySynth(Tone.Synth, instrument.synthOptions); 
              break;
          }
          // Connect synth to this pattern's master volume node
          synth.connect(patternMasterVol); 
          activePatternElements.current.synths.push(synth);

          if (instrument.pattern && instrument.subdivision) {
            const seq = new Tone.Sequence((time, note) => {
              if (note && synth && !synth.disposed) synth.triggerAttackRelease(note, instrument.duration || '8n', time);
            }, instrument.pattern, instrument.subdivision).start(0);
            activePatternElements.current.sequences.push(seq);
          } else if (instrument.sequence) {
            const part = new Tone.Part((time, value) => {
              if(synth && !synth.disposed) synth.triggerAttackRelease(value.notes, value.duration, time);
            }, instrument.sequence).start(0);
            activePatternElements.current.parts.push(part);
          }
        });
        
        if (patternEffectsParams?.reverb && activePatternElements.current.masterVolumeNode) {
           const reverb = new Tone.Reverb(patternEffectsParams.reverb);
           // Disconnect master volume from main destination, route through reverb
           activePatternElements.current.masterVolumeNode.disconnect(Tone.Destination);
           activePatternElements.current.masterVolumeNode.connect(reverb);
           reverb.toDestination(); // Reverb then connects to main destination
           activePatternElements.current.effects.push(reverb); // Add reverb for disposal
        }

        Tone.Transport.start();
        activePlayerType.current = 'patternLoop';
        setIsPlaying(true);
        break;
      default:
        console.warn(`Soundscape type '${selectedSoundscape.type}' not implemented or 'off'.`);
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

      const soundscapeVolAdj = selectedSound.params?.volumeAdjustment || selectedSound.params?.volume || 0;
      const baseGainValue = Tone.gainToDb(volume * 0.5);
      const finalGain = baseGainValue + soundscapeVolAdj;

      if (activePlayerType.current === 'noise' && noisePlayer.current && !noisePlayer.current.disposed) {
        noisePlayer.current.volume.linearRampTo(finalGain, 0.1);
      } else if (activePlayerType.current === 'tone' && tonePlayer.current && !tonePlayer.current.disposed) {
        tonePlayer.current.volume.linearRampTo(finalGain, 0.1);
      } else if (activePlayerType.current === 'polysynth' && polySynthPlayer.current && !polySynthPlayer.current.disposed) {
        polySynthPlayer.current.volume.linearRampTo(finalGain, 0.1);
      } else if (activePlayerType.current === 'binaural' && tonePlayerLeft.current && !tonePlayerLeft.current.disposed && tonePlayerRight.current && !tonePlayerRight.current.disposed) {
        tonePlayerLeft.current.volume.linearRampTo(finalGain, 0.1);
        tonePlayerRight.current.volume.linearRampTo(finalGain, 0.1);
      } else if (activePlayerType.current === 'patternLoop' && activePatternElements.current.masterVolumeNode && !activePatternElements.current.masterVolumeNode.disposed) {
        activePatternElements.current.masterVolumeNode.volume.linearRampTo(finalGain, 0.1);
      }
    }
  }, [volume, isPlaying, isReady]);

  return { playSound, stopSound, isReady, isPlaying };
}

