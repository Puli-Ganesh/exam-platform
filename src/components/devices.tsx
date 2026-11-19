"use client";

import { AudioLines, Camera, CameraOff, Mic, MicOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type DeviceState = {
  stream: MediaStream | null;
  analyser: AnalyserNode | null;
  camera: boolean;
  microphone: boolean;
  checking: boolean;
  slow: boolean;
  error: string;
};

const disconnected: DeviceState = {
  stream: null,
  analyser: null,
  camera: false,
  microphone: false,
  checking: false,
  slow: false,
  error: "",
};

type Resources = {
  stream?: MediaStream;
  context?: AudioContext;
  source?: MediaStreamAudioSourceNode;
  detach?: () => void;
  slowTimer?: ReturnType<typeof setTimeout>;
};

function activeTrack(tracks: MediaStreamTrack[] = []) {
  return tracks.some((track) => track.readyState === "live" && track.enabled && !track.muted);
}

function readTracks(stream?: MediaStream) {
  return {
    camera: activeTrack(stream?.getVideoTracks()),
    microphone: activeTrack(stream?.getAudioTracks()),
  };
}

function permissionHelp(error: unknown): string {
  const name = error instanceof DOMException ? error.name : "";

  switch (name) {
    case "NotAllowedError":
    case "PermissionDeniedError":
    case "SecurityError":
      return "Allow camera and microphone access in your browser’s site settings, then try again. Check your system privacy settings if access is still blocked.";
    case "NotFoundError":
    case "DevicesNotFoundError":
    case "OverconstrainedError":
      return "Connect a camera and microphone, then try again.";
    case "NotReadableError":
    case "TrackStartError":
    case "AbortError":
      return "The camera or microphone is busy or could not start. Close other apps using your devices, then try again.";
    default:
      return "The device check could not start. Try again or open the assessment in an up-to-date browser.";
  }
}

export function useDevices() {
  const [devices, setDevices] = useState(disconnected);
  const resources = useRef<Resources>({});
  const request = useRef(0);

  const dispose = useCallback(() => {
    request.current += 1;
    const { stream, context, source, detach, slowTimer } = resources.current;
    resources.current = {};

    clearTimeout(slowTimer);
    detach?.();
    stream?.getTracks().forEach((track) => track.stop());
    source?.disconnect();
    if (context && context.state !== "closed") void context.close().catch(() => {});
  }, []);

  const release = useCallback(() => {
    dispose();
    setDevices(disconnected);
  }, [dispose]);

  const refresh = useCallback(() => {
    const live = readTracks(resources.current.stream);
    setDevices((previous) =>
      previous.camera === live.camera && previous.microphone === live.microphone
        ? previous
        : { ...previous, ...live },
    );
  }, []);

  const isReady = useCallback(() => {
    const { camera, microphone } = readTracks(resources.current.stream);
    return camera && microphone;
  }, []);

  const check = useCallback(async () => {
    release();

    if (!navigator.mediaDevices?.getUserMedia) {
      setDevices({
        ...disconnected,
        error: "Open this assessment over HTTPS or on localhost in a browser that supports camera and microphone access.",
      });
      return;
    }

    const requestId = request.current;
    setDevices({ ...disconnected, checking: true });
    resources.current.slowTimer = setTimeout(() => {
      setDevices((previous) => ({ ...previous, slow: true }));
    }, 12_000);

    // Start the optional local meter during the user gesture. It has no output.
    try {
      if (typeof AudioContext !== "undefined") {
        const context = new AudioContext();
        resources.current.context = context;
        void context.resume().catch(() => {});
      }
    } catch {
      // Track presence still works when Web Audio is unavailable.
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (requestId !== request.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      clearTimeout(resources.current.slowTimer);
      resources.current.stream = stream;
      const tracks = stream.getTracks();
      const events = ["ended", "mute", "unmute"];
      for (const track of tracks) {
        for (const event of events) track.addEventListener(event, refresh);
      }

      resources.current.detach = () => {
        for (const track of tracks) {
          for (const event of events) track.removeEventListener(event, refresh);
        }
      };

      let analyser: AnalyserNode | null = null;
      try {
        const context = resources.current.context;
        if (context && stream.getAudioTracks().length) {
          const source = context.createMediaStreamSource(stream);
          resources.current.source = source;
          analyser = context.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
        }
      } catch {
        analyser = null;
      }

      const status = readTracks(stream);
      if (
        !tracks.some((track) => track.kind === "video" && track.readyState === "live") ||
        !tracks.some((track) => track.kind === "audio" && track.readyState === "live")
      ) {
        dispose();
        setDevices({
          ...disconnected,
          error: "The browser did not provide both devices. Check that your camera and microphone are available, then try again.",
        });
        return;
      }

      setDevices({ ...disconnected, stream, analyser, ...status });
    } catch (error) {
      if (requestId !== request.current) return;
      dispose();
      setDevices({ ...disconnected, error: permissionHelp(error) });
    }
  }, [dispose, refresh, release]);

  useEffect(() => {
    window.addEventListener("pagehide", release);
    return () => {
      window.removeEventListener("pagehide", release);
      dispose();
    };
  }, [dispose, release]);

  useEffect(() => {
    if (!devices.stream) return;
    const interval = setInterval(refresh, 1_000);
    const mediaDevices = navigator.mediaDevices;
    mediaDevices?.addEventListener("devicechange", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(interval);
      mediaDevices?.removeEventListener("devicechange", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [devices.stream, refresh]);

  return { ...devices, check, release, isReady };
}

export type Devices = ReturnType<typeof useDevices>;

export function CameraPreview({ stream, active }: { stream: MediaStream | null; active: boolean }) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const element = video.current;
    if (!element || !stream || !active) return;
    element.srcObject = stream;
    void element.play().catch(() => {});
    return () => {
      element.srcObject = null;
    };
  }, [active, stream]);

  return (
    <div className="camera-preview" data-active={active}>
      {active ? (
        <video ref={video} autoPlay muted playsInline aria-label="Local camera preview" />
      ) : (
        <div className="camera-placeholder" aria-hidden="true">
          <span><Camera size={25} strokeWidth={1.65} /></span>
          <strong>Camera preview</strong>
        </div>
      )}
    </div>
  );
}

function MicrophoneMeter({ analyser }: { analyser: AnalyserNode | null }) {
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!analyser || !fill.current) return;
    const bar = fill.current;
    const samples = new Uint8Array(analyser.fftSize);
    const timer = setInterval(() => {
      analyser.getByteTimeDomainData(samples);
      let squareSum = 0;
      for (const sample of samples) squareSum += ((sample - 128) / 128) ** 2;
      const level = Math.min(1, Math.sqrt(squareSum / samples.length) * 4.5);
      bar.style.transform = `scaleX(${level})`;
    }, 85);

    return () => {
      clearInterval(timer);
      bar.style.transform = "scaleX(0)";
    };
  }, [analyser]);

  return (
    <span className="microphone-meter" aria-hidden="true">
      <span ref={fill} />
    </span>
  );
}

export function DeviceIndicators({ devices, compact = false }: { devices: Devices; compact?: boolean }) {
  const CameraIcon = devices.camera ? Camera : CameraOff;
  const MicrophoneIcon = devices.microphone ? Mic : MicOff;

  return (
    <div className="device-indicators" data-compact={compact}>
      <div className="device-indicator" data-active={devices.camera}>
        <CameraIcon size={16} aria-hidden="true" />
        <span>
          <strong>Camera</strong>
          <small>{devices.camera ? "On" : "Off"}</small>
        </span>
      </div>
      <div className="device-indicator" data-active={devices.microphone}>
        <MicrophoneIcon size={16} aria-hidden="true" />
        <span>
          <strong>{compact ? "Mic" : "Microphone"}</strong>
          <small>{devices.microphone ? "On" : "Off"}</small>
        </span>
        {!compact && !devices.microphone && <AudioLines className="meter-icon" size={16} aria-hidden="true" />}
        {devices.microphone && <MicrophoneMeter analyser={devices.analyser} />}
      </div>
    </div>
  );
}
