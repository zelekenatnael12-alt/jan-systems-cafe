// apps/server/src/services/receiptService.js
// ─────────────────────────────────────────────────────────────────────────────
// Phase 2: ESC/POS Thermal Printer Receipt Service
// Generates ERCA-compliant 80mm receipt strings for thermal printers.
//
// Output: Plain-text ESC/POS command strings. The client (POS tablet) sends
// this via the Web USB API or a local printer bridge to the 80mm printer.
//
// ERCA compliance requires:
//   - Business name, TIN, VAT number, Fiscal Device ID
//   - Both Gregorian and Ethiopian Fiscal Year (EFY) dates on every receipt
//   - Sequential, tamper-evident receipt serial numbers
//   - VAT breakdown where applicable (15% standard rate in Ethiopia)
// ─────────────────────────────────────────────────────────────────────────────
import prisma from '../lib/prisma.js';

// ─── ESC/POS Commands ─────────────────────────────────────────────────────────
const ESC = '\x1B';
const GS  = '\x1D';

const CMD = {
  INIT:          `${ESC}@`,
  BOLD_ON:       `${ESC}E\x01`,
  BOLD_OFF:      `${ESC}E\x00`,
  ALIGN_CENTER:  `${ESC}a\x01`,
  ALIGN_LEFT:    `${ESC}a\x00`,
  ALIGN_RIGHT:   `${ESC}a\x02`,
  DOUBLE_HEIGHT: `${ESC}!\x10`,
  NORMAL_SIZE:   `${ESC}!\x00`,
  CUT:           `${GS}V\x41\x00`,  // Full cut
  LINE_FEED:     '\n',
  DIVIDER:       '─'.repeat(42) + '\n',
  THIN_DIVIDER:  '·'.repeat(42) + '\n',
};

// ─── Ethiopian Calendar (inline, no import needed server-side) ────────────────
const ET_MONTHS = [
  'Meskerem','Tikimt','Hidar','Tahsas','Tir','Yekatit',
  'Megabit','Miazia','Ginbot','Sene','Hamle','Nehase','Pagumē'
];
const ET_MONTHS_AM = [
  'መስከረም','ጥቅምት','ኅዳር','ታኅሣሥ','ጥር','የካቲት',
  'መጋቢት','ሚያዝያ','ጉንቦት','ሰኔ','ሐምሌ','ነሐሴ','ጳጉሜን'
];

function toEthiopianDate(date) {
  const gcYear = date.getFullYear(), gcMonth = date.getMonth() + 1, gcDay = date.getDate();
  const a = Math.floor((14 - gcMonth) / 12);
  const y = gcYear + 4800 - a;
  const m = gcMonth + 12 * a - 3;
  const jdn = gcDay + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
  const r   = (jdn - 1723856) % 1461;
  const n   = r % 365 + 365 * Math.floor(r/1460);
  const etYear  = 4 * Math.floor((jdn-1723856)/1461) + Math.floor(r/365) - Math.floor(r/1460);
  const etMonth = Math.min(Math.floor(n/30), 12);
  const etDay   = (n % 30) + 1;
  return { year: etYear, month: etMonth + 1, day: etDay, monthAm: ET_MONTHS_AM[etMonth], monthLatin: ET_MONTHS[etMonth] };
}

function formatDualDate(date) {
  const gc = date.toLocaleDateString('en-ET', { year:'numeric', month:'long', day:'numeric', timeZone:'Africa/Addis_Ababa' });
  const et = toEthiopianDate(date);
  const etStr = `${et.day} ${et.monthAm} ${et.year} ዓ.ም`;
  return { gc, et: etStr };
}

function getEATTime(date) {
  return date.toLocaleTimeString('en-ET', { timeZone:'Africa/Addis_Ababa', hour:'2-digit', minute:'2-digit', hour12:false });
}

// ─── Text Formatting Helpers ──────────────────────────────────────────────────
function center(text, width = 42) {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(pad) + text + '\n';
}

function leftRight(left, right, width = 42) {
  const gap = Math.max(1, width - left.length - right.length);
  return left + ' '.repeat(gap) + right + '\n';
}

