'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import clsx from 'clsx';

interface SignatureCanvasProps {
  onSignatureChange?: (signatureData: string | null) => void;
  width?: number;
  height?: number;
  className?: string;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignatureChange,
  width = 320,
  height = 192,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  // useRef to track drawing state synchronously
  const hasDrawnRef = useRef(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Set drawing styles
    ctx.strokeStyle = '#191F28';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [width, height]);

  const getCoordinates = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      let x: number, y: number;

      if ('touches' in event) {
        const touch = event.touches[0];
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
      } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      }

      return { x, y };
    },
    []
  );

  const startDrawing = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      event.preventDefault();
      const coords = getCoordinates(event);
      if (!coords) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
      setIsDrawing(true);
    },
    [getCoordinates]
  );

  const draw = useCallback(
    (event: React.TouchEvent | React.MouseEvent) => {
      event.preventDefault();
      if (!isDrawing) return;

      const coords = getCoordinates(event);
      if (!coords) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      hasDrawnRef.current = true;
      setHasSignature(true);
    },
    [isDrawing, getCoordinates]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }

    setIsDrawing(false);

    // Export signature as base64 (use ref for synchronous check)
    if (canvas && hasDrawnRef.current) {
      const signatureData = canvas.toDataURL('image/png');
      onSignatureChange?.(signatureData);
    }
  }, [isDrawing, onSignatureChange]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    hasDrawnRef.current = false;
    setHasSignature(false);
    onSignatureChange?.(null);
  }, [onSignatureChange]);

  return (
    <div className={clsx('relative', className)}>
      <canvas
        ref={canvasRef}
        className="w-full bg-gray-50 rounded-2xl border-2 border-gray-200 touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />

      {/* Placeholder text */}
      {!hasSignature && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-gray-300 text-[15px]">여기에 서명하세요</span>
        </div>
      )}

      {/* Clear button */}
      {hasSignature && (
        <button
          type="button"
          onClick={clearCanvas}
          className="absolute top-3 right-3 text-[14px] text-gray-500 bg-white/80 px-3 py-1 rounded-full"
        >
          다시 쓰기
        </button>
      )}
    </div>
  );
};

export default SignatureCanvas;
