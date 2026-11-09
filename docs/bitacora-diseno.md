# Bitácora de proyectos — Especificación de diseño (v1, 2026-11-09)

Autor: ui-design-reviewer. Solo diseño; no se construyó nada. Implementa `frontend-ui`; verifica `verificador-qa`.
Etiquetas: **[Observado]** = leído en el código/archivos; **[Inferido]** = deducido; **[Propuesta]** = decisión de diseño nueva.

## 0. Brief de sensación (obligatorio por la guía)
- **Sentir en 3 s**: "Esto está ordenado y se nota que fueron y trabajaron" (pantalla); "empresa seria que documenta" (PDF cliente).
- **Un objeto que sostiene todo**: la **línea de tiempo diaria** (en pantalla) y la **foto con su pie** (en el PDF).
- **Se recorta (~80 %)**: sin métricas decorativas, sin gráficas, sin tarjetas dentro de tarjetas, sin degradados fuera del CTA.

## 0.1 Hallazgo importante: la app web es OSCURA
- **[Observado]** `src/index.css` (AC Fluid): fondo navy, `.card` con degradado `rgba(23,48,82,.9)→rgba(16,38,63,.92)`, botón primario degradado azul `#0a62ff→#2bb8ff`, radio de tarjeta 1rem (16 px), fuente Inter, resortes `--spring-soft` / `--spring-bounce`, foco `#00c2ff`.
- La guía base pide estilo claro SaaS, pero **el brief aprobado manda y la app ya es AC Fluid oscuro**: las pantallas de la Bitácora **reutilizan las clases existentes** (`.card`, `.btn-primary/secondary/ghost`, `.field`, `.seg`), no introducen otro look. Los chips pastel se adaptan a fondo oscuro (fondo translúcido + texto claro del mismo tono).
- Los **PDF son papel** (fondo blanco) y usan la marca del logo: naranja `#F46B20`, azul `#0070C0`, navy `#202850` (**[Observado]** `QuotationPDF.jsx`). Pantalla oscura y PDF claro es normal (cotización ya funciona así).
- Biblioteca: `tokens.json` solo tiene movimiento y radios; se usan `radius.card` 16 / `inner` 8 / `pill` 999 y `spring-soft`. No hay entradas previas ni descartadas sobre bitácoras/informes. La plantilla `.docx` se toma solo como referencia de marca (no se pudo leer el binario con las herramientas de texto: **[Inferido]** que replica portada+logo+header+footer según CLAUDE.md; sus medidas exactas no se auditaron).

---

## 1. Pantallas del módulo

Ruta base con HashRouter: `/#/app/bitacora` (en código `/app/bitacora`). Menú lateral: ítem "Bitácora" (ícono libreta/clipboard de la familia ya usada en Sidebar).

### 1.1 Lista de proyectos por cliente (`/#/app/bitacora`)
- **Cabecera**: título "Bitácora de proyectos" 28/600 (Inter, -0.02em); a la derecha botón primario único **"+ Nuevo proyecto"**. Debajo: buscador (`.field`, 44 px alto) + `.seg` de filtro: Todos · En curso · Con pendientes · Cerrados.
- **Apertura con lo que requiere decisión** (regla IA nº 8): franja de una línea sobre la lista: "2 proyectos con pendientes vencidos" (chip ámbar, clic filtra). Si no hay, no se muestra.
- **Agrupación**: un bloque por cliente. Encabezado del bloque: nombre del cliente 16/600 + contador "3 proyectos" 12/400 gris; sin tarjeta alrededor del encabezado (plano).
- **Tarjeta de proyecto** (`.card`, radio 16, padding 20, alto mín. 112, hoja de 1 columna móvil, 2 columnas ≥1024 px, gap 16):
  - Fila 1: título del proyecto 16/600 (máx. 2 líneas, ellipsis) + chip de estado a la derecha.
  - Fila 2: chip de tipo ("1 día" / "Varios días") + rango de fechas "vie 6 nov 2026" o "3 nov → 6 nov 2026" 13/400.
  - Fila 3 (pie, línea superior 1 px `rgba(255,255,255,.07)`, sin sub-tarjeta): "4 fotos · 1 pendiente abierto" 12/400. Los números de datos con `tabular-nums`.
  - Toda la tarjeta es clicable (`card-hover`, resorte suave 465 ms ya existente). Teclado: Enter abre; foco visible `#00c2ff`.
