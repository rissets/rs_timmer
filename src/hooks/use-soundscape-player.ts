
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
  const tonePlayer = useRef<Tone.Synth | null>(null);
  const activePlayerType = useRef<'noise' | 'tone' | null>(null);

  useEffect(() => {
    const initTone = async () => {
      await Tone.start();
      setIsReady(true);
      console.log("AudioContext started, Tone.js ready.");
    };

    if (typeof window !== 'undefined') {
       // Ensure Tone.start() is called after a user interaction or automatically if allowed
      if (Tone.context.state !== 'running') {
        // Attempt to start, might require user gesture on some browsers
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
    };
  }, []);

  const stopSound = useCallback(() => {
    if (noisePlayer.current) {
      noisePlayer.current.stop();
    }
    if (tonePlayer.current) {
      tonePlayer.current.triggerRelease();
    }
    setIsPlaying(false);
  }, []);

  const playSound = useCallback(async (soundscapeId?: string) => {
    if (!isReady || !soundscapeId || soundscapeId === 'none') {
      stopSound();
      return;
    }

    const selectedSoundscape = SOUNDSCAPE_OPTIONS.find(s => s.id === soundscapeId);
    if (!selectedSoundscape) {
      stopSound();
      return;
    }
    
    // Ensure Tone is started before playing sound
    if (Tone.context.state !== 'running') {
        await Tone.start();
        console.log("AudioContext started by playSound");
    }


    stopSound(); // Stop any currently playing sound

    const gainValue = Tone.gainToDb(volume * 0.5); // Tone.js uses dB for volume

    if (selectedSoundscape.type === 'noise' && selectedSoundscape.params.type !== 'off') {
      if (!noisePlayer.current) {
        noisePlayer.current = new Tone.Noise(selectedSoundscape.params.type).toDestination();
      } else {
        noisePlayer.current.type = selectedSoundscape.params.type;
      }
      noisePlayer.current.volume.value = gainValue + (selectedSoundscape.params.volume || 0);
      if (selectedSoundscape.params.playbackRate) { // For sounds like rain
        // Noise doesn't have playbackRate, this is a conceptual example.
        // Could use a filter or other effects to simulate.
      }
      noisePlayer.current.start();
      activePlayerType.current = 'noise';
      setIsPlaying(true);
    } else if (selectedSoundscape.type === 'tone') {
      if (!tonePlayer.current) {
        tonePlayer.current = new Tone.Synth({
            oscillator: { type: selectedSoundscape.params.type || 'sine' },
            envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
        }).toDestination();
      } else {
        tonePlayer.current.oscillator.type = selectedSoundscape.params.type || 'sine';
      }
      tonePlayer.current.volume.value = gainValue;
      tonePlayer.current.triggerAttack(selectedSoundscape.params.frequency || 440);
      activePlayerType.current = 'tone';
      setIsPlaying(true);
    } else {
      // File type not implemented in this example
      console.warn(`Soundscape type '${selectedSoundscape.type}' not implemented or 'off'.`);
      setIsPlaying(false);
    }
  }, [isReady, volume, stopSound]);
  
  // Update volume if it changes while playing
  useEffect(() => {
    if (isPlaying && isReady) {
      const gainValue = Tone.gainToDb(volume * 0.5);
      if (activePlayerType.current === 'noise' && noisePlayer.current) {
        noisePlayer.current.volume.value = gainValue + (SOUNDSCAPE_OPTIONS.find(s => s.id === noisePlayer.current?.type)?.params?.volume || 0);
      } else if (activePlayerType.current === 'tone' && tonePlayer.current) {
        tonePlayer.current.volume.value = gainValue;
      }
    }
  }, [volume, isPlaying, isReady]);


  return { playSound, stopSound, isReady, isPlaying };
}
