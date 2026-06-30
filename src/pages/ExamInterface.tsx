import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, getDocs, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/AuthProvider';
import { Exam, Question, ExamResult } from '../types';
import { Clock, ChevronLeft, ChevronRight, Send, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ExamInterface() {
  const { examId } = useParams<{ examId: string }>();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [resultId, setResultId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use a ref for answers to avoid stale closures in effects
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  useEffect(() => {
    async function initExam() {
      if (!examId || !user) return;

      try {
        const examDoc = await getDoc(doc(db, 'exams', examId));
        if (!examDoc.exists()) {
          navigate('/');
          return;
        }
        const examData = { id: examDoc.id, ...examDoc.data() } as Exam;
        setExam(examData);

        const qSnap = await getDocs(collection(db, 'exams', examId, 'questions'));
        const qs = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
        setQuestions(qs);

        // Check for existing 'started' result
        const resId = `${user.uid}_${examId}`;
        const resDoc = await getDoc(doc(db, 'results', resId));
        
        let initialAnswers = {};
        let initialTimeLeft = examData.duration * 60;

        if (resDoc.exists()) {
          const resData = resDoc.data() as ExamResult;
          if (resData.status === 'completed') {
            navigate('/');
            return;
          }
          initialAnswers = resData.answers || {};
          setResultId(resId);
          // Calculate remaining time
          const start = new Date(resData.startTime).getTime();
          const now = Date.now();
          const elapsed = Math.floor((now - start) / 1000);
          initialTimeLeft = Math.max(0, (examData.duration * 60) - elapsed);
        } else {
          // Create new result
          const newResult: any = {
            userId: user.uid,
            examId: examId,
            status: 'started',
            startTime: new Date().toISOString(),
            answers: {},
            score: 0,
            totalCorrect: 0,
            totalQuestions: qs.length
          };
          await setDoc(doc(db, 'results', resId), newResult);
          setResultId(resId);
        }

        setAnswers(initialAnswers);
        setTimeLeft(initialTimeLeft);
      } catch (err) {
        console.error("Exam init error:", err);
      } finally {
        setLoading(false);
      }
    }

    initExam();
  }, [examId, user, navigate]);

  // Timer effect
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) {
      if (timeLeft === 0) finishExam();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleSelectOption = (questionId: string, optionIdx: number, type: 'single' | 'complex') => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      let next;
      if (type === 'single') {
        next = [optionIdx];
      } else {
        if (current.includes(optionIdx)) {
          next = current.filter(i => i !== optionIdx);
        } else {
          next = [...current, optionIdx].sort();
        }
      }
      
      const updated = { ...prev, [questionId]: next };
      // Async update in background
      if (resultId) {
        updateDoc(doc(db, 'results', resultId), { answers: updated });
      }
      return updated;
    });
  };

  const finishExam = async () => {
    if (isSubmitting || !resultId || !exam) return;
    setIsSubmitting(true);
    
    try {
      let correctCount = 0;
      questions.forEach(q => {
        const userAns = answers[q.id] || [];
        const correctAns = q.correctAnswer || [];
        if (JSON.stringify(userAns.sort()) === JSON.stringify(correctAns.sort())) {
          correctCount++;
        }
      });

      const score = Math.round((correctCount / questions.length) * 100);
      
      await updateDoc(doc(db, 'results', resultId), {
        status: 'completed',
        endTime: new Date().toISOString(),
        score,
        totalCorrect: correctCount,
        totalQuestions: questions.length,
        answers: answers
      });

      navigate('/');
    } catch (err) {
      console.error("Finish exam error:", err);
      alert("Gagal mengirim jawaban. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading || !exam) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const currentQ = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Exam Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">C</div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-none">{exam.title}</h1>
            <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider font-semibold">OSN MGMP IPS Kebumen</p>
          </div>
        </div>

        <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg border font-mono font-bold text-base ${timeLeft && timeLeft < 300 ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-gray-50 border-gray-100 text-gray-700'}`}>
          <Clock className="h-4 w-4" />
          <span>{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
        </div>

        <button 
          onClick={() => {
            if (window.confirm('Apakah Anda yakin ingin menyelesaikan ujian sekarang?')) finishExam();
          }}
          disabled={isSubmitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center transition-all disabled:opacity-50"
        >
          <Send className="h-3 w-3 mr-2" />
          Selesai
        </button>
      </header>

      <main className="flex-grow max-w-5xl w-full mx-auto p-6 flex flex-col md:flex-row gap-6">
        {/* Question Panel */}
        <div className="flex-grow">
          {currentQ && (
            <motion.div 
              key={currentQ.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-full flex flex-col"
            >
              <div className="bg-white px-8 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pertanyaan {currentIdx + 1} dari {questions.length}</span>
                <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-bold text-gray-400 uppercase">
                  {currentQ.type === 'complex' ? 'Ganda Kompleks' : 'Tunggal'}
                </span>
              </div>
              
              <div className="p-8 flex-grow">
                <p className="text-lg text-gray-800 font-medium leading-relaxed mb-8">
                  {currentQ.questionText}
                </p>

                <div className="space-y-3">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = (answers[currentQ.id] || []).includes(idx);
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectOption(currentQ.id, idx, currentQ.type)}
                        className={`w-full flex items-center p-4 rounded-xl border text-left transition-all group ${
                          isSelected 
                            ? 'bg-indigo-50 border-indigo-600 shadow-sm' 
                            : 'bg-white border-gray-100 hover:border-indigo-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 font-bold border ${
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-400 group-hover:border-indigo-300'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className={`text-sm transition-colors ${isSelected ? 'text-indigo-900 font-bold' : 'text-gray-600'}`}>
                          {option}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex justify-between">
                <button
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(prev => prev - 1)}
                  className="flex items-center px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 hover:bg-white transition-all disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Sebelumnya
                </button>
                
                {isLast ? (
                  <button
                    onClick={finishExam}
                    className="bg-green-600 text-white px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest flex items-center hover:bg-green-700 shadow-lg shadow-green-100 transition-all"
                  >
                    Kirim Jawaban <Send className="h-3 w-3 ml-2" />
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentIdx(prev => prev + 1)}
                    className="flex items-center bg-indigo-600 text-white px-8 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                  >
                    Berikutnya <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar Nav */}
        <div className="w-full md:w-72 flex flex-col gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Navigasi Soal</h3>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = (answers[q.id] || []).length > 0;
                const isCurrent = currentIdx === idx;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center font-bold text-xs transition-all border ${
                      isCurrent 
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                        : isAnswered 
                          ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                          : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="bg-indigo-900 rounded-lg p-4 text-white">
               <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2">Progres</p>
               <div className="flex justify-between items-center text-lg font-black mb-2">
                 <span>{Object.keys(answers).length}</span>
                 <span className="text-indigo-400">/ {questions.length}</span>
               </div>
               <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                 <div 
                   className="bg-white h-full transition-all duration-500" 
                   style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                 />
               </div>
            </div>
            
            <div className="mt-6 flex items-start text-gray-400">
              <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] leading-relaxed font-medium italic">
                Data tersinkronisasi otomatis dengan server utama MGMP.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white py-4 text-center border-t border-gray-100">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">MGMP IPS SMP Kebumen &copy; 2026 - Uji Coba Pembina OSN</p>
      </footer>
    </div>
  );
}

// Icon for BookOpen
const BookOpen = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);
