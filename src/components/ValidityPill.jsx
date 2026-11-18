// Vigencia derivada del campo real validUntil. Si la cotización no tiene
// fecha de vencimiento guardada, se dice tal cual -no se asume "vigente".
export default function ValidityPill({ validUntil }) {
    if (!validUntil) {
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-tint/10 text-ink whitespace-nowrap">Sin fecha</span>;
    }
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const expired = new Date(validUntil) < startOfToday;
    return expired ? (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-bad/15 text-bad whitespace-nowrap">Vencida</span>
    ) : (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-ok/15 text-ok whitespace-nowrap">Vigente</span>
    );
}
