import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import logo from '../assets/logo.png';
import { formatDateNoWeekday } from '../utils/bitacora';
import { VARIANTS } from '../utils/bitacoraReport';

Font.registerHyphenationCallback((word) => [word]);

// Marca Grupo AC (misma que la cotización). Texto pequeño naranja = ORANGE_TEXT (contraste AA sobre blanco).
const ORANGE = '#F46B20';
const ORANGE_TEXT = '#C2500F';
const ORANGE_TINT = '#FFF4EC';
const BLUE = '#0070C0';
const BLUE_TINT = '#E6F1FA';
const NAVY = '#202850';
const INK = '#2B3342';
const MUTED = '#6B7686';
const LINE = '#EADFD6';

const styles = StyleSheet.create({
  // --- Portada ---
  cover: { fontFamily: 'Helvetica', color: INK, backgroundColor: '#FFFFFF' },
  coverBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 10, flexDirection: 'row' },
  barOrange: { width: '72%', backgroundColor: ORANGE },
  barBlue: { width: '28%', backgroundColor: BLUE },
  coverShape: { position: 'absolute', right: -130, bottom: -130, width: 520, height: 520, borderRadius: 260, backgroundColor: BLUE, opacity: 0.06 },
  coverLogo: { position: 'absolute', top: 56, left: 48, width: 150 },
  coverTitleBlock: { position: 'absolute', top: 250, left: 48, width: 440 },
  kicker: { fontSize: 10, fontWeight: 'bold', color: ORANGE_TEXT, letterSpacing: 2.5 },
  coverTitle: { fontSize: 28, fontWeight: 'bold', color: NAVY, lineHeight: 1.2, marginTop: 10 },
  rule: { width: 48, height: 4, borderRadius: 2, backgroundColor: ORANGE, marginVertical: 16 },
  coverClient: { fontSize: 16, color: INK },
  coverDate: { fontSize: 11, color: MUTED, marginTop: 6 },
  coverData: { position: 'absolute', top: 640, left: 48, width: 499, flexDirection: 'row', flexWrap: 'wrap' },
  dataCell: { flex: 1, paddingRight: 12 },
  dataCellWrap: { width: '33.33%', paddingRight: 12, marginBottom: 14 },
  dataLabel: { fontSize: 8, fontWeight: 'bold', color: MUTED, letterSpacing: 1.2 },
  dataValue: { fontSize: 11, fontWeight: 'bold', color: NAVY, marginTop: 3, lineHeight: 1.3 },
  coverFooter: { position: 'absolute', bottom: 40, left: 48, right: 48, borderTopWidth: 0.75, borderTopColor: LINE, paddingTop: 8 },
  coverFooterText: { fontSize: 9, color: MUTED },

  // --- Contenido ---
  page: { fontFamily: 'Helvetica', fontSize: 10.5, color: INK, paddingTop: 80, paddingBottom: 64, paddingHorizontal: 48 },
  header: { position: 'absolute', top: 18, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 0.75, borderBottomColor: LINE, paddingBottom: 6 },
  headerLogo: { height: 42, width: 42, objectFit: 'contain' },
  headerText: { fontSize: 8, color: MUTED },
  footer: { position: 'absolute', bottom: 22, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 8, color: MUTED },
  footerBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, flexDirection: 'row' },

  sectionTitle: { fontSize: 9, fontWeight: 'bold', color: ORANGE_TEXT, letterSpacing: 1.8, marginBottom: 8 },
  section: { marginBottom: 24 },
  summaryBox: { backgroundColor: ORANGE_TINT, borderLeftWidth: 3, borderLeftColor: ORANGE, borderTopRightRadius: 6, borderBottomRightRadius: 6, paddingVertical: 12, paddingHorizontal: 16 },
  summaryText: { fontSize: 11, lineHeight: 1.5, color: INK },


  para: { fontSize: 10.5, lineHeight: 1.5, color: INK, marginBottom: 6 },
  bulletRow: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: ORANGE, marginTop: 6, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 10.5, lineHeight: 1.5, color: INK },
  photosTitle: { fontSize: 9, fontWeight: 'bold', color: ORANGE_TEXT, letterSpacing: 1.8, marginTop: 14, marginBottom: 8 },
  photoRow: { marginBottom: 14 },
  stagePill: { position: 'absolute', top: 6, left: 6, backgroundColor: '#FFFFFF', borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7 },
  stageText: { fontSize: 7, fontWeight: 'bold', color: BLUE, letterSpacing: 0.8 },
  coverQuote: { fontSize: 11, color: MUTED, marginTop: 4 },
  captionRow: { flexDirection: 'row', marginTop: 5 },
  captionNum: { fontSize: 8, fontWeight: 'bold', color: ORANGE_TEXT, marginRight: 4 },
  captionText: { flex: 1, fontSize: 9, color: INK, lineHeight: 1.3 },

  closing: { fontSize: 10.5, lineHeight: 1.5, color: INK },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 30 },
  signLine: { minWidth: 160, maxWidth: 300, borderTopWidth: 0.75, borderTopColor: NAVY, paddingTop: 5 },
  signName: { fontSize: 10, fontWeight: 'bold', color: NAVY },
  signRole: { fontSize: 9, color: MUTED, marginTop: 1 },
  signLogo: { width: 56 },
  limits: { fontSize: 9, color: MUTED, marginTop: 12 },
});

