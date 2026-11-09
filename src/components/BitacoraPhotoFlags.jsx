import { STAGES } from "../utils/bitacora";

// Etapa (Antes / Durante / Después) y casilla "No incluir en el informe al cliente" de una foto.
// Se usa al elegir fotos nuevas y al editar una foto ya subida.
export default function BitacoraPhotoFlags({ stage, includeInReport, onChange, disabled = false, idPrefix = "ph" }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
      <label className="flex items-center gap-2 text-xs text-gray-300" htmlFor={`${idPrefix}-stage`}>
        Etapa
        <select
          id={`${idPrefix}-stage`}
          className="field py-1 text-xs h-8 w-auto"
          value={stage || ""}
          disabled={disabled}
          onChange={(e) => onChange({ stage: e.target.value || null })}
        >
          <option value="">Sin etapa</option>
          {Object.entries(STAGES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 text-xs text-gray-300 min-h-[32px] cursor-pointer" htmlFor={`${idPrefix}-excl`}>
        <input
          id={`${idPrefix}-excl`}
          type="checkbox"
          className="w-4 h-4 accent-[#2bb8ff]"
          checked={includeInReport === false}
          disabled={disabled}
          onChange={(e) => onChange({ includeInReport: !e.target.checked })}
        />
        No incluir en el informe al cliente
      </label>
    </div>
  );
}
