import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CalibrationData, JumpAnalysisData, Point2D, AnalysisStep } from '../types/analyzer';
import { 
  Play, Pause, SkipBack, SkipForward, ChevronLeft, ChevronRight,
  Maximize2, Eye, EyeOff
} from 'lucide-react';

interface VideoPlayerCanvasProps {
  videoUrl: string;
  fps: number;
  currentStep: AnalysisStep;
  calibration: CalibrationData;
  onUpdateCalibrationPoints: (pointA: Point2D | null, pointB: Point2D | null) => void;
  jumpAnalysis: JumpAnalysisData;
  onUpdateJumpPoints: (analysis: Partial<JumpAnalysisData>) => void;
  onCurrentFrameChange: (frame: number, time: number) => void;
  targetJumpKey: 'takeoff' | 'peak' | 'landing' | null;
  onKeyPointCaptured?: (type: 'takeoff' | 'peak' | 'landing', frame: number, time: number, point: Point2D) => void;
}

export const VideoPlayerCanvas: React.FC<VideoPlayerCanvasProps> = ({
  videoUrl,
  fps,
  currentStep,
  calibration,
  onUpdateCalibrationPoints,
  jumpAnalysis,
  onCurrentFrameChange,
  targetJumpKey,
  onKeyPointCaptured,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showGuides, setShowGuides] = useState(true);

  // Lupa / Magnifier state
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringVideo, setIsHoveringVideo] = useState(false);

  // Dragging calibration points
  const [draggingPoint, setDraggingPoint] = useState<'A' | 'B' | null>(null);

  const totalFrames = Math.max(1, Math.round(duration * fps));

  // Actualizar frame cuando el video se mueva
  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    const f = Math.round(t * fps);
    setCurrentTime(t);
    setCurrentFrame(f);
    onCurrentFrameChange(f, t);
  }, [fps, onCurrentFrameChange]);

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setCurrentTime(0);
    setCurrentFrame(0);
  };

  // Control fino de salto de frames
  const seekToFrame = useCallback(
    (targetF: number) => {
      if (!videoRef.current) return;
      const clampedF = Math.max(0, Math.min(totalFrames, targetF));
      const targetT = clampedF / fps;
      videoRef.current.currentTime = targetT;
      setCurrentTime(targetT);
      setCurrentFrame(clampedF);
      onCurrentFrameChange(clampedF, targetT);
    },
    [fps, totalFrames, onCurrentFrameChange]
  );

  const stepFrame = (delta: number) => {
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    seekToFrame(currentFrame + delta);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  // Convertir coordenadas del click en canvas a normalizadas (0-1)
  const getCanvasNormalizedCoords = (e: React.MouseEvent<HTMLCanvasElement>): Point2D | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    return { x, y };
  };

  // Manejo de clicks en el canvas según la etapa activa
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasNormalizedCoords(e);
    if (!coords) return;

    if (currentStep === 'calibration') {
      // Si falta Punto A, colocar A
      if (!calibration.pointA) {
        onUpdateCalibrationPoints(coords, calibration.pointB);
      } else if (!calibration.pointB) {
        // Si falta Punto B, colocar B
        onUpdateCalibrationPoints(calibration.pointA, coords);
      } else {
        // Si ambos existen, mover el más cercano
        const distA = Math.hypot(coords.x - calibration.pointA.x, coords.y - calibration.pointA.y);
        const distB = Math.hypot(coords.x - calibration.pointB.x, coords.y - calibration.pointB.y);
        if (distA < distB) {
          onUpdateCalibrationPoints(coords, calibration.pointB);
        } else {
          onUpdateCalibrationPoints(calibration.pointA, coords);
        }
      }
    } else if (currentStep === 'tracking' && targetJumpKey && onKeyPointCaptured) {
      // Capturar punto clave activo con sus coordenadas
      onKeyPointCaptured(targetJumpKey, currentFrame, currentTime, coords);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (currentStep !== 'calibration') return;
    const coords = getCanvasNormalizedCoords(e);
    if (!coords) return;

    const threshold = 0.04; // radio de detección
    if (calibration.pointA && Math.hypot(coords.x - calibration.pointA.x, coords.y - calibration.pointA.y) < threshold) {
      setDraggingPoint('A');
    } else if (calibration.pointB && Math.hypot(coords.x - calibration.pointB.x, coords.y - calibration.pointB.y) < threshold) {
      setDraggingPoint('B');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setCursorPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (draggingPoint && currentStep === 'calibration') {
      const coords = getCanvasNormalizedCoords(e);
      if (coords) {
        if (draggingPoint === 'A') {
          onUpdateCalibrationPoints(coords, calibration.pointB);
        } else if (draggingPoint === 'B') {
          onUpdateCalibrationPoints(calibration.pointA, coords);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingPoint(null);
  };

  // Renderizado del Canvas Overlay (Líneas, puntos, cinta amarilla y lupa)
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar dimensiones del canvas a las del video
    if (canvas.width !== video.clientWidth || canvas.height !== video.clientHeight) {
      canvas.width = video.clientWidth;
      canvas.height = video.clientHeight;
    }

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!showGuides || w === 0 || h === 0) return;

    // 1. DIBUJAR CALIBRACIÓN DE LA CINTA
    const refColor = calibration.referenceColor || '#EAB308';
    const refColorName = calibration.referenceColorName || 'Cinta';

    if (calibration.pointA && calibration.pointB) {
      const ax = calibration.pointA.x * w;
      const ay = calibration.pointA.y * h;
      const bx = calibration.pointB.x * w;
      const by = calibration.pointB.y * h;

      // Resplandor de la cinta
      ctx.save();
      ctx.strokeStyle = `${refColor}66`; // 40% opacidad
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();

      // Línea principal de la cinta
      ctx.strokeStyle = refColor;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 3]);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);

      // Puntos en extremos
      // Punto A (Base)
      ctx.fillStyle = refColor;
      ctx.beginPath();
      ctx.arc(ax, ay, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Punto B (Tope)
      ctx.fillStyle = refColor;
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ticks intermedios de escala
      const dist = Math.hypot(bx - ax, by - ay);
      const angle = Math.atan2(by - ay, bx - ax);
      const normalAngle = angle + Math.PI / 2;
      const ticks = 10;
      ctx.strokeStyle = refColor;
      ctx.lineWidth = 1.5;
      for (let i = 1; i < ticks; i++) {
        const tx = ax + (bx - ax) * (i / ticks);
        const ty = ay + (by - ay) * (i / ticks);
        ctx.beginPath();
        ctx.moveTo(tx - Math.cos(normalAngle) * 6, ty - Math.sin(normalAngle) * 6);
        ctx.lineTo(tx + Math.cos(normalAngle) * 6, ty + Math.sin(normalAngle) * 6);
        ctx.stroke();
      }

      // Etiqueta de longitud y color
      const midX = (ax + bx) / 2;
      const midY = (ay + by) / 2;
      const labelText = `${refColorName}: ${calibration.realDistanceMeters.toFixed(2)} m (${Math.round(dist)} px)`;
      ctx.font = '11px monospace';
      const textWidth = ctx.measureText(labelText).width;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(midX - textWidth / 2 - 6, midY - 12, textWidth + 12, 22);
      ctx.strokeStyle = refColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(midX - textWidth / 2 - 6, midY - 12, textWidth + 12, 22);
      ctx.fillStyle = refColor;
      ctx.fillText(labelText, midX - textWidth / 2, midY + 3);

      ctx.restore();
    } else if (calibration.pointA) {
      // Solo Punto A
      const ax = calibration.pointA.x * w;
      const ay = calibration.pointA.y * h;
      ctx.fillStyle = refColor;
      ctx.beginPath();
      ctx.arc(ax, ay, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(ax + 10, ay - 10, 110, 20);
      ctx.fillStyle = refColor;
      ctx.font = '11px monospace';
      ctx.fillText('A: Base (0.00m)', ax + 14, ay + 4);
    }

    // 2. DIBUJAR PUNTOS CLAVE DEL SALTO (Despegue, Altura Máxima, Aterrizaje)
    const { takeoff, peak, landing } = jumpAnalysis;

    // Despegue (Rojo/Naranja)
    if (takeoff) {
      const tx = takeoff.xNormalized * w;
      const ty = takeoff.yNormalized * h;
      drawMarkerPoint(ctx, tx, ty, '#F97316', `Despegue (F#${takeoff.frame})`, currentFrame === takeoff.frame);
    }

    // Altura Máxima / Peak (Cian brillante)
    if (peak) {
      const px = peak.xNormalized * w;
      const py = peak.yNormalized * h;
      drawMarkerPoint(ctx, px, py, '#06B6D4', `Pico Máximo (F#${peak.frame})`, currentFrame === peak.frame);

      // LÍNEA LÁSER HORIZONTAL HACIA LA CINTA AMARILLA
      if (calibration.pointA && calibration.pointB) {
        const tapeX = ((calibration.pointA.x + calibration.pointB.x) / 2) * w;
        ctx.save();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(tapeX, py);
        ctx.stroke();

        // Marcador sobre la cinta a la altura del salto
        ctx.fillStyle = '#06B6D4';
        ctx.beginPath();
        ctx.arc(tapeX, py, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // Aterrizaje (Esmeralda)
    if (landing) {
      const lx = landing.xNormalized * w;
      const ly = landing.yNormalized * h;
      drawMarkerPoint(ctx, lx, ly, '#10B981', `Aterrizaje (F#${landing.frame})`, currentFrame === landing.frame);
    }

    // Diferencia vertical del salto si existen despegue y pico
    if (takeoff && peak) {
      const tx = takeoff.xNormalized * w;
      const ty = takeoff.yNormalized * h;
      const py = peak.yNormalized * h;
      const deltaYpx = Math.abs(ty - py);

      // Línea de cota vertical entre despegue y pico
      const cotaX = Math.max(tx, peak.xNormalized * w) + 35;
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cotaX, ty);
      ctx.lineTo(cotaX, py);
      ctx.stroke();

      // Flechas
      drawArrow(ctx, cotaX, ty, cotaX, py);
      drawArrow(ctx, cotaX, py, cotaX, ty);

      // Etiqueta de altura óptica en metros si está calibrado
      let heightStr = `${Math.round(deltaYpx)} px`;
      if (calibration.pixelsPerMeter && calibration.pixelsPerMeter > 0) {
        const hMeters = deltaYpx / calibration.pixelsPerMeter;
        heightStr = `Δh = ${(hMeters * 100).toFixed(1)} cm`;
      }

      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(cotaX + 6, (ty + py) / 2 - 10, 110, 20);
      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(heightStr, cotaX + 12, (ty + py) / 2 + 4);
      ctx.restore();
    }

    // 3. LUPA DE PRECISIÓN (MAGNIFIER)
    // Se muestra si el usuario está en modo calibración o marcando salto y mueve el mouse
    if (isHoveringVideo && cursorPos && (currentStep === 'calibration' || targetJumpKey)) {
      drawMagnifierLens(ctx, video, cursorPos.x, cursorPos.y, w, h);
    }
  }, [
    showGuides,
    calibration,
    jumpAnalysis,
    currentFrame,
    cursorPos,
    isHoveringVideo,
    currentStep,
    targetJumpKey,
  ]);

  // Función auxiliar para dibujar un marcador de punto
  function drawMarkerPoint(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    label: string,
    isActiveFrame: boolean
  ) {
    ctx.save();
    // Halo si es el frame actual
    if (isActiveFrame) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 14, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Cruz de mira
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x + 10, y);
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 10);
    ctx.stroke();

    // Punto central
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Etiqueta
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(x + 10, y - 18, 125, 18);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 10, y - 18, 125, 18);
    ctx.fillStyle = color;
    ctx.font = '10px monospace';
    ctx.fillText(label, x + 14, y - 5);
    ctx.restore();
  }

  // Función para dibujar flechas de cota
  function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) {
    const headLen = 6;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  }

  // Lupa flotante con magnificación x2.5 para acertar en la cinta amarilla
  function drawMagnifierLens(
    ctx: CanvasRenderingContext2D,
    video: HTMLVideoElement,
    mouseX: number,
    mouseY: number,
    canvasW: number,
    canvasH: number
  ) {
    const lensRadius = 55;
    const zoom = 2.4;

    // Posición del lente (offset para no tapar el cursor)
    let lensX = mouseX + 85;
    let lensY = mouseY - 85;
    if (lensX + lensRadius > canvasW) lensX = mouseX - 85;
    if (lensY - lensRadius < 0) lensY = mouseY + 85;

    ctx.save();
    // Borde circular de la lente
    ctx.beginPath();
    ctx.arc(lensX, lensY, lensRadius, 0, Math.PI * 2);
    ctx.clip();

    // Fondo oscuro
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(lensX - lensRadius, lensY - lensRadius, lensRadius * 2, lensRadius * 2);

    // Dibujar cuadro de video magnificado
    // Mapear coordenadas del canvas a coordenadas intrínsecas del video
    const videoRatioX = video.videoWidth / canvasW;
    const videoRatioY = video.videoHeight / canvasH;
    const srcX = mouseX * videoRatioX;
    const srcY = mouseY * videoRatioY;
    const srcW = (lensRadius * 2 * videoRatioX) / zoom;
    const srcH = (lensRadius * 2 * videoRatioY) / zoom;

    try {
      ctx.drawImage(
        video,
        srcX - srcW / 2,
        srcY - srcH / 2,
        srcW,
        srcH,
        lensX - lensRadius,
        lensY - lensRadius,
        lensRadius * 2,
        lensRadius * 2
      );
    } catch {
      // Si el video tiene CORS restringido se maneja pacíficamente
    }

    // Retícula central de la lupa
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lensX - 16, lensY);
    ctx.lineTo(lensX + 16, lensY);
    ctx.moveTo(lensX, lensY - 16);
    ctx.lineTo(lensX, lensY + 16);
    ctx.stroke();

    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(lensX, lensY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Marco exterior de la lupa
    ctx.save();
    ctx.strokeStyle = '#EAB308';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(lensX, lensY, lensRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Etiqueta de lupa
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(lensX - 32, lensY + lensRadius - 16, 64, 18);
    ctx.fillStyle = '#FACC15';
    ctx.font = 'bold 9px monospace';
    ctx.fillText('LUPA 2.4X', lensX - 25, lensY + lensRadius - 4);
    ctx.restore();
  }

  // Atajos de teclado para desplazamiento por fotograma
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo en un input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepFrame(e.shiftKey ? 5 : 1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepFrame(e.shiftKey ? -5 : -1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentFrame, totalFrames, togglePlay, stepFrame]);

  return (
    <div className="flex flex-col bg-[#0F1420] border border-slate-800 rounded-lg overflow-hidden shadow-xl">
      {/* Barra superior de telemetría del visor */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 bg-[#0B0F19] text-xs">
        <div className="flex items-center gap-3">
          <span className="font-mono tabular-nums text-sky-400 font-semibold">
            FRAME #{String(currentFrame).padStart(4, '0')}
          </span>
          <span className="text-slate-500">/</span>
          <span className="font-mono tabular-nums text-slate-400">
            {String(totalFrames).padStart(4, '0')} FRAMES
          </span>
          <span className="text-slate-600">·</span>
          <span className="font-mono tabular-nums text-slate-300">
            {currentTime.toFixed(3)}s
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuides(!showGuides)}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Activar/desactivar guías visuales"
          >
            {showGuides ? <Eye size={14} className="text-amber-400" /> : <EyeOff size={14} />}
            <span>{showGuides ? 'Guías ON' : 'Guías OFF'}</span>
          </button>
        </div>
      </div>

      {/* Contenedor del video y Canvas interactivo */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center bg-black min-h-[380px] max-h-[640px] select-none overflow-hidden cursor-crosshair"
        onMouseEnter={() => setIsHoveringVideo(true)}
        onMouseLeave={() => {
          setIsHoveringVideo(false);
          setDraggingPoint(null);
        }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          muted
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          className="max-h-[620px] w-auto max-w-full object-contain pointer-events-none"
        />

        {/* Canvas de anotación y calibración superpuesto */}
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="absolute inset-0 w-full h-full z-10 touch-none"
        />

        {/* Indicador de etapa en esquina inferior */}
        <div className="absolute bottom-3 left-3 z-20 pointer-events-none bg-slate-950/85 backdrop-blur-sm border border-slate-800 rounded px-2.5 py-1 text-[11px] font-mono text-slate-300">
          {currentStep === 'calibration' && (
            <span className="text-amber-400">
              Modo Calibración: Haz clic en Base (A) y Tope (B) de la cinta amarilla
            </span>
          )}
          {currentStep === 'tracking' && targetJumpKey && (
            <span className="text-cyan-400">
              Modo Marcado: Haz clic sobre el atleta para marcar {targetJumpKey.toUpperCase()}
            </span>
          )}
          {currentStep === 'tracking' && !targetJumpKey && (
            <span className="text-slate-400">
              Usa los botones laterales para seleccionar qué cuadro capturar
            </span>
          )}
          {currentStep === 'report' && (
            <span className="text-emerald-400">
              Reporte generado: Visualizando cotas y trayectoria
            </span>
          )}
        </div>
      </div>

      {/* Barra de control temporal y frame scrubber */}
      <div className="p-4 bg-[#0B0F19] border-t border-slate-800 space-y-3">
        {/* Scrubber deslizante con marcas de puntos clave */}
        <div className="relative flex items-center">
          <input
            type="range"
            min={0}
            max={totalFrames}
            value={currentFrame}
            onChange={(e) => seekToFrame(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />

          {/* Marcadores de despegue y aterrizaje en la línea de tiempo */}
          {jumpAnalysis.takeoff && totalFrames > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-3.5 bg-orange-500 rounded-xs pointer-events-none z-10"
              style={{ left: `${(jumpAnalysis.takeoff.frame / totalFrames) * 100}%` }}
              title={`Despegue Frame #${jumpAnalysis.takeoff.frame}`}
            />
          )}
          {jumpAnalysis.peak && totalFrames > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-4 bg-cyan-400 rounded-xs pointer-events-none z-10"
              style={{ left: `${(jumpAnalysis.peak.frame / totalFrames) * 100}%` }}
              title={`Pico Máximo Frame #${jumpAnalysis.peak.frame}`}
            />
          )}
          {jumpAnalysis.landing && totalFrames > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-3.5 bg-emerald-500 rounded-xs pointer-events-none z-10"
              style={{ left: `${(jumpAnalysis.landing.frame / totalFrames) * 100}%` }}
              title={`Aterrizaje Frame #${jumpAnalysis.landing.frame}`}
            />
          )}
        </div>

        {/* Controles de reproducción cuadro por cuadro */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Botones de paso fino */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => stepFrame(-5)}
              className="flex items-center px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono transition-colors cursor-pointer"
              title="Retroceder 5 fotogramas (Shift + Flecha Izquierda)"
            >
              <SkipBack size={13} className="mr-1" /> -5f
            </button>

            <button
              onClick={() => stepFrame(-1)}
              className="flex items-center px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono transition-colors cursor-pointer"
              title="Retroceder 1 fotograma (Flecha Izquierda)"
            >
              <ChevronLeft size={15} /> -1f
            </button>

            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-8 h-8 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded transition-colors cursor-pointer mx-1"
              title="Reproducir / Pausar (Barra espaciadora)"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
            </button>

            <button
              onClick={() => stepFrame(1)}
              className="flex items-center px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono transition-colors cursor-pointer"
              title="Avanzar 1 fotograma (Flecha Derecha)"
            >
              +1f <ChevronRight size={15} />
            </button>

            <button
              onClick={() => stepFrame(5)}
              className="flex items-center px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono transition-colors cursor-pointer"
              title="Avanzar 5 fotogramas (Shift + Flecha Derecha)"
            >
              +5f <SkipForward size={13} className="ml-1" />
            </button>
          </div>

          {/* Selector de velocidad para análisis en cámara lenta */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-1">
            <span className="text-[10px] text-slate-400 px-1 font-mono uppercase">Velocidad:</span>
            {[0.1, 0.25, 0.5, 1.0].map((rate) => (
              <button
                key={rate}
                onClick={() => changePlaybackRate(rate)}
                className={`px-1.5 py-0.5 text-[11px] font-mono rounded cursor-pointer transition-colors ${
                  playbackRate === rate
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
