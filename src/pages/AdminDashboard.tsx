import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../lib/firebase';
import { Exam, Question, UserProfile } from '../types';
import { Plus, Edit, Trash2, Users, FileText, ChevronRight, Settings, PlusCircle, Check, X, Search, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'exams' | 'users'>('exams');
  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showExamForm, setShowExamForm] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examFormData, setExamFormData] = useState({
    title: '',
    description: '',
    duration: 60,
    passingScore: 70,
    isActive: true
  });

  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    username: '',
    password: '',
    role: 'student' as 'admin' | 'student'
  });

  useEffect(() => {
    fetchExams();
    fetchUsers();
  }, []);

  async function fetchExams() {
    try {
      const q = query(collection(db, 'exams'));
      const snap = await getDocs(q);
      setExams(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
    } catch (err) { console.error(err); }
  }

  async function fetchUsers() {
    try {
      const q = query(collection(db, 'users'));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingExam) {
        await updateDoc(doc(db, 'exams', editingExam.id), examFormData);
      } else {
        await addDoc(collection(db, 'exams'), {
          ...examFormData,
          createdAt: new Date().toISOString()
        });
      }
      setShowExamForm(false);
      setEditingExam(null);
      fetchExams();
    } catch (err) { alert('Error saving exam'); }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const email = `${userFormData.username.toLowerCase().trim()}@mgmp-ips-kebumen.id`;
      // Note: This only works if the admin is logged in and has permissions
      // In a real app, you'd use a Cloud Function to create users without logging them in
      // For this prototype, we'll try to create it directly but warn if it fails
      
      // Attempt to create user profile in Firestore directly
      // (Actual Auth account creation might need a backend or special role)
      alert("Fitur pendaftaran user secara real-time terbatas pada client side. User akan dibuat di database, namun akun Auth harus didaftarkan manual atau via backend.");
      
      // Just for demo, we'll assume we can create the Firestore doc
      await setDoc(doc(db, 'users', userFormData.username), {
        name: userFormData.name,
        username: userFormData.username,
        role: userFormData.role,
        password: userFormData.password // Internal ref
      });
      
      setShowUserForm(false);
      fetchUsers();
    } catch (err) { alert('Error creating user profile'); }
  };

  const toggleExamStatus = async (exam: Exam) => {
    await updateDoc(doc(db, 'exams', exam.id), { isActive: !exam.isActive });
    fetchExams();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">Panel Administrasi</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">Kelola Infrastruktur CBT MGMP IPS</p>
        </div>
        <div className="flex space-x-2 bg-gray-50 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('exams')}
            className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${activeTab === 'exams' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Bank Soal
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg text-[10px] uppercase tracking-widest font-bold transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            Data Peserta
          </button>
        </div>
      </div>

      {activeTab === 'exams' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Daftar Ujian Aktif</h3>
            <button 
              onClick={() => {
                setEditingExam(null);
                setExamFormData({ title: '', description: '', duration: 60, passingScore: 70, isActive: true });
                setShowExamForm(true);
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
            >
              <Plus className="h-3 w-3 mr-1.5" /> Tambah Sesi
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map(exam => (
              <div key={exam.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 flex justify-between group hover:border-indigo-100 transition-all">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm truncate max-w-xs">{exam.title}</h4>
                  <div className="flex items-center space-x-4 mt-2 text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                    <span className="flex items-center"><Clock className="h-3 w-3 mr-1 text-indigo-400" /> {exam.duration}M</span>
                    <span className="flex items-center"><FileText className="h-3 w-3 mr-1 text-indigo-400" /> Passing: {exam.passingScore}%</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => toggleExamStatus(exam)}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg border text-xs font-bold transition-all ${exam.isActive ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-200 text-gray-400'}`}
                    title={exam.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                  >
                    {exam.isActive ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </button>
                  <button 
                    onClick={() => {
                      setEditingExam(exam);
                      setExamFormData({ ...exam });
                      setShowExamForm(true);
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-105"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-50 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Master Data Peserta</h3>
            <button 
              onClick={() => setShowUserForm(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] uppercase font-bold tracking-widest flex items-center hover:bg-indigo-700 shadow-lg shadow-indigo-100"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Impor Peserta
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Identitas</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID Akses</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Aksesibilitas</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${u.role === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-[10px] font-bold uppercase text-red-500">
                      <button className="hover:underline">Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Exam Form */}
      {showExamForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">{editingExam ? 'Edit Ujian' : 'Tambah Ujian Baru'}</h3>
            <form onSubmit={handleSaveExam} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Judul Ujian</label>
                <input 
                  type="text" 
                  required 
                  value={examFormData.title}
                  onChange={e => setExamFormData({...examFormData, title: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi</label>
                <textarea 
                  rows={3}
                  value={examFormData.description}
                  onChange={e => setExamFormData({...examFormData, description: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Durasi (Menit)</label>
                  <input 
                    type="number" 
                    required 
                    value={examFormData.duration}
                    onChange={e => setExamFormData({...examFormData, duration: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Pass Score (%)</label>
                  <input 
                    type="number" 
                    required 
                    value={examFormData.passingScore}
                    onChange={e => setExamFormData({...examFormData, passingScore: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setShowExamForm(false)} className="px-6 py-2 bg-gray-100 rounded-xl font-bold text-gray-600">Batal</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-100">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal User Form simplified for demo */}
      {showUserForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Tambah Pengguna</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nama Lengkap</label>
                <input 
                  type="text" required 
                  value={userFormData.name}
                  onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
                <input 
                  type="text" required 
                  value={userFormData.username}
                  onChange={e => setUserFormData({...userFormData, username: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Role</label>
                <select 
                  value={userFormData.role}
                  onChange={e => setUserFormData({...userFormData, role: e.target.value as any})}
                  className="w-full px-4 py-2 rounded-xl border border-gray-200"
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-8">
                <button type="button" onClick={() => setShowUserForm(false)} className="px-6 py-2 bg-gray-100 rounded-xl font-bold text-gray-600">Batal</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
