import { X, MapPin, Calendar, TrendingUp, Trash2 } from 'lucide-react';
import type { Crop } from '../App';

interface CropDetailModalProps {
  crop: Crop;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: Crop['status']) => void;
}

const statusConfig = {
  growing: { label: 'Em Crescimento', color: 'bg-blue-100 text-blue-700' },
  ready: { label: 'Pronto para Colheita', color: 'bg-green-100 text-green-700' },
  harvested: { label: 'Colhido', color: 'bg-gray-100 text-gray-700' },
};

export function CropDetailModal({ crop, onClose, onDelete, onUpdateStatus }: CropDetailModalProps) {
  const status = statusConfig[crop.status];
  
  const calculateDaysRemaining = () => {
    const today = new Date();
    const harvest = new Date(crop.harvestDate);
    const diff = harvest.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const daysRemaining = calculateDaysRemaining();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-neutral-950">{crop.name}</h2>
            <button 
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#4a5565]">
              <MapPin className="size-5" />
              <span>{crop.area}</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${status.color}`}>
              {status.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-[#6a7282] mb-2">
                <Calendar className="size-5" />
                <span className="text-sm">Data de Plantio</span>
              </div>
              <p className="text-neutral-950">
                {new Date(crop.plantingDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-[#6a7282] mb-2">
                <TrendingUp className="size-5" />
                <span className="text-sm">Previsão de Colheita</span>
              </div>
              <p className="text-neutral-950">
                {new Date(crop.harvestDate).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          </div>

          {daysRemaining > 0 && crop.status !== 'harvested' && (
            <div className="bg-[#fff7ed] border border-[#ff6900]/20 rounded-lg p-4 text-center">
              <p className="text-[#f54900]">
                {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} até a colheita
              </p>
            </div>
          )}

          <div>
            <p className="text-sm text-[#6a7282] mb-3">Atualizar Status</p>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateStatus(crop.id, 'growing')}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  crop.status === 'growing'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Crescimento
              </button>
              <button
                onClick={() => onUpdateStatus(crop.id, 'ready')}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  crop.status === 'ready'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pronto
              </button>
              <button
                onClick={() => onUpdateStatus(crop.id, 'harvested')}
                className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                  crop.status === 'harvested'
                    ? 'bg-gray-200 text-gray-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Colhido
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              if (confirm('Tem certeza que deseja excluir este cultivo?')) {
                onDelete(crop.id);
              }
            }}
            className="w-full bg-red-50 text-red-600 py-3 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="size-4" />
            Excluir Cultivo
          </button>
        </div>
      </div>
    </div>
  );
}