- **Chips de estado** (pill, alto 24, padding 0 10, texto 12/600; sobre fondo oscuro):
  | Estado | Fondo | Texto | Significado |
  |---|---|---|---|
  | En curso | `rgba(43,184,255,.16)` | `#7DD3FF` | hay días por registrar |
  | Con pendientes | `rgba(251,191,36,.16)` | `#FCD34D` | cerrado en campo, quedan tareas abiertas |
  | Terminado | `rgba(52,211,153,.16)` | `#6EE7B7` | sin pendientes, informe listo |
  | Borrador | `rgba(148,163,184,.16)` | `#CBD5E1` | aún sin informe |
  Cada chip lleva ícono de 12 px + palabra (nunca solo color). Chips de tipo: neutros `rgba(255,255,255,.07)`, texto `#CBD5E1`.
- **Estados**: vacío ("Aún no hay proyectos. Crea el primero cuando regreses de una visita." + botón primario); cargando = 4 skeletons del alto de la tarjeta (sin salto, CLS 0); error = mensaje "No se pudo cargar la bitácora" + botón "Reintentar".

### 1.2 Detalle de proyecto (`/#/app/bitacora/:id`)
- **Encabezado** (sin degradado): migas "Bitácora › Postforming"; título 28/600; fila de chips (estado, tipo, fechas); a la derecha **dos botones de descarga** (ver 1.4).
- **Layout escritorio**: 2 columnas, línea de tiempo 8/12 + panel lateral 4/12 (pendientes), gap 24. Móvil: 1 columna, pendientes tras la línea de tiempo.
- **Línea de tiempo diaria**: eje vertical de 2 px `rgba(255,255,255,.14)` a x = 12 px; en cada día un punto 12 px (relleno `#2bb8ff`, anillo 4 px `rgba(43,184,255,.25)`). Orden: día más reciente arriba. Encima, botón secundario **"+ Agregar día"**.
- **Tarjeta de día** (`.card`, radio 16, padding 20, margen izquierdo 32 px desde el eje, separación vertical 16):
  1. Cabecera: "Viernes 6 de noviembre de 2026" 16/600 + "Día 1 de 1" 12/400 gris; a la derecha menú "⋯" (editar/eliminar; ícono de línea, target 44×44).
  2. Texto del trabajo 15/400, interlineado 1.5, máx. 68 caracteres de ancho (`max-width: 68ch`), alineado a la izquierda. Admite varias líneas; las listas con viñeta se respetan.
  3. Galería: grilla de miniaturas, 3 por fila escritorio (cada una ≥ 160×120, `aspect-ratio 4/3`, `object-fit: cover`, radio **8** = 16 − padding recortado a 8 por regla radio interior), 2 por fila móvil, gap 8. Clic abre visor (lightbox) con flechas, pie de foto editable y botón cerrar (Esc). Carga `loading="lazy"`, miniaturas WebP ≤ 480 px de ancho, `width/height` fijos (sin saltos).
  4. Pie de foto: debajo de cada miniatura, 12/400 `#9FB0C4`, 1 línea con ellipsis; en el visor, completo. Campo pie obligatorio al subir ("¿qué se ve?"), pero se puede dejar vacío (el PDF muestra solo "Foto N").
  5. Zona "arrastrar fotos o elegir archivos" con borde punteado 1.5 px `rgba(255,255,255,.2)`, radio 8, alto 72; resalta con borde `#2bb8ff` al soltar encima (150 ms, ease-out). En móvil abre cámara/galería.
- **Sin animación decorativa**: las tarjetas entran con `spring-soft` una sola vez (clase temporal ~900 ms, lección AC Fluid); nada en bucle. Respeta `prefers-reduced-motion` (sin movimiento, solo fundido 100 ms).
- **Estado vacío del proyecto**: "Aún no hay días registrados" + botón "Agregar el primer día".

