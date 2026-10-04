/**
 * Elegant Audio Feedback Engine for CASA MADRE
 * Supports both local audio assets (relative paths ./sounds/*.mp3)
 * with automatic zero-latency Web Audio API synthesizers as fallback.
 * Works seamlessly across Windows, macOS, Linux, and Web servers.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

// Persistent mute setting
export function isAudioMuted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('casamadre_sound_muted') === 'true';
}

export function setAudioMuted(muted: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('casamadre_sound_muted', muted ? 'true' : 'false');
}

export function toggleAudioMuted(): boolean {
  const current = isAudioMuted();
  setAudioMuted(!current);
  return !current;
}

/**
 * Universal safe local audio player using relative path with fallback synthesizer
 */
function playLocalAudioFile(relativeUrl: string, fallbackSynthesizer?: () => void): void {
  if (isAudioMuted()) return;
  if (typeof window === 'undefined') return;

  // Build candidate URL paths to guarantee audio loads in all environments
  const candidateUrls: string[] = [
    relativeUrl,
    relativeUrl.startsWith('./') ? relativeUrl.slice(1) : `./${relativeUrl}`,
    relativeUrl.replace(/^\.?\/?sounds\//, '/sounds/'),
    relativeUrl.replace(/^\.?\/?sounds\//, '/'),
    `./public${relativeUrl.startsWith('/') ? '' : '/'}${relativeUrl}`,
  ];
  const uniqueUrls = Array.from(new Set(candidateUrls));

  let index = 0;
  function tryNext() {
    if (index >= uniqueUrls.length) {
      if (fallbackSynthesizer) fallbackSynthesizer();
      return;
    }
    const currentUrl = uniqueUrls[index++];
    try {
      const audio = new Audio(currentUrl);
      audio.volume = 0.75;
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch(() => {
          tryNext();
        });
      }
    } catch {
      tryNext();
    }
  }

  tryNext();
}

/**
 * Camera shutter sound:
 * Plays local ./sounds/camera-shutter.mp3 with mechanical click synthesizer fallback.
 * Used on: camera photo capture & batch photo upload.
 */
export function playCameraShutterSound(): void {
  playLocalAudioFile('./sounds/camera-shutter.mp3', playSynthesizedCameraShutter);
}

/**
 * Alert / Notification sound:
 * Plays local ./sounds/alert-notification.mp3 with two-tone bell synthesizer fallback.
 * Used on: system toast notifications, authorization warnings, and alerts.
 */
export function playAlertNotificationSound(): void {
  playLocalAudioFile('./sounds/alert-notification.mp3', playSynthesizedAlert);
}

/**
 * Synthesizes a realistic double-snap mechanical camera shutter sound
 */
export function playSynthesizedCameraShutter(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // First shutter blade click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(1400, now);
    osc1.frequency.exponentialRampToValueAtTime(120, now + 0.04);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.05);

    // Second return blade click after 65ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(800, now + 0.065);
    osc2.frequency.exponentialRampToValueAtTime(80, now + 0.11);
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.setValueAtTime(0.2, now + 0.065);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.065);
    osc2.stop(now + 0.13);
  } catch {}
}

/**
 * Synthesizes a clean two-tone alert notification chime (E5 -> A5)
 */
export function playSynthesizedAlert(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.exponentialRampToValueAtTime(880.0, now + 0.1); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.5, now); // Harmonic E6
    osc2.frequency.exponentialRampToValueAtTime(1760.0, now + 0.1);

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  } catch {}
}

/**
 * Plays a warm, subtle luxury chime (harmonic dual sine wave with gentle decay)
 * Used on: article added, changes saved, PIN validated, login success.
 */
export function playSuccessSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.linearRampToValueAtTime(0.12, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
  } catch (err) {
    // Ignore audio restrictions
  }
}

/**
 * Plays a discrete, subtle antique wooden click
 * Used on: tab switch, filter selection, item select.
 */
export function playClickSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  } catch {}
}

/**
 * Plays an elegant 3-note ascending arpeggio (C5 -> E5 -> G5)
 * Used on: PDF / Excel export completion.
 */
export function playExportSound(): void {
  if (isAudioMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = now + idx * 0.07;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.10, startTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  } catch {}
}
