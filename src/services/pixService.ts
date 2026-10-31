import QRCode from 'qrcode';
import { PixConfig, PixCharge, PixWebhookLog } from '@/src/types';

/**
 * Removes special characters and accents to ensure EMVCo compliance
 */
function normalizeText(text: string, maxLength: number): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .toUpperCase()
    .trim()
    .substring(0, maxLength);
}

/**
 * Formats EMV Tag-Length-Value field
 */
function formatTlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return `${id}${len}${value}`;
}

/**
 * Calculates CRC16-CCITT (0x1021) with initial value 0xFFFF
 */
function calculateCrc16(payload: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ polynomial) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Generates official EMVCo BR Code (Pix Copia e Cola) standard
 */
export function generatePixBrCode(params: {
  key: string;
  amount: number;
  receiverName: string;
  receiverCity: string;
  txid?: string;
  description?: string;
}): string {
  const { key, amount, receiverName, receiverCity, txid = '***', description } = params;

  const cleanKey = key.replace(/[^\w@.-]/g, '');
  const cleanName = normalizeText(receiverName || 'SALAO LUXE', 25);
  const cleanCity = normalizeText(receiverCity || 'SAO PAULO', 15);
  const cleanTxid = normalizeText(txid.replace(/[^a-zA-Z0-9]/g, '') || '***', 25);

  // Payload Format Indicator (00)
  let payload = formatTlv('00', '01');

  // Point of Initiation Method: 12 = Static with defined amount, 11 = Dynamic
  payload += formatTlv('01', '12');

  // Merchant Account Information (26)
  let mai = formatTlv('00', 'br.gov.bcb.pix');
  mai += formatTlv('01', cleanKey);
  if (description) {
    const cleanDesc = normalizeText(description, 35);
    mai += formatTlv('02', cleanDesc);
  }
  payload += formatTlv('26', mai);

  // Merchant Category Code (52)
  payload += formatTlv('52', '0000');

  // Transaction Currency (53): 986 = BRL
  payload += formatTlv('53', '986');

  // Transaction Amount (54)
  if (amount > 0) {
    payload += formatTlv('54', amount.toFixed(2));
  }

  // Country Code (58): BR
  payload += formatTlv('58', 'BR');

  // Merchant Name (59)
  payload += formatTlv('59', cleanName);

  // Merchant City (60)
  payload += formatTlv('60', cleanCity);

  // Additional Data Field Template (62)
  const additional = formatTlv('05', cleanTxid);
  payload += formatTlv('62', additional);

  // CRC16 Placeholder (63)
  const payloadWithoutCrc = payload + '6304';
  const crc = calculateCrc16(payloadWithoutCrc);

  return payloadWithoutCrc + crc;
}

/**
 * Generates base64 QR Code data URL for canvas/image display
 */
export async function generatePixQrCodeDataUrl(brCode: string): Promise<string> {
  try {
    return await QRCode.toDataURL(brCode, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
  } catch (err) {
    console.error('Failed to generate Pix QR code', err);
    return '';
  }
}

export interface SalonSettings {
  tradeName: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
}

export function getDefaultSalonSettings(): SalonSettings {
  return {
    tradeName: 'Salão Luxe Unissex',
    cnpj: '12.345.678/0001-90',
    email: 'contato@salaoluxe.com',
    phone: '(11) 99999-8888',
    address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
  };
}

/**
 * Default salon Pix configuration
 */
export function getDefaultPixConfig(): PixConfig {
  return {
    keyType: 'cnpj',
    key: '12.345.678/0001-90',
    receiverName: 'SALAO LUXE UNISSEX LTDA',
    receiverCity: 'SAO PAULO',
    postalCode: '01415-000',
    gatewayProvider: 'mercadopago',
    autoWebhookEnabled: true,
    webhookSecret: 'whsec_luxe_' + Math.random().toString(36).substring(2, 12),
    webhookEndpoint: 'https://ais-dev-qe5jdbutcjb532w2n2wm2z-724585452024.us-west2.run.app/api/webhooks/pix'
  };
}

/**
 * Creates a unique Pix charge
 */
export async function createPixCharge(params: {
  amount: number;
  description: string;
  clientName: string;
  referenceType: 'servico' | 'produto' | 'avulso';
  referenceId?: string;
  config: PixConfig;
}): Promise<PixCharge> {
  const { amount, description, clientName, referenceType, referenceId, config } = params;
  const txid = `LX${Date.now().toString(36).toUpperCase()}${Math.floor(100 + Math.random() * 900)}`;

  const brCode = generatePixBrCode({
    key: config.key,
    amount,
    receiverName: config.receiverName,
    receiverCity: config.receiverCity,
    txid,
    description
  });

  const qrCodeDataUrl = await generatePixQrCodeDataUrl(brCode);

  const createdAt = new Date().toISOString();
  // Expires in 30 minutes
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  return {
    txid,
    amount,
    description,
    clientName,
    referenceType,
    referenceId,
    brCode,
    qrCodeDataUrl,
    status: 'pendente',
    createdAt,
    expiresAt
  };
}
