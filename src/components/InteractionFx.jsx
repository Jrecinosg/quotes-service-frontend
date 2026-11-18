import { useEffect } from "react";

// Efectos de interacción del portal (solo aspecto, sin tocar la lógica de ningún botón):
//  - onda al pulsar cualquier .btn
//  - ligera inclinación "magnética" del botón primario hacia el cursor
//  - luz que sigue al cursor dentro de tarjetas (.card-hover, .glow, .kpi)
// Un solo par de escuchas en el documento. No actúa en la portada (.gac-landing),
// ni con prefers-reduced-motion, ni en pantallas táctiles (sin cursor fino).
export default function InteractionFx() {
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia?.("(pointer: fine)");
    const off = (el) => !el || el.closest(".gac-landing") || reduce?.matches;

    const onDown = (e) => {
      const b = e.target.closest?.(".btn");
      if (off(b) || b.disabled) return;
      const r = b.getBoundingClientRect();
      const d = Math.max(r.width, r.height);
      const s = document.createElement("span");
      s.className = "ripple";
      s.setAttribute("aria-hidden", "true");
      s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      b.appendChild(s);
      setTimeout(() => s.remove(), 700);
    };

    let lastBtn = null;
    const onMove = (e) => {
      if (!fine?.matches) return;
      const b = e.target.closest?.(".btn-primary");
      if (lastBtn && lastBtn !== b) { lastBtn.style.removeProperty("--bx"); lastBtn.style.removeProperty("--by"); lastBtn = null; }
      if (b && !off(b)) {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--bx", `${(((e.clientX - r.left) / r.width) - 0.5) * 5}px`);
        b.style.setProperty("--by", `${(((e.clientY - r.top) / r.height) - 0.5) * 4}px`);
        lastBtn = b;
      }
      const c = e.target.closest?.(".card-hover, .glow, .kpi");
      if (c && !off(c)) {
        const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", `${e.clientX - r.left}px`);
        c.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
    };

    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointermove", onMove);
    };
  }, []);
  return null;
}
