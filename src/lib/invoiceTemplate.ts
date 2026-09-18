// Helper function to convert numbers to words in Indian Currency format (Rupees & Paise)
export function numberToIndianWords(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return "Rs. Zero Only";
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
                'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertLessThanThousand = (n: number): string => {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    } else if (n > 0) {
      str += ones[n];
    }
    return str.trim();
  };

  const roundedNum = Math.round((num + Number.EPSILON) * 100) / 100;
  const integerPart = Math.floor(roundedNum);
  const decimalPart = Math.round((roundedNum - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return "Rs. Zero Only";

  let words = "";

  const crore = Math.floor(integerPart / 10000000);
  let rem = integerPart % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem %= 100000;

  const thousand = Math.floor(rem / 1000);
  rem %= 1000;

  if (crore > 0) {
    words += convertLessThanThousand(crore) + " Crore ";
  }
  if (lakh > 0) {
    words += convertLessThanThousand(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    words += convertLessThanThousand(thousand) + " Thousand ";
  }
  if (rem > 0) {
    words += convertLessThanThousand(rem);
  }

  words = words.trim();
  let result = words ? `Rs. ${words}` : "Rs. Zero";

  if (decimalPart > 0) {
    result += ` and ${convertLessThanThousand(decimalPart)} Paise`;
  }
  result += " Only";

  return result;
}

export interface ShopDetails {
  storeName?: string;
  storeAddress?: string;
  accountNo?: string;
  ifscCode?: string;
  branch?: string;
  gstNo?: string;
  storeEmail?: string;
}

export const DEFAULT_SHOP_DETAILS: ShopDetails = {
  storeName: "M/s Raj Kitchenware",
  storeAddress: "Office & Shop Address : Hatigachhi, Supaul Bazar",
  accountNo: "38419623784",
  ifscCode: "SBIN0017827",
  branch: "Nan Bhagwan",
  gstNo: "10ANSPJ4800F1ZG",
  storeEmail: "raj_jha5555@gmail.com"
};

export function getShopDetails(profile?: any): ShopDetails {
  return {
    storeName: profile?.storeName || DEFAULT_SHOP_DETAILS.storeName,
    storeAddress: profile?.storeAddress || DEFAULT_SHOP_DETAILS.storeAddress,
    accountNo: profile?.accountNo || DEFAULT_SHOP_DETAILS.accountNo,
    ifscCode: profile?.ifscCode || DEFAULT_SHOP_DETAILS.ifscCode,
    branch: profile?.branch || DEFAULT_SHOP_DETAILS.branch,
    gstNo: profile?.gstNo || DEFAULT_SHOP_DETAILS.gstNo,
    storeEmail: profile?.storeEmail || DEFAULT_SHOP_DETAILS.storeEmail,
  };
}

export function generateInvoiceHTML(invoiceData: any, shopProfile?: any): string {
  const shop = getShopDetails(shopProfile);

  const invoiceNo = invoiceData.invoiceIdStr || invoiceData.invoiceId || invoiceData.id || 'INV-1001';
  
  const rawDate = invoiceData.createdAt || invoiceData.date || Date.now();
  let formattedDate = '';
  try {
    const d = new Date(rawDate);
    formattedDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) {
    formattedDate = String(rawDate);
  }

  const customerDetails = invoiceData.paymentDetails?.customerDetails || invoiceData.customer || {};
  const partyName = customerDetails.name || invoiceData.customerName || 'N P S Chotki Ast';
  const partyAddress = customerDetails.address || invoiceData.customerAddress || 'Gaudabairam';

  const rawItems: any[] = invoiceData.items || [];
  
  // Calculate raw subtotal from items
  let rawSubtotal = 0;
  const itemsRowsHtml = rawItems.map((item: any, idx: number) => {
    const qty = Number(item.quantity || item.qty || 1);
    const rate = Number(item.price || item.rate || 0);
    const amount = qty * rate;
    rawSubtotal += amount;

    const unit = item.unit || item.per || (item.name?.toLowerCase().includes('oil') || item.name?.toLowerCase().includes('dal') ? 'kgs' : 'pcs');
    const qtyDisplay = `${qty} ${unit}`;
    const rateDisplay = rate.toFixed(2);
    const amountDisplay = amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return `
      <tr>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: left;">${item.name || item.description || ''}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: right;">${qtyDisplay}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: right;">${rateDisplay}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">${unit}</td>
        <td style="border: 1px solid #000; padding: 4px 6px; text-align: right;">${amountDisplay}</td>
      </tr>
    `;
  }).join('');

  // Round Off calculation
  const totalAmountNum = Number(invoiceData.total || rawSubtotal);
  const roundedTotalInt = Math.round(totalAmountNum);
  const roundOffValue = Number((roundedTotalInt - rawSubtotal).toFixed(2));
  
  const roundOffRowHtml = `
    <tr>
      <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;">${rawItems.length + 1}</td>
      <td style="border: 1px solid #000; padding: 4px 6px; text-align: left; font-weight: bold;">Round Off</td>
      <td style="border: 1px solid #000; padding: 4px 6px; text-align: right;"></td>
      <td style="border: 1px solid #000; padding: 4px 6px; text-align: right;"></td>
      <td style="border: 1px solid #000; padding: 4px 6px; text-align: center;"></td>
      <td style="border: 1px solid #000; padding: 4px 6px; text-align: right;">${roundOffValue >= 0 ? roundOffValue.toFixed(2) : roundOffValue.toFixed(2)}</td>
    </tr>
  `;

  const finalTotal = roundedTotalInt;
  const finalTotalFormatted = finalTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amountInWordsStr = numberToIndianWords(finalTotal);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoiceNo}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, 'Times New Roman', sans-serif;
      background-color: #fff;
      color: #000;
      padding: 20px;
      font-size: 12px;
      line-height: 1.3;
    }
    .invoice-card {
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      border: 1px solid #000;
      padding: 15px 20px;
      background: #fff;
    }
    .top-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 5px;
    }
    .shop-header {
      text-align: center;
      margin-bottom: 10px;
    }
    .shop-name {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 4px;
    }
    .shop-details {
      font-size: 11px;
      line-height: 1.4;
    }
    .invoice-title {
      text-align: center;
      font-size: 15px;
      font-weight: bold;
      text-decoration: underline;
      margin: 10px 0;
    }
    .party-section {
      margin-bottom: 10px;
      font-size: 12px;
    }
    .party-row {
      display: flex;
    }
    .party-label {
      font-weight: bold;
      width: 60px;
    }
    .party-info {
      font-weight: normal;
    }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 5px;
      font-size: 11px;
      border: 1px solid #000;
    }
    table.items-table th {
      border: 1px solid #000;
      padding: 5px 6px;
      font-weight: bold;
      background: #fff;
    }
    table.items-table td {
      border: 1px solid #000;
      padding: 5px 6px;
    }
    .total-row td {
      border-top: 1px solid #000;
      font-weight: bold;
    }
    .amount-words-container {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      align-items: flex-start;
    }
    .words-block {
      font-size: 11px;
    }
    .words-title {
      font-weight: bold;
    }
    .words-value {
      font-weight: bold;
      margin-top: 2px;
    }
    .eoe-text {
      font-size: 10px;
      font-weight: normal;
      font-style: italic;
    }
    .footer-declaration {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 25px;
      font-size: 11px;
    }
    .declaration-box {
      max-width: 420px;
    }
    .declaration-title {
      font-weight: bold;
      margin-bottom: 2px;
    }
    .declaration-text {
      font-size: 10px;
      line-height: 1.3;
    }
    .signatory-box {
      text-align: right;
    }
    .shop-for {
      font-weight: bold;
      margin-bottom: 40px;
    }
    .auth-sig {
      font-weight: normal;
      font-size: 11px;
    }
    .computer-generated {
      text-align: center;
      font-size: 10px;
      margin-top: 20px;
      color: #000;
    }

    @media print {
      @page {
        size: A4 portrait;
        margin: 10mm;
      }
      body {
        padding: 0 !important;
        margin: 0 !important;
        background: #fff !important;
        color: #000 !important;
        -webkit-print-color-adjust: exact;
      }
      .invoice-card {
        border: 1px solid #000 !important;
        max-width: 100% !important;
        width: 100% !important;
        padding: 15px !important;
        margin: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="top-meta">
      <div>Invoice No. ${invoiceNo}</div>
      <div>Dated ${formattedDate}</div>
    </div>

    <div class="shop-header">
      <div class="shop-name">${shop.storeName}</div>
      <div class="shop-details">
        <div>${shop.storeAddress?.startsWith('Office') ? shop.storeAddress : `Office & Shop Address : ${shop.storeAddress}`}</div>
        <div>Account No : ${shop.accountNo}</div>
        <div>IFSC Code : ${shop.ifscCode}</div>
        <div>Branch : ${shop.branch}</div>
        <div>GST No. : ${shop.gstNo}</div>
        <div>E-mail : ${shop.storeEmail}</div>
      </div>
    </div>

    <div class="invoice-title">INVOICE</div>

    <div class="party-section">
      <div class="party-row">
        <div class="party-label">Party :</div>
        <div class="party-info">
          <div><strong>${partyName}</strong></div>
          <div>${partyAddress}</div>
        </div>
      </div>
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 6%; text-align: center;">Sl No.</th>
          <th style="width: 44%; text-align: left;">Description of Goods</th>
          <th style="width: 16%; text-align: right;">Quantity</th>
          <th style="width: 12%; text-align: right;">Rate</th>
          <th style="width: 8%; text-align: center;">per</th>
          <th style="width: 14%; text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml}
        ${roundOffRowHtml}
        <tr class="total-row">
          <td colspan="4" style="border: 1px solid #000; border-right: none;"></td>
          <td style="border: 1px solid #000; border-left: none; border-right: 1px solid #000; text-align: right; padding: 4px 6px; font-weight: bold;">Total</td>
          <td style="border: 1px solid #000; text-align: right; padding: 4px 6px; font-weight: bold;">${finalTotalFormatted}</td>
        </tr>
      </tbody>
    </table>

    <div class="amount-words-container">
      <div class="words-block">
        <div class="words-title">Amount Chargeable (in words)</div>
        <div class="words-value">${amountInWordsStr}</div>
      </div>
      <div class="eoe-text">E. & O.E.</div>
    </div>

    <div class="footer-declaration">
      <div class="declaration-box">
        <div class="declaration-title">Declaration</div>
        <div class="declaration-text">
          We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
        </div>
      </div>

      <div class="signatory-box">
        <div class="shop-for">for ${shop.storeName}</div>
        <div class="auth-sig">Authorised Signatory</div>
      </div>
    </div>

    <div class="computer-generated">
      This is a Computer Generated Invoice
    </div>
  </div>
</body>
</html>`;
}
