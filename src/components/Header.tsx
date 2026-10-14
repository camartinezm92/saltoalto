import React from 'react';
import { AnalysisStep } from '../types/analyzer';
import { FolderArchive } from 'lucide-react';

interface HeaderProps {
  currentStep: AnalysisStep;
  onSelectStep: (step: AnalysisStep) => void;
  onReset: () => void;
  hasVideo: boolean;
  isCalibrated: boolean;
  hasAnalysis: boolean;
  onOpenSavedReports?: () => void;
  savedReportsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentStep,
  onSelectStep,
  onReset,
  hasVideo,
  isCalibrated,
  hasAnalysis,
  onOpenSavedReports,
  savedReportsCount = 0,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-[#0B0F19] sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 rounded bg-amber-400 flex items-center justify-center font-bold text-slate-950 text-sm shadow-sm">
          Δy
        </div>
        <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
          Kinematic Jump Analyzer
        </span>
      </div>

      {/* Zone 2: 4 single-line navigation step links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
        <button
          onClick={() => onSelectStep('upload')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            currentStep === 'upload' ? 'text-amber-400 font-semibold' : ''
          }`}
        >
          1. Cargar Video
        </button>

        <button
          onClick={() => hasVideo && onSelectStep('calibration')}
          disabled={!hasVideo}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            !hasVideo
              ? 'opacity-40 cursor-not-allowed'
              : currentStep === 'calibration'
              ? 'text-amber-400 font-semibold'
              : 'hover:text-slate-100'
          }`}
        >
          2. Calibrar Cinta
        </button>

        <button
          onClick={() => isCalibrated && onSelectStep('tracking')}
          disabled={!isCalibrated}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            !isCalibrated
              ? 'opacity-40 cursor-not-allowed'
              : currentStep === 'tracking'
              ? 'text-amber-400 font-semibold'
              : 'hover:text-slate-100'
          }`}
        >
          3. Marcar Salto
        </button>

        <button
          onClick={() => hasAnalysis && onSelectStep('report')}
          disabled={!hasAnalysis}
          className={`transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            !hasAnalysis
              ? 'opacity-40 cursor-not-allowed'
              : currentStep === 'report'
              ? 'text-amber-400 font-semibold'
              : 'hover:text-slate-100'
          }`}
        >
          4. Informe Final
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {onOpenSavedReports && (
          <button
            onClick={onOpenSavedReports}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-300 bg-sky-950/40 hover:bg-sky-900/50 border border-sky-800/60 rounded-md transition-colors cursor-pointer"
            title="Ver reportes guardados en memoria local"
          >
            <FolderArchive size={14} className="text-sky-400" />
            <span className="hidden sm:inline">Historial</span>
            <span className="text-[10px] font-mono bg-sky-900 text-sky-200 px-1.5 py-0.2 rounded-full">
              {savedReportsCount}
            </span>
          </button>
        )}

        <button
          onClick={onReset}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800/90 border border-slate-700/80 rounded-md hover:bg-slate-700 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Nuevo Análisis
        </button>
      </div>
    </header>
  );
};
