import { Calendar, MapPin, TrendingUp } from 'lucide-react';
import type { Crop } from '../App';

interface CropCardProps {
  crop: Crop;
  onClick: () => void;
}

const statusConfig = {
  growing: { label: 'Em Crescimento', color: 'bg-blue-100 text-blue-700' },
  ready: { label: 'Pronto para Colheita', color: 'bg-green-100 text-green-700' },
  harvested: { label: 'Colhido', color: 'bg-gray-100 text-gray-700' },
};

export function CropCard({ crop, onClick }: CropCardProps) {
  const status = statusConfig[crop.status];
  
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#ff6900] hover:shadow-md transition-all text-left w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-neutral-950 mb-1">{crop.name}</h3>
          <div className="flex items-center gap-1 text-[#4a5565] text-sm">
            <MapPin className="size-3.5" />
            {crop.area}
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs ${status.color}`}>
          {status.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2 text-[#6a7282]">
          <Calendar className="size-4" />
          <div>
            <div className="text-xs text-[#99a1af]">Plantio</div>
            <div>{new Date(crop.plantingDate).toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[#6a7282]">
          <TrendingUp className="size-4" />
          <div>
            <div className="text-xs text-[#99a1af]">Colheita</div>
            <div>{new Date(crop.harvestDate).toLocaleDateString('pt-BR')}</div>
          </div>
        </div>
      </div>
    </button>
  );
}
