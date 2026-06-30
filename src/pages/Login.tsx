import React, { useState, useMemo } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { BookOpen, User, Lock, AlertCircle, School, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PREDEFINED_TEACHERS } from '../constants/predefinedData';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [helperSchool, setHelperSchool] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const sanitizedUsername = username.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      if (!sanitizedUsername) {
        setError('Username tidak valid (hanya huruf dan angka).');
        setLoading(false);
        return;
      }
      
      const email = `${sanitizedUsername}@mgmp-ips-kebumen.id`;
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err.code, err.message);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Sistem belum siap: Silakan aktifkan "Email/Password" di Firebase Console Anda (Authentication > Sign-in method).');
      } else if (err.code === 'auth/invalid-email' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Username atau Password salah. Jika pertama kali, silakan "Klaim Akun" dulu.');
      } else {
        setError('Terjadi kendala teknis. Harap hubungi Admin MGMP.');
      }
    } finally {
      setLoading(false);
    }
  };

  const schools = useMemo(() => Array.from(new Set(PREDEFINED_TEACHERS.map(t => t.school))).sort(), []);
  const namesInSchool = useMemo(() => PREDEFINED_TEACHERS.filter(t => t.school === helperSchool).sort((a,b) => a.name.localeCompare(b.name)), [helperSchool]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-sans py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 mb-4 flex items-center justify-center text-white font-bold text-3xl">
              C
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight text-center">CBT OSN MGMP IPS</h2>
            <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest text-center">Kabupaten Kebumen 2026</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start"
            >
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-red-800 leading-tight">{error}</span>
            </motion.div>
          )}

          <div className="mb-6">
            <button 
              type="button"
              onClick={() => setShowHelper(!showHelper)}
              className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
            >
              <div className="flex items-center">
                <School className="h-3 w-3 mr-2" /> Cari ID Login Anda
              </div>
              {showHelper ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
            <AnimatePresence>
              {showHelper && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden bg-gray-50/50 rounded-b-xl border-x border-b border-gray-100 p-4 space-y-3"
                >
                  <select
                    value={helperSchool}
                    onChange={(e) => setHelperSchool(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border bg-white focus:ring-1 focus:ring-indigo-600 outline-none"
                  >
                    <option value="">-- Pilih Instansi --</option>
                    {schools.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {helperSchool && (
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          const user = val.split(/[\s,]/)[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                          setUsername(user);
                        }
                      }}
                      className="w-full text-xs p-2 rounded-lg border bg-white focus:ring-1 focus:ring-indigo-600 outline-none"
                    >
                      <option value="">-- Pilih Nama --</option>
                      {namesInSchool.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
                    </select>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Username Akun</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  placeholder="ID Pembina"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Kunci Keamanan</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-xl bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-100 text-xs font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Otentikasi...
                </div>
              ) : 'Masuk ke Dashboard'}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Belum punya akun?</p>
            <Link to="/register" className="text-xs font-bold text-indigo-600 hover:underline">Klaim Akun</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
