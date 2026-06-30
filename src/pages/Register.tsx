import React, { useState, useMemo } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { BookOpen, User, Lock, AlertCircle, ArrowLeft, School, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import { PREDEFINED_TEACHERS } from '../constants/predefinedData';

export default function Register() {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Unique list of schools
  const schools = useMemo(() => {
    return Array.from(new Set(PREDEFINED_TEACHERS.map(t => t.school))).sort();
  }, []);

  // Filtered teachers for selected school
  const teachersInSchool = useMemo(() => {
    return PREDEFINED_TEACHERS.filter(t => t.school === selectedSchool).sort((a,b) => a.name.localeCompare(b.name));
  }, [selectedSchool]);

  // Derive username: first word of name, lowercase, sanitized
  const derivedUsername = useMemo(() => {
    if (!selectedName) return '';
    const firstName = selectedName.split(/[\s,]/)[0]; // Split by space or comma
    return firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
  }, [selectedName]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !selectedName) {
      setError('Harap pilih Instansi dan Nama Anda.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const email = `${derivedUsername}@mgmp-ips-kebumen.id`;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: selectedName,
        school: selectedSchool,
        username: derivedUsername,
        role: 'student',
        createdAt: new Date().toISOString()
      });

      navigate('/');
    } catch (err: any) {
      console.error(err.code, err.message);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Sistem belum siap: Silakan aktifkan "Email/Password" di Firebase Console.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError(`Username "${derivedUsername}" sudah terdaftar. Gunakan nama lain atau hubungi Admin.`);
      } else {
        setError('Gagal mendaftar. Pastikan data benar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-sans py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-100 mb-4 flex items-center justify-center text-white font-bold text-2xl">
              C
            </div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Klaim Akun Pembina</h2>
            <p className="text-[10px] font-bold text-gray-500 mt-1 uppercase tracking-widest">Pilih Data Anda untuk Registrasi</p>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start"
            >
              <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-xs font-medium text-red-800 leading-relaxed">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Pilih Instansi</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <School className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  required
                  value={selectedSchool}
                  onChange={(e) => {
                    setSelectedSchool(e.target.value);
                    setSelectedName('');
                  }}
                  className="block w-full pl-11 pr-5 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">-- Pilih Sekolah --</option>
                  {schools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={!selectedSchool ? 'opacity-50 pointer-events-none' : ''}>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Pilih Nama Lengkap</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <GraduationCap className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  required
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}
                  className="block w-full pl-11 pr-5 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all appearance-none"
                >
                  <option value="">-- Pilih Nama --</option>
                  {teachersInSchool.map(teacher => (
                    <option key={teacher.name} value={teacher.name}>{teacher.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {derivedUsername && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100"
              >
                <div className="flex items-center text-xs font-bold text-indigo-700 uppercase tracking-widest mb-1">
                  <User className="h-3 w-3 mr-2" /> ID Login Anda
                </div>
                <p className="text-sm font-black text-indigo-900 font-mono">{derivedUsername}</p>
                <p className="text-[10px] text-indigo-600 mt-1 italic">Diambil dari kata pertama nama Anda.</p>
              </motion.div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Buat Kunci Keamanan (Password)</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-5 py-3 border border-gray-200 rounded-2xl bg-gray-50 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all"
                  placeholder="Min. 6 Karakter"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-indigo-100 text-xs font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
            >
              {loading ? 'Mendaftarkan...' : 'Klaim Akun & Mulai'}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center space-x-6 pt-6 border-t border-gray-100">
            <Link to="/login" className="flex items-center text-xs font-bold text-gray-400 hover:text-indigo-600 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Kembali ke Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
