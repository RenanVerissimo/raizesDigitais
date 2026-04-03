import { ArrowLeft, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ProductionRecord } from '../App';

interface AnalyticsProps {
  productions: ProductionRecord[];
  onBack: () => void;
}

export function Analytics({ productions, onBack }: AnalyticsProps) {
  // Prepare data for charts
  const last30Days = productions.slice(0, 30).reverse();
  
  const dailyData = last30Days.map(prod => ({
    date: new Date(prod.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    Manhã: prod.morningProduction,
    Tarde: prod.afternoonProduction,
    Total: prod.totalProduction,
  }));

  const qualityData = [
    { 
      name: 'Excelente', 
      value: productions.filter(p => p.quality === 'excellent').length,
      color: '#10b981'
    },
    { 
      name: 'Boa', 
      value: productions.filter(p => p.quality === 'good').length,
      color: '#3b82f6'
    },
    { 
      name: 'Regular', 
      value: productions.filter(p => p.quality === 'regular').length,
      color: '#eab308'
    },
  ].filter(item => item.value > 0);

  const averageProduction = productions.length > 0
    ? Math.round(productions.reduce((sum, p) => sum + p.totalProduction, 0) / productions.length)
    : 0;

  const totalProduction = productions.reduce((sum, p) => sum + p.totalProduction, 0);

  const maxProduction = Math.max(...productions.map(p => p.totalProduction));
  const minProduction = Math.min(...productions.map(p => p.totalProduction));

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4a90e2] to-[#357abd] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="size-6" />
          </button>
          <div>
            <h1 className="text-2xl">Análises e Gráficos</h1>
            <p className="text-white/90 text-sm">Visualize o desempenho da produção</p>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 space-y-5">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="size-4 text-green-500" />
              <span className="text-xs text-gray-500">Média Diária</span>
            </div>
            <p className="text-2xl text-neutral-950">{averageProduction}L</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="size-4 text-[#4a90e2]" />
              <span className="text-xs text-gray-500">Total Geral</span>
            </div>
            <p className="text-2xl text-neutral-950">{totalProduction.toLocaleString('pt-BR')}L</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <span className="text-xs text-gray-500">Máximo</span>
            <p className="text-xl text-green-600">{maxProduction}L</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <span className="text-xs text-gray-500">Mínimo</span>
            <p className="text-xl text-orange-600">{minProduction}L</p>
          </div>
        </div>

        {/* Line Chart - Production Trend */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="size-5 text-[#4a90e2]" />
            <h3 className="text-neutral-950">Evolução da Produção</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line 
                type="monotone" 
                dataKey="Total" 
                stroke="#4a90e2" 
                strokeWidth={3}
                dot={{ fill: '#4a90e2', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Morning vs Afternoon */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="text-neutral-950 mb-4">Produção Manhã vs Tarde</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData.slice(-10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                stroke="#6b7280"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Manhã" fill="#f97316" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Tarde" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Quality Distribution */}
        {qualityData.length > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-neutral-950 mb-4">Distribuição de Qualidade</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={qualityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {qualityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Insights */}
        <div className="bg-gradient-to-r from-[#4a90e2]/10 to-[#357abd]/10 rounded-xl p-5 border border-[#4a90e2]/20">
          <h3 className="text-neutral-950 mb-3">Insights</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <span className="text-[#4a90e2] mt-0.5">•</span>
              <span>Média de produção diária: {averageProduction} litros</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#4a90e2] mt-0.5">•</span>
              <span>Variação: {maxProduction - minProduction} litros entre máximo e mínimo</span>
            </li>
            {qualityData.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="text-[#4a90e2] mt-0.5">•</span>
                <span>Qualidade predominante: {qualityData[0].name}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
