export interface Point2D {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
}

export interface CalibrationData {
  pointA: Point2D | null; // Punto inferior (base en el suelo o inicio de cinta)
  pointB: Point2D | null; // Punto superior (tope de cinta o marca conocida)
  realDistanceMeters: number; // ej. 1.95 metros
  pixelsPerMeter: number | null;
  pixelDistance: number | null;
  isCalibrated: boolean;
  referenceColor: string; // Hex color de la cinta (ej: #EAB308 amarillo, #FFFFFF blanco, etc.)
  referenceColorName: string; // Nombre legible (ej: Amarillo, Blanco, Rojo, Azul, Verde)
  referenceDescription: string; // Descripción del objeto (ej: "Cinta métrica amarilla", "Guía en pared")
}

export interface JumpKeyPoint {
  frame: number;
  timeSeconds: number;
  yNormalized: number;
  xNormalized: number;
  thumbnailUrl?: string;
}

export interface JumpAnalysisData {
  takeoff: JumpKeyPoint | null; // Despegue (último contacto con suelo)
  peak: JumpKeyPoint | null;    // Altura máxima (apogeo del salto)
  landing: JumpKeyPoint | null; // Aterrizaje (primer contacto con suelo)
  additionalPoints: JumpKeyPoint[]; // Puntos intermedios para trayectoria completa
}

export interface BiomechanicalResults {
  // Tiempos
  flightTimeSeconds: number;
  takeoffTimeSeconds: number;
  landingTimeSeconds: number;
  timeToPeakSeconds: number;

  // Alturas
  heightOpticalMeters: number;    // Calculada por escala de cinta
  heightKinematicMeters: number;  // Calculada por tiempo de vuelo g*t^2/8
  heightOpticalCm: number;
  heightKinematicCm: number;
  heightHarmonizedCm: number;     // Altura final con autocorrección interna de profundidad
  heightHarmonizedMeters: number;
  depthCorrectionFactor: number;  // Coeficiente de compensación de perspectiva (Phi)
  discrepancyCm: number;
  discrepancyPercent: number;

  // Velocidades
  takeoffVelocityMps: number;     // m/s
  takeoffVelocityKmh: number;     // km/h
  landingVelocityMps: number;

  // Parámetros atléticos y potencia
  athleteMassKg: number;
  peakPowerSayersWatts: number;   // Ecuación de Sayers et al. (1999)
  meanPowerLewisWatts: number;    // Ecuación de Lewis
  takeoffForceNewtons: number;    // Fuerza media de empuje estimada
  
  // Parámetros técnicos
  fps: number;
  videoDurationSeconds: number;
  totalFrames: number;
  pixelsPerMeter: number;
  tapeLengthMeters: number;
  tapeColor: string;
  tapeColorName: string;
}

export interface SavedReport {
  id: string;
  customName: string;
  athleteName: string;
  evaluatorName: string;
  sportDiscipline?: string;
  notes?: string;
  createdAt: string;
  videoFilename: string;
  results: BiomechanicalResults;
  calibration: CalibrationData;
  jumpAnalysis: JumpAnalysisData;
}

export type AnalysisStep = 'upload' | 'calibration' | 'tracking' | 'report';
