import React, { useState } from 'react';
import { CalibrationData, Point2D } from '../types/analyzer';
import { 
  Ruler, Check, RefreshCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Sparkles, Palette, Tag
} from 'lucide-react';

interface CalibrationPanelProps {
  calibration: CalibrationData;
  onUpdateCalibration: (data: Partial<CalibrationData>) => void;
  onResetPoints: () => void;
  onProceedToTracking: () => void;
  onAutoPreset?: () => void;
}

const COLOR_PRESETS = [
  { name: 'Amarillo', hex: '#EAB308', desc: 'Cinta métrica clásica' },
  { name: 'Blanco', hex: '#F8FAFC', desc: 'Cinta o tiza blanca' },
  { name: 'Rojo', hex: '#EF4444', desc: 'Cinta roja o cinta aislante' },
  { name: 'Azul', hex: '#3B82F6', desc: 'Cinta de pintor o carril azul' },
  { name: 'Verde', hex: '#22C55E', desc: 'Cinta verde flúor' },
  { name: 'Naranja', hex: '#F97316', desc: 'Naranja reflectante' },
];

export const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  calibration,
  onUpdateCalibration,
  onResetPoints,
  onProceedToTracking,
  onAutoPreset,
}) => {
  const [selectedPin, setSelectedPin] = useState<'A' | 'B'>('A');

  const handleDistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val) && val > 0) {
      onUpdateCalibration({ realDistanceMeters: val });
    }
  };

  const handleColorSelect = (colorName: string, hex: string) => {
    onUpdateCalibration({
      referenceColor: hex,
      referenceColorName: colorName,
    });
  };

  // Ajuste milimétrico (nudge) de 1px en coordenadas normalizadas
  const nudgePin = (dx: number, dy: number) => {
    const step = 0.002; // aprox 1-2 píxeles
    if (selectedPin === 'A' && calibration.pointA) {
      const newPointA: Point2D = {
        x: Math.max(0, Math.min(1, calibration.pointA.x + dx * step)),
        y: Math.max(0, Math.min(1, calibration.pointA.y + dy * step)),
      };
      onUpdateCalibration({ pointA: newPointA });
    } else if (selectedPin === 'B' && calibration.pointB) {
      const newPointB: Point2D = {
        x: Math.max(0, Math.min(1, calibration.pointB.x + dx * step)),
        y: Math.max(0, Math.min(1, calibration.pointB.y + dy * step)),
      };
      onUpdateCalibration({ pointB: newPointB });
    }
  };

  const isComplete = Boolean(calibration.pointA && calibration.pointB && calibration.pixelsPerMeter);

  return (
    <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Ruler size={16} style={{ color: calibration.referenceColor }} />
          <span>Paso 2: Calibración de la Referencia de Fondo</span>
        </h2>
        {onAutoPreset && (
          <button
            type="button"
            onClick={onAutoPreset}
            className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-medium"
            title="Auto-posicionar puntos de la cinta en el video de demo"
          >
            <Sparkles size={12} /> Auto-Ajustar Demo
          </button>
        )}
      </div>

      <p className="text-xs text-slate-400">
        Indica los datos exactos del elemento de referencia (color y longitud visible) para que el visor y el reporte final registren la información actualizada y sin errores.
      </p>

      {/* 1. Selector de Color de la Cinta */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-md p-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium text-slate-200">
          <span className="flex items-center gap-1.5">
            <Palette size={13} className="text-slate-400" />
            Color de la cinta o guía en el video:
          </span>
          <span className="font-mono text-[11px] font-bold flex items-center gap-1.5" style={{ color: calibration.referenceColor }}>
            <span
              className="w-2.5 h-2.5 rounded-full inline-block border border-black/40"
              style={{ backgroundColor: calibration.referenceColor }}
            />
            {calibration.referenceColorName}
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
          {COLOR_PRESETS.map((preset) => {
            const isSelected = calibration.referenceColorName === preset.name;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleColorSelect(preset.name, preset.hex)}
                className={`flex flex-col items-center justify-center p-1.5 rounded border text-[11px] font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'border-slate-300 bg-slate-800 shadow-sm'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-400'
                }`}
                title={preset.desc}
              >
                <span
                  className="w-4 h-4 rounded-full mb-1 border border-black/40 shadow-xs"
                  style={{ backgroundColor: preset.hex }}
                />
                <span className={isSelected ? 'text-slate-100 font-bold' : 'text-slate-400'}>
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Entrada de Medida Real de la Cinta */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-md p-3.5 space-y-2">
        <label className="text-xs font-medium text-slate-200 flex items-center justify-between">
          <span>Medida real exacta visible de la cinta:</span>
          <span className="font-mono text-xs font-bold" style={{ color: calibration.referenceColor }}>
            {calibration.realDistanceMeters.toFixed(2)} m ({(calibration.realDistanceMeters * 100).toFixed(0)} cm)
          </span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0.1"
            max="10.0"
            value={calibration.realDistanceMeters}
            onChange={handleDistanceChange}
            className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none"
            style={{ borderColor: calibration.referenceColor }}
          />
          <span className="text-xs text-slate-400 font-mono">Metros (m)</span>
        </div>
        <div className="flex gap-1.5 pt-0.5">
          {[1.95, 2.0, 1.8, 1.5, 1.0].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onUpdateCalibration({ realDistanceMeters: preset })}
              className={`px-2 py-0.5 text-[10px] font-mono rounded cursor-pointer transition-colors ${
                calibration.realDistanceMeters === preset
                  ? 'bg-slate-100 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {preset.toFixed(2)}m
            </button>
          ))}
        </div>
      </div>

      {/* 3. Marcado de los 2 Puntos en el Visor */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-slate-300">
          Ubicación de los extremos en el visor (usa la lupa integrada):
        </div>

        {/* Punto A: Base */}
        <div
          onClick={() => setSelectedPin('A')}
          className={`flex items-center justify-between p-2.5 rounded-md border cursor-pointer transition-colors ${
            selectedPin === 'A'
              ? 'border-slate-400 bg-slate-800/80'
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded-full text-slate-950 text-xs font-bold flex items-center justify-center"
              style={{ backgroundColor: calibration.referenceColor }}
            >
              A
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">Punto Base (Suelo / 0.00 m)</div>
              <div className="text-[10px] text-slate-500 font-mono">
                {calibration.pointA
                  ? `X: ${(calibration.pointA.x * 100).toFixed(1)}% · Y: ${(calibration.pointA.y * 100).toFixed(1)}%`
                  : 'Haz clic en la base de la cinta en el video'}
              </div>
            </div>
          </div>
          {calibration.pointA ? (
            <span className="text-[11px] font-medium flex items-center gap-1 font-mono text-emerald-400">
              <Check size={13} /> Listo
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">Pendiente</span>
          )}
        </div>

        {/* Punto B: Tope */}
        <div
          onClick={() => setSelectedPin('B')}
          className={`flex items-center justify-between p-2.5 rounded-md border cursor-pointer transition-colors ${
            selectedPin === 'B'
              ? 'border-slate-400 bg-slate-800/80'
              : 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-5 h-5 rounded-full text-slate-950 text-xs font-bold flex items-center justify-center"
              style={{ backgroundColor: calibration.referenceColor }}
            >
              B
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-200">
                Punto Tope (Marca {calibration.realDistanceMeters.toFixed(2)} m)
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {calibration.pointB
                  ? `X: ${(calibration.pointB.x * 100).toFixed(1)}% · Y: ${(calibration.pointB.y * 100).toFixed(1)}%`
                  : 'Haz clic en el extremo superior de la cinta'}
              </div>
            </div>
          </div>
          {calibration.pointB ? (
            <span className="text-[11px] font-medium flex items-center gap-1 font-mono text-emerald-400">
              <Check size={13} /> Listo
            </span>
          ) : (
            <span className="text-[11px] text-slate-500 font-mono">Pendiente</span>
          )}
        </div>
      </div>

      {/* Ajuste fino micrométrico */}
      {(calibration.pointA || calibration.pointB) && (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-md p-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Ajuste fino del Punto {selectedPin} (1 píxel):</span>
            <span className="font-mono text-slate-200 font-bold">Activo: Punto {selectedPin}</span>
          </div>

          <div className="flex justify-center items-center gap-1.5 py-0.5">
            <button
              onClick={() => nudgePin(-1, 0)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
              title="Mover 1px izquierda"
            >
              <ArrowLeft size={13} />
            </button>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => nudgePin(0, -1)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                title="Mover 1px arriba"
              >
                <ArrowUp size={13} />
              </button>
              <button
                onClick={() => nudgePin(0, 1)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                title="Mover 1px abajo"
              >
                <ArrowDown size={13} />
              </button>
            </div>
            <button
              onClick={() => nudgePin(1, 0)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
              title="Mover 1px derecha"
            >
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Escala calculada */}
      {calibration.pixelsPerMeter && (
        <div className="bg-slate-900 border border-slate-800 rounded-md p-3 space-y-1">
          <div className="text-[11px] font-mono uppercase text-slate-300 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ backgroundColor: calibration.referenceColor }}
              />
              Escala Fotogramétrica Actualizada:
            </span>
            <span className="text-cyan-400 font-bold">{Math.round(calibration.pixelsPerMeter)} px/metro</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {calibration.pixelDistance ? Math.round(calibration.pixelDistance) : 0} px en pantalla = {calibration.realDistanceMeters.toFixed(2)} m reales ({calibration.referenceColorName})
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onResetPoints}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw size={13} /> Limpiar
        </button>

        <button
          type="button"
          onClick={onProceedToTracking}
          disabled={!isComplete}
          className={`flex-1 px-4 py-2 text-xs font-bold rounded transition-colors flex items-center justify-center gap-1.5 ${
            isComplete
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 cursor-pointer shadow-md'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>Paso 3: Marcar Salto</span>
        </button>
      </div>
    </div>
  );
};
