import { ArrowLeft, Plus, TrendingUp, Calendar, Edit2, Trash2, X, Circle } from 'lucide-react';
import { useState } from 'react';

export interface Animal {
  id: string;
  name: string;
  identifier: string;
  averageDailyProduction: number;
  age?: string;
  breed?: string;
}

interface AnimalManagementProps {
  animals: Animal[];
  onBack: () => void;
  onAddAnimal: (animal: Omit<Animal, 'id'>) => void;
  onDeleteAnimal: (id: string) => void;
  productions: any[];
}

export function AnimalManagement({ animals, onBack, onAddAnimal, onDeleteAnimal, productions }: AnimalManagementProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    identifier: '',
    averageDailyProduction: '',
    age: '',
    breed: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.identifier && formData.averageDailyProduction) {
      onAddAnimal({
        name: formData.name,
        identifier: formData.identifier,
        averageDailyProduction: parseFloat(formData.averageDailyProduction),
        age: formData.age || undefined,
        breed: formData.breed || undefined,
      });
      setFormData({
        name: '',
        identifier: '',
        averageDailyProduction: '',
        age: '',
        breed: '',
      });
      setShowModal(false);
    }
  };

  // Calculations
  const totalAnimals = animals.length;
  const estimatedDailyProduction = animals.reduce((sum, animal) => sum + animal.averageDailyProduction, 0);
  const estimatedMonthlyProduction = estimatedDailyProduction * 30;
  const averagePerAnimal = totalAnimals > 0 ? estimatedDailyProduction / totalAnimals : 0;

  // Recent production data
  const last7Days = productions.slice(0, 7);
  const actualDailyAverage = last7Days.length > 0
    ? last7Days.reduce((sum, p) => sum + p.totalProduction, 0) / last7Days.length
    : 0;

  const efficiency = estimatedDailyProduction > 0 
    ? Math.round((actualDailyAverage / estimatedDailyProduction) * 100) 
    : 0;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4a90e2] to-[#357abd] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="size-6" />
          </button>
          <div>
            <h1 className="text-2xl">Gestão de Animais</h1>
            <p className="text-white/90 text-sm">{totalAnimals} {totalAnimals === 1 ? 'animal cadastrado' : 'animais cadastrados'}</p>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white py-3 rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="size-5" />
          Cadastrar Novo Animal
        </button>
      </div>

      <div className="px-6 pb-8 space-y-5">
        {/* Production Estimates */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-[#4a90e2]" />
            <h3 className="text-neutral-950">Estimativa de Produção</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600">Produção Diária Estimada</span>
              <span className="text-[#4a90e2]">{estimatedDailyProduction.toFixed(1)} L</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
              <span className="text-sm text-gray-600">Produção Mensal Estimada</span>
              <span className="text-indigo-600">{estimatedMonthlyProduction.toLocaleString('pt-BR')} L</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">Média por Animal</span>
              <span className="text-green-600">{averagePerAnimal.toFixed(1)} L/dia</span>
            </div>
          </div>
        </div>

        {/* Performance Comparison */}
        {actualDailyAverage > 0 && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="size-5 text-[#4a90e2]" />
              <h3 className="text-neutral-950">Desempenho Real vs Estimado</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Produção Real (últimos 7 dias)</span>
                <span className="text-neutral-950">{actualDailyAverage.toFixed(1)} L/dia</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Produção Estimada</span>
                <span className="text-neutral-950">{estimatedDailyProduction.toFixed(1)} L/dia</span>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Eficiência</span>
                  <span className={`${efficiency >= 90 ? 'text-green-600' : efficiency >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {efficiency}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all ${efficiency >= 90 ? 'bg-green-500' : efficiency >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(efficiency, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Animals List */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-neutral-950 mb-4">Animais Cadastrados</h3>
          
          {animals.length === 0 ? (
            <div className="text-center py-8">
              <Circle className="size-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-gray-500">Nenhum animal cadastrado ainda</p>
              <p className="text-gray-400 text-sm mt-1">Cadastre animais para estimar a produção</p>
            </div>
          ) : (
            <div className="space-y-3">
              {animals.map((animal) => (
                <div key={animal.id} className="border border-gray-200 rounded-xl p-4 hover:border-[#4a90e2] transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <div className="bg-[#4a90e2]/10 p-2 rounded-lg">
                        <Circle className="size-5 text-[#4a90e2]" fill="currentColor" />
                      </div>
                      <div>
                        <p className="text-neutral-950">{animal.name}</p>
                        <p className="text-sm text-gray-500">ID: {animal.identifier}</p>
                        {animal.breed && (
                          <p className="text-xs text-gray-400 mt-1">Raça: {animal.breed}</p>
                        )}
                        {animal.age && (
                          <p className="text-xs text-gray-400">Idade: {animal.age}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir ${animal.name}?`)) {
                          onDeleteAnimal(animal.id);
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                    >
                      <Trash2 className="size-4 text-gray-400 group-hover:text-red-500" />
                    </button>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-2 mt-2">
                    <p className="text-xs text-gray-600">Produção Média Diária</p>
                    <p className="text-[#4a90e2]">{animal.averageDailyProduction} L/dia</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-[#4a90e2]/10 to-[#357abd]/10 rounded-2xl p-5 border border-[#4a90e2]/20">
          <h4 className="text-neutral-950 mb-3">💡 Dicas</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-[#4a90e2] mt-0.5">•</span>
              <span>Mantenha o cadastro atualizado para estimativas mais precisas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4a90e2] mt-0.5">•</span>
              <span>A produção média varia conforme raça, alimentação e saúde</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4a90e2] mt-0.5">•</span>
              <span>Compare a produção real com a estimada para identificar melhorias</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Add Animal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-neutral-950 text-xl">Cadastrar Animal</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>
              <p className="text-gray-500 text-sm">Preencha os dados do animal</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-neutral-950 mb-2">Nome do Animal *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Mimosa, Estrela"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Número/Identificação *</label>
                <input
                  type="text"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  placeholder="Ex: 001, BR-1234"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Produção Média Diária (Litros) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.averageDailyProduction}
                  onChange={(e) => setFormData({ ...formData, averageDailyProduction: e.target.value })}
                  placeholder="Ex: 25.5"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Raça (Opcional)</label>
                <input
                  type="text"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="Ex: Holandesa, Jersey"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Idade (Opcional)</label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Ex: 3 anos, 5 anos"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#4a90e2] text-white py-3 rounded-lg hover:bg-[#357abd] transition-colors shadow-md"
                >
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}