import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, BookOpen, User, Shield, BarChart3 } from 'lucide-react';
import { auth } from '../lib/firebase';
import { useAuth } from './AuthProvider';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">C</div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 leading-none">CBT OSN MGMP IPS</h1>
                <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">Kabupaten Kebumen 2026</p>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-indigo-600 text-sm font-medium">Dashboard</Link>
              {profile?.role === 'admin' && (
                <>
                  <Link to="/admin" className="text-gray-600 hover:text-indigo-600 text-sm font-medium flex items-center">
                    <Shield className="h-4 w-4 mr-1.5" /> Bank Soal
                  </Link>
                  <Link to="/reports" className="text-gray-600 hover:text-indigo-600 text-sm font-medium flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1.5" /> Laporan Analitik
                  </Link>
                </>
              )}
            </nav>

            <div className="flex items-center space-x-4 border-l pl-6 border-gray-200">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-gray-900">{profile?.name}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{profile?.role} MGMP IPS</span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Log Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            &copy; 2026 MGMP IPS SMP Kebumen. Semua Hak Dilindungi.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Dibuat oleh: MGMP IPS SMP Kebumen 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