// Texto -> párrafos; las líneas que empiezan con "- ", "* " o "• " son viñetas.
const renderBody = (body, tail) => {
  const lines = String(body || '').split(/\r?\n/);
  const out = [];
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const m = line.match(/^[-*•]\s+(.*)$/);
    if (m) {
      out.push(
        <View key={i} style={styles.bulletRow} wrap={false}>
          <View style={styles.bulletDot} />
          <Text style={styles.bulletText}>{m[1]}</Text>
        </View>
      );
    } else {
      out.push(<Text key={i} style={styles.para}>{line}</Text>);
    }
  });
  // El cierre viaja pegado al último párrafo: nunca queda solo en una hoja casi vacía.
  if (tail) {
    const last = out.pop();
    out.push(<View key="tail" wrap={false}>{last || null}{tail}</View>);
  }
  return out;
};

// Galería "justificada": cada foto conserva su proporción real (nunca se recorta). Las fotos de una fila
// comparten altura y la fila ocupa todo el ancho útil: 2 horizontales 4:3 = igual que antes; 3 verticales
// 3:4 por fila; mezcladas se acomodan solas. La última fila no se estira de más (tope de altura).
const GALLERY_W = 499;
const GAP = 12;
const ROW_MAX_H = 215;
const LAST_ROW_MAX_H = 260;

const aspectOf = (p) => (p.width > 0 && p.height > 0 ? Math.min(Math.max(p.width / p.height, 0.4), 2.5) : 4 / 3);
const rowHeight = (row) => (GALLERY_W - GAP * (row.length - 1)) / row.reduce((n, p) => n + aspectOf(p), 0);

const buildRows = (photos) => {
  const rows = [];
  let cur = [];
  photos.forEach((p) => {
    cur.push(p);
    if (rowHeight(cur) <= ROW_MAX_H) { rows.push(cur); cur = []; }
  });
  if (cur.length) rows.push(cur);
  return rows.map((row, i) => {
    const h = Math.min(rowHeight(row), i === rows.length - 1 ? LAST_ROW_MAX_H : ROW_MAX_H * 1.15);
    return { row, h };
  });
};

const STAGE_LABEL = { ANTES: 'ANTES', DURANTE: 'DURANTE', DESPUES: 'DESPUÉS' };

const PhotoCell = ({ photo, h, last }) => {
  const w = h * aspectOf(photo);
  return (
    <View style={{ width: w, marginRight: last ? 0 : GAP }} wrap={false}>
      <View style={{ position: 'relative', width: w, height: h }}>
        <Image src={photo.src} style={{ width: w, height: h, objectFit: 'cover', borderRadius: 8, borderWidth: 0.75, borderColor: LINE }} />
        {STAGE_LABEL[photo.stage] ? <View style={styles.stagePill}><Text style={styles.stageText}>{STAGE_LABEL[photo.stage]}</Text></View> : null}
      </View>
      <View style={styles.captionRow}>
        <Text style={styles.captionNum}>Foto {photo.number}{photo.caption ? ' ·' : ''}</Text>
        {photo.caption ? <Text style={styles.captionText}>{photo.caption}</Text> : null}
      </View>
    </View>
  );
};

// El encabezado viaja dentro de la primera fila: nunca queda solo al final de una hoja.
const PhotoGrid = ({ photos, heading, tail }) =>
  buildRows(photos).map(({ row, h }, idx, all) => (
    <View key={idx} style={styles.photoRow} wrap={false}>
      {idx === 0 ? heading : null}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        {row.map((p, j) => <PhotoCell key={p.number} photo={p} h={h} last={j === row.length - 1} />)}
      </View>
      {idx === all.length - 1 ? tail : null}
    </View>
  ));

/**
 * INFORME AL CLIENTE (variantes dia | avance | final, mismo diseño). Recibe una lista blanca ya armada por
 * assembleInformeReport: NO existen fechas del servicio, horas, tiempos ni pendientes en estos datos.
 * La única fecha es `issuedOn` ("Fecha del informe").
 * report = { variant, clientName, title, quotationNumber?, summary?, technicianName?, issuedOn, texts: [string],
 *            photos: [{ number, src, width, height, caption, stage? }], closing? }
 */
