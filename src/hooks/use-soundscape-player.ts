
"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import type { SoundscapeOption } from '@/lib/types';
import { SOUNDSCAPE_OPTIONS } from '@/lib/constants';

interface UseSoundscapePlayerProps {
  volume: number; // 0-1
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
  const tonePlayer = useRef<Tone.Synth | null>(null); // For single tones (monophonic)
  const polySynthPlayer = useRef<Tone.PolySynth | null>(null); // For chords/instrumental sounds
  const tonePlayerLeft = useRef<Tone.Synth | null>(null); // For binaural left
  const tonePlayerRight = useRef<Tone.Synth | null>(null); // For binaural right
  const pannerLeft = useRef<Tone.Panner | null>(null);
  const pannerRight = useRef<Tone.Panner | null>(null);

  const activePlayerType = useRef<'noise' | 'tone' | 'polysynth' | 'binaural' | null>(null);

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
      if (pannerLeft.current) {
        pannerLeft.current.dispose();
        pannerLeft.current = null;
      }
      if (pannerRight.current) {
        pannerRight.current.dispose();
        pannerRight.current = null;
      }
      activePlayerType.current = null;
    };
  }, []);

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
        if (tonePlayerLeft.current) {
          tonePlayerLeft.current.triggerRelease();
        }
        if (tonePlayerRight.current) {
          tonePlayerRight.current.triggerRelease();
        }
    }
    setIsPlaying(false);
  }, []);

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

    stopSound(); 

    const baseGainValue = Tone.gainToDb(volume * 0.5); 
    const soundscapeVolumeAdjustment = selectedSoundscape.params?.volume || 0;
    const finalGainValue = baseGainValue + soundscapeVolumeAdjustment;

    if (selectedSoundscape.type === 'noise' && selectedSoundscape.params.type !== 'off') {
      if (!noisePlayer.current) {
        noisePlayer.current = new Tone.Noise(selectedSoundscape.params.type).toDestination();
      } else {
        noisePlayer.current.type = selectedSoundscape.params.type;
      }
      noisePlayer.current.volume.value = finalGainValue;
      noisePlayer.current.start();
      activePlayerType.current = 'noise';
      setIsPlaying(true);
    } else if (selectedSoundscape.type === 'tone') {
      const { notes, frequency, type: oscType = 'sine', envelope } = selectedSoundscape.params;
      
      if (notes && Array.isArray(notes)) { // Polyphonic sound (chords/instrumental)
        if (!polySynthPlayer.current) {
          polySynthPlayer.current = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: oscType },
            envelope: envelope || { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
          }).toDestination();
        } else {
          polySynthPlayer.current.set({
            oscillator: { type: oscType },
            envelope: envelope || { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
          });
        }
        polySynthPlayer.current.volume.value = finalGainValue;
        polySynthPlayer.current.triggerAttack(notes);
        activePlayerType.current = 'polysynth';
      } else { // Monophonic sound (single tone)
        if (!tonePlayer.current) {
          tonePlayer.current = new Tone.Synth({
              oscillator: { type: oscType },
              envelope: envelope || { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
          }).toDestination();
        } else {
          tonePlayer.current.set({
            oscillator: { type: oscType },
            envelope: envelope || { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
          });
        }
        tonePlayer.current.volume.value = finalGainValue;
        tonePlayer.current.triggerAttack(frequency || 440);
        activePlayerType.current = 'tone';
      }
      setIsPlaying(true);
    } else if (selectedSoundscape.type === 'binaural' && selectedSoundscape.params) {
      const { baseFrequency = 100, beatFrequency = 8 } = selectedSoundscape.params;
      const freqLeft = baseFrequency - beatFrequency / 2;
      const freqRight = baseFrequency + beatFrequency / 2;

      if (!pannerLeft.current) pannerLeft.current = new Tone.Panner(-1).toDestination();
      if (!pannerRight.current) pannerRight.current = new Tone.Panner(1).toDestination();

      const synthOptions = { oscillator: { type: 'sine' }, envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 0.5 }};

      if (!tonePlayerLeft.current) tonePlayerLeft.current = new Tone.Synth(synthOptions);
      tonePlayerLeft.current.disconnect(); 
      tonePlayerLeft.current.connect(pannerLeft.current);
      tonePlayerLeft.current.volume.value = finalGainValue;
      tonePlayerLeft.current.triggerAttack(freqLeft);

      if (!tonePlayerRight.current) tonePlayerRight.current = new Tone.Synth(synthOptions);
      tonePlayerRight.current.disconnect(); 
      tonePlayerRight.current.connect(pannerRight.current);
      tonePlayerRight.current.volume.value = finalGainValue;
      tonePlayerRight.current.triggerAttack(freqRight);
      
      activePlayerType.current = 'binaural';
      setIsPlaying(true);
    } else {
      console.warn(`Soundscape type '${selectedSoundscape.type}' not implemented or 'off'.`);
      activePlayerType.current = null;
      setIsPlaying(false);
    }
  }, [isReady, volume, stopSound]);
  
  useEffect(() => {
    if (isPlaying && isReady) {
      const currentSoundscapeId = SOUNDSCAPE_OPTIONS.find(s => {
        if (activePlayerType.current === 'noise' && s.type === 'noise' && noisePlayer.current && s.params.type === noisePlayer.current.type) return true;
        if (activePlayerType.current === 'tone' && s.type === 'tone' && tonePlayer.current && !s.params.notes && s.params.frequency === tonePlayer.current.frequency.value) return true;
        if (activePlayerType.current === 'polysynth' && s.type === 'tone' && polySynthPlayer.current && s.params.notes) return true; // Simplified check for polysynth
        if (activePlayerType.current === 'binaural' && s.type === 'binaural') return true;
        return false;
      })?.id;

      const selectedSoundscape = SOUNDSCAPE_OPTIONS.find(s => s.id === currentSoundscapeId);
      const soundscapeVolumeAdjustment = selectedSoundscape?.params?.volume || 0;

      const baseGainValue = Tone.gainToDb(volume * 0.5);
      const finalGainValue = baseGainValue + soundscapeVolumeAdjustment;

      if (activePlayerType.current === 'noise' && noisePlayer.current) {
        noisePlayer.current.volume.value = finalGainValue;
      } else if (activePlayerType.current === 'tone' && tonePlayer.current) {
        tonePlayer.current.volume.value = finalGainValue;
      } else if (activePlayerType.current === 'polysynth' && polySynthPlayer.current) {
        polySynthPlayer.current.volume.value = finalGainValue;
      }
      else if (activePlayerType.current === 'binaural') {
        if (tonePlayerLeft.current) tonePlayerLeft.current.volume.value = finalGainValue;
        if (tonePlayerRight.current) tonePlayerRight.current.volume.value = finalGainValue;
      }
    }
  }, [volume, isPlaying, isReady]);

  return { playSound, stopSound, isReady, isPlaying };
}
