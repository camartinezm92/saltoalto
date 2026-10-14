/**
 * Generador de video sintético de demostración para pruebas biomecánicas
 * Dibuja un atleta realizando un salto vertical frente a una cinta métrica amarilla en la pared.
 * Utiliza canvas.captureStream() y MediaRecorder para crear un Blob de video real (WebM/MP4).
 */

export function createDemoVideoBlob(
  onProgress?: (percent: number) => void
): Promise<{ url: string; duration: number; fps: number; defaultTapeMeters: number }> {
  return new Promise((resolve, reject) => {
    try {
      const width = 720;
      const height = 1280;
      const fps = 60;
      const totalFrames = 240; // 4 segundos a 60 fps
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('No se pudo inicializar contexto 2D para video demo'));
        return;
      }

      // Parámetros de la escena
      const floorY = height * 0.82;
      const tapeX = width * 0.28;
      const tapeWidth = 32;
      // La cinta amarilla mide 1.95m y va desde el suelo (floorY) hasta tapeTopY
      const tapeHeightPx = height * 0.55; // 55% de la altura de pantalla
      const tapeTopY = floorY - tapeHeightPx;
      const pixelsPerMeter = tapeHeightPx / 1.95;

      // Parámetros físicos del salto del atleta (silueta)
      // Despegue en t = 1.4s (frame 84), vuelo de 0.62 s, aterrizaje en t = 2.02s (frame 121)
      const takeoffFrame = 84;
      const landingFrame = 121;
      const peakFrame = Math.round((takeoffFrame + landingFrame) / 2); // frame 102
      const jumpHeightMeters = 0.47; // 47 cm de salto
      const jumpHeightPx = jumpHeightMeters * pixelsPerMeter;

      const athleteX = width * 0.62;
      const athleteHeight = height * 0.38;

      const stream = canvas.captureStream(fps);
      const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
      ];
      let selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

      const recorder = new MediaRecorder(stream, selectedMime ? { mimeType: selectedMime } : undefined);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: selectedMime || 'video/webm' });
        const url = URL.createObjectURL(blob);
        resolve({
          url,
          duration: totalFrames / fps,
          fps,
          defaultTapeMeters: 1.95,
        });
      };

      recorder.start();

      let currentFrame = 0;

      function renderFrame() {
        if (!ctx) return;

        // Fondo: Pared de gimnasio técnico oscuro
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#101726');
        bgGrad.addColorStop(0.7, '#182236');
        bgGrad.addColorStop(1, '#0e1420');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Piso técnico
        ctx.fillStyle = '#080c14';
        ctx.fillRect(0, floorY, width, height - floorY);
        ctx.strokeStyle = '#22324d';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(width, floorY);
        ctx.stroke();

        // Cuadrícula sutil de referencia en pared
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let y = 100; y < floorY; y += 80) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // --- CINTA MÉTRICA AMARILLA DE FONDO ---
        // Cinta amarilla intensa (exactamente como describió el usuario)
        ctx.fillStyle = '#EAB308'; // Amarillo cinta métrica
        ctx.shadowColor = 'rgba(234, 179, 8, 0.35)';
        ctx.shadowBlur = 12;
        ctx.fillRect(tapeX, tapeTopY, tapeWidth, tapeHeightPx);
        ctx.shadowBlur = 0;

        // Borde y marcas de la cinta
        ctx.strokeStyle = '#CA8A04';
        ctx.lineWidth = 2;
        ctx.strokeRect(tapeX, tapeTopY, tapeWidth, tapeHeightPx);

        // Pequeñas divisiones en la cinta amarilla (sin números legibles para simular la realidad)
        ctx.fillStyle = '#713F12';
        const numTicks = 39; // cada 5 cm aprox
        for (let i = 0; i <= numTicks; i++) {
          const tickY = floorY - (i / numTicks) * tapeHeightPx;
          const isMajor = i % 5 === 0;
          const tickLen = isMajor ? tapeWidth * 0.75 : tapeWidth * 0.4;
          ctx.fillRect(tapeX, tickY - 1, tickLen, isMajor ? 2.5 : 1.5);
        }

        // Marcadores de extremo (Base y Tope 1.95m)
        ctx.fillStyle = '#B45309';
        ctx.fillRect(tapeX - 4, tapeTopY - 4, tapeWidth + 8, 8);
        ctx.fillRect(tapeX - 4, floorY - 4, tapeWidth + 8, 8);

        // Etiqueta indicativa pequeña
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '13px sans-serif';
        ctx.fillText('CINTA DE REFERENCIA (1.95m)', tapeX - 20, tapeTopY - 18);

        // --- ATLETA EN MOVIMIENTO ---
        // Calcular posición Y del atleta según la fase del salto
        let jumpOffset = 0;
        let kneeSquat = 0;

        if (currentFrame < 45) {
          // Fase 1: Posición inicial erguido
          jumpOffset = 0;
          kneeSquat = 0;
        } else if (currentFrame < takeoffFrame) {
          // Fase 2: Contramovimiento (flexión de rodillas antes de despegar)
          const p = (currentFrame - 45) / (takeoffFrame - 45);
          kneeSquat = Math.sin(p * Math.PI) * 45;
        } else if (currentFrame <= landingFrame) {
          // Fase 3: VUELO PARABÓLICO en eje Y
          const p = (currentFrame - takeoffFrame) / (landingFrame - takeoffFrame); // 0 a 1
          // Parábola 4 * p * (1 - p) alcanza 1 en p = 0.5
          jumpOffset = 4 * p * (1 - p) * jumpHeightPx;
          kneeSquat = 0;
        } else if (currentFrame < landingFrame + 25) {
          // Fase 4: Amortiguación de caída
          const p = (currentFrame - landingFrame) / 25;
          kneeSquat = Math.sin(p * Math.PI) * 35;
          jumpOffset = 0;
        } else {
          // Fase 5: Erguido nuevamente
          jumpOffset = 0;
          kneeSquat = 0;
        }

        // Dibujar silueta atlética
        const currentAthleteBaseY = floorY - jumpOffset;
        drawAthleteFigure(ctx, athleteX, currentAthleteBaseY, athleteHeight, kneeSquat, jumpOffset > 2);

        // Contador de telemetría de fotograma embebido en la esquina
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(20, 20, 230, 48);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(20, 20, 230, 48);
        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 14px monospace';
        const timeSec = (currentFrame / fps).toFixed(3);
        ctx.fillText(`FRAME #${String(currentFrame).padStart(3, '0')} · ${timeSec}s`, 34, 48);

        currentFrame++;
        if (onProgress) {
          onProgress(Math.round((currentFrame / totalFrames) * 100));
        }

        if (currentFrame < totalFrames) {
          requestAnimationFrame(renderFrame);
        } else {
          recorder.stop();
        }
      }

      renderFrame();
    } catch (err) {
      reject(err);
    }
  });
}