### 1.3 Pendientes (panel lateral del detalle, no tarjeta anidada)
- Una sola `.card` (padding 20) titulada "Pendientes" 16/600 + contador "2 abiertos" (chip).
- Cada ítem es una fila plana (separador 1 px, sin sub-tarjeta), alto mín. 52:
  - Casilla 20×20 (radio 6; hitbox 44×44), texto 14/400 (tachado + gris al completar), debajo en 12/400: **Responsable** (chip neutro con iniciales/nombre) y **Fecha límite** ("sáb 7 nov"). Vencido: fecha en `#FCA5A5` + palabra "Vencido" (no solo color).
- Alta rápida al pie: campo "Nuevo pendiente…" + responsable (selector) + fecha (selector) + botón secundario "Agregar". Enter agrega.
- Pendiente nuevo para el ejemplo: ver §6.
- **Los pendientes son internos**: no existe vista para el cliente; la etiqueta del panel dice "Solo equipo · no sale en el informe del cliente" (12/400, ícono candado).

### 1.4 Botones de descarga
- **"Descargar informe del cliente (PDF)"**: botón **primario** (único dominante de la pantalla; `.btn-primary`, alto 44). Ícono descarga.
- **"Descargar pendientes del personal (PDF)"**: botón **secundario** (`.btn-secondary`, alto 44). Si no hay pendientes abiertos: deshabilitado con tooltip "No hay pendientes abiertos".
- Estado cargando: `aria-busy="true"` (spinner ya existente) mientras `@react-pdf/renderer` genera. Éxito: toast 240 ms "Informe descargado". Error: "No se pudo generar el PDF. Reintentar" (sin códigos).
- El informe del cliente se bloquea (botón deshabilitado + tooltip) si el proyecto está en Borrador y no tiene al menos 1 día con texto.
- Nombre de archivo: `Informe_Postforming_2026-11-06.pdf` y `Pendientes_Postforming_2026-11-06.pdf` (cliente sin tildes/espacios → guion bajo; fecha de inicio ISO).

### 1.5 Formulario "Nuevo proyecto" (modal/hoja)
Campos con label visible: Cliente (selector con búsqueda; crear nuevo), Título, Tipo (control `.seg` 1 día / Varios días), Fecha de inicio, Fecha de fin (solo varios días), Descripción breve para el resumen (opcional, se usa en el informe). Botón primario "Crear proyecto". Validación inline junto al campo.

---

## 2. PDF 1 — INFORME FINAL AL CLIENTE

Formato **A4 vertical 595.28 × 841.89 pt**, `@react-pdf/renderer`, fuente **Helvetica** (incorporada: sin descargas, mismo criterio que `QuotationPDF.jsx`; se mantiene `Font.registerHyphenationCallback(w => [w])`). Páginas: portada + 1-N de contenido. Sin pendientes internos en ningún lugar.

### 2.1 Portada (página 1, fondo blanco)
- Franja superior de marca (como cotización, pero mayor): alto 10 pt, naranja 72 % + azul 28 %, pegada al borde.
- Logo `src/assets/logo.png`: ancho 150 pt (alto proporcional), esquina superior izquierda a (48, 56).
- Bloque de título, centrado verticalmente en el tercio superior-medio (arrancando y = 250):
  - Kicker "INFORME FINAL DE SERVICIO" 10 pt bold, `#C2500F` (naranja oscurecido: el `#F46B20` en texto pequeño sobre blanco solo da ~3.1:1, no cumple AA; el naranja puro queda para barras/decoración), letter-spacing 2.5.
  - Título del proyecto (ej. "Ensamble de base metálica para cámara — Bodega") 28 pt bold `#202850`, interlineado 1.2, máx. 3 líneas, alineado a la izquierda.
  - Filete naranja 48×4 pt, radio 2, margen vertical 16.
  - Cliente 16 pt regular `#2B3342`; debajo fecha de emisión 11 pt `#6B7686`.
