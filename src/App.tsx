/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  AnalysisStep, CalibrationData, JumpAnalysisData, Point2D, BiomechanicalResults, SavedReport 
} from './types/analyzer';
import { Header } from './components/Header';
import { VideoPlayerCanvas } from './components/VideoPlayerCanvas';
import { UploadPanel } from './components/UploadPanel';
import { CalibrationPanel } from './components/CalibrationPanel';
import { JumpMarkingPanel } from './components/JumpMarkingPanel';
import { ReportView } from './components/ReportView';
import { SavedReportsModal } from './components/SavedReportsModal';
import { calculateCalibrationScale, computeBiomechanicalResults } from './utils/biomechanics';
import { getSavedReports, saveReportToStorage } from './utils/storage';
import { Play, Sparkles, Check, ChevronRight } from 'lucide-react';

export default function App() {
  const [currentStep, setCurrentStep] = useState<AnalysisStep>('upload');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoFilename, setVideoFilename] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [athleteMass, setAthleteMass] = useState<number>(70);

  // Calibración de la cinta métrica de referencia
  const [calibration, setCalibration] = useState<CalibrationData>({
    pointA: null,
    pointB: null,
    realDistanceMeters: 1.95, // 195 cm especificado por el usuario
    pixelsPerMeter: null,
    pixelDistance: null,
    isCalibrated: false,
    referenceColor: '#EAB308',
    referenceColorName: 'Amarillo',
    referenceDescription: 'Cinta métrica amarilla en pared',
  });

  // Marcado de momentos del salto
  const [jumpAnalysis, setJumpAnalysis] = useState<JumpAnalysisData>({
    takeoff: null,
    peak: null,
    landing: null,
    additionalPoints: [],
  });

  // Modo de pin activo para el salto
  const [targetJumpKey, setTargetJumpKey] = useState<'takeoff' | 'peak' | 'landing' | null>(null);

  // Posición actual en el video
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);

  // Resultados calculados
  const [results, setResults] = useState<BiomechanicalResults | null>(null);

  // Historial de reportes guardados en memoria local
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => getSavedReports());
  const [isSavedReportsOpen, setIsSavedReportsOpen] = useState<boolean>(false);

  // Guardar reporte actual con nombre personalizado en memoria local
  const handleSaveCurrentReport = (customName: string) => {
    if (!results) return;

    const newReport: SavedReport = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      customName,
      athleteName: 'Atleta Evaluado',
      evaluatorName: 'Biomecánica Deportiva',
      createdAt: new Date().toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      videoFilename: videoFilename || 'video_salto.mp4',
      results,
      calibration,
      jumpAnalysis,
    };

    saveReportToStorage(newReport);
    setSavedReports(getSavedReports());
  };

  // Cargar un reporte guardado previamente de la memoria local
  const handleLoadSavedReport = (report: SavedReport) => {
    setVideoFilename(report.videoFilename);
    setCalibration(report.calibration);
    setJumpAnalysis(report.jumpAnalysis);
    setResults(report.results);
    setFps(report.results.fps || 60);
    setAthleteMass(report.results.athleteMassKg || 70);
    setCurrentStep('report');
  };

  // Manejo de carga de video
  const handleVideoLoaded = (
    url: string,
    filename: string,
    videoFps: number,
    defaultTapeMeters: number = 1.95
  ) => {
    setVideoUrl(url);
    setVideoFilename(filename);
    setFps(videoFps);
    setCalibration((prev) => ({
      ...prev,
      realDistanceMeters: defaultTapeMeters,
      pointA: null,
      pointB: null,
      pixelsPerMeter: null,
      pixelDistance: null,
      isCalibrated: false,
    }));
    setJumpAnalysis({
      takeoff: null,
      peak: null,
      landing: null,
      additionalPoints: [],
    });
    setResults(null);
    setCurrentStep('calibration');
  };

  // Actualizar puntos de calibración de la cinta
  const handleUpdateCalibrationPoints = (pointA: Point2D | null, pointB: Point2D | null) => {
    let scaleData = { pixelDistance: 0, pixelsPerMeter: 0 };
    if (pointA && pointB) {
      scaleData = calculateCalibrationScale(
        pointA,
        pointB,
        720,
        1280,
        calibration.realDistanceMeters
      );
    }

    setCalibration((prev) => ({
      ...prev,
      pointA,
      pointB,
      pixelDistance: scaleData.pixelDistance > 0 ? scaleData.pixelDistance : null,
      pixelsPerMeter: scaleData.pixelsPerMeter > 0 ? scaleData.pixelsPerMeter : null,
      isCalibrated: Boolean(pointA && pointB && scaleData.pixelsPerMeter > 0),
    }));
  };

  const handleUpdateCalibrationData = (partial: Partial<CalibrationData>) => {
    setCalibration((prev) => {
      const updated = { ...prev, ...partial };
      if (updated.pointA && updated.pointB && updated.realDistanceMeters > 0) {
        const scale = calculateCalibrationScale(
          updated.pointA,
          updated.pointB,
          720,
          1280,
          updated.realDistanceMeters
        );
        updated.pixelDistance = scale.pixelDistance;
        updated.pixelsPerMeter = scale.pixelsPerMeter;
        updated.isCalibrated = scale.pixelsPerMeter > 0;
      }
      return updated;
    });
  };

  // Auto preset para la cinta en el video sintetizado de demo
  const handleAutoPresetCalibration = () => {
    const pointA: Point2D = { x: 0.28, y: 0.82 };
    const pointB: Point2D = { x: 0.28, y: 0.27 };
    handleUpdateCalibrationPoints(pointA, pointB);
  };

  // Capturar fotograma actual para un momento del salto
  const handleCaptureCurrentFrame = (type: 'takeoff' | 'peak' | 'landing') => {
    const defaultX = 0.62;
    const defaultY = type === 'peak' ? 0.45 : 0.82;

    const newPoint = {
      frame: currentFrame,
      timeSeconds: currentTime,
      xNormalized: jumpAnalysis[type]?.xNormalized ?? defaultX,
      yNormalized: jumpAnalysis[type]?.yNormalized ?? defaultY,
    };

    setJumpAnalysis((prev) => ({
      ...prev,
      [type]: newPoint,
    }));
  };

  // Capturar punto con coordenadas específicas al hacer click sobre el video
  const handleKeyPointCaptured = (
    type: 'takeoff' | 'peak' | 'landing',
    frame: number,
    time: number,
    coords: Point2D
  ) => {
    setJumpAnalysis((prev) => ({
      ...prev,
      [type]: {
        frame,
        timeSeconds: time,
        xNormalized: coords.x,
        yNormalized: coords.y,
      },
    }));
    setTargetJumpKey(null);
  };

  // Auto preset de momentos del salto para el video de demo
  const handleAutoPresetJump = () => {
    setJumpAnalysis({
      takeoff: {
        frame: 84,
        timeSeconds: 84 / 60,
        xNormalized: 0.62,
        yNormalized: 0.82,
      },
      peak: {
        frame: 102,
        timeSeconds: 102 / 60,
        xNormalized: 0.62,
        yNormalized: 0.45,
      },
      landing: {
        frame: 121,
        timeSeconds: 121 / 60,
        xNormalized: 0.62,
        yNormalized: 0.82,
      },
      additionalPoints: [],
    });
  };

  // Generar reporte
  const handleGenerateReport = () => {
    if (!jumpAnalysis.takeoff || !jumpAnalysis.peak || !jumpAnalysis.landing || !calibration.pixelsPerMeter) {
      return;
    }

    const computed = computeBiomechanicalResults(
      jumpAnalysis,
      calibration,
      1280,
      fps,
      (currentFrame + 60) / fps,
      currentFrame + 60,
      athleteMass
    );

    if (computed) {
      setResults(computed);
      setCurrentStep('report');
    }
  };

  // Recomputar resultados si cambian parámetros en reporte
  useEffect(() => {
    if (jumpAnalysis.takeoff && jumpAnalysis.peak && jumpAnalysis.landing && calibration.pixelsPerMeter) {
      const computed = computeBiomechanicalResults(
        jumpAnalysis,
        calibration,
        1280,
        fps,
        (currentFrame + 60) / fps,
        currentFrame + 60,
        athleteMass
      );
      if (computed) setResults(computed);
    }
  }, [athleteMass, calibration.pixelsPerMeter, fps, jumpAnalysis]);

  const handleReset = () => {
    setVideoUrl(null);
    setVideoFilename(null);
    setCalibration((prev) => ({
      pointA: null,
      pointB: null,
      realDistanceMeters: 1.95,
      pixelsPerMeter: null,
      pixelDistance: null,
      isCalibrated: false,
      referenceColor: prev.referenceColor || '#EAB308',
      referenceColorName: prev.referenceColorName || 'Amarillo',
      referenceDescription: prev.referenceDescription || 'Cinta métrica',
    }));
    setJumpAnalysis({
      takeoff: null,
      peak: null,
      landing: null,
      additionalPoints: [],
    });
    setResults(null);
    setCurrentStep('upload');
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Encabezado según Top Bar Contract */}
      <Header
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        onReset={handleReset}
        hasVideo={Boolean(videoUrl)}
        isCalibrated={calibration.isCalibrated}
        hasAnalysis={Boolean(results)}
        onOpenSavedReports={() => setIsSavedReportsOpen(true)}
        savedReportsCount={savedReports.length}
      />

      {/* Franja de Pasos / Pipeline */}
      <div className="border-b border-slate-800/80 bg-[#0B0F19]/90 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="text-slate-400">FLUJO:</span>
            <span className={currentStep === 'upload' ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              1. Video
            </span>
            <ChevronRight size={13} className="text-slate-600" />
            <span className={currentStep === 'calibration' ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              2. Cinta {calibration.referenceColorName} ({calibration.realDistanceMeters.toFixed(2)}m)
            </span>
            <ChevronRight size={13} className="text-slate-600" />
            <span className={currentStep === 'tracking' ? 'text-amber-400 font-bold' : 'text-slate-400'}>
              3. Salto (Despegue / Pico / Caída)
            </span>
            <ChevronRight size={13} className="text-slate-600" />
            <span className={currentStep === 'report' ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
              4. Reporte
            </span>
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            {currentStep === 'calibration' && 'Marca el inicio y fin de la cinta con la lupa'}
            {currentStep === 'tracking' && 'Navega fotograma a fotograma para registrar los instantes'}
            {currentStep === 'report' && 'Informe biomecánico listo para guardar y exportar'}
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentStep === 'report' && results ? (
          <ReportView
            results={results}
            jumpAnalysis={jumpAnalysis}
            calibration={calibration}
            videoFilename={videoFilename || 'video_salto.mp4'}
            onBackToEdit={() => setCurrentStep('tracking')}
            onSaveReport={handleSaveCurrentReport}
            onOpenSavedReports={() => setIsSavedReportsOpen(true)}
            savedReportsCount={savedReports.length}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Izquierda / Central: Visor de Video y Canvas */}
            <div className="lg:col-span-7 space-y-4">
              {videoUrl ? (
                <VideoPlayerCanvas
                  videoUrl={videoUrl}
                  fps={fps}
                  currentStep={currentStep}
                  calibration={calibration}
                  onUpdateCalibrationPoints={handleUpdateCalibrationPoints}
                  jumpAnalysis={jumpAnalysis}
                  onUpdateJumpPoints={(partial) => setJumpAnalysis((p) => ({ ...p, ...partial }))}
                  onCurrentFrameChange={(f, t) => {
                    setCurrentFrame(f);
                    setCurrentTime(t);
                  }}
                  targetJumpKey={targetJumpKey}
                  onKeyPointCaptured={handleKeyPointCaptured}
                />
              ) : (
                <div className="bg-[#0F1420] border border-slate-800 rounded-lg p-12 text-center flex flex-col items-center justify-center min-h-[460px]">
                  <div className="w-14 h-14 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-4">
                    <Play size={24} className="ml-1" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-200">
                    Ningún video cargado aún
                  </h3>
                  <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
                    Sube tu grabación donde se aprecie el salto y la cinta métrica en la pared de fondo, o pulsa en el botón de la derecha para probar el video de demostración.
                  </p>
                  {savedReports.length > 0 && (
                    <div className="mt-5">
                      <button
                        onClick={() => setIsSavedReportsOpen(true)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-800/60 text-xs font-bold rounded transition-colors cursor-pointer"
                      >
                        Ver mis {savedReports.length} reportes guardados en memoria
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Guía Biomecánica Rápida & Protocolo de Grabación */}
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3.5 text-xs text-slate-400 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <div className="leading-relaxed">
                  <strong className="text-slate-200">Protocolo de grabación recomendado: </strong>
                  (1) Coloca la cámara a la altura de la cadera o pecho. (2) Salta aproximadamente a 30-50 cm frente a la cinta métrica de la pared. (3) No te preocupes por la distancia exacta: el sistema concilia internamente la escala óptica de la cinta con el tiempo de vuelo de Bosco, eliminando distorsiones de perspectiva automáticamente.
                </div>
              </div>
            </div>

            {/* Columna Derecha: Panel de Control del Paso Actual */}
            <div className="lg:col-span-5 space-y-4">
              {currentStep === 'upload' && (
                <UploadPanel
                  onVideoLoaded={handleVideoLoaded}
                  fps={fps}
                  onFpsChange={setFps}
                  currentVideoFilename={videoFilename}
                />
              )}

              {currentStep === 'calibration' && (
                <CalibrationPanel
                  calibration={calibration}
                  onUpdateCalibration={handleUpdateCalibrationData}
                  onResetPoints={() =>
                    setCalibration((prev) => ({
                      ...prev,
                      pointA: null,
                      pointB: null,
                      pixelDistance: null,
                      pixelsPerMeter: null,
                      isCalibrated: false,
                    }))
                  }
                  onProceedToTracking={() => setCurrentStep('tracking')}
                  onAutoPreset={videoFilename?.includes('demo') ? handleAutoPresetCalibration : undefined}
                />
              )}

              {currentStep === 'tracking' && (
                <JumpMarkingPanel
                  currentFrame={currentFrame}
                  currentTime={currentTime}
                  fps={fps}
                  calibration={calibration}
                  jumpAnalysis={jumpAnalysis}
                  targetJumpKey={targetJumpKey}
                  onSetTargetJumpKey={setTargetJumpKey}
                  onCaptureCurrentFrame={handleCaptureCurrentFrame}
                  onResetJumpMarks={() =>
                    setJumpAnalysis({
                      takeoff: null,
                      peak: null,
                      landing: null,
                      additionalPoints: [],
                    })
                  }
                  onProceedToReport={handleGenerateReport}
                  onAutoPresetJump={videoFilename?.includes('demo') ? handleAutoPresetJump : undefined}
                  athleteMass={athleteMass}
                  onAthleteMassChange={setAthleteMass}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal de Historial de Reportes Guardados en Memoria Local */}
      <SavedReportsModal
        isOpen={isSavedReportsOpen}
        onClose={() => setIsSavedReportsOpen(false)}
        reports={savedReports}
        onLoadReport={handleLoadSavedReport}
        onReportsUpdated={(updated) => setSavedReports(updated)}
      />
    </div>
  );
}