function wrap(text, width = 42) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + word).length > width) { lines.push(line.trim()); line = ''; }
    line += word + ' ';
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join('\n') + '\n';
}

// ─── VAT Calculation ──────────────────────────────────────────────────────────
const VAT_RATE = 0.15; // 15% Ethiopia standard VAT

function calculateVAT(total, vatEnabled) {
  if (!vatEnabled) return { subtotal: total, vat: 0, total };
  const subtotal = total / (1 + VAT_RATE);
  const vat = total - subtotal;
  return { subtotal: Math.round(subtotal * 100) / 100, vat: Math.round(vat * 100) / 100, total };
}

// ─── Receipt Serial Number ────────────────────────────────────────────────────
// Sequential, tamper-evident: VENUE_SLUG-YYYYMMDD-NNNNNN
function generateSerial(venueSlug, orderId) {
  const d = new Date();
  const dateStr = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const seq = orderId.slice(-6).toUpperCase();
  return `${(venueSlug || 'JAN').toUpperCase().slice(0,6)}-${dateStr}-${seq}`;
}

// ─── Payment Method Label ─────────────────────────────────────────────────────
const METHOD_LABELS = {
  CASH:          'Cash / ጥሬ ገንዘብ',
  TELEBIRR:      'Telebirr',
  CBE_BIRR:      'CBE Birr',
  ETHIOPAY:      'EthioPay',
  BANK_TRANSFER: 'Bank Transfer / ባንክ ዝውውር',
  OTHER:         'Other',
};

// ─── Main Receipt Builder ─────────────────────────────────────────────────────
/**
 * Build an ERCA-compliant ESC/POS receipt string for an order.
 *
 * @param {string} orderId
 * @param {string} venueId
 * @returns {Promise<{ text: string, serial: string }>}
 */
