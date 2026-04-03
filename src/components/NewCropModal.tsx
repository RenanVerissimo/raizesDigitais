import { X, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface NewCropModalProps {
  onClose: () => void;
  onSubmit: (crop: { area: string; name: string; plantingDate: string; harvestDate: string }) => void;
}

const areas = [
  'Área Norte',
  'Área Sul',
  'Área Leste',
  'Área Oeste',
  'Área Central',
];

export function NewCropModal({ onClose, onSubmit }: NewCropModalProps) {
  const [isAreaOpen, setIsAreaOpen] = useState(false);
  const [formData, setFormData] = useState({
    area: '',
    name: '',
    plantingDate: '',
    harvestDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.area && formData.name && formData.plantingDate && formData.harvestDate) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-neutral-950">Novo Cultivo</h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
          <p className="text-[#717182] text-sm">Registre uma nova plantação</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-neutral-950 mb-2">Área</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAreaOpen(!isAreaOpen)}
                className="w-full bg-[#f3f3f5] rounded-lg px-3 py-2 flex items-center justify-between text-left"
              >
                <span className={formData.area ? 'text-neutral-950' : 'text-[#717182]'}>
                  {formData.area || 'Selecione a área'}
                </span>
                <ChevronDown className="size-4 text-[#717182]" />
              </button>
              
              {isAreaOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {areas.map((area) => (
                    <button
                      key={area}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, area });
                        setIsAreaOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {area}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-950 mb-2">Nome da Cultura</label>
            <input
              type="text"
              placeholder="Ex: Milho, Soja, Café"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-[#f3f3f5] rounded-lg px-3 py-2 placeholder:text-[#717182]"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-950 mb-2">Data de Plantio</label>
            <input
              type="date"
              value={formData.plantingDate}
              onChange={(e) => setFormData({ ...formData, plantingDate: e.target.value })}
              className="w-full bg-[#f3f3f5] rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-neutral-950 mb-2">Previsão de Colheita</label>
            <input
              type="date"
              value={formData.harvestDate}
              onChange={(e) => setFormData({ ...formData, harvestDate: e.target.value })}
              className="w-full bg-[#f3f3f5] rounded-lg px-3 py-2"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#ff6900] text-white py-2 rounded-lg hover:bg-[#e55f00] transition-colors"
          >
            Cadastrar
          </button>
        </form>
      </div>
    </div>
  );
}
