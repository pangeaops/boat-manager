
import React from 'react';
import { ECO_PROTOCOLS, SAFETY_OHS, EMERGENCY_CONTACTS, PANGEA_YELLOW } from '../constants';

const Protocols: React.FC = () => {
  const Card: React.FC<{ title: string, rules: string[], type: 'eco' | 'safety' }> = ({ title, rules, type }) => (
    <div className={`p-8 rounded-[2rem] border transition-all ${
      type === 'eco' 
        ? 'bg-green-50/50 border-green-100 hover:bg-green-50' 
        : 'bg-red-50/50 border-red-100 hover:bg-red-50'
    }`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${
          type === 'eco' ? 'bg-green-600' : 'bg-red-600'
        } text-white shadow-lg`}>
          {type === 'eco' ? '🌱' : '🛡️'}
        </div>
        <h4 className="text-xl font-black text-slate-900">{title}</h4>
      </div>
      <ul className="space-y-4">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start space-x-3">
            <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${type === 'eco' ? 'bg-green-400' : 'bg-red-400'}`}></span>
            <span className="text-sm font-medium text-slate-700 leading-tight">{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="space-y-12 pb-20">
      <header>
        <h2 className="text-3xl font-black text-slate-900">Compliance & Safety</h2>
        <p className="text-slate-500 font-medium">Standard operating procedures and emergency info.</p>
      </header>

      {/* Emergency Contacts & Radio Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-2xl">🚨</span>
            <h3 className="text-xl font-black text-slate-900">Emergency Protocols</h3>
          </div>
          <div className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-4">
            <div className="flex items-center space-x-2 text-red-800 font-black text-sm uppercase mb-4">
              <span>🚑</span>
              <span>Emergency Contacts</span>
            </div>
            {EMERGENCY_CONTACTS.map(contact => (
              <div key={contact.label} className="flex justify-between items-center py-2 border-b border-red-100 last:border-0">
                <span className="text-sm font-bold text-slate-600">{contact.label}:</span>
                <span className="text-lg font-black" style={{ color: PANGEA_YELLOW }}>{contact.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center space-x-3 mb-6">
            <span className="text-2xl">📻</span>
            <h3 className="text-xl font-black text-slate-900">Radio Operations</h3>
          </div>
          <div className="bg-slate-900 p-10 rounded-3xl text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-[#ffb519]"></div>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Official Communications</p>
            <h4 className="text-4xl font-black text-white">VHF Channel</h4>
            <div className="inline-block bg-[#ffb519] text-slate-900 px-8 py-3 rounded-2xl text-3xl font-black shadow-lg">
              78-10
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-4">Pangea Fleet Primary Frequency</p>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center space-x-2 px-2">
          <span className="text-xs font-black text-green-700 uppercase tracking-widest bg-green-100 px-3 py-1 rounded-full">Ecological Protocols</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ECO_PROTOCOLS.map((p, i) => <Card key={i} {...p} type="eco" />)}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center space-x-2 px-2">
          <span className="text-xs font-black text-red-700 uppercase tracking-widest bg-red-100 px-3 py-1 rounded-full">Safety & OHS Standards</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SAFETY_OHS.map((p, i) => <Card key={i} {...p} type="safety" />)}
        </div>
      </section>
    </div>
  );
};

export default Protocols;