- Bloque "Datos" abajo de la portada (y = 640, 3 columnas, etiqueta 8 pt bold gris + valor 11 pt bold navy): **Cliente · Fechas del servicio · Responsable técnico (Grupo AC)**.
- Pie de portada: línea fina `#EADFD6` y datos de contacto de Grupo AC 9 pt `#6B7686` (tomar del pie de la cotización; no inventar).
- Fondo decorativo: una sola forma, un cuarto de círculo azul `#0070C0` al 6 % de opacidad en la esquina inferior derecha de 260 pt de radio (opcional; si el render es pesado, omitir).
- No lleva encabezado ni número de página.

### 2.2 Páginas de contenido
Márgenes: arriba 56, abajo 64, laterales 48 → ancho útil **499 pt**. Encabezado repetido (desde pág. 2): logo 70 pt ancho a la izquierda, a la derecha "Informe final · {Cliente}" 8 pt `#6B7686`; línea 0.75 pt `#EADFD6` debajo. Pie fijo: izquierda "Grupo AC · {sitio/teléfono}" 8 pt gris; derecha "Página N de M" 8 pt (`render` con `pageNumber/totalPages`); barra 3 pt naranja/azul 72/28 al borde inferior.

**Sección A — Resumen ejecutivo**
- Título de sección: "RESUMEN EJECUTIVO" 9 pt bold naranja oscuro `#C2500F`, letter-spacing 1.8, margen inferior 8.
- Caja de resumen: fondo `#FFF4EC`, borde izquierdo 3 pt `#F46B20`, radio derecho 6, padding 12×16; texto 11 pt, interlineado 1.5, `#2B3342`, 3-5 líneas máx. Responde: qué se pidió, qué se hizo, en qué estado quedó.
- Debajo, **3 indicadores en fila** (cada uno 155 pt de ancho, gap 17; sin cajas anidadas, solo número y etiqueta): valor 22 pt bold navy + etiqueta 8 pt bold gris: **Inicio**, **Fin**, **Días trabajados**.

**Sección B — Tiempos**
- Tabla simple de 2 columnas (etiqueta 130 pt / valor): Fecha de inicio · Fecha de fin · Días trabajados (n) · Tipo de servicio (1 día / varios días) · Estado final. Filas altas 24 pt, separador 0.75 pt `#EADFD6`, sin zebra (regla: separador o zebra, no ambos). Etiquetas 9 pt gris, valores 10.5 pt bold navy.
- Si es de varios días, línea de tiempo horizontal mínima: 1 punto de 8 pt por día sobre una línea de 1.5 pt `#0070C0`, con fecha corta debajo (8 pt). Máx. 7 puntos por línea (más: se omite y queda solo la tabla).

**Sección C — Trabajo realizado por día**
- Por cada día un bloque (con `wrap={false}` en el encabezado + primer párrafo para no huérfanos):
  - Fila de encabezado: chip de fecha pill (fondo `#E6F1FA`, texto `#0070C0` 9 pt bold, padding 3×10) "Viernes 6 de noviembre de 2026" + "Día 1 de 1" 8 pt gris a la derecha.
  - Texto 10.5 pt, interlineado 1.5, `#2B3342`, alineado a la izquierda, párrafos separados 6 pt. Viñetas con punto naranja (`bulletDot` como en cotización).
  - Separación entre días 18 pt; línea fina entre días.

**Sección D — Galería fotográfica**
- Título "REGISTRO FOTOGRÁFICO". Si un día tiene fotos, van **justo después del texto de ese día** (no al final), bajo subtítulo "Fotos — {fecha corta}".
- **Grilla de 2 fotos por fila**: ancho de foto **243.5 pt**, gap horizontal 12 pt (243.5×2+12 = 499), alto **182.6 pt** (4:3), `objectFit: 'cover'`, radio 8, borde 0.75 pt `#EADFD6`. Gap vertical entre filas 14 pt (incluye el pie).
- **Pie de foto** bajo cada foto: "Foto 3 · Cámara montada en la viga" — número 8 pt bold `#C2500F` + texto 9 pt `#2B3342`, 1-2 líneas, margen superior 5.
- Foto única en el día: ancho completo 499 × 280 pt (4:3 recortada a 16:9 aprox.), radio 8. Número impar: la última queda a la izquierda (sin estirarla).
- Cada fila (2 fotos + pies) `wrap={false}`: nunca se parte entre páginas. Capacidad típica: 3 filas = 6 fotos por página.
- Peso: cada foto se reescala a ≤ 1200 px de ancho y JPEG calidad 80 **antes** de pasarla a react-pdf (informe de 12 fotos ≈ 2-3 MB). [Propuesta]
- Numeración de fotos continua en todo el informe (Foto 1…N), así el texto puede citarlas.

