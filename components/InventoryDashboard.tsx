import React, { useState } from 'react';
import { AppData, InventoryItem } from '../types';

interface InventoryDashboardProps {
  data: AppData;
  onUpdateInventory: (item: InventoryItem) => void;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ data, onUpdateInventory }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'Consumables',
    currentStock: 0,
    minStock: 5,
    unit: 'Units',
    location: 'Main Warehouse'
  });

  const categories: InventoryItem['category'][] = ['Dock', 'Vessel Gear', 'Consumables', 'Office', 'Mechanical'];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const item: InventoryItem = {
      ...newItem as InventoryItem,
      id: Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString()
    };
    onUpdateInventory(item);
    setIsAdding(false);
  };

  return (
    <div className="space-y-10">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Supply & Inventory</h2>
          <p className="text-slate-500 font-medium">Manage dock stocks and vessel equipment.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-[#ffb519] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
        >
          Add Stock Item
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in zoom-in-95 duration-300">
           <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <input 
                placeholder="Item Name" 
                className="bg-slate-50 px-6 py-4 rounded-xl font-bold border-none" 
                value={newItem.name} 
                onChange={e => setNewItem({...newItem, name: e.target.value})}
                required 
              />
              <select 
                className="bg-slate-50 px-6 py-4 rounded-xl font-bold border-none"
                value={newItem.category}
                onChange={e => setNewItem({...newItem, category: e.target.value as any})}
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex space-x-2">
                <input 
                  type="number" 
                  placeholder="Qty" 
                  className="bg-slate-50 px-6 py-4 rounded-xl font-bold border-none w-1/2" 
                  value={newItem.currentStock}
                  onChange={e => setNewItem({...newItem, currentStock: parseInt(e.target.value)})}
                />
                <button type="submit" className="flex-1 bg-slate-800 text-white rounded-xl font-black text-xs uppercase">Save Item</button>
              </div>
           </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.inventory.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
             <span className="text-4xl">📦</span>
             <p className="mt-4 font-bold text-slate-400 uppercase tracking-widest">Inventory is empty</p>
          </div>
        ) : (
          data.inventory.map(item => (
            <div key={item.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6 group hover:shadow-xl transition-all">
              <div className="flex justify-between items-start">
                 <div className="bg-slate-50 px-3 py-1 rounded-lg text-[9px] font-black uppercase text-slate-400 border border-slate-100">{item.category}</div>
                 <div className={`text-[10px] font-black uppercase ${item.currentStock <= item.minStock ? 'text-red-500' : 'text-green-500'}`}>
                   {item.currentStock <= item.minStock ? 'Low Stock' : 'In Stock'}
                 </div>
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-800">{item.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.location}</p>
              </div>
              <div className="flex items-end justify-between pt-4 border-t border-slate-50">
                 <div className="text-4xl font-black">{item.currentStock}<span className="text-xs text-slate-300 ml-1">{item.unit}</span></div>
                 <div className="flex space-x-2">
                    <button 
                      onClick={() => onUpdateInventory({...item, currentStock: item.currentStock - 1})}
                      className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black hover:bg-red-50 hover:text-red-500 transition-all"
                    >-</button>
                    <button 
                      onClick={() => onUpdateInventory({...item, currentStock: item.currentStock + 1})}
                      className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black hover:bg-green-50 hover:text-green-500 transition-all"
                    >+</button>
                 </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InventoryDashboard;