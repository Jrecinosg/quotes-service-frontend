// Fondo vivo: tres manchas de luz desenfocadas que se mueven muy lento (solo transform/opacity,
// sin repintar el contenido). Se apaga con prefers-reduced-motion (ver index.css).
export default function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <i /><i /><i />
    </div>
  );
}
