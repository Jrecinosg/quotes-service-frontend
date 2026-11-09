import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font, Svg, Path } from '@react-pdf/renderer';
import logo from '../assets/logo.png';
import { formatRange, formatShortDate, isOverdue, toIsoDay } from '../utils/bitacora';

Font.registerHyphenationCallback((word) => [word]);

const ORANGE = '#F46B20';
const ORANGE_TEXT = '#C2500F';
const BLUE = '#0070C0';
const NAVY = '#202850';
const INK = '#2B3342';
const MUTED = '#6B7686';
const LINE = '#EADFD6';
const DANGER = '#B42318';

// k = factor de compactación (1 normal; 0.9 si hay más de 14 pendientes)
const buildStyles = (k) => {
  const s = (n) => Math.round(n * k * 100) / 100;
  return StyleSheet.create({
    page: { fontFamily: 'Helvetica', color: INK, fontSize: s(10), paddingTop: s(30), paddingBottom: 56, paddingHorizontal: 40 },
    bar: { position: 'absolute', top: 0, left: 0, right: 0, height: 7, flexDirection: 'row' },
    barOrange: { width: '72%', backgroundColor: ORANGE },
    barBlue: { width: '28%', backgroundColor: BLUE },
    head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    headText: { flex: 1, paddingRight: 16 },
    kicker: { fontSize: s(8.5), fontWeight: 'bold', color: ORANGE_TEXT, letterSpacing: 2.2 },
    title: { fontSize: s(18), fontWeight: 'bold', color: NAVY, marginTop: 3, lineHeight: 1.2 },
    logo: { width: 72, marginTop: -4 },
    info: { flexDirection: 'row', marginTop: s(12), borderTopWidth: 0.75, borderTopColor: LINE, paddingTop: s(8) },
    infoCell: { flex: 1, paddingRight: 10 },
    infoLabel: { fontSize: 7.5, fontWeight: 'bold', color: MUTED, letterSpacing: 1.2 },
    infoValue: { fontSize: 10, fontWeight: 'bold', color: NAVY, marginTop: 2 },
    thead: { marginTop: s(14), flexDirection: 'row', alignItems: 'center', backgroundColor: NAVY, height: 22, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
    th: { fontSize: 8, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 0.8 },
    tr: { flexDirection: 'row', alignItems: 'center', minHeight: s(34), paddingVertical: s(4), borderBottomWidth: 0.75, borderBottomColor: LINE },
    cBox: { width: 36, alignItems: 'center' },
    cText: { width: 255, paddingRight: 8 },
    cWho: { width: 120, paddingRight: 8 },
    cDue: { width: 104 },
    box: { width: 13, height: 13, borderWidth: 1.25, borderColor: NAVY, borderRadius: 3 },
    boxDone: { width: 13, height: 13, borderRadius: 3, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
    task: { fontSize: 10.5, fontWeight: 'bold', color: NAVY, lineHeight: 1.3 },
    taskDone: { fontSize: 10.5, color: MUTED, textDecoration: 'line-through', lineHeight: 1.3 },
    cell: { fontSize: 10 },
    overdue: { fontSize: 10, color: DANGER },
    empty: { fontSize: 10, color: MUTED, paddingVertical: 20, textAlign: 'center' },
    notes: { marginTop: s(18) },
    notesLabel: { fontSize: 8, fontWeight: 'bold', color: MUTED, letterSpacing: 1.2 },
    notesLine: { borderBottomWidth: 0.75, borderBottomColor: '#C9CFD8', borderBottomStyle: 'dashed', height: s(22) },
    footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
    footLeft: { fontSize: 8, fontWeight: 'bold', color: DANGER },
    footRight: { fontSize: 8, color: MUTED },
  });
};

const Check = () => (
  <Svg width={9} height={9} viewBox="0 0 10 10">
    <Path d="M1.5 5.2 L4 7.7 L8.5 2.3" stroke="#FFFFFF" strokeWidth={1.6} fill="none" />
  </Svg>
);

const fmtDue = (p) => (p.dueDate ? formatShortDate(p.dueDate, false) : '—');

/**
 * Hoja de PENDIENTES PARA EL PERSONAL (uso interno).
 * data = { clientName, projectName, startDate, endDate, pendings: [{text, assignee, dueDate, done}],
 *          generatedAt (Date), includeDone? }
 */
export const BitacoraPendientesDocument = ({ data }) => {
  const all = data.pendings || [];
  const open = all.filter((p) => !p.done).sort((a, b) => (toIsoDay(a.dueDate) || '9999') < (toIsoDay(b.dueDate) || '9999') ? -1 : 1);
  const done = data.includeDone ? all.filter((p) => p.done) : [];
  const rows = [...open, ...done];
  const k = rows.length > 14 ? 0.9 : 1;
  const styles = buildStyles(k);
  const gen = data.generatedAt || new Date();
  const genText = gen.toLocaleString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const genDate = gen.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const today = new Date(gen.getTime() - gen.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

  return (
    <Document title={`Pendientes - ${data.clientName}`} author="Grupo AC">
      <Page size="A4" style={styles.page}>
        <View style={styles.bar} fixed><View style={styles.barOrange} /><View style={styles.barBlue} /></View>

        <View style={styles.head}>
          <View style={styles.headText}>
            <Text style={styles.kicker}>PENDIENTES · SOLO PERSONAL</Text>
            <Text style={styles.title}>Pendientes — {data.clientName}: {data.projectName}</Text>
          </View>
          <Image src={logo} style={styles.logo} />
        </View>

        <View style={styles.info}>
          <View style={styles.infoCell}><Text style={styles.infoLabel}>FECHAS DEL PROYECTO</Text><Text style={styles.infoValue}>{formatRange(data.startDate, data.endDate)}</Text></View>
          <View style={styles.infoCell}><Text style={styles.infoLabel}>GENERADO EL</Text><Text style={styles.infoValue}>{genText}</Text></View>
          <View style={styles.infoCell}><Text style={styles.infoLabel}>PENDIENTES ABIERTOS</Text><Text style={styles.infoValue}>{open.length} de {all.length}</Text></View>
        </View>

        <View style={styles.thead} fixed={false}>
          <View style={styles.cBox} />
          <Text style={[styles.th, styles.cText]}>PENDIENTE</Text>
          <Text style={[styles.th, styles.cWho]}>RESPONSABLE</Text>
          <Text style={[styles.th, styles.cDue]}>FECHA LÍMITE</Text>
        </View>
        {rows.length === 0 ? <Text style={styles.empty}>No hay pendientes abiertos.</Text> : null}
        {rows.map((p, i) => {
          const over = isOverdue(p, today);
          return (
            <View key={i} style={styles.tr} wrap={false}>
              <View style={styles.cBox}>
                {p.done ? <View style={styles.boxDone}><Check /></View> : <View style={styles.box} />}
              </View>
              <View style={styles.cText}><Text style={p.done ? styles.taskDone : styles.task}>{p.text}</Text></View>
              <View style={styles.cWho}><Text style={styles.cell}>{p.assignee || '—'}</Text></View>
              <View style={styles.cDue}>
                {over ? <Text style={styles.overdue}>{fmtDue(p)} (vencido)</Text> : <Text style={styles.cell}>{fmtDue(p)}</Text>}
              </View>
            </View>
          );
        })}

        <View style={styles.notes} wrap={false}>
          <Text style={styles.notesLabel}>NOTAS</Text>
          <View style={styles.notesLine} /><View style={styles.notesLine} /><View style={styles.notesLine} />
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footLeft}>Uso interno · no entregar al cliente</Text>
          <Text style={styles.footRight}>Grupo AC · {genDate}</Text>
        </View>
      </Page>
    </Document>
  );
};
