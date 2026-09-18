// Firestore helper module for Firebase v9+ Modular SDK
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
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase-config.js";

// Save Shop Details (Collection: 'shopDetails' or 'users', Document ID = user UID)
export async function saveShopDetails(userId, shopData) {
  const shopDocRef = doc(db, "shopDetails", userId);
  await setDoc(shopDocRef, {
    ...shopData,
    userId,
    updatedAt: serverTimestamp()
  }, { merge: true });

  const userDocRef = doc(db, "users", userId);
  await setDoc(userDocRef, {
    ...shopData,
    userId,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

// Fetch Shop Details by User UID
export async function fetchShopDetails(userId) {
  const shopDocRef = doc(db, "shopDetails", userId);
  const docSnap = await getDoc(shopDocRef);
  if (docSnap.exists()) return docSnap.data();

  const userDocRef = doc(db, "users", userId);
  const userSnap = await getDoc(userDocRef);
  if (userSnap.exists()) return userSnap.data();

  return null;
}

// Save Invoice (Collection: 'invoices')
export async function saveInvoice(userId, invoiceData) {
  const invoiceCollection = collection(db, "invoices");
  const payload = {
    ...invoiceData,
    userId: userId,
    createdBy: userId,
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

// Fetch Invoices for User
export async function fetchInvoices(userId) {
  const invoicesQ = query(
    collection(db, "invoices"), 
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(invoicesQ);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Update Invoice
export async function updateInvoice(invoiceId, updatedData) {
  const invoiceRef = doc(db, "invoices", invoiceId);
  await updateDoc(invoiceRef, {
    ...updatedData,
    updatedAt: serverTimestamp()
  });
}

// Delete Invoice
export async function deleteInvoice(invoiceId) {
  const invoiceRef = doc(db, "invoices", invoiceId);
  await deleteDoc(invoiceRef);
}