**Sección E — Cierre**
- Título "CIERRE" y texto 10.5 pt: frase de cierre estándar editable ("Agradecemos la confianza de {Cliente}. Quedamos atentos a cualquier consulta sobre este servicio.").
- Bloque de contacto/firma: línea de firma 160 pt, bajo ella nombre del responsable técnico 10 pt bold navy + cargo 9 pt gris, y a la derecha el logo 90 pt. Sin sección de pendientes ni nada interno.
- Línea de límites (9 pt gris, cursiva ausente en Helvetica → usar gris): "Este informe resume los trabajos realizados en las fechas indicadas." Es opcional.

### 2.3 Reglas de contenido del informe
- Excluir SIEMPRE: pendientes, responsables internos, notas internas. El generador recibe una lista blanca de campos (cliente, título, resumen, días, fotos, firma); nunca el objeto completo del proyecto.
- Lenguaje para cliente, sin jerga: "abrió 2 agujeros" se redacta "se realizaron 2 perforaciones en la viga para fijar la base".
- Sin emojis. Fechas largas en español ("viernes 6 de noviembre de 2026"); numerales con `toLocaleDateString('es-CR', ...)` según el formateador del proyecto (`formatDate`).

---

## 3. PDF 2 — PENDIENTES PARA EL PERSONAL (1 hoja)

**A4 vertical, UNA sola página** (si pasa de 14 pendientes abiertos, se reduce el factor `k` a 0.9 como hace la cotización con `buildStyles(k)`; si aun así no cabe, continúa en hoja 2 con el encabezado repetido y se avisa en pantalla "Son muchos pendientes: saldrán 2 hojas").
Sin portada, sin logo grande. Es una herramienta de trabajo, tipo hoja de campo.

- Márgenes 40 pt (como cotización); ancho útil 515 pt. Franja de marca superior 7 pt (72/28 naranja/azul).
- **Encabezado**: kicker "PENDIENTES · SOLO PERSONAL" 8.5 pt bold `#C2500F`, letter-spacing 2.2; título "Pendientes — {Cliente}: {Proyecto}" 18 pt bold navy (máx. 2 líneas); logo 72 pt a la derecha.
- **Franja de datos** (línea superior 0.75 pt `#EADFD6`, 3 columnas): Proyecto/fechas · Generado el (fecha y hora) · Pendientes abiertos "5 de 7". Etiqueta 7.5 pt bold gris + valor 10 pt bold navy.
- **Checklist** (tabla): cabecera de fila 22 pt alto, fondo `#202850`, texto blanco 8 pt bold, letter-spacing 0.8, radio superior 5 (la cotización usa naranja; aquí navy para distinguir una hoja interna de un documento comercial).
  | Col | Ancho | Contenido |
  |---|---|---|
  | Casilla | 36 pt | cuadrado 13×13 pt, borde 1.25 pt navy, radio 3; vacío = abierto; completado = relleno `#0070C0` con marca blanca |
  | Pendiente | 255 pt | texto 10.5 pt bold navy; 1-2 líneas; nota opcional 9 pt gris debajo |
  | Responsable | 120 pt | nombre 10 pt |
  | Fecha límite | 104 pt | "sáb 7 nov" 10 pt; vencida: texto `#B42318` + "(vencido)" |
  - Alto de fila mín. **34 pt** (cómodo para marcar a mano con lapicero), separador 0.75 pt `#EADFD6`, sin zebra. Columna casilla centrada; las demás alineadas a la izquierda; fechas con `tabular-nums`.
  - Orden: abiertos primero (por fecha límite asc.), luego completados en gris `#6B7686` y tachados (si no hay, se omiten; opción "incluir completados" desmarcada por defecto).
