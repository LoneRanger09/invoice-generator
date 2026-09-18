import { useState, useEffect } from 'react';
import { LogOut, LayoutDashboard, Package, Users, FileText, UserCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardView from './components/DashboardView';
import ProductsView from './components/ProductsView';
import CustomersView from './components/CustomersView';
import InvoicesView from './components/InvoicesView';
import ProfileView from './components/ProfileView';
import AuthScreen from './components/AuthScreen';
import { doc, onSnapshot, db } from './lib/db';
import { subscribeToAuthChanges, logoutUser } from './lib/auth';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial local guest session if present
    const localGuest = localStorage.getItem('local_guest_session');
    if (localGuest) {
      try {
        setUser(JSON.parse(localGuest));
        setLoading(false);
      } catch (e) {}
    }

    const handleGuestEvent = () => {
      const stored = localStorage.getItem('local_guest_session');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
          setLoading(false);
        } catch (e) {}
      }
    };
    window.addEventListener('guest_login_event', handleGuestEvent);

    const unsubscribeAuth = subscribeToAuthChanges((firebaseUser) => {
      if (firebaseUser) {
        localStorage.removeItem('local_guest_session');
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || 'guest@local.dev',
          displayName: firebaseUser.displayName || (firebaseUser.isAnonymous ? 'Guest User' : 'Shop Owner'),
          photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${firebaseUser.uid}`,
          isAnonymous: firebaseUser.isAnonymous
        });
      } else {
        const savedGuest = localStorage.getItem('local_guest_session');
        if (savedGuest) {
          try {
            setUser(JSON.parse(savedGuest));
          } catch (e) {
            setUser(null);
          }
        } else if (import.meta.env.VITE_USE_REAL_FIREBASE !== 'true') {
          setUser({
            uid: 'dev-user-123',
            email: 'developer@creatiwise.local',
            displayName: 'Guest Developer',
            photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=developer'
          });
        } else {
          setUser(null);
        }
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      window.removeEventListener('guest_login_event', handleGuestEvent);
    };
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const profileRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(profileRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUser((prevUser: any) => ({
          ...prevUser,
          displayName: data.name || data.storeName || prevUser?.displayName || 'Shop Owner',
          email: data.storeEmail || data.email || prevUser?.email || 'user@local.dev'
        }));
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('local_guest_session');
      await logoutUser();
      setUser(null);
    } catch (e) {
      console.error("Logout failed", e);
      localStorage.removeItem('local_guest_session');
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500 font-medium">Initializing Authentication...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView user={user} />;
      case 'products': return <ProductsView user={user} />;
      case 'customers': return <CustomersView user={user} />;
      case 'invoices': return <InvoicesView user={user} />;
      case 'profile': return <ProfileView user={user} onLogout={handleLogout} onUserUpdate={(newUser) => setUser(newUser)} />;
      default: return <DashboardView user={user} />;
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col md:flex-row overflow-hidden">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-black/10 flex-col shrink-0">
        <div className="h-20 flex items-center px-8 border-b border-black/10">
          <h1 className="text-2xl font-bold text-black tracking-tight font-display lowercase">creatiwise.</h1>
        </div>
        
        <div className="p-6 flex flex-col space-y-2 flex-1 overflow-y-auto">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-full text-sm font-medium transition-all relative ${activeTab === 'dashboard' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
          >
            {activeTab === 'dashboard' && <motion.div layoutId="active-navIndicator" className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />}
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('products')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-full text-sm font-medium transition-all relative ${activeTab === 'products' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
          >
            {activeTab === 'products' && <motion.div layoutId="active-navIndicator" className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />}
            <Package size={20} />
            <span>Products</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-full text-sm font-medium transition-all relative ${activeTab === 'customers' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
          >
            {activeTab === 'customers' && <motion.div layoutId="active-navIndicator" className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />}
            <Users size={20} />
            <span>Customers</span>
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-full text-sm font-medium transition-all relative ${activeTab === 'invoices' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
          >
            {activeTab === 'invoices' && <motion.div layoutId="active-navIndicator" className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />}
            <FileText size={20} />
            <span>Invoices</span>
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-3 px-4 py-3 rounded-full text-sm font-medium transition-all relative ${activeTab === 'profile' ? 'bg-black text-white' : 'text-gray-500 hover:text-black'}`}
          >
            {activeTab === 'profile' && <motion.div layoutId="active-navIndicator" className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-1 h-1 bg-black rounded-full" />}
            <UserCircle size={20} />
            <span>Staff Profile</span>
          </button>
        </div>

        {/* User Card & Logout */}
        <div className="p-6 border-t border-black/10">
          <div className="flex items-center mb-4 px-2">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full bg-gray-100" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
                {(user.email || 'Guest').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-bold text-black truncate">{user.displayName || 'Shop Owner'}</p>
              <p className="text-xs text-gray-500 truncate">{user.email || 'user@local.dev'}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-700 py-2.5 rounded-xl text-xs font-bold transition"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden bg-white border-b border-black/10 flex items-center justify-between px-6 sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)', minHeight: 'calc(4rem + env(safe-area-inset-top, 0px))' }}>
          <h1 className="text-xl font-bold text-black tracking-tight font-display lowercase">creatiwise.</h1>
          {user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-black/10" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
              {(user.email || 'Guest').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full relative"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden shrink-0 bg-white border-t border-black/10 flex justify-between px-4 py-2 z-20" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <button onClick={() => setActiveTab('dashboard')} className={`relative flex-1 flex flex-col items-center p-2 min-w-0 transition-colors ${activeTab === 'dashboard' ? 'text-black' : 'text-gray-400'}`}>
          <LayoutDashboard size={22} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
        </button>
        <button onClick={() => setActiveTab('products')} className={`relative flex-1 flex flex-col items-center p-2 min-w-0 transition-colors ${activeTab === 'products' ? 'text-black' : 'text-gray-400'}`}>
          <Package size={22} strokeWidth={activeTab === 'products' ? 2.5 : 2} />
        </button>
        <button onClick={() => setActiveTab('invoices')} className={`relative flex-1 flex flex-col items-center p-2 min-w-0 transition-colors ${activeTab === 'invoices' ? 'text-black' : 'text-gray-400'}`}>
          <FileText size={22} strokeWidth={activeTab === 'invoices' ? 2.5 : 2} />
        </button>
        <button onClick={() => setActiveTab('customers')} className={`relative flex-1 flex flex-col items-center p-2 min-w-0 transition-colors ${activeTab === 'customers' ? 'text-black' : 'text-gray-400'}`}>
          <Users size={22} strokeWidth={activeTab === 'customers' ? 2.5 : 2} />
        </button>
        <button onClick={() => setActiveTab('profile')} className={`relative flex-1 flex flex-col items-center p-2 min-w-0 transition-colors ${activeTab === 'profile' ? 'text-black' : 'text-gray-400'}`}>
          <UserCircle size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
        </button>
      </nav>
    </div>
  );
}
