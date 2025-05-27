
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

  const cleanupPattern = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.cancel(0); // Clear all scheduled events

    activePatternElements.current.sequences.forEach(seq => {
      seq.stop();
      seq.clear(); // Clear events from sequence
      seq.dispose();
    });
    activePatternElements.current.parts.forEach(part => {
      part.stop();
      part.clear(); // Clear events from part
      part.dispose();
    });
    activePatternElements.current.synths.forEach(synth => synth.dispose());
    activePatternElements.current.effects.forEach(effect => effect.dispose());
    
    activePatternElements.current = { synths: [], sequences: [], parts: [], effects: [] };
  }, []);


  useEffect(() => {
    const initTone = async () => {
      await Tone.start();
      setIsReady(true);
      console.log("AudioContext started, Tone.js ready.");
    };

    if (typeof window !== 'undefined') {
      if (Tone.context.state !== 'running') {
        initTone().catch(err => console.warn("Tone.start() might need user gesture:", err));
      } else {
        setIsReady(true);
      }
    }
    
    return () => {
      if (noisePlayer.current) {
        noisePlayer.current.stop();
        noisePlayer.current.dispose();
        noisePlayer.current = null;
      }
      if (tonePlayer.current) {
        tonePlayer.current.triggerRelease();
        tonePlayer.current.dispose();
        tonePlayer.current = null;
      }
      if (polySynthPlayer.current) {
        polySynthPlayer.current.releaseAll();
        polySynthPlayer.current.dispose();
        polySynthPlayer.current = null;
      }
      if (tonePlayerLeft.current) {
        tonePlayerLeft.current.triggerRelease();
        tonePlayerLeft.current.dispose();
        tonePlayerLeft.current = null;
      }
      if (tonePlayerRight.current) {
        tonePlayerRight.current.triggerRelease();
        tonePlayerRight.current.dispose();
        tonePlayerRight.current = null;
      }
      if (pannerLeft.current) pannerLeft.current.dispose();
      if (pannerRight.current) pannerRight.current.dispose();
      
      cleanupPattern();
      activePlayerType.current = null;
    };
  }, [cleanupPattern]);

  const stopSound = useCallback(() => {
    if (noisePlayer.current && (activePlayerType.current === 'noise' || !activePlayerType.current)) {
      noisePlayer.current.stop();
    }
    if (tonePlayer.current && (activePlayerType.current === 'tone' || !activePlayerType.current)) {
      tonePlayer.current.triggerRelease();
    }
    if (polySynthPlayer.current && (activePlayerType.current === 'polysynth' || !activePlayerType.current)) {
      polySynthPlayer.current.releaseAll();
    }
    if (activePlayerType.current === 'binaural' || !activePlayerType.current) {
        if (tonePlayerLeft.current) tonePlayerLeft.current.triggerRelease();
        if (tonePlayerRight.current) tonePlayerRight.current.triggerRelease();
    }
    if (activePlayerType.current === 'patternLoop') {
      cleanupPattern();
    }
    setIsPlaying(false);
    // Do not reset activePlayerType.current here, playSound will set it.
  }, [cleanupPattern]);

  const playSound = useCallback(async (soundscapeId?: string) => {
    if (!isReady || !soundscapeId || soundscapeId === 'none') {
      stopSound();
      activePlayerType.current = null;
      return;
    }

    const selectedSoundscape = SOUNDSCAPE_OPTIONS.find(s => s.id === soundscapeId);
    if (!selectedSoundscape) {
      stopSound();
      activePlayerType.current = null;
      return;
    }
    
    if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log("AudioContext started by playSound");
    }

    stopSound(); // Stop any currently playing sound before starting a new one

    const baseGainValue = Tone.gainToDb(volume * 0.5); 
    const soundscapeVolumeAdjustment = selectedSoundscape.params?.volumeAdjustment || selectedSoundscape.params?.volume || 0;
    const finalGainValue = baseGainValue + soundscapeVolumeAdjustment;

    switch (selectedSoundscape.type) {
      case 'noise':
        if (selectedSoundscape.params.type !== 'off') {
          if (!noisePlayer.current) {
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
          if (!polySynthPlayer.current) {
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
          if (!tonePlayer.current) {
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
        if (!pannerLeft.current) pannerLeft.current = new Tone.Panner(-1).toDestination();
        if (!pannerRight.current) pannerRight.current = new Tone.Panner(1).toDestination();
        const synthOptionsBinaural = { oscillator: { type: 'sine' }, envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 0.5 }};
        if (!tonePlayerLeft.current) tonePlayerLeft.current = new Tone.Synth(synthOptionsBinaural);
        tonePlayerLeft.current.disconnect().connect(pannerLeft.current);
        tonePlayerLeft.current.volume.value = finalGainValue;
        tonePlayerLeft.current.triggerAttack(freqLeft);
        if (!tonePlayerRight.current) tonePlayerRight.current = new Tone.Synth(synthOptionsBinaural);
        tonePlayerRight.current.disconnect().connect(pannerRight.current);
        tonePlayerRight.current.volume.value = finalGainValue;
        tonePlayerRight.current.triggerAttack(freqRight);
        activePlayerType.current = 'binaural';
        setIsPlaying(true);
        break;
      case 'patternLoop':
        const { bpm, instruments, effects: patternEffectsParams, volumeAdjustment: patternVolAdj } = selectedSoundscape.params;
        
        const patternMasterVol = new Tone.Volume(0).toDestination(); // Initial volume set by effect update
        activePatternElements.current.effects.push(patternMasterVol);
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
            default: // Default to PolySynth or handle other specific types
              // @ts-ignore PolySynth can take specific synth type as first arg
              synth = new Tone.PolySynth(Tone.Synth, instrument.synthOptions); 
              break;
          }
          synth.connect(patternMasterVol);
          activePatternElements.current.synths.push(synth);

          if (instrument.pattern && instrument.subdivision) { // For rhythmic patterns like drums
            const seq = new Tone.Sequence((time, note) => {
              if (note) synth.triggerAttackRelease(note, instrument.duration || '8n', time);
            }, instrument.pattern, instrument.subdivision).start(0);
            activePatternElements.current.sequences.push(seq);
          } else if (instrument.sequence) { // For melodic/chordal parts
            const part = new Tone.Part((time, value) => {
              synth.triggerAttackRelease(value.notes, value.duration, time);
            }, instrument.sequence).start(0);
            activePatternElements.current.parts.push(part);
          }
        });
        
        if (patternEffectsParams?.reverb) {
          const reverb = new Tone.Reverb(patternEffectsParams.reverb).connect(patternMasterVol);
          // Connect synths to reverb IF reverb is meant to be an insert for all, or handle selectively
          // For simplicity, let's assume it's a send effect, or master effect.
          // If synths are already connected to patternMasterVol, and reverb is also connected to patternMasterVol,
          // reverb needs to be placed before patternMasterVol in chain for synths, or use a send/return.
          // Simpler: make patternMasterVol connect to Reverb, then Reverb to Destination.
          // This requires re-routing patternMasterVol if reverb is active.
          // For now, this simple reverb just adds to the output.
          // A better setup: synths -> patternMasterVol -> (optional reverb) -> Destination
          // Let's make reverb connect to destination and synths to it IF reverb exists
           // This means synths need to connect to reverb if it exists, else patternMasterVol.
           // For now, let's keep it simple: reverb is an additional effect on master.
           // This might not be ideal. A dedicated effects chain per pattern would be better.
           // Let's assume reverb is a final effect for now.
           // This means patternMasterVol outputs to reverb, and reverb to destination
           if(activePatternElements.current.masterVolumeNode){
                activePatternElements.current.masterVolumeNode.disconnect(Tone.Destination);
                activePatternElements.current.masterVolumeNode.connect(reverb);
                reverb.toDestination(); // Reverb now goes to destination
                activePatternElements.current.effects.push(reverb);
           }
        }

        Tone.Transport.start();
        activePlayerType.current = 'patternLoop';
        setIsPlaying(true);
        break;
      default:
        console.warn(`Soundscape type '${selectedSoundscape.type}' not implemented or 'off'.`);
        activePlayerType.current = null;
        setIsPlaying(false);
    }
    // Trigger volume update for the new sound
    if (isReady) {
        const currentSound = SOUNDSCAPE_OPTIONS.find(s => s.id === soundscapeId);
        const soundscapeVolAdj = currentSound?.params?.volumeAdjustment || currentSound?.params?.volume || 0;
        const baseGain = Tone.gainToDb(volume * 0.5);
        const finalGain = baseGain + soundscapeVolAdj;

        if (activePlayerType.current === 'noise' && noisePlayer.current) noisePlayer.current.volume.value = finalGain;
        else if (activePlayerType.current === 'tone' && tonePlayer.current) tonePlayer.current.volume.value = finalGain;
        else if (activePlayerType.current === 'polysynth' && polySynthPlayer.current) polySynthPlayer.current.volume.value = finalGain;
        else if (activePlayerType.current === 'binaural' && tonePlayerLeft.current && tonePlayerRight.current) {
            tonePlayerLeft.current.volume.value = finalGain;
            tonePlayerRight.current.volume.value = finalGain;
        } else if (activePlayerType.current === 'patternLoop' && activePatternElements.current.masterVolumeNode) {
            activePatternElements.current.masterVolumeNode.volume.value = finalGain;
        }
    }

  }, [isReady, volume, stopSound, cleanupPattern]);
  
  useEffect(() => {
    if (isPlaying && isReady) {
        const currentSoundscapeId = SOUNDSCAPE_OPTIONS.find(s => {
            if (activePlayerType.current === 'noise' && s.type === 'noise' && noisePlayer.current && s.params.type === noisePlayer.current.type) return true;
            if (activePlayerType.current === 'tone' && s.type === 'tone' && tonePlayer.current && !s.params.notes && s.params.frequency === tonePlayer.current.frequency.value) return true;
            if (activePlayerType.current === 'polysynth' && s.type === 'tone' && polySynthPlayer.current && s.params.notes && JSON.stringify(s.params.notes) === JSON.stringify(polySynthPlayer.current.get().voices.map((v: any) => v.frequency.value))) return true; // More complex check
            if (activePlayerType.current === 'binaural' && s.type === 'binaural') return true;
            if (activePlayerType.current === 'patternLoop' && s.type === 'patternLoop') return true; // General check for pattern loop
            return false;
        })?.id;

      const selectedSound = SOUNDSCAPE_OPTIONS.find(s => s.id === currentSoundscapeId);
      const soundscapeVolAdj = selectedSound?.params?.volumeAdjustment || selectedSound?.params?.volume || 0;

      const baseGainValue = Tone.gainToDb(volume * 0.5);
      const finalGain = baseGainValue + soundscapeVolAdj;

      if (activePlayerType.current === 'noise' && noisePlayer.current) {
        noisePlayer.current.volume.value = finalGain;
      } else if (activePlayerType.current === 'tone' && tonePlayer.current) {
        tonePlayer.current.volume.value = finalGain;
      } else if (activePlayerType.current === 'polysynth' && polySynthPlayer.current) {
        polySynthPlayer.current.volume.value = finalGain;
      } else if (activePlayerType.current === 'binaural' && tonePlayerLeft.current && tonePlayerRight.current) {
        tonePlayerLeft.current.volume.value = finalGain;
        tonePlayerRight.current.volume.value = finalGain;
      } else if (activePlayerType.current === 'patternLoop' && activePatternElements.current.masterVolumeNode) {
        activePatternElements.current.masterVolumeNode.volume.value = finalGain;
      }
    }
  }, [volume, isPlaying, isReady]);

  return { playSound, stopSound, isReady, isPlaying };
}

