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

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: INK,
  },

  // --- Franja superior de marca (naranja + azul del logo) ---
  accentBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 7, flexDirection: 'row' },
  accentOrange: { width: '72%', backgroundColor: ORANGE },
  accentBlue: { width: '28%', backgroundColor: BLUE },

  // --- ENCABEZADO ---
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' },
  titleKicker: { fontSize: 8.5, fontWeight: 'bold', color: ORANGE, letterSpacing: 2.2 },
  titleNumber: { fontSize: 22, fontWeight: 'bold', color: NAVY, marginTop: 1 },
  logoSection: { width: 90, alignItems: 'flex-end', marginTop: -4 },

  infoGrid: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 0.75,
    borderTopColor: LINE,
    paddingTop: 8,
  },
  infoCell: { width: '25%', marginBottom: 6, paddingRight: 10 },
  infoCellWide: { width: '50%', marginBottom: 6, paddingRight: 10 },
  infoCellFull: { width: '100%', marginBottom: 6, paddingRight: 12 },
  infoLabel: { fontSize: 7.5, fontWeight: 'bold', color: MUTED, letterSpacing: 1.2 },
  infoValue: { fontSize: 10.5, fontWeight: 'bold', color: NAVY, marginTop: 2 },

  // --- DESCRIPCIÓN DEL PROYECTO (solo si se ingresó) ---
  projectBox: {
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
    backgroundColor: '#FFF4EC',
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 11,
  },
  projectTitle: { fontSize: 8, fontWeight: 'bold', color: ORANGE, letterSpacing: 1.2, marginBottom: 3 },
  projectText: { fontSize: 9, lineHeight: 1.45, color: INK },

  // --- TABLA ---
  table: { marginTop: 14, width: '100%' },
  tableHeader: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ORANGE,
    height: 26,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  th: { color: 'white', fontSize: 8, fontWeight: 'bold', letterSpacing: 0.8 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 26,
    borderBottomWidth: 0.75,
    borderBottomColor: LINE,
  },
  rowAlt: { backgroundColor: ZEBRA },

  // anchos de columna (Cant, Descripción, P.Lista, %Desc, P.Oferta, Total)
  colCant: { width: '7%', justifyContent: 'center', alignItems: 'center' },
  colDesc: { width: '43%', paddingVertical: 6, paddingHorizontal: 8, justifyContent: 'center' },
  colLista: { width: '14%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 8 },
  colDescPct: { width: '8%', justifyContent: 'center', alignItems: 'center' },
  colUni: { width: '14%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 8 },
  colTot: { width: '14%', justifyContent: 'center', alignItems: 'flex-end', paddingRight: 8 },

  cellText: { fontSize: 9.5 },
  cellStrong: { fontSize: 9.5, fontWeight: 'bold', color: NAVY },
  discountText: { fontSize: 8.5, color: ORANGE, fontWeight: 'bold' },
  colDescrip: { fontSize: 9, lineHeight: 1.4 },
  descTitle: { fontSize: 9.5, lineHeight: 1.35, fontWeight: 'bold', color: NAVY, marginBottom: 3 },
  bulletRow: { flexDirection: 'row', marginTop: 2 },
  bulletDot: { width: 10, fontSize: 9, lineHeight: 1.4, color: ORANGE, fontWeight: 'bold' },
  bulletText: { flex: 1, fontSize: 9, lineHeight: 1.4, color: INK },

  // --- TOTALES ---
  totalsWrap: { width: '100%', marginTop: 14, flexDirection: 'row', justifyContent: 'flex-end' },
  totalsCard: { width: '46%', borderWidth: 0.75, borderColor: LINE, borderRadius: 6, paddingTop: 8, paddingHorizontal: 12, paddingBottom: 0, overflow: 'hidden' },
  totalsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  totalsLabel: { fontSize: 9.5, color: MUTED },
  totalsValue: { fontSize: 9.5, fontWeight: 'bold', color: INK },
  totalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ORANGE,
    marginHorizontal: -12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 2,
  },
  totalBarLabel: { color: 'white', fontSize: 10, fontWeight: 'bold', letterSpacing: 1.5 },
  totalBarValue: { color: 'white', fontSize: 14, fontWeight: 'bold' },

  // --- CONDICIONES ---
  conditions: {
    marginTop: 16,
    backgroundColor: '#F4F8FC',
    borderLeftWidth: 3,
    borderLeftColor: BLUE,
    borderTopRightRadius: 5,
    borderBottomRightRadius: 5,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  condRow: { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
  condLabel: { width: 92, fontSize: 8, fontWeight: 'bold', color: BLUE, letterSpacing: 0.8, paddingTop: 1.5 },
  condValue: { flex: 1, fontSize: 10, color: INK },
  observations: { marginTop: 8, fontSize: 8.5, lineHeight: 1.45, color: MUTED },

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

// Las descripciones largas traen sus funciones separadas con "•": la primera frase
// va como título y cada viñeta en su propia línea -mucho más fácil de leer que un
// solo párrafo corrido.
const DescriptionBlock = ({ text }) => {
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

const InfoCell = ({ label, value, full, wide }) => (
  <View style={full ? styles.infoCellFull : wide ? styles.infoCellWide : styles.infoCell}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value || '-'}</Text>
  </View>
);

export const QuotationDocument = ({ quotation }) => {
  const { client, items, projectDescription, subtotal, tax, total, correlativo, createdAt, elaboratedBy, validity } = quotation;

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
            <InfoCell label="CLIENTE" value={client?.name} wide />
            <InfoCell label="FECHA" value={formatDate(createdAt)} />
            <InfoCell label="NIT" value={client?.taxId} />
            <InfoCell label="DIRECCIÓN" value={client?.address} full />
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
              <View style={[styles.tableRow, i % 2 === 1 ? styles.rowAlt : null]} key={i} wrap={false} minPresenceAhead={i === items.length - 1 ? 290 : 0}>
                <View style={styles.colCant}>
                  <Text style={styles.cellStrong}>{item.quantity}</Text>
                </View>

                <View style={styles.colDesc}>
                  <DescriptionBlock text={item.description} />
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
