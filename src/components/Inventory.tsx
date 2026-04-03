import { ArrowLeft, Plus, Droplet, AlertTriangle, TrendingDown, TrendingUp, X, Thermometer } from 'lucide-react';
import { useState } from 'react';

export interface MilkStorage {
  id: string;
  tankName: string;
  capacity: number;
  currentVolume: number;
  temperature: number;
  quality: 'excellent' | 'good' | 'regular';
  lastUpdated: string;
  location?: string;
}

export interface MilkMovement {
  id: string;
  tankId: string;
  tankName: string;
  type: 'in' | 'out';
  volume: number;
  date: string;
  time: string;
  reason: string;
  buyer?: string;
  notes?: string;
}

interface InventoryProps {
  inventory: MilkStorage[];
  movements: MilkMovement[];
  onBack: () => void;
  onAddItem: (tank: Omit<MilkStorage, 'id'>) => void;
  onUpdateItem: (id: string, tank: Partial<MilkStorage>) => void;
  onDeleteItem: (id: string) => void;
  onAddMovement: (movement: Omit<MilkMovement, 'id'>) => void;
}

export function Inventory({ inventory, movements, onBack, onAddItem, onUpdateItem, onDeleteItem, onAddMovement }: InventoryProps) {
  const [showTankModal, setShowTankModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  
  const [tankFormData, setTankFormData] = useState({
    tankName: '',
    capacity: '',
    currentVolume: '',
    temperature: '',
    quality: 'good' as MilkStorage['quality'],
    location: '',
  });

  const [movementFormData, setMovementFormData] = useState({
    tankId: '',
    type: 'in' as MilkMovement['type'],
    volume: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    reason: '',
    buyer: '',
    notes: '',
  });

  const handleSubmitTank = (e: React.FormEvent) => {
    e.preventDefault();
    if (tankFormData.tankName && tankFormData.capacity && tankFormData.currentVolume && tankFormData.temperature) {
      onAddItem({
        tankName: tankFormData.tankName,
        capacity: parseFloat(tankFormData.capacity),
        currentVolume: parseFloat(tankFormData.currentVolume),
        temperature: parseFloat(tankFormData.temperature),
        quality: tankFormData.quality,
        lastUpdated: new Date().toISOString(),
        location: tankFormData.location || undefined,
      });
      setTankFormData({
        tankName: '',
        capacity: '',
        currentVolume: '',
        temperature: '',
        quality: 'good',
        location: '',
      });
      setShowTankModal(false);
    }
  };

  const handleSubmitMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (movementFormData.tankId && movementFormData.volume && movementFormData.reason) {
      const tank = inventory.find(t => t.id === movementFormData.tankId);
      if (tank) {
        const volume = parseFloat(movementFormData.volume);
        const newVolume = movementFormData.type === 'in' 
          ? tank.currentVolume + volume 
          : tank.currentVolume - volume;

        if (newVolume < 0) {
          alert('Volume insuficiente no tanque!');
          return;
        }

        if (newVolume > tank.capacity) {
          alert('Volume excede a capacidade do tanque!');
          return;
        }

        onUpdateItem(tank.id, { 
          currentVolume: newVolume,
          lastUpdated: new Date().toISOString()
        });

        onAddMovement({
          tankId: tank.id,
          tankName: tank.tankName,
          type: movementFormData.type,
          volume: volume,
          date: movementFormData.date,
          time: movementFormData.time,
          reason: movementFormData.reason,
          buyer: movementFormData.buyer || undefined,
          notes: movementFormData.notes || undefined,
        });

        setMovementFormData({
          tankId: '',
          type: 'in',
          volume: '',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          reason: '',
          buyer: '',
          notes: '',
        });
        setShowMovementModal(false);
      }
    }
  };

  const totalCapacity = inventory.reduce((sum, tank) => sum + tank.capacity, 0);
  const totalVolume = inventory.reduce((sum, tank) => sum + tank.currentVolume, 0);
  const utilizationPercentage = totalCapacity > 0 ? (totalVolume / totalCapacity) * 100 : 0;
  const criticalTanks = inventory.filter(tank => (tank.currentVolume / tank.capacity) > 0.9);
  const temperatureIssues = inventory.filter(tank => tank.temperature > 4);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4a90e2] to-[#357abd] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="size-6" />
          </button>
          <div>
            <h1 className="text-2xl">Estoque de Leite</h1>
            <p className="text-white/90 text-sm">{inventory.length} {inventory.length === 1 ? 'tanque' : 'tanques'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowTankModal(true)}
            className="bg-white/20 backdrop-blur-sm border border-white/30 text-white py-3 rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="size-5" />
            Novo Tanque
          </button>
          <button
            onClick={() => setShowMovementModal(true)}
            className="bg-white/20 backdrop-blur-sm border border-white/30 text-white py-3 rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-2"
          >
            <TrendingUp className="size-5" />
            Movimentação
          </button>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-5">
        {/* Alerts */}
        {(criticalTanks.length > 0 || temperatureIssues.length > 0) && (
          <div className="space-y-3">
            {criticalTanks.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-orange-600 mt-0.5" />
                  <div>
                    <p className="text-neutral-950 mb-1">Atenção: Tanque(s) quase cheio(s)!</p>
                    <p className="text-sm text-gray-600">
                      {criticalTanks.length} {criticalTanks.length === 1 ? 'tanque está' : 'tanques estão'} acima de 90% da capacidade
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {temperatureIssues.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Thermometer className="size-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-neutral-950 mb-1">Alerta de Temperatura!</p>
                    <p className="text-sm text-gray-600">
                      {temperatureIssues.length} {temperatureIssues.length === 1 ? 'tanque está' : 'tanques estão'} acima de 4°C
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-neutral-950 mb-4">Resumo Geral</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600">Volume Total Armazenado</span>
              <span className="text-[#4a90e2]">{totalVolume.toFixed(1)} L</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
              <span className="text-sm text-gray-600">Capacidade Total</span>
              <span className="text-indigo-600">{totalCapacity.toFixed(1)} L</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">Espaço Disponível</span>
              <span className="text-green-600">{(totalCapacity - totalVolume).toFixed(1)} L</span>
            </div>
            <div className="pt-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Taxa de Ocupação</span>
                <span className={`${
                  utilizationPercentage > 90 ? 'text-red-600' :
                  utilizationPercentage > 70 ? 'text-orange-600' :
                  utilizationPercentage > 50 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {utilizationPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all ${
                    utilizationPercentage > 90 ? 'bg-red-500' :
                    utilizationPercentage > 70 ? 'bg-orange-500' :
                    utilizationPercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tanks List */}
        <div className="space-y-3">
          <h3 className="text-neutral-950">Tanques de Armazenamento</h3>
          
          {inventory.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <Droplet className="size-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-gray-500">Nenhum tanque cadastrado</p>
            </div>
          ) : (
            inventory.map((tank) => {
              const fillPercentage = (tank.currentVolume / tank.capacity) * 100;
              const isCritical = fillPercentage > 90;
              const tempIssue = tank.temperature > 4;
              
              return (
                <div 
                  key={tank.id} 
                  className={`bg-white rounded-xl p-4 shadow-sm border ${
                    isCritical || tempIssue ? 'border-orange-300 bg-orange-50/30' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplet className="size-5 text-[#4a90e2]" fill="currentColor" />
                        <h4 className="text-neutral-950">{tank.tankName}</h4>
                        {isCritical && (
                          <AlertTriangle className="size-4 text-orange-600" />
                        )}
                        {tempIssue && (
                          <Thermometer className="size-4 text-red-600" />
                        )}
                      </div>
                      {tank.location && (
                        <p className="text-xs text-gray-500 mb-1">📍 {tank.location}</p>
                      )}
                      <p className="text-xs text-gray-400">
                        Atualizado: {new Date(tank.lastUpdated).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja excluir o tanque ${tank.tankName}?`)) {
                          onDeleteItem(tank.id);
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="size-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Volume Atual</p>
                      <p className="text-neutral-950">{tank.currentVolume.toFixed(1)} L</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Capacidade</p>
                      <p className="text-neutral-950">{tank.capacity.toFixed(1)} L</p>
                    </div>
                    <div className={`rounded-lg p-2 ${tempIssue ? 'bg-red-50' : 'bg-blue-50'}`}>
                      <p className="text-xs text-gray-500">Temperatura</p>
                      <p className={tempIssue ? 'text-red-600' : 'text-[#4a90e2]'}>
                        {tank.temperature.toFixed(1)}°C
                      </p>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Nível de Preenchimento</span>
                      <span className={`text-xs ${
                        fillPercentage > 90 ? 'text-red-600' :
                        fillPercentage > 70 ? 'text-orange-600' :
                        fillPercentage > 50 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {fillPercentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          fillPercentage > 90 ? 'bg-red-500' :
                          fillPercentage > 70 ? 'bg-orange-500' :
                          fillPercentage > 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(fillPercentage, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tank.quality === 'excellent' ? 'bg-green-100 text-green-700' :
                      tank.quality === 'good' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      Qualidade: {tank.quality === 'excellent' ? 'Excelente' :
                                  tank.quality === 'good' ? 'Boa' : 'Regular'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Recent Movements */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-neutral-950 mb-4">Movimentações Recentes</h3>
          {movements.length === 0 ? (
            <p className="text-center text-gray-500 py-4 text-sm">Nenhuma movimentação registrada</p>
          ) : (
            <div className="space-y-3">
              {movements.slice(0, 10).map((movement) => (
                <div key={movement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    movement.type === 'in' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {movement.type === 'in' ? (
                      <TrendingUp className="size-4 text-green-600" />
                    ) : (
                      <TrendingDown className="size-4 text-red-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-neutral-950">{movement.tankName}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        movement.type === 'in' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {movement.type === 'in' ? 'Entrada' : 'Saída'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{movement.reason}</p>
                    {movement.buyer && (
                      <p className="text-xs text-gray-400">Comprador: {movement.buyer}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(movement.date).toLocaleDateString('pt-BR')} às {movement.time}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`${movement.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.type === 'in' ? '+' : '-'}{movement.volume} L
                    </p>
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
              <span>Mantenha a temperatura do leite entre 2°C e 4°C</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4a90e2] mt-0.5">•</span>
              <span>Leite resfriado pode ser armazenado por até 48 horas</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4a90e2] mt-0.5">•</span>
              <span>Programe entregas quando tanques atingirem 80% da capacidade</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Add Tank Modal */}
      {showTankModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-neutral-950 text-xl">Novo Tanque</h2>
                <button 
                  onClick={() => setShowTankModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>
              <p className="text-gray-500 text-sm">Cadastre um novo tanque de armazenamento</p>
            </div>

            <form onSubmit={handleSubmitTank} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-neutral-950 mb-2">Nome do Tanque *</label>
                <input
                  type="text"
                  value={tankFormData.tankName}
                  onChange={(e) => setTankFormData({ ...tankFormData, tankName: e.target.value })}
                  placeholder="Ex: Tanque 1, Resfriador Principal"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-950 mb-2">Capacidade (L) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tankFormData.capacity}
                    onChange={(e) => setTankFormData({ ...tankFormData, capacity: e.target.value })}
                    placeholder="1000"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-950 mb-2">Volume Atual (L) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tankFormData.currentVolume}
                    onChange={(e) => setTankFormData({ ...tankFormData, currentVolume: e.target.value })}
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Temperatura (°C) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={tankFormData.temperature}
                  onChange={(e) => setTankFormData({ ...tankFormData, temperature: e.target.value })}
                  placeholder="3.5"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Qualidade *</label>
                <select
                  value={tankFormData.quality}
                  onChange={(e) => setTankFormData({ ...tankFormData, quality: e.target.value as MilkStorage['quality'] })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                >
                  <option value="excellent">Excelente</option>
                  <option value="good">Boa</option>
                  <option value="regular">Regular</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Localização (Opcional)</label>
                <input
                  type="text"
                  value={tankFormData.location}
                  onChange={(e) => setTankFormData({ ...tankFormData, location: e.target.value })}
                  placeholder="Ex: Sala de Ordenha, Depósito"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTankModal(false)}
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

      {/* Add Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-neutral-950 text-xl">Movimentação de Leite</h2>
                <button 
                  onClick={() => setShowMovementModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>
              <p className="text-gray-500 text-sm">Registre entrada ou saída de leite</p>
            </div>

            <form onSubmit={handleSubmitMovement} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-neutral-950 mb-2">Tanque *</label>
                <select
                  value={movementFormData.tankId}
                  onChange={(e) => setMovementFormData({ ...movementFormData, tankId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                >
                  <option value="">Selecione um tanque</option>
                  {inventory.map(tank => (
                    <option key={tank.id} value={tank.id}>
                      {tank.tankName} ({tank.currentVolume.toFixed(1)}L / {tank.capacity.toFixed(1)}L)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Tipo de Movimentação *</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMovementFormData({ ...movementFormData, type: 'in' })}
                    className={`py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      movementFormData.type === 'in'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingUp className="size-5" />
                    Entrada
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementFormData({ ...movementFormData, type: 'out' })}
                    className={`py-3 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                      movementFormData.type === 'out'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <TrendingDown className="size-5" />
                    Saída
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Volume (Litros) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={movementFormData.volume}
                  onChange={(e) => setMovementFormData({ ...movementFormData, volume: e.target.value })}
                  placeholder="0"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-950 mb-2">Data *</label>
                  <input
                    type="date"
                    value={movementFormData.date}
                    onChange={(e) => setMovementFormData({ ...movementFormData, date: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-950 mb-2">Hora *</label>
                  <input
                    type="time"
                    value={movementFormData.time}
                    onChange={(e) => setMovementFormData({ ...movementFormData, time: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Motivo *</label>
                <input
                  type="text"
                  value={movementFormData.reason}
                  onChange={(e) => setMovementFormData({ ...movementFormData, reason: e.target.value })}
                  placeholder="Ex: Coleta da manhã, Entrega, Transferência"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

              {movementFormData.type === 'out' && (
                <div>
                  <label className="block text-sm text-neutral-950 mb-2">Comprador (Opcional)</label>
                  <input
                    type="text"
                    value={movementFormData.buyer}
                    onChange={(e) => setMovementFormData({ ...movementFormData, buyer: e.target.value })}
                    placeholder="Ex: Laticínio Bom Leite"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Observações</label>
                <textarea
                  value={movementFormData.notes}
                  onChange={(e) => setMovementFormData({ ...movementFormData, notes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#4a90e2] text-white py-3 rounded-lg hover:bg-[#357abd] transition-colors shadow-md"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
