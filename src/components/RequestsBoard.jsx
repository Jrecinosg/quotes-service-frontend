import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, GripVertical, Clock, PlayCircle, CheckCircle2 } from "lucide-react";
import { formatRequestId, formatDate } from "../utils/formatters";

// Tablero por estados (Kanban). Solo presentación + arrastrar y soltar: el cambio de estado
// real (confirmación, nota, correo al cliente) lo hace `onMove`, que es el mismo flujo del detalle.
const COLUMNS = [
  { status: "PENDING", label: "Pendiente", icon: Clock, tone: "text-amber-400", bar: "bg-amber-400" },
  { status: "IN_PROGRESS", label: "En proceso", icon: PlayCircle, tone: "text-blue-400", bar: "bg-blue-400" },
  { status: "DONE", label: "Finalizado", icon: CheckCircle2, tone: "text-green-400", bar: "bg-green-400" },
];
const LABEL = Object.fromEntries(COLUMNS.map((c) => [c.status, c.label]));
const MOVE_PX = 6; // movimiento mínimo para que cuente como arrastre (y no como clic)

function CardBody({ r, showMove, onMove }) {
  const idx = COLUMNS.findIndex((c) => c.status === r.status);
  const prev = COLUMNS[idx - 1];
  const next = COLUMNS[idx + 1];
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <Link to={`/app/requests/${r.id}`} className="text-[13px] font-bold text-blue-400 hover:underline">
          {formatRequestId(r.correlativo)}
        </Link>
        <GripVertical size={16} className="text-gray-500 shrink-0 mt-0.5" aria-hidden="true" />
      </div>
      <p className="mt-1 text-sm font-medium text-white leading-snug line-clamp-2">{r.title}</p>
      <p className="mt-2 text-xs text-gray-400 truncate">{r.client?.name}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[11px] text-gray-500 truncate">{formatDate(r.updatedAt)}</span>
        {showMove && (
          <span className="flex gap-1 shrink-0">
            <button
              type="button"
              disabled={!prev}
              onClick={() => onMove(r, prev.status)}
              aria-label={prev ? `Mover ${formatRequestId(r.correlativo)} a ${prev.label}` : "Sin estado anterior"}
              className="btn btn-icon !w-7 !h-7 disabled:opacity-25"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              type="button"
              disabled={!next}
              onClick={() => onMove(r, next.status)}
              aria-label={next ? `Mover ${formatRequestId(r.correlativo)} a ${next.label}` : "Sin estado siguiente"}
              className="btn btn-icon !w-7 !h-7 disabled:opacity-25"
            >
              <ChevronRight size={15} />
            </button>
          </span>
        )}
      </div>
    </>
  );
}

