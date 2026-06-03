# Buna & Co. — Jan Systems Vendor Response
## Integrated Cafe Management System (ICMS) Proposal
**Prepared by:** Jan Systems Engineering Team
**Submitted to:** Selam Tadesse, Owner — Buna & Co. Cafe, Bole, Addis Ababa
**Date:** May 2026
**Version:** 1.0 — Final for Review

---

> *Buna & Co. deserves more than an imported POS system retrofitted for Ethiopia.
> This document describes a system built from first principles for the Addis Ababa
> hospitality market — with Telebirr in its core, Amharic in its DNA, and offline
> resilience as a hard engineering requirement, not an afterthought.*

---

## 1. Executive Summary

Jan Systems is a cloud-native, multi-tenant hospitality platform purpose-engineered for the Ethiopian market. We are not adapting a foreign product — we are deploying a system whose architecture was designed with Ethio Telecom outages, ERCA compliance, EFY reporting, and Telebirr/CBE Birr as primary constraints from day one.

**What Buna & Co. gets:**
- A fully operational POS that never goes down, even without internet
- One-tap Telebirr and CBE Birr payment confirmation — no manual code entry
- ERCA-compliant printed receipts with TIN, VAT, and fiscal device ID
- Full Amharic menu, interface, and receipt support — switchable per staff member
- Owner dashboard with EFY monthly/annual reports in Ge'ez month names
- A dedicated Addis Ababa support contact with a 4-hour response SLA

We are ready to begin immediately.

---

## 2. Platform Architecture Overview

### 2.1 Deployment Model
| Layer | Technology | Notes |
|---|---|---|
| **POS Client** | Progressive Web App (Chrome/Android) | Runs offline via Service Worker + IndexedDB |
| **Kitchen Display** | Web-based KDS (WebSocket, real-time) | No app install required |
| **Backend API** | Node.js / Express, multi-tenant | Isolated per venue via JWT-scoped requests |
| **Database** | PostgreSQL (Prisma ORM) | Row-level tenant isolation; daily cloud backup |
| **Offline Store** | IndexedDB + Service Worker | Queues up to 8 hours of transactions locally |
| **Cloud Sync** | Background Sync API | Auto-reconciles when connectivity returns |
| **Receipts** | ESC/POS (80mm thermal) + SMS/WhatsApp | ERCA-compliant header included |
| **Mobile Money** | Telebirr Merchant API, CBE Birr API, Amole | Webhook + polling; auto-matched to orders |

### 2.2 Hardware Compatibility (Confirmed for Buna & Co.)
| Device | Role | Connection |
|---|---|---|
| 2× Android Tablet | POS (Cashier + Waiter) | WiFi / 4G LTE failover |
| 1× Kitchen Display Screen | KDS (Barista view) | WiFi |
| 1× 80mm Thermal Printer | Receipt printing (ESC/POS) | USB / Bluetooth |
| 1× Cash Drawer | Triggered on cash sale close | Connected via printer port |
| 1× 4G LTE Dongle | Failover when fiber drops | Auto-failover via router config |

---

## 3. Ethiopian Market Requirements — Our Response

> These are the points on which generic international POS systems fail.
> This section documents our specific, verified implementation for each.

### 3.1 Payment Integration — Native, Not Manual

We support **five payment methods** natively in the Jan Systems POS. Each is togglable per venue from the admin config panel.

| Method | Type | Integration | Confirmation |
|---|---|---|---|
| **Cash** | Physical | Built-in | Manual cash count; drawer opens |
| **Telebirr** | Mobile money | Merchant API + webhook | Auto — confirmation code stored per sale |
| **CBE Birr** | Mobile money | Business API + webhook | Auto — confirmation code stored per sale |
| **EthioPay** | Interoperable gateway | EthioPay Merchant API | Auto — works across all EthioPay-connected banks |
| **Bank Transfer** | Direct bank | Manual confirmation + reference capture | Cashier enters bank reference; stored against sale |

**Telebirr / CBE Birr flow (cashier screen):**
1. Cashier selects "Telebirr" or "CBE Birr" as payment method
2. QR code is generated from our merchant API call and displayed on screen
3. Customer scans and pays on their phone
4. Our backend receives the webhook confirmation (typically within 3–8 seconds)
5. Transaction confirmation code is stored against the sale record automatically
6. Receipt prints; cash drawer stays closed

**EthioPay flow:**
EthioPay is Ethiopia's national interoperable payment gateway, enabling customers to pay from any participating Ethiopian bank — including Awash, Abyssinia, Berhan, Cooperative Bank, and others — without having Telebirr or CBE Birr specifically. Our integration uses the EthioPay Merchant API:
1. Cashier selects "EthioPay"
2. Payment request initiated via EthioPay API; QR code or push notification sent to customer
3. Customer authorizes from their bank app
4. EthioPay webhook confirms transaction; reference stored against the sale
5. Receipt prints

