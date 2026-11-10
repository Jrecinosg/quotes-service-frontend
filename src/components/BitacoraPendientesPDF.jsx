import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image, Font, Svg, Path } from '@react-pdf/renderer';
import logo from '../assets/logo.png';
import { formatShortDate, isOverdue, toIsoDay, ORIGINS } from '../utils/bitacora';

Font.registerHyphenationCallback((word) => [word]);

const ORANGE = '#F46B20';
const ORANGE_TEXT = '#C2500F';
const BLUE = '#0070C0';
const NAVY = '#202850';
const INK = '#2B3342';
const MUTED = '#6B7686';
const LINE = '#EADFD6';
const DANGER = '#B42318';

const styles = StyleSheet.create({
  page: { fontFamily: 'Helvetica', color: INK, fontSize: 10, paddingTop: 30, paddingBottom: 56, paddingHorizontal: 40 },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, height: 7, flexDirection: 'row' },
  barOrange: { width: '72%', backgroundColor: ORANGE },
  barBlue: { width: '28%', backgroundColor: BLUE },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headText: { flex: 1, paddingRight: 16 },
  kicker: { fontSize: 8.5, fontWeight: 'bold', color: ORANGE_TEXT, letterSpacing: 2.2 },
  title: { fontSize: 18, fontWeight: 'bold', color: NAVY, marginTop: 3, lineHeight: 1.2 },
  subtitle: { fontSize: 10, color: MUTED, marginTop: 4 },
  logo: { width: 72, marginTop: -4 },
  info: { flexDirection: 'row', marginTop: 12, borderTopWidth: 0.75, borderTopColor: LINE, paddingTop: 8 },
  infoCell: { flex: 1, paddingRight: 10 },
  infoLabel: { fontSize: 7.5, fontWeight: 'bold', color: MUTED, letterSpacing: 1.2 },
  infoValue: { fontSize: 10, fontWeight: 'bold', color: NAVY, marginTop: 2 },
  sectionLabel: { fontSize: 8.5, fontWeight: 'bold', color: ORANGE_TEXT, letterSpacing: 1.8, marginTop: 16, marginBottom: 2 },
  thead: { marginTop: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: NAVY, height: 22, borderTopLeftRadius: 5, borderTopRightRadius: 5 },
  th: { fontSize: 8, fontWeight: 'bold', color: '#FFFFFF', letterSpacing: 0.8 },
  tr: { flexDirection: 'row', alignItems: 'center', minHeight: 34, paddingVertical: 4, borderBottomWidth: 0.75, borderBottomColor: LINE },
  cBox: { width: 30, alignItems: 'center' },
  cText: { width: 215, paddingRight: 8 },
  cTextWide: { width: 305, paddingRight: 8 },
  cWho: { width: 90, paddingRight: 8 },
  cDue: { width: 90, paddingRight: 6 },
  cOrigin: { width: 90 },
  group: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#E6F1FA', borderRadius: 5, paddingVertical: 5, paddingHorizontal: 10 },
  groupName: { fontSize: 10.5, fontWeight: 'bold', color: NAVY, flex: 1, paddingRight: 8 },
  groupMeta: { fontSize: 8, color: MUTED },
  company: { marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: NAVY, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12 },
  companyName: { fontSize: 13, fontWeight: 'bold', color: '#FFFFFF', flex: 1, paddingRight: 8 },
  companyMeta: { fontSize: 8.5, color: '#D7DEEE' },
  shopBand: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFF4EC', borderRadius: 5, paddingVertical: 5, paddingHorizontal: 10, borderLeftWidth: 3, borderLeftColor: ORANGE },
  shopName: { fontSize: 10.5, fontWeight: 'bold', color: ORANGE_TEXT },
  box: { width: 13, height: 13, borderWidth: 1.25, borderColor: NAVY, borderRadius: 3 },
  boxDone: { width: 13, height: 13, borderRadius: 3, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  task: { fontSize: 10.5, fontWeight: 'bold', color: NAVY, lineHeight: 1.3 },
  taskDone: { fontSize: 10.5, color: MUTED, textDecoration: 'line-through', lineHeight: 1.3 },
  ctx: { fontSize: 8, color: MUTED, marginTop: 1 },
  cell: { fontSize: 10 },
  overdue: { fontSize: 10, color: DANGER },
  empty: { fontSize: 10, color: MUTED, paddingVertical: 20, textAlign: 'center' },
  sumRow: { flexDirection: 'row', alignItems: 'center', minHeight: 24, borderBottomWidth: 0.75, borderBottomColor: LINE, paddingVertical: 3 },
  sumName: { flex: 1, paddingLeft: 10, paddingRight: 8, fontSize: 10.5, color: NAVY, fontWeight: 'bold' },
  sumNum: { width: 90, textAlign: 'right', paddingRight: 10, fontSize: 10.5 },
  sumTotal: { flexDirection: 'row', alignItems: 'center', minHeight: 26, backgroundColor: '#F3F6FA', paddingVertical: 4 },
  notes: { marginTop: 18 },
  notesLabel: { fontSize: 8, fontWeight: 'bold', color: MUTED, letterSpacing: 1.2 },
  notesLine: { borderBottomWidth: 0.75, borderBottomColor: '#C9CFD8', borderBottomStyle: 'dashed', height: 22 },
  footer: { position: 'absolute', bottom: 24, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  footLeft: { fontSize: 8, fontWeight: 'bold', color: DANGER },
  footRight: { fontSize: 8, color: MUTED },
});

const Check = () => (
  <Svg width={9} height={9} viewBox="0 0 10 10">
    <Path d="M1.5 5.2 L4 7.7 L8.5 2.3" stroke="#FFFFFF" strokeWidth={1.6} fill="none" />
  </Svg>
);

const fmtDue = (p) => (p.dueDate ? formatShortDate(p.dueDate, false) : '—');
const byDue = (a, b) => ((toIsoDay(a.dueDate) || '9999') < (toIsoDay(b.dueDate) || '9999') ? -1 : 1);
// Abiertos primero (por fecha límite) y luego los hechos (si se incluyen).
const ordered = (rows) => [...rows.filter((p) => !p.done).sort(byDue), ...rows.filter((p) => p.done)];

const KIND_LABEL = { PROYECTO: 'PROYECTO', SOPORTE: 'SOPORTE MENSUAL', SUELTOS: 'SIN PROYECTO' };

const Box = ({ done }) => (done ? <View style={styles.boxDone}><Check /></View> : <View style={styles.box} />);

const Due = ({ p, today }) => (isOverdue({ ...p, done: p.done }, today)
  ? <Text style={styles.overdue}>{fmtDue(p)} (vencido)</Text>
  : <Text style={styles.cell}>{fmtDue(p)}</Text>);

const THead = ({ origin }) => (
  <View style={styles.thead}>
    <View style={styles.cBox} />
    <Text style={[styles.th, origin ? styles.cText : styles.cTextWide]}>{origin ? 'PENDIENTE' : 'ARTÍCULO A COMPRAR'}</Text>
    <Text style={[styles.th, styles.cWho]}>RESPONSABLE</Text>
    <Text style={[styles.th, styles.cDue]}>FECHA LÍMITE</Text>
    {origin ? <Text style={[styles.th, styles.cOrigin]}>ORIGEN</Text> : null}
  </View>
);

const Row = ({ p, today, origin }) => (
  <View style={styles.tr} wrap={false}>
    <View style={styles.cBox}><Box done={p.done} /></View>
    <View style={origin ? styles.cText : styles.cTextWide}>
      <Text style={p.done ? styles.taskDone : styles.task}>{p.text}</Text>
      {!origin && p.projectTitle ? <Text style={styles.ctx}>{p.projectTitle}</Text> : null}
    </View>
    <View style={styles.cWho}><Text style={styles.cell}>{p.assignee || '—'}</Text></View>
    <View style={styles.cDue}><Due p={p} today={today} /></View>
    {origin ? <View style={styles.cOrigin}><Text style={styles.cell}>{ORIGINS[p.origin] || '—'}</Text></View> : null}
  </View>
);

/** Bloque de UNA empresa: PENDIENTES (por proyecto / soporte / sueltos) y COMPRAS aparte. */
const CompanyBlock = ({ company, today, showHeader }) => {
  const groups = company.groups || [];
  const purchases = ordered(company.purchases || []);
  return (
    <View>
      {showHeader ? (
        // minPresenceAhead: la cabecera de empresa nunca queda sola al final de una hoja
        <View wrap={false} minPresenceAhead={130}>
          <View style={styles.company}>
            <Text style={styles.companyName}>{company.name}</Text>
            <Text style={styles.companyMeta}>{company.counts.pendientes} {company.counts.pendientes === 1 ? 'pendiente' : 'pendientes'} · {company.counts.compras} {company.counts.compras === 1 ? 'compra' : 'compras'}</Text>
          </View>
        </View>
      ) : null}
      {groups.length ? <Text style={styles.sectionLabel} minPresenceAhead={110}>PENDIENTES</Text> : null}
      {groups.map((g, gi) => {
        const rows = ordered(g.pendings);
        return (
          <View key={gi}>
            <View wrap={false} minPresenceAhead={90}>
              <View style={styles.group}>
                <Text style={styles.groupName}>{KIND_LABEL[g.kind] || 'PROYECTO'} · {g.title}{g.quotationNumber ? ` · ${g.quotationNumber}` : ''}</Text>
                <Text style={styles.groupMeta}>{rows.length} {rows.length === 1 ? 'pendiente' : 'pendientes'}</Text>
              </View>
              <THead origin />
              {/* la primera fila viaja con la cabecera: nunca queda una cabecera sola al final de la hoja */}
              {rows[0] ? <Row p={rows[0]} today={today} origin /> : null}
            </View>
            {rows.slice(1).map((p, i) => <Row key={i} p={p} today={today} origin />)}
          </View>
        );
      })}
      {purchases.length ? (
        <View>
          <View wrap={false} minPresenceAhead={90}>
            <Text style={styles.sectionLabel}>COMPRAS</Text>
            <View style={styles.shopBand}>
              <Text style={styles.shopName}>Lista de compras · {company.name}</Text>
              <Text style={styles.groupMeta}>{purchases.length} {purchases.length === 1 ? 'artículo' : 'artículos'}</Text>
            </View>
            <THead origin={false} />
            <Row p={purchases[0]} today={today} origin={false} />
          </View>
          {purchases.slice(1).map((p, i) => <Row key={i} p={p} today={today} origin={false} />)}
        </View>
      ) : null}
    </View>
  );
};

const Chrome = ({ children, genDate }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.bar} fixed><View style={styles.barOrange} /><View style={styles.barBlue} /></View>
    {children}
    <View style={styles.footer} fixed>
      <Text style={styles.footLeft}>Uso interno · no entregar al cliente</Text>
      <Text style={styles.footRight} render={({ pageNumber, totalPages }) => `Grupo AC · ${genDate} · Página ${pageNumber} de ${totalPages}`} />
    </View>
  </Page>
);

