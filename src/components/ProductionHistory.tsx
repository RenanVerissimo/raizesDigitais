import { ArrowLeft, Search, Trash2, Sunrise, Sunset, Filter } from 'lucide-react';
import { useState } from 'react';
import type { ProductionRecord } from '../App';

interface ProductionHistoryProps {
  productions: ProductionRecord[];
  onBack: () => void;
  onDelete: (id: string) => void;
}

export function ProductionHistory({ productions, onBack, onDelete }: ProductionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterQuality, setFilterQuality] = useState<'all' | 'excellent' | 'good' | 'regular'>('all');

  const filteredProductions = productions.filter(prod => {
    const matchesSearch = prod.date.includes(searchTerm) || 
                          prod.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesQuality = filterQuality === 'all' || prod.quality === filterQuality;
    return matchesSearch && matchesQuality;
  });

  const totalLiters = filteredProductions.reduce((sum, p) => sum + p.totalProduction, 0);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4a90e2] to-[#357abd] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="size-6" />
          </button>
          <div>
            <h1 className="text-2xl">Histórico</h1>
            <p className="text-white/90 text-sm">{filteredProductions.length} registros</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por data ou observação..."
            className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/60 rounded-lg pl-11 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      <div className="px-6 pb-8 space-y-4">
        {/* Filter */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="size-4 text-[#4a90e2]" />
            <span className="text-sm text-neutral-950">Filtrar por Qualidade</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterQuality('all')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterQuality === 'all'
                  ? 'bg-[#4a90e2] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterQuality('excellent')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterQuality === 'excellent'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Excelente
            </button>
            <button
              onClick={() => setFilterQuality('good')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterQuality === 'good'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Boa
            </button>
            <button
              onClick={() => setFilterQuality('regular')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterQuality === 'regular'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Regular
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gradient-to-r from-[#4a90e2]/10 to-[#357abd]/10 rounded-xl p-4 border border-[#4a90e2]/20">
          <p className="text-sm text-gray-600 mb-1">Total do Período Filtrado</p>
          <p className="text-2xl text-[#4a90e2]">{totalLiters.toLocaleString('pt-BR')} litros</p>
        </div>

        {/* Productions List */}
        <div className="space-y-3">
          {filteredProductions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <p className="text-gray-500">Nenhum registro encontrado</p>
            </div>
          ) : (
            filteredProductions.map((prod) => (
              <div key={prod.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-neutral-950 mb-1">
                      {new Date(prod.date).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      prod.quality === 'excellent' ? 'bg-green-100 text-green-700' :
                      prod.quality === 'good' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {prod.quality === 'excellent' ? 'Excelente' :
                       prod.quality === 'good' ? 'Boa' : 'Regular'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('Deseja excluir este registro?')) {
                        onDelete(prod.id);
                      }
                    }}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                  >
                    <Trash2 className="size-4 text-gray-400 group-hover:text-red-500" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Sunrise className="size-3 text-orange-600" />
                      <span className="text-xs text-orange-600">Manhã</span>
                    </div>
                    <p className="text-neutral-950">{prod.morningProduction}L</p>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <Sunset className="size-3 text-indigo-600" />
                      <span className="text-xs text-indigo-600">Tarde</span>
                    </div>
                    <p className="text-neutral-950">{prod.afternoonProduction}L</p>
                  </div>
                  <div className="bg-[#4a90e2]/10 rounded-lg p-3">
                    <p className="text-xs text-[#4a90e2] mb-1">Total</p>
                    <p className="text-neutral-950">{prod.totalProduction}L</p>
                  </div>
                </div>

                {prod.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Observações</p>
                    <p className="text-sm text-gray-700">{prod.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
