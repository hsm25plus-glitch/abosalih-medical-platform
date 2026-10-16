'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

// Supabase Setup
const supabaseUrl = 'https://zovjlicufueydpfqbgmt.supabase.co';
const supabaseKey = 'Sb_publishable_RnFBOhjPNfi__XN-j5x33w_fEvf9HuF';
const supabase = createClient(supabaseUrl, supabaseKey);

// Gemini API Setup
const ai = new GoogleGenAI({ apiKey: 'AQ.Ab8RN6Jz35H6A-HxmyC3q7UBUjsK4r4sRxidib_SpMOx8PdHiA' });

export default function AboSalihPlatform() {
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [questionData, setQuestionData] = useState<any>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [savedStatus, setSavedStatus] = useState('');

  const generateHamdanQuestion = async () => {
    if (!topic) return;
    setLoading(true);
    setShowAnswer(false);
    setSelectedOption(null);
    setSavedStatus('');

    try {
      const prompt = `Generate a high-yield medical board exam question (MRCOG/Arab Board style) about: ${topic}. 
      Strictly follow this JSON format without markdown ticks:
      {
        "question": "Regarding [topic], all the following are correct EXCEPT:",
        "options": ["A) ...", "B) ...", "C) ...", "D) ...", "E) ..."],
        "correctAnswer": "A",
        "explanation": "Brief correction and clinical rationale."
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text.trim();
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      setQuestionData(JSON.parse(cleanJson));
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء توليد السؤال، حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const saveToSupabase = async () => {
    if (!questionData) return;
    const { error } = await supabase.from('medical_questions').insert([
      { topic, question_data: questionData, created_at: new Date() }
    ]);
    if (error) {
      setSavedStatus('فشل الحفظ: تأكد من إنشاء جدول medical_questions في قاعدة البيانات.');
    } else {
      setSavedStatus('تم حفظ السؤال بنجاح في قاعدة البيانات.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans" dir="ltr">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2 border-b border-slate-800 pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-cyan-400">AboSalih Medical Platform</h1>
          <p className="text-sm text-slate-400">MRCOG, Arab Board & Sudan Board Prep System</p>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
          <label className="block text-sm font-medium text-slate-300">Enter Medical Topic / Structure:</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Pelvic floor anatomy, Eclampsia management..." 
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500"
            />
            <button 
              onClick={generateHamdanQuestion}
              disabled={loading}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">
              {loading ? 'Generating...' : 'Generate Q'}
            </button>
          </div>
        </div>

        {questionData && (
          <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
            <h2 className="font-semibold text-base text-cyan-300">{questionData.question}</h2>
            <div className="space-y-2">
              {questionData.options.map((option: string, idx: number) => {
                const optLetter = String.fromCharCode(65 + idx);
                const isSelected = selectedOption === optLetter;
                const isCorrect = questionData.correctAnswer === optLetter;
                
                let btnStyle = 'border-slate-700 bg-slate-950 hover:border-cyan-500';
                if (showAnswer) {
                  if (isCorrect) btnStyle = 'border-emerald-500 bg-emerald-950/40 text-emerald-200';
                  else if (isSelected) btnStyle = 'border-rose-500 bg-rose-950/40 text-rose-200';
                } else if (isSelected) {
                  btnStyle = 'border-cyan-500 bg-cyan-950/40';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => !showAnswer && setSelectedOption(optLetter)}
                    className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${btnStyle}`}>
                    {option}
                  </button>
                );
              })}
            </div>

            {!showAnswer ? (
              <button 
                onClick={() => setShowAnswer(true)}
                disabled={!selectedOption}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg font-semibold text-sm transition-colors">
                Submit Answer
              </button>
            ) : (
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="text-sm text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <strong className="text-cyan-400">Correction: </strong> {questionData.explanation}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={generateHamdanQuestion}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-sm font-semibold transition-colors">
                    Next Question
                  </button>
                  <button 
                    onClick={saveToSupabase}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
                    Save to DB
                  </button>
                </div>
                {savedStatus && <p className="text-xs text-center text-cyan-400">{savedStatus}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
