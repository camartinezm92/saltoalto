import React, { useState } from 'react';
import { JumpAnalysisData, CalibrationData, Point2D } from '../types/analyzer';
import { 
  Crosshair, Check, FastForward, ArrowRight, Sparkles, User, RefreshCw 
} from 'lucide-react';
import { GRAVITY } from '../utils/biomechanics';

interface JumpMarkingPanelProps {
  currentFrame: number;
  currentTime: number;
  fps: number;
  calibration: CalibrationData;
  jumpAnalysis: JumpAnalysisData;
  targetJumpKey: 'takeoff' | 'peak' | 'landing' | null;
  onSetTargetJumpKey: (key: 'takeoff' | 'peak' | 'landing' | null) => void;
  onCaptureCurrentFrame: (type: 'takeoff' | 'peak' | 'landing') => void;
  onResetJumpMarks: () => void;
  onProceedToReport: () => void;
  onAutoPresetJump?: () => void;
  athleteMass: number;
  onAthleteMassChange: (mass: number) => void;
}

export const JumpMarkingPanel: React.FC<JumpMarkingPanelProps> = ({
  currentFrame,
  currentTime,
  fps,
  calibration,
  jumpAnalysis,
  targetJumpKey,
  onSetTargetJumpKey,
  onCaptureCurrentFrame,
  onResetJumpMarks,
  onProceedToReport,
  onAutoPresetJump,
  athleteMass,
  onAthleteMassChange,
}) => {
  const { takeoff, peak, landing } = jumpAnalysis;

  // Cálculos en vivo preliminares si hay datos
  let liveFlightTime: number | null = null;
  let liveKinematicHeightCm: number | null = null;
  let liveTakeoffVelocityMps: number | null = null;
  let liveOpticalHeightCm: number | null = null;

  if (takeoff && landing && landing.frame > takeoff.frame) {
    liveFlightTime = (landing.frame - takeoff.frame) / fps;
    liveKinematicHeightCm = ((GRAVITY * Math.pow(liveFlightTime, 2)) / 8) * 100;
    liveTakeoffVelocityMps = (GRAVITY * liveFlightTime) / 2;
  }

  if (takeoff && peak && calibration.pixelsPerMeter && calibration.pixelsPerMeter > 0) {
    // Estimación óptica
    const deltaYNormalized = Math.abs(takeoff.yNormalized - peak.yNormalized);
    // Asumiendo altura estándar 1280px para previsualización inmediata si no está en reporte
    const estimatedHeightM = (deltaYNormalized * 1280) / calibration.pixelsPerMeter;
    liveOpticalHeightCm = estimatedHeightM * 100;
  }

  const isReadyForReport = Boolean(takeoff && peak && landing);

  return (
    <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Crosshair size={16} className="text-cyan-400" />
          <span>Paso 3: Marcado de Fotogramas Clave del Salto</span>
        </h2>
        {onAutoPresetJump && (
          <button
            type="button"
            onClick={onAutoPresetJump}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-medium"
            title="Auto-marcar momentos del salto para el video de demo"
          >
            <Sparkles size={12} /> Auto-Marcar Demo
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Usa los controles de avance cuadro a cuadro (-1f, +1f) en el reproductor para ubicar con exactitud el instante del despegue, la altura máxima y el contacto de caída.
      </p>

      {/* Indicador de posición actual en el video */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-md p-3 flex items-center justify-between font-mono text-xs">
        <span className="text-slate-400">Posición en video:</span>
        <span className="text-sky-300 font-bold">
          Frame #{currentFrame} · {currentTime.toFixed(3)}s
        </span>
      </div>

      {/* Los 3 Puntos Clave a Capturar */}
      <div className="space-y-3">
        {/* 1. DESPEGUE (TAKEOFF) */}
        <div
          className={`p-3 rounded-md border transition-all ${
            targetJumpKey === 'takeoff'
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-slate-800 bg-slate-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="text-xs font-bold text-slate-200">1. Despegue (Takeoff)</span>
            </div>
            {takeoff ? (
              <span className="text-[11px] font-mono text-orange-400 flex items-center gap-1">
                <Check size={12} /> F#{takeoff.frame} ({takeoff.timeSeconds.toFixed(3)}s)
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">Pendiente</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Último fotograma donde la punta de los pies o talones toca el suelo.
          </div>
          <div className="flex gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => onCaptureCurrentFrame('takeoff')}
              className="flex-1 px-2.5 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 text-xs font-semibold rounded cursor-pointer transition-colors"
            >
              Capturar Frame Actual (#{currentFrame})
            </button>
            <button
              type="button"
              onClick={() => onSetTargetJumpKey(targetJumpKey === 'takeoff' ? null : 'takeoff')}
              className={`px-2 py-1.5 border text-xs rounded font-mono cursor-pointer transition-colors ${
                targetJumpKey === 'takeoff'
                  ? 'bg-orange-500 text-slate-950 font-bold border-orange-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Activar click en video para ubicar punto de referencia exacto"
            >
              Marcar Pin
            </button>
          </div>
        </div>

        {/* 2. ALTURA MÁXIMA (PEAK) */}
        <div
          className={`p-3 rounded-md border transition-all ${
            targetJumpKey === 'peak'
              ? 'border-cyan-400 bg-cyan-400/10'
              : 'border-slate-800 bg-slate-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-xs font-bold text-slate-200">2. Altura Máxima (Apogeo)</span>
            </div>
            {peak ? (
              <span className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
                <Check size={12} /> F#{peak.frame} ({peak.timeSeconds.toFixed(3)}s)
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">Pendiente</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Fotograma donde el atleta alcanza el punto más alto antes de descender.
          </div>
          <div className="flex gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => onCaptureCurrentFrame('peak')}
              className="flex-1 px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-semibold rounded cursor-pointer transition-colors"
            >
              Capturar Frame Actual (#{currentFrame})
            </button>
            <button
              type="button"
              onClick={() => onSetTargetJumpKey(targetJumpKey === 'peak' ? null : 'peak')}
              className={`px-2 py-1.5 border text-xs rounded font-mono cursor-pointer transition-colors ${
                targetJumpKey === 'peak'
                  ? 'bg-cyan-400 text-slate-950 font-bold border-cyan-300'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Activar click en video para ubicar punto de referencia exacto"
            >
              Marcar Pin
            </button>
          </div>
        </div>

        {/* 3. ATERRIZAJE (LANDING) */}
        <div
          className={`p-3 rounded-md border transition-all ${
            targetJumpKey === 'landing'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-slate-800 bg-slate-900/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-slate-200">3. Aterrizaje (Landing)</span>
            </div>
            {landing ? (
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                <Check size={12} /> F#{landing.frame} ({landing.timeSeconds.toFixed(3)}s)
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-500">Pendiente</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Primer fotograma del contacto con el suelo al caer.
          </div>
          <div className="flex gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => onCaptureCurrentFrame('landing')}
              className="flex-1 px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded cursor-pointer transition-colors"
            >
              Capturar Frame Actual (#{currentFrame})
            </button>
            <button
              type="button"
              onClick={() => onSetTargetJumpKey(targetJumpKey === 'landing' ? null : 'landing')}
              className={`px-2 py-1.5 border text-xs rounded font-mono cursor-pointer transition-colors ${
                targetJumpKey === 'landing'
                  ? 'bg-emerald-400 text-slate-950 font-bold border-emerald-300'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
              title="Activar click en video para ubicar punto de referencia exacto"
            >
              Marcar Pin
            </button>
          </div>
        </div>
      </div>

      {/* Peso del Atleta para Cálculo de Potencia (Sayers y Lewis) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-md p-3 space-y-1.5">
        <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <User size={13} className="text-slate-400" />
            Masa corporal del atleta (opcional):
          </span>
          <span className="font-mono text-xs text-sky-400 font-bold">{athleteMass} kg</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="30"
            max="180"
            value={athleteMass}
            onChange={(e) => onAthleteMassChange(Math.max(1, Number(e.target.value) || 70))}
            className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-100"
          />
          <span className="text-[11px] text-slate-500">kg (utilizado para estimar Potencia en Watts)</span>
        </div>
      </div>

      {/* Previsualización instantánea de telemetría si ya hay datos */}
      {liveFlightTime !== null && (
        <div className="bg-slate-950 border border-slate-800 rounded-md p-3 space-y-2">
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
            Previsualización Cinética Preliminar:
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500">Tiempo Vuelo</div>
              <div className="font-mono text-xs font-bold text-amber-400 mt-0.5">
                {liveFlightTime.toFixed(3)}s
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500">Altura Salto</div>
              <div className="font-mono text-xs font-bold text-cyan-400 mt-0.5">
                {liveKinematicHeightCm ? `${liveKinematicHeightCm.toFixed(1)} cm` : '--'}
              </div>
            </div>

            <div className="bg-slate-900/80 p-2 rounded border border-slate-800/80">
              <div className="text-[10px] text-slate-500">Velocidad v₀</div>
              <div className="font-mono text-xs font-bold text-emerald-400 mt-0.5">
                {liveTakeoffVelocityMps ? `${liveTakeoffVelocityMps.toFixed(2)} m/s` : '--'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onResetJumpMarks}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={13} /> Limpiar Marcas
        </button>

        <button
          type="button"
          onClick={onProceedToReport}
          disabled={!isReadyForReport}
          className={`flex-1 px-4 py-2 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1.5 ${
            isReadyForReport
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 cursor-pointer shadow-lg'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>Paso 4: Ver Informe Final</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