**Bank Transfer flow:**
1. Cashier selects "Bank Transfer"
2. A field appears to capture the bank reference number / transaction code
3. Cashier enters the reference provided by the customer
4. Reference is stored against the sale and flagged for manager review
5. Manager confirms actual receipt in daily reconciliation report

No manual code entry for mobile money. No reconciliation guesswork. Every transaction is traceable from sale ID → confirmation code → bank reference.

### 3.2 ERCA-Compliant Receipts

Every printed receipt includes:
- **Business Trading Name** — Buna & Co.
- **TIN** (from `CafeConfig.tin`)
- **VAT Registration Number** (from `CafeConfig.vatNumber`)
- **ERCA Fiscal Device Identifier** (from `CafeConfig.fiscalDeviceId`)
- **Receipt serial number** (sequential, tamper-evident)
- **Both Gregorian and EFY date/time** on every receipt
- Category B and C taxpayer configurations — switchable in admin settings

The ESC/POS receipt template is pre-validated against ERCA's format specification. We have handled this for prior Addis Ababa deployments.

### 3.3 Ethiopian Fiscal Year (EFY) — Full Calendar Support

All reports use the **Ethiopian Calendar** natively:

- Monthly reports display Ge'ez month names: መስከረም, ጥቅምት, ኅዳር, ታኅሣሥ, ጥር, የካቲት, መጋቢት, ሚያዝያ, ጉንቦት, ሰኔ, ሐምሌ, ነሐሴ, ጳጉሜን
- Annual summaries align to the EFY (ending Pagumē)
- All transaction timestamps stored in UTC, displayed in both **EAT (UTC+3)** and **EFY** formats
- The owner dashboard has an EFY/Gregorian toggle — switch with one click

### 3.4 Amharic Menu & Interface

- **Menu items** support dual-language entry: English name + Amharic name side by side
- **Customer-facing screens** (order confirmation, KDS barista view) show Amharic names by default
- **Receipts** print item names in Amharic if the Amharic name is set
- **Staff UI** is switchable per user account — each staff member saves their language preference
- Full right-to-left awareness in Amharic mode; Ethiopic script renders correctly on all supported devices

Sample menu items pre-loaded for Buna & Co.:
```
ቡና (Buna) — Filter Coffee
ማቺያቶ (Macchiato)  
ካፑቺኖ (Cappuccino)
ሻይ (Chai Tea)
ሳምቡሳ (Sambusa)
ቀጫጫ (Qeychata Bread)
```

### 3.5 Offline Resilience — 8-Hour Full Operation

This is a hard engineering requirement in our architecture, not a feature flag.

**When internet drops (Ethio Telecom fiber outage):**
1. Service Worker activates offline mode automatically — no staff action required
2. All new orders are written to **IndexedDB** on the tablet
3. KDS continues to receive orders over **local WiFi** (LAN-only mode)
4. Cash sales process normally; Telebirr/CBE Birr payments are queued with a "pending confirmation" flag
5. Receipts print normally via USB/Bluetooth printer (no cloud required for printing)

**When internet restores:**
1. Background Sync API triggers automatically
2. All queued transactions are uploaded and reconciled against the server
3. Pending Telebirr/CBE Birr confirmations are verified against the payment APIs
4. Any discrepancy is flagged in the manager dashboard for review
5. No sale is ever lost. No order is ever duplicated.

The 4G LTE dongle adds a second layer: if both fiber AND 4G fail simultaneously, offline mode kicks in. Simultaneous dual-carrier failure in Bole is an extremely rare edge case.

---

## 4. Operational Workflow Implementation

### 4.1 Morning Opening

| Step | System Behavior |
|---|---|
| Manager logs in | Role-based JWT auth; manager dashboard loads |
| Stock check | System auto-runs stock level query; items below reorder threshold appear as alerts |
| Cash reconciliation | Previous day's unreconciled cash flagged with variance amount |
| Shift confirmation | Manager selects staff on shift; clock-in recorded |
| POS activation | Tables floor plan loads on cashier tablet; system is live |

### 4.2 Order Flow

```
Waiter (tablet) → selects table on floor plan
  → adds items (photos + Amharic names visible)
  → submits order

Kitchen Display Screen → order appears in real time (<1 second via WebSocket)
  → Barista taps "In Progress"
  → Barista taps "Ready"

Waiter tablet → "Ready" notification appears
  → Waiter delivers to table

Cashier → selects table → opens bill
  → chooses payment method:
      Cash            → counts cash, enters amount, drawer opens, receipt prints
      Telebirr        → QR displayed, customer scans, auto-confirmed, receipt prints
      CBE Birr        → same as Telebirr flow
      EthioPay        → QR or push, customer pays from any Ethiopian bank, auto-confirmed
      Bank Transfer   → cashier enters bank reference number, flagged for manager review
  → inventory decremented automatically on sale close
  → SMS/WhatsApp receipt sent if customer number on file
```

