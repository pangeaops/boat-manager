import React, { useState } from 'react';
import { AppData, InventoryItem } from '../types';
import { PANGEA_YELLOW, PANGEA_DARK } from '../constants';

interface InventoryDashboardProps {
  data: AppData;
  onUpdateInventory: (item: InventoryItem) => void;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ data, onUpdateInventory }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  
  const [formState, setFormState] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'Consumables',
    currentStock: 0,
    minStock: 5,
    unit: 'Units',
    location: 'Main Warehouse'
  });

  const categories: InventoryItem['category'][] = [
    'Drinks', 
    'Snacks', 
    'Equipment', 
    'Mechanical', 
    'Dock', 
    'Vessel Gear', 
    'Consumables', 
    'Office'
  ];

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormState({
      name: '',
      category: 'Consumables',
      currentStock: 0,
      minStock: 5,
      unit: 'Units',
      location: 'Main Warehouse'
    });
    setIsAdding(true);
  };

  const handleOpenEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormState({ ...item });
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // UPSERT LOGIC: Check if an item with the same name exists (if not already editing a specific record)
    const existingItem = !editingItem 
      ? data.inventory.find(i => i.name.toLowerCase().trim() === formState.name?.toLowerCase().trim())
      : editingItem;

    const itemToSave: InventoryItem = {
      ...(existingItem || {}),
      name: formState.name || '',
      category: formState.category || 'Consumables',
      currentStock: formState.currentStock ?? 0,
      minStock: formState.minStock ?? 5,
      unit: formState.unit || 'Units',
      location: formState.location || 'Main Warehouse',
      id: existingItem ? existingItem.id : Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString()
    };

    onUpdateInventory(itemToSave);
    setIsAdding(false);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Supply & Inventory</h2>
          <p className="text-slate-500 font-medium">Global stock levels and vessel equipment reconciliation.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-[#ffb519] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
        >
          Add Stock Item
        </button>
      </header>

      {isAdding && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setIsAdding(false)}>
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative" onClick={e => e.stopPropagation()}>
             <div className="mb-8">
               <h3 className="text-3xl font-black text-slate-900">{editingItem ? 'Adjust Stock' : 'New Asset Registration'}</h3>
               <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">
                 {editingItem ? `Updating ${editingItem.name}` : 'Create a new item in the Inventory table'}
               </p>
             </div>

             <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Item Name</label>
                    <input 
                      placeholder="e.g. Water Bottle 500ml" 
                      className="w-full bg-slate-50 px-6 py-4 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-[#ffb519]" 
                      value={formState.name} 
                      onChange={e => setFormState({...formState, name: e.target.value})}
                      required 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Category</label>
                    <select 
                      className="w-full bg-slate-50 px-6 py-4 rounded-xl font-bold border-none outline-none focus:ring-2 focus:ring-[#ffb519]"
                      value={formState.category}
                      onChange={e => setFormState({...formState, category: e.target.value as any})}
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Current Stock Count</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 px-6 py-4 rounded-xl font-bold border-none" 
                      value={formState.currentStock}
                      onChange={e => setFormState({...formState, currentStock: parseInt(e.target.value) || 0})}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Min Threshold (Warning)</label>
                    <input 
                      type="number" 
                      className="w-full bg-slate-50 px-6 py-4 rounded-xl font-bold border-none" 
                      value={formState.minStock}
                      onChange={e => setFormState({...formState, minStock: parseInt(e.target.value) || 0})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Unit (Liters, Pack, Units)</label>
                    <input 
                      placeholder="Units" 
                      className="w-full bg-slate-50 px-6 py-4 rounded-xl font-bold border-none" 
                      value={formState.unit}
                      onChange={e => setFormState({...formState, unit: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Warehouse Location</label>
                    <input 
                      placeholder="Main Warehouse" 
                      className="w-full bg-slate-50 px-6 py-4 rounded-xl font-bold border-none" 
                      value={formState.location}
                      onChange={e => setFormState({...formState, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                  <button type="submit" className="flex-1 py-4 bg-slate-800 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl">Save to Database</button>
                </div>
             </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {data.inventory.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
             <span className="text-4xl opacity-50">📦</span>
             <p className="mt-4 font-black text-slate-400 uppercase tracking-widest">No inventory data synced from Airtable</p>
          </div>
        ) : (
          data.inventory.map(item => {
            const stockToCompare = item.finalStock !== undefined ? item.finalStock : item.currentStock;
            const isLowStock = stockToCompare <= item.minStock;
            return (
              <div 
                key={item.id} 
                className={`bg-white p-8 rounded-[3rem] border-2 shadow-sm space-y-6 group hover:shadow-xl transition-all relative overflow-hidden ${
                  isLowStock ? 'border-red-500 bg-red-50/5' : 'border-slate-50'
                }`}
              >
                {isLowStock && (
                  <div className="absolute top-0 right-0 bg-red-600 text-white px-6 py-1 font-black text-[8px] uppercase tracking-[0.2em] transform rotate-45 translate-x-6 translate-y-3">
                    Restock
                  </div>
                )}
                
                <div className="flex justify-between items-start">
                   <div className="bg-slate-100 px-3 py-1 rounded-lg text-[9px] font-black uppercase text-slate-400 border border-slate-200">{item.category}</div>
                   <button 
                    onClick={() => handleOpenEdit(item)}
                    className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-100 hover:text-amber-600"
                   >
                     ✏️
                   </button>
                </div>

                <div>
                  <h4 className={`text-xl font-black ${isLowStock ? 'text-red-700' : 'text-slate-800'}`}>{item.name}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.location || 'Warehouse Main'}</p>
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-slate-100">
                   <div className="flex flex-col">
                     <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Available Stock</span>
                     <div className="text-4xl font-black flex items-baseline">
                       <span className={isLowStock ? 'text-red-600' : 'text-slate-900'}>{stockToCompare}</span>
                       <span className="text-xs text-slate-300 ml-1 font-bold">{item.unit || 'Units'}</span>
                     </div>
                   </div>
                   <div className="flex space-x-2">
                      <button 
                        onClick={() => onUpdateInventory({...item, currentStock: Math.max(0, item.currentStock - 1)})}
                        className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black hover:bg-red-600 hover:text-white transition-all shadow-sm"
                      >-</button>
                      <button 
                        onClick={() => onUpdateInventory({...item, currentStock: item.currentStock + 1})}
                        className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-black hover:bg-green-600 hover:text-white transition-all shadow-sm"
                      >+</button>
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InventoryDashboard;