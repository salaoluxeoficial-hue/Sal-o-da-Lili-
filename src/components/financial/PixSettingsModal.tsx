import React, { useState } from 'react';
import { 
  X, 
  Settings, 
  Key, 
  Building2, 
  MapPin, 
  Webhook, 
  ShieldCheck, 
  Check, 
  Copy, 
  RefreshCw,
  Terminal,
  Activity,
  Zap
} from 'lucide-react';
import { PixConfig, PixWebhookLog } from '@/src/types';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';
import { formatCurrency } from '@/src/lib/utils';

interface PixSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: PixConfig;
  onSave: (config: PixConfig) => void;
}

export const PixSettingsModal: React.FC<PixSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [keyType, setKeyType] = useState<PixConfig['keyType']>(config.keyType);
  const [key, setKey] = useState(config.key);
  const [receiverName, setReceiverName] = useState(config.receiverName);
  const [receiverCity, setReceiverCity] = useState(config.receiverCity);
  const [postalCode, setPostalCode] = useState(config.postalCode || '');
  const [gatewayProvider, setGatewayProvider] = useState<PixConfig['gatewayProvider']>(config.gatewayProvider);
  const [autoWebhookEnabled, setAutoWebhookEnabled] = useState(config.autoWebhookEnabled);
  const [webhookSecret, setWebhookSecret] = useState(config.webhookSecret);
  const [webhookLogs] = useLocalStorage<PixWebhookLog[]>('pix_webhook_logs', []);
  const [copiedEndpoint, setCopiedEndpoint] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');

  if (!isOpen) return null;

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(config.webhookEndpoint);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  const handleGenerateNewSecret = () => {
    const newSecret = 'whsec_luxe_' + Math.random().toString(36).substring(2, 12);
    setWebhookSecret(newSecret);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...config,
      keyType,
      key: key.trim(),
      receiverName: receiverName.trim().toUpperCase(),
      receiverCity: receiverCity.trim().toUpperCase(),
      postalCode: postalCode.trim(),
      gatewayProvider,
      autoWebhookEnabled,
      webhookSecret,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0c0c0c] border border-[#d4af37]/30 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">
              <Settings size={22} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                Configurações do Pix & Gateway Bancário
              </h2>
              <p className="text-xs text-neutral-400">
                Chave oficial do salão, identificação cadastral e integração com webhook
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex gap-2 border-b border-white/10 pb-2 text-xs">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-4 py-2 rounded-xl font-semibold transition ${
              activeTab === 'config'
                ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Chave & Parâmetros
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center gap-2 transition ${
              activeTab === 'logs'
                ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20'
                : 'text-neutral-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Terminal size={14} />
            <span>Logs de Webhook ({webhookLogs.length})</span>
          </button>
        </div>

        {activeTab === 'config' ? (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            {/* Chave Pix e Tipo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-neutral-300 font-semibold mb-1 block">
                  Tipo da Chave *
                </label>
                <select
                  value={keyType}
                  onChange={(e) => setKeyType(e.target.value as PixConfig['keyType'])}
                  className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value="cnpj">CNPJ</option>
                  <option value="telefone">Celular / Telefone</option>
                  <option value="email">E-mail</option>
                  <option value="cpf">CPF</option>
                  <option value="aleatoria">Chave Aleatória (EVP)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-neutral-300 font-semibold mb-1 block">
                  Valor da Chave Pix *
                </label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: 12.345.678/0001-90 ou contato@salaoluxe.com"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>
            </div>

            {/* Nome do Recebedor e Cidade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-neutral-300 font-semibold mb-1 block">
                  Nome do Recebedor (Empresa / Razão Social) *
                </label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    maxLength={25}
                    placeholder="SALAO LUXE UNISSEX LTDA"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white uppercase focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">Máximo 25 caracteres (padrão BCB)</span>
              </div>

              <div>
                <label className="text-neutral-300 font-semibold mb-1 block">
                  Cidade do Recebedor *
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <input
                    type="text"
                    required
                    maxLength={15}
                    placeholder="SAO PAULO"
                    value={receiverCity}
                    onChange={(e) => setReceiverCity(e.target.value)}
                    className="w-full bg-[#141414] border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white uppercase focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <span className="text-[10px] text-neutral-500 mt-0.5 block">Máximo 15 caracteres (padrão BCB)</span>
              </div>
            </div>

            {/* Gateway Provider Selection */}
            <div className="p-4 bg-[#141414] rounded-xl border border-white/5 space-y-3">
              <label className="text-neutral-200 font-semibold block">
                Gateway de Pagamento Integrado
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'mercadopago', label: 'Mercado Pago' },
                  { id: 'asaas', label: 'Asaas' },
                  { id: 'inter', label: 'Banco Inter' },
                  { id: 'gerencianet', label: 'EFI / Gerencianet' },
                ].map(prov => (
                  <button
                    type="button"
                    key={prov.id}
                    onClick={() => setGatewayProvider(prov.id as any)}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      gatewayProvider === prov.id
                        ? 'border-[#d4af37] bg-[#d4af37]/10 text-white font-semibold'
                        : 'border-white/5 bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {prov.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Webhook Endpoint & Secret */}
            <div className="p-4 bg-[#141414] rounded-xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-semibold block flex items-center gap-1.5">
                    <Webhook size={15} className="text-[#d4af37]" />
                    Webhook para Confirmação Automática
                  </span>
                  <span className="text-[11px] text-neutral-400">
                    Receba eventos HTTP POST do banco assim que o cliente pagar
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoWebhookEnabled}
                  onChange={(e) => setAutoWebhookEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-[#d4af37] focus:ring-0 bg-white/10 border-white/20"
                />
              </div>

              {autoWebhookEnabled && (
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <div>
                    <label className="text-neutral-400 text-[11px] font-semibold block mb-1">
                      URL de Notificação (Webhook Endpoint):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={config.webhookEndpoint}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-300 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleCopyEndpoint}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium flex items-center gap-1 border border-white/10"
                      >
                        {copiedEndpoint ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{copiedEndpoint ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-neutral-400 text-[11px] font-semibold block mb-1">
                      Segredo de Autenticação (Webhook Secret):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={webhookSecret}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-300 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateNewSecret}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium flex items-center gap-1 border border-white/10"
                        title="Gerar novo segredo"
                      >
                        <RefreshCw size={14} />
                        <span>Novo</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-neutral-300 hover:bg-white/5 font-semibold transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b38f2a] text-black font-bold hover:brightness-110 shadow-lg shadow-[#d4af37]/20 transition"
              >
                Salvar Configurações Pix
              </button>
            </div>
          </form>
        ) : (
          /* Webhook Logs View */
          <div className="space-y-3">
            <p className="text-xs text-neutral-400">
              Auditoria de notificações HTTP POST enviadas pelo gateway bancário para confirmação em tempo real:
            </p>
            {webhookLogs.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 bg-[#141414] rounded-xl border border-white/5">
                Nenhum evento de webhook recebido até o momento. Realize um pagamento via Pix ou simule na tela de cobrança.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {webhookLogs.map(log => (
                  <div key={log.id} className="p-3 bg-[#141414] border border-white/5 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center text-neutral-400">
                      <span className="font-mono text-[11px] text-[#d4af37]">{log.event}</span>
                      <span>{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="text-white font-medium">
                      {log.senderName} • {formatCurrency(log.amount)}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      TXID: {log.txid} • Status: <span className="text-emerald-400">{log.status}</span>
                    </div>
                    <div className="text-[11px] text-neutral-500">
                      {log.payloadSummary}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
