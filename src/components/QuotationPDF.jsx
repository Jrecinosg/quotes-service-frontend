import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import logo from '../assets/logo.png';
import { formatQuotationId, formatCurrency, formatDate } from '../utils/formatters';

// Sin cortar palabras con guion al final de línea (se veía desordenado en descripciones largas)
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 45,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: 'Helvetica'
  },

  // --- ENCABEZADO ---
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 0,
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoSection: {
    width: '70%',
  },
  logoSection: {
    width: '30%',
    alignItems: 'flex-end'
  },
  rowInfo: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'center'
  },
  label: {
    fontWeight: 'bold',
    width: 92,
    fontSize: 12,
  },
  value: {
    flex: 1,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#0070C0'
  },
  noLabel: {
    fontWeight: 'bold',
    width: 80,
    fontSize: 11,
    color: 'red'
  },
  noValue: {
    flex: 1,
    fontSize: 11,
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'right'
  },
  pageText: {
    fontSize: 10,
    color: '#444',
    fontWeight: 'bold',
    textAlign: 'left',
  },

  // --- TABLA REESTRUCTURADA (4 COLUMNAS) ---
  table: {
    marginTop: 10,
    width: '100%',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F46B20',
    borderLeftWidth: 1,
    borderLeftColor: '#F46B20',
    borderRightWidth: 1,
    borderRightColor: '#F46B20',
    minHeight: 22,
    wrap: false,
    alignItems: 'stretch'
  },
  tableHeader: {
    backgroundColor: '#F46B20',
    color: 'white',
    fontWeight: 'bold',
    height: 25,
    borderTopWidth: 1,
    borderTopColor: '#F46B20',
  },

  // --- ANCHOS DE COLUMNA (Cant, Descripción, P.Lista, %Desc, P.Oferta, Total) ---
  colCant: {
    width: '7%',
    borderRightWidth: 1,
    borderRightColor: '#F46B20',
    justifyContent: 'center',
    textAlign: 'center'
  },
  colDesc: {
    width: '44%',
    borderRightWidth: 1,
    borderRightColor: '#F46B20',
    paddingVertical: 5,
    paddingHorizontal: 6,
    justifyContent: 'center'
  },
  colDescrip: {
    fontSize: 9,
    lineHeight: 1.35,
  },
  descTitle: {
    fontSize: 9.5,
    lineHeight: 1.35,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  bulletRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  bulletDot: {
    width: 9,
    fontSize: 9,
    lineHeight: 1.35,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.35,
  },
  colLista: {
    width: '14%',
    borderRightWidth: 1,
    borderRightColor: '#F46B20',
    textAlign: 'center',
    justifyContent: 'center'
  },
  colDescPct: {
    width: '8%',
    borderRightWidth: 1,
    borderRightColor: '#F46B20',
    textAlign: 'center',
    justifyContent: 'center'
  },
  colUni: {
    width: '14%',
    borderRightWidth: 1,
    borderRightColor: '#F46B20',
    textAlign: 'center',
    justifyContent: 'center'
  },
  colTot: {
    width: '13%',
    textAlign: 'center',
    justifyContent: 'center'
  },
  discountText: {
    color: '#F46B20',
    fontWeight: 'bold',
  },

  // --- TOTAL ---
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%'
  },
  totalLabelBox: {
    backgroundColor: '#F46B20',
    width: '15%',
    padding: 5,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F46B20',
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'right'
  },

  // --- FOOTER FIJO ---
  footerFixed: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },

  valueFooter: {
    flex: 1,
    fontSize: 11,
  },

  totalValueBox: {
    width: '20%',
    padding: 5,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F46B20',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },

  subLabelBox: {
    width: '15%',
    padding: 5,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#F46B20',
    textAlign: 'right',
    fontSize: 10,
    fontWeight: 'bold'
  },
  subValueBox: {
    width: '20%',
    padding: 5,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#F46B20',
    textAlign: 'right',
    fontSize: 10
  },
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

export const QuotationDocument = ({ quotation }) => {
  const { client, items, subtotal, tax, total, correlativo, createdAt, elaboratedBy, validity } = quotation;

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* --- ENCABEZADO QUE SE REPITE --- */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.infoSection}>
            <View style={[styles.rowInfo, { marginBottom: 14 }]}>
              <Text style={styles.noLabel}>No.</Text>
              <Text style={styles.noValue}>{formatQuotationId(correlativo)}</Text>
            </View>

            <View style={styles.rowInfo}>
              <Text style={styles.label}>Cliente:</Text>
              <Text style={styles.value}>{client?.name}</Text>
            </View>

            <View style={styles.rowInfo}>
              <Text style={styles.label}>Fecha:</Text>
              <Text style={styles.value}>{formatDate(createdAt)}</Text>
            </View>

            <View style={styles.rowInfo}>
              <Text style={styles.label}>Dirección:</Text>
              <Text style={styles.value}>{client?.address}</Text>
            </View>

            <View style={styles.rowInfo}>
              <Text style={styles.label}>NIT:</Text>
              <Text style={styles.value}>{client?.taxId}</Text>
            </View>

            <View style={[styles.rowInfo, { marginTop: 4 }]}>
              <Text style={[styles.label, styles.pageText]}>Página:</Text>
              <Text
                style={[styles.value, styles.pageText]}
                render={({ pageNumber, totalPages }) => `${pageNumber} de ${totalPages}`}
              />
            </View>
          </View>

          <View style={styles.logoSection}>
            <Image src={logo} style={{ width: 115 }} />
          </View>
        </View>

        {/* --- TABLA --- */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]} fixed>
            <View style={styles.colCant}><Text>Cant.</Text></View>
            <View style={styles.colDesc}><Text>Descripción</Text></View>
            <View style={styles.colLista}><Text>P. Lista</Text></View>
            <View style={styles.colDescPct}><Text>% Desc.</Text></View>
            <View style={styles.colUni}><Text>P. Oferta</Text></View>
            <View style={styles.colTot}><Text>P. Total</Text></View>
          </View>

          {items.map((item, i) => {
            const listPrice = Number(item.listPrice) || 0;
            const discount = Number(item.discountPercent) || 0;
            const hasDiscount = discount > 0;
            const finalUnitPrice = listPrice * (1 - discount / 100);

            return (
              <View style={styles.tableRow} key={i} wrap={false}>
                <View style={styles.colCant}>
                  <Text>{item.quantity}</Text>
                </View>

                <View style={styles.colDesc}>
                  <DescriptionBlock text={item.description} />
                </View>

                <View style={styles.colLista}>
                  <Text>{formatCurrency(listPrice)}</Text>
                </View>

                <View style={styles.colDescPct}>
                  <Text style={hasDiscount ? styles.discountText : null}>{hasDiscount ? `-${discount}%` : '-'}</Text>
                </View>

                {/* Precio con el descuento ya aplicado */}
                <View style={styles.colUni}>
                  <Text>{formatCurrency(finalUnitPrice)}</Text>
                </View>

                <View style={styles.colTot}>
                  <Text>{formatCurrency(item.subtotalItem)}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* --- TOTALES --- */}
        <View wrap={false} style={{ width: '100%', marginTop: 10 }}>

          {/* Fila Subtotal */}
          <View style={styles.totalContainer}>
            <View style={styles.subLabelBox}><Text>Subtotal:</Text></View>
            <View style={styles.subValueBox}>
              <Text style={{ width: '100%' }}>{formatCurrency(subtotal)}</Text>
            </View>
          </View>

          {/* Fila IVA */}
          <View style={styles.totalContainer}>
            <View style={styles.subLabelBox}><Text>IVA (12%):</Text></View>
            <View style={styles.subValueBox}>
              <Text style={{ width: '100%' }}>{formatCurrency(tax)}</Text>
            </View>
          </View>

          {/* Fila TOTAL */}
          <View style={styles.totalContainer}>
            <View style={styles.totalLabelBox}><Text>TOTAL.</Text></View>
            <View style={styles.totalValueBox}>
              <Text style={{ fontWeight: 'bold', fontSize: 12, textAlign: 'right', width: '100%' }}>
                {formatCurrency(total)}
              </Text>
            </View>
          </View>
        </View>

        {/* --- CONDICIONES --- */}
        <View style={{ marginTop: 10 }}>
          <View style={styles.rowInfo}><Text style={styles.label}>Garantía:</Text><Text style={styles.valueFooter}>{quotation.warranty}</Text></View>
          <View style={styles.rowInfo}><Text style={styles.label}>Entrega:</Text><Text style={styles.valueFooter}>{quotation.deliveryTime}</Text></View>
          <View style={styles.rowInfo}><Text style={styles.label}>Forma pago:</Text><Text style={styles.valueFooter}>{quotation.paymentMethod}</Text></View>
          <View style={styles.rowInfo}><Text style={styles.label}>Validez:</Text><Text style={styles.valueFooter}>{validity}</Text></View>
          <View style={styles.rowInfo}><Text style={styles.label}>Elaborado:</Text><Text style={styles.valueFooter}>{elaboratedBy}</Text></View>
          <Text style={{ marginTop: 6, fontSize: 8.5, lineHeight: 1.35, color: '#444' }}>{quotation.observations}</Text>
        </View>

        {/* --- FOOTER --- */}
        <View style={styles.footerFixed} fixed>
          <Text style={{ borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 }}>
            Avenida Hincapié 3-49 zona 13 | Tel. 2234-7254
          </Text>
        </View>

      </Page>
    </Document>
  );
};