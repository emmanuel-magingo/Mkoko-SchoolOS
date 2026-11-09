import React, { useState } from 'react';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import { AcademicMeeting, MeetingType } from '../../../types/academics.types';
import { MeetingDetails } from './MeetingDetails';
import {
  Users2,
  Calendar,
  MapPin,
  User,
  Plus,
  ListTodo,
  X,
  Search,
} from 'lucide-react';

export interface AcademicMeetingsProps {
  initialMeetings?: AcademicMeeting[];
}

export const AcademicMeetings: React.FC<AcademicMeetingsProps> = ({ initialMeetings }) => {
  useAcademicContext();

  const [meetings, setMeetings] = useState<AcademicMeeting[]>(
    initialMeetings || [
      {
        id: 'mtg-1',
        title: 'Term 1 Examination Board & Results Moderation',
        meetingType: 'EXAMINATION_BOARD',
        date: '2026-10-22',
        time: '09:00 AM',
        venue: 'Main Academic Conference Hall',
        chairId: 'tch-head',
        chairName: 'Dr. Joseph Malecela (Head of School)',
        agenda: 'Review locked marks for Form 4 and Form 2 national mock exams; approve canonical grading scale and division distributions.',
        minutes: 'All heads of department presented their moderation summaries. Mathematics and physics showed strong CA alignment.',
        decisions: [
          'Approved NECTA canonical grading policy for all secondary streams.',
          'Authorized release of draft report cards for internal moderation.',
        ],
        attendees: ['Dr. Malecela', 'Mr. Mrema', 'Ms. Lyimo', 'Mrs. Said', 'Academic Master'],
        status: 'COMPLETED',
        actionItems: [
          {
            id: 'act-1',
            meetingId: 'mtg-1',
            task: 'Compile list of students requiring mathematics remedial tutoring',
            assignedToId: 'tch-1',
            assignedToName: 'Mr. David Mrema',
            dueDate: '2026-10-25',
            status: 'COMPLETED',
          },
          {
            id: 'act-2',
            meetingId: 'mtg-1',
            task: 'Prepare laboratory experiment requisitions for chemistry titration exams',
            assignedToId: 'tch-2',
            assignedToName: 'Ms. Clara Lyimo',
            dueDate: '2026-11-05',
            status: 'PENDING',
          },
        ],
      },
      {
        id: 'mtg-2',
        title: 'Science & Mathematics Departmental Coordination',
        meetingType: 'DEPARTMENTAL',
        date: '2026-11-04',
        time: '02:00 PM',
        venue: 'Science Laboratory Complex (Room 3)',
        chairId: 'tch-1',
        chairName: 'Mr. David Mrema (Head of Science)',
        agenda: 'Review syllabus coverage for kinematics, organic chemistry, and cellular genetics. Schedule inter-class science exhibition.',
        status: 'SCHEDULED',
        actionItems: [
          {
            id: 'act-3',
            meetingId: 'mtg-2',
            task: 'Submit laboratory apparatus checklist',
            assignedToId: 'tch-2',
            assignedToName: 'Ms. Clara Lyimo',
            dueDate: '2026-11-01',
            status: 'PENDING',
          },
        ],
      },
      {
        id: 'mtg-3',
        title: 'Curriculum Review & Scheme of Work Audit',
        meetingType: 'CURRICULUM_REVIEW',
        date: '2026-11-18',
        time: '11:00 AM',
        venue: 'Academic Resource Library',
        chairId: 'tch-acad',
        chairName: 'Mrs. Salma Kigoma (Academic Master)',
        agenda: 'Evaluate teacher lesson execution against approved schemes of work. Analyze missed lesson recovery plans.',
        status: 'SCHEDULED',
      },
    ]
  );

  const [selectedMeeting, setSelectedMeeting] = useState<AcademicMeeting | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Meeting Form
  const [formData, setFormData] = useState({
    title: '',
    meetingType: 'DEPARTMENTAL' as MeetingType,
    date: '',
    time: '10:00 AM',
    venue: 'Academic Conference Hall',
    chairName: 'Academic Master',
    agenda: '',
  });

  const handleCreateMeeting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.agenda) return;

    const newMeeting: AcademicMeeting = {
      id: `mtg-${Date.now()}`,
      title: formData.title,
      meetingType: formData.meetingType,
      date: formData.date,
      time: formData.time,
      venue: formData.venue,
      chairName: formData.chairName,
      agenda: formData.agenda,
      status: 'SCHEDULED',
      actionItems: [],
      createdAt: new Date().toISOString(),
    };

    setMeetings([newMeeting, ...meetings]);
    setIsModalOpen(false);
    setFormData({
      title: '',
      meetingType: 'DEPARTMENTAL',
      date: '',
      time: '10:00 AM',
      venue: 'Academic Conference Hall',
      chairName: 'Academic Master',
      agenda: '',
    });
  };

  const handleUpdateMeeting = (updated: AcademicMeeting) => {
    setMeetings((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setSelectedMeeting(updated);
  };

  const filteredMeetings = meetings.filter((m) => {
    if (typeFilter !== 'ALL' && m.meetingType !== typeFilter) return false;
    if (statusFilter !== 'ALL' && m.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchAgenda = m.agenda.toLowerCase().includes(q);
      const matchChair = m.chairName.toLowerCase().includes(q);
      if (!matchTitle && !matchAgenda && !matchChair) return false;
    }
    return true;
  });

  if (selectedMeeting) {
    return (
      <MeetingDetails
        meeting={selectedMeeting}
        onBack={() => setSelectedMeeting(null)}
        onUpdateMeeting={handleUpdateMeeting}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Academic Governance &amp; Meetings</h1>
              <p className="text-xs text-slate-500">
                Departmental assemblies, examination boards, curriculum moderation, and action item tracking.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            id="schedule-meeting-btn"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Schedule Meeting
          </button>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search meetings by title or chair..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Meeting Types</option>
              <option value="EXAMINATION_BOARD">Examination Board</option>
              <option value="DEPARTMENTAL">Departmental Coordination</option>
              <option value="CURRICULUM_REVIEW">Curriculum Review</option>
              <option value="STAFF_BRIEFING">Staff Briefing</option>
              <option value="PARENT_CONSULTATION">Parent Consultation</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Meeting Cards List */}
      <div className="space-y-3.5">
        {filteredMeetings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-xs">
            <Users2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-600">No academic meetings match your criteria.</p>
            <p className="mt-1">Schedule a meeting to collaborate on curriculum and student outcomes.</p>
          </div>
        ) : (
          filteredMeetings.map((mtg) => {
            const completedCount = (mtg.actionItems || []).filter((a) => a.status === 'COMPLETED').length;
            const totalActions = mtg.actionItems?.length || 0;

            return (
              <div
                key={mtg.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {mtg.meetingType}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        mtg.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {mtg.status}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {mtg.date} • {mtg.time || '10:00 AM'}
                  </span>
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">{mtg.title}</h2>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                    {mtg.agenda}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-2 border-t border-slate-100 gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4 text-slate-500">
                    <span className="flex items-center gap-1.5 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-indigo-600" />
                      Chair: {mtg.chairName}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {mtg.venue}
                    </span>
                    {totalActions > 0 && (
                      <span className="flex items-center gap-1.5 font-semibold text-indigo-700">
                        <ListTodo className="w-3.5 h-3.5" />
                        {completedCount}/{totalActions} Action Items Done
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedMeeting(mtg)}
                    id={`view-meeting-${mtg.id}`}
                    className="inline-flex items-center justify-center px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    View Details &amp; Minutes
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Meeting Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Schedule Academic Meeting</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. End of Term Moderation Assembly"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meeting Type</label>
                  <select
                    value={formData.meetingType}
                    onChange={(e) =>
                      setFormData({ ...formData, meetingType: e.target.value as MeetingType })
                    }
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="DEPARTMENTAL">Departmental</option>
                    <option value="EXAMINATION_BOARD">Examination Board</option>
                    <option value="CURRICULUM_REVIEW">Curriculum Review</option>
                    <option value="STAFF_BRIEFING">Staff Briefing</option>
                    <option value="PARENT_CONSULTATION">Parent Consultation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Venue</label>
                  <input
                    type="text"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Meeting Chair</label>
                  <input
                    type="text"
                    value={formData.chairName}
                    onChange={(e) => setFormData({ ...formData, chairName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Agenda &amp; Objectives *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Outline topics for discussion, decision criteria, and presentation schedule..."
                  value={formData.agenda}
                  onChange={(e) => setFormData({ ...formData, agenda: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-meeting-btn"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  Schedule Meeting
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
