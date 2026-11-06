// Renderiza QuotationPDF con datos de PRUEBA a un PDF local (solo para revisar el diseño; no toca la base).
// Uso: node scripts/render-pdf-prueba.mjs <salida.pdf>
import { build } from 'esbuild';
import { pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
const out = process.argv[2] || 'prueba.pdf';
const tmp = path.resolve('node_modules/.cache-pdf-prueba.mjs');
await build({ entryPoints: ['src/components/QuotationPDF.jsx'], bundle: true, format: 'esm', platform: 'node', outfile: tmp,
  loader: { '.png': 'dataurl', '.jsx': 'jsx', '.js': 'jsx' }, external: ['@react-pdf/renderer', 'react'], logLevel: 'error' });
const { QuotationDocument } = await import(pathToFileURL(tmp).href);
const React = (await import('react')).default;
const { renderToFile } = await import('@react-pdf/renderer');
const long = 'Cámara IP bullet 4MP con visión nocturna • Lente 2.8mm, H.265+ • IR de 30 m, IP67 • Alimentación PoE 802.3af • Detección de movimiento y línea virtual • Compatible con ONVIF y los grabadores de la serie Pro';
const items = [
  { quantity: 8, description: long, listPrice: 1250, discountPercent: 12, subtotalItem: 8800 },
  { quantity: 1, description: 'Grabador NVR 16 canales 4K con soporte para 2 discos duros', listPrice: 3890, discountPercent: 0, subtotalItem: 3890 },
  { quantity: 2, description: 'Disco duro 4TB especial para videovigilancia', listPrice: 1180, discountPercent: 5, subtotalItem: 2242 },
  { quantity: 1, description: 'Instalación, cableado estructurado y configuración del sistema completo', listPrice: 2500, discountPercent: 0, subtotalItem: 2500 },
];
const q = { client: { name: 'Distribuidora Ejemplo, S.A.', address: '12 calle 5-30 zona 10, Ciudad de Guatemala', taxId: '1234567-8' },
  items: Array.from({ length: Number((process.argv.find(a => a.startsWith('--n=')) || '--n=1').slice(4)) }, () => items).flat(), projectDescription: 'Sistema de videovigilancia para bodega y oficinas administrativas, con grabación centralizada.',
  subtotal: 17432, tax: 2091.84, total: 19523.84, correlativo: 1234, createdAt: new Date('2026-11-06T12:00:00Z'), elaboratedBy: 'Ejemplo Vendedor',
  validity: '15 días', warranty: '1 año por defectos de fábrica', deliveryTime: '5 a 8 días hábiles', paymentMethod: '50% anticipo, 50% contra entrega',
  observations: 'Precios incluyen IVA salvo indicación. Los equipos se entregan configurados. Sujeto a disponibilidad de inventario al momento de la aprobación.' };
await renderToFile(React.createElement(QuotationDocument, { quotation: q }), out);
fs.unlinkSync(tmp);
console.log('OK', out);
