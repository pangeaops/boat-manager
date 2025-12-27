
import React, { useState } from 'react';
import { AppUser } from '../types';
import { PANGEA_YELLOW, PANGEA_DARK } from '../constants';

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Simulate auth check with specific credentials
    setTimeout(() => {
      const emailLower = email.toLowerCase();
      let user: AppUser | null = null;

      if (emailLower === 'hello@pangeabocas.com' && password === 'Peninsula36') {
        user = { email: emailLower, role: 'Admin', name: 'Manager Ops' };
      } else if (emailLower === 'davismarshall@pangeabocas.com' && password === 'Peninsula24') {
        user = { email: emailLower, role: 'Admin', name: 'Commodore CEO' };
      } else if (emailLower === 'ops@pangeabocas.com' && password === 'Peninsula25') {
        user = { email: emailLower, role: 'Staff', name: 'Ops Staff' };
      }

      if (user) {
        onLogin(user);
      } else {
        setError('Invalid credentials. Please verify your email and password.');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#434343] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl overflow-hidden p-12 space-y-10 animate-in zoom-in-95 duration-500">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-[#ffb519] rounded-[2rem] mx-auto flex items-center justify-center text-white text-4xl font-black shadow-xl">P</div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-[#434343]">PANGEA<span className="text-[#ffb519]">OPS</span></h1>
            <p className="text-[10px] uppercase font-bold tracking-[0.3em] text-slate-400 mt-1">Fleet Command v2.1</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Email Access</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@pangeabocas.com" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-[#ffb519]/20 focus:border-[#ffb519] transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-[#ffb519]/20 focus:border-[#ffb519] transition-all"
              />
            </div>
          </div>

          {error && <p className="text-xs font-bold text-red-500 text-center px-4 animate-bounce">{error}</p>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl transition-all flex items-center justify-center space-x-3 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: PANGEA_YELLOW }}
          >
            {loading ? (
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>Authorize Access</span>
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-[10px] text-slate-400 font-medium">Restricted Access. Pangea Bocas Property.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
