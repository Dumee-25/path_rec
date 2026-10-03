import { useCallback, useEffect, useRef, useState } from "react";
import { drawToJpeg } from "../lib/photo";

export type CameraState =
  | "idle"
  | "starting"
  | "live"
  /** The person (or their browser) refused camera access. */
  | "blocked"
  /** No camera on this device, or it could not be opened. */
  | "unavailable"
  /** The browser exposes no camera API, typically because the page is not HTTPS or localhost. */
  | "unsupported";

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CameraState>("idle");

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setState("idle");
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
    setState("starting");
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      setState("live");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      setState(name === "NotAllowedError" || name === "SecurityError" ? "blocked" : "unavailable");
    }
  }, []);

  // The <video> only exists once the state is "live", so attach the stream afterwards.
  useEffect(() => {
    const video = videoRef.current;
    if (state !== "live" || !video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    video.play().catch(() => {
      // Autoplay can be refused; the muted, playsInline video normally starts regardless.
    });
  }, [state]);

  // Release the camera when the section goes away.
  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), []);

  /** Grab the current frame as a JPEG, or null if the camera is not delivering video yet. */
  const capture = useCallback((): Promise<Blob | null> => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return Promise.resolve(null);
    return drawToJpeg(video, video.videoWidth, video.videoHeight);
  }, []);

  return { videoRef, state, start, stop, capture };
}
