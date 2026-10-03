import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useCamera, type CameraState } from "../hooks/useCamera";
import { ACCEPTED_UPLOAD_TYPES, fileToJpeg, PhotoError } from "../lib/photo";
import { ApiError, createCareerImage, getCareerImageStatus } from "../services/api";
import { Button, LoadingState, MediaFrame, Notice } from ".";

type Availability =
  | { state: "loading" }
  | { state: "unavailable" }
  | { state: "error" }
  | { state: "ready"; provider: string };

type Generation =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; url: string }
  | { status: "error"; message: string };

interface Photo {
  blob: Blob;
  url: string;
  source: "camera" | "upload";
}

const PRIVACY_NOTE =
  "Your photo is used only to generate the career visualization and does not affect your pathway recommendation.";

const CAMERA_MESSAGES: Partial<Record<CameraState, string>> = {
  blocked: "Camera access was blocked. Allow camera access in your browser's site settings, then choose Enable Camera again.",
  unavailable: "No camera was found on this device, or it could not be opened.",
  unsupported: "This browser cannot use the camera on this page. The camera needs a secure (HTTPS) connection or localhost.",
};

/**
 * Optional career visualization. It is deliberately separate from the recommendation: the
 * photo (taken with the camera or uploaded from a file) is sent only when the person chooses
 * Generate Visualization, and never affects scoring.
 */
export function CareerVisualization({ pathway, career }: { pathway: string; career: string }) {
  const [availability, setAvailability] = useState<Availability>({ state: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [generation, setGeneration] = useState<Generation>({ status: "idle" });
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const camera = useCamera();

  useEffect(() => {
    let cancelled = false;
    setAvailability({ state: "loading" });
    getCareerImageStatus().then(
      (status) => {
        if (cancelled) return;
        setAvailability(status.configured ? { state: "ready", provider: status.provider } : { state: "unavailable" });
      },
      () => !cancelled && setAvailability({ state: "error" }),
    );
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Free the previous photo's object URL when it is replaced or the section unmounts.
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url);
    };
  }, [photo]);

  async function capture() {
    const blob = await camera.capture();
    if (!blob) return;
    setUploadError(null);
    setPhoto({ blob, url: URL.createObjectURL(blob), source: "camera" });
    setGeneration({ status: "idle" });
    camera.stop();
  }

  function retake() {
    setPhoto(null);
    setUploadError(null);
    setGeneration({ status: "idle" });
    void camera.start();
  }

  async function onFileChosen(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // so choosing the same file again still fires a change
    if (!file) return;
    setUploadError(null);
    try {
      const blob = await fileToJpeg(file);
      camera.stop();
      setPhoto({ blob, url: URL.createObjectURL(blob), source: "upload" });
      setGeneration({ status: "idle" });
    } catch (error) {
      setUploadError(error instanceof PhotoError ? error.message : "That image could not be read. Try a JPEG or PNG photo.");
    }
  }

  async function generate() {
    if (!photo) return;
    setGeneration({ status: "loading" });
    try {
      const url = await createCareerImage(photo.blob, pathway);
      setGeneration({ status: "done", url });
    } catch (error) {
      if (error instanceof ApiError && error.code === "not_configured") {
        setAvailability({ state: "unavailable" });
        return;
      }
      const message = error instanceof ApiError ? error.message : "The visualization could not be created. Please try again.";
      setGeneration({ status: "error", message });
    }
  }

  const heading = (
    <h2 id="career-title" className="section-title app-section-title">
      See Yourself in This Career
    </h2>
  );

  if (availability.state === "loading") {
    return (
      <div>
        {heading}
        <LoadingState message="Checking career visualization..." />
      </div>
    );
  }
  if (availability.state === "unavailable") {
    return (
      <div>
        {heading}
        <Notice title="Career visualization is not available yet">
          It has not been set up on this system. Your pathway results above are not affected.
        </Notice>
      </div>
    );
  }
  if (availability.state === "error") {
    return (
      <div className="app-stack">
        {heading}
        <Notice tone="warning" title="Career visualization could not be checked">
          The server did not respond. Your pathway results above are not affected.
        </Notice>
        <div>
          <Button variant="secondary" onClick={() => setAttempt((count) => count + 1)}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const cameraMessage = CAMERA_MESSAGES[camera.state];
  const busy = generation.status === "loading";
  const cameraAction = photo ? (
    <Button variant="secondary" onClick={retake} disabled={busy}>
      Retake Photo
    </Button>
  ) : camera.state === "live" ? (
    <Button onClick={() => void capture()}>Capture Photo</Button>
  ) : (
    <Button variant="secondary" onClick={() => void camera.start()} disabled={camera.state === "starting"}>
      Enable Camera
    </Button>
  );
  const photoActions = (
    <>
      {cameraAction}
      <Button variant="secondary" onClick={() => fileInput.current?.click()} disabled={busy}>
        Upload Photo
      </Button>
    </>
  );

  return (
    <div className="app-stack">
      <div>
        {heading}
        <p className="body-lg app-lead">
          Take or upload a photo and generate a career-themed visualization related to your recommended pathway.
        </p>
      </div>

      <Notice>{PRIVACY_NOTE}</Notice>
      {availability.provider === "mock" ? (
        <Notice tone="warning" title="Development preview">
          No image model is connected, so the visualization shows your photo unchanged.
        </Notice>
      ) : null}
      {cameraMessage ? <Notice tone="warning">{cameraMessage}</Notice> : null}
      {uploadError ? <Notice tone="warning">{uploadError}</Notice> : null}
      {generation.status === "error" ? (
        <Notice tone="danger" title="The visualization could not be created">
          {generation.message}
        </Notice>
      ) : null}

      <input
        ref={fileInput}
        type="file"
        accept={ACCEPTED_UPLOAD_TYPES}
        hidden
        onChange={(event) => void onFileChosen(event)}
      />

      <div className="app-media-grid">
        <MediaFrame
          label="Your Photo"
          placeholder={camera.state === "starting" ? "Starting the camera..." : "Camera preview or uploaded photo appears here"}
          actions={photoActions}
        >
          {photo ? (
            <img src={photo.url} alt={photo.source === "camera" ? "The photo you captured" : "The photo you uploaded"} />
          ) : camera.state === "live" ? (
            <video ref={camera.videoRef} playsInline muted autoPlay aria-label="Live camera preview" />
          ) : undefined}
        </MediaFrame>

        <MediaFrame
          label="Career Visualization"
          placeholder="Your career visualization appears here"
          actions={
            <Button onClick={() => void generate()} disabled={!photo || generation.status === "loading"}>
              Generate Visualization
            </Button>
          }
        >
          {generation.status === "loading" ? (
            <LoadingState message="Creating your career visualization..." />
          ) : generation.status === "done" ? (
            <img src={generation.url} alt={`Career visualization showing you as ${career}`} />
          ) : undefined}
        </MediaFrame>
      </div>
    </div>
  );
}
