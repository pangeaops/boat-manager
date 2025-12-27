
import React from 'react';
import { AuditLog } from '../types';
import { generateLogPDF, sendEmailReport } from '../services/reportService';

interface LogSectionProps {
  logs: AuditLog[];
}

const LogSection: React.FC<LogSectionProps> = ({ logs }) => {
  const getCategoryColor = (cat: AuditLog['category']) => {
    switch (cat) {
      case 'Fleet': return 'bg-blue-100 text-blue-700';
      case 'Personnel': return 'bg-purple-100 text-purple-700';
      case 'Task': return 'bg-amber-100 text-amber-700';
      case 'Tour': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleDownloadPDF = () => {
    const doc = generateLogPDF(logs);
    doc.save(`Pangea_Audit_Log_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleEmailReport = () => {
    const summary = logs.slice(0, 10).map(l => `${l.timestamp}: ${l.action} - ${l.details}`).join('\n');
    sendEmailReport(
      "Pangea Bocas Audit Log Report", 
      `Operational Audit Summary:\n\n${summary}\n\nFull log attached in system files.`
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900">Operations Feed</h2>
          <p className="text-slate-500 font-medium">Full audit trail of all manual and automated actions.</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleDownloadPDF}
            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center space-x-2"
          >
            <span>📄 PDF Audit</span>
          </button>
          <button 
            onClick={handleEmailReport}
            className="bg-[#434343] text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center space-x-2 shadow-lg"
          >
            <span>📧 Email Log</span>
          </button>
        </div>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Time</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Action</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Category</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">No activity recorded yet.</td>
                </tr>
              ) : (
                [...logs].map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs font-mono font-bold text-slate-600">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      <p className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{log.action}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${getCategoryColor(log.category)}`}>
                        {log.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-600 line-clamp-1">{log.details}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogSection;
