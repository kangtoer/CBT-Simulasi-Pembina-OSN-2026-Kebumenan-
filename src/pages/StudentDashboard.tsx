import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Exam, ExamResult } from '../types';
import { useAuth } from '../components/AuthProvider';
import { Clock, Play, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const { profile } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Record<string, ExamResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!profile) return;
      
      try {
        // Fetch active exams
        const examsQuery = query(collection(db, 'exams'), where('isActive', '==', true));
        const examsSnap = await getDocs(examsQuery);
        const examsList = examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exam));
        setExams(examsList);

        // Fetch user results
        const resultsQuery = query(
          collection(db, 'results'), 
          where('userId', '==', profile.id)
        );
        const resultsSnap = await getDocs(resultsQuery);
        const resultsMap: Record<string, ExamResult> = {};
        resultsSnap.docs.forEach(doc => {
          const data = doc.data() as ExamResult;
          // Store most recent result for each exam
          if (!resultsMap[data.examId] || resultsMap[data.examId].startTime < data.startTime) {
            resultsMap[data.examId] = { id: doc.id, ...data };
          }
        });
        setResults(resultsMap);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [profile]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Selamat Datang, {profile?.name}!</h2>
          <p className="text-xs text-gray-500 mt-1">Anda terdaftar sebagai Pembina OSN MGMP IPS SMP Kebumen.</p>
        </div>
        <div className="hidden sm:block">
          <Calendar className="h-12 w-12 text-indigo-100" />
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center">
          <Play className="h-4 w-4 mr-2 text-indigo-600 fill-indigo-600" />
          Ujian yang Tersedia
        </h3>
        
        {exams.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border border-gray-200 shadow-sm">
            Belum ada ujian aktif saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map(exam => {
              const result = results[exam.id];
              const isCompleted = result?.status === 'completed';
              
              return (
                <div key={exam.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:border-indigo-200 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                        {exam.duration} Menit
                      </div>
                      {isCompleted && (
                        <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" /> Selesai
                        </div>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-gray-900 mb-2">{exam.title}</h4>
                    <p className="text-xs text-gray-500 mb-6 line-clamp-2">{exam.description}</p>
                  </div>

                  <div className="space-y-3">
                    {isCompleted ? (
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex justify-between items-center text-[11px] mb-1">
                          <span className="text-gray-400 font-bold uppercase tracking-tighter">Skor Anda</span>
                          <span className={`font-black ${result.score >= exam.passingScore ? 'text-green-600' : 'text-red-500'}`}>
                            {result.score} / 100
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Link 
                        to={`/exam/${exam.id}`}
                        className="w-full flex justify-center items-center py-2.5 px-4 rounded-lg shadow-sm text-xs font-bold uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
                      >
                        {result?.status === 'started' ? 'Lanjutkan Ujian' : 'Mulai Ujian'}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {Object.values(results).some((r: ExamResult) => r.status === 'completed') && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
              Riwayat Hasil Ujian
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ujian</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tanggal</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Skor</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {Object.values(results).filter((r: ExamResult) => r.status === 'completed').map((result: ExamResult) => {
                  const exam = exams.find(e => e.id === result.examId);
                  return (
                    <tr key={result.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900">{exam?.title || 'Unknown Exam'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{format(new Date(result.startTime), 'dd/MM/yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-gray-900">{result.score}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-[10px] font-bold rounded ${result.score >= (exam?.passingScore || 70) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {result.score >= (exam?.passingScore || 70) ? 'LULUS' : 'REMIDI'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
