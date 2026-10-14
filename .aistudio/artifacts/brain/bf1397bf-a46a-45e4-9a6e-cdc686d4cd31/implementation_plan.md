# Videoanálisis Biomecánico de Salto Vertical (Kinematic Jump Analyzer)

Sistema especializado de análisis cinemático y fotogrametría por video para medir saltos verticales en un solo eje ($Y$), calculando velocidad inicial de despegue ($v_0$), tiempo de vuelo ($t_{vuelo}$) y altura máxima ($h_{máx}$) a partir de una referencia métrica en el fondo (cinta métrica amarilla calibrada).

---

## Decisiones Críticas y Confirmaciones del Usuario

> [!IMPORTANT]
> **Definiciones confirmadas según los requerimientos:**
> - **Tipo de salto:** Salto vertical puro sin desplazamiento horizontal (eje $Y$ exclusivamente).
> - **Referencia de escala en video:** Cinta métrica o franja amarilla en la pared de fondo (en esta prueba de 195 cm / 1.95 m). No se requiere leer los números de la cinta: el usuario ubica dos marcadores visuales sobre los extremos de la cinta en el video y escribe la longitud real en metros.
> - **Variables biomecánicas a calcular:** Tiempo de vuelo ($t_{vuelo}$ en segundos), Altura máxima alcanzada ($h_{máx}$ en metros y centímetros), y Velocidad inicial de despegue ($v_{0y}$ en m/s y km/h).
> - **Contraste de métodos:** Comparación entre la medición óptica directa por escala de píxeles y el modelo gravitatorio de caída libre ($h = \frac{g t^2}{8}$, $v_0 = \frac{g t}{2}$) para validar la precisión del salto.

---

## 1. Visión General y Concepto Central

- **Propósito:** Permitir a deportistas, entrenadores y evaluadores físicos cargar cualquier video de salto vertical grabado con celular o cámara, calibrar la escala real marcando los dos extremos de una cinta o guía amarilla visible detrás, y obtener un reporte cinemático exacto cuadro a cuadro sin necesidad de equipos de laboratorio costosos.
- **Público objetivo:** Atletas, preparadores físicos, fisioterapeutas y estudiantes de física o biomecánica que necesitan medir el rendimiento de salto (CMJ, Squat Jump o Abalakov) con rigor científico.
- **Valor diferencial:** Elimina la imposibilidad de leer números diminutos en el video gracias a la herramienta de calibración visual interactiva de dos puntos con lupa de precisión.

---

## 2. Experiencia de Usuario y Diseño Visual

### Flujo de Trabajo en 4 Pasos Guiados

```
┌────────────────────────────────────────────────────────────────────────┐
│  PASO 1: Carga de Video & Configuración de FPS                         │
│  - Subir archivo MP4/WebM o probar con video de demostración           │
│  - Especificar FPS (30, 60, 120 o 240 fps)                             │
├────────────────────────────────────────────────────────────────────────┤
│  PASO 2: Calibración Métrica por Cinta de Fondo                        │
│  - Colocar Punto A (base) y Punto B (tope) sobre la cinta amarilla    │
│  - Ingresar la longitud real (ej. 1.95 m)                              │
│  - Cálculo instantáneo de la escala (píxeles por metro) con lupa       │
├────────────────────────────────────────────────────────────────────────┤
│  PASO 3: Marcado de Fotogramas Clave del Salto                         │
│  - Control cuadro a cuadro (avance/retroceso fino de 1 frame)          │
│  - Punto 1: Despegue (Takeoff - último frame de contacto con el suelo) │
│  - Punto 2: Apogeo (Peak - punto más alto alcanzado)                   │
│  - Punto 3: Aterrizaje (Landing - primer frame de recepción)           │
├────────────────────────────────────────────────────────────────────────┤
│  PASO 4: Informe de Resultados & Exportación Biomecánica               │
│  - Tarjetas de métricas principales con valores numéricos grandes      │
│  - Comparativa de validación: Medición Óptica vs. Física Gravitatoria  │
│  - Gráfica de curva cinemática y exportación en PDF/CSV                │
└────────────────────────────────────────────────────────────────────────┘
```

