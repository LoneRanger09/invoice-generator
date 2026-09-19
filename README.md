# Dukaan Bill (दुकान बिल) - PWA Invoice Generator

A production-quality, mobile-first, offline-first Progressive Web App (PWA) built for small Indian shopkeepers to generate, save, print, and share invoices without requiring an active internet connection.

---

## Features & Highlights

- **Offline-First Storage**: Uses **Dexie (IndexedDB)** as the primary local database on the shopkeeper's phone. Everything works with zero internet.
- **Google Sheet Database Sync**: All data automatically syncs with the shopkeeper's own Google Sheet using a lightweight **Google Apps Script Web App REST API (`Code.gs`)**.
- **Paper Bill Book Design**: Authentically replicates traditional Indian paper bill books (cool paper-white background, ballpoint-blue actions, red serial-number styling for invoice numbers).
- **Hindi & English Localization (i18n)**: One-tap toggle between Hindi and English interface.
- **Integer Paise Arithmetic**: All financial calculations are computed in integer paise to eliminate floating-point inaccuracies. Includes Round Off (nearest rupee) and Indian currency formatting (`Intl.NumberFormat('en-IN')`).
- **Amount Chargeable in Words**: Automatic Indian numbering system text generation (Thousand, Lakh, Crore, Paise). Example: `₹10,166.00` -> `"Rs. Ten Thousand One Hundred Sixty Six Only"`.
- **Devanagari PDF & WhatsApp Sharing**: Browser-side PDF generation (`html2canvas` + `jsPDF`) renders Hindi item and party names flawlessly. Shares directly via Web Share API or falls back to `wa.me` link with download hint.
- **Seeded Demo Mode**: Includes one-click demo data seeder (Gupta Trading Company + 15 realistic Indian retail items) in Shop Settings.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Local Database**: Dexie (IndexedDB) with `dexie-react-hooks`
- **PWA Capabilities**: `vite-plugin-pwa` with Workbox offline precaching
- **PDF & Sharing**: `html2canvas`, `jsPDF`, Web Share API
- **Excel Export**: `xlsx` (SheetJS)
- **Backend API**: Google Apps Script (`Code.gs`)
- **Unit Testing**: Vitest

---

## Getting Started Locally

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npx vitest run

# 3. Start dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Google Sheet Connection Setup (`Code.gs`)

1. Open a new Google Sheet at [https://sheets.new](https://sheets.new).
2. Click **Extensions > Apps Script**.
3. Clear default code, copy the complete code from [`Code.gs`](file:///d:/IG/invoice-generator/Code.gs), and paste it into the editor.
4. Set your desired secret token in `SECRET_TOKEN` (e.g. `"MY_SECRET_TOKEN_123"`).
5. Run the `setup()` function once to automatically create all required tabs (`Shop`, `Products`, `Customers`, `Invoices`, `InvoiceItems`, `Meta`) with correct headers.
6. Click **Deploy > New deployment**:
   - Select **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Copy the generated **Web App URL**.
8. In Dukaan Bill app, go to **Shop Settings > Connect Google Sheet**, paste the Web App URL & Secret Token, and click **Test Connection** & **Sync Now**.

---

## Android Installation (PWA)

1. Deploy or open the Web App URL in Google Chrome on your Android phone.
2. Tap the Chrome menu (3 dots) at the top right.
3. Tap **Add to Home screen** / **Install App**.
4. Dukaan Bill will install as an offline standalone app on your phone home screen.

---

## Deployment (Free)

### Deploy to Netlify
```bash
npm run build
# Deploy the 'dist' directory via Netlify CLI or GitHub repository connection.
```

### Deploy to GitHub Pages / Vercel
Connect your GitHub repository to Vercel or GitHub Pages and set the build command to `npm run build` with output directory `dist`.

---

## Assumptions & Design Choices

1. **No Tax / GST Calculations**: GSTIN is displayed purely as header plain text if provided by the shopkeeper. No tax rates or GST splits are computed.
2. **Device Code Prefix**: Unique device code (e.g. `INV-D123-`) is generated per device to prevent invoice number collisions across multiple phones syncing to the same sheet.
3. **Soft Deletes**: Deletes are soft (`deleted = 1`) to preserve historical audit trails and ensure robust offline sync.