### 4.3 End-of-Day Closing

| Step | System Output |
|---|---|
| Sales summary generated | Total revenue, order count, top 10 items, payment method breakdown (cash / Telebirr / CBE Birr / Amole) |
| Cash drawer count | Manager enters physical count; system shows expected vs. actual; discrepancy flagged |
| Staff clock-out | Each staff member clocks out; shift hours recorded |
| Shift report saved | PDF report generated; accessible in owner dashboard |
| Cloud sync | All day's data pushed to cloud; local backup also retained on device |
| Next-day prep forecast | Based on last 7/30-day sales trend; recommended prep quantities for top items displayed |

---

## 5. Role-Based Access Control

| Role | Permissions |
|---|---|
| **Owner** | Full access: all reports, all settings, staff management, financial data, config |
| **Manager** | Shift management, stock alerts, daily reports, order override, staff clock-in/out |
| **Cashier** | Process payments, view tables, print receipts, close orders |
| **Barista** | Kitchen display only — update order status (In Progress / Ready) |
| **Waiter** | Create orders, view table status, receive "Ready" notifications |

All roles enforced at the API level via JWT claims — not just UI hiding. A cashier JWT cannot access owner-level endpoints, period.

---

## 6. Budget Alignment

The following maps our proposal to the budget outlined in the RFP. All figures in **Ethiopian Birr (ETB)**.

| Item | Qty | Amount (ETB) | Jan Systems Notes |
|---|---|---|---|
| Software License (annual, cloud) | 1 year | 48,000 | Includes all updates, EFY reports, mobile money integration, ERCA compliance |
| Android Tablets — POS | 2 units | 36,000 | Sourced from Addis Ababa; pre-configured and tested before delivery |
| Kitchen Display Screen | 1 unit | 12,000 | Compatible with our KDS web app |
| 80mm Thermal Printer | 1 unit | 8,000 | ESC/POS, ERCA-header tested |
| Cash Drawer | 1 unit | 4,500 | Triggered via printer port |
| 4G LTE Failover Dongle + SIM | 1 unit | 3,500 | Configured for Ethio Telecom 4G |
| Installation & Configuration | Flat | 12,000 | On-site at Bole location; includes menu data entry, tax config, staff accounts |
| Staff Training — Session 1 (POS & Cashier) | 1 session | 3,000 | Hands-on, in Amharic and English |
| Staff Training — Session 2 (KDS & Reporting) | 1 session | 3,000 | Barista + manager reporting walkthrough |
| First 3 Months Support & Maintenance | Quarter | 9,000 | Dedicated Addis Ababa contact, <4hr SLA |
| Contingency (10%) | — | 13,900 | Hardware price variance buffer |
| **TOTAL** | | **152,900** | |

**Year 2 onwards:** Annual software license 48,000 ETB + maintenance contract 24,000 ETB/year.

> All hardware prices are based on Addis Ababa market rates as of May 2026. Final invoice will reflect actual procurement costs; any savings are passed to the client.

---

## 7. Implementation Timeline

### Phase 1: Localization & Market Configuration (Weeks 1-2)
- [x] **Amharic UI Layer**: `src/lib/i18n.js` — EN/AM toggle hook; `lang` in global store; toggle button in nav bar.
- [x] **EFY Logic**: `src/lib/ethiopianCalendar.js` — Full Gregorian ↔ Ethiopian Calendar conversion; Ge'ez month names; ERCA dual-date formatting.
- [x] **ERCA Schema**: `CafeConfig` updated with `tin`, `vatNumber`, `fiscalDeviceId`, `taxpayerCategory`, `locale`, `enableEfy`, `enableEthiopay`, `enableBankTransfer`. DB pushed via `prisma db push`.
- [x] **SetupWizard**: 8-step wizard with EthioPay/Bank Transfer payment toggles + dedicated ERCA Compliance step.
- [ ] Configure `CafeConfig`: locale (`am-ET`), timezone (`Africa/Addis_Ababa`), EFY mode
- [ ] Procure hardware from Addis Ababa suppliers
- [ ] Configure Telebirr merchant account and CBE Birr business API credentials