- **Línea de apoyo bajo la tabla**: 3 renglones vacíos con línea punteada 0.75 pt `#C9CFD8` y la etiqueta "Notas" 8 pt bold gris (espacio para escribir a mano), alto total 70 pt.
- **Pie**: izquierda "Uso interno · no entregar al cliente" 8 pt `#B42318` bold (ícono-candado no es necesario); derecha "Grupo AC · {fecha de generación}".
- Sin fotos. Sin resumen narrativo.

---

## 4. Tokens exactos (para implementar)

### 4.1 Color
| Token | HEX | Uso |
|---|---|---|
| `brand.orange` | `#F46B20` | barras, filetes, viñetas, decoración (no texto pequeño) |
| `brand.orangeText` | `#C2500F` | kicker y números sobre blanco (≈4.7:1, AA) |
| `brand.orangeTint` | `#FFF4EC` | caja de resumen |
| `brand.blue` | `#0070C0` | links, chips de fecha, casilla marcada (≈5.1:1 sobre blanco) |
| `brand.blueTint` | `#E6F1FA` | chip de fecha |
| `brand.navy` | `#202850` | títulos, valores fuertes, cabecera de tabla |
| `ink` | `#2B3342` | cuerpo |
| `muted` | `#6B7686` | etiquetas y metadatos (≈4.6:1 sobre blanco; mantener ≥ 8 pt) |
| `line` | `#EADFD6` | filetes y bordes |
| `danger` | `#B42318` | vencido (≈6.5:1) |
| `paper` | `#FFFFFF` | fondo de página |
Pantalla (oscura, existente): fondo/tarjetas = clases `.card`; chips y estados = tabla de §1.1; foco `#00c2ff`; texto secundario `#9FB0C4`.
Regla: 1 primario (azul/navy) + 1 acento (naranja) + neutros. Los 4 colores de estado solo existen en la pantalla.

### 4.2 Tipografía
| Rol | Pantalla (Inter) | PDF (Helvetica) |
|---|---|---|
| Título de página | 28 / 600 | 28 bold (portada) · 18 bold (pendientes) |
| Título de sección | 16 / 600 | 9 bold, mayúsculas, ls 1.8, `#C2500F` |
| Cuerpo | 15 / 400, lh 1.5 | 10.5, lh 1.5 |
| Metadato / chip | 12-13 / 400-600 | 8-9 |
| Etiqueta de campo | 12 / 600, mayúsculas, ls .06em | 7.5-8 bold, ls 1.2 |
| Número destacado | 22 / 600 `tabular-nums` | 22 bold |
Máx. 2 familias: Inter (pantalla) y Helvetica (PDF). Alineación izquierda siempre en párrafos.

### 4.3 Espaciado y radios
- Escala (múltiplos de 4): 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48.
- Pantalla: padding de tarjeta 20; gap de grilla 16; sangría de línea de tiempo 32; margen lateral 24 (escritorio) / 16 (móvil).
- Radios: tarjeta 16 (`radius.card`); miniaturas/inputs internos 8 (`radius.inner`); chips y botones pill 999; casilla 6 (pantalla) / 3 (PDF).
- PDF: márgenes 48 (informe) y 40 (pendientes); separación entre secciones 24; entre días 18; entre filas de fotos 14.

### 4.4 Galería
| Medio | Fotos por fila | Tamaño | Gap |
|---|---|---|---|
| Pantalla escritorio | 3 | ≥160×120 (4:3, cover) | 8 |
| Pantalla móvil | 2 | ancho/2 (4:3) | 8 |
| PDF informe | 2 | 243.5×182.6 pt (4:3, cover) | 12 h / 14 v |
| PDF, foto única | 1 | 499×280 pt | — |
Pie: pantalla 12/400 una línea; PDF "Foto N · texto" 8 bold + 9 regular. Fotos de ≤1200 px, JPEG q80.

