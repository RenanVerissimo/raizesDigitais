import { Plus, Sprout } from 'lucide-react';
import type { Crop } from '../App';
import { CropCard } from './CropCard';

interface CropsListProps {
  crops: Crop[];
  onNewCrop: () => void;
  onSelectCrop: (crop: Crop) => void;
}

export function CropsList({ crops, onNewCrop, onSelectCrop }: CropsListProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[#f54900] text-xl">Gerenciamento de Cultivos</p>
          <p className="text-[#4a5565]">Acompanhe suas plantações</p>
        </div>
        <button 
          onClick={onNewCrop}
          className="bg-[#ff6900] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#e55f00] transition-colors"
        >
          <Plus className="size-4" />
          Novo Cultivo
        </button>
      </div>

      {crops.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Sprout className="size-12 text-gray-300" strokeWidth={1.5} />
            <p className="text-[#6a7282]">Nenhum cultivo cadastrado ainda</p>
            <p className="text-[#99a1af] text-sm">Clique em "Novo Cultivo" para começar</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {crops.map(crop => (
            <CropCard 
              key={crop.id} 
              crop={crop} 
              onClick={() => onSelectCrop(crop)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