export default function RequestsBoard({ requests, onMove }) {
  const [drag, setDrag] = useState(null); // { r, w, h }: tarjeta que se está llevando
  const [over, setOver] = useState(null); // columna bajo el cursor
  const ghostRef = useRef(null);
  const pend = useRef(null);
  const overRef = useRef(null);
  const onMoveRef = useRef(onMove);
  useEffect(() => { onMoveRef.current = onMove; });

  const byStatus = useMemo(() => {
    const map = { PENDING: [], IN_PROGRESS: [], DONE: [] };
    [...requests]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .forEach((r) => map[r.status]?.push(r));
    return map;
  }, [requests]);

  const place = (x, y) => {
    const p = pend.current;
    if (ghostRef.current && p) ghostRef.current.style.transform = `translate(${x - p.ox}px, ${y - p.oy}px)`;
  };

  const handleMove = useCallback((ev) => {
    const p = pend.current;
    if (!p) return;
    if (!p.dragging) {
      if (Math.hypot(ev.clientX - p.sx, ev.clientY - p.sy) < MOVE_PX) return;
      p.dragging = true;
      document.body.classList.add("select-none", "cursor-grabbing");
      setDrag({ r: p.r, w: p.rect.width, h: p.rect.height });
    }
    place(ev.clientX, ev.clientY);
    const col = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("[data-col]")?.dataset.col || null;
    if (col !== overRef.current) {
      overRef.current = col;
      setOver(col);
    }
  }, []);

  const finish = useCallback(async (ev, cancelled) => {
    const p = pend.current;
    pend.current = null;
    document.body.classList.remove("select-none", "cursor-grabbing");
    if (!p || !p.dragging) return; // fue un clic: el enlace de la tarjeta funciona normal
    // Evita que el clic que cierra el arrastre abra el detalle por accidente.
    const stop = (e) => { e.stopPropagation(); e.preventDefault(); };
    window.addEventListener("click", stop, { capture: true, once: true });
    setTimeout(() => window.removeEventListener("click", stop, { capture: true }), 0);

    const target = cancelled ? null : overRef.current;
    overRef.current = null;
    setOver(null);
    let ok = false;
    if (target && target !== p.r.status) ok = await onMoveRef.current(p.r, target);
    if (ok) { setDrag(null); return; }
    // Sin cambio: la tarjeta vuelve a su lugar con resorte.
    const g = ghostRef.current;
    if (g) {
      g.style.transition = "transform 480ms var(--spring-soft)";
      g.style.transform = `translate(${p.rect.left}px, ${p.rect.top}px)`;
      setTimeout(() => setDrag(null), 480);
    } else setDrag(null);
  }, []);

  const start = (e, r) => {
    if (e.button !== 0 || e.pointerType === "touch") return; // en táctil se usan las flechas de la tarjeta
    if (e.target.closest("a, button")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    pend.current = { r, sx: e.clientX, sy: e.clientY, ox: e.clientX - rect.left, oy: e.clientY - rect.top, rect, dragging: false };
    const quitar = () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", alSoltar);
      window.removeEventListener("pointercancel", alCancelar);
    };
    const alSoltar = (ev) => { quitar(); finish(ev, false); };
    const alCancelar = (ev) => { quitar(); finish(ev, true); };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", alSoltar);
    window.addEventListener("pointercancel", alCancelar);
  };

  useEffect(() => () => document.body.classList.remove("select-none", "cursor-grabbing"), []);

  // Al aparecer el fantasma se coloca bajo el cursor antes del primer movimiento.
  useEffect(() => {
    const p = pend.current;
    if (drag && p && ghostRef.current) ghostRef.current.style.transform = `translate(${p.rect.left}px, ${p.rect.top}px)`;
  }, [drag]);

  return (
    <div className="grid gap-4 md:grid-cols-3 items-start">
      {COLUMNS.map(({ status, label, icon: Icon, tone, bar }) => {
        const items = byStatus[status];
        const isOver = over === status && drag && drag.r.status !== status;
        return (
          <section
            key={status}
            data-col={status}
            aria-label={`${label}: ${items.length}`}
            className={`card p-3 min-h-[200px] transition-[box-shadow,border-color] duration-300 ${isOver ? "!border-blue-400/70 shadow-[0_0_0_3px_rgba(0,123,255,0.18)]" : ""}`}
          >
            <header className="flex items-center justify-between px-1 pb-3">
              <span className={`flex items-center gap-2 text-sm font-semibold ${tone}`}>
                <span className={`w-1.5 h-4 rounded-full ${bar}`} aria-hidden="true" />
                <Icon size={16} /> {label}
              </span>
              <span className="text-xs font-bold text-gray-300 bg-white/5 rounded-full px-2 py-0.5 tabular">{items.length}</span>
            </header>
            <div className="space-y-2.5">
              {items.map((r, i) => {
                const lifted = drag?.r.id === r.id;
                return (
                  <article
                    key={r.id}
                    onPointerDown={(e) => start(e, r)}
                    style={{ "--i": Math.min(i, 8) }}
                    className={`stagger-item rounded-xl border p-3 cursor-grab touch-pan-y transition-[opacity,box-shadow,border-color] duration-200 ${
                      lifted
                        ? "opacity-30 border-dashed border-blue-400/60 bg-transparent"
                        : "border-white/10 bg-white/[0.04] hover:border-blue-400/40 hover:shadow-[0_8px_20px_-10px_rgba(0,123,255,0.5)]"
                    }`}
                  >
                    <CardBody r={r} showMove onMove={onMove} />
                  </article>
                );
              })}
              {items.length === 0 && (
                <p className="rounded-xl border border-dashed border-white/10 py-8 text-center text-xs text-gray-500">
                  {isOver ? "Suelta aquí" : "Sin solicitudes"}
                </p>
              )}
            </div>
          </section>
        );
      })}

      {drag && (
        <div ref={ghostRef} className="fixed left-0 top-0 z-[60] pointer-events-none" style={{ width: drag.w }}>
          <div className="board-ghost rounded-xl border border-blue-400/70 bg-[#10243d] p-3 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)]">
            <CardBody r={drag.r} showMove={false} />
            <p className="sr-only">Moviendo a {over ? LABEL[over] : "…"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
