import { useState, useEffect } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { clientService } from "../services/client.service";
import ClientModal from "./ClientModal";

export default function ClientSearch({ onSelect, selectedClient }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [allClients, setAllClients] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    clientService.getAll().then(setAllClients);
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      const filtered = allClients.filter(c =>
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.taxId.includes(query)
      );
      setResults(filtered);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [query, allClients]);

  const handleSelect = (client) => {
    onSelect(client);
    setIsOpen(false);
    setQuery("");
  };

  const handleClientCreated = (newClient) => {
    clientService.getAll().then(setAllClients);
    setIsModalOpen(false);
    if (newClient) {
      onSelect(newClient);
      setQuery("");
    }
  };

  if (selectedClient) {
    return (
      <div className="bg-info/10 border border-info/30 rounded-lg p-4 flex justify-between items-center">
        <div>
          <p className="font-bold text-info">{selectedClient.name}</p>
          <p className="text-sm text-info">NIT: {selectedClient.taxId}</p>
          <p className="text-xs text-info">{selectedClient.address}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)} // Deseleccionar
          className="text-info hover:text-bad"
        >
          <X size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-ink-muted w-5 h-5" />
        <input
          type="text"
          className="field w-full pl-10 pr-4 py-3"
          placeholder="Buscar cliente por nombre o NIT..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Dropdown de Resultados */}
      {isOpen && (
        <div className="card absolute z-10 w-full mt-1 max-h-60 overflow-y-auto">
          {results.map((client) => (
            <div
              key={client.id}
              onClick={() => handleSelect(client)}
              className="p-3 hover:bg-surface-hover cursor-pointer border-b border-surface-border last:border-0"
            >
              <p className="font-medium text-ink">{client.name}</p>
              <p className="text-xs text-ink-muted">{client.taxId}</p>
            </div>
          ))}

          {/* Botón para crear nuevo si no existe */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="p-3 bg-surface-base hover:bg-surface-hover cursor-pointer text-info flex items-center gap-2 font-medium border-t border-surface-border"
          >
            <UserPlus size={18} />
            Crear nuevo cliente
          </div>
        </div>
      )}

      {/* El Modal Reutilizable Escondido */}
      <ClientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleClientCreated}
      />
    </div>
  );
}