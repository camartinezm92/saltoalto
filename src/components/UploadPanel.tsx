import React, { useState } from 'react';
import { Upload, Film, Sparkles, CheckCircle2, Cpu, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { createDemoVideoBlob } from '../utils/demoVideo';
import { detectVideoFpsFromFile, FpsDetectionResult } from '../utils/fpsDetector';

interface UploadPanelProps {
  onVideoLoaded: (url: string, filename: string, fps: number, defaultTapeMeters?: number) => void;
  fps: number;
  onFpsChange: (fps: number) => void;
  currentVideoFilename: string | null;
}

export const UploadPanel: React.FC<UploadPanelProps> = ({
  onVideoLoaded,
  fps,
  onFpsChange,
  currentVideoFilename,
}) => {
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [demoProgress, setDemoProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzingMetadata, setIsAnalyzingMetadata] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState<FpsDetectionResult | null>(null);
  const [showManualFps, setShowManualFps] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setErrorMessage(null);
    if (!file.type.startsWith('video/')) {
      setErrorMessage('Por favor selecciona un archivo de video válido (MP4, WebM o MOV).');
      return;
    }

    setIsAnalyzingMetadata(true);
    let resolvedFps = fps;

    try {
      // Detección automática directa de metadatos de la cámara
      const detected = await detectVideoFpsFromFile(file);
      setDetectedInfo(detected);
      resolvedFps = detected.fps;
      onFpsChange(detected.fps);
    } catch (e) {
      console.warn('Error leyendo metadatos:', e);
    } finally {
      setIsAnalyzingMetadata(false);
    }

    const url = URL.createObjectURL(file);
    onVideoLoaded(url, file.name, resolvedFps, 1.95);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateDemo = async () => {
    try {
      setIsGeneratingDemo(true);
      setDemoProgress(10);
      const demoData = await createDemoVideoBlob((percent) => {
        setDemoProgress(percent);
      });
      setDetectedInfo({
        fps: demoData.fps,
        confidence: 'metadata',
        label: 'Video de laboratorio sintetizado (60 FPS)',
      });
      onFpsChange(demoData.fps);
      onVideoLoaded(demoData.url, 'demo_salto_cinta_amarilla_1.95m.webm', demoData.fps, 1.95);
    } catch (err) {
      console.error(err);
      setErrorMessage('No se pudo generar el video de demostración.');
    } finally {
      setIsGeneratingDemo(false);
      setDemoProgress(0);
    }
  };

  return (
    <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <Film size={16} className="text-amber-400" />
          <span>Paso 1: Carga y Preparación del Video</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Carga tu video con la cinta métrica amarilla en la pared. Los FPS (velocidad de grabación de la cámara) se analizan automáticamente.
        </p>
      </div>

      {/* Notificación de Error Propia (In-App) */}
      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-md text-xs text-rose-300 flex items-start justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 ml-2 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Zona de Drop & Carga de Video del Usuario */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
          isDragging
            ? 'border-amber-400 bg-amber-400/5'
            : 'border-slate-800 bg-slate-950/40 hover:border-slate-700'
        }`}
      >
        <Upload size={28} className="mx-auto text-slate-500 mb-2.5" />
        <p className="text-xs font-medium text-slate-200">
          Arrastra tu video de salto aquí o selecciónalo de tu dispositivo
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Formatos compatibles: MP4, MOV (iPhone/Android), WebM
        </p>

        <label className="mt-3.5 inline-block">
          <input
            type="file"
            accept="video/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <span className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 rounded cursor-pointer transition-colors inline-block">
            Examinar en mi dispositivo
          </span>
        </label>
      </div>

      {/* Tarjeta de Detección Automática de FPS de Metadatos */}
      {isAnalyzingMetadata ? (
        <div className="flex items-center gap-2.5 p-3 bg-slate-900 border border-slate-800 rounded-md text-xs text-sky-400">
          <Cpu size={16} className="animate-spin" />
          <span>Analizando metadatos de la cámara y tasa de fotogramas (FPS)...</span>
        </div>
      ) : detectedInfo ? (
        <div className="bg-emerald-950/30 border border-emerald-800/60 rounded-md p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-emerald-400" />
              FPS Detectados Automáticamente:
            </span>
            <span className="font-mono text-sm font-bold text-emerald-200 bg-emerald-900/50 px-2 py-0.5 rounded">
              {detectedInfo.fps} FPS
            </span>
          </div>
          <div className="text-[11px] text-slate-300">
            {detectedInfo.label}
          </div>
          <div className="text-[10px] text-slate-400 leading-relaxed pt-0.5">
            ✓ Los metadatos del video fueron leídos con éxito. Cada segundo de grabación contiene exactamente {detectedInfo.fps} fotogramas para calcular el tiempo de vuelo con precisión de milisegundos.
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-md p-3 space-y-1">
          <div className="flex items-center justify-between text-xs font-medium text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Cpu size={14} className="text-sky-400" />
              Detección Automática de Metadatos:
            </span>
            <span className="font-mono text-xs font-semibold text-amber-400">
              {fps} FPS activo
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Al subir tu archivo se extraerán los FPS automáticamente desde los metadatos de la cámara para que no tengas que ingresar datos técnicos.
          </p>
        </div>
      )}

      {/* Acordeón para Ajuste Manual de FPS (Opcional para entrenadores/avanzados) */}
      <div className="border border-slate-800 rounded-md overflow-hidden bg-slate-950/40">
        <button
          type="button"
          onClick={() => setShowManualFps(!showManualFps)}
          className="w-full flex items-center justify-between p-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <HelpCircle size={13} />
            <span>¿Deseas cambiar los FPS manualmente?</span>
          </span>
          {showManualFps ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showManualFps && (
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-400">
              Los FPS representan cuántas fotos toma tu cámara por cada segundo. Si sabes que grabaste con un modo específico, puedes seleccionarlo:
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 30, label: '30 FPS', desc: 'Estándar' },
                { val: 60, label: '60 FPS', desc: 'Recomendado' },
                { val: 120, label: '120 FPS', desc: 'Slow-Mo' },
                { val: 240, label: '240 FPS', desc: 'Ultra Slow' },
              ].map((item) => (
                <button
                  key={item.val}
                  type="button"
                  onClick={() => onFpsChange(item.val)}
                  className={`p-2 rounded text-left border cursor-pointer transition-colors ${
                    fps === item.val
                      ? 'border-amber-400 bg-amber-400/10 text-amber-300'
                      : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className="font-mono text-xs font-bold">{item.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Opción de Prueba Inmediata: Video Demo Sintético */}
      <div className="relative pt-1">
        <div className="flex items-center gap-3 my-2 text-xs text-slate-500">
          <div className="h-px bg-slate-800 flex-1" />
          <span>o prueba instantáneamente</span>
          <div className="h-px bg-slate-800 flex-1" />
        </div>

        <button
          type="button"
          onClick={handleGenerateDemo}
          disabled={isGeneratingDemo}
          className="w-full flex items-center justify-center gap-2 p-3 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
        >
          <Sparkles size={15} />
          {isGeneratingDemo ? (
            <span>Generando video biomecánico con cinta de 1.95m ({demoProgress}%)...</span>
          ) : (
            <span>Cargar Video Demo con Cinta Amarilla (1.95 m)</span>
          )}
        </button>
      </div>

      {/* Estado del archivo cargado */}
      {currentVideoFilename && (
        <div className="flex items-center gap-2 p-2.5 bg-emerald-950/30 border border-emerald-800/50 rounded text-xs text-emerald-300">
          <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
          <span className="truncate">Cargado: {currentVideoFilename}</span>
        </div>
      )}
    </div>
  );
};
