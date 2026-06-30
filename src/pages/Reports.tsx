import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Exam, ExamResult, UserProfile } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Download, FileText, TrendingUp, Users, Award, Target } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export default function Reports() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const examsSnap = await getDocs(collection(db, 'exams'));
        const resultsSnap = await getDocs(collection(db, 'results'));
        const usersSnap = await getDocs(collection(db, 'users'));
        
        setExams(examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam)));
        setResults(resultsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExamResult)));
        setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile)));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const getAnalytics = () => {
    const totalAttempts = results.filter(r => r.status === 'completed').length;
    const avgScore = results.length > 0 
      ? results.reduce((acc, r) => acc + (r.score || 0), 0) / totalAttempts 
      : 0;
    
    const passCount = results.filter(r => {
      const exam = exams.find(e => e.id === r.examId);
      return r.score >= (exam?.passingScore || 70);
    }).length;

    const chartData = exams.map(exam => {
      const examResults = results.filter(r => r.examId === exam.id && r.status === 'completed');
      return {
        name: exam.title,
        avg: examResults.length > 0 ? examResults.reduce((acc, r) => acc + r.score, 0) / examResults.length : 0,
        count: examResults.length
      };
    });

    const passRateData = [
      { name: 'Lulus', value: passCount, color: '#10B981' },
      { name: 'Belum Lulus', value: totalAttempts - passCount, color: '#EF4444' }
    ];

    return { totalAttempts, avgScore, passCount, chartData, passRateData };
  };

  const exportPDF = () => {
    const doc = new jsPDF() as any;
    doc.setFontSize(20);
    doc.text('Laporan Hasil Ujian CBT MGMP IPS Kebumen 2026', 20, 20);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 20, 30);

    const tableData = results.filter(r => r.status === 'completed').map(r => {
      const user = users.find(u => u.id === r.userId);
      const exam = exams.find(e => e.id === r.examId);
      return [
        user?.name || 'Unknown',
        exam?.title || 'Unknown',
        `${r.score}%`,
        r.totalCorrect,
        r.totalQuestions,
        format(new Date(r.startTime), 'dd/MM/yyyy')
      ];
    });

    doc.autoTable({
      startY: 40,
      head: [['Nama Pembina', 'Ujian', 'Skor', 'Benar', 'Total', 'Tanggal']],
      body: tableData,
    });

    doc.save('Laporan_CBT_MGMP_IPS.pdf');
  };

  if (loading) return <div>Loading...</div>;

  const stats = getAnalytics();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Analisa Performa</h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest font-semibold">Data Statistik Peserta MGMP IPS</p>
        </div>
        <button 
          onClick={exportPDF}
          className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Download className="h-4 w-4 mr-2" /> Ekspor PDF
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="bg-indigo-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-indigo-600" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rata-rata Skor</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.avgScore.toFixed(1)}%</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Award className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lulus</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.passCount}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="bg-orange-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-orange-600" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partisipan</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{users.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="bg-indigo-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-indigo-200" />
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Ujian</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalAttempts}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-widest">Performa per Sesi</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip 
                  cursor={{fill: '#f9fafb'}} 
                  contentStyle={{borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="avg" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={32}>
                   {stats.chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.avg >= 70 ? '#4F46E5' : '#818CF8'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-bold text-gray-900 mb-6 self-start uppercase tracking-widest">Status Kelulusan</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.passRateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {stats.passRateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex space-x-6 mt-4">
            {stats.passRateData.map(d => (
              <div key={d.name} className="flex items-center">
                <div className="w-2.5 h-2.5 rounded-full mr-2" style={{backgroundColor: d.color}}></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{d.name}: {d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
