import { SavedReport } from '../types/analyzer';

const STORAGE_KEY = 'kinematic_jump_analyzer_reports_v1';

export function getSavedReports(): SavedReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error cargando reportes de memoria local:', err);
    return [];
  }
}

export function saveReportToStorage(report: SavedReport): void {
  try {
    const existing = getSavedReports();
    // Reemplazar si ya existe con el mismo ID, o agregar al inicio
    const index = existing.findIndex((r) => r.id === report.id);
    let updated: SavedReport[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = report;
    } else {
      updated = [report, ...existing];
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Error guardando reporte en memoria local:', err);
  }
}

export function deleteReportFromStorage(id: string): SavedReport[] {
  try {
    const existing = getSavedReports();
    const updated = existing.filter((r) => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error eliminando reporte de memoria local:', err);
    return [];
  }
}

export function updateReportNameInStorage(id: string, newName: string): SavedReport[] {
  try {
    const existing = getSavedReports();
    const updated = existing.map((r) => {
      if (r.id === id) {
        return { ...r, customName: newName };
      }
      return r;
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error actualizando nombre del reporte:', err);
    return [];
  }
}
