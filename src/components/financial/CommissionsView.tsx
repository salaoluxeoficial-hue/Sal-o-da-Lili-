import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  Download, 
  ArrowUpRight, 
  Calendar,
  Award,
  Wallet
} from 'lucide-react';
import { ProfessionalCommission, Professional, Expense } from '@/src/types';
import { formatCurrency, cn } from '@/src/lib/utils';
import { exportToCSV } from '@/src/services/financialStorage';
import { format } from 'date-fns';

interface CommissionsViewProps {
  commissions: ProfessionalCommission[];
  professionals: Professional[];
  onPayCommission: (comm: ProfessionalCommission) => void;
}

export const CommissionsView: React.FC<CommissionsViewProps> = ({
  commissions,
  professionals,
  onPayCommission,
}) => {
  const [selectedProfessional, setSelectedProfessional] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendente' | 'pago'>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  // Summary statistics
  const stats = useMemo(() => {
    let totalGenerated = 0;
    let totalPaid = 0;
    let totalPending = 0;

    commissions.forEach(c => {
      totalGenerated += c.commissionAmount;
      if (c.status === 'pago') {
        totalPaid += c.commissionAmount;
      } else {
        totalPending += c.commissionAmount;
      }
    });

    return { totalGenerated, totalPaid, totalPending };
  }, [commissions]);

  // Filtered commissions list
  const filteredCommissions = useMemo(() => {
    return commissions.filter(c => {
      const matchesProf = selectedProfessional === 'todos' || c.professionalId === selectedProfessional;
      const matchesStatus = statusFilter === 'todos' || c.status === statusFilter;
      const matchesSearch = 
        c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.professionalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.serviceNames.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchesProf && matchesStatus && matchesSearch;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [commissions, selectedProfessional, statusFilter, searchTerm]);

  const handleExport = () => {
    exportToCSV({
      filename: `comissoes_profissionais_${format(new Date(), 'yyyy-MM-dd')}`,
      headers: ['Data', 'Profissional', 'Cliente', 'Serviços', 'Valor Serviço (R$)', '% Comissão', 'Valor Comissão (R$)', 'Status', 'Data Pagamento'],
      rows: filteredCommissions.map(c => [
        c.date,
        c.professionalName,
        c.clientName,
        c.serviceNames.join(' + '),
        c.servicePrice.toFixed(2),
        `${c.commissionRate}%`,
        c.commissionAmount.toFixed(2),
        c.status === 'pago' ? 'PAGO' : 'PENDENTE',
        c.paidAt ? new Date(c.paidAt).toLocaleDateString('pt-BR') : '-'
      ])
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0a0a] p-6 rounded-2xl border border-[#d4af37]/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#d4af37]/10 text-[#d4af37] rounded-xl border border-[#d4af37]/30">
            <Award size={24} />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-white tracking-wide">
              Gestão de Comissões dos Profissionais
            </h2>
            <p className="text-xs text-neutral-400">
              Cálculo individual de comissões por atendimento e liquidação direta
            </p>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10 text-neutral-300 hover:text-white hover:bg-white/10 rounded-xl text-xs font-semibold transition"
        >
          <Download size={15} />
          <span>Exportar Relatório CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total de Comissões Geradas</span>
            <DollarSign size={18} className="text-[#d4af37]" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {formatCurrency(stats.totalGenerated)}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Calculado sobre todos os serviços executados
          </p>
        </div>

        <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Comissões Pagas</span>
            <CheckCircle2 size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {formatCurrency(stats.totalPaid)}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Valores repassados e quitados aos profissionais
          </p>
        </div>

        <div className="bg-[#0c0c0c] p-5 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="flex items-center justify-between text-neutral-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">A Pagar (Pendente)</span>
            <Clock size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">
            {formatCurrency(stats.totalPending)}
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Saldo acumulado aguardando fechamento
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#0c0c0c] p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Buscar por cliente, serviço..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#141414] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Professional select */}
          <select
            value={selectedProfessional}
            onChange={(e) => setSelectedProfessional(e.target.value)}
            className="bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
          >
            <option value="todos">Todos os Profissionais</option>
            {professionals.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.commission}%)
              </option>
            ))}
          </select>

          {/* Status buttons */}
          <div className="flex gap-1 bg-[#141414] p-1 rounded-xl border border-white/5">
            {(['todos', 'pendente', 'pago'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition",
                  statusFilter === st
                    ? "bg-[#d4af37] text-black font-semibold shadow-sm"
                    : "text-neutral-400 hover:text-white"
                )}
              >
                {st === 'todos' ? 'Todos' : st === 'pendente' ? 'Pendentes' : 'Pagas'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Commissions Table */}
      <div className="bg-[#0c0c0c] rounded-2xl border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-[#141414] uppercase tracking-wider text-neutral-400 border-b border-white/5">
              <tr>
                <th className="px-6 py-4 font-semibold">Data</th>
                <th className="px-6 py-4 font-semibold">Profissional</th>
                <th className="px-6 py-4 font-semibold">Cliente</th>
                <th className="px-6 py-4 font-semibold">Serviço(s)</th>
                <th className="px-6 py-4 font-semibold">Valor Total</th>
                <th className="px-6 py-4 font-semibold">% Comissão</th>
                <th className="px-6 py-4 font-semibold">Comissão (R$)</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-neutral-500">
                    Nenhum registro de comissão encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map(comm => (
                  <tr key={comm.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-white font-medium">
                        {new Date(comm.date).toLocaleDateString('pt-BR')}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{comm.professionalName}</div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-neutral-300">{comm.clientName}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-neutral-300 max-w-xs truncate">
                        {comm.serviceNames.join(' + ')}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                      {formatCurrency(comm.servicePrice)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#d4af37]">
                      {comm.commissionRate}%
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap font-bold text-white text-sm">
                      {formatCurrency(comm.commissionAmount)}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      {comm.status === 'pago' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 size={12} /> Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock size={12} /> Pendente
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {comm.status === 'pendente' ? (
                        <button
                          onClick={() => onPayCommission(comm)}
                          className="px-3 py-1.5 bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black font-semibold rounded-lg border border-[#d4af37]/40 transition text-xs flex items-center gap-1 ml-auto"
                        >
                          <Wallet size={13} />
                          <span>Pagar</span>
                        </button>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">
                          Quitado {comm.paidAt ? `(${new Date(comm.paidAt).toLocaleDateString('pt-BR')})` : ''}
                        </span>
                      )}
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
