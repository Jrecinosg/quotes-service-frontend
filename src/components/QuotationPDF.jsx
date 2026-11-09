import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import logo from '../assets/logo.png';
import { formatQuotationId, formatCurrency, formatDate } from '../utils/formatters';

// Sin cortar palabras con guion al final de línea (se veía desordenado en descripciones largas)
Font.registerHyphenationCallback((word) => [word]);

// Colores tomados del logo de Grupo AC (se respetan los que ya usaba el PDF: naranja y azul).
const ORANGE = '#F46B20';
const BLUE = '#0070C0';
const NAVY = '#202850';   // azul oscuro del logo: texto fuerte
const INK = '#2B3342';
const MUTED = '#6B7686';
const LINE = '#EADFD6';   // línea fina cálida (naranja muy suave)
const ZEBRA = '#FCF8F4';

// k = factor de compactación (1 = normal). Se baja solo cuando la cotización no cabe en una hoja.
const buildStyles = (k) => {
  const s = (n) => Math.round(n * k * 100) / 100;
  return StyleSheet.create({
  page: {
    paddingTop: s(30),
    paddingBottom: Math.max(48, s(56)),
    paddingHorizontal: s(40),
    fontSize: s(10),
    fontFamily: 'Helvetica',
    color: INK,
  },

  // --- Franja superior de marca (naranja + azul del logo) ---
  accentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 7, flexDirection: 'row' },
  accentOrange: { width: '72%', backgroundColor: ORANGE },
  accentBlue: { width: '28%', backgroundColor: BLUE },

  // --- ENCABEZADO ---
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' },
  titleKicker: { fontSize: s(8.5), fontWeight: 'bold', color: ORANGE, letterSpacing: s(2.2) },
  titleNumber: { fontSize: s(22), fontWeight: 'bold', color: NAVY, marginTop: s(1) },
  logoSection: { width: 90, alignItems: 'flex-end', marginTop: s(-4) },

  infoGrid: {
    marginTop: s(8),
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 0.75,
    borderTopColor: LINE,
    paddingTop: s(8),
  },
  infoCell: { width: '25%', marginBottom: s(6), paddingRight: s(10) },
  infoCellWide: { width: '50%', marginBottom: s(6), paddingRight: s(10) },
  infoCellFull: { width: '100%', marginBottom: s(6), paddingRight: s(12) },
  infoLabel: { fontSize: s(7.5), fontWeight: 'bold', color: MUTED, letterSpacing: s(1.2) },
  infoValue: { fontSize: s(10.5), fontWeight: 'bold', color: NAVY, marginTop: s(2) },

  // --- DESCRIPCIÓN DEL PROYECTO (solo si se ingresó) ---
  projectBox: {
    marginTop: s(4),
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
    backgroundColor: '#FFF4EC',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    paddingVertical: s(7),
    paddingHorizontal: s(11),
  },
  projectTitle: { fontSize: s(8), fontWeight: 'bold', color: ORANGE, letterSpacing: s(1.2), marginBottom: s(3) },
  projectText: { fontSize: s(9), lineHeight: 1.45, color: INK },

  // --- TABLA ---
  table: { marginTop: s(14), width: '100%' },
  tableHeader: {
    marginTop: s(14),
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE,
    height: s(26),
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  th: { color: 'white', fontSize: s(8), fontWeight: 'bold', letterSpacing: s(0.8) },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: s(26),
    borderBottomWidth: 0.75,
    borderBottomColor: LINE,
  },
  rowAlt: { backgroundColor: ZEBRA },

  // anchos de columna (Cant, Descripción, P.Lista, %Desc, P.Oferta, Total)
  colCant: { width: '7%', justifyContent: 'center', alignItems: 'center' },
  colDesc: { width: '43%', paddingVertical: s(6), paddingHorizontal: s(8), justifyContent: 'center' },
  colLista: { width: '14%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: s(8) },
  colDescPct: { width: '8%', justifyContent: 'center', alignItems: 'center' },
  colUni: { width: '14%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: s(8) },
  colTot: { width: '14%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: s(8) },

  cellText: { fontSize: s(9.5) },
  cellStrong: { fontSize: s(9.5), fontWeight: 'bold', color: NAVY },
  discountText: { fontSize: s(8.5), color: ORANGE, fontWeight: 'bold' },
  colDescrip: { fontSize: s(9), lineHeight: 1.4 },
  descTitle: { fontSize: s(9.5), lineHeight: 1.35, fontWeight: 'bold', color: NAVY, marginBottom: s(3) },
  bulletRow: { flexDirection: 'row', marginTop: s(2) },
  bulletDot: { width: 10, fontSize: s(9), lineHeight: 1.4, color: ORANGE, fontWeight: 'bold' },
  bulletText: { flex: 1, fontSize: s(9), lineHeight: 1.4, color: INK },

  // --- TOTALES ---
  totalsWrap: { width: '100%', marginTop: s(14), flexDirection: 'row', justifyContent: 'flex-end' },
  totalsCard: { width: '46%', borderWidth: 0.75, borderColor: LINE, borderRadius: 6, paddingTop: s(8), paddingHorizontal: s(12), paddingBottom: s(0), overflow: 'hidden' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: s(6) },
  totalsLabel: { fontSize: s(9.5), color: MUTED },
  totalsValue: { fontSize: s(9.5), fontWeight: 'bold', color: INK },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ORANGE,
    marginHorizontal: -12,
    paddingHorizontal: s(12),
    paddingVertical: s(9),
    marginTop: s(2),
  },
  totalBarLabel: { color: 'white', fontSize: s(10), fontWeight: 'bold', letterSpacing: s(1.5) },
  totalBarValue: { color: 'white', fontSize: s(14), fontWeight: 'bold' },

  // --- CONDICIONES ---
  conditions: {
    marginTop: s(16),
    backgroundColor: '#F4F8FC',
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    paddingVertical: s(9),
    paddingHorizontal: s(12),
  },
  condRow: { flexDirection: 'row', marginBottom: s(4), alignItems: 'flex-start' },
  condLabel: { width: 92, fontSize: s(8), fontWeight: 'bold', color: BLUE, letterSpacing: s(0.8), paddingTop: s(1.5) },
  condValue: { flex: 1, fontSize: s(10), color: INK },
  observations: { marginTop: s(8), fontSize: s(8.5), lineHeight: 1.45, color: MUTED },

  // --- PIE FIJO ---
  footerFixed: {
    position: 'absolute',
    bottom: 26,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.75,
    borderTopColor: LINE,
    paddingTop: 8,
  },
  footerText: { fontSize: 8, color: MUTED },
  footerBrand: { fontSize: 8, color: ORANGE, fontWeight: 'bold' },
});
};

// ---- Ajuste automático a UNA hoja ------------------------------------------------
// Estima la altura que ocupará la cotización (A4 = 841.89 pt) para cada nivel de
// compactación y usa el menos compacto que quepa. Si ni el más compacto cabe (muchas
// líneas), se deja fluir a varias páginas como antes. Solo cambia el tamaño: nunca los datos.
const PAGE_H = 841.89;
const DENSITY_LEVELS = [1, 0.94, 0.88, 0.82, 0.76, 0.7];
const SAFETY = 14; // margen por si la estimación se queda corta

// Líneas que ocupa un texto en un ancho dado (Helvetica ≈ 0.5 × tamaño de fuente por carácter)
const linesFor = (text, widthPt, fontPt) => {
  const perLine = Math.max(8, Math.floor(widthPt / (fontPt * 0.5)));
  return String(text || '').split('\n').reduce((n, para) => {
    let lines = 1, used = 0;
    para.split(/\s+/).filter(Boolean).forEach((w) => {
      const len = w.length + (used ? 1 : 0);
      if (used + len > perLine && used > 0) { lines += 1; used = w.length; } else used += len;
    });
    return n + lines;
  }, 0);
};

const estimateHeight = (q, k) => {
  const CONTENT_W = 595.28 - 80; // ancho útil (padding 40 + 40)
  const descW = CONTENT_W * 0.43 - 16 * k;
  let h = 196 * k; // margen superior + encabezado + datos del cliente (medido en el PDF real)
  const pd = q.projectDescription && String(q.projectDescription).trim();
  if (pd) h += 4 * k + 14 * k + 11 * k + 3 * k + linesFor(pd, CONTENT_W - 28 * k, 9 * k) * 9 * k * 1.45;
  h += 14 * k + 26 * k; // cabecera de la tabla
  (q.items || []).forEach((it) => {
    const parts = String(it.description || '').split(/\s*•\s*/).map((t) => t.trim()).filter(Boolean);
    let textH;
    if (parts.length <= 1) textH = linesFor(parts[0], descW, 9 * k) * 9 * k * 1.4;
    else textH = linesFor(parts[0], descW, 9.5 * k) * 9.5 * k * 1.35 + 3 * k
      + parts.slice(1).reduce((a, b) => a + 2 * k + linesFor(b, descW - 10 * k, 9 * k) * 9 * k * 1.4, 0);
    h += Math.max(26 * k, textH + 12 * k) + 0.75;
  });
  h += 14 * k + 8 * k + 2 * (9.5 * k + 6 * k) + 2 * k + 18 * k + 14 * k * 1.2; // totales
  const condW = CONTENT_W - 24 * k - 92;
  h += 16 * k + 18 * k;
  [q.warranty, q.deliveryTime, q.paymentMethod, q.validity, q.elaboratedBy].forEach((t) => {
    h += Math.max(1, linesFor(t, condW, 10 * k)) * 10 * k * 1.25 + 4 * k;
  });
  if (q.observations) h += 8 * k + linesFor(q.observations, CONTENT_W - 24 * k, 8.5 * k) * 8.5 * k * 1.45;
  return h;
};

// Devuelve el factor de compactación (1 = diseño normal) para que quepa en una hoja
const pickDensity = (q) => {
  for (const k of DENSITY_LEVELS) {
    if (estimateHeight(q, k) + SAFETY <= PAGE_H - Math.max(48, 56 * k)) return k;
  }
  return DENSITY_LEVELS[DENSITY_LEVELS.length - 1];
};

// Las descripciones largas traen sus funciones separadas con "•": la primera frase
// va como título y cada viñeta en su propia línea -mucho más fácil de leer que un
// solo párrafo corrido.
const DescriptionBlock = ({ text, styles }) => {
  const parts = String(text || '').split(/\s*•\s*/).map((t) => t.trim()).filter(Boolean);
  if (parts.length <= 1) return <Text style={styles.colDescrip}>{parts[0] || ''}</Text>;
  const [title, ...bullets] = parts;
  return (
    <View>
      <Text style={styles.descTitle}>{title}</Text>
      {bullets.map((b, i) => (
        <View style={styles.bulletRow} key={i}>
          <Text style={styles.bulletDot}>•</Text>
          <Text style={styles.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
};

const InfoCell = ({ label, value, full, wide, styles }) => (
  <View style={full ? styles.infoCellFull : wide ? styles.infoCellWide : styles.infoCell}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '-'}</Text>
  </View>
);

export const QuotationDocument = ({ quotation }) => {
  const { client, items, projectDescription, subtotal, tax, total, correlativo, createdAt, elaboratedBy, validity } = quotation;

  const density = pickDensity(quotation);
  const styles = buildStyles(density);

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* --- FRANJA DE MARCA (se repite en cada página) --- */}
        <View style={styles.accentBar} fixed>
          <View style={styles.accentOrange} />
          <View style={styles.accentBlue} />
        </View>

        {/* --- ENCABEZADO QUE SE REPITE --- */}
        <View fixed style={{ marginBottom: 6 }}>
          <View style={styles.headerContainer}>
            <View>
              <Text style={styles.titleKicker}>COTIZACIÓN</Text>
              <Text style={styles.titleNumber}>{formatQuotationId(correlativo)}</Text>
            </View>
            <View style={styles.logoSection}>
              <Image src={logo} style={{ width: 80 }} />
            </View>
          </View>

          <View style={styles.infoGrid}>
            <InfoCell styles={styles} label="CLIENTE" value={client?.name} wide />
            <InfoCell styles={styles} label="FECHA" value={formatDate(createdAt)} />
            <InfoCell styles={styles} label="NIT" value={client?.taxId} />
            <InfoCell styles={styles} label="DIRECCIÓN" value={client?.address} full />
          </View>
        </View>

        {/* --- DESCRIPCIÓN DEL PROYECTO (solo si existe) --- */}
        {projectDescription && String(projectDescription).trim() && (
          <View style={styles.projectBox}>
            <Text style={styles.projectTitle}>DESCRIPCIÓN DEL PROYECTO</Text>
            <Text style={styles.projectText}>{String(projectDescription).trim()}</Text>
          </View>
        )}

        {/* --- TABLA --- */}
        <>
          <View style={styles.tableHeader} fixed>
            <View style={styles.colCant}><Text style={styles.th}>CANT.</Text></View>
            <View style={[styles.colDesc, { paddingVertical: 0 }]}><Text style={styles.th}>DESCRIPCIÓN</Text></View>
            <View style={styles.colLista}><Text style={styles.th}>P. LISTA</Text></View>
            <View style={styles.colDescPct}><Text style={styles.th}>% DESC.</Text></View>
            <View style={styles.colUni}><Text style={styles.th}>P. OFERTA</Text></View>
            <View style={styles.colTot}><Text style={styles.th}>P. TOTAL</Text></View>
          </View>

          {items.map((item, i) => {
            const listPrice = Number(item.listPrice) || 0;
            const discount = Number(item.discountPercent) || 0;
            const hasDiscount = discount > 0;
            const finalUnitPrice = listPrice * (1 - discount / 100);

            return (
              <View style={[styles.tableRow, i % 2 === 1 ? styles.rowAlt : null]} key={i} wrap={false} minPresenceAhead={i === items.length - 1 ? Math.round(290 * density) : 0}>
                <View style={styles.colCant}>
                  <Text style={styles.cellStrong}>{item.quantity}</Text>
                </View>

                <View style={styles.colDesc}>
                  <DescriptionBlock text={item.description} styles={styles} />
                </View>

                <View style={styles.colLista}>
                  <Text style={styles.cellText}>{formatCurrency(listPrice)}</Text>
                </View>

                <View style={styles.colDescPct}>
                  <Text style={hasDiscount ? styles.discountText : styles.cellText}>{hasDiscount ? `-${discount}%` : '-'}</Text>
                </View>

                {/* Precio con el descuento ya aplicado */}
                <View style={styles.colUni}>
                  <Text style={styles.cellText}>{formatCurrency(finalUnitPrice)}</Text>
                </View>

                <View style={styles.colTot}>
                  <Text style={styles.cellStrong}>{formatCurrency(item.subtotalItem)}</Text>
                </View>
              </View>
            );
          })}
        </>

        {/* --- TOTALES --- */}
        <View wrap={false} style={styles.totalsWrap}>
          <View style={styles.totalsCard}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{formatCurrency(subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>IVA (12%)</Text>
              <Text style={styles.totalsValue}>{formatCurrency(tax)}</Text>
            </View>
            <View style={styles.totalBar}>
              <Text style={styles.totalBarLabel}>TOTAL</Text>
              <Text style={styles.totalBarValue}>{formatCurrency(total)}</Text>
            </View>
          </View>
        </View>

        {/* --- CONDICIONES --- */}
        <View style={styles.conditions} wrap={false}>
          <View style={styles.condRow}><Text style={styles.condLabel}>GARANTÍA</Text><Text style={styles.condValue}>{quotation.warranty}</Text></View>
          <View style={styles.condRow}><Text style={styles.condLabel}>ENTREGA</Text><Text style={styles.condValue}>{quotation.deliveryTime}</Text></View>
          <View style={styles.condRow}><Text style={styles.condLabel}>FORMA DE PAGO</Text><Text style={styles.condValue}>{quotation.paymentMethod}</Text></View>
          <View style={styles.condRow}><Text style={styles.condLabel}>VALIDEZ</Text><Text style={styles.condValue}>{validity}</Text></View>
          <View style={styles.condRow}><Text style={styles.condLabel}>ELABORADO</Text><Text style={styles.condValue}>{elaboratedBy}</Text></View>
          {quotation.observations ? <Text style={styles.observations}>{quotation.observations}</Text> : null}
        </View>

        {/* --- PIE --- */}
        <View style={styles.footerFixed} fixed>
          <Text style={styles.footerBrand}>Grupo AC · Tecnoseguridad e Informática</Text>
          <Text style={styles.footerText}>Avenida Hincapié 3-49 zona 13 | Tel. 2234-7254</Text>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  );
};
