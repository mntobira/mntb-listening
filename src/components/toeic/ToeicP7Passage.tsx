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
 */
import { Fragment, useState } from 'react';
import { parseChatLine, splitP7Paragraph, TOEIC_P7_KIND_LABEL, type ToeicP7Doc, type ToeicP7Set } from '../../data/toeic/toeicPart7Kit';
import { formatText } from '../../utils/textFormatter';

function Paragraph({ text }: { text: string }) {
  return (
    <p lang="en">
      {splitP7Paragraph(text).map((piece, j) => piece.mark != null
        ? <span key={j} className="tp7-insert" data-toeic-insert={piece.mark} aria-label={`位置${piece.mark}`}>[{piece.mark}]</span>
        : <span key={j}>{formatText(piece.text || '', [], { prose: true, noMath: true })}</span>)}
    </p>
  );
}

function Chat({ lines }: { lines: string[] }) {
  // 最初に話した人を左、それ以外を右に寄せる（誰の発言か目で追いやすくする）
  const first = parseChatLine(lines[0] || '').name;
  return (
    <ol className="tp7-chat" data-toeic-chat>
      {lines.map((line, i) => {
        const m = parseChatLine(line);
        return (
          <li key={i} className="tp7-bubble" data-side={m.name && m.name !== first ? 'right' : 'left'}>
            <p className="tp7-bubble-who"><b lang="en">{m.name}</b><span lang="en">{m.time}</span></p>
            <Paragraph text={m.text} />
          </li>
        );
      })}
    </ol>
  );
}

function Doc({ doc, no, total }: { doc: ToeicP7Doc; no: number; total: number }) {
  const [head, ...rows] = doc.table || [];
  return (
    <section className="tp-doc tp7-doc" aria-label={`文書${no}（${doc.genre}）`} data-toeic-doc={no}>
      <p className="tp-doc-head">
        <span className="tp-doc-genre">{doc.genre}</span>
        {total > 1 && <span>文書{no}</span>}
      </p>
      {doc.title && <h3 className="tp-doc-title" lang="en">{doc.title}</h3>}
      {doc.head && doc.head.length > 0 && (
        <dl className="tp7-head" lang="en">
          {doc.head.map(([k, v], i) => (
            <div key={i}><dt>{k}:</dt><dd>{v}</dd></div>
          ))}
        </dl>
      )}
      {doc.chat ? <Chat lines={doc.p} /> : doc.p.map((para, i) => <Fragment key={i}><Paragraph text={para} /></Fragment>)}
      {head && (
        <div className="tp7-table-wrap">
          <table className="tp7-table" lang="en">
            <thead><tr>{head.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr></thead>
            <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function ToeicP7Passage({ set, setIndex, offset }: { set: ToeicP7Set; setIndex: number; offset: number }) {
  const [tab, setTab] = useState(0);
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
              className="tp7-tab" data-toeic-doc-tab={i + 1} onClick={() => setTab(i)}>
              <b>文書{i + 1}</b><small>{d.genre}</small>
            </button>
          ))}
        </div>
      )}
      {set.docs.map((d, i) => (
        <div key={i} id={`tp7-panel-${i}`} role={multi ? 'tabpanel' : undefined} aria-labelledby={multi ? `tp7-tab-${i}` : undefined}
          className="tp7-panel" data-active={!multi || i === active || undefined}>
          <Doc doc={d} no={i + 1} total={set.docs.length} />
        </div>
      ))}
    </div>
  );
}
