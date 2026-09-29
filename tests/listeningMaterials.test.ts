import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { ListeningMaterials } from '../src/components/ListeningMaterials';
import { EL4_A_PROBLEMS, EL4_B_PROBLEMS, EL5_PROBLEMS, EL6_A_PROBLEMS, EL6_B_PROBLEMS } from '../src/data/englishListeningQ4to6Problems';
import q4 from '../src/data/listeningSets/listening-q4.json';
import q5 from '../src/data/listeningSets/listening-q5.json';
import q6 from '../src/data/listeningSets/listening-q6.json';
import { buildListeningSteps } from '../src/utils/listeningSteps';
import { useQuestionDerived } from '../src/hooks/useQuestionDerived';

const problems = [...EL4_A_PROBLEMS, ...EL4_B_PROBLEMS, ...EL5_PROBLEMS, ...EL6_A_PROBLEMS, ...EL6_B_PROBLEMS];

describe('later listening printed materials', () => {
  it.each(problems.map(p => [p.id, p] as const))('%s keeps readable materials on every shared audio step', (_, problem) => {
    const steps = buildListeningSteps(problem);
    expect(steps).toHaveLength(problem.audioTracks.length);
    for (const track of problem.audioTracks) {
      expect(track.material?.title).toBeTruthy();
      expect(track.subIds).toEqual(steps.find(s => s.subQuestionId === track.subId)?.subQuestionIds);
      expect(problem.readCount).toBe(1);
      expect(problem.playOnce).toBe(true);
      for (const image of track.material?.images || []) {
        expect(existsSync(`public${image.src}`), image.src).toBe(true);
        expect(image.minWidth).toBeGreaterThanOrEqual(360);
      }
      // Only explicitly projected printed fields may enter this renderer.
      expect(JSON.stringify(track.material)).not.toMatch(/"(?:answer|correctAnswer|script|explain|basis|whyWrong|match|evidence)":/);
      expect(JSON.stringify(track.material)).not.toContain(track.script);
    }
  });

  it('preserves all Q4 table cells and conditions from all 15 source sets', () => {
    q4.sets.forEach((source, i) => {
      const table = EL4_A_PROBLEMS[i].audioTracks[1].material!.table!;
      expect(table.headers).toEqual(source.partA.back.table.headers);
      expect(table.rows).toEqual(source.partA.back.table.rows.map(row => row.map(cell =>
        typeof cell === 'string' ? cell : `(${cell.blank})`)));
      expect(EL4_B_PROBLEMS[i].audioTracks[0].material!.sections![0].rows).toEqual(source.partB.conditionsEn);
    });
  });

  it('preserves every Q5 worksheet row without filling or removing shared blanks', () => {
    q5.sets.forEach((source, i) => {
      const material = EL5_PROBLEMS[i].audioTracks[0].material!;
      expect(material.title).toBe(source.worksheet.title);
      expect(material.sections![0].rows).toEqual([source.worksheet.lead.text]);
      expect(material.sections!.slice(1)).toEqual(source.worksheet.blocks.map(block => ({
        heading: block.heading,
        rows: block.rows.map(row => `${'label' in row ? row.label + ' ' : ''}${row.text}`),
      })));
      const html = renderToStaticMarkup(React.createElement(ListeningMaterials, { material, activeSubId: `q_el5_set${i+1}_30` }));
      expect(html.match(/data-material-blank=/g)).toHaveLength(5);
      expect(html.match(/aria-current="true"/g)).toHaveLength(1);
      expect(html).toContain('data-material-blank="30" aria-current="true"');
      expect(html).not.toContain('<img');
    });
  });

  it('shows Q6 memo names and all four graphs, not answer/explanation metadata', () => {
    q6.sets.forEach((source, i) => {
      const material = EL6_B_PROBLEMS[i].audioTracks[0].material!;
      expect(material.table!.rows).toEqual(source.partB.memoTable.rows.map(row => [row.who, row.note]));
      expect(material.images).toHaveLength(4);
      expect(material.images!.map(image => image.src)).toEqual(EL6_B_PROBLEMS[i].subQuestions[1].optionImages);
      const html = renderToStaticMarkup(React.createElement(ListeningMaterials, { material }));
      expect(html.match(/<img /g)).toHaveLength(4);
      expect(html).not.toContain(source.partB.q37.basis.utterance);
    });
  });

  it('opts in only when the active audio step has printed materials', () => {
    function Probe({ problem, desktop = false, expanded = false }: any) {
      const result = useQuestionDerived({ currentQuestion: problem, perStep: true,
        activeStepSub: problem.subQuestions[0], activeStepSubs: problem.subQuestions,
        focusedSubId: null, highlights: [], isDesktop: desktop, isProblemExpanded: expanded,
        isProblemCollapsed: false, keyboardVisible: false, mobileAnsIdx: 0 });
      return React.createElement('span', null, String(result.listeningMaterialsMobile));
    }
    const problem = EL5_PROBLEMS[0];
    const render = (props: any) => renderToStaticMarkup(React.createElement(Probe, props));
    expect(render({ problem })).toContain('true');
    expect(render({ problem, desktop: true })).toContain('false');
    expect(render({ problem, expanded: true })).toContain('false');
    expect(render({ problem: { ...problem, audioTracks: problem.audioTracks.map(({ material, ...track }) => track) } })).toContain('false');
  });
});
