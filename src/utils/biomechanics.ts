import { BiomechanicalResults, CalibrationData, JumpAnalysisData } from '../types/analyzer';

export const GRAVITY = 9.80665; // m/s^2

/**
 * Calcula la distancia en píxeles entre dos puntos normalizados y la escala en píxeles por metro
 */
export function calculateCalibrationScale(
  pointA: { x: number; y: number },
  pointB: { x: number; y: number },
  videoWidth: number,
  videoHeight: number,
  realDistanceMeters: number
): { pixelDistance: number; pixelsPerMeter: number } {
  const dx = (pointB.x - pointA.x) * videoWidth;
  const dy = (pointB.y - pointA.y) * videoHeight;
  const pixelDistance = Math.sqrt(dx * dx + dy * dy);
  
  if (pixelDistance <= 0 || realDistanceMeters <= 0) {
    return { pixelDistance: 0, pixelsPerMeter: 0 };
  }

  const pixelsPerMeter = pixelDistance / realDistanceMeters;
  return { pixelDistance, pixelsPerMeter };
}

/**
 * Computa todos los parámetros biomecánicos del salto vertical
 */
export function computeBiomechanicalResults(
  analysis: JumpAnalysisData,
  calibration: CalibrationData,
  videoHeight: number,
  fps: number,
  videoDurationSeconds: number,
  totalFrames: number,
  athleteMassKg: number = 70
): BiomechanicalResults | null {
  const { takeoff, peak, landing } = analysis;
  if (!takeoff || !landing || !peak || !calibration.pixelsPerMeter || calibration.pixelsPerMeter <= 0) {
    return null;
  }

  // 1. Tiempo de vuelo
  const flightTimeSeconds = Math.max(0.01, landing.timeSeconds - takeoff.timeSeconds);
  const timeToPeakSeconds = Math.max(0, peak.timeSeconds - takeoff.timeSeconds);

  // 2. Altura por método cinemático de tiempo de vuelo (Bosco)
  // h = (g * t^2) / 8
  const heightKinematicMeters = (GRAVITY * Math.pow(flightTimeSeconds, 2)) / 8;
  const heightKinematicCm = heightKinematicMeters * 100;

  // 3. Altura por método óptico directo (Cinta métrica calibrada)
  // En coordenadas de video, Y=0 es la parte superior y Y=1 es la base inferior.
  // Un salto sube, por lo que yNormalized en el pico es MENOR que en el despegue.
  const pixelDeltaY = Math.abs(takeoff.yNormalized - peak.yNormalized) * videoHeight;
  const heightOpticalMeters = pixelDeltaY / calibration.pixelsPerMeter;
  const heightOpticalCm = heightOpticalMeters * 100;

  // Discrepancia entre métodos y factor de profundidad (Phi)
  const discrepancyCm = Math.abs(heightOpticalCm - heightKinematicCm);
  const averageHeight = (heightOpticalCm + heightKinematicCm) / 2;
  const discrepancyPercent = averageHeight > 0 ? (discrepancyCm / averageHeight) * 100 : 0;
  
  // Factor de escala por perspectiva de profundidad:
  // Si Phi > 1, el atleta estaba ligeramente por delante del plano de la pared.
  const depthCorrectionFactor = heightKinematicMeters > 0 
    ? Number((heightOpticalMeters / heightKinematicMeters).toFixed(3)) 
    : 1.0;

  // La altura cinemática gravitatoria es el estándar de oro inmune a la perspectiva;
  // la altura armonizada utiliza este valor calibrado con la resolución de fotogramas.
  const heightHarmonizedMeters = heightKinematicMeters;
  const heightHarmonizedCm = heightKinematicCm;

  // 4. Velocidad inicial de despegue
  // v0 = g * t_vuelo / 2
  const takeoffVelocityMps = (GRAVITY * flightTimeSeconds) / 2;
  const takeoffVelocityKmh = takeoffVelocityMps * 3.6;
  const landingVelocityMps = takeoffVelocityMps; // En caída libre sin resistencia de aire

  // 5. Potencia mecánica estimada (Sayers et al. y Lewis)
  const referenceHeightCm = heightHarmonizedCm;
  const referenceHeightM = heightHarmonizedMeters;

  // Sayers: Peak Power (W) = 60.7 * h_cm + 45.3 * mass_kg - 2055
  const peakPowerSayersWatts = Math.max(
    0,
    60.7 * referenceHeightCm + 45.3 * athleteMassKg - 2055
  );

  // Lewis: Mean Power (W) = sqrt(4.9) * mass_kg * sqrt(h_m) * 9.8
  const meanPowerLewisWatts = Math.max(
    0,
    Math.sqrt(4.9) * athleteMassKg * Math.sqrt(referenceHeightM) * GRAVITY
  );

  // Fuerza de empuje estimada (suponiendo fase concéntrica típica de 0.28 s)
  const estimatedPushTime = 0.28;
  const takeoffForceNewtons = athleteMassKg * (GRAVITY + takeoffVelocityMps / estimatedPushTime);

  return {
    flightTimeSeconds,
    takeoffTimeSeconds: takeoff.timeSeconds,
    landingTimeSeconds: landing.timeSeconds,
    timeToPeakSeconds,
    heightOpticalMeters,
    heightKinematicMeters,
    heightOpticalCm,
    heightKinematicCm,
    heightHarmonizedCm,
    heightHarmonizedMeters,
    depthCorrectionFactor,
    discrepancyCm,
    discrepancyPercent,
    takeoffVelocityMps,
    takeoffVelocityKmh,
    landingVelocityMps,
    athleteMassKg,
    peakPowerSayersWatts,
    meanPowerLewisWatts,
    takeoffForceNewtons,
    fps,
    videoDurationSeconds,
    totalFrames,
    pixelsPerMeter: calibration.pixelsPerMeter,
    tapeLengthMeters: calibration.realDistanceMeters,
    tapeColor: calibration.referenceColor,
    tapeColorName: calibration.referenceColorName,
  };
}

/**
 * Genera puntos de la curva parabólica teórica para visualización gráfica
 */
export function generateParabolicCurve(
  v0: number,
  flightTime: number,
  pointsCount: number = 50
): { time: number; height: number; velocity: number }[] {
  const curve = [];
  const dt = flightTime / (pointsCount - 1);

  for (let i = 0; i < pointsCount; i++) {
    const t = i * dt;
    // y(t) = v0*t - 0.5*g*t^2
    const h = Math.max(0, v0 * t - 0.5 * GRAVITY * Math.pow(t, 2));
    // v(t) = v0 - g*t
    const v = v0 - GRAVITY * t;
    curve.push({
      time: Number(t.toFixed(4)),
      height: Number(h.toFixed(4)),
      velocity: Number(v.toFixed(3)),
    });
  }

  return curve;
}
