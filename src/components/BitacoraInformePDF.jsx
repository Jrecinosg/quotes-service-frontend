import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import logo from '../assets/logo.png';
import { formatLongDate, formatShortDate, formatNumericDate, toIsoDay } from '../utils/bitacora';

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

const PHOTO_W = 243.5;
const PHOTO_H = 182.6;
const FULL_W = 499;
const FULL_H = 280;

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
  coverData: { position: 'absolute', top: 640, left: 48, width: 499, flexDirection: 'row' },
  dataCell: { flex: 1, paddingRight: 12 },
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
  kpis: { flexDirection: 'row', marginTop: 16 },
  kpi: { width: 155, marginRight: 17 },
  kpiValue: { fontSize: 22, fontWeight: 'bold', color: NAVY },
  kpiLabel: { fontSize: 8, fontWeight: 'bold', color: MUTED, letterSpacing: 1.2, marginTop: 2 },

  row: { flexDirection: 'row', alignItems: 'center', height: 24, borderBottomWidth: 0.75, borderBottomColor: LINE },
  rowLabel: { width: 130, fontSize: 9, color: MUTED },
  rowValue: { fontSize: 10.5, fontWeight: 'bold', color: NAVY },
  timeline: { marginTop: 16, height: 30, position: 'relative' },
  timelineLine: { position: 'absolute', top: 4, left: 4, right: 4, height: 1.5, backgroundColor: BLUE },
  timelineDot: { position: 'absolute', top: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: BLUE },
  timelineLabel: { position: 'absolute', top: 14, width: 60, fontSize: 8, color: MUTED, textAlign: 'center' },

  dayBlock: { marginBottom: 18 },
  dayHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayChip: { backgroundColor: BLUE_TINT, borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  dayChipText: { fontSize: 9, fontWeight: 'bold', color: BLUE },
  dayCount: { fontSize: 8, color: MUTED },
  para: { fontSize: 10.5, lineHeight: 1.5, color: INK, marginBottom: 6 },
  bulletRow: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: ORANGE, marginTop: 6, marginRight: 8 },
  bulletText: { flex: 1, fontSize: 10.5, lineHeight: 1.5, color: INK },
  personnel: { fontSize: 9, color: MUTED, marginTop: 2 },
  photosTitle: { fontSize: 9, fontWeight: 'bold', color: ORANGE_TEXT, letterSpacing: 1.8, marginTop: 14, marginBottom: 8 },
  photoRow: { marginBottom: 14 },
  photoCell: { width: PHOTO_W, marginRight: 12 },
  photoCellLast: { width: PHOTO_W, marginRight: 0 },
  photo: { width: PHOTO_W, height: PHOTO_H, objectFit: 'cover', borderRadius: 8, borderWidth: 0.75, borderColor: LINE },
  photoFull: { width: FULL_W, height: FULL_H, objectFit: 'cover', borderRadius: 8, borderWidth: 0.75, borderColor: LINE },
  captionRow: { flexDirection: 'row', marginTop: 5 },
  captionNum: { fontSize: 8, fontWeight: 'bold', color: ORANGE_TEXT, marginRight: 4 },
  captionText: { flex: 1, fontSize: 9, color: INK, lineHeight: 1.3 },
  daySep: { borderBottomWidth: 0.75, borderBottomColor: LINE, marginTop: 4 },

  closing: { fontSize: 10.5, lineHeight: 1.5, color: INK },
  signRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40 },
  signLine: { width: 160, borderTopWidth: 0.75, borderTopColor: NAVY, paddingTop: 5 },
  signName: { fontSize: 10, fontWeight: 'bold', color: NAVY },
  signRole: { fontSize: 9, color: MUTED, marginTop: 1 },
  signLogo: { width: 56 },
  limits: { fontSize: 9, color: MUTED, marginTop: 18 },
});

// Texto -> párrafos; las líneas que empiezan con "- ", "* " o "• " son viñetas.
const renderBody = (body) => {
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
  return out;
};

