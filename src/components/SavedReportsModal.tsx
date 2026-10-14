import React, { useState } from 'react';
import { SavedReport } from '../types/analyzer';
import { 
  X, FolderArchive, Trash2, ArrowRight, Calendar, User, 
  FileSpreadsheet, Edit2, Check, AlertTriangle, Scale
} from 'lucide-react';
import { deleteReportFromStorage, updateReportNameInStorage } from '../utils/storage';

interface SavedReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports: SavedReport[];
  onLoadReport: (report: SavedReport) => void;
  onReportsUpdated: (updatedList: SavedReport[]) => void;
}

export const SavedReportsModal: React.FC<SavedReportsModalProps> = ({
  isOpen,
  onClose,
  reports,
  onLoadReport,
  onReportsUpdated,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen) return null;

  const handleStartRename = (report: SavedReport) => {
    setEditingId(report.id);
    setEditNameValue(report.customName);
  };

  const handleSaveRename = (id: string) => {
    if (!editNameValue.trim()) return;
    const updated = updateReportNameInStorage(id, editNameValue.trim());
    onReportsUpdated(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = deleteReportFromStorage(id);
    onReportsUpdated(updated);
    setConfirmDeleteId(null);
  };

  const handleExportAllToCSV = () => {
    if (reports.length === 0) return;

    let csv = 'ID,Nombre_Personalizado,Atleta,Evaluador,Fecha,Video,Cinta_Color,Cinta_Medida_m,Altura_cm,Tiempo_Vuelo_s,Velocidad_v0_ms,Potencia_Watts\n';

    reports.forEach((r) => {
      csv += `"${r.id}","${r.customName.replace(/"/g, '""')}","${r.athleteName.replace(/"/g, '""')}","${r.evaluatorName.replace(/"/g, '""')}","${r.createdAt}","${r.videoFilename}","${r.calibration.referenceColorName || 'Amarillo'}","${r.calibration.realDistanceMeters.toFixed(2)}","${r.results.heightOpticalCm.toFixed(2)}","${r.results.flightTimeSeconds.toFixed(3)}","${r.results.takeoffVelocityMps.toFixed(2)}","${Math.round(r.results.peakPowerSayersWatts)}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial_saltos_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredReports = reports.filter((r) => {
    const q = filterQuery.toLowerCase();
    return (
      r.customName.toLowerCase().includes(q) ||
      r.athleteName.toLowerCase().includes(q) ||
      r.videoFilename.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[#0B0F19] border border-slate-700 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0F1420]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <FolderArchive size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Historial de Reportes Guardados</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-sky-400 font-mono">
                  {reports.length} guardados
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Almacenados en la memoria local de tu dispositivo. Puedes asignarles un nombre propio, recargarlos o exportarlos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {reports.length > 0 && (
              <button
                onClick={handleExportAllToCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 cursor-pointer transition-colors"
              >
                <FileSpreadsheet size={14} className="text-emerald-400" />
                <span>Exportar Todo a CSV</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Buscador / Filtro */}
        {reports.length > 0 && (
          <div className="px-6 py-2.5 bg-slate-900/60 border-b border-slate-800/80 flex items-center justify-between">
            <input
              type="text"
              placeholder="Buscar por nombre de reporte, atleta o archivo..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full max-w-md bg-slate-950 border border-slate-700 rounded px-3 py-1 text-xs text-slate-100 focus:outline-none focus:border-sky-400"
            />
            <span className="text-xs text-slate-500 font-mono">
              Mostrando {filteredReports.length} de {reports.length}
            </span>
          </div>
        )}

        {/* Lista de Reportes */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {reports.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <FolderArchive size={40} className="mx-auto text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-300">
                Aún no has guardado reportes en memoria
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Cuando completes un análisis en el Paso 4, haz clic en el botón <strong>"Guardar en Memoria Local"</strong> para archivarlo con tu nombre propio y consultarlo cuando quieras.
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No se encontraron reportes que coincidan con "{filterQuery}".
            </div>
          ) : (
            filteredReports.map((report) => {
              const tapeColor = report.calibration?.referenceColor || '#EAB308';
              const tapeColorName = report.calibration?.referenceColorName || 'Amarillo';
              const tapeLengthM = report.calibration?.realDistanceMeters || 1.95;

              return (
                <div
                  key={report.id}
                  className="bg-slate-900/70 border border-slate-800 rounded-lg p-4 transition-colors hover:border-slate-700 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-[240px]">
                      {editingId === report.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editNameValue}
                            onChange={(e) => setEditNameValue(e.target.value)}
                            className="bg-slate-950 border border-sky-400 rounded px-2.5 py-1 text-xs text-slate-100 font-bold focus:outline-none flex-1"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(report.id)}
                            className="p-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded cursor-pointer"
                            title="Guardar nombre"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
                            title="Cancelar"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-100 tracking-tight">
                            {report.customName}
                          </h4>
                          <button
                            onClick={() => handleStartRename(report)}
                            className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer p-0.5"
                            title="Renombrar este reporte"
                          >
                            <Edit2 size={12} />
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} className="text-slate-500" />
                          {report.createdAt}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="flex items-center gap-1">
                          <User size={11} className="text-slate-500" />
                          {report.athleteName || 'Atleta'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-slate-400">
                          {report.videoFilename}
                        </span>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          onLoadReport(report);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                      >
                        <span>Cargar al Visor</span>
                        <ArrowRight size={13} />
                      </button>

                      <button
                        onClick={() => setConfirmDeleteId(report.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                        title="Eliminar de la memoria"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Banner de Confirmación de Borrado Propio (Sin window.confirm) */}
                  {confirmDeleteId === report.id && (
                    <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-md text-xs text-rose-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-rose-400 shrink-0" />
                        ¿Confirmas eliminar este reporte permanentemente de la memoria local?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(report.id)}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs cursor-pointer"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Resumen de Métricas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800/60 font-mono text-xs">
                    <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase font-sans">Altura Salto</div>
                      <div className="font-bold text-cyan-400 text-sm mt-0.5">
                        {report.results.heightOpticalCm.toFixed(1)} cm
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase font-sans">Tiempo Vuelo</div>
                      <div className="font-bold text-amber-400 text-sm mt-0.5">
                        {report.results.flightTimeSeconds.toFixed(3)} s
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase font-sans">Velocidad v₀</div>
                      <div className="font-bold text-emerald-400 text-sm mt-0.5">
                        {report.results.takeoffVelocityMps.toFixed(2)} m/s
                      </div>
                    </div>

                    <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
                      <div className="text-[10px] text-slate-500 uppercase font-sans flex items-center gap-1">
                        <span
                          className="w-1.5 h-1.5 rounded-full inline-block"
                          style={{ backgroundColor: tapeColor }}
                        />
                        Referencia
                      </div>
                      <div className="text-slate-200 text-xs mt-0.5 truncate">
                        {tapeColorName} ({tapeLengthM.toFixed(2)}m)
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie del Modal */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0F1420] flex items-center justify-between text-xs text-slate-400">
          <span>Los datos se conservan en tu navegador incluso si cierras la ventana.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded cursor-pointer transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
