/**
 * TOEIC Part 7：ページの上（PCでは左）に出す文書（2026-11-02）
 *
 * 1セット＝文書1〜3つ。
 *   ・スマホ：文書が2つ以上なら上にタブ（文書1／文書2／文書3。高さ44px以上）を出し、1つずつ見せる
 *   ・PC（1024px以上）：タブは出さず、文書を縦に全部並べる（左の列の中でスクロール）
 * 文書の中身
 *   ・見出しの行（To / From / Date など）は2列の表
 *   ・文挿入の位置 [[n]] は —[n]— の札
 *   ・チャット・テキストメッセージは吹き出し（名前・時刻・本文）
 *   ・注文書・予定表などは表
 * Part 6 の .tp-doc の見た目を引き継ぎ、Part 7 だけのクラス（.tp7-…）を足す。
 *
 * 2026-11-03：採点後に「文書で根拠を見る」を押すと、根拠の英文に黄色いマーカーを引く（evidence）。
 *   段落・吹き出しの中は該当の語句だけ、見出しの行・表は行ごと。根拠のある文書のタブには「根拠」の印。
 *   タブの選択は親（ToeicPageQuiz）が持つ（根拠のある文書へ自動で切り替えるため）。
 */
import { Fragment, type ReactNode } from 'react';
import { parseChatLine, splitP7Paragraph, TOEIC_P7_KIND_LABEL, type ToeicP7Doc, type ToeicP7Set } from '../../data/toeic/toeicPart7Kit';
import { formatText } from '../../utils/textFormatter';

const fmt = (t: string) => formatText(t, [], { prose: true, noMath: true });
const hits = (text: string, evs: readonly string[]) => evs.some((e) => e && text.includes(e));

/** 文の中の根拠の語句にマーカーを引く（重ならないよう、前から順に） */
function withEvidence(text: string, evs: readonly string[]): ReactNode {
  const list = evs.filter(Boolean);
  if (list.length === 0) return fmt(text);
  const out: ReactNode[] = [];
  let rest = text;
  let k = 0;
  for (;;) {
    let at = -1;
    let hit = '';
    for (const e of list) {
      const i = rest.indexOf(e);
      if (i >= 0 && (at < 0 || i < at)) { at = i; hit = e; }
    }
    if (at < 0) break;
    if (at > 0) out.push(<Fragment key={k++}>{fmt(rest.slice(0, at))}</Fragment>);
    out.push(<mark key={k++} className="tp7-ev" data-toeic-ev>{fmt(hit)}</mark>);
    rest = rest.slice(at + hit.length);
  }
  if (rest) out.push(<Fragment key={k++}>{fmt(rest)}</Fragment>);
  return out;
}

function Paragraph({ text, evs }: { text: string; evs: readonly string[] }) {
  return (
    <p lang="en">
      {splitP7Paragraph(text).map((piece, j) => piece.mark != null
        ? <span key={j} className="tp7-insert" data-toeic-insert={piece.mark} aria-label={`位置${piece.mark}`}>[{piece.mark}]</span>
        : <span key={j}>{withEvidence(piece.text || '', evs)}</span>)}
    </p>
  );
}

function Chat({ lines, evs }: { lines: string[]; evs: readonly string[] }) {
  // 最初に話した人を左、それ以外を右に寄せる（誰の発言か目で追いやすくする）
  const first = parseChatLine(lines[0] || '').name;
  return (
    <ol className="tp7-chat" data-toeic-chat>
      {lines.map((line, i) => {
        const m = parseChatLine(line);
        // 根拠が「名前（時刻）: 発言」の形で書かれているときは、吹き出しごと印を付ける
        const whole = hits(line, evs) && !hits(m.text, evs);
        return (
          <li key={i} className="tp7-bubble" data-side={m.name && m.name !== first ? 'right' : 'left'}
            data-ev={whole || undefined} data-toeic-ev={whole || undefined}>
            <p className="tp7-bubble-who"><b lang="en">{m.name}</b><span lang="en">{m.time}</span></p>
            <Paragraph text={m.text} evs={whole ? [] : evs} />
          </li>
        );
      })}
    </ol>
  );
}

function Doc({ doc, no, total, evs }: { doc: ToeicP7Doc; no: number; total: number; evs: readonly string[] }) {
  const [head, ...rows] = doc.table || [];
  return (
    <section className="tp-doc tp7-doc" aria-label={`文書${no}（${doc.genre}）`} data-toeic-doc={no}>
      <p className="tp-doc-head">
        <span className="tp-doc-genre">{doc.genre}</span>
        {total > 1 && <span>文書{no}</span>}
      </p>
      {doc.title && <h3 className="tp-doc-title" lang="en">{withEvidence(doc.title, evs)}</h3>}
      {doc.head && doc.head.length > 0 && (
        <dl className="tp7-head" lang="en">
          {doc.head.map(([k, v], i) => {
            const on = hits(`${k}: ${v}`, evs) || hits(v, evs);
            return <div key={i} data-ev={on || undefined} data-toeic-ev={on || undefined}><dt>{k}:</dt><dd>{v}</dd></div>;
          })}
        </dl>
      )}
      {doc.chat ? <Chat lines={doc.p} evs={evs} /> : doc.p.map((para, i) => <Fragment key={i}><Paragraph text={para} evs={evs} /></Fragment>)}
      {head && (
        <div className="tp7-table-wrap">
          <table className="tp7-table" lang="en">
            <thead><tr>{head.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => {
              const on = hits(r.join(' '), evs) || r.some((c) => hits(c, evs));
              return <tr key={i} data-ev={on || undefined} data-toeic-ev={on || undefined}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const NONE: readonly string[] = [];

export function ToeicP7Passage({ set, setIndex, offset, tab, onTab, evidence }: {
  set: ToeicP7Set; setIndex: number; offset: number;
  /** 表示中の文書（0から）。スマホのタブで使う */
  tab: number; onTab: (i: number) => void;
  /** 根拠の英文（文書の番号0から → 英文）。採点後に「文書で根拠を見る」を押したときだけ */
  evidence?: Readonly<Record<number, readonly string[]>> | null;
}) {
  const multi = set.docs.length > 1;
  const active = Math.min(tab, set.docs.length - 1);
  return (
    <div className="tp7-docs" data-toeic-p7-docs data-kind={set.kind}>
      <p className="tp7-set-head">
        <span className="tp7-set-kind">{TOEIC_P7_KIND_LABEL[set.kind]}</span>
        <span>セット{setIndex + 1}・問{offset + 1}〜{offset + set.q.length}</span>
      </p>
      {multi && (
        <div className="tp7-tabs" role="tablist" aria-label="文書の切り替え">
          {set.docs.map((d, i) => (
            <button key={i} type="button" role="tab" id={`tp7-tab-${i}`} aria-selected={i === active} aria-controls={`tp7-panel-${i}`}
              className="tp7-tab" data-toeic-doc-tab={i + 1} onClick={() => onTab(i)}>
              <b>文書{i + 1}{evidence?.[i]?.length ? <em className="tp7-tab-ev" data-toeic-tab-ev>根拠</em> : null}</b><small>{d.genre}</small>
            </button>
          ))}
        </div>
      )}
      {set.docs.map((d, i) => (
        <div key={i} id={`tp7-panel-${i}`} role={multi ? 'tabpanel' : undefined} aria-labelledby={multi ? `tp7-tab-${i}` : undefined}
          className="tp7-panel" data-active={!multi || i === active || undefined}>
          <Doc doc={d} no={i + 1} total={set.docs.length} evs={evidence?.[i] ?? NONE} />
        </div>
      ))}
    </div>
  );
}
