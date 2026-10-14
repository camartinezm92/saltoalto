import React, { useState } from 'react';
import { BiomechanicalResults, JumpAnalysisData, CalibrationData } from '../types/analyzer';
import { 
  X, Download, Copy, Check, FileText, User, Award, Calendar, 
  Ruler, Activity, ArrowUpRight, Zap, ShieldCheck
} from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: BiomechanicalResults;
  jumpAnalysis: JumpAnalysisData;
  calibration: CalibrationData;
  videoFilename: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  results,
  jumpAnalysis,
  calibration,
  videoFilename,
}) => {
  const [athleteName, setAthleteName] = useState('Atleta en Evaluación');
  const [evaluatorName, setEvaluatorName] = useState('Biomecánica Deportiva');
  const [sportDiscipline, setSportDiscipline] = useState('Salto Vertical (Eje Y)');
  const [notes, setNotes] = useState('Prueba realizada con referencia métrica de fondo y calibración visual por fotogrametría.');
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tapeColorName = results.tapeColorName || 'Amarillo';
  const tapeColor = results.tapeColor || '#EAB308';
  const tapeLengthM = results.tapeLengthMeters || calibration.realDistanceMeters;

  // Generar y descargar documento HTML autocontenido para guardar o imprimir
  const handleDownloadReportFile = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe Biomecánico - ${athleteName}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #0f172a; margin: 0; padding: 25px; background: #ffffff; line-height: 1.5; font-size: 13px; }
    .header { border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
    .title { font-size: 22px; font-weight: 800; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
    .subtitle { font-size: 11px; color: #64748b; font-family: monospace; margin-top: 4px; }
    .meta-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; }
    .meta-item { font-size: 11px; }
    .meta-label { color: #64748b; font-size: 10px; text-transform: uppercase; font-weight: 600; }
    .meta-value { font-weight: 700; color: #0f172a; margin-top: 2px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-card { border: 1px solid #cbd5e1; padding: 12px; border-radius: 6px; text-align: center; background: #ffffff; }
    .kpi-title { font-size: 10px; text-transform: uppercase; color: #475569; font-weight: 600; letter-spacing: 0.5px; }
    .kpi-number { font-size: 24px; font-weight: 800; color: #0284c7; margin: 6px 0; font-family: monospace; }
    .kpi-sub { font-size: 10px; color: #64748b; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 700; color: #334155; border-bottom: 1px solid #cbd5e1; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }
    .section-title { font-size: 13px; font-weight: 700; color: #0f172a; text-transform: uppercase; margin: 16px 0 8px 0; border-left: 3px solid #0284c7; padding-left: 8px; }
    .notes-box { background: #f8fafc; border: 1px dashed #cbd5e1; padding: 12px; border-radius: 6px; font-size: 11px; color: #334155; margin-bottom: 25px; }
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 40px; padding-top: 20px; }
    .signature-line { border-top: 1px solid #94a3b8; text-align: center; padding-top: 6px; font-size: 11px; color: #475569; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">Informe Biomecánico Oficial</h1>
      <div class="subtitle">EVALUACIÓN CINEMÁTICA DE SALTO VERTICAL POR FOTOGRAMETRÍA</div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b;">
      Fecha: <strong>${currentDate}</strong><br>
      ID Registro: <strong>#${Date.now().toString().slice(-6)}</strong>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <div class="meta-label">Atleta / Evaluado</div>
      <div class="meta-value">${athleteName}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Evaluador</div>
      <div class="meta-value">${evaluatorName}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Disciplina / Tipo</div>
      <div class="meta-value">${sportDiscipline}</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Masa Corporal</div>
      <div class="meta-value">${results.athleteMassKg} kg</div>
    </div>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-title">Altura Máxima (h)</div>
      <div class="kpi-number">${results.heightOpticalCm.toFixed(1)} cm</div>
      <div class="kpi-sub">${results.heightOpticalMeters.toFixed(3)} m reales</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Tiempo de Vuelo</div>
      <div class="kpi-number" style="color: #d97706;">${results.flightTimeSeconds.toFixed(3)} s</div>
      <div class="kpi-sub">${results.fps} fotogramas/segundo</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Velocidad Inicial (v₀)</div>
      <div class="kpi-number" style="color: #059669;">${results.takeoffVelocityMps.toFixed(2)} m/s</div>
      <div class="kpi-sub">${results.takeoffVelocityKmh.toFixed(1)} km/h</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-title">Potencia Máxima</div>
      <div class="kpi-number" style="color: #4f46e5;">${Math.round(results.peakPowerSayersWatts)} W</div>
      <div class="kpi-sub">Fórmula de Sayers</div>
    </div>
  </div>

  <div class="section-title">Parámetros de Calibración de Fondo</div>
  <table>
    <thead>
      <tr>
        <th>Elemento de Referencia</th>
        <th>Color Registrado</th>
        <th>Longitud Visible</th>
        <th>Escala Fotogramétrica</th>
        <th>Resolución Óptica</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Cinta métrica en pared</td>
        <td><strong>${tapeColorName}</strong></td>
        <td><strong>${tapeLengthM.toFixed(2)} m</strong> (${(tapeLengthM * 100).toFixed(0)} cm)</td>
        <td>${Math.round(results.pixelsPerMeter)} px/metro</td>
        <td>${(1000 / results.pixelsPerMeter).toFixed(2)} mm/px</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">Validación Cruzada de Métodos</div>
  <table>
    <thead>
      <tr>
        <th>Método</th>
        <th>Ecuación Aplicada</th>
        <th>Altura Calculada</th>
        <th>Discrepancia</th>
        <th>Concordancia</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Óptico (Cinta de fondo)</strong></td>
        <td>Δy / Escala calibrada</td>
        <td><strong>${results.heightOpticalCm.toFixed(2)} cm</strong></td>
        <td>Referencia directa</td>
        <td style="color: #059669; font-weight: 700;">100%</td>
      </tr>
      <tr>
        <td><strong>Cinemático (Bosco / Vuelo)</strong></td>
        <td>(g · t_vuelo²) / 8</td>
        <td><strong>${results.heightKinematicCm.toFixed(2)} cm</strong></td>
        <td>±${results.discrepancyCm.toFixed(2)} cm</td>
        <td style="color: #059669; font-weight: 700;">${(100 - Math.min(100, results.discrepancyPercent)).toFixed(1)}%</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">Cronología de Fotogramas Clave</div>
  <table>
    <thead>
      <tr>
        <th>Instante</th>
        <th>Fotograma</th>
        <th>Tiempo</th>
        <th>Velocidad Instantánea</th>
        <th>Descripción Biomecánica</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1. Despegue (Takeoff)</strong></td>
        <td>Frame #${jumpAnalysis.takeoff?.frame || '--'}</td>
        <td>${results.takeoffTimeSeconds.toFixed(3)} s</td>
        <td>+${results.takeoffVelocityMps.toFixed(2)} m/s</td>
        <td>Pérdida de contacto con la superficie de apoyo.</td>
      </tr>
      <tr>
        <td><strong>2. Apogeo (Peak)</strong></td>
        <td>Frame #${jumpAnalysis.peak?.frame || '--'}</td>
        <td>${jumpAnalysis.peak?.timeSeconds.toFixed(3) || '--'} s</td>
        <td>0.00 m/s</td>
        <td>Punto más alto alcanzado (${results.heightOpticalCm.toFixed(1)} cm).</td>
      </tr>
      <tr>
        <td><strong>3. Aterrizaje (Landing)</strong></td>
        <td>Frame #${jumpAnalysis.landing?.frame || '--'}</td>
        <td>${results.landingTimeSeconds.toFixed(3)} s</td>
        <td>-${results.takeoffVelocityMps.toFixed(2)} m/s</td>
        <td>Primer contacto con el suelo.</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">Observaciones y Diagnóstico</div>
  <div class="notes-box">
    ${notes || 'Sin observaciones adicionales.'}
  </div>

  <div class="signature-grid">
    <div class="signature-line">
      Firma del Evaluador / Profesional<br>
      <strong>${evaluatorName}</strong>
    </div>
    <div class="signature-line">
      Firma del Atleta / Evaluado<br>
      <strong>${athleteName}</strong>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `informe_biomecanico_${athleteName.replace(/\s+/g, '_')}_${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Copiar resumen de texto formateado al portapapeles
  const handleCopySummary = async () => {
    const text = `INFORME BIOMECÁNICO DE SALTO VERTICAL
Atleta: ${athleteName}
Fecha: ${currentDate}
Disciplina: ${sportDiscipline}
Masa corporal: ${results.athleteMassKg} kg

RESULTADOS CLAVE:
- Altura Máxima (h): ${results.heightOpticalCm.toFixed(1)} cm (${results.heightOpticalMeters.toFixed(3)} m)
- Tiempo de Vuelo: ${results.flightTimeSeconds.toFixed(3)} segundos (${results.fps} FPS)
- Velocidad Inicial (v₀): ${results.takeoffVelocityMps.toFixed(2)} m/s (${results.takeoffVelocityKmh.toFixed(1)} km/h)
- Potencia Máxima (Sayers): ${Math.round(results.peakPowerSayersWatts)} Watts

CALIBRACIÓN DE FONDO:
- Cinta de Referencia: Color ${tapeColorName}
- Longitud Nominal: ${tapeLengthM.toFixed(2)} m
- Escala: ${Math.round(results.pixelsPerMeter)} px/metro

VALIDACIÓN CRUZADA:
- Método Óptico Directo: ${results.heightOpticalCm.toFixed(2)} cm
- Método Cinemático (Bosco): ${results.heightKinematicCm.toFixed(2)} cm
- Concordancia técnica: ${(100 - Math.min(100, results.discrepancyPercent)).toFixed(1)}%

Observaciones: ${notes}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0B0F19] border border-slate-700 rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Barra Superior del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0F1420]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Documento de Informe Biomecánico Oficial
              </h2>
              <p className="text-xs text-slate-400">
                Vista previa imprimible y exportación directa de documento sin cuadros externos del navegador
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 cursor-pointer transition-colors"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? '¡Copiado!' : 'Copiar Resumen'}</span>
            </button>

            <button
              onClick={handleDownloadReportFile}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-md cursor-pointer transition-colors shadow-sm"
            >
              <Download size={14} />
              <span>{downloadSuccess ? '¡Descargado!' : 'Descargar Informe (.html)'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Controles de Personalización del Documento */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="text-slate-400 font-medium block mb-1">Nombre del Atleta / Evaluado:</label>
            <input
              type="text"
              value={athleteName}
              onChange={(e) => setAthleteName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Evaluador / Entrenador:</label>
            <input
              type="text"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="text-slate-400 font-medium block mb-1">Disciplina / Objetivo:</label>
            <input
              type="text"
              value={sportDiscipline}
              onChange={(e) => setSportDiscipline(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Hoja de Documento Previsualizada (Formato Hoja Blanca Imprimible de Alta Definición) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 flex justify-center">
          <div className="bg-white text-slate-900 w-full max-w-3xl rounded-lg p-8 shadow-xl font-sans text-xs space-y-6">
            {/* Cabecera del Certificado */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-950 tracking-tight uppercase">
                  Informe Biomecánico Oficial
                </h1>
                <p className="text-slate-500 font-mono text-[11px] font-semibold mt-0.5">
                  EVALUACIÓN CINEMÁTICA DE SALTO VERTICAL POR FOTOGRAMETRÍA
                </p>
              </div>
              <div className="text-right text-[11px] text-slate-500">
                <div>Fecha: <strong className="text-slate-900">{currentDate}</strong></div>
                <div>Video: <span className="font-mono">{videoFilename}</span></div>
              </div>
            </div>

            {/* Ficha de Identificación */}
            <div className="grid grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded p-3">
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Atleta</div>
                <div className="font-bold text-slate-900 text-xs mt-0.5">{athleteName}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Evaluador</div>
                <div className="font-bold text-slate-900 text-xs mt-0.5">{evaluatorName}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Disciplina</div>
                <div className="font-bold text-slate-900 text-xs mt-0.5">{sportDiscipline}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Masa Corporal</div>
                <div className="font-bold text-slate-900 text-xs mt-0.5">{results.athleteMassKg} kg</div>
              </div>
            </div>

            {/* Ficha Técnica de la Referencia de Fondo */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase text-slate-900 flex items-center gap-1.5">
                <Ruler size={13} className="text-amber-500" />
                <span>Elemento de Referencia Métrica Utilizado</span>
              </h3>
              <div className="grid grid-cols-4 gap-2 border border-slate-200 rounded p-2.5 bg-slate-50/50 text-[11px]">
                <div>
                  <span className="text-slate-500">Color de cinta:</span>
                  <div className="font-bold text-slate-900 flex items-center gap-1 mt-0.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/40 inline-block"
                      style={{ backgroundColor: tapeColor }}
                    />
                    {tapeColorName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500">Medida nominal:</span>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">{tapeLengthM.toFixed(2)} m ({(tapeLengthM * 100).toFixed(0)} cm)</div>
                </div>
                <div>
                  <span className="text-slate-500">Escala de video:</span>
                  <div className="font-mono font-bold text-sky-700 mt-0.5">{Math.round(results.pixelsPerMeter)} px/m</div>
                </div>
                <div>
                  <span className="text-slate-500">Resolución:</span>
                  <div className="font-mono font-bold text-emerald-700 mt-0.5">{(1000 / results.pixelsPerMeter).toFixed(2)} mm/px</div>
                </div>
              </div>
            </div>

            {/* Las 4 Tarjetas de Resultados */}
            <div className="grid grid-cols-4 gap-3">
              <div className="border border-slate-200 rounded p-3 text-center bg-sky-50/50">
                <div className="text-[10px] uppercase font-bold text-slate-500">Altura Máxima (h)</div>
                <div className="text-2xl font-black font-mono text-sky-700 my-1">{results.heightOpticalCm.toFixed(1)} cm</div>
                <div className="text-[10px] text-slate-500">{results.heightOpticalMeters.toFixed(3)} m reales</div>
              </div>

              <div className="border border-slate-200 rounded p-3 text-center bg-amber-50/50">
                <div className="text-[10px] uppercase font-bold text-slate-500">Tiempo de Vuelo</div>
                <div className="text-2xl font-black font-mono text-amber-600 my-1">{results.flightTimeSeconds.toFixed(3)} s</div>
                <div className="text-[10px] text-slate-500">{results.fps} FPS</div>
              </div>

              <div className="border border-slate-200 rounded p-3 text-center bg-emerald-50/50">
                <div className="text-[10px] uppercase font-bold text-slate-500">Velocidad Inicial (v₀)</div>
                <div className="text-2xl font-black font-mono text-emerald-700 my-1">{results.takeoffVelocityMps.toFixed(2)} m/s</div>
                <div className="text-[10px] text-slate-500">{results.takeoffVelocityKmh.toFixed(1)} km/h</div>
              </div>

              <div className="border border-slate-200 rounded p-3 text-center bg-indigo-50/50">
                <div className="text-[10px] uppercase font-bold text-slate-500">Potencia Máxima</div>
                <div className="text-2xl font-black font-mono text-indigo-700 my-1">{Math.round(results.peakPowerSayersWatts)} W</div>
                <div className="text-[10px] text-slate-500">Fórmula de Sayers</div>
              </div>
            </div>

            {/* Tabla de Validación de Métodos */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase text-slate-900 flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-emerald-600" />
                <span>Validación Cruzada: Medición Óptica vs. Modelo Gravitacional</span>
              </h3>
              <table className="w-full border-collapse border border-slate-200 text-left text-[11px]">
                <thead className="bg-slate-100 font-bold text-slate-700">
                  <tr>
                    <th className="p-2 border border-slate-200">Método de Evaluación</th>
                    <th className="p-2 border border-slate-200">Principio Matemático</th>
                    <th className="p-2 border border-slate-200 text-right">Altura Obtenida</th>
                    <th className="p-2 border border-slate-200 text-right">Discrepancia</th>
                    <th className="p-2 border border-slate-200 text-center">Concordancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  <tr>
                    <td className="p-2 border border-slate-200 font-sans font-bold">Óptico Directo (Cinta {tapeColorName})</td>
                    <td className="p-2 border border-slate-200 font-sans text-slate-600">Δy / Escala métrica ({Math.round(results.pixelsPerMeter)} px/m)</td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-sky-700">{results.heightOpticalCm.toFixed(2)} cm</td>
                    <td className="p-2 border border-slate-200 text-right text-slate-500">Base</td>
                    <td className="p-2 border border-slate-200 text-center font-bold text-emerald-600">100%</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-200 font-sans font-bold">Cinemático de Vuelo (Bosco)</td>
                    <td className="p-2 border border-slate-200 font-sans text-slate-600">Caída libre: (g · t_vuelo²) / 8</td>
                    <td className="p-2 border border-slate-200 text-right font-bold text-amber-600">{results.heightKinematicCm.toFixed(2)} cm</td>
                    <td className="p-2 border border-slate-200 text-right text-slate-700">±{results.discrepancyCm.toFixed(2)} cm</td>
                    <td className="p-2 border border-slate-200 text-center font-bold text-emerald-600">
                      {(100 - Math.min(100, results.discrepancyPercent)).toFixed(1)}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Fotogramas Clave Registrados */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase text-slate-900">
                Auditoría de Fotogramas Clave del Salto
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 border border-slate-200 rounded bg-slate-50 text-[11px]">
                  <div className="font-bold text-orange-600">1. Despegue (Takeoff)</div>
                  <div className="font-mono text-slate-700 mt-0.5">Frame #{jumpAnalysis.takeoff?.frame || '--'} · {results.takeoffTimeSeconds.toFixed(3)}s</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Velocidad vertical: +{results.takeoffVelocityMps.toFixed(2)} m/s</div>
                </div>

                <div className="p-2 border border-slate-200 rounded bg-slate-50 text-[11px]">
                  <div className="font-bold text-sky-600">2. Apogeo (Peak Height)</div>
                  <div className="font-mono text-slate-700 mt-0.5">Frame #{jumpAnalysis.peak?.frame || '--'} · {jumpAnalysis.peak?.timeSeconds.toFixed(3) || '--'}s</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Velocidad vertical: 0.00 m/s</div>
                </div>

                <div className="p-2 border border-slate-200 rounded bg-slate-50 text-[11px]">
                  <div className="font-bold text-emerald-600">3. Aterrizaje (Landing)</div>
                  <div className="font-mono text-slate-700 mt-0.5">Frame #{jumpAnalysis.landing?.frame || '--'} · {results.landingTimeSeconds.toFixed(3)}s</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Fin de tiempo de vuelo ({results.flightTimeSeconds.toFixed(3)}s)</div>
                </div>
              </div>
            </div>

            {/* Observaciones Editables */}
            <div className="space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500">Observaciones Técnicas:</div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full border border-slate-300 rounded p-2 text-[11px] text-slate-700 focus:outline-none focus:border-slate-500"
                placeholder="Escribe comentarios u observaciones técnicas para el informe..."
              />
            </div>

            {/* Firmas de Certificación */}
            <div className="grid grid-cols-2 gap-12 pt-6">
              <div className="border-t border-slate-300 pt-1.5 text-center text-[10px] text-slate-500">
                Firma del Evaluador / Profesional<br />
                <strong className="text-slate-800 text-xs">{evaluatorName}</strong>
              </div>
              <div className="border-t border-slate-300 pt-1.5 text-center text-[10px] text-slate-500">
                Firma del Atleta / Evaluado<br />
                <strong className="text-slate-800 text-xs">{athleteName}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Barra Inferior de Acción */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0F1420] flex items-center justify-between text-xs text-slate-400">
          <span>
            Documento autocontenido generado localmente sin enviar datos fuera de tu dispositivo.
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded cursor-pointer transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={handleDownloadReportFile}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded cursor-pointer transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Download size={14} />
              <span>Guardar / Descargar Documento</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
