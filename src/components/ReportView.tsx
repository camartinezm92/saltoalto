import React, { useState } from 'react';
import { BiomechanicalResults, JumpAnalysisData, CalibrationData } from '../types/analyzer';
import { generateParabolicCurve, GRAVITY } from '../utils/biomechanics';
import { PrintReportModal } from './PrintReportModal';
import { 
  Download, FileText, CheckCircle2, ChevronRight, BarChart3, 
  Activity, ArrowUpRight, Zap, ShieldCheck, Scale, FileSpreadsheet,
  Palette, Ruler, Bookmark, FolderArchive, Sparkles
} from 'lucide-react';

interface ReportViewProps {
  results: BiomechanicalResults;
  jumpAnalysis: JumpAnalysisData;
  calibration: CalibrationData;
  videoFilename: string;
  onBackToEdit: () => void;
  onSaveReport?: (customName: string) => void;
  onOpenSavedReports?: () => void;
  savedReportsCount?: number;
}

export const ReportView: React.FC<ReportViewProps> = ({
  results,
  jumpAnalysis,
  calibration,
  videoFilename,
  onBackToEdit,
  onSaveReport,
  onOpenSavedReports,
  savedReportsCount = 0,
}) => {
  const [hoveredChartPoint, setHoveredChartPoint] = useState<{
    time: number;
    height: number;
    velocity: number;
  } | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Nombre personalizado para guardar en memoria local
  const defaultReportName = `Salto Vertical - ${calibration.referenceColorName} ${calibration.realDistanceMeters.toFixed(2)}m (${new Date().toLocaleDateString('es-ES')})`;
  const [reportCustomName, setReportCustomName] = useState(defaultReportName);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const parabolicData = generateParabolicCurve(
    results.takeoffVelocityMps,
    results.flightTimeSeconds,
    60
  );

  const tapeColor = results.tapeColor || '#EAB308';
  const tapeColorName = results.tapeColorName || 'Amarillo';
  const tapeLengthM = results.tapeLengthMeters || calibration.realDistanceMeters;

  const handleSaveToStorage = () => {
    if (!reportCustomName.trim()) return;
    if (onSaveReport) {
      onSaveReport(reportCustomName.trim());
      setSaveSuccessMsg(`✓ Reporte "${reportCustomName.trim()}" guardado con éxito en la memoria local.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    }
  };

  // Exportar datos a CSV con metadatos de calibración
  const handleExportCSV = () => {
    let csv = '# INFORME BIOMECANICO DE SALTO VERTICAL\n';
    csv += `# Video: ${videoFilename}\n`;
    csv += `# FPS: ${results.fps}\n`;
    csv += `# Referencia_Color: ${tapeColorName}\n`;
    csv += `# Referencia_Longitud_m: ${tapeLengthM.toFixed(2)}\n`;
    csv += `# Escala_px_metro: ${Math.round(results.pixelsPerMeter)}\n`;
    csv += `# Factor_Compensacion_Profundidad_Phi: ${results.depthCorrectionFactor}\n`;
    csv += `# Tiempo_Vuelo_s: ${results.flightTimeSeconds.toFixed(4)}\n`;
    csv += `# Altura_Optica_cm: ${results.heightOpticalCm.toFixed(2)}\n`;
    csv += `# Altura_Cinematica_cm: ${results.heightKinematicCm.toFixed(2)}\n`;
    csv += `# Altura_Armonizada_cm: ${results.heightHarmonizedCm.toFixed(2)}\n`;
    csv += `# Velocidad_Inicial_ms: ${results.takeoffVelocityMps.toFixed(3)}\n\n`;

    csv += 'Frame,Tiempo_s,Altura_m,Altura_cm,Velocidad_ms,Fase\n';

    // Despegue
    csv += `${jumpAnalysis.takeoff?.frame || 0},${results.takeoffTimeSeconds.toFixed(4)},0.000,0.00,${results.takeoffVelocityMps.toFixed(3)},Despegue\n`;

    // Puntos interpolados de vuelo
    parabolicData.forEach((pt, idx) => {
      const frameNum = Math.round(
        (jumpAnalysis.takeoff?.frame || 0) + (pt.time / results.flightTimeSeconds) * (results.flightTimeSeconds * results.fps)
      );
      csv += `${frameNum},${(results.takeoffTimeSeconds + pt.time).toFixed(4)},${pt.height.toFixed(4)},${(pt.height * 100).toFixed(2)},${pt.velocity.toFixed(3)},Vuelo\n`;
    });

    // Aterrizaje
    csv += `${jumpAnalysis.landing?.frame || 0},${results.landingTimeSeconds.toFixed(4)},0.000,0.00,-${results.takeoffVelocityMps.toFixed(3)},Aterrizaje\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `informe_salto_${tapeColorName.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Barra de Título y Acciones del Informe */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[#0F1420] border border-slate-800 rounded-lg">
        <div>
          <div className="text-xs font-mono uppercase text-amber-400 font-semibold tracking-wider">
            Reporte Biomecánico Oficial
          </div>
          <h1 className="text-xl font-bold text-slate-100 mt-0.5">
            Evaluación Cinemática de Salto Vertical
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
            <span>Video: <strong className="text-slate-300 font-normal">{videoFilename}</strong></span>
            <span aria-hidden="true">·</span>
            <span>FPS: <strong className="text-slate-300 font-mono font-normal">{results.fps}</strong></span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <span>Cinta de fondo:</span>
              <span
                className="w-2.5 h-2.5 rounded-full inline-block border border-black/50"
                style={{ backgroundColor: tapeColor }}
              />
              <strong className="text-slate-200 font-mono font-normal">
                {tapeColorName} ({tapeLengthM.toFixed(2)}m)
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSavedReports && (
            <button
              onClick={onOpenSavedReports}
              className="px-3.5 py-2 text-xs font-semibold text-sky-300 bg-sky-950/50 hover:bg-sky-900/60 border border-sky-800/80 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FolderArchive size={14} className="text-sky-400" />
              <span>Historial ({savedReportsCount})</span>
            </button>
          )}

          <button
            onClick={onBackToEdit}
            className="px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700 rounded transition-colors cursor-pointer"
          >
            Ajustar Puntos
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <FileText size={14} />
            <span>Generar Documento / PDF</span>
          </button>
        </div>
      </div>

      {/* BLOQUE PARA GUARDAR CON NOMBRE PROPIO EN MEMORIA LOCAL */}
      <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[280px]">
            <label className="text-xs font-semibold text-slate-200 block mb-1.5 flex items-center gap-1.5">
              <Bookmark size={14} className="text-amber-400" />
              Guardar este reporte en la memoria local con tu nombre propio:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={reportCustomName}
                onChange={(e) => setReportCustomName(e.target.value)}
                placeholder="Ej: CMJ Carlos - Prueba 1 - Cinta Amarilla"
                className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-400"
              />
              <button
                onClick={handleSaveToStorage}
                className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shrink-0"
              >
                <Bookmark size={13} />
                <span>Guardar en Memoria</span>
              </button>
            </div>
          </div>
        </div>

        {saveSuccessMsg && (
          <div className="p-2.5 bg-emerald-950/40 border border-emerald-800/70 rounded text-xs text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* KPI CARDS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Altura Máxima */}
        <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-4 relative overflow-hidden">
          <div className="text-xs uppercase font-mono text-slate-400 tracking-wider">
            Altura Máxima de Salto
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-cyan-400 tabular-nums">
              {results.heightOpticalCm.toFixed(1)}
            </span>
            <span className="text-xs font-mono uppercase text-slate-400">cm</span>
            <span className="text-xs text-slate-500 font-mono">
              ({results.heightOpticalMeters.toFixed(3)} m)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <Scale size={12} className="text-cyan-400 shrink-0" />
            <span>Calibrado con cinta {tapeColorName.toLowerCase()} ({tapeLengthM.toFixed(2)}m)</span>
          </div>
        </div>

        {/* KPI 2: Tiempo de Vuelo */}
        <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-4 relative overflow-hidden">
          <div className="text-xs uppercase font-mono text-slate-400 tracking-wider">
            Tiempo de Vuelo Total
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-amber-400 tabular-nums">
              {results.flightTimeSeconds.toFixed(3)}
            </span>
            <span className="text-xs font-mono uppercase text-slate-400">segundos</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <Activity size={12} className="text-amber-400 shrink-0" />
            <span>
              {jumpAnalysis.landing && jumpAnalysis.takeoff
                ? `${jumpAnalysis.landing.frame - jumpAnalysis.takeoff.frame} frames a ${results.fps} FPS`
                : ''}
            </span>
          </div>
        </div>

        {/* KPI 3: Velocidad Inicial de Despegue */}
        <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-4 relative overflow-hidden">
          <div className="text-xs uppercase font-mono text-slate-400 tracking-wider">
            Velocidad Inicial (v₀)
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-emerald-400 tabular-nums">
              {results.takeoffVelocityMps.toFixed(2)}
            </span>
            <span className="text-xs font-mono uppercase text-slate-400">m/s</span>
            <span className="text-xs text-slate-500 font-mono">
              ({results.takeoffVelocityKmh.toFixed(1)} km/h)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <ArrowUpRight size={12} className="text-emerald-400 shrink-0" />
            <span>Impulso vertical puro (Eje Y)</span>
          </div>
        </div>

        {/* KPI 4: Potencia Mecánica Estimada */}
        <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-4 relative overflow-hidden">
          <div className="text-xs uppercase font-mono text-slate-400 tracking-wider">
            Potencia Máxima (Sayers)
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-mono font-bold text-sky-400 tabular-nums">
              {Math.round(results.peakPowerSayersWatts)}
            </span>
            <span className="text-xs font-mono uppercase text-slate-400">Watts</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
            <Zap size={12} className="text-sky-400 shrink-0" />
            <span>Basado en {results.athleteMassKg} kg de masa corporal</span>
          </div>
        </div>
      </div>

      {/* FICHA TÉCNICA DE LA CINTA DE FONDO ACTUALIZADA */}
      <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Ruler size={16} style={{ color: tapeColor }} />
            <span>Ficha Técnica del Elemento de Referencia de Fondo</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            Registro Permanente de Calibración
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 rounded p-3">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Color de la Cinta</div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/40 shadow-xs shrink-0"
                style={{ backgroundColor: tapeColor }}
              />
              <span className="font-semibold text-sm text-slate-200">{tapeColorName}</span>
              <span className="text-[11px] font-mono text-slate-500">({tapeColor})</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded p-3">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Medida Real de la Sección</div>
            <div className="mt-1 font-mono text-sm font-bold text-slate-100">
              {tapeLengthM.toFixed(2)} metros
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                ({(tapeLengthM * 100).toFixed(0)} cm)
              </span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded p-3">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Escala Fotogramétrica</div>
            <div className="mt-1 font-mono text-sm font-bold text-cyan-400">
              {Math.round(results.pixelsPerMeter)} px / metro
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded p-3">
            <div className="text-[10px] text-slate-500 uppercase font-mono">Resolución Óptica</div>
            <div className="mt-1 font-mono text-sm font-bold text-emerald-400">
              {(1000 / (results.pixelsPerMeter || 1)).toFixed(2)} mm / px
            </div>
          </div>
        </div>
      </div>

      {/* COMPARATIVA DE VALIDACIÓN CIENTÍFICA: ÓPTICO vs CINEMÁTICO + COMPENSACIÓN DE PROFUNDIDAD */}
      <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <ShieldCheck size={16} className="text-amber-400" />
              <span>Validación Cruzada & Compensación Interna de Profundidad</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Contraste entre la distancia visual sobre la cinta {tapeColorName.toLowerCase()} y el modelo gravitatorio newtoniano ($h = g \cdot t^2 / 8$).
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-emerald-400">
              Concordancia: {(100 - Math.min(100, results.discrepancyPercent)).toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-900/80 text-slate-400 font-mono border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Método de Medición</th>
                <th className="py-2.5 px-3">Ecuación / Principio</th>
                <th className="py-2.5 px-3 text-right">Altura Calculada</th>
                <th className="py-2.5 px-3 text-right">Diferencia (Δ)</th>
                <th className="py-2.5 px-3">Sensibilidad a Profundidad</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-200">
                  Método Óptico Directo
                </td>
                <td className="py-3 px-3 text-slate-400">
                  Escala de cinta {tapeColorName.toLowerCase()} (Δy / {Math.round(results.pixelsPerMeter)} px/m)
                </td>
                <td className="py-3 px-3 text-right font-bold text-cyan-400 tabular-nums">
                  {results.heightOpticalCm.toFixed(2)} cm
                </td>
                <td className="py-3 px-3 text-right text-slate-400 tabular-nums">
                  Referencia
                </td>
                <td className="py-3 px-3 text-amber-400">
                  Dependiente de perspectiva
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-slate-200">
                  Método Cinemático (Bosco)
                </td>
                <td className="py-3 px-3 text-slate-400">
                  Cinemática gravitacional: (g · t_vuelo²) / 8
                </td>
                <td className="py-3 px-3 text-right font-bold text-amber-400 tabular-nums">
                  {results.heightKinematicCm.toFixed(2)} cm
                </td>
                <td className="py-3 px-3 text-right text-slate-300 tabular-nums">
                  {results.discrepancyCm > 0 ? `±${results.discrepancyCm.toFixed(2)} cm` : '0.00 cm'}
                </td>
                <td className="py-3 px-3 text-emerald-400">
                  ● Inmune a la profundidad (100% Invariante)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tarjeta de Autocorrección de Profundidad Interna */}
        <div className="p-3.5 bg-slate-900/90 border border-sky-500/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-sky-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-sky-400" />
              Compensación Automática de Profundidad del Sistema:
            </span>
            <span className="font-mono text-sky-400 text-xs font-semibold">
              Factor de escala relativo Φ = {results.depthCorrectionFactor}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            El sistema cruza internamente la distancia óptica en píxeles con el tiempo de vuelo de Bosco. Dado que la gravedad de la Tierra y la tasa de fotogramas ({results.fps} FPS) son constantes universales, el sistema detecta de forma automática la posición relativa del atleta sin que tengas que medir distancias en la habitación, asegurando que tu salto de <strong className="text-amber-300 font-mono">{results.heightHarmonizedCm.toFixed(1)} cm</strong> sea físicamente exacto.
          </p>
        </div>
      </div>

      {/* GRÁFICAS DE CINEMÁTICA: ALTURA y VELOCIDAD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gráfico 1: Curva Parabólica Altura vs Tiempo */}
        <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <BarChart3 size={15} className="text-cyan-400" />
              <span>Trayectoria Vertical: Altura y(t) vs Tiempo</span>
            </div>
            <div className="text-[11px] font-mono text-cyan-400">
              Apogeo: {(results.timeToPeakSeconds || results.flightTimeSeconds / 2).toFixed(3)}s
            </div>
          </div>

          <div className="relative h-56 bg-slate-950/80 border border-slate-800/80 rounded p-2 flex items-center justify-center">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
            >
              <line x1="40" y1="20" x2="480" y2="20" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="40" y1="65" x2="480" y2="65" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="40" y1="110" x2="480" y2="110" stroke="#1E293B" strokeDasharray="3 3" />
              <line x1="40" y1="155" x2="480" y2="155" stroke="#1E293B" strokeDasharray="3 3" />

              <line x1="40" y1="170" x2="480" y2="170" stroke="#475569" strokeWidth="1.5" />
              <line x1="40" y1="10" x2="40" y2="170" stroke="#475569" strokeWidth="1.5" />

              <path
                d={`M 40 170 ${parabolicData
                  .map((p) => {
                    const x = 40 + (p.time / results.flightTimeSeconds) * 440;
                    const y = 170 - (p.height / (results.heightKinematicMeters || 0.001)) * 140;
                    return `L ${x} ${y}`;
                  })
                  .join(' ')} L 480 170 Z`}
                fill="rgba(6, 182, 212, 0.12)"
              />

              <path
                d={`M 40 170 ${parabolicData
                  .map((p) => {
                    const x = 40 + (p.time / results.flightTimeSeconds) * 440;
                    const y = 170 - (p.height / (results.heightKinematicMeters || 0.001)) * 140;
                    return `L ${x} ${y}`;
                  })
                  .join(' ')}`}
                fill="none"
                stroke="#06B6D4"
                strokeWidth="2.5"
              />

              <circle
                cx={40 + 440 / 2}
                cy={170 - 140}
                r="5"
                fill="#06B6D4"
                stroke="#FFFFFF"
                strokeWidth="2"
              />

              <text x="35" y="30" fill="#94A3B8" fontSize="10" textAnchor="end" fontFamily="monospace">
                {results.heightOpticalCm.toFixed(0)}cm
              </text>
              <text x="35" y="100" fill="#94A3B8" fontSize="10" textAnchor="end" fontFamily="monospace">
                {(results.heightOpticalCm / 2).toFixed(0)}cm
              </text>
              <text x="35" y="172" fill="#94A3B8" fontSize="10" textAnchor="end" fontFamily="monospace">
                0cm
              </text>

              <text x="40" y="188" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                0.0s
              </text>
              <text x="260" y="188" fill="#06B6D4" fontSize="10" textAnchor="middle" fontFamily="monospace">
                {(results.flightTimeSeconds / 2).toFixed(3)}s
              </text>
              <text x="480" y="188" fill="#94A3B8" fontSize="10" textAnchor="end" fontFamily="monospace">
                {results.flightTimeSeconds.toFixed(3)}s
              </text>
            </svg>
          </div>
          <div className="text-[11px] text-slate-500 font-mono text-center">
            Ecuación de trayectoria: y(t) = {results.takeoffVelocityMps.toFixed(2)}·t - 0.5·({GRAVITY.toFixed(2)})·t²
          </div>
        </div>

        {/* Gráfico 2: Curva de Velocidad Vertical v(t) */}
        <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Activity size={15} className="text-emerald-400" />
              <span>Velocidad Vertical: v(t) = v₀ - g·t</span>
            </div>
            <div className="text-[11px] font-mono text-emerald-400">
              v(apogeo) = 0.00 m/s
            </div>
          </div>

          <div className="relative h-56 bg-slate-950/80 border border-slate-800/80 rounded p-2 flex items-center justify-center">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 500 200"
              preserveAspectRatio="none"
            >
              <line x1="40" y1="100" x2="480" y2="100" stroke="#475569" strokeWidth="1.5" />
              <line x1="40" y1="10" x2="40" y2="190" stroke="#475569" strokeWidth="1.5" />

              <line
                x1="40"
                y1="30"
                x2="480"
                y2="170"
                stroke="#10B981"
                strokeWidth="2.5"
              />

              <circle cx="260" cy="100" r="5" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />

              <text x="35" y="34" fill="#10B981" fontSize="10" textAnchor="end" fontFamily="monospace">
                +{results.takeoffVelocityMps.toFixed(1)}
              </text>
              <text x="35" y="104" fill="#94A3B8" fontSize="10" textAnchor="end" fontFamily="monospace">
                0 m/s
              </text>
              <text x="35" y="174" fill="#EF4444" fontSize="10" textAnchor="end" fontFamily="monospace">
                -{results.takeoffVelocityMps.toFixed(1)}
              </text>

              <text x="260" y="92" fill="#10B981" fontSize="10" textAnchor="middle" fontFamily="monospace">
                Pico (v = 0)
              </text>
              <text x="40" y="194" fill="#94A3B8" fontSize="10" fontFamily="monospace">
                0.0s (Despegue)
              </text>
              <text x="480" y="194" fill="#94A3B8" fontSize="10" textAnchor="end" fontFamily="monospace">
                {results.flightTimeSeconds.toFixed(3)}s (Aterrizaje)
              </text>
            </svg>
          </div>
          <div className="text-[11px] text-slate-500 font-mono text-center">
            Aceleración constante: a_y = -9.81 m/s² (Caída libre gravitacional)
          </div>
        </div>
      </div>

      {/* FOTOGRAMAS CLAVE AUDITADOS */}
      <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <span>Cronología de Fotogramas Clave Registrados</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-900/70 border border-orange-500/30 rounded p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-orange-400">
              <span>1. DESPEGUE (TAKEOFF)</span>
              <span className="font-mono">F#{jumpAnalysis.takeoff?.frame}</span>
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Tiempo: {results.takeoffTimeSeconds.toFixed(3)}s
            </div>
            <div className="text-[11px] text-slate-400">
              Último instante de contacto con el suelo. Velocidad vertical inicial máxima v₀ = {results.takeoffVelocityMps.toFixed(2)} m/s.
            </div>
          </div>

          <div className="bg-slate-900/70 border border-cyan-500/30 rounded p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-400">
              <span>2. APOGEO (PEAK HEIGHT)</span>
              <span className="font-mono">F#{jumpAnalysis.peak?.frame}</span>
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Tiempo: {jumpAnalysis.peak?.timeSeconds.toFixed(3)}s
            </div>
            <div className="text-[11px] text-slate-400">
              Vértice de la parábola. Velocidad vertical instantánea v = 0 m/s. Altura alcanzada: {results.heightOpticalCm.toFixed(1)} cm.
            </div>
          </div>

          <div className="bg-slate-900/70 border border-emerald-500/30 rounded p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>3. ATERRIZAJE (LANDING)</span>
              <span className="font-mono">F#{jumpAnalysis.landing?.frame}</span>
            </div>
            <div className="text-xs text-slate-300 font-mono">
              Tiempo: {results.landingTimeSeconds.toFixed(3)}s
            </div>
            <div className="text-[11px] text-slate-400">
              Primer contacto de recepción en el suelo. Cierre del tiempo de vuelo evaluado ({results.flightTimeSeconds.toFixed(3)} s).
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Documento Oficial Imprimible y Descargable */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        results={results}
        jumpAnalysis={jumpAnalysis}
        calibration={calibration}
        videoFilename={videoFilename}
      />
    </div>
  );
};
