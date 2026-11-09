import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LessonPlanModal } from '../components/academics/lessons/LessonPlanModal';

describe('Tanzanian Standard (TIE) LessonPlanModal Component', () => {
  it('renders official Tanzanian 5-stage competency-based lesson plan layout', () => {
    const mockClasses = [
      { id: 'cls-1', name: 'Form 2 A' },
      { id: 'cls-2', name: 'Form 2 B' },
    ];
    const mockSubjects = [
      { id: 'sub-1', name: 'Basic Mathematics', code: 'MATH' },
      { id: 'sub-2', name: 'Physics', code: 'PHYS' },
    ];

    const html = renderToString(
      <LessonPlanModal
        isOpen={true}
        onClose={vi.fn()}
        classes={mockClasses}
        subjects={mockSubjects}
        defaultClassId="cls-1"
        defaultSubjectId="sub-1"
      />
    );

    // Title & pedagogical banner
    expect(html).toContain('Tanzanian Competency-Based Lesson Plan');
    expect(html).toContain('Official TIE Standard Pedagogical Preparation');
    expect(html).toContain('Competency-Based');

    // Section 1: Lesson Administration
    expect(html).toContain('1. Lesson Administration &amp; Schedule');
    expect(html).toContain('Form 2 A');
    expect(html).toContain('Basic Mathematics');

    // Section 2: Competence & Objectives
    expect(html).toContain('2. Competence &amp; Scheme of Work Topic Linkage');
    expect(html).toContain('Main Topic (Mada Kuu)');
    expect(html).toContain('Sub-Topic (Mada Ndogo)');
    expect(html).toContain('Main Competence (Umahiri)');
    expect(html).toContain('General Objective (Kusudi Kuu la Somo)');
    expect(html).toContain('Specific Objectives (Madhumuni Mahususi)');

    // Section 3: Teaching Aids & Methodology
    expect(html).toContain('3. Pedagogical Resources &amp; Methodology');
    expect(html).toContain('Teaching &amp; Learning Aids (Zana)');
    expect(html).toContain('Teaching Techniques (Mbinu)');
    expect(html).toContain('References (Marejeleo ya Vitabu)');

    // Section 4: 5 Pedagogical Steps (Tanzanian Competency standard)
    expect(html).toContain('4. Lesson Development Stages (Hatua 5 za Ufundishaji)');
    expect(html).toContain('1. Introduction (Utangulizi)');
    expect(html).toContain('2. Development of New Knowledge (Kukuza Maarifa Mapya)');
    expect(html).toContain('3. Reinforcement &amp; Application (Kutilia Mkazo / Matendo)');
    expect(html).toContain('4. Reflection &amp; Assessment (Tathmini ya Mwanafunzi)');
    expect(html).toContain('5. Conclusion &amp; Homework (Hitimisho)');

    // Section 5: Post-lesson evaluations
    expect(html).toContain('5. Post-Lesson Evaluation &amp; Remarks (Tathmini ya Somo)');
    expect(html).toContain('Students Evaluation (Tathmini ya Wanafunzi)');
    expect(html).toContain('Teacher Self-Evaluation (Tathmini ya Mwalimu)');

    // Action button
    expect(html).toContain('Save Lesson Plan');
  });
});
