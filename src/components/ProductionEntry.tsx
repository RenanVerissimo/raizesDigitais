import { ArrowLeft, Calendar, Sunrise, Sunset, Star } from 'lucide-react';
import { useState } from 'react';

interface ProductionEntryProps {
  onBack: () => void;
  onSubmit: (production: {
    date: string;
    morningProduction: number;
    afternoonProduction: number;
    quality: 'excellent' | 'good' | 'regular';
    notes?: string;
  }) => void;
}

export function ProductionEntry({ onBack, onSubmit }: ProductionEntryProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    morningProduction: '',
    afternoonProduction: '',
    quality: 'good' as 'excellent' | 'good' | 'regular',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.date && formData.morningProduction && formData.afternoonProduction) {
      onSubmit({
        date: formData.date,
        morningProduction: parseFloat(formData.morningProduction),
        afternoonProduction: parseFloat(formData.afternoonProduction),
        quality: formData.quality,
        notes: formData.notes || undefined,
      });
    }
  };

  const total = (parseFloat(formData.morningProduction) || 0) + (parseFloat(formData.afternoonProduction) || 0);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4a90e2] to-[#357abd] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="size-6" />
          </button>
          <div>
            <h1 className="text-2xl">Nova Coleta</h1>
            <p className="text-white/90 text-sm">Registre a produção do dia</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pb-8 space-y-5">
        {/* Date */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm text-neutral-950 mb-3 flex items-center gap-2">
            <Calendar className="size-4 text-[#4a90e2]" />
            Data da Coleta
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
            required
          />
        </div>

        {/* Morning Production */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm text-neutral-950 mb-3 flex items-center gap-2">
            <Sunrise className="size-4 text-orange-500" />
            Produção da Manhã (Litros)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.morningProduction}
            onChange={(e) => setFormData({ ...formData, morningProduction: e.target.value })}
            placeholder="Ex: 450"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
            required
          />
        </div>

        {/* Afternoon Production */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm text-neutral-950 mb-3 flex items-center gap-2">
            <Sunset className="size-4 text-indigo-500" />
            Produção da Tarde (Litros)
          </label>
          <input
            type="number"
            step="0.1"
            value={formData.afternoonProduction}
            onChange={(e) => setFormData({ ...formData, afternoonProduction: e.target.value })}
            placeholder="Ex: 380"
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
            required
          />
        </div>

        {/* Total Display */}
        {total > 0 && (
          <div className="bg-gradient-to-r from-[#4a90e2]/10 to-[#357abd]/10 rounded-2xl p-5 border border-[#4a90e2]/20">
            <p className="text-sm text-gray-600 mb-1">Produção Total</p>
            <p className="text-3xl text-[#4a90e2]">{total.toFixed(1)} L</p>
          </div>
        )}

        {/* Quality */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm text-neutral-950 mb-3 flex items-center gap-2">
            <Star className="size-4 text-yellow-500" />
            Qualidade do Leite
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, quality: 'excellent' })}
              className={`py-3 rounded-lg text-sm transition-colors ${
                formData.quality === 'excellent'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Excelente
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, quality: 'good' })}
              className={`py-3 rounded-lg text-sm transition-colors ${
                formData.quality === 'good'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Boa
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, quality: 'regular' })}
              className={`py-3 rounded-lg text-sm transition-colors ${
                formData.quality === 'regular'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Regular
            </button>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <label className="block text-sm text-neutral-950 mb-3">
            Observações (Opcional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Ex: Animais saudáveis, boa alimentação..."
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-[#4a90e2] text-white py-4 rounded-xl hover:bg-[#357abd] transition-colors shadow-md"
        >
          Salvar Registro
        </button>
      </form>
    </div>
  );
}
