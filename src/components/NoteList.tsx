import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { ArrowLeft, BookOpen, Star, RotateCw, AlertCircle } from 'lucide-react';
import { stripHtmlToText } from '../utils/sanitizeHtml';
import { readJsonArray } from '../utils/safeLocalStorage';

interface NoteListProps {
  onBack: () => void;
  onSelectNote: (note: any) => void;
}

export function NoteList({ onBack, onSelectNote }: NoteListProps) {
  const [notes, setNotes] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'important' | 'to_review'>('all');

  useEffect(() => {
    if (!auth.currentUser) return;
    const fetchNotes = async () => {
      try {
        const localNotes = readJsonArray<any>(`notes_${auth.currentUser!.uid}`);
        localNotes.sort((a: any, b: any) => {
          // Sort by importance first, then by creation date
          if (a.isImportant !== b.isImportant) {
            return (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0);
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setNotes(localNotes);
      } catch (error) {
        console.error("ノート取得エラー:", error);
      }
    };
    fetchNotes();
  }, []);

  // 一覧のプレビュー用にHTMLタグを落としてテキストだけにする。
  //
  // ★以前は innerHTML に代入して textContent を読み出していた★
  //   <script> は実行されないが、<img src=x onerror=...> は
  //   HTMLの解析時に読み込みが走り onerror が発火し得る。
  //   「テキストが欲しいだけ」なのにHTMLを評価するのは危険なので、
  //   DOMを一切作らない共通実装（stripHtmlToText）に置き換えた。
  const stripHtml = stripHtmlToText;

  // Filter notes based on current filter
  const filteredNotes = notes.filter(note => {
    if (filter === 'important') return note.isImportant;
    if (filter === 'to_review') return note.reviewCount && note.reviewCount < 3;
    return true;
  });

  // Count statistics
  const importantCount = notes.filter(n => n.isImportant).length;
  const toReviewCount = notes.filter(n => n.reviewCount && n.reviewCount < 3).length;

  return (
    <div className="w-full space-y-6 p-4 md:p-8 bg-[#FDFBF7] min-h-screen font-handwriting" style={{ backgroundImage: 'linear-gradient(#A9CCE3 1px, transparent 1px)', backgroundSize: '100% 2.5rem' }}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <button
          onClick={onBack}
          aria-label="ホームに戻る"
          title="ホームに戻る"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-[#2C3E50] transition-colors shadow-sm border border-gray-200"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#2C3E50]">個人ノート一覧</h2>
      </div>

      {/* Statistics and Filters */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-center">
            <div className="text-2xl font-bold text-blue-600">{notes.length}</div>
            <div className="text-xs text-gray-600">全ノート数</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded-xl border border-yellow-200 text-center">
            <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-1">
              <Star size={18} /> {importantCount}
            </div>
            <div className="text-xs text-gray-600">重要な問題</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-200 text-center">
            <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
              <AlertCircle size={18} /> {toReviewCount}
            </div>
            <div className="text-xs text-gray-600">要復習</div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              filter === 'all'
                ? 'bg-[#2C3E50] text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            すべて ({notes.length})
          </button>
          <button
            onClick={() => setFilter('important')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              filter === 'important'
                ? 'bg-yellow-400 text-white'
                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            <Star size={16} /> 重要 ({importantCount})
          </button>
          <button
            onClick={() => setFilter('to_review')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              filter === 'to_review'
                ? 'bg-orange-400 text-white'
                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            }`}
          >
            <RotateCw size={16} /> 復習 ({toReviewCount})
          </button>
        </div>
      </div>

      {/* Notes List */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center text-gray-500">
            <BookOpen size={40} className="mx-auto mb-4 opacity-50" />
            <p className="font-handwriting">ノートがまだありません</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div 
              key={note.id} 
              className="bg-white p-4 rounded-sm shadow-md border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow transform hover:-rotate-1 relative"
              onClick={() => onSelectNote(note)}
            >
              {/* Important Badge */}
              {note.isImportant && (
                <div className="absolute top-2 right-2 bg-yellow-400 p-1.5 rounded-full">
                  <Star size={16} className="text-white" fill="white" />
                </div>
              )}

              {(note.chapterTitle || note.questionIndex) && (
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {note.chapterTitle && (
                    <span className="bg-[#A9CCE3]/20 text-[#2C3E50] px-2 py-0.5 rounded text-[10px] font-bold border border-[#A9CCE3]/50">
                      {note.chapterTitle}
                    </span>
                  )}
                  {note.questionIndex && (
                    <span className="bg-[#F9E79F]/30 text-[#D35400] px-2 py-0.5 rounded text-[10px] font-bold border border-[#F5B041]/50">
                      第{note.questionIndex}問
                    </span>
                  )}
                  {note.reviewCount && note.reviewCount > 0 && (
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold border border-green-200 flex items-center gap-1">
                      <RotateCw size={10} /> 復習{note.reviewCount}回
                    </span>
                  )}
                </div>
              )}

              <h3 className="font-bold text-[#2C3E50] truncate font-modern pr-8">{stripHtml(note.question)}</h3>
              <p className="text-sm text-gray-500 truncate mt-1">{note.memo || 'メモなし'}</p>

              {/* Tags Display */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {note.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      #{tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-[10px] text-gray-500">+{note.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
