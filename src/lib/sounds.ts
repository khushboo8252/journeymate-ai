// Sound notification utility
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const playNotificationSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800; // Frequency in Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.5);
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
};

export const playAlertSound = () => {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Play a series of beeps for better alert
    const playBeep = (time: number, freq: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'square';

      gainNode.gain.setValueAtTime(0.5, ctx.currentTime + time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + time + 0.15);

      oscillator.start(ctx.currentTime + time);
      oscillator.stop(ctx.currentTime + time + 0.15);
    };

    // Play 3 beeps
    playBeep(0, 1000);
    playBeep(0.2, 1200);
    playBeep(0.4, 1000);
  } catch (error) {
    console.error('Failed to play alert sound:', error);
  }
};
