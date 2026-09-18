import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase-config";

export interface ShopDetails {
  storeName?: string;
  storeAddress?: string;
  accountNo?: string;
  ifscCode?: string;
  branch?: string;
  gstNo?: string;
  storeEmail?: string;
  upiId?: string;
  name?: string;
}

// 1. Save Shop Details to Firestore (Collection: 'users' or 'shopDetails', Doc ID = user UID)
export async function saveShopDetails(userId: string, shopData: ShopDetails): Promise<void> {
  const userDocRef = doc(db, "users", userId);
  await setDoc(userDocRef, {
    ...shopData,
    userId,
    updatedAt: serverTimestamp()
  }, { merge: true });

  // Also maintain alias in 'shopDetails' collection for backwards compatibility
  const shopDocRef = doc(db, "shopDetails", userId);
  await setDoc(shopDocRef, {
    ...shopData,
    userId,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// 2. Fetch Shop Details for User UID
export async function fetchShopDetails(userId: string): Promise<ShopDetails | null> {
  const userDocRef = doc(db, "users", userId);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    return docSnap.data() as ShopDetails;
  }

  const shopDocRef = doc(db, "shopDetails", userId);
  const shopSnap = await getDoc(shopDocRef);
  if (shopSnap.exists()) {
    return shopSnap.data() as ShopDetails;
  }
  return null;
}

// 3. Save Invoice to Firestore (Collection: 'invoices')
export async function saveInvoice(userId: string, invoiceData: any): Promise<string> {
  const invoiceCollection = collection(db, "invoices");
  const payload = {
    ...invoiceData,
    userId: userId,
    createdBy: userId,
    invoiceNo: invoiceData.invoiceNo || invoiceData.invoiceIdStr || `INV-${Date.now().toString().slice(-4)}`,
    createdAt: invoiceData.createdAt || new Date().toISOString(),
    timestamp: serverTimestamp()
  };

  if (invoiceData.id) {
    const invoiceRef = doc(db, "invoices", invoiceData.id);
    await updateDoc(invoiceRef, payload);
    return invoiceData.id;
  } else {
    const docRef = await addDoc(invoiceCollection, payload);
    return docRef.id;
  }
}

// 4. Fetch Invoices for Logged-In User
export async function fetchInvoices(userId: string): Promise<any[]> {
  const invoicesQ = query(
    collection(db, "invoices"), 
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(invoicesQ);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// 5. Update an Existing Invoice
export async function updateInvoice(invoiceId: string, updatedData: any): Promise<void> {
  const invoiceRef = doc(db, "invoices", invoiceId);
  await updateDoc(invoiceRef, {
    ...updatedData,
    updatedAt: serverTimestamp()
  });
}

// 6. Delete an Invoice
export async function deleteInvoice(invoiceId: string): Promise<void> {
  const invoiceRef = doc(db, "invoices", invoiceId);
  await deleteDoc(invoiceRef);
}
