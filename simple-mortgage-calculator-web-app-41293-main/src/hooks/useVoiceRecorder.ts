import { useCallback, useRef, useState } from 'react';

/**
 * Records mic audio as a complete WAV blob (16 kHz mono, 16-bit PCM).
 * Produces decodable files across Safari/Chrome/Firefox — avoids MediaRecorder
 * fragmented container issues. Optionally auto-stops after N ms of silence.
 */

function encodeWav(chunks: Float32Array[], inputSampleRate: number, targetRate = 16000): Blob {
  let totalLen = 0;
  for (const c of chunks) totalLen += c.length;
  const merged = new Float32Array(totalLen);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.length;
  }

  const ratio = inputSampleRate / targetRate;
  const outLen = Math.floor(merged.length / ratio);
  const downsampled = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    downsampled[i] = merged[Math.floor(i * ratio)];
  }

  const buffer = new ArrayBuffer(44 + downsampled.length * 2);
  const view = new DataView(buffer);
  const writeStr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + downsampled.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, targetRate, true);
  view.setUint32(28, targetRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, downsampled.length * 2, true);
  let o = 44;
  for (let i = 0; i < downsampled.length; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, downsampled[i]));
    view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

export interface VoiceRecorderStartOptions {
  silenceMs?: number;
  maxMs?: number;
  rmsThreshold?: number;
  onAutoStop?: () => void;
}

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const autoStopFiredRef = useRef(false);

  const isSupported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof (window as unknown as { AudioContext?: unknown }).AudioContext !== 'undefined';

  const start = useCallback(async (opts: VoiceRecorderStartOptions = {}) => {
    const silenceMs = opts.silenceMs ?? 5000;
    const maxMs = opts.maxMs ?? 60000;
    const rmsThreshold = opts.rmsThreshold ?? 0.01;
    setError(null);
    autoStopFiredRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      streamRef.current = stream;
      const AC = (window as unknown as { AudioContext: typeof AudioContext }).AudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const node = ctx.createScriptProcessor(4096, 1, 1);
      nodeRef.current = node;
      chunksRef.current = [];
      const startedAt = Date.now();
      let lastVoiceAt = Date.now();
      let hasSpokenOnce = false;
      node.onaudioprocess = (e) => {
        const data = e.inputBuffer.getChannelData(0);
        chunksRef.current.push(new Float32Array(data));
        // RMS
        let sum = 0;
        for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
        const rms = Math.sqrt(sum / data.length);
        const speaking = rms > rmsThreshold;
        const now = Date.now();
        if (speaking) {
          lastVoiceAt = now;
          if (!hasSpokenOnce) hasSpokenOnce = true;
          setIsSpeaking(true);
        } else {
          setIsSpeaking(false);
        }
        if (autoStopFiredRef.current) return;
        const silentTooLong = hasSpokenOnce && now - lastVoiceAt > silenceMs;
        const maxReached = now - startedAt > maxMs;
        if (silentTooLong || maxReached) {
          autoStopFiredRef.current = true;
          opts.onAutoStop?.();
        }
      };
      source.connect(node);
      node.connect(ctx.destination);
      setIsRecording(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Microphone access denied');
      setIsRecording(false);
    }
  }, []);

  const stop = useCallback(async (): Promise<Blob | null> => {
    const ctx = ctxRef.current;
    const stream = streamRef.current;
    const node = nodeRef.current;
    const source = sourceRef.current;
    setIsRecording(false);
    setIsSpeaking(false);
    if (!ctx || !stream) return null;
    stream.getTracks().forEach((t) => t.stop());
    node?.disconnect();
    source?.disconnect();
    const blob = encodeWav(chunksRef.current, ctx.sampleRate);
    try {
      await ctx.close();
    } catch { /* noop */ }
    chunksRef.current = [];
    ctxRef.current = null;
    streamRef.current = null;
    nodeRef.current = null;
    sourceRef.current = null;
    if (blob.size < 2048) {
      setError('Recording too short — please try again.');
      return null;
    }
    return blob;
  }, []);

  return { isRecording, isSpeaking, isSupported, error, start, stop, setError };
}