const PhotoCell = ({ photo, full, last }) => (
  <View style={full ? { width: FULL_W } : last ? styles.photoCellLast : styles.photoCell} wrap={false}>
    <Image src={photo.src} style={full ? styles.photoFull : styles.photo} />
    <View style={styles.captionRow}>
      <Text style={styles.captionNum}>Foto {photo.number}{photo.caption ? ' ·' : ''}</Text>
      {photo.caption ? <Text style={styles.captionText}>{photo.caption}</Text> : null}
    </View>
  </View>
);

// El encabezado viaja dentro de la primera fila: nunca queda solo al final de una hoja.
const PhotoGrid = ({ photos, heading }) => {
  if (photos.length === 1) {
    return <View style={styles.photoRow} wrap={false}>{heading}<PhotoCell photo={photos[0]} full /></View>;
  }
  const rows = [];
  for (let i = 0; i < photos.length; i += 2) rows.push(photos.slice(i, i + 2));
  return rows.map((pair, idx) => (
    <View key={idx} style={styles.photoRow} wrap={false}>
      {idx === 0 ? heading : null}
      <View style={{ flexDirection: 'row' }}>
        {pair.map((p, j) => <PhotoCell key={p.number} photo={p} last={j === 1} />)}
      </View>
    </View>
  ));
};

/**
 * Informe final AL CLIENTE. Recibe una lista blanca de campos (nunca el proyecto completo):
 * NO existen pendientes ni notas internas en estos datos.
 * report = { clientName, title, summary, type, startDate, endDate, finished, issuedAt,
 *            personnel: [string], days: [{ date, body, photos: [{ number, src, caption }] }],
 *            closing? }
 */
