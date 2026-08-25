import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import logo from '../assets/logo.png';
import { formatRequestId, formatDate } from '../utils/formatters';

const STATUS_LABEL = {
  PENDING: 'Pendiente',
  IN_PROGRESS: 'En proceso',
  DONE: 'Finalizado'
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: 'Helvetica'
  },
  headerContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  infoSection: { width: '70%' },
  logoSection: { width: '30%', alignItems: 'flex-end' },
  title: { fontSize: 16, fontWeight: 'bold', color: '#182454', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#555' },

  table: { width: '100%', marginTop: 10 },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F46B20',
    borderLeftWidth: 1,
    borderLeftColor: '#F46B20',
    borderRightWidth: 1,
    borderRightColor: '#F46B20',
    minHeight: 24,
    alignItems: 'stretch'
  },
  tableHeader: {
    backgroundColor: '#182454',
    color: 'white',
    fontWeight: 'bold',
    height: 26,
    borderTopWidth: 1,
    borderTopColor: '#182454',
  },
  colId: { width: '14%', borderRightWidth: 1, borderRightColor: '#F46B20', justifyContent: 'center', paddingLeft: 5 },
  colTitle: { width: '38%', borderRightWidth: 1, borderRightColor: '#F46B20', justifyContent: 'center', paddingLeft: 5 },
  colStatus: { width: '18%', borderRightWidth: 1, borderRightColor: '#F46B20', justifyContent: 'center', textAlign: 'center' },
  colDate: { width: '15%', borderRightWidth: 1, borderRightColor: '#F46B20', justifyContent: 'center', textAlign: 'center' },
  colDateLast: { width: '15%', justifyContent: 'center', textAlign: 'center' },

  footerFixed: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

export const RequestsDocument = ({ requests, clientName }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer} fixed>
          <View style={styles.infoSection}>
            <Text style={styles.title}>Historial de solicitudes</Text>
            <Text style={styles.subtitle}>{clientName}</Text>
            <Text style={styles.subtitle}>Generado el {formatDate(new Date())}</Text>
          </View>
          <View style={styles.logoSection}>
            <Image src={logo} style={{ width: 100 }} />
          </View>
        </View>

        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]} fixed>
            <View style={styles.colId}><Text>No.</Text></View>
            <View style={styles.colTitle}><Text>Título</Text></View>
            <View style={styles.colStatus}><Text>Estado</Text></View>
            <View style={styles.colDate}><Text>Creada</Text></View>
            <View style={styles.colDateLast}><Text>Actualizada</Text></View>
          </View>

          {requests.map((r) => (
            <View style={styles.tableRow} key={r.id} wrap={false}>
              <View style={styles.colId}><Text>{formatRequestId(r.correlativo)}</Text></View>
              <View style={styles.colTitle}><Text>{r.title}</Text></View>
              <View style={styles.colStatus}><Text>{STATUS_LABEL[r.status]}</Text></View>
              <View style={styles.colDate}><Text>{formatDate(r.createdAt)}</Text></View>
              <View style={styles.colDateLast}><Text>{formatDate(r.updatedAt)}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.footerFixed} fixed>
          <Text style={{ borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 8 }}>
            Grupo AC, Tecnoseguridad e Informática — grupo-ac.com.gt
          </Text>
        </View>
      </Page>
    </Document>
  );
};
