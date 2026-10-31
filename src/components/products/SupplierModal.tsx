import React, { useState, useEffect } from 'react';
import { X, Building2, User, Phone, Mail, FileText, Tag, Plus } from 'lucide-react';
import { Supplier } from '@/src/types';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  existingSupplier?: Supplier | null;
}

export const SupplierModal: React.FC<SupplierModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingSupplier,
}) => {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [categories, setCategories] = useState('Cabelo, Tratamento');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (existingSupplier) {
      setName(existingSupplier.name);
      setContactName(existingSupplier.contactName || '');
      setPhone(existingSupplier.phone || '');
      setEmail(existingSupplier.email || '');
      setCnpj(existingSupplier.cnpj || '');
      setCategories(existingSupplier.categories?.join(', ') || 'Cabelo');
      setNotes(existingSupplier.notes || '');
    } else {
      setName('');
      setContactName('');
      setPhone('');
      setEmail('');
      setCnpj('');
      setCategories('Cabelo, Tratamento');
      setNotes('');
    }
  }, [existingSupplier, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const categoriesArray = categories
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    const supplierData: Supplier = {
      id: existingSupplier?.id || 'sup-' + Date.now(),
      name: name.trim(),
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      cnpj: cnpj.trim() || undefined,
      categories: categoriesArray.length > 0 ? categoriesArray : ['Geral'],
      notes: notes.trim() || undefined,
      createdAt: existingSupplier?.createdAt || new Date().toISOString(),
    };

    onSave(supplierData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0c0c0c] border border-[#d4af37]/30 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-[#d4af37]/15 flex items-center justify-between bg-gradient-to-r from-[#141414] to-[#0c0c0c]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/10 flex items-center justify-center text-[#d4af37] border border-[#d4af37]/20">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                {existingSupplier ? 'Editar Fornecedor' : 'Cadastrar Fornecedor'}
              </h3>
              <p className="text-neutral-400 text-xs">Dados da distribuidora e contato comercial.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Nome da Empresa / Distribuidora *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Wella Professionals Distribuição"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Representante / Contato
              </label>
              <input
                type="text"
                placeholder="Ex: Roberto Lima"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                CNPJ
              </label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                placeholder="(11) 98888-7777"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                E-mail para Pedidos
              </label>
              <input
                type="email"
                placeholder="pedidos@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Categorias Fornecidas (separadas por vírgula)
            </label>
            <input
              type="text"
              placeholder="Cabelo, Barba, Coloração"
              value={categories}
              onChange={(e) => setCategories(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
              Condições Comerciais e Observações
            </label>
            <textarea
              rows={2}
              placeholder="Prazos de faturamento, pedido mínimo, dias de visita do vendedor..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#141414] border border-white/10 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-[#d4af37]/50 resize-none"
            />
          </div>

          <div className="pt-3 border-t border-white/5 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-neutral-400 hover:bg-white/5 text-xs transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-[#d4af37] text-black py-3 rounded-xl font-bold text-xs hover:bg-[#d4af37]/90 transition-all shadow-md"
            >
              {existingSupplier ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
