import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { SubtopicsListEditor } from '../components/academics/lessons/SubtopicsListEditor';
import { SchemeOfWorkTopicModal } from '../components/academics/lessons/SchemeOfWorkTopicModal';

// Mock contexts
vi.mock('../contexts/AcademicContext', () => ({
  useAcademicContext: () => ({
    activeAcademicYear: { id: 'year-1', name: '2026 Academic Year' },
    activeTerm: { id: 'term-1', name: 'Term 1' },
    activeTermId: 'term-1',
    terms: [{ id: 'term-1', name: 'Term 1' }, { id: 'term-2', name: 'Term 2' }],
  }),
}));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'teacher-1',
      firstName: 'Baraka',
      lastName: 'Juma',
      role: 'TEACHER',
    },
  }),
}));

describe('Phase 11: Teacher Scheme of Work Frontend UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. SubtopicsListEditor Component', () => {
    it('renders empty subtopic state with Add Subtopic button', () => {
      const html = renderToString(
        <SubtopicsListEditor
          subtopics={[]}
          onChange={vi.fn()}
        />
      );

      expect(html).toContain('Subtopics List (Ordered)');
      expect(html).toContain('subtopic(s) defined');
      expect(html).toContain('Add Subtopic');
      expect(html).toContain('data-testid="add-subtopic-btn"');
    });

    it('renders 5 distinct numbered subtopics with controls', () => {
      const subtopics = [
        'States of matter & particle theory',
        'Physical and chemical properties',
        'Separation of mixtures techniques',
        'Pure substances vs solutions',
        'Practical laboratory purification',
      ];

      const html = renderToString(
        <SubtopicsListEditor
          subtopics={subtopics}
          onChange={vi.fn()}
        />
      );

      // Verify all 5 subtopic inputs rendered with exact indices
      expect(html).toContain('data-testid="subtopic-input-0"');
      expect(html).toContain('data-testid="subtopic-input-1"');
      expect(html).toContain('data-testid="subtopic-input-2"');
      expect(html).toContain('data-testid="subtopic-input-3"');
      expect(html).toContain('data-testid="subtopic-input-4"');

      // Verify subtopic texts are present
      expect(html).toContain('States of matter &amp; particle theory');
      expect(html).toContain('Physical and chemical properties');
      expect(html).toContain('Practical laboratory purification');

      // Verify reordering and remove buttons
      expect(html).toContain('data-testid="remove-subtopic-0"');
      expect(html).toContain('data-testid="move-up-subtopic-1"');
      expect(html).toContain('data-testid="move-down-subtopic-1"');
    });
  });

  describe('2. SchemeOfWorkTopicModal Component', () => {
    it('renders modal with Main Topic input, repeatable subtopics editor, and pedagogical planning fields', () => {
      const html = renderToString(
        <SchemeOfWorkTopicModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          className="Form 1A"
          subjectName="Chemistry"
        />
      );

      // Verify Modal Title & Context
      expect(html).toContain('Add Scheme of Work Topic');
      expect(html).toContain('Chemistry');
      expect(html).toContain('Form 1A');

      // Verify Main Topic title input
      expect(html).toContain('data-testid="main-topic-input"');
      expect(html).toContain('Main Topic');

      // Verify Estimated Periods
      expect(html).toContain('data-testid="topic-periods-input"');
      expect(html).toContain('Estimated Periods');

      // Verify Subtopics List Editor embedded
      expect(html).toContain('data-testid="add-subtopic-btn"');

      // Verify Pedagogical Planning Fields
      expect(html).toContain('data-testid="learning-objectives-input"');
      expect(html).toContain('Specific Objectives');
      expect(html).toContain('data-testid="learning-activities-input"');
      expect(html).toContain('Teaching &amp; Learning Activities');
      expect(html).toContain('data-testid="learning-resources-input"');
      expect(html).toContain('Teaching &amp; Learning Resources');
      expect(html).toContain('data-testid="assessment-methods-input"');
      expect(html).toContain('Assessment Methods');
      expect(html).toContain('data-testid="planned-start-input"');
      expect(html).toContain('data-testid="planned-end-input"');
      expect(html).toContain('data-testid="topic-remarks-input"');

      // Verify Save Button
      expect(html).toContain('data-testid="save-topic-btn"');
    });

    it('pre-populates fields when editing an existing topic with subtopics', () => {
      const existingTopic: any = {
        id: 'topic-1',
        title: 'Chemical Reactions and Catalysis',
        estimatedPeriods: 6,
        status: 'IN_PROGRESS',
        subTopics: [
          'Types of chemical reactions',
          'Collision theory and rate factors',
        ],
        learningObjectives: 'Differentiate between endothermic and exothermic reactions.',
        learningActivities: 'Students perform test-tube reactions with magnesium and acid.',
        learningResources: 'Magnesium ribbon, HCl, thermometers.',
        assessmentMethods: 'Laboratory worksheet assessment.',
        remarks: 'Handle concentrated acids under the fume cupboard.',
      };

      const html = renderToString(
        <SchemeOfWorkTopicModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          className="Form 1A"
          subjectName="Chemistry"
          initialData={existingTopic}
        />
      );

      expect(html).toContain('Edit Scheme of Work Topic');
      expect(html).toContain('value="Chemical Reactions and Catalysis"');
      expect(html).toContain('Types of chemical reactions');
      expect(html).toContain('Collision theory and rate factors');
      expect(html).toContain('Differentiate between endothermic and exothermic reactions.');
      expect(html).toContain('Handle concentrated acids under the fume cupboard.');
    });
  });
});
