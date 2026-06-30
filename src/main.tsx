import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

import { collection, getDocs, setDoc, doc, query, where } from 'firebase/firestore';
import { db } from './lib/firebase';
import { GEOPARK_QUESTIONS, HOTS_CURRICULUM_QUESTIONS } from './constants/predefinedData';

// Simple bootstrap for MGMP IPS Kebumen 2026 demo
async function bootstrap() {
  try {
    // Seed Geopark Exam
    const examsSnap = await getDocs(query(collection(db, 'exams'), where('title', '==', 'Olimpiade Geopark Kebumen 2026')));
    if (examsSnap.empty) {
      console.log("Seeding Geopark Exam...");
      const examId = 'geopark-2026';
      await setDoc(doc(db, 'exams', examId), {
        title: 'Olimpiade Geopark Kebumen 2026',
        description: 'Uji kompetensi pembina OSN IPS dengan tema Geopark Nasional Karangsambung-Karangbolong. Standar soal tingkat kabupaten.',
        duration: 90,
        passingScore: 75,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      for (let i = 0; i < GEOPARK_QUESTIONS.length; i++) {
        const q = GEOPARK_QUESTIONS[i];
        await setDoc(doc(db, 'exams', examId, 'questions', `q${i+1}`), { ...q, order: i, id: `q${i+1}` });
      }
    }

    // Seed HOTS Curriculum Exam
    const hotsSnap = await getDocs(query(collection(db, 'exams'), where('title', '==', 'Simulasi HOTS IPS Kebumen 2026')));
    if (hotsSnap.empty) {
      console.log("Seeding HOTS Curriculum Exam...");
      const examId = 'hots-curriculum-2026';
      await setDoc(doc(db, 'exams', examId), {
        title: 'Simulasi HOTS IPS Kebumen 2026',
        description: 'Analisis Fenomena Lokal Kebumen: Ekonomi, Geografi, Sejarah, dan Sosiologi. Standar HOTS C4-C5 untuk Pembina OSN.',
        duration: 120,
        passingScore: 80,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      for (let i = 0; i < HOTS_CURRICULUM_QUESTIONS.length; i++) {
        const q = HOTS_CURRICULUM_QUESTIONS[i];
        await setDoc(doc(db, 'exams', examId, 'questions', `h${i+1}`), { ...q, order: i, id: `h${i+1}` });
      }
    }
  } catch (e: any) {
    if (e?.code !== 'permission-denied') {
      console.error("Bootstrap failed:", e);
    }
  }
}
bootstrap();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

