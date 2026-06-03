# Jan Systems — Deployment Guide
**Version 2.0 | Last updated: May 2026**

> This document is your single source of truth for deploying Jan Systems on any Windows machine.  
> If you follow every step in order, the system will be running in under 30 minutes.

---

## Prerequisites Checklist

Before you begin, confirm you have:
- [ ] A Windows 10 or 11 PC (64-bit)
- [ ] Administrator access to the machine
- [ ] The project folder (from USB drive, Google Drive, or OneDrive)
- [ ] Internet access (first-time installs only)

---

## Step 1 — Install Node.js

1. Go to **https://nodejs.org** and download the **LTS** version (v20 or newer).
2. Run the installer. Accept all defaults. Make sure **"Add to PATH"** is checked.
3. Open PowerShell and verify:
   ```powershell
   node --version   # Should print v20.x.x or higher
   npm --version    # Should print 10.x.x or higher
   ```

---

## Step 2 — Install PostgreSQL

> The project folder contains a bundled installer: `postgres_installer.exe`

1. Run `postgres_installer.exe` as Administrator.
2. When prompted:
   - **Installation directory**: Leave as default (`C:\Program Files\PostgreSQL\16`)
   - **Data directory**: Leave as default
   - **Password**: Set to `postgres` *(must match the DATABASE_URL below)*
   - **Port**: `5432` *(default — do not change)*
   - **Locale**: Default
3. Finish the installation. Do **not** launch Stack Builder.
4. Open PowerShell and verify PostgreSQL is running:
   ```powershell
   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "SELECT version();"
   ```
   Enter password `postgres` when prompted. You should see a version string.

**Create the database:**
```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE jansystems;"
```

---

## Step 3 — Configure Environment Variables

### Server (.env)
Create the file `apps\server\.env` with the following content:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/jansystems"
PORT=3002
NODE_ENV=production
STORAGE_PROVIDER="local"
SUPERADMIN_PASSWORD="janinstaller2026"
```

> ⚠️ **IMPORTANT:** If you have set a static IP (see Step 7), also note it — you will need it for the client `.env` below.

### Client (.env)
Create the file `apps\client\.env` with the following content:

```env
# Replace 192.168.x.x with this machine's static local IP address
VITE_API_URL="http://192.168.x.x:3002"
```

> For local-only use (single device), you can use `http://localhost:3002` instead.

---

## Step 4 — Install Dependencies

Open PowerShell in the **project root folder** (the folder containing `package.json`):

```powershell
npm install
```

This installs dependencies for both the server and client in one command.

---

## Step 5 — Run Database Migration

```powershell
cd apps\server
npx prisma migrate deploy
cd ..\..
```

This applies all database schema migrations. You should see:
```
All migrations have been successfully applied.
```

> If you see "no migrations found", run `npx prisma migrate dev` instead (development only).

---

## Step 6 — Seed the Database

This creates the SUPERADMIN installer account and default records:

```powershell
cd apps\server
npx prisma db seed
cd ..\..
```

Expected output:
```
Running standard seed...
Standard seed complete.
```

**Default accounts created by seed:**
| Role       | Email                      | Password        |
|------------|----------------------------|-----------------|
| SUPERADMIN | installer@jansystems.com   | janinstaller2026|
| OWNER      | owner@jansystems.com       | owner123        |
| ADMIN      | admin@jansystems.com       | admin123        |

> ⚠️ **Change all passwords after first login on every new client installation.**

---

## Step 7 — Set a Static IP Address (One-Time Setup Per Machine)

This prevents the server IP from changing between reboots or demo sessions.