/**
 * PENDIENTES PARA EL PERSONAL (uso interno).
 * data = { mode: 'cliente' | 'todos', title?, subtitle?, filterLabel?, clientName?,
 *          companies: [{ name, groups: [{ title, kind, quotationNumber, pendings }], purchases: [{ text, assignee, dueDate, done, projectTitle }], counts: { pendientes, compras } }],
 *          generatedAt (Date) }
 * mode 'cliente': una empresa, sin resumen ni lista consolidada. mode 'todos': resumen por empresa, una sección
 * por empresa (orden alfabético) y, al final, la lista de compras consolidada en una página propia.
 */
export const BitacoraPendientesDocument = ({ data }) => {
  const companies = data.companies || [];
  const multi = data.mode === 'todos';
  const gen = data.generatedAt || new Date();
  const genText = gen.toLocaleString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const genDate = gen.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const today = new Date(gen.getTime() - gen.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const totalP = companies.reduce((n, c) => n + c.counts.pendientes, 0);
  const totalC = companies.reduce((n, c) => n + c.counts.compras, 0);
  const title = data.title || `Pendientes — ${data.clientName || (companies[0] && companies[0].name) || 'Cliente'}${data.filterLabel ? `: ${data.filterLabel}` : ''}`;
  const withPurchases = companies.filter((c) => c.purchases.length);

  return (
    <Document title={multi ? 'Pendientes - todas las empresas' : `Pendientes - ${data.clientName || ''}`} author="Grupo AC">
      <Chrome genDate={genDate}>
        <View style={styles.head}>
          <View style={styles.headText}>
            <Text style={styles.kicker}>PENDIENTES · SOLO PERSONAL</Text>
            <Text style={styles.title}>{title}</Text>
            {data.subtitle ? <Text style={styles.subtitle}>{data.subtitle}</Text> : null}
          </View>
          <Image src={logo} style={styles.logo} />
        </View>
        <View style={styles.info}>
          <View style={styles.infoCell}><Text style={styles.infoLabel}>{multi ? 'FECHA DEL DOCUMENTO' : 'CLIENTE'}</Text><Text style={styles.infoValue}>{multi ? genText : (data.clientName || (companies[0] && companies[0].name) || '')}</Text></View>
          {!multi ? <View style={styles.infoCell}><Text style={styles.infoLabel}>GENERADO EL</Text><Text style={styles.infoValue}>{genText}</Text></View> : null}
          <View style={styles.infoCell}><Text style={styles.infoLabel}>PENDIENTES</Text><Text style={styles.infoValue}>{totalP}</Text></View>
          <View style={styles.infoCell}><Text style={styles.infoLabel}>COMPRAS</Text><Text style={styles.infoValue}>{totalC}</Text></View>
          {multi ? <View style={styles.infoCell}><Text style={styles.infoLabel}>EMPRESAS</Text><Text style={styles.infoValue}>{companies.length}</Text></View> : null}
        </View>

        {companies.length === 0 ? <Text style={styles.empty}>No hay pendientes abiertos.</Text> : null}

        {multi && companies.length ? (
          <View wrap={false}>
            <Text style={styles.sectionLabel}>RESUMEN POR EMPRESA</Text>
            <View style={styles.thead}>
              <Text style={[styles.th, { flex: 1, paddingLeft: 10 }]}>EMPRESA</Text>
              <Text style={[styles.th, { width: 90, textAlign: 'right', paddingRight: 10 }]}>PENDIENTES</Text>
              <Text style={[styles.th, { width: 90, textAlign: 'right', paddingRight: 10 }]}>COMPRAS</Text>
            </View>
            {companies.map((c, i) => (
              <View key={i} style={styles.sumRow}>
                <Text style={styles.sumName}>{c.name}</Text>
                <Text style={styles.sumNum}>{c.counts.pendientes}</Text>
                <Text style={styles.sumNum}>{c.counts.compras}</Text>
              </View>
            ))}
            <View style={styles.sumTotal}>
              <Text style={[styles.sumName, { fontSize: 10 }]}>TOTAL</Text>
              <Text style={[styles.sumNum, { fontWeight: 'bold', color: NAVY }]}>{totalP}</Text>
              <Text style={[styles.sumNum, { fontWeight: 'bold', color: NAVY }]}>{totalC}</Text>
            </View>
          </View>
        ) : null}

        {companies.map((c, i) => <CompanyBlock key={i} company={c} today={today} showHeader={multi} />)}

        {!multi ? (
          <View style={styles.notes} wrap={false}>
            <Text style={styles.notesLabel}>NOTAS</Text>
            <View style={styles.notesLine} /><View style={styles.notesLine} /><View style={styles.notesLine} />
          </View>
        ) : null}
      </Chrome>

      {multi && withPurchases.length ? (
        <Chrome genDate={genDate}>
          <View style={styles.head}>
            <View style={styles.headText}>
              <Text style={styles.kicker}>PARA IR A COMPRAR</Text>
              <Text style={styles.title}>Lista de compras consolidada</Text>
              <Text style={styles.subtitle}>{totalC} {totalC === 1 ? 'artículo' : 'artículos'} · {withPurchases.length} {withPurchases.length === 1 ? 'empresa' : 'empresas'}</Text>
            </View>
            <Image src={logo} style={styles.logo} />
          </View>
          {withPurchases.map((c, i) => (
            <View key={i}>
              <View wrap={false} minPresenceAhead={80}>
                <View style={styles.company}>
                  <Text style={styles.companyName}>{c.name}</Text>
                  <Text style={styles.companyMeta}>{c.purchases.length} {c.purchases.length === 1 ? 'artículo' : 'artículos'}</Text>
                </View>
                <THead origin={false} />
                <Row p={ordered(c.purchases)[0]} today={today} origin={false} />
              </View>
              {ordered(c.purchases).slice(1).map((p, j) => <Row key={j} p={p} today={today} origin={false} />)}
            </View>
          ))}
        </Chrome>
      ) : null}
    </Document>
  );
};
