import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, db, collection, query, where, getDocs, updateDoc } from '../lib/db';
import { Save, UserCircle, LogOut } from 'lucide-react';

export default function ProfileView({ user, onLogout, onUserUpdate }: { user: any, onLogout?: () => void, onUserUpdate?: (newUser: any) => void }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileId, setProfileId] = useState(user?.uid || '');
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    storeName: '',
    upiId: '',
    storeAddress: '',
    accountNo: '',
    ifscCode: '',
    branch: '',
    gstNo: '',
    storeEmail: ''
  });

  useEffect(() => {
    if (user?.uid) {
      setProfileId(user.uid);
    }
  }, [user?.uid]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFormData({
            name: data.name || user?.displayName || '',
            storeName: data.storeName || '',
            upiId: data.upiId || '',
            storeAddress: data.storeAddress || '',
            accountNo: data.accountNo || '',
            ifscCode: data.ifscCode || '',
            branch: data.branch || '',
            gstNo: data.gstNo || '',
            storeEmail: data.storeEmail || ''
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const sanitizedId = profileId.trim().replace(/\s+/g, '-');
    if (!sanitizedId) {
      alert("Profile ID cannot be empty");
      setSaving(false);
      return;
    }
    try {
      // 1. Save profile under new/current ID
      await setDoc(doc(db, 'users', sanitizedId), {
        name: formData.name,
        storeName: formData.storeName,
        upiId: formData.upiId,
        storeAddress: formData.storeAddress,
        accountNo: formData.accountNo,
        ifscCode: formData.ifscCode,
        branch: formData.branch,
        gstNo: formData.gstNo,
        storeEmail: formData.storeEmail,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // 2. Migrate associated data if profile ID was changed
      if (sanitizedId !== user.uid) {
        // Migrate products
        const productsSnap = await getDocs(query(collection(db, "products"), where("userId", "==", user.uid)));
        for (const productDoc of productsSnap.docs) {
          await updateDoc(doc(db, "products", productDoc.id), { userId: sanitizedId });
        }
        // Migrate customers
        const customersSnap = await getDocs(query(collection(db, "customers"), where("userId", "==", user.uid)));
        for (const customerDoc of customersSnap.docs) {
          await updateDoc(doc(db, "customers", customerDoc.id), { userId: sanitizedId });
        }
        // Migrate invoices
        const invoicesSnap = await getDocs(query(collection(db, "invoices"), where("userId", "==", user.uid)));
        for (const invoiceDoc of invoicesSnap.docs) {
          await updateDoc(doc(db, "invoices", invoiceDoc.id), { userId: sanitizedId });
        }

        // Notify App.tsx to update the active user's uid
        if (onUserUpdate) {
          onUserUpdate({
            ...user,
            uid: sanitizedId,
            displayName: formData.name
          });
        }
      }

      alert("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading profile...</div>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <UserCircle size={32} className="text-indigo-600" />
        <h2 className="text-2xl font-bold text-gray-800">Staff Profile</h2>
      </div>

      <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Profile ID (User ID)</label>
            <input
              type="text"
              value={profileId}
              onChange={(e) => setProfileId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
              placeholder="e.g. dev-user-123"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Store / Business Name</label>
            <input
              type="text"
              value={formData.storeName}
              onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
              placeholder="e.g. M/s Raj Kitchenware"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Address</label>
            <input
              type="text"
              value={formData.storeAddress}
              onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
              placeholder="e.g. Hatigachhi, Supaul Bazar"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account No.</label>
              <input
                type="text"
                value={formData.accountNo}
                onChange={(e) => setFormData({ ...formData, accountNo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                placeholder="e.g. 38419623784"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code</label>
              <input
                type="text"
                value={formData.ifscCode}
                onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                placeholder="e.g. SBIN0017827"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bank Branch</label>
              <input
                type="text"
                value={formData.branch}
                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                placeholder="e.g. Nan Bhagwan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST No.</label>
              <input
                type="text"
                value={formData.gstNo}
                onChange={(e) => setFormData({ ...formData, gstNo: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
                placeholder="e.g. 10ANSPJ4800F1ZG"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Email</label>
            <input
              type="email"
              value={formData.storeEmail}
              onChange={(e) => setFormData({ ...formData, storeEmail: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
              placeholder="e.g. raj_jha5555@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID for Payments</label>
            <input
              type="text"
              value={formData.upiId}
              onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-700"
              placeholder="e.g. merchant@upi"
            />
            <p className="text-sm text-gray-500 mt-1">
              Payments from generated QR codes will be sent to this UPI ID.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              <Save size={18} />
              <span>{saving ? 'Saving...' : 'Save Profile'}</span>
            </button>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center justify-center space-x-2 bg-gray-50 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 border border-gray-200 transition"
              >
                <LogOut size={18} />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