### 4.5 Movimiento (de `tokens.json`)
Hover/pulsación 100 ms ease-out; chips 150 ms; toasts 240 ms; entrada de pantalla/tarjetas `spring-soft` ~470 ms **una sola vez**; botones `spring-bounce` ya existentes. Sin bucles. `prefers-reduced-motion`: fundido 100 ms.

### 4.6 Accesibilidad / touch
Targets ≥44×44 (casillas, menú ⋯, botones); separación ≥8; alt de cada foto = su pie de foto; estados siempre con texto/ícono además de color; contraste ≥4.5:1 (verificar chips pastel sobre `.card`: el punto más claro del degradado de la tarjeta es `#173052`).

---

## 5. Qué mejora respecto a la plantilla actual
- **[Observado]** La plantilla de informe (`plantilla_informe.docx`) es un documento Word genérico de portada + logo + header/footer; **[Inferido]** sin estructura para fotos con pie, sin tiempos ni resumen. No se pudo auditar su binario; los puntos abajo comparan contra ese uso típico y contra la cotización PDF.
- Resumen ejecutivo arriba (el cliente entiende en 10 s) en lugar de narrativa corrida.
- Tiempos explícitos (inicio, fin, días trabajados) en indicadores, no enterrados en texto.
- Fotos con numeración y pie, 2 por fila con tamaño fijo y sin partirse entre páginas.
- Un PDF generado desde datos (consistente, reproducible, sin pelear con Word) con marca de la cotización: mismo logo, franja 72/28 y colores.
- **Corrección de accesibilidad**: el texto pequeño naranja pasa a `#C2500F` (el `#F46B20` falla AA como texto).
- Separación estricta de audiencias: lista blanca de campos para el cliente; los pendientes viven en otro PDF marcado "Uso interno".
- Hoja de pendientes imprimible con casillas de 13 pt y filas de 34 pt para marcar a mano en campo.
- Pantalla coherente con AC Fluid (reutiliza `.card`, `.btn`, `.seg`), sin sistema paralelo.

---

## 6. Caso real aplicado (Postforming, vie 6 nov 2026) — contenido de ejemplo
- **Proyecto**: "Base metálica de cámara — Bodega". Cliente Postforming. Tipo 1 día, 6 nov 2026. Estado: Con pendientes.
- **Día 1** (redacción cliente): "Se ensambló la base metálica de la cámara de la bodega, orientada hacia el portón. El técnico Carlos realizó 2 perforaciones en la viga H para poder alojar la base. Al finalizar la jornada la base quedó instalada y asegurada con 2 tornillos."
- **Fotos** (4; el usuario indicó 3 descripciones, la cuarta no se describió: **pedir su pie de foto, no inventarlo**): Foto 1 "Técnico instalando desde la escalera"; Foto 2 "Cámara montada en la viga"; Foto 3 "Cámara con su soporte, vista de cerca"; Foto 4 "[pendiente de describir]".
- **Resumen ejecutivo** (editable): "Se instaló la base metálica para la cámara de la bodega de Postforming, dirigida al portón, con 2 perforaciones en la viga H y fijación provisional con 2 tornillos."
- **Tiempos**: Inicio 06/11/2026 · Fin 06/11/2026 · Días trabajados 1.
- **Pendientes (solo personal)**: "Completar la fijación con todos los tornillos de la base" (**[Inferido]** de "se dejó puesta con dos tornillos"; confirmar con Carlos antes de listarlo). Responsable y fecha: los define el usuario.
- Los datos reales no se hardcodean; esto es solo contenido de maqueta/pruebas.

## 7. Criterios de verificación para `verificador-qa`
1. Informe del ejemplo = portada + 1-2 hojas; 4 fotos en 2×2 sin cortes; logo visible; sin palabra "pendiente".
2. PDF de pendientes = 1 hoja A4 con casillas, responsable, fecha, marca "Uso interno".
3. Contraste de chips en pantalla ≥4.5:1; foco visible por teclado; botones ≥44 px.
4. Descarga con nombre correcto; spinner mientras genera; error accionable.
5. 20 fotos / 14 pendientes: sin texto desbordado ni filas partidas.
6. Medir en pantalla móvil 375 px: sin scroll horizontal.
