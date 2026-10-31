import React, { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  ExternalLink,
  Zap,
  Building2,
  FileCheck
} from 'lucide-react';
import { PixConfig, PixCharge, PixWebhookLog } from '@/src/types';
import { createPixCharge } from '@/src/services/pixService';
import { formatCurrency } from '@/src/lib/utils';
import { useLocalStorage } from '@/src/hooks/useLocalStorage';

interface PixChargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  clientName: string;
  description: string;
  referenceType?: 'servico' | 'produto' | 'avulso';
  referenceId?: string;
  config: PixConfig;
  onPaymentConfirmed: (charge: PixCharge) => void;
}

export const PixChargeModal: React.FC<PixChargeModalProps> = ({
  isOpen,
  onClose,
  amount,
  clientName,
  description,
  referenceType = 'avulso',
  referenceId,
  config,
  onPaymentConfirmed,
}) => {
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);
  const [webhookSuccess, setWebhookSuccess] = useState(false);
  const [manualConfirmChecked, setManualConfirmChecked] = useState(false);
  const [, setWebhookLogs] = useLocalStorage<PixWebhookLog[]>('pix_webhook_logs', []);

  useEffect(() => {
    if (isOpen && amount > 0) {
      let isMounted = true;
      createPixCharge({
        amount,
        description,
        clientName,
        referenceType,
        referenceId,
        config
      }).then(newCharge => {
        if (isMounted) {
          setCharge(newCharge);
          setCopied(false);
          setWebhookSuccess(false);
          setManualConfirmChecked(false);
        }
      });
      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, amount, description, clientName, referenceType, referenceId, config]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!charge) return;
    navigator.clipboard.writeText(charge.brCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Simulates bank gateway webhook notification
  const handleSimulateWebhook = () => {
    if (!charge) return;
    setIsSimulatingWebhook(true);

    setTimeout(() => {
      setIsSimulatingWebhook(false);
      setWebhookSuccess(true);

      const updatedCharge: PixCharge = {
        ...charge,
        status: 'pago',
        paidAt: new Date().toISOString(),
        endToEndId: `E${Date.now()}8892019401923`
      };
      setCharge(updatedCharge);

      // Log webhook event
      const logEntry: PixWebhookLog = {
        id: `wh-${Date.now()}`,
        timestamp: new Date().toISOString(),
        event: 'pix.payment_confirmed',
        txid: charge.txid,
        amount: charge.amount,
        senderName: charge.clientName,
        status: 'processado',
        payloadSummary: `Pagamento de ${formatCurrency(charge.amount)} autenticado com sucesso via Gateway ${config.gatewayProvider.toUpperCase()}.`
      };
      setWebhookLogs(prev => [logEntry, ...prev]);

      // Call completion callback
      setTimeout(() => {
        onPaymentConfirmed(updatedCharge);
      }, 1200);
    }, 1500);
  };

  // Manual confirmation after checking bank statement
  const handleManualBankVerification = () => {
    if (!charge || !manualConfirmChecked) return;

    const updatedCharge: PixCharge = {
      ...charge,
      status: 'pago',
      paidAt: new Date().toISOString(),
      endToEndId: `MANUAL-${Date.now()}`
    };
    setCharge(updatedCharge);
    setWebhookSuccess(true);

    setTimeout(() => {
      onPaymentConfirmed(updatedCharge);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0c0c0c] border border-[#d4af37]/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative space-y-5 p-6">
        {/* Top Header */}
        <div className="flex justify-between items-start border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30">
              <QrCode size={22} />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-white tracking-wide">
                Cobrança Instantânea Pix
              </h2>
              <p className="text-xs text-neutral-400">
                Padrão oficial Banco Central do Brasil (EMVCo BR Code)
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

        {/* Amount & Beneficiary Banner */}
        <div className="bg-[#141414] border border-[#d4af37]/20 rounded-xl p-4 flex justify-between items-center">
          <div>
            <span className="text-xs text-neutral-400 block">Valor a Receber</span>
            <span className="text-2xl font-bold font-serif text-[#d4af37]">
              {formatCurrency(amount)}
            </span>
          </div>
          <div className="text-right text-xs">
            <span className="text-neutral-500 block">Beneficiário</span>
            <span className="text-white font-medium block truncate max-w-[180px]">
              {config.receiverName}
            </span>
            <span className="text-neutral-400 block">{config.receiverCity} • {config.key}</span>
          </div>
        </div>

        {/* QR Code & Copia e Cola Display */}
        <div className="flex flex-col items-center justify-center space-y-4">
          {charge?.qrCodeDataUrl ? (
            <div className="p-3 bg-white rounded-2xl shadow-xl shadow-black/50 border-4 border-[#d4af37]/30 relative">
              <img
                src={charge.qrCodeDataUrl}
                alt="QR Code Pix"
                className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
              />
              {webhookSuccess && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center p-4 text-center">
                  <CheckCircle2 size={48} className="text-emerald-400 mb-2 animate-bounce" />
                  <span className="text-white font-bold text-base">Pagamento Confirmado!</span>
                  <span className="text-emerald-400 text-xs mt-1">Crédito liquidado no caixa</span>
                </div>
              )}
            </div>
          ) : (
            <div className="w-56 h-56 bg-neutral-900 rounded-2xl flex items-center justify-center text-neutral-600">
              <RefreshCw size={28} className="animate-spin text-[#d4af37]" />
            </div>
          )}

          {/* Copia e Cola box */}
          <div className="w-full space-y-1.5">
            <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex justify-between">
              <span>Código Pix Copia e Cola:</span>
              <span className="font-mono text-neutral-500">TXID: {charge?.txid}</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={charge?.brCode || ''}
                className="bg-[#141414] border border-white/10 rounded-xl px-3 py-2 text-xs text-neutral-300 font-mono w-full truncate focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                  copied 
                    ? 'bg-emerald-500 text-black font-bold' 
                    : 'bg-[#d4af37] text-black hover:brightness-110 shadow-md shadow-[#d4af37]/20'
                }`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Security Rule Warning */}
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300/90 flex items-start gap-2.5">
          <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Proteção contra Fraudes:</strong> O sistema não considera o pagamento liquidado apenas por clique. A confirmação exige evento seguro de Webhook bancário ou atesto manual do operador após verificação de saldo.
          </p>
        </div>

        {/* Confirmation Actions */}
        {!webhookSuccess && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            {/* Option A: Webhook Test Simulation */}
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div>
                <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Zap size={14} className="text-[#d4af37]" />
                  Simular Notificação de Webhook (Gateway {config.gatewayProvider.toUpperCase()})
                </span>
                <span className="text-[11px] text-neutral-400 block mt-0.5">
                  Recebe payload JSON bancário assinado e liquida automaticamente
                </span>
              </div>
              <button
                type="button"
                disabled={isSimulatingWebhook}
                onClick={handleSimulateWebhook}
                className="px-3.5 py-1.5 bg-[#d4af37]/20 hover:bg-[#d4af37] text-[#d4af37] hover:text-black border border-[#d4af37]/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 ml-3"
              >
                {isSimulatingWebhook ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <span>Disparar Webhook</span>
                )}
              </button>
            </div>

            {/* Option B: Manual Operator Verification */}
            <div className="p-3 bg-[#141414] rounded-xl border border-white/5 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualConfirmChecked}
                  onChange={(e) => setManualConfirmChecked(e.target.checked)}
                  className="w-4 h-4 rounded text-[#d4af37] focus:ring-0 bg-white/10 border-white/20"
                />
                <span className="text-xs text-neutral-300">
                  Confirmo que verifiquei o extrato da conta bancária e o crédito de {formatCurrency(amount)} foi efetivado.
                </span>
              </label>

              <div className="flex justify-end">
                <button
                  type="button"
                  disabled={!manualConfirmChecked}
                  onClick={handleManualBankVerification}
                  className="px-4 py-2 bg-emerald-600 disabled:opacity-30 disabled:pointer-events-none hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
                >
                  <ShieldCheck size={16} />
                  <span>Atestar Recebimento Manual</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
