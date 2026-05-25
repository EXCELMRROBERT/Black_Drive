import { useRef, useEffect } from 'react';

export function useEngineSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);
  const idleOscRef = useRef<OscillatorNode | null>(null);
  const idleGainRef = useRef<GainNode | null>(null);

  const initAudio = () => {
    if (audioCtxRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Primary Cylinder Ignition Wave
      const osc1 = ctx.createOscillator();
      osc1.type = 'sawtooth';
      
      // Secondary Sub Harmonic (Exhaust resonance)
      const osc2 = ctx.createOscillator();
      osc2.type = 'triangle';

      // Idle purr node
      const idleOsc = ctx.createOscillator();
      idleOsc.type = 'sine';

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 1.2;

      const gainNode = ctx.createGain();
      gainNode.gain.value = 0; // Off initially

      const idleGainNode = ctx.createGain();
      idleGainNode.gain.value = 0;

      // Connect nodes
      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      idleOsc.connect(idleGainNode);
      idleGainNode.connect(ctx.destination);

      // Start oscillators
      osc1.start(0);
      osc2.start(0);
      idleOsc.start(0);

      osc1Ref.current = osc1;
      osc2Ref.current = osc2;
      filterNodeRef.current = filter;
      gainNodeRef.current = gainNode;
      idleOscRef.current = idleOsc;
      idleGainRef.current = idleGainNode;

      if (ctx.state === 'suspended') {
        const resume = () => {
          ctx.resume();
          window.removeEventListener('click', resume);
          window.removeEventListener('keydown', resume);
        };
        window.addEventListener('click', resume);
        window.addEventListener('keydown', resume);
      }
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  };

  const updateSound = (rpm: number, throttle: number, isEnabled: boolean) => {
    if (!isEnabled) {
      stopSound();
      return;
    }

    if (!audioCtxRef.current) {
      initAudio();
    }

    const ctx = audioCtxRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const osc1 = osc1Ref.current;
    const osc2 = osc2Ref.current;
    const filter = filterNodeRef.current;
    const gainNode = gainNodeRef.current;
    const idleOsc = idleOscRef.current;
    const idleGain = idleGainRef.current;

    if (osc1 && osc2 && filter && gainNode && idleOsc && idleGain) {
      const parsedRpm = Math.max(700, Math.min(6500, rpm));
      
      // Map RPM to musical frequencies
      // E39 530i inline-6 firing frequency is RPM / 60 * 3.
      const fundamentalFreq = (parsedRpm / 60) * 3;
      const t = ctx.currentTime;

      osc1.frequency.setTargetAtTime(fundamentalFreq, t, 0.05);
      osc2.frequency.setTargetAtTime(fundamentalFreq * 1.5, t, 0.05);
      idleOsc.frequency.setTargetAtTime(fundamentalFreq * 0.5, t, 0.1);

      // Low pass filter cuts off higher frequencies as RPM climbs,
      // imitating engine compartment insulation. Dynamic cutoff based on throttle.
      const targetFilterFreq = 180 + (parsedRpm / 6500) * 800 + throttle * 500;
      filter.frequency.setTargetAtTime(targetFilterFreq, t, 0.05);

      // Exhaust feedback volume
      const engineLoadVolume = 0.015 + (throttle * 0.045) * (0.3 + (parsedRpm / 6500) * 0.7);
      gainNode.gain.setTargetAtTime(engineLoadVolume, t, 0.05);

      // Idle purr volume decays slightly as load increases
      const targetIdleVol = Math.max(0.002, 0.015 * (1 - (parsedRpm - 700) / 2000));
      idleGain.gain.setTargetAtTime(targetIdleVol, t, 0.1);
    }
  };

  const stopSound = () => {
    const gainNode = gainNodeRef.current;
    const idleGain = idleGainRef.current;
    if (gainNode) {
      gainNode.gain.setTargetAtTime(0, audioCtxRef.current?.currentTime || 0, 0.1);
    }
    if (idleGain) {
      idleGain.gain.setTargetAtTime(0, audioCtxRef.current?.currentTime || 0, 0.1);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup Web Audio nodes on unmount
      try {
        if (osc1Ref.current) osc1Ref.current.stop();
        if (osc2Ref.current) osc2Ref.current.stop();
        if (idleOscRef.current) idleOscRef.current.stop();
        if (audioCtxRef.current) audioCtxRef.current.close();
      } catch (e) {
        // Safe to ignore on unmount
      }
    };
  }, []);

  return { updateSound, stopSound, initSound: initAudio };
}