export const BitacoraInformeDocument = ({ report }) => {
  const days = report.days || [];
  const total = days.length;
  const workedCount = new Set(days.map((d) => toIsoDay(d.date))).size;
  const firstDate = report.startDate || (days[0] && days[0].date);
  const lastDate = report.endDate || (days.length ? days[days.length - 1].date : null);
  const multi = report.type === 'VARIOS_DIAS';
  const closing = report.closing || `Agradecemos la confianza de ${report.clientName}. Quedamos atentos a cualquier consulta sobre este servicio.`;
  const dotDays = multi ? days.filter((d, i) => days.findIndex((x) => toIsoDay(x.date) === toIsoDay(d.date)) === i) : [];
  const showTimeline = multi && dotDays.length > 1 && dotDays.length <= 7;
  const personnel = report.personnel || [];

  return (
    <Document title={`Informe final - ${report.clientName}`} author="Grupo AC">
      {/* ---------- PORTADA ---------- */}
      <Page size="A4" style={styles.cover}>
        <View style={styles.coverShape} />
        <View style={styles.coverBar}><View style={styles.barOrange} /><View style={styles.barBlue} /></View>
        <Image src={logo} style={styles.coverLogo} />
        <View style={styles.coverTitleBlock}>
          <Text style={styles.kicker}>INFORME FINAL DE SERVICIO</Text>
          <Text style={styles.coverTitle}>{report.title}</Text>
          <View style={styles.rule} />
          <Text style={styles.coverClient}>{report.clientName}</Text>
          <Text style={styles.coverDate}>Emitido el {formatLongDate(report.issuedAt).toLowerCase()}</Text>
        </View>
        <View style={styles.coverData}>
          <View style={styles.dataCell}><Text style={styles.dataLabel}>CLIENTE</Text><Text style={styles.dataValue}>{report.clientName}</Text></View>
          <View style={styles.dataCell}>
            <Text style={styles.dataLabel}>FECHAS DEL SERVICIO</Text>
            <Text style={styles.dataValue}>
              {toIsoDay(firstDate) === toIsoDay(lastDate) || !lastDate ? formatNumericDate(firstDate) : `${formatNumericDate(firstDate)} al ${formatNumericDate(lastDate)}`}
            </Text>
          </View>
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
          <Text style={styles.headerText}>Informe final · {report.clientName}</Text>
        </View>
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>Grupo AC · Tel. 2234-7254</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
        <View style={styles.footerBar} fixed><View style={styles.barOrange} /><View style={styles.barBlue} /></View>

        {/* A. Resumen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>RESUMEN EJECUTIVO</Text>
          {report.summary ? (
            <View style={styles.summaryBox} wrap={false}><Text style={styles.summaryText}>{report.summary}</Text></View>
          ) : null}
          <View style={styles.kpis} wrap={false}>
            <View style={styles.kpi}><Text style={styles.kpiValue}>{formatNumericDate(firstDate)}</Text><Text style={styles.kpiLabel}>INICIO</Text></View>
            <View style={styles.kpi}><Text style={styles.kpiValue}>{formatNumericDate(lastDate || firstDate)}</Text><Text style={styles.kpiLabel}>FIN</Text></View>
            <View style={styles.kpi}><Text style={styles.kpiValue}>{workedCount}</Text><Text style={styles.kpiLabel}>DÍAS TRABAJADOS</Text></View>
          </View>
        </View>

        {/* B. Tiempos */}
        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>TIEMPOS</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Fecha de inicio</Text><Text style={styles.rowValue}>{formatLongDate(firstDate)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Fecha de fin</Text><Text style={styles.rowValue}>{formatLongDate(lastDate || firstDate)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Días trabajados</Text><Text style={styles.rowValue}>{workedCount}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Tipo de servicio</Text><Text style={styles.rowValue}>{multi ? 'Varios días' : '1 día'}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Estado final</Text><Text style={styles.rowValue}>{report.finished ? 'Finalizado' : 'En curso'}</Text></View>
          {showTimeline ? (
            <View style={styles.timeline}>
              <View style={styles.timelineLine} />
              {dotDays.map((d, i) => {
                const x = dotDays.length === 1 ? 0 : (i * (499 - 8)) / (dotDays.length - 1);
                return (
                  <View key={i}>
                    <View style={[styles.timelineDot, { left: x }]} />
                    <Text style={[styles.timelineLabel, { left: x - 26 }]}>{formatShortDate(d.date, false)}</Text>
                  </View>
                );
              })}
            </View>
          ) : null}
        </View>

        {/* C + D. Trabajo por día, con las fotos de ese día justo después */}
        <Text style={styles.sectionTitle}>TRABAJO REALIZADO POR DÍA</Text>
        {days.map((d, idx) => (
          <View key={idx} style={styles.dayBlock}>
            <View wrap={false}>
              <View style={styles.dayHead}>
                <View style={styles.dayChip}><Text style={styles.dayChipText}>{formatLongDate(d.date)}</Text></View>
                <Text style={styles.dayCount}>Día {idx + 1} de {total}</Text>
              </View>
            </View>
            {renderBody(d.body)}
            {d.photos && d.photos.length ? (
              <View>
                <PhotoGrid photos={d.photos} heading={<Text style={styles.photosTitle}>REGISTRO FOTOGRÁFICO · {formatShortDate(d.date)}</Text>} />
              </View>
            ) : null}
            {idx < total - 1 ? <View style={styles.daySep} /> : null}
          </View>
        ))}
        {days.length === 0 ? <Text style={styles.para}>Aún no hay trabajos registrados.</Text> : null}

        {/* E. Cierre */}
        <View style={{ marginTop: 6 }} wrap={false}>
          <Text style={styles.sectionTitle}>CIERRE</Text>
          <Text style={styles.closing}>{closing}</Text>
          <View style={styles.signRow}>
            <View style={styles.signLine}>
              <Text style={styles.signName}>Grupo AC</Text>
              <Text style={styles.signRole}>Tecnoseguridad e Informática</Text>
            </View>
            <Image src={logo} style={styles.signLogo} />
          </View>
          <Text style={styles.limits}>Este informe resume los trabajos realizados en las fechas indicadas.</Text>
        </View>
      </Page>
    </Document>
  );
};
