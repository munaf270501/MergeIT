# MergeIt AI — Vercel Production Deployment

Official web platform, licensing portal, Razorpay checkout, and Brevo SMTP email delivery for **MergeIt AI**.

---

## 📁 Project Structure

```text
mergeit-vercel/
├── api/
│   ├── create-order.js      <-- Vercel Serverless Function (POST /api/create-order)
│   └── verify-payment.js    <-- Vercel Serverless Function (POST /api/verify-payment)
├── index.html               <-- Landing Page, 3D Canvas, & Pricing HUD
├── favicon.ico              <-- Brand Favicon
├── vercel.json              <-- Vercel Routing & Headers Config
├── package.json             <-- Project Dependencies & Metadata
├── .env.example             <-- Environment Variable Blueprint for Vercel
├── .gitignore               <-- Excludes node_modules, local secrets, & archives
└── dev-server.js            <-- Local Testing Server (npm run dev)
```

---

## 🚀 1-Minute Deployment Guide

### Step 1: Import into Vercel
1. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
2. Select your GitHub repository (`MergeIT`).
3. Leave **Framework Preset** as **"Other"** (or Static).
4. Under **Environment Variables**, add:
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASSWORD`
   - `EMAIL_FROM`
   - `EMAIL_FROM_NAME`
   - `GOOGLE_SHEET_SCRIPT_URL`
   - `APP_DOWNLOAD_URL`
5. Click **Deploy**.

---

## 🌐 Connecting Your Domain (`mergeit.in`) Without Cloudflare

1. In Vercel Project Dashboard ➔ **Settings** ➔ **Domains**.
2. Add `mergeit.in` and `www.mergeit.in`.
3. In your Domain Registrar (GoDaddy, Namecheap, Hostinger, etc.):
   - Point nameservers to Vercel:
     - `ns1.vercel-dns.com`
     - `ns2.vercel-dns.com`
   - **OR** set an `A` record pointing `@` to `76.76.21.21` and `CNAME` for `www` to `cname.vercel-dns.com`.
4. Vercel automatically issues an SSL certificate and takes your website live worldwide!