1. Press `Windows + R`, type `ncpa.cpl`, press Enter.
2. Right-click your active network adapter → **Properties**.
3. Select **Internet Protocol Version 4 (TCP/IPv4)** → **Properties**.
4. Select **"Use the following IP address"** and enter:
   - **IP address**: `192.168.1.100` *(or whatever your router's subnet is — check with `ipconfig`)*
   - **Subnet mask**: `255.255.255.0`
   - **Default gateway**: Your router IP (usually `192.168.1.1`)
   - **Preferred DNS**: `8.8.8.8`
   - **Alternate DNS**: `8.8.4.4`
5. Click OK → Close.
6. Update `apps\client\.env` → set `VITE_API_URL` to use this static IP.

---

## Step 8 — Open Firewall Port

Allow mobile devices and tablets on the same Wi-Fi to reach the server:

```powershell
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "Jan Systems API" -Direction Inbound -Protocol TCP -LocalPort 3002 -Action Allow
```

Verify the rule exists:
```powershell
Get-NetFirewallRule -DisplayName "Jan Systems API"
```

---

## Step 9 — Build the Client (Production)

```powershell
cd apps\client
npm run build
cd ..\..
```

The built client will be in `apps\client\dist\`. This is what browsers load.

---

## Step 10 — Start the System

### Development mode (both server and client with hot-reload):
```powershell
npm run dev
```

### Production mode (server only, client served as static files):
```powershell
npm run start --workspace=@jan-systems/server
```

The system will be accessible at:
- **Local (this machine):** `http://localhost:5173` (dev) or served by server
- **On local network (tablets/phones):** `http://192.168.x.x:3002`

---

## Step 11 — Run the Setup Wizard (First Client Installation)

1. Open a browser and navigate to the app URL.
2. You will be redirected to the **Setup Wizard** automatically.
3. Log in with the SUPERADMIN credentials: `installer@jansystems.com` / `janinstaller2026`
4. Fill in:
   - Cafe name (English and Amharic)
   - Owner account (name, email, new password)
   - Admin account (name, email, new password)
5. Click **"Seed Demo Data"** to populate the menu and stock.
6. The system is now live.

---

## Verification Checklist

After setup, verify the following before handing over to the client:

- [ ] `http://localhost:3002/api/health` returns `{"status":"ok"}`
- [ ] Login works with the Owner account
- [ ] Menu items appear in the Waiter view
- [ ] Kitchen view receives orders in real-time
- [ ] Admin inventory page shows stock levels
- [ ] A mobile device on the same Wi-Fi can reach `http://192.168.x.x:3002/api/health`

---

## Database Reset (Clean State for New Client)

> ⚠️ This destroys all data. Only run on a fresh installation or demo reset.

```powershell
cd apps\server
npx prisma migrate reset --force
npx prisma db seed
cd ..\..
```

Or run the dedicated reset script from the project root:
```powershell
node scripts\reset-db.js
```

---

## Troubleshooting

### "Cannot connect to database"
- Confirm PostgreSQL service is running: `Get-Service postgresql*`
- Start it if stopped: `Start-Service postgresql-x64-16`
- Verify the `DATABASE_URL` in `apps\server\.env`

### "Port 3002 already in use"
```powershell
netstat -ano | findstr :3002
taskkill /PID <PID_NUMBER> /F
```

### "Mobile device cannot reach the server"
- Confirm firewall rule exists (Step 8)
- Confirm both devices are on the same Wi-Fi network
- Confirm `VITE_API_URL` in `apps\client\.env` uses the machine's IP, not `localhost`
- Re-build the client after changing `.env`: `npm run build --workspace=@jan-systems/client`

### "Prisma client not generated"
```powershell
cd apps\server
npx prisma generate
```

### PostgreSQL password reset
```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

---

## File Structure Reference

```
jan systems cafe/
├── apps/
│   ├── client/          # React/Vite frontend
│   │   ├── .env         # VITE_API_URL goes here
│   │   └── src/
│   └── server/          # Node/Express backend
│       ├── .env         # DATABASE_URL, PORT, etc.
│       ├── prisma/
│       │   ├── schema.prisma   # Database models
│       │   ├── seed.js         # Demo data seeder
│       │   └── migrations/     # DB migration history
│       └── src/
│           ├── server.js       # Main API entry point
│           └── services/       # Business logic
├── scripts/
│   └── reset-db.js      # Clean database reset script
├── package.json         # Root workspace config
└── DEPLOYMENT.md        # This file
```

---

## Default Credentials Summary

| Account    | Email                    | Default Password  | Change On First Login? |
|------------|--------------------------|-------------------|------------------------|
| SUPERADMIN | installer@jansystems.com | janinstaller2026  | ✅ Yes                 |
| OWNER      | Set during Setup Wizard  | Set by you        | Advise client to change|
| ADMIN      | Set during Setup Wizard  | Set by you        | Advise client to change|
| PostgreSQL | postgres                 | postgres          | Optional               |

---

*Jan Systems v2.0 — Built for Ethiopian cafes. Deploy with confidence.*
