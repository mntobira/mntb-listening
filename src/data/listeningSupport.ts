export interface WordQuestion { id:string; prompt:string; label:string; options:string[]; answerIndex:number }
export interface ListeningExample { chapterId:string; chapterTitle:string; problemId:string; problemIndex:number; script:string; audioUrl:string; translation:string }
export interface ListeningWord { id:string; word:string; meaning:string; fullMeaning:string; level:string; chapterIds:string[]; examples:ListeningExample[]; questions:WordQuestion[] }
export interface VocabularyData { wordCount:number; questionCount:number; unitSize:number; chapters:{id:string;title:string}[]; words:ListeningWord[] }
export const VOCAB_LEVELS: Record<string,string> = {lv1:'単語・共通テスト6割〜',lv2:'単語・共通テスト8割〜',lv3:'単語・2次試験レベル',lv4:'単語・2次試験の追加語彙',ilv1:'熟語・共通テスト6割〜',ilv2:'熟語・共通テスト8割〜',ilv3:'熟語・2次試験レベル'};
export interface SupportProgress { version:1; words:string[]; grammar:string[] }
export const supportStorageKey=(uid:string)=>'listening_support_v1_'+encodeURIComponent(uid||'guest');
export function parseSupportProgress(raw:string|null):SupportProgress {
  if(raw===null)return {version:1,words:[],grammar:[]};
  const p=JSON.parse(raw);
  if(!p||p.version!==1||!Array.isArray(p.words)||!Array.isArray(p.grammar)||![...p.words,...p.grammar].every(x=>typeof x==='string'))throw new Error('保存記録を読み込めません。元の記録は上書きせず保護しています。');
  return {version:1,words:[...new Set<string>(p.words)],grammar:[...new Set<string>(p.grammar)]};
}
export function filterVocabulary(words:readonly ListeningWord[],query:string,level:string,chapter:string,unlearned:boolean,known:readonly string[]):ListeningWord[] {
  const needle=query.normalize('NFKC').toLowerCase().trim();const seen=new Set(known);
  return words.filter(w=>(!level||w.level===level)&&(!chapter||w.chapterIds.includes(chapter))&&(!unlearned||!seen.has(w.id))&&(!needle||(w.word+' '+w.fullMeaning).normalize('NFKC').toLowerCase().includes(needle)));
}
export interface GrammarLesson { id:string; title:string; point:string; example:string; translation:string; tip:string; question:string; options:string[]; answer:number; explanation:string }
export const LISTENING_GRAMMAR:readonly GrammarLesson[]=[
 {id:'subject',title:'誰が・どうする',point:'まず主語と動詞をつかむ。長い説明はその後。',example:'My brother works at a library.',translation:'私の兄（弟）は図書館で働いています。',tip:'My brother が誰、works が何をするか。',question:'働いているのは？',options:['話し手の兄弟','話し手本人','図書館の利用者'],answer:0,explanation:'My brother が主語です。at a library は場所を説明します。'},
 {id:'negative',title:'否定を落とさない',point:'not が入ると意味が反対になる。短縮形にも注意。',example:'I do not need a ticket.',translation:'私にはチケットは必要ありません。',tip:'need だけで判断せず do not / don’t まで聞く。',question:'チケットは必要？',options:['必要である','必要ではない','必要か尋ねている'],answer:1,explanation:'do not need は「必要ではない」。I が主語の説明文です。'},
 {id:'tense',title:'過去とこれから',point:'時を表す言葉と動詞の形をセットにする。',example:'We will visit the museum tomorrow.',translation:'私たちは明日その博物館を訪れます。',tip:'will と tomorrow がこれからの予定を示す。',question:'博物館を訪れるのは？',options:['昨日','今日の朝','明日'],answer:2,explanation:'tomorrow は「明日」。will visit はこれから訪れるという内容です。'},
 {id:'question',title:'何を聞かれている？',point:'when / where / why / how を最初に見分ける。',example:'Where will they meet?',translation:'彼らはどこで会いますか。',tip:'where なら場所。時刻や理由を選ばない。',question:'答えに必要なのは？',options:['待ち合わせの場所','会う理由','待ち合わせの時刻'],answer:0,explanation:'Where は場所。When は時、Why は理由を尋ねます。'},
 {id:'request',title:'丁寧なお願い',point:'Could you ...? は依頼を表すことが多い。',example:'Could you open the window?',translation:'窓を開けていただけますか。',tip:'相手にしてほしい行動をつかむ。',question:'話し手が頼んでいるのは？',options:['窓を閉める','窓を開ける','窓を買う'],answer:1,explanation:'open the window が頼まれている行動です。'},
 {id:'comparison',title:'比較の順番',point:'A is ... than B はAをBと比べている。',example:'The train is faster than the bus.',translation:'電車はバスより速いです。',tip:'faster / cheaper の比較相手まで聞く。',question:'より速いのは？',options:['同じ速さ','バス','電車'],answer:2,explanation:'The train が主語、than the bus が比較相手です。'},
 {id:'condition',title:'条件と結果',point:'if は条件。その場合の行動まで聞く。',example:'If it rains, we will stay home.',translation:'雨が降ったら、私たちは家にいます。',tip:'雨が必ず降ると断定しているのではない。',question:'雨が降った場合は？',options:['家にいる','外出する','雨がやむと断定'],answer:0,explanation:'If it rains が条件、we will stay home がその場合の行動です。'},
 {id:'reason',title:'理由をつなぐ',point:'because の後に理由が来る。結果と区別する。',example:'I stayed home because I was tired.',translation:'疲れていたので、私は家にいました。',tip:'何をしたかと、なぜしたかを分けて聞く。',question:'家にいた理由は？',options:['雨が降ったから','疲れていたから','電車が遅れたから'],answer:1,explanation:'because I was tired が理由。本文にない雨や電車は選びません。'},
];