function drawAthleteFigure(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseY: number,
  totalHeight: number,
  squatOffset: number,
  isInAir: boolean
) {
  ctx.save();
  ctx.fillStyle = '#38BDF8'; // Color cian atlético
  ctx.strokeStyle = '#38BDF8';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const effectiveHeight = totalHeight - squatOffset;
  const headRadius = 18;
  const headY = baseY - effectiveHeight + headRadius;
  const neckY = headY + headRadius + 4;
  const hipY = baseY - effectiveHeight * 0.48;

  // Cabeza
  ctx.beginPath();
  ctx.arc(x, headY, headRadius, 0, Math.PI * 2);
  ctx.fill();

  // Torso
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.moveTo(x, neckY);
  ctx.lineTo(x, hipY);
  ctx.stroke();

  // Brazos (en vuelo se elevan para impulso vertical)
  ctx.lineWidth = 8;
  const armRaise = isInAir ? -45 : squatOffset > 10 ? 30 : 0;
  // Brazo izquierdo
  ctx.beginPath();
  ctx.moveTo(x, neckY + 12);
  ctx.lineTo(x - 28, neckY + 45 + armRaise);
  ctx.stroke();
  // Brazo derecho
  ctx.beginPath();
  ctx.moveTo(x, neckY + 12);
  ctx.lineTo(x + 28, neckY + 45 + armRaise);
  ctx.stroke();

  // Piernas
  const kneeY = (hipY + baseY) / 2 + (squatOffset > 0 ? 10 : 0);
  const kneeSpread = squatOffset > 0 ? 18 : 6;

  // Pierna izquierda
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(x - 6, hipY);
  ctx.lineTo(x - 6 - kneeSpread, kneeY);
  ctx.lineTo(x - 8, baseY);
  ctx.stroke();

  // Pierna derecha
  ctx.beginPath();
  ctx.moveTo(x + 6, hipY);
  ctx.lineTo(x + 6 + kneeSpread, kneeY);
  ctx.lineTo(x + 8, baseY);
  ctx.stroke();

  // Pies (punto de referencia de contacto)
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(x - 12, baseY);
  ctx.lineTo(x + 14, baseY);
  ctx.stroke();

  // Punto guía en tobillo/talón para ayudar al usuario a ver el tracking
  ctx.fillStyle = '#F43F5E';
  ctx.beginPath();
  ctx.arc(x, baseY - 6, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