export const BitacoraInformeDocument = ({ report }) => {
  const variant = VARIANTS[report.variant] ? report.variant : 'final';
  const { kicker, label } = VARIANTS[variant];
  const texts = report.texts || [];
  const photos = report.photos || [];
  const technician = String(report.technicianName || '').trim();
  const personnel = report.personnel || [];
  const issued = formatDateNoWeekday(`${report.issuedOn}T12:00:00.000Z`);
  const who = String(report.clientName).replace(/[.\s]+$/, '');
  const closing = report.closing || (variant === 'avance'
    ? `Agradecemos la confianza de ${who}. El servicio continúa y compartiremos el siguiente informe cuando haya nuevos avances.`
    : `Agradecemos la confianza de ${who}. Quedamos atentos a cualquier consulta sobre este servicio.`);

  const closingBlock = (
    <View style={{ marginTop: 16 }} wrap={false}>
      <Text style={styles.sectionTitle}>CIERRE</Text>
      <Text style={styles.closing}>{closing}</Text>
      <View style={styles.signRow}>
        <View style={styles.signLine}>
          <Text style={styles.signName}>{technician || 'Grupo AC'}</Text>
          <Text style={styles.signRole}>{technician ? 'Grupo AC · Tecnoseguridad e Informática' : 'Tecnoseguridad e Informática'}</Text>
        </View>
        <Image src={logo} style={styles.signLogo} />
      </View>
    </View>
  );

  return (
    <Document title={`${label} - ${report.clientName}`} author="Grupo AC">
      {/* ---------- PORTADA ---------- */}
      <Page size="A4" style={styles.cover}>
        <View style={styles.coverShape} />
        <View style={styles.coverBar}><View style={styles.barOrange} /><View style={styles.barBlue} /></View>
        <Image src={logo} style={styles.coverLogo} />
        <View style={styles.coverTitleBlock}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.coverTitle}>{report.title}</Text>
          {report.quotationNumber ? <Text style={styles.coverQuote}>Cotización {report.quotationNumber}</Text> : null}
          <View style={styles.rule} />
          <Text style={styles.coverClient}>{report.clientName}</Text>
          <Text style={styles.coverDate}>Fecha del informe: {issued}</Text>
        </View>
        <View style={styles.coverData}>
          <View style={styles.dataCell}><Text style={styles.dataLabel}>CLIENTE</Text><Text style={styles.dataValue}>{report.clientName}</Text></View>
          {technician ? (
            <View style={styles.dataCell}><Text style={styles.dataLabel}>RESPONSABLE TÉCNICO</Text><Text style={styles.dataValue}>{technician}</Text></View>
          ) : null}
          {personnel.length ? (
            <View style={styles.dataCell}><Text style={styles.dataLabel}>PERSONAL QUE PARTICIPÓ</Text><Text style={styles.dataValue}>{personnel.join(', ')}</Text></View>
          ) : null}
        </View>
        <View style={styles.coverFooter}>
          <Text style={styles.coverFooterText}>Grupo AC · Tecnoseguridad e Informática  |  Avenida Hincapié 3-49 zona 13  |  Tel. 2234-7254</Text>
        </View>
      </Page>

      {/* ---------- CONTENIDO ---------- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Image src={logo} style={styles.headerLogo} />
          <Text style={styles.headerText}>{label} · {report.clientName}</Text>
        </View>
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Grupo AC · Tel. 2234-7254</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
        <View style={styles.footerBar} fixed><View style={styles.barOrange} /><View style={styles.barBlue} /></View>

        {report.summary ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RESUMEN</Text>
            <View style={styles.summaryBox} wrap={false}><Text style={styles.summaryText}>{report.summary}</Text></View>
          </View>
        ) : null}

        {/* Un solo relato continuo: sin fechas ni encabezados de día */}
        <View minPresenceAhead={70} wrap={false}><Text style={styles.sectionTitle}>TRABAJOS REALIZADOS</Text></View>
        {texts.length === 0 ? <Text style={styles.para}>Aún no hay trabajos registrados.</Text> : null}
        {texts.map((t, i) => (
          <View key={i} style={{ marginBottom: 6 }}>{renderBody(t, !photos.length && i === texts.length - 1 ? closingBlock : null)}</View>
        ))}

        {photos.length ? (
          <PhotoGrid photos={photos} heading={<Text style={styles.photosTitle}>REGISTRO FOTOGRÁFICO</Text>} tail={closingBlock} />
        ) : null}
        {texts.length === 0 && !photos.length ? closingBlock : null}
      </Page>
    </Document>
  );
};
