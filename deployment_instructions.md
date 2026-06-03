# Live Deployment Instructions for Jan Systems Cafe

We have successfully:
1. **Configured and seeded the cloud database** on Neon.
2. **Initialized a local Git repository** and made the initial commit.

Follow these remaining steps to get your full-stack application live:

---

## Step 1: Push the Code to GitHub

To deploy to Render and Vercel, the code needs to be hosted on GitHub.

1. Go to [GitHub.com](https://github.com/) and log in (or create a free account).
2. Click **New** to create a new repository.
3. Name it `jan-systems-cafe` and choose **Private** (recommended) or **Public**.
4. Leave "Add a README", ".gitignore", and "license" unchecked. Click **Create repository**.
5. Open your PowerShell terminal, make sure you are in the project folder, and run:
   ```powershell
   # Use the exact Git path we verified on your machine
   & "C:\Program Files\Git\cmd\git.exe" remote add origin https://github.com/YOUR_GITHUB_USERNAME/jan-systems-cafe.git
   & "C:\Program Files\Git\cmd\git.exe" branch -M main
   & "C:\Program Files\Git\cmd\git.exe" push -u origin main
   ```
   *(Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username. You may be prompted to authorize Git in your browser).*

---

## Step 2: Deploy the Backend to Render

[Render](https://render.com/) is a free hosting platform for persistent Node.js servers (allowing WebSockets/Socket.io to work).

1. Go to [Render.com](https://render.com/) and sign up for a free account (log in with your GitHub account to make linking easy).
2. Click **New +** and select **Web Service**.
3. Select **Build and deploy from a Git repository**.
4. Link your GitHub account and select your `jan-systems-cafe` repository.
5. Configure the Web Service with the following settings:
   - **Name**: `jan-systems-server`
   - **Region**: Select any region (e.g., Oregon or Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: Leave blank (the repository root)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start --workspace=@jan-systems/server`
   - **Instance Type**: `Free`
6. Click **Advanced** to add these **Environment Variables**:
   - `DATABASE_URL` = `postgresql://neondb_owner:npg_W8pxHbygO6eh@ep-hidden-silence-ape0qsui.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require`
   - `PORT` = `3002`
   - `NODE_ENV` = `production`
   - `STORAGE_PROVIDER` = `local`
   - `SUPERADMIN_PASSWORD` = `janinstaller2026`
   - `JWT_SECRET` = `choose_any_random_string`
7. Click **Create Web Service**. 
8. Render will build and deploy the server. Once live, it will provide a public URL like:
   `https://jan-systems-server.onrender.com`

---

## Step 3: Deploy the Frontend to Vercel

[Vercel](https://vercel.com/) provides high-speed, free hosting for React/Vite frontends.

1. Go to [Vercel.com](https://vercel.com/) and log in using your GitHub account.
2. Click **Add New...** → **Project**.
3. Import your `jan-systems-cafe` repository.
4. Configure the project settings:
   - **Project Name**: `jan-systems-cafe`
   - **Framework Preset**: `Vite`
   - **Root Directory**: `apps/client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Expand the **Environment Variables** section and add:
   - Name: `VITE_API_URL`
   - Value: `https://jan-systems-server.onrender.com` *(Use the actual URL Render gave you in Step 2)*
6. Click **Deploy**. Vercel will build your frontend and give you a live link like:
   `https://jan-systems-cafe.vercel.app`

---

## Verification Check

Once both are deployed, open your Vercel URL in a browser:
1. You will be greeted by the **Setup Wizard** (as it detects a fresh deployment).
2. Log in with the SUPERADMIN email: `installer@jansystems.com` and password `janinstaller2026` (or whatever you configured in Render's environment variables).
3. Set up the Owner and Admin details. The system is now fully live and ready to demonstrate!
