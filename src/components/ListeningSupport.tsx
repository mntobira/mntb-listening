import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, Headphones, Search, Volume2, X } from 'lucide-react';
import { LISTENING_GRAMMAR, VOCAB_LEVELS, filterVocabulary, parseSupportProgress, supportStorageKey, type ListeningWord, type VocabularyData, type SupportProgress } from '../data/listeningSupport';
import { safeLocalStorage } from '../utils/safeLocalStorage';
import { speak, stopSpeech, isSpeechSupported } from '../utils/listeningSpeech';
import { pauseAllAudio } from '../utils/audioElements';

// key を渡せるよう React.Attributes を足す（@types/react が無い環境でも tsc が通るように。2026-09-29）
function ReadAloud({text}:{text:string}&React.Attributes) {
  const [playing,setPlaying]=useState(false);
  const active=useRef(true);
  useEffect(()=>{active.current=true;return()=>{active.current=false;stopSpeech();};},[text]);
  const play=()=>{
    if(playing){stopSpeech();setPlaying(false);return;}
    pauseAllAudio();
    const ok=speak('listening-support',text,1,{rate:.85,onEnd:()=>{if(active.current)setPlaying(false);}});
    setPlaying(ok);
  };
  return <button type="button" onClick={play} disabled={!isSpeechSupported()} className="ls-audio"><Volume2 size={17}/>{playing?'読み上げを止める':'端末の音声で読む'}</button>;
}
function WordCard({word,known,onMark,onPractice}:{word:ListeningWord;known:boolean;onMark:(done:boolean)=>void;onPractice:(chapter:string,index:number)=>void}&React.Attributes) {
  const [mode,setMode]=useState<'learn'|'check'>('learn');
  const [reveal,setReveal]=useState(false);const [direction,setDirection]=useState(0);const [answer,setAnswer]=useState<number|null>(null);
  const question=word.questions[direction]||word.questions[0];
  return <article className="ls-word-card" data-word-card>
    <div className="ls-card-top"><span className="ls-eyebrow">{VOCAB_LEVELS[word.level]}</span><span>{known?'覚えた語':'これから覚える語'}</span></div>
    <div className="ls-segment" aria-label="単語の学習方法"><button aria-pressed={mode==='learn'} onClick={()=>{setMode('learn');setAnswer(null);}}>意味を学ぶ</button><button aria-pressed={mode==='check'} onClick={()=>{setMode('check');setAnswer(null);}}>4択で確認</button></div>
    {mode==='learn'?<><h3 lang="en">{word.word}</h3><ReadAloud text={word.word}/><button className="ls-meaning" onClick={()=>setReveal(v=>!v)} aria-expanded={reveal}>{reveal?'意味を隠す':'意味を見る'}</button>{reveal&&<p className="ls-definition">{word.fullMeaning}</p>}</>
      :<div className="ls-quiz"><label>確認の向き<select aria-label="確認の向き" value={direction} onChange={e=>{setDirection(Number(e.target.value));setAnswer(null);}}>{word.questions.map((q,i)=><option key={q.id} value={i}>{i===0?'英語 → 日本語':'日本語 → 英語'}</option>)}</select></label><p>{question.prompt}</p><h3>{question.label}</h3><div className="ls-options">{question.options.map((option,i)=><button key={i} disabled={answer!==null} onClick={()=>setAnswer(i)} data-correct={answer!==null&&i===question.answerIndex?true:undefined}>{option}</button>)}</div>{answer!==null&&<div className="ls-feedback" role="status"><strong>{answer===question.answerIndex?'正解です':'もう一度確認しよう'}</strong><p>正解：{question.options[question.answerIndex]}</p><p>{word.fullMeaning}</p><button onClick={()=>setAnswer(null)}>もう一度答える</button></div>}</div>}
    <button className="ls-mark" onClick={()=>onMark(!known)} aria-pressed={known}><Check size={17}/>{known?'覚えた印を外す':'覚えた語にする'}</button>
    <details className="ls-examples"><summary>リスニングとのつながり{word.examples.length>0?`（${word.examples.length}大問）`:''}</summary>
      <p>教材スクリプトに同じ表記がある回です。語形変化・言い換えは自動では結び付けていません。</p>
      {word.examples.length===0?<p>現在の教材に同じ表記の例はありません。語彙を広げる学習として使えます。</p>:word.examples.map(example=><section key={example.chapterId}>
        <h4>{example.chapterTitle}・第{example.problemIndex+1}回</h4><p lang="en">{example.script}</p><p>{example.translation}</p>
        <label>収録音源（全体）<audio controls preload="none" src={example.audioUrl} onPlay={e=>{stopSpeech();pauseAllAudio(e.currentTarget);}}/></label>
        <button onClick={()=>onPractice(example.chapterId,example.problemIndex)}><Headphones size={16}/>この回を演習する</button>
      </section>)}
    </details>
  </article>;
}
export function ListeningSupport({initialTab,uid,onClose,onPractice}:{initialTab:'words'|'grammar';uid:string;onClose:()=>void;onPractice:(chapter:string,index:number)=>void}) {
  const dialog=useRef<HTMLDialogElement>(null);
  const [tab,setTab]=useState(initialTab);const [data,setData]=useState<VocabularyData|null>(null);const [loadError,setLoadError]=useState('');const [retry,setRetry]=useState(0);
  const [query,setQuery]=useState('');const [level,setLevel]=useState('');const [chapter,setChapter]=useState('');const [unlearned,setUnlearned]=useState(false);
  const [page,setPage]=useState(0);const [selected,setSelected]=useState(0);const [grammarIndex,setGrammarIndex]=useState(0);const [grammarAnswer,setGrammarAnswer]=useState<number|null>(null);
  const [saved,setSaved]=useState<{progress:SupportProgress;error:string}>(()=>{
    try{const store=safeLocalStorage();if(!store)throw new Error('この端末では保存できません。学習内容は閲覧できます。');return {progress:parseSupportProgress(store.getItem(supportStorageKey(uid))),error:''};}
    catch(e){return {progress:{version:1,words:[],grammar:[]},error:e instanceof Error?e.message:'保存記録を読み込めません。'};}
  });
  const [saveError,setSaveError]=useState('');
  useEffect(()=>{const node=dialog.current;node?.showModal();return()=>{pauseAllAudio(null,node);stopSpeech();node?.close();};},[]);
  useEffect(()=>{
    if(tab!=='words'||data)return;let alive=true;setLoadError('');
    const controller=new AbortController();
    fetch('/data/listeningVocabulary.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error('Vocabulary unavailable');return r.json();}).then(value=>{if(!Array.isArray(value.words)||!Array.isArray(value.chapters)||typeof value.wordCount!=='number')throw new Error('Invalid vocabulary data');if(alive)setData(value as VocabularyData);}).catch(()=>{if(alive)setLoadError('単語を読み込めませんでした。接続を確認して再読み込みしてください。');});
    return()=>{alive=false;controller.abort();};
  },[tab,data,retry]);
  const stop=()=>{pauseAllAudio(null,dialog.current);stopSpeech();};
  const close=()=>{stop();dialog.current?.close();onClose();};
  const practice=(id:string,index:number)=>{close();onPractice(id,index);};
  const mark=(kind:'words'|'grammar',id:string,done:boolean)=>{
    if(saved.error)return;
    try {
      const store=safeLocalStorage();if(!store)throw new Error('この端末では保存できません。');
      // Read latest state so two open tabs do not erase each other's marks.
      const current=parseSupportProgress(store.getItem(supportStorageKey(uid)));const ids=new Set(current[kind]);done?ids.add(id):ids.delete(id);
      const next={...current,[kind]:[...ids]};store.setItem(supportStorageKey(uid),JSON.stringify(next));setSaved({progress:next,error:''});setSaveError('');
    }catch(e){setSaveError(e instanceof Error?e.message:'保存に失敗しました。');}
  };
  const filtered=useMemo(()=>filterVocabulary(data?.words||[],query,level,chapter,unlearned,saved.progress.words),[data,query,level,chapter,unlearned,saved.progress.words]);
  const pages=Math.max(1,Math.ceil(filtered.length/20));const safePage=Math.min(page,pages-1);const slice=filtered.slice(safePage*20,safePage*20+20);const word=slice[Math.min(selected,Math.max(0,slice.length-1))];
  const reset=()=>{stop();setPage(0);setSelected(0);};
  const lesson=LISTENING_GRAMMAR[grammarIndex];
  return <dialog ref={dialog} className="listening-support" aria-labelledby="listening-support-title" onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
    <header className="ls-dialog-header"><div><p className="ls-eyebrow">聞くための土台づくり</p><h2 id="listening-support-title">{tab==='words'?'単語・熟語':'英文法のポイント'}</h2></div><button onClick={close} aria-label="補助学習を閉じる" autoFocus><X/></button></header>
    <div className="ls-segment"><button aria-pressed={tab==='words'} onClick={()=>{stop();setTab('words');}}>単語・熟語</button><button aria-pressed={tab==='grammar'} onClick={()=>{stop();setTab('grammar');}}>英文法</button></div>
    <p className="ls-save-note">覚えた印はこの端末・アカウントに保存します（クラウド同期・コイン加算なし）。音声読み上げの声・対応状況は端末により異なります。</p>
    {(saved.error||saveError)&&<p role="alert" className="ls-error">{saved.error||saveError}</p>}
    {tab==='words'&&!data?<div role="status">{loadError?<>{loadError}<button onClick={()=>setRetry(n=>n+1)}>再読み込み</button></>:'単語・熟語を読み込んでいます…'}</div>:tab==='words'&&data?<>
      <p className="ls-count">全{data.wordCount.toLocaleString()}語・熟語 ／ 元の4択{data.questionCount.toLocaleString()}問を収録。1章20語で少しずつ。</p>
      <div className="ls-search"><Search size={18}/><input aria-label="単語・日本語で検索" placeholder="英語・日本語で検索" value={query} onChange={e=>{setQuery(e.target.value);reset();}}/></div>
      <div className="ls-filters"><label>レベル<select aria-label="単語のレベル" value={level} onChange={e=>{setLevel(e.target.value);reset();}}><option value="">すべてのレベル</option>{Object.entries(VOCAB_LEVELS).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><label>リスニングから探す<select aria-label="対応するリスニング大問" value={chapter} onChange={e=>{setChapter(e.target.value);reset();}}><option value="">すべての語</option>{data.chapters.map(c=><option key={c.id} value={c.id}>{c.title}に登場</option>)}</select></label></div>
      <div className="ls-unit"><label>小さな章<select aria-label="単語の小さな章" value={safePage} onChange={e=>{stop();setPage(Number(e.target.value));setSelected(0);}}>{Array.from({length:pages},(_,i)=><option key={i} value={i}>第{i+1}章・{i*20+1}〜{Math.min((i+1)*20,filtered.length)}語</option>)}</select></label><label className="ls-checkbox"><input type="checkbox" checked={unlearned} onChange={e=>{setUnlearned(e.target.checked);reset();}}/>未習得だけ</label><span>{filtered.length.toLocaleString()}件</span></div>
      {word?<><div className="ls-word-nav"><button disabled={safePage===0&&selected===0} onClick={()=>{stop();if(selected>0)setSelected(n=>n-1);else{setPage(safePage-1);setSelected(19);}}}><ArrowLeft size={16}/>前の語</button><span>{safePage*20+Math.min(selected,slice.length-1)+1} / {filtered.length}</span><button disabled={safePage*20+selected>=filtered.length-1} onClick={()=>{stop();if(selected<slice.length-1)setSelected(n=>n+1);else{setPage(safePage+1);setSelected(0);}}}>次の語<ArrowRight size={16}/></button></div>
        <WordCard key={word.id} word={word} known={saved.progress.words.includes(word.id)} onMark={done=>mark('words',word.id,done)} onPractice={practice}/>
        <details className="ls-unit-list"><summary>この章の20語を見る</summary><div>{slice.map((entry,i)=><button key={entry.id} aria-current={entry.id===word.id?'true':undefined} onClick={()=>{stop();setSelected(i);dialog.current?.querySelector('[data-word-card]')?.scrollIntoView({block:'start'});}}>{saved.progress.words.includes(entry.id)&&<Check size={14}/>}<span lang="en">{entry.word}</span></button>)}</div></details></>:<p role="status">該当する単語はありません。検索や絞り込みを変更してください。</p>}
    </>:<>
      <p className="ls-count">文法を全部やり直す前に、聞き取りに役立つ8つのポイント。</p>
      <div className="ls-grammar-grid">{LISTENING_GRAMMAR.map((g,i)=><button key={g.id} aria-pressed={i===grammarIndex} onClick={()=>{stop();setGrammarIndex(i);setGrammarAnswer(null);}}><span>{i+1}</span>{g.title}{saved.progress.grammar.includes(g.id)&&<Check size={14}/>}</button>)}</div>
      <article className="ls-word-card"><p className="ls-eyebrow">POINT {grammarIndex+1} / 8</p><h3>{lesson.title}</h3><p>{lesson.point}</p><blockquote lang="en">{lesson.example}</blockquote><ReadAloud key={lesson.id} text={lesson.example}/><p>{lesson.translation}</p><p className="ls-tip"><Headphones size={18}/>{lesson.tip}</p><h4>{lesson.question}</h4><div className="ls-options">{lesson.options.map((option,i)=><button key={lesson.id+i} disabled={grammarAnswer!==null} onClick={()=>setGrammarAnswer(i)} data-correct={grammarAnswer!==null&&i===lesson.answer?true:undefined}>{option}</button>)}</div>{grammarAnswer!==null&&<div role="status" className="ls-feedback"><strong>{grammarAnswer===lesson.answer?'正解です':'ポイントを確認しよう'}</strong><p>{lesson.explanation}</p><button onClick={()=>setGrammarAnswer(null)}>もう一度答える</button></div>}<button className="ls-mark" disabled={grammarAnswer!==lesson.answer||!!saved.error} onClick={()=>mark('grammar',lesson.id,!saved.progress.grammar.includes(lesson.id))} aria-pressed={saved.progress.grammar.includes(lesson.id)}><Check size={17}/>{saved.progress.grammar.includes(lesson.id)?'確認済みの印を外す':'分かった印をつける'}</button></article>
    </>}
    <footer className="ls-dialog-footer"><button onClick={close}><BookOpen size={17}/>リスニングのホームへ戻る</button></footer>
  </dialog>;
}
