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
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 flex justify-between items-center">
        <div>
          <p className="font-bold text-blue-300">{selectedClient.name}</p>
          <p className="text-sm text-blue-400">NIT: {selectedClient.taxId}</p>
          <p className="text-xs text-blue-400">{selectedClient.address}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelect(null)} // Deseleccionar
          className="text-blue-400 hover:text-red-500"
        >
          <X size={24} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
        <input
          type="text"
          className="bg-surface-base text-white placeholder:text-gray-500 w-full pl-10 pr-4 py-3 border border-surface-border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Buscar cliente por nombre o NIT..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Dropdown de Resultados */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-surface-card border border-surface-border rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {results.map((client) => (
            <div
              key={client.id}
              onClick={() => handleSelect(client)}
              className="p-3 hover:bg-surface-hover cursor-pointer border-b border-surface-border last:border-0"
            >
              <p className="font-medium text-white">{client.name}</p>
              <p className="text-xs text-gray-400">{client.taxId}</p>
            </div>
          ))}

          {/* Botón para crear nuevo si no existe */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="p-3 bg-surface-base hover:bg-surface-hover cursor-pointer text-blue-400 flex items-center gap-2 font-medium border-t border-surface-border"
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