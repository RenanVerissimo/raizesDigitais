import { useState } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { ProductionEntry } from './components/ProductionEntry';
import { ProductionHistory } from './components/ProductionHistory';
import { Analytics } from './components/Analytics';
import { AnimalManagement, Animal } from './components/AnimalManagement';
import { Purchases, Purchase } from './components/Purchases';
import { Financial, Revenue } from './components/Financial';
import { Inventory, MilkStorage, MilkMovement } from './components/Inventory';

export interface ProductionRecord {
  id: string;
  date: string;
  morningProduction: number;
  afternoonProduction: number;
  totalProduction: number;
  quality: 'excellent' | 'good' | 'regular';
  notes?: string;
}

export interface User {
  name: string;
  farmName: string;
}

type Screen = 'login' | 'dashboard' | 'entry' | 'history' | 'analytics' | 'animals' | 'purchases' | 'financial' | 'inventory';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [user, setUser] = useState<User | null>(null);
  const [animals, setAnimals] = useState<Animal[]>([
    {
      id: '1',
      name: 'Mimosa',
      identifier: '001',
      averageDailyProduction: 28,
      breed: 'Holandesa',
      age: '4 anos'
    },
    {
      id: '2',
      name: 'Estrela',
      identifier: '002',
      averageDailyProduction: 25,
      breed: 'Jersey',
      age: '3 anos'
    }
  ]);
  const [productions, setProductions] = useState<ProductionRecord[]>([
    {
      id: '1',
      date: '2025-11-18',
      morningProduction: 450,
      afternoonProduction: 380,
      totalProduction: 830,
      quality: 'excellent',
      notes: 'Produção estável'
    },
    {
      id: '2',
      date: '2025-11-19',
      morningProduction: 420,
      afternoonProduction: 390,
      totalProduction: 810,
      quality: 'good',
    },
    {
      id: '3',
      date: '2025-11-20',
      morningProduction: 460,
      afternoonProduction: 400,
      totalProduction: 860,
      quality: 'excellent',
      notes: 'Excelente qualidade do leite'
    }
  ]);
  const [purchases, setPurchases] = useState<Purchase[]>([
    {
      id: '1',
      category: 'feed',
      item: 'Ração 25kg',
      quantity: 10,
      unitPrice: 85.00,
      totalPrice: 850.00,
      supplier: 'Agropecuária Silva',
      date: '2025-11-15',
      status: 'completed'
    },
    {
      id: '2',
      category: 'medicine',
      item: 'Antibiótico',
      quantity: 2,
      unitPrice: 120.00,
      totalPrice: 240.00,
      supplier: 'Veterinária Central',
      date: '2025-11-18',
      status: 'pending'
    }
  ]);
  const [revenues, setRevenues] = useState<Revenue[]>([
    {
      id: '1',
      date: '2025-11-15',
      liters: 800,
      pricePerLiter: 2.50,
      totalAmount: 2000.00,
      buyer: 'Laticínio Bom Leite'
    },
    {
      id: '2',
      date: '2025-11-18',
      liters: 850,
      pricePerLiter: 2.50,
      totalAmount: 2125.00,
      buyer: 'Laticínio Bom Leite'
    }
  ]);
  const [inventory, setInventory] = useState<MilkStorage[]>([
    {
      id: '1',
      tankName: 'Tanque Principal',
      capacity: 1000,
      currentVolume: 650,
      temperature: 3.5,
      quality: 'excellent',
      lastUpdated: new Date().toISOString(),
      location: 'Sala de Ordenha'
    },
    {
      id: '2',
      tankName: 'Tanque Reserva',
      capacity: 500,
      currentVolume: 120,
      temperature: 3.8,
      quality: 'good',
      lastUpdated: new Date().toISOString(),
      location: 'Depósito'
    }
  ]);
  const [stockMovements, setStockMovements] = useState<MilkMovement[]>([
    {
      id: '1',
      tankId: '1',
      tankName: 'Tanque Principal',
      type: 'in',
      volume: 450,
      date: '2025-11-20',
      time: '06:00',
      reason: 'Coleta da manhã'
    },
    {
      id: '2',
      tankId: '1',
      tankName: 'Tanque Principal',
      type: 'out',
      volume: 800,
      date: '2025-11-19',
      time: '14:30',
      reason: 'Entrega ao laticínio',
      buyer: 'Laticínio Bom Leite'
    }
  ]);

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
  };

  const addProduction = (production: Omit<ProductionRecord, 'id' | 'totalProduction'>) => {
    const newProduction: ProductionRecord = {
      ...production,
      id: Date.now().toString(),
      totalProduction: production.morningProduction + production.afternoonProduction,
    };
    setProductions([newProduction, ...productions]);
    setCurrentScreen('dashboard');
  };

  const deleteProduction = (id: string) => {
    setProductions(productions.filter(p => p.id !== id));
  };

  const addAnimal = (animal: Omit<Animal, 'id'>) => {
    const newAnimal: Animal = {
      ...animal,
      id: Date.now().toString(),
    };
    setAnimals([...animals, newAnimal]);
  };

  const deleteAnimal = (id: string) => {
    setAnimals(animals.filter(a => a.id !== id));
  };

  const addPurchase = (purchase: Omit<Purchase, 'id' | 'totalPrice'>) => {
    const newPurchase: Purchase = {
      ...purchase,
      id: Date.now().toString(),
      totalPrice: purchase.quantity * purchase.unitPrice,
    };
    setPurchases([newPurchase, ...purchases]);
  };

  const updatePurchaseStatus = (id: string, status: Purchase['status']) => {
    setPurchases(purchases.map(p => p.id === id ? { ...p, status } : p));
  };

  const deletePurchase = (id: string) => {
    setPurchases(purchases.filter(p => p.id !== id));
  };

  const addRevenue = (revenue: Omit<Revenue, 'id' | 'totalAmount'>) => {
    const newRevenue: Revenue = {
      ...revenue,
      id: Date.now().toString(),
      totalAmount: revenue.liters * revenue.pricePerLiter,
    };
    setRevenues([newRevenue, ...revenues]);
  };

  const deleteRevenue = (id: string) => {
    setRevenues(revenues.filter(r => r.id !== id));
  };

  const addInventoryItem = (item: Omit<MilkStorage, 'id'>) => {
    const newItem: MilkStorage = {
      ...item,
      id: Date.now().toString(),
    };
    setInventory([...inventory, newItem]);
  };

  const updateInventoryItem = (id: string, updates: Partial<MilkStorage>) => {
    setInventory(inventory.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteInventoryItem = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id));
  };

  const addStockMovement = (movement: Omit<MilkMovement, 'id'>) => {
    const newMovement: MilkMovement = {
      ...movement,
      id: Date.now().toString(),
    };
    setStockMovements([newMovement, ...stockMovements]);
  };

  if (currentScreen === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="bg-[#f5f7fa] min-h-screen">
      {currentScreen === 'dashboard' && (
        <Dashboard
          user={user!}
          productions={productions}
          animals={animals}
          onNavigate={setCurrentScreen}
          onLogout={handleLogout}
        />
      )}
      
      {currentScreen === 'entry' && (
        <ProductionEntry
          onBack={() => setCurrentScreen('dashboard')}
          onSubmit={addProduction}
        />
      )}

      {currentScreen === 'history' && (
        <ProductionHistory
          productions={productions}
          onBack={() => setCurrentScreen('dashboard')}
          onDelete={deleteProduction}
        />
      )}

      {currentScreen === 'analytics' && (
        <Analytics
          productions={productions}
          onBack={() => setCurrentScreen('dashboard')}
        />
      )}

      {currentScreen === 'animals' && (
        <AnimalManagement
          animals={animals}
          productions={productions}
          onBack={() => setCurrentScreen('dashboard')}
          onAddAnimal={addAnimal}
          onDeleteAnimal={deleteAnimal}
        />
      )}

      {currentScreen === 'purchases' && (
        <Purchases
          purchases={purchases}
          onBack={() => setCurrentScreen('dashboard')}
          onAddPurchase={addPurchase}
          onUpdateStatus={updatePurchaseStatus}
          onDeletePurchase={deletePurchase}
        />
      )}

      {currentScreen === 'financial' && (
        <Financial
          revenues={revenues}
          purchases={purchases}
          onBack={() => setCurrentScreen('dashboard')}
          onAddRevenue={addRevenue}
          onDeleteRevenue={deleteRevenue}
        />
      )}

      {currentScreen === 'inventory' && (
        <Inventory
          inventory={inventory}
          movements={stockMovements}
          onBack={() => setCurrentScreen('dashboard')}
          onAddItem={addInventoryItem}
          onUpdateItem={updateInventoryItem}
          onDeleteItem={deleteInventoryItem}
          onAddMovement={addStockMovement}
        />
      )}
    </div>
  );
}