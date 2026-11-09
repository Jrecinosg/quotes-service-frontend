import { useEffect, useRef, useState } from "react";
import { ImageOff } from "lucide-react";
import { bitacoraService } from "../services/bitacora.service";

// Foto de la bitácora: se pide con la sesión (axios + Authorization) y se muestra como blob:.
// Carga perezosa: solo se descarga cuando la miniatura está por entrar en pantalla.
// El blob URL se libera (revokeObjectURL) al desmontar o cambiar de foto.
export default function BitacoraPhoto({ photoId, alt, eager = false, contain = false, className = "", onClick }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(eager);
  const [state, setState] = useState({ url: null, error: false });

  useEffect(() => {
    if (visible) return undefined;
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      const t = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(t);
    }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); io.disconnect(); }
    }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    let alive = true;
    let objectUrl = null;
    bitacoraService.getPhotoBlob(photoId)
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (alive) setState({ url: objectUrl, error: false });
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => { if (alive) setState({ url: null, error: true }); });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [visible, photoId]);

  const content = state.url ? (
    <img src={state.url} alt={alt || ""} className={`w-full h-full ${contain ? "object-contain" : "object-cover"}`} />
  ) : state.error ? (
    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-xs text-gray-400">
      <ImageOff size={18} /> No se pudo cargar
    </div>
  ) : (
    <div className="skeleton w-full h-full" aria-hidden="true" />
  );

  const base = `relative overflow-hidden bg-white/5 ${className}`;
  if (onClick) {
    return (
      <button ref={ref} type="button" onClick={onClick} className={`${base} block text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#00c2ff]`} aria-label={alt ? `Ampliar foto: ${alt}` : "Ampliar foto"}>
        {content}
      </button>
    );
  }
  return <div ref={ref} className={base}>{content}</div>;
}
