import React, { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Award } from 'lucide-react';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { Professional } from '@/src/types';
import { getInitialProfessionals } from '@/src/services/professionalsStorage';

export const initialProfessionalsList = getInitialProfessionals();

export const Professionals: React.FC = () => {
  const [professionals, setProfessionals] = useLocalStorage<Professional[]>('professionals', initialProfessionalsList);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Professional | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [commission, setCommission] = useState('40');
  const [specialties, setSpecialties] = useState('');

  const openNewModal = () => {
    setEditingProf(null);
    setName('');
    setRole('');
    setCommission('40');
    setSpecialties('Corte, Barba');
    setIsModalOpen(true);
  };

  const openEditModal = (prof: Professional) => {
    setEditingProf(prof);
    setName(prof.name);
    setRole(prof.role);
    setCommission(String(prof.commission));
    setSpecialties(prof.specialties.join(', '));
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este profissional?')) {
      setProfessionals(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const parsedCommission = parseFloat(commission) || 0;
    const specialtiesArray = specialties
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const initials = name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    if (editingProf) {
      setProfessionals(prev => prev.map(p => 
        p.id === editingProf.id
          ? {
              ...p,
              name: name.trim(),
              role: role.trim() || 'Especialista',
              commission: parsedCommission,
              specialties: specialtiesArray.length > 0 ? specialtiesArray : ['Geral'],
              photoUrl: initials,
            }
          : p
      ));
    } else {
      const newProf: Professional = {
        id: 'prof-' + Date.now(),
        name: name.trim(),
        role: role.trim() || 'Especialista',
        commission: parsedCommission,
        specialties: specialtiesArray.length > 0 ? specialtiesArray : ['Geral'],
        photoUrl: initials,
      };
      setProfessionals(prev => [...prev, newProf]);
    }

    setIsModalOpen(false);
  };

  const filtered = professionals.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Profissionais</h1>
          <p className="text-neutral-400 mt-1">Gerencie sua equipe, comissões e especialidades.</p>
        </div>
        <button 
          onClick={openNewModal}
          className="flex items-center gap-2 bg-[#d4af37] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#d4af37]/90 transition-all shadow-lg"
        >
          <Plus size={20} />
          Cadastrar Profissional
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" size={20} />
        <input 
          type="text"
          placeholder="Buscar profissionais..."
          className="w-full bg-[#111111] border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:border-[#d4af37]/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((prof) => (
          <div key={prof.id} className="bg-[#111111] border border-[#d4af37]/10 p-6 rounded-2xl hover:border-[#d4af37]/30 transition-all group">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-neutral-800 flex items-center justify-center text-[#d4af37] text-xl font-bold border-2 border-[#d4af37]/20">
                {prof.photoUrl || 'PR'}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{prof.name}</h3>
                <p className="text-[#d4af37] text-sm font-medium">{prof.role}</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-neutral-400 text-sm">
                <Award size={16} className="text-[#d4af37]" />
                <span>Comissão: <span className="text-white">{prof.commission}%</span></span>
              </div>
              <div className="flex flex-wrap gap-2">
                {prof.specialties.map(s => (
                  <span key={s} className="px-2 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-neutral-400 uppercase tracking-wider font-bold">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-white/5">
              <button 
                onClick={() => openEditModal(prof)}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Edit2 size={16} />
                Editar
              </button>
              <button 
                onClick={() => handleDelete(prof.id)}
                className="px-4 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                title="Excluir Profissional"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-neutral-500">
            Nenhum profissional cadastrado.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-[#d4af37]/30 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-white mb-2">
                {editingProf ? 'Editar Profissional' : 'Cadastrar Novo Profissional'}
              </h3>
              <p className="text-neutral-400 mb-6">Preencha as informações do membro da equipe.</p>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Nome Completo *</label>
                    <input 
                      type="text" 
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#d4af37]/50" 
                      placeholder="Ex: João Silva" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Cargo / Função *</label>
                    <input 
                      type="text" 
                      required
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#d4af37]/50" 
                      placeholder="Ex: Barbeiro Master" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Comissão (%) *</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      required
                      value={commission}
                      onChange={(e) => setCommission(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#d4af37]/50" 
                      placeholder="40" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-neutral-300">Especialidades (separadas por vírgula)</label>
                    <input 
                      type="text" 
                      value={specialties}
                      onChange={(e) => setSpecialties(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:border-[#d4af37]/50" 
                      placeholder="Corte, Barba, Pigmentação" 
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-6 py-3 rounded-xl font-bold text-neutral-400 hover:bg-white/5">Cancelar</button>
                  <button type="submit" className="flex-1 bg-[#d4af37] text-black px-6 py-3 rounded-xl font-bold hover:bg-[#d4af37]/90">
                    {editingProf ? 'Salvar Alterações' : 'Salvar Profissional'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
