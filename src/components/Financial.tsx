import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import type { Purchase } from './Purchases';

export interface Revenue {
  id: string;
  date: string;
  liters: number;
  pricePerLiter: number;
  totalAmount: number;
  buyer: string;
  notes?: string;
}

interface FinancialProps {
  revenues: Revenue[];
  purchases: Purchase[];
  onBack: () => void;
  onAddRevenue: (revenue: Omit<Revenue, 'id' | 'totalAmount'>) => void;
  onDeleteRevenue: (id: string) => void;
}

export function Financial({ revenues, purchases, onBack, onAddRevenue, onDeleteRevenue }: FinancialProps) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    liters: '',
    pricePerLiter: '',
    buyer: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.liters && formData.pricePerLiter && formData.buyer) {
      onAddRevenue({
        date: formData.date,
        liters: parseFloat(formData.liters),
        pricePerLiter: parseFloat(formData.pricePerLiter),
        buyer: formData.buyer,
        notes: formData.notes || undefined,
      });
      setFormData({
        date: new Date().toISOString().split('T')[0],
        liters: '',
        pricePerLiter: '',
        buyer: '',
        notes: '',
      });
      setShowModal(false);
    }
  };

  // Financial calculations
  const totalRevenue = revenues.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalExpenses = purchases
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.totalPrice, 0);
  const balance = totalRevenue - totalExpenses;

  // Monthly data for charts
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const monthlyRevenue = revenues
    .filter(r => {
      const date = new Date(r.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
    })
    .reduce((sum, r) => sum + r.totalAmount, 0);

  const monthlyExpenses = purchases
    .filter(p => {
      const date = new Date(p.date);
      return date.getMonth() === thisMonth && date.getFullYear() === thisYear && p.status === 'completed';
    })
    .reduce((sum, p) => sum + p.totalPrice, 0);

  const monthlyBalance = monthlyRevenue - monthlyExpenses;

  // Expenses by category
  const expensesByCategory = purchases
    .filter(p => p.status === 'completed')
    .reduce((acc, p) => {
      const category = p.category;
      acc[category] = (acc[category] || 0) + p.totalPrice;
      return acc;
    }, {} as Record<string, number>);

  const categoryData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name: name === 'feed' ? 'Ração' :
          name === 'medicine' ? 'Medicamentos' :
          name === 'equipment' ? 'Equipamentos' :
          name === 'maintenance' ? 'Manutenção' : 'Outros',
    value,
  }));

  const COLORS = ['#ff9800', '#f44336', '#2196f3', '#9c27b0', '#607d8b'];

  // Last 6 months data
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - (5 - i));
    const month = date.getMonth();
    const year = date.getFullYear();

    const revenue = revenues
      .filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((sum, r) => sum + r.totalAmount, 0);

    const expenses = purchases
      .filter(p => {
        const d = new Date(p.date);
        return d.getMonth() === month && d.getFullYear() === year && p.status === 'completed';
      })
      .reduce((sum, p) => sum + p.totalPrice, 0);

    return {
      month: date.toLocaleDateString('pt-BR', { month: 'short' }),
      Receita: revenue,
      Despesa: expenses,
      Saldo: revenue - expenses,
    };
  });

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4a90e2] to-[#357abd] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="size-6" />
          </button>
          <div>
            <h1 className="text-2xl">Financeiro</h1>
            <p className="text-white/90 text-sm">Controle de receitas e despesas</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white py-3 rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="size-5" />
          Registrar Receita (Venda)
        </button>
      </div>

      <div className="px-6 pb-8 space-y-5">
        {/* Summary Cards */}
        <div className="grid gap-3">
          <div className={`rounded-xl p-5 shadow-sm border ${
            balance >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                Saldo Total
              </span>
              <DollarSign className={`size-5 ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <p className={`text-3xl ${balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              R$ {balance.toFixed(2)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="size-4 text-green-600" />
                <span className="text-xs text-gray-500">Receitas</span>
              </div>
              <p className="text-xl text-green-600">R$ {totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="size-4 text-red-600" />
                <span className="text-xs text-gray-500">Despesas</span>
              </div>
              <p className="text-xl text-red-600">R$ {totalExpenses.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-neutral-950 mb-4">Mês Atual</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">Receitas</span>
              <span className="text-green-600">R$ {monthlyRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm text-gray-600">Despesas</span>
              <span className="text-red-600">R$ {monthlyExpenses.toFixed(2)}</span>
            </div>
            <div className={`flex justify-between items-center p-3 rounded-lg ${
              monthlyBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
            }`}>
              <span className="text-sm text-gray-600">Saldo do Mês</span>
              <span className={monthlyBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}>
                R$ {monthlyBalance.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Revenue vs Expenses Chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-neutral-950 mb-4">Últimos 6 Meses</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Receita" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Despesa" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cash Flow Chart */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-neutral-950 mb-4">Fluxo de Caixa</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={last6Months}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 11 }} stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => `R$ ${value.toFixed(2)}`}
              />
              <Line 
                type="monotone" 
                dataKey="Saldo" 
                stroke="#4a90e2" 
                strokeWidth={3}
                dot={{ fill: '#4a90e2', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expenses by Category */}
        {categoryData.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-neutral-950 mb-4">Despesas por Categoria</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Recent Revenues */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-neutral-950 mb-4">Receitas Recentes</h3>
          {revenues.length === 0 ? (
            <p className="text-center text-gray-500 py-4">Nenhuma receita registrada</p>
          ) : (
            <div className="space-y-3">
              {revenues.slice(0, 5).map((revenue) => (
                <div key={revenue.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-neutral-950">{revenue.buyer}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(revenue.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Deseja excluir esta receita?')) {
                          onDeleteRevenue(revenue.id);
                        }
                      }}
                      className="p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <X className="size-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{revenue.liters}L × R$ {revenue.pricePerLiter.toFixed(2)}</span>
                    <span className="text-green-600">R$ {revenue.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Revenue Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-neutral-950 text-xl">Registrar Receita</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>
              <p className="text-gray-500 text-sm">Registre uma venda de leite</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-neutral-950 mb-2">Data *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Litros Vendidos *</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.liters}
                  onChange={(e) => setFormData({ ...formData, liters: e.target.value })}
                  placeholder="Ex: 500"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Preço por Litro *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pricePerLiter}
                  onChange={(e) => setFormData({ ...formData, pricePerLiter: e.target.value })}
                  placeholder="Ex: 2.50"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

              {formData.liters && formData.pricePerLiter && (
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl text-green-600">
                    R$ {(parseFloat(formData.liters) * parseFloat(formData.pricePerLiter)).toFixed(2)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Comprador *</label>
                <input
                  type="text"
                  value={formData.buyer}
                  onChange={(e) => setFormData({ ...formData, buyer: e.target.value })}
                  placeholder="Nome do comprador/laticínio"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Observações</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={2}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent resize-none"
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
