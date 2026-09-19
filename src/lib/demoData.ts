import { db } from './db';
import { Repository } from './repository';
import type { ShopSettings, Product } from './types';

export const DEMO_SHOP_SETTINGS: Partial<ShopSettings> = {
  shopName: 'Gupta Trading Company',
  proprietor: 'Ramesh Gupta',
  address: 'Shop No. 12, Grain Market, Main Road, Kanpur - 208001',
  phone: '+91 98765 43210',
  email: 'guptatraders@gmail.com',
  gstin: '09ABCDE1234F1Z5',
  declaration:
    'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.',
  signatureLabel: 'Authorised Signatory',
  invoicePrefix: 'INV-DEMO-',
  nextInvoiceNo: 77,
  roundOffEnabled: true,
  language: 'en'
};

export const DEMO_PRODUCTS: Array<Omit<Product, 'id' | 'updatedAt'>> = [
  { name: 'Basmati Rice (बासमती चावल)', unit: 'kgs', price: 120.0 },
  { name: 'Wheat Flour / Atta (गेहूं का आटा)', unit: 'kgs', price: 28.0 },
  { name: 'Mustard Oil (सरसों का तेल)', unit: 'litre', price: 160.0 },
  { name: 'Sugar (चीनी)', unit: 'kgs', price: 42.0 },
  { name: 'Toor Dal (तूर दाल)', unit: 'kgs', price: 145.0 },
  { name: 'Chana Dal (चना दाल)', unit: 'kgs', price: 85.0 },
  { name: 'Full Cream Milk (दूध)', unit: 'litre', price: 64.0 },
  { name: 'Tata Tea Powder (चाय पत्ती)', unit: 'kgs', price: 480.0 },
  { name: 'Iodized Salt (नमक पैकेट)', unit: 'packet', price: 20.0 },
  { name: 'Refined Oil (रिफाइंड तेल)', unit: 'litre', price: 130.0 },
  { name: 'Desi Ghee (देसी घी)', unit: 'kgs', price: 650.0 },
  { name: 'Bathing Soap Box (साबुन बॉक्स)', unit: 'box', price: 180.0 },
  { name: 'Washing Powder (डिटर्जेंट)', unit: 'kgs', price: 110.0 },
  { name: 'Haldi Powder (हल्दी पाउडर)', unit: 'kgs', price: 220.0 },
  { name: 'Jeera / Cumin (जीरा)', unit: 'kgs', price: 350.0 }
];

export async function seedDemoData(): Promise<void> {
  // Save demo shop settings
  await Repository.saveShopSettings(DEMO_SHOP_SETTINGS);

  // Clear existing products and load demo products
  await db.products.clear();
  for (const prod of DEMO_PRODUCTS) {
    await Repository.saveProduct(prod);
  }

  // Create sample invoice #77 matching prompt criteria
  // 17.60 kgs * 120.00 = 2112.00
  // 44.00 kgs * 28.00  = 1232.00
  // 6.62 kgs * 160.00   = 1059.20
  // 35.00 kgs * 145.00  = 5075.00
  // 8.00 kgs * 85.00    = 687.50
  // Subtotal = 10,165.70
  // Round Off = +0.30
  // Total = 10,166.00
  const sampleItems = [
    { slNo: 1, description: 'Basmati Rice (बासमती चावल)', qty: 17.6, unit: 'kgs', rate: 120.0, amount: 2112.0 },
    { slNo: 2, description: 'Wheat Flour / Atta (गेहूं का आटा)', qty: 44.0, unit: 'kgs', rate: 28.0, amount: 1232.0 },
    { slNo: 3, description: 'Mustard Oil (सरसों का तेल)', qty: 6.62, unit: 'litre', rate: 160.0, amount: 1059.2 },
    { slNo: 4, description: 'Toor Dal (तूर दाल)', qty: 35.0, unit: 'kgs', rate: 145.0, amount: 5075.0 },
    { slNo: 5, description: 'Chana Dal (चना दाल)', qty: 8.09, unit: 'kgs', rate: 85.0, amount: 687.5 }
  ];

  await Repository.saveInvoice(
    {
      invoiceNo: 'INV-DEMO-77',
      date: new Date().toISOString().split('T')[0],
      customerName: 'Verma Provision Store',
      customerAddress: 'Civil Lines, Kanpur - 208001',
      customerPhone: '9876543210',
      subtotal: 10165.7,
      roundOff: 0.3,
      total: 10166.0,
      amountInWords: 'Rs. Ten Thousand One Hundred Sixty Six Only',
      note: 'Goods once sold will not be taken back.',
      status: 'active'
    },
    sampleItems
  );
}
