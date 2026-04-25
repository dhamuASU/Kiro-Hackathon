"use client";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { useEffect, useRef, useState } from "react";

/**
 * Live camera barcode scanner. Wraps @zxing/browser's MultiFormatReader.
 * Picks the user's back camera when available ("environment"), falls back
 * to any camera otherwise. Calls onDetected with the decoded barcode text
 * as soon as a frame resolves — the caller should close the scanner.
 *
 * IMPORTANT: the effect has an empty dep array and guards against React's
 * StrictMode double-invoke via a ref. Anything else causes ZXing to tear
 * down + restart the video mid-play and floods the console with
 * "play() interrupted" errors.
 */
export function BarcodeScanner({
  onDetected,
  onCancel,
}: {
  onDetected: (barcode: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;

  const [status, setStatus] = useState<
    "starting" | "scanning" | "no-permission" | "no-device" | "error"
  >("starting");
  const [errText, setErrText] = useState<string | null>(null);

  useEffect(() => {
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
    ]);

    const reader = new BrowserMultiFormatReader(hints);
    let cancelled = false;
    let controls: { stop: () => void } | null = null;
    let startedStream: MediaStream | null = null;

    (async () => {
      try {
        // Ask for permission first — this surfaces the browser prompt immediately
        // instead of waiting until after enumeration. Also populates device labels.
        try {
          startedStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false,
          });
          // We don't need the stream itself — we just needed the permission grant
          // and the labels unlock. Stop it; ZXing will re-open with its own stream.
          startedStream.getTracks().forEach((t) => t.stop());
          startedStream = null;
        } catch (permErr) {
          const p = permErr as { name?: string };
          if (p.name === "NotAllowedError") {
            if (!cancelled) setStatus("no-permission");
            return;
          }
          if (p.name === "NotFoundError") {
            if (!cancelled) setStatus("no-device");
            return;
          }
          // Other errors fall through — let ZXing try anyway.
        }

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          if (!cancelled) setStatus("no-device");
          return;
        }

        // Prefer the back camera; otherwise pick the first.
        const preferred =
          devices.find((d) => /back|rear|environment/i.test(d.label ?? "")) ??
          devices[0];

        if (!videoRef.current || cancelled) return;

        controls = await reader.decodeFromVideoDevice(
          preferred.deviceId,
          videoRef.current,
          (result) => {
            if (cancelled) return;
            if (result) {
              const text = result.getText();
              controls?.stop();
              onDetectedRef.current(text);
            }
          },
        );

        if (!cancelled) setStatus("scanning");
      } catch (e) {
        if (cancelled) return;
        const err = e as { name?: string; message?: string };
        if (err.name === "NotAllowedError") setStatus("no-permission");
        else if (err.name === "NotFoundError") setStatus("no-device");
        else {
          setStatus("error");
          setErrText(err.message ?? "Camera initialization failed");
        }
      }
    })();

    return () => {
      cancelled = true;
      controls?.stop();
      startedStream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-sm border border-[var(--hairline)] bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          muted
          playsInline
        />
        {/* Scan-line reticle — purely visual hint */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="relative h-[52%] w-[72%] rounded-sm border-2 border-white/70"
            style={{ boxShadow: "0 0 0 2000px rgba(0,0,0,0.35)" }}
          >
            <span
              className="absolute left-0 right-0 h-[2px] bg-[var(--sage)]"
              style={{
                animation: "scanline 2.2s linear infinite",
                boxShadow: "0 0 12px 2px rgba(184,216,186,0.6)",
              }}
            />
          </div>
        </div>
        <div className="absolute left-0 right-0 top-0 p-4">
          <span className="rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.08em] text-white">
            {status === "starting"
              ? "Starting camera…"
              : status === "scanning"
                ? "Point at the barcode"
                : status === "no-permission"
                  ? "Camera blocked"
                  : status === "no-device"
                    ? "No camera found"
                    : "Camera error"}
          </span>
        </div>
        <style jsx>{`
          @keyframes scanline {
            0%  { top: 0%; opacity: 0.2; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { top: 100%; opacity: 0.2; }
          }
        `}</style>
      </div>

      {status === "no-permission" && (
        <p className="text-[14px] text-[var(--muted)]">
          We need camera access to read barcodes. Grant permission in your
          browser settings and try again, or enter the barcode manually below.
        </p>
      )}
      {status === "no-device" && (
        <p className="text-[14px] text-[var(--muted)]">
          No camera detected. Enter the barcode manually below.
        </p>
      )}
      {status === "error" && (
        <p className="text-[14px] text-[var(--terra-deep)]">
          {errText ?? "Camera error."}
        </p>
      )}

      <button
        type="button"
        onClick={onCancel}
        className="btn-ghost w-full justify-center"
      >
        Cancel scan
      </button>
    </div>
  );
}
