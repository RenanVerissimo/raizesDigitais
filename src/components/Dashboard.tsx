import { Milk, Plus, History, BarChart3, LogOut, TrendingUp, Calendar, Circle, ShoppingCart, DollarSign, Package } from 'lucide-react';
import type { User, ProductionRecord } from '../App';
import type { Animal } from './AnimalManagement';

interface DashboardProps {
  user: User;
  productions: ProductionRecord[];
  animals: Animal[];
  onNavigate: (screen: 'entry' | 'history' | 'analytics' | 'animals' | 'purchases' | 'financial' | 'inventory') => void;
  onLogout: () => void;
}

export function Dashboard({ user, productions, animals, onNavigate, onLogout }: DashboardProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayProduction = productions.find(p => p.date === today);
  
  const last7Days = productions.slice(0, 7);
  const averageProduction = last7Days.length > 0
    ? Math.round(last7Days.reduce((sum, p) => sum + p.totalProduction, 0) / last7Days.length)
    : 0;

  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const monthlyProduction = productions
    .filter(p => {
      const date = new Date(p.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    })
    .reduce((sum, p) => sum + p.totalProduction, 0);

  const totalAnimals = animals.length;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4a90e2] to-[#357abd] text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl mb-1">{user.farmName}</h1>
            <p className="text-white/90 text-sm">Olá, {user.name}</p>
          </div>
          <button
            onClick={onLogout}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <LogOut className="size-5" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <p className="text-white/80 text-xs mb-1">Hoje</p>
            <p className="text-2xl">{todayProduction ? todayProduction.totalProduction : 0}L</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <p className="text-white/80 text-xs mb-1">Média 7 dias</p>
            <p className="text-2xl">{averageProduction}L</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <p className="text-white/80 text-xs mb-1">Animais</p>
            <p className="text-2xl">{totalAnimals}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Monthly Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#4a90e2]/10 p-2 rounded-lg">
              <Calendar className="size-5 text-[#4a90e2]" />
            </div>
            <div>
              <p className="text-neutral-950">Produção do Mês</p>
              <p className="text-gray-500 text-sm">
                {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <p className="text-3xl text-neutral-950">{monthlyProduction.toLocaleString('pt-BR')}</p>
            <p className="text-gray-500 mb-1">litros</p>
          </div>
        </div>

        {/* Recent Production */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-neutral-950">Últimos Registros</h3>
            <button
              onClick={() => onNavigate('history')}
              className="text-[#4a90e2] text-sm"
            >
              Ver todos
            </button>
          </div>
          {productions.slice(0, 3).map((prod) => (
            <div key={prod.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-neutral-950">{new Date(prod.date).toLocaleDateString('pt-BR')}</p>
                <p className="text-sm text-gray-500">
                  Manhã: {prod.morningProduction}L | Tarde: {prod.afternoonProduction}L
                </p>
              </div>
              <div className="text-right">
                <p className="text-neutral-950">{prod.totalProduction}L</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  prod.quality === 'excellent' ? 'bg-green-100 text-green-700' :
                  prod.quality === 'good' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {prod.quality === 'excellent' ? 'Excelente' :
                   prod.quality === 'good' ? 'Boa' : 'Regular'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid gap-3">
          <button
            onClick={() => onNavigate('entry')}
            className="bg-[#4a90e2] text-white rounded-xl p-4 flex items-center justify-between hover:bg-[#357abd] transition-colors shadow-md"
          >
            <div className="flex items-center gap-3">
              <Plus className="size-6" />
              <div className="text-left">
                <p>Nova Coleta</p>
                <p className="text-sm text-white/80">Registrar produção do dia</p>
              </div>
            </div>
            <TrendingUp className="size-5" />
          </button>

          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => onNavigate('animals')}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <Circle className="size-6 text-[#4a90e2]" fill="currentColor" />
              <span className="text-sm text-neutral-950">Animais</span>
            </button>

            <button
              onClick={() => onNavigate('history')}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <History className="size-6 text-[#4a90e2]" />
              <span className="text-sm text-neutral-950">Histórico</span>
            </button>

            <button
              onClick={() => onNavigate('analytics')}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <BarChart3 className="size-6 text-[#4a90e2]" />
              <span className="text-sm text-neutral-950">Gráficos</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onNavigate('purchases')}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="size-6 text-[#4a90e2]" />
              <span className="text-sm text-neutral-950">Compras</span>
            </button>

            <button
              onClick={() => onNavigate('financial')}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
            >
              <DollarSign className="size-6 text-[#4a90e2]" />
              <span className="text-sm text-neutral-950">Financeiro</span>
            </button>

            <button
              onClick={() => onNavigate('inventory')}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition-colors col-span-2"
            >
              <Package className="size-6 text-[#4a90e2]" />
              <span className="text-sm text-neutral-950">Controle de Estoque</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}