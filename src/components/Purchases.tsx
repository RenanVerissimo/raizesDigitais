import { ArrowLeft, Plus, ShoppingCart, Package, Clock, CheckCircle, X, Calendar, DollarSign } from 'lucide-react';
import { useState } from 'react';

export interface Purchase {
  id: string;
  category: 'feed' | 'medicine' | 'equipment' | 'maintenance' | 'other';
  item: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  supplier: string;
  date: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
}

interface PurchasesProps {
  purchases: Purchase[];
  onBack: () => void;
  onAddPurchase: (purchase: Omit<Purchase, 'id' | 'totalPrice'>) => void;
  onUpdateStatus: (id: string, status: Purchase['status']) => void;
  onDeletePurchase: (id: string) => void;
}

const categories = {
  feed: { label: 'Ração', color: 'bg-orange-100 text-orange-700' },
  medicine: { label: 'Medicamentos', color: 'bg-red-100 text-red-700' },
  equipment: { label: 'Equipamentos', color: 'bg-blue-100 text-blue-700' },
  maintenance: { label: 'Manutenção', color: 'bg-purple-100 text-purple-700' },
  other: { label: 'Outros', color: 'bg-gray-100 text-gray-700' },
};

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-700', icon: X },
};

export function Purchases({ purchases, onBack, onAddPurchase, onUpdateStatus, onDeletePurchase }: PurchasesProps) {
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | Purchase['status']>('all');
  const [formData, setFormData] = useState({
    category: 'feed' as Purchase['category'],
    item: '',
    quantity: '',
    unitPrice: '',
    supplier: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending' as Purchase['status'],
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.item && formData.quantity && formData.unitPrice && formData.supplier) {
      onAddPurchase({
        category: formData.category,
        item: formData.item,
        quantity: parseFloat(formData.quantity),
        unitPrice: parseFloat(formData.unitPrice),
        supplier: formData.supplier,
        date: formData.date,
        status: formData.status,
        notes: formData.notes || undefined,
      });
      setFormData({
        category: 'feed',
        item: '',
        quantity: '',
        unitPrice: '',
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        notes: '',
      });
      setShowModal(false);
    }
  };

  const filteredPurchases = filterStatus === 'all' 
    ? purchases 
    : purchases.filter(p => p.status === filterStatus);

  const totalPending = purchases
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.totalPrice, 0);

  const totalCompleted = purchases
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.totalPrice, 0);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-[#f5f7fa]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#4a90e2] to-[#357abd] text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={onBack} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <ArrowLeft className="size-6" />
          </button>
          <div>
            <h1 className="text-2xl">Compras e Pedidos</h1>
            <p className="text-white/90 text-sm">{filteredPurchases.length} {filteredPurchases.length === 1 ? 'item' : 'itens'}</p>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white py-3 rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="size-5" />
          Nova Compra/Pedido
        </button>
      </div>

      <div className="px-6 pb-8 space-y-5">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="size-4 text-yellow-600" />
              <span className="text-xs text-gray-500">Pendente</span>
            </div>
            <p className="text-2xl text-neutral-950">R$ {totalPending.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="size-4 text-green-600" />
              <span className="text-xs text-gray-500">Concluído</span>
            </div>
            <p className="text-2xl text-neutral-950">R$ {totalCompleted.toFixed(2)}</p>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm text-neutral-950 mb-3">Filtrar por Status</p>
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                filterStatus === 'all'
                  ? 'bg-[#4a90e2] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                filterStatus === 'pending'
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pendente
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                filterStatus === 'completed'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Concluído
            </button>
            <button
              onClick={() => setFilterStatus('cancelled')}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                filterStatus === 'cancelled'
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelado
            </button>
          </div>
        </div>

        {/* Purchases List */}
        <div className="space-y-3">
          {filteredPurchases.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
              <ShoppingCart className="size-12 text-gray-300 mx-auto mb-3" strokeWidth={1.5} />
              <p className="text-gray-500">Nenhuma compra encontrada</p>
            </div>
          ) : (
            filteredPurchases.map((purchase) => {
              const StatusIcon = statusConfig[purchase.status].icon;
              return (
                <div key={purchase.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-neutral-950">{purchase.item}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${categories[purchase.category].color}`}>
                          {categories[purchase.category].label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Fornecedor: {purchase.supplier}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(purchase.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Deseja excluir esta compra?')) {
                          onDeletePurchase(purchase.id);
                        }
                      }}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="size-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Quantidade</p>
                      <p className="text-neutral-950">{purchase.quantity}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-500">Preço Unit.</p>
                      <p className="text-neutral-950">R$ {purchase.unitPrice.toFixed(2)}</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2">
                      <p className="text-xs text-[#4a90e2]">Total</p>
                      <p className="text-neutral-950">R$ {purchase.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>

                  {purchase.notes && (
                    <div className="bg-gray-50 rounded-lg p-2 mb-3 text-sm text-gray-600">
                      <p className="text-xs text-gray-500 mb-1">Observações</p>
                      {purchase.notes}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => onUpdateStatus(purchase.id, 'pending')}
                      className={`flex-1 py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 ${
                        purchase.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Clock className="size-3" />
                      Pendente
                    </button>
                    <button
                      onClick={() => onUpdateStatus(purchase.id, 'completed')}
                      className={`flex-1 py-2 rounded-lg text-xs transition-colors flex items-center justify-center gap-1 ${
                        purchase.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <CheckCircle className="size-3" />
                      Concluído
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-neutral-950 text-xl">Nova Compra/Pedido</h2>
                <button 
                  onClick={() => setShowModal(false)}
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>
              <p className="text-gray-500 text-sm">Registre uma nova compra ou pedido</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-neutral-950 mb-2">Categoria *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Purchase['category'] })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                >
                  {Object.entries(categories).map(([key, value]) => (
                    <option key={key} value={key}>{value.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Item/Produto *</label>
                <input
                  type="text"
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  placeholder="Ex: Ração 25kg, Antibiótico"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-neutral-950 mb-2">Quantidade *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-neutral-950 mb-2">Preço Unitário *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {formData.quantity && formData.unitPrice && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl text-[#4a90e2]">
                    R$ {(parseFloat(formData.quantity) * parseFloat(formData.unitPrice)).toFixed(2)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm text-neutral-950 mb-2">Fornecedor *</label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  placeholder="Nome do fornecedor"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#4a90e2] focus:border-transparent"
                  required
                />
              </div>

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