### Estética y Dirección Visual (Dominio: Instrumentación Científica)
- **Filosofía visual:** Instrumentación de laboratorio deportivo limpio, autoritario y preciso. Sin elementos decorativos innecesarios.
- **Paleta de color (Regla 60-30-10):**
  - **60% Lienzo:** Fondo pizarra técnico oscuro (`#0B0E14` / `#0F172A`) para maximizar el contraste con el reproductor de video y los fotogramas.
  - **30% Paneles estructurales:** Paneles de calibración en gris pizarra (`#1E293B`) con bordes ultrafinos de 1px (`#334155`).
  - **10% Acentos funcionales de telemetría:** Amarillo cinta métrica (`#FACC15`) para el trazado de calibración y Cian láser (`#06B6D4`) para el seguimiento del punto de salto.
- **Tipografía:**
  - Títulos y etiquetas: *Plus Jakarta Sans* / *DM Sans*.
  - Valores numéricos y telemetría: *JetBrains Mono* con cifras tabulares (`font-mono tabular-nums`) para evitar oscilaciones de interfaz al reproducir el video.
- **Herramientas de precisión en el visor:**
  - Lupa de ampliación (2x zoom) al arrastrar los puntos de la cinta métrica para acertar exactamente en los bordes.
  - Línea guía horizontal proyectada desde el punto de salto hacia la cinta métrica de fondo para verificación visual inmediata.

---

## 3. Decisiones de Producto y Modelos Físicos

### Decisión 1: Doble Método de Cálculo para Máxima Certeza
- **Método Óptico (Espacial):**
  $$\text{Escala} = \frac{\Delta y_{píxeles\_cinta}}{L_{real}}$$
  $$h_{óptica} = \frac{y_{despegue} - y_{apogeo}}{\text{Escala}}$$
- **Método Cronométrico (Gravitatorio Clásico de Vuelo):**
  $$t_{vuelo} = \frac{\text{Frame}_{aterrizaje} - \text{Frame}_{despegue}}{\text{FPS}}$$
  $$h_{física} = \frac{g \cdot t_{vuelo}^2}{8} \quad (\text{con } g = 9.80665\text{ m/s}^2)$$
  $$v_{0y} = \frac{g \cdot t_{vuelo}}{2}$$
- **Beneficio:** Si la cámara tuvo ligera perspectiva o movimiento, el usuario puede contrastar ambos valores de altura y ver el porcentaje de discrepancia técnica, garantizando validez en los resultados.

### Decisión 2: Control Cuadro a Cuadro Fluido
- Desplazamiento frame por frame con teclado (flechas izquierda/derecha) y botones dedicados de $-1$, $+1$, $-5$, $+5$ frames.
- Marcador de tiempo visual con visualización en milisegundos y número exacto de fotograma (ej. `Frame #142 · 00:02.366`).

---

## 4. Arquitectura del Sistema y Flujo de Datos

```
┌────────────────────────────────────────────────────────────────────────┐
│                          INTERFAZ DE USUARIO                           │
│                                                                        │
│  ┌───────────────────────────────┐  ┌────────────────────────────────┐ │
│  │   Canvas / Video Viewport     │  │   Panel Lateral de Control     │ │
│  │   - Renderizado con Canvas    │  │   - Selector de etapa guiada   │ │
│  │   - Capa interactiva de pins  │  │   - Entrada longitud (1.95 m)  │ │
│  │   - Lupa de magnificación    │  │   - Selector de FPS            │ │
│  │   - Regla virtual calibrada   │  │   - Botones de captura frame   │ │
│  └──────────────┬────────────────┘  └───────────────┬────────────────┘ │
│                 │                                   │                  │
└─────────────────┼───────────────────────────────────┼──────────────────┘
                  ▼                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        MOTOR DE CÁLCULO CINETICO                       │
│                                                                        │
│  - Conversor Píxeles -> Metros según vector de calibración             │
│  - Cronometrador por delta de frames y FPS                             │
│  - Ecuaciones de cinemática vertical pura (MRUA bajo gravedad)         │
│  - Estimador de potencia mecánica (Fórmulas de Lewis y Sayers)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       REPORTE FINAL & AUDITORÍA                        │
│                                                                        │
│  - Ficha resumen de métricas (v₀, t_vuelo, h_máx)                      │
│  - Capturas de los 3 fotogramas clave vinculados                       │
│  - Gráfico de posición y velocidad en función del tiempo               │
│  - Exportador de datos para informe técnico en PDF / CSV               │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Próximos Pasos

Una vez apruebes este plan, comenzaremos la implementación completa en código con la interfaz de video, la calibración por dos puntos sobre la cinta amarilla, el reproductor cuadro a cuadro y la generación del reporte final con todas sus gráficas y fórmulas.