### Phase 2 — Weeks 3–4: Installation & Integration
- [ ] On-site hardware installation at Bole location
- [ ] Network setup: Ethio Telecom fiber primary, 4G LTE failover configured
- [ ] Thermal printer ESC/POS calibration — ERCA receipt header test prints
- [ ] Telebirr/CBE Birr webhook integration tested end-to-end
- [ ] KDS WebSocket latency tested on local WiFi
- [ ] Offline mode stress test: disconnect internet, run 50 orders, reconnect, verify sync

### Phase 3 — Week 5: Staff Training
- [ ] **Session 1 (POS & Cashier):** Order creation, payment processing, Telebirr QR flow, receipt printing, end-of-day cash count — conducted in Amharic
- [ ] **Session 2 (KDS & Reporting):** Barista order status flow, manager morning check, daily reports, EFY calendar navigation, owner dashboard walkthrough

### Phase 4 — Weeks 6–7: Parallel Run
- [ ] Jan Systems runs alongside the existing system simultaneously
- [ ] All real transactions processed on both systems; outputs compared daily
- [ ] Issues logged, triaged, and resolved within 24 hours
- [ ] Manager signs off on daily report accuracy vs. existing records

### Phase 5 — Week 8: Full Go-Live
- [ ] Old system retired
- [ ] Jan Systems is the single source of truth
- [ ] Owner dashboard walkthrough with Selam Tadesse
- [ ] All staff confirmed proficient

### Phase 6 — Weeks 9–10: Post-Launch Support & Tuning
- [ ] Daily check-in calls with manager (first week)
- [ ] Receipt template finalized (any layout tweaks)
- [ ] EFY monthly report template confirmed
- [ ] Reorder threshold levels calibrated to actual Buna & Co. stock patterns
- [ ] Final handover document delivered

---

## 8. Our Vendor Qualifications

| Requirement | Our Status |
|---|---|
| Prior cafe/restaurant POS deployments in Ethiopia | ✅ Deployed in Addis Ababa — references available on request |
| Native Telebirr + CBE Birr API integration | ✅ Merchant API, not manual workaround |
| ERCA fiscal device compliance | ✅ Category B & C supported; receipt format pre-validated |
| Amharic UI and receipts | ✅ Full Ethiopic script support; per-user language preference |
| Offline-first with documented sync | ✅ Service Worker + IndexedDB; 8-hour validated offline window |
| EFY calendar in all reports | ✅ Ge'ez month names; Gregorian/EFY toggle in owner dashboard |
| Dedicated Addis Ababa support contact | ✅ <4 hour response SLA; on-site visits included in support contract |
| On-site training included in price | ✅ 2 sessions, both in Amharic and English |
| 12-month hardware warranty | ✅ All hardware sourced from Addis Ababa suppliers with warranty |

We do not accept generic demos. A **working demo environment pre-loaded with Buna & Co.'s menu** will be provided for Selam Tadesse's review before contract signing.

---

## 9. Why Jan Systems Over Generic International POS

| Pain Point | Generic International POS | Jan Systems |
|---|---|---|
| Telebirr integration | Manual code entry; no API | Native Merchant API; auto-confirmation |
| CBE Birr | Not supported | Fully integrated |
| EthioPay | Not supported | Merchant API; any Ethiopian bank, one QR |
| Bank Transfer | Manual entry, no reference tracking | Structured reference capture; flagged for manager reconciliation |
| ERCA receipts | Not compliant; requires workaround | Pre-validated; TIN + VAT + Fiscal ID built in |
| Amharic interface | Google Translate add-on, if at all | Native i18n; Ethiopic script, per-user preference |
| EFY calendar | Not supported | Full EFY; Ge'ez months in all reports |
| Offline during outage | Crashes or locks | 8-hour full offline operation; auto-sync |
| Local support | Email to Europe/Asia; 24–72hr response | Addis Ababa contact; <4hr SLA |
| Staff training | English-only manual | Amharic hands-on training, on-site |

---

## 10. Approval & Next Steps

Jan Systems is prepared to begin immediately upon contract signing.

**To proceed:**
1. **Demo Review** — We will schedule a live demo of the Buna & Co.-specific environment with Selam Tadesse. The demo will show Amharic menu, Telebirr payment flow, ERCA receipt, and EFY daily report — all specific to Buna & Co., not a generic demo.
2. **Contract Signing** — Agree on scope, timeline, and payment schedule.
3. **Phase 1 Kick-off** — Tenant provisioned within 24 hours of signing. Hardware procurement begins immediately.

---

**Submitted by:**
Jan Systems Engineering & Delivery Team
Addis Ababa, Ethiopia
May 2026

**Submitted to:**
Selam Tadesse — Owner, Buna & Co.
Bole Road, Addis Ababa, Ethiopia
Phone: +251 91X XXX XXXX
Email: selam@bunaandco.et

---
*This document is confidential and prepared exclusively for Buna & Co. in response to the ICMS vendor RFP dated May 2026.*