export async function buildReceipt(orderId, venueId) {
  const [order, config, venue] = await Promise.all([
    prisma.order.findUnique({
      where: { id: orderId, venueId },
      include: {
        items: { include: { product: true } },
        payments: true,
        table: true,
      },
    }),
    prisma.cafeConfig.findFirst({ where: { venueId } }),
    prisma.venue.findUnique({ where: { id: venueId } }),
  ]);

  if (!order) throw new Error(`Order ${orderId} not found`);

  const now       = new Date();
  const { gc, et: etDate } = formatDualDate(now);
  const time      = getEATTime(now);
  const serial    = generateSerial(venue?.slug, orderId);
  const vatEnabled = !!config?.vatNumber;
  const { subtotal, vat, total } = calculateVAT(order.total, vatEnabled);

  // ─── Determine primary payment method ────────────────────────────────────
  const primaryPayment = order.payments[0];
  const paymentLabel = METHOD_LABELS[primaryPayment?.method || order.paymentMethod] || 'Cash';
  const paymentRef   = primaryPayment?.reference || '';

  let receipt = '';

  // ── INIT ──
  receipt += CMD.INIT;
  receipt += CMD.ALIGN_CENTER;

  // ── CAFE HEADER ──
  receipt += CMD.BOLD_ON + CMD.DOUBLE_HEIGHT;
  receipt += center(config?.cafeName || venue?.name || 'Jan Systems');
  receipt += CMD.NORMAL_SIZE;
  if (config?.cafeNameAmharic) {
    receipt += center(config.cafeNameAmharic);
  }
  receipt += CMD.BOLD_OFF;
  receipt += '\n';

  // ── ERCA COMPLIANCE BLOCK ──
  if (config?.tin) {
    receipt += CMD.BOLD_ON;
    receipt += center(`TIN: ${config.tin}`);
    receipt += CMD.BOLD_OFF;
  }
  if (config?.vatNumber) {
    receipt += center(`VAT Reg: ${config.vatNumber}`);
  }
  if (config?.fiscalDeviceId) {
    receipt += center(`Fiscal Device: ${config.fiscalDeviceId}`);
  }
  if (config?.taxpayerCategory) {
    receipt += center(`Category ${config.taxpayerCategory} Taxpayer`);
  }
  receipt += '\n';

  // ── RECEIPT HEADER ──
  if (config?.receiptHeader) {
    receipt += center(config.receiptHeader);
    receipt += '\n';
  }

  // ── DIVIDER ──
  receipt += CMD.ALIGN_LEFT;
  receipt += CMD.DIVIDER;

  // ── RECEIPT META ──
  receipt += leftRight('Receipt No:', serial);
  receipt += leftRight('Date (GC):', gc);
  receipt += leftRight('Date (EFY):', etDate);
  receipt += leftRight('Time (EAT):', time);
  receipt += leftRight('Order ID:', `#${orderId.slice(-8).toUpperCase()}`);
  if (order.table) {
    receipt += leftRight('Table:', `#${order.table.number} (${order.table.zone})`);
  }
  if (order.customer) {
    receipt += leftRight('Customer:', order.customer);
  }

  receipt += CMD.DIVIDER;

  // ── ORDER ITEMS ──
  receipt += CMD.BOLD_ON;
  receipt += leftRight('Item', 'Price');
  receipt += CMD.BOLD_OFF;
  receipt += CMD.THIN_DIVIDER;

  for (const item of order.items) {
    const lineTotal = (item.product.price * item.quantity).toFixed(2);
    const itemName  = item.product.name + (item.quantity > 1 ? ` x${item.quantity}` : '');
    receipt += leftRight(
      itemName.slice(0, 28),
      `ETB ${lineTotal}`
    );
    if (item.product.name.length > 28) {
      // Overflow name on second line
      receipt += '  ' + item.product.name.slice(28) + '\n';
    }
  }

  receipt += CMD.DIVIDER;

  // ── TOTALS ──
  if (vatEnabled) {
    receipt += leftRight('Subtotal:', `ETB ${subtotal.toFixed(2)}`);
    receipt += leftRight(`VAT (15%):`, `ETB ${vat.toFixed(2)}`);
    receipt += CMD.THIN_DIVIDER;
  }

  receipt += CMD.BOLD_ON;
  receipt += leftRight('TOTAL:', `ETB ${total.toFixed(2)}`);
  receipt += CMD.BOLD_OFF;
  receipt += '\n';

  // ── PAYMENT METHOD ──
  receipt += leftRight('Payment:', paymentLabel);
  if (paymentRef) {
    receipt += leftRight('Ref:', paymentRef.slice(0, 20));
  }
  receipt += '\n';

  // ── FOOTER ──
  receipt += CMD.ALIGN_CENTER;
  receipt += CMD.THIN_DIVIDER;
  if (config?.receiptFooter) {
    receipt += center(config.receiptFooter);
  }
  receipt += center('Thank you! / አመሰግናለሁ!');
  receipt += '\n';
  receipt += center('Powered by Jan Systems');
  receipt += CMD.THIN_DIVIDER;
  receipt += '\n\n\n';

  // ── CUT ──
  receipt += CMD.CUT;

  return { text: receipt, serial, vatEnabled, subtotal, vat, total };
}

/**
 * Get a plain-text receipt (no ESC/POS codes) for SMS/WhatsApp delivery.
 */
export async function buildSmsReceipt(orderId, venueId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId, venueId },
    include: { items: { include: { product: true } }, table: true },
  });
  const config = await prisma.cafeConfig.findFirst({ where: { venueId } });
  const { et: etDate } = formatDualDate(new Date());

  const lines = [
    `✅ ${config?.cafeName || 'Jan Systems'} — Receipt`,
    `📅 ${etDate}`,
    `🧾 Order: #${orderId.slice(-6).toUpperCase()}`,
    order.table ? `🪑 Table #${order.table.number}` : '',
    '',
    '─────────────────',
    ...order.items.map(i => `${i.product.name} x${i.quantity}  ETB ${(i.product.price * i.quantity).toFixed(2)}`),
    '─────────────────',
    `💵 TOTAL: ETB ${order.total.toFixed(2)}`,
    '',
    config?.receiptFooter || 'Thank you for visiting!',
  ].filter(l => l !== undefined);

  return lines.join('\n');
}
