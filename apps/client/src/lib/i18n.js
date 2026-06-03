// apps/client/src/lib/i18n.js
// ─────────────────────────────────────────────────────────────────────────────
// Jan Systems i18n — Phase 1 Amharic UI Layer
// Lightweight translation dictionary. No external dependency.
// Usage:
//   const { t, lang } = useI18n();
//   <h1>{t('dashboard')}</h1>
// ─────────────────────────────────────────────────────────────────────────────
import { useStore } from '../store/useStore';

const translations = {
  // ── Navigation ──
  order:        { EN: 'Order',        AM: 'ትዕዛዝ' },
  service:      { EN: 'Service',      AM: 'አስተናጋጅ' },
  kitchen:      { EN: 'Kitchen',      AM: 'ኩሽና' },
  admin:        { EN: 'Admin',        AM: 'አስተዳደር' },
  owner:        { EN: 'Owner',        AM: 'ባለቤት' },
  home:         { EN: 'Home',         AM: 'መግቢያ' },

  // ── Dashboard ──
  dashboard:    { EN: 'Dashboard',    AM: 'አስተዳደር' },
  revenue:      { EN: 'Revenue',      AM: 'ጠቅላላ ገቢ' },
  orders:       { EN: 'Orders',       AM: 'ትዕዛዞች' },
  lowStock:     { EN: 'Low Stock',    AM: 'ያነሰ ክምችት' },
  stockValue:   { EN: 'Stock Value',  AM: 'የክምችት ዋጋ' },

  // ── Order Flow ──
  newOrder:     { EN: 'New Order',    AM: 'አዲስ ትዕዛዝ' },
  manage:       { EN: 'Manage',       AM: 'ማስተዳደር' },
  placeOrder:   { EN: 'Place Order',  AM: 'ትዕዛዝ ያስገቡ' },
  cart:         { EN: 'Cart',         AM: 'የእቃ መያዣ' },
  cartEmpty:    { EN: 'Cart Empty',   AM: 'ባዶ ነው' },
  total:        { EN: 'Total',        AM: 'ጠቅላላ' },
  customerName: { EN: 'Customer Name (Optional)', AM: 'የደንበኛ ስም (አማርኛ)' },
  selectTable:  { EN: 'Select a Table', AM: 'ጠረጴዛ ይምረጡ' },
  table:        { EN: 'Table',        AM: 'ጠረጴዛ' },
  tables:       { EN: 'Tables',       AM: 'ጠረጴዛዎች' },

  // ── Order Status ──
  statusNew:      { EN: 'New',        AM: 'አዲስ' },
  statusPreparing:{ EN: 'Preparing',  AM: 'በዝግጅት' },
  statusReady:    { EN: 'Ready',      AM: 'ዝግጁ' },
  statusDone:     { EN: 'Done',       AM: 'ተጠናቀቀ' },
  statusCancelled:{ EN: 'Cancelled',  AM: 'ተሰርዟል' },
  statusVoided:   { EN: 'Voided',     AM: 'ተሰርዟል' },

  // ── Payment ──
  payment:          { EN: 'Payment',           AM: 'ክፍያ' },
  paymentHistory:   { EN: 'Payment History',   AM: 'የክፍያ ታሪክ' },
  remainingBalance: { EN: 'Remaining Balance', AM: 'ቀሪ ሂሳብ' },
  addPayment:       { EN: 'Add Payment',       AM: 'ክፍያ ጨምር' },
  finalizeCheckout: { EN: 'Finalize & Checkout', AM: 'ሂሳብ ዝጋ' },
  cash:             { EN: 'Cash',              AM: 'ጥሬ ገንዘብ' },
  telebirr:         { EN: 'Telebirr',          AM: 'ቴሌብር' },
  cbeBirr:          { EN: 'CBE Birr',          AM: 'CBE ብር' },
  ethiopay:         { EN: 'EthioPay',          AM: 'ኢትዮፔይ' },
  bankTransfer:     { EN: 'Bank Transfer',     AM: 'ባንክ ዝውውር' },
  other:            { EN: 'Other',             AM: 'ሌላ' },
  bankRef:          { EN: 'Bank Reference No.', AM: 'የባንክ ዋቢ ቁጥር' },

  // ── Inventory ──
  inventory:    { EN: 'Inventory',    AM: 'ክምችት' },
  registerItem: { EN: 'Register Item', AM: 'ይመዝግቡ' },
  itemName:     { EN: 'Item Name',    AM: 'ስም' },
  quantity:     { EN: 'Quantity',     AM: 'ብዛት' },
  threshold:    { EN: 'Threshold',    AM: 'መቀነስያ' },
  costPerUnit:  { EN: 'Cost/Unit',    AM: 'ዋጋ' },
  status:       { EN: 'Status',       AM: 'ሁኔታ' },
  normal:       { EN: 'Normal',       AM: 'ተገቢ' },
  lowStockAlert:{ EN: 'Low Stock',    AM: 'ክምችት አነስተኛ ነው' },
  audit:        { EN: 'Audit',        AM: 'አስተካክል' },

  // ── Menu ──
  menu:         { EN: 'Menu',         AM: 'ምናሌ' },
  addItem:      { EN: 'Add Item',     AM: 'አዲስ ምናሌ' },
  editItem:     { EN: 'Edit Item',    AM: 'ምናሌ ያርሙ' },
  save:         { EN: 'Save',         AM: 'ያስቀምጡ' },
  delete:       { EN: 'Delete',       AM: 'ሰርዝ' },
  price:        { EN: 'Price',        AM: 'ዋጋ' },
  category:     { EN: 'Category',     AM: 'መደብ' },
  ingredients:  { EN: 'Ingredients',  AM: 'ጥሬ እቃዎች' },

  // ── Reports ──
  reports:      { EN: 'Reports',      AM: 'ሪፖርቶች' },
  log:          { EN: 'Log',          AM: 'ምዝግብ' },
  timestamp:    { EN: 'Timestamp',    AM: 'ጊዜ' },
  change:       { EN: 'Change',       AM: 'ለውጥ' },
  reason:       { EN: 'Reason',       AM: 'ምክንያት' },

  // ── Auth ──
  login:        { EN: 'Login',        AM: 'ዳሽቦርድ ይግቡ' },
  logout:       { EN: 'Logout',       AM: 'ውጣ' },
  email:        { EN: 'Email',        AM: 'ኢሜይል' },
  password:     { EN: 'Password',     AM: 'የይለፍ ቃል' },
  loginFailed:  { EN: 'Login failed', AM: 'መግባት አልተሳካም' },
  loginRequired:{ EN: 'Login Required', AM: 'እባክዎን መጀመሪያ ይግቡ' },

  // ── Kitchen ──
  inProgress:   { EN: 'In Progress',  AM: 'እየተሰራ ነው' },
  ready:        { EN: 'Ready',        AM: 'ዝግጁ' },
  markReady:    { EN: 'Mark Ready',   AM: 'ዝግጁ ምልክት ያድርጉ' },

  // ── Common ──
  confirm:      { EN: 'Are you sure?', AM: 'እርግጠኛ ነዎት?' },
  saved:        { EN: 'Saved!',       AM: 'ተቀምጧል!' },
  registered:   { EN: 'Registered!',  AM: 'ተመዝግቧል!' },
  adjusted:     { EN: 'Adjusted!',    AM: 'ተስተካክሏል!' },
  error:        { EN: 'An error occurred', AM: 'ስህተት ተፈጥሯል' },
  noData:       { EN: 'No data yet',  AM: 'ምንም መረጃ የለም' },
  loading:      { EN: 'Loading...',   AM: 'እየጫነ ነው...' },
  void:         { EN: 'Void',         AM: 'ሰርዝ' },
  voidOrder:    { EN: 'Void Order',   AM: 'ትዕዛዙ ሰርዝ' },
  voidReason:   { EN: 'Void Reason',  AM: 'ምክንያት' },
  staffPortal:  { EN: 'Secure Staff Portal', AM: 'ሠራተኛ መግቢያ' },

  // ── EFY / Date ──
  ethiopianDate:{ EN: 'Ethiopian Date', AM: 'የኢትዮጵያ ቀን' },
  gregorianDate:{ EN: 'Gregorian Date', AM: 'ዓለምአቀፍ ቀን' },
};

/**
 * useI18n — returns translation function and current language.
 * Language is stored in the global Zustand store (`lang`: 'EN' | 'AM').
 */
export function useI18n() {
  const lang = useStore(s => s.lang) || 'EN';

  /**
   * Translate a key. Falls back to the key itself if not found.
   * @param {string} key — key from translations dict
   * @param {'EN'|'AM'} [override] — force a specific language
   */
  const t = (key, override) => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[override || lang] || entry['EN'] || key;
  };

  /**
   * Bilingual label — returns "Amharic (English)" for headers.
   * Useful for staff-facing mixed labels.
   */
  const tb = (key) => {
    const entry = translations[key];
    if (!entry) return key;
    if (lang === 'AM') return `${entry.AM} (${entry.EN})`;
    return `${entry.EN} (${entry.AM})`;
  };

  return { t, tb, lang };
}

export { translations };
