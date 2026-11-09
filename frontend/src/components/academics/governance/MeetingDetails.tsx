import React, { useState } from 'react';
import { useAcademicContext } from '../../../contexts/AcademicContext';
import {
  AcademicMeeting,
  MeetingActionItem,
  ActionItemStatus,
} from '../../../types/academics.types';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  CheckCircle2,
  FileText,
  ListTodo,
  Plus,
  Save,
  CheckSquare,
  Square,
} from 'lucide-react';

export interface MeetingDetailsProps {
  meeting: AcademicMeeting;
  onBack: () => void;
  onUpdateMeeting?: (updated: AcademicMeeting) => void;
}

export const MeetingDetails: React.FC<MeetingDetailsProps> = ({
  meeting: initialMeeting,
  onBack,
  onUpdateMeeting,
}) => {
  useAcademicContext();

  const [meeting, setMeeting] = useState<AcademicMeeting>(initialMeeting);
  const [minutesText, setMinutesText] = useState(
    meeting.minutes ||
      'Meeting convened at 10:00 AM. Discussed Form 4 examination readiness and finalized science laboratory materials quota.'
  );
  const [decisions, setDecisions] = useState<string[]>(
    meeting.decisions || [
      'Approved mandatory Saturday remedial sessions for mathematics candidates scoring below 40%.',
      'Class teachers to submit updated attendance registers every Friday by 3:00 PM.',
    ]
  );
  const [newDecision, setNewDecision] = useState('');

  // Action items
  const [actionItems, setActionItems] = useState<MeetingActionItem[]>(
    meeting.actionItems || [
      {
        id: 'act-1',
        meetingId: meeting.id,
        task: 'Compile list of students requiring mathematics remedial tutoring',
        assignedToId: 'tch-1',
        assignedToName: 'Mr. David Mrema',
        dueDate: '2026-10-25',
        status: 'COMPLETED',
        completedAt: '2026-10-20',
      },
      {
        id: 'act-2',
        meetingId: meeting.id,
        task: 'Prepare laboratory experiment requisitions for chemistry titration exams',
        assignedToId: 'tch-2',
        assignedToName: 'Ms. Clara Lyimo',
        dueDate: '2026-11-05',
        status: 'PENDING',
      },
      {
        id: 'act-3',
        meetingId: meeting.id,
        task: 'Schedule parent-teacher conference for chronic absenteeism candidates',
        assignedToId: 'tch-3',
        assignedToName: 'Mrs. Fatma Said',
        dueDate: '2026-10-15',
        status: 'OVERDUE',
      },
    ]
  );

  // New action item state
  const [newTask, setNewTask] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleToggleActionStatus = (actionId: string) => {
    setActionItems((prev) =>
      prev.map((item) => {
        if (item.id === actionId) {
          const nextStatus: ActionItemStatus =
            item.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
          return {
            ...item,
            status: nextStatus,
            completedAt: nextStatus === 'COMPLETED' ? new Date().toISOString() : undefined,
          };
        }
        return item;
      })
    );
  };

  const handleAddActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !newAssignee.trim()) return;

    const newItem: MeetingActionItem = {
      id: `act-${Date.now()}`,
      meetingId: meeting.id,
      task: newTask.trim(),
      assignedToId: `tch-${Date.now()}`,
      assignedToName: newAssignee.trim(),
      dueDate: newDueDate || '2026-11-15',
      status: 'PENDING',
    };

    setActionItems((prev) => [newItem, ...prev]);
    setNewTask('');
    setNewAssignee('');
    setNewDueDate('');
  };

  const handleAddDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDecision.trim()) return;
    setDecisions((prev) => [...prev, newDecision.trim()]);
    setNewDecision('');
  };

  const handleSaveMinutes = () => {
    const updated: AcademicMeeting = {
      ...meeting,
      minutes: minutesText,
      decisions,
      actionItems,
      status: 'COMPLETED',
    };
    setMeeting(updated);
    if (onUpdateMeeting) onUpdateMeeting(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          id="back-to-meetings-btn"
          className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5 text-slate-500" />
          Back to Meetings
        </button>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          <button
            onClick={handleSaveMinutes}
            id="save-meeting-details-btn"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            <Save className="w-3.5 h-3.5 mr-1.5" />
            Save Minutes &amp; Actions
          </button>
        </div>
      </div>

      {/* Meeting Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {meeting.meetingType}
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  meeting.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {meeting.status}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">{meeting.title}</h1>
          </div>
        </div>

        {/* Meeting Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Date</span>
              <span className="font-bold text-slate-800">{meeting.date}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Venue</span>
              <span className="font-bold text-slate-800">{meeting.venue}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <User className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Meeting Chair</span>
              <span className="font-bold text-slate-800">{meeting.chairName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Users className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Attendees</span>
              <span className="font-bold text-slate-800">
                {meeting.attendees?.length || 8} Staff Members
              </span>
            </div>
          </div>
        </div>

        {/* Agenda */}
        <div>
          <span className="text-xs font-bold text-slate-700 block mb-1">Official Agenda:</span>
          <p className="text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-200 leading-relaxed">
            {meeting.agenda}
          </p>
        </div>
      </div>

      {/* Minutes & Key Decisions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Minutes of the Meeting */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              Official Minutes
            </h2>
            <span className="text-[11px] text-slate-400">Formal Records</span>
          </div>
          <textarea
            rows={8}
            value={minutesText}
            onChange={(e) => setMinutesText(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 p-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed text-slate-800 font-sans"
            placeholder="Record deliberations, issues raised, and discussion summary..."
          />
        </div>

        {/* Key Decisions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Key Decisions Adopted
            </h2>
            <span className="text-[11px] text-slate-400">{decisions.length} Decisions</span>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {decisions.map((dec, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 flex items-start gap-2"
              >
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                  {idx + 1}
                </span>
                <span className="mt-0.5">{dec}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddDecision} className="flex gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="Record a new committee decision..."
              value={newDecision}
              onChange={(e) => setNewDecision(e.target.value)}
              className="flex-1 text-xs rounded-xl border border-slate-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Add
            </button>
          </form>
        </div>
      </div>

      {/* Action Items Tracker Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-indigo-600" />
              Action Items Tracker
            </h2>
            <p className="text-xs text-slate-500">
              Accountability matrix: Assign follow-up tasks to staff with strict deadlines.
            </p>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            {actionItems.filter((a) => a.status === 'COMPLETED').length} of {actionItems.length} Completed
          </span>
        </div>

        {/* Action Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <th className="py-2.5 px-3 w-10 text-center">Done</th>
                <th className="py-2.5 px-3">Action Task</th>
                <th className="py-2.5 px-3">Assigned Staff</th>
                <th className="py-2.5 px-3">Due Date</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {actionItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggleActionStatus(item.id)}
                      className="text-slate-400 hover:text-indigo-600 transition"
                      aria-label="Toggle task completion"
                    >
                      {item.status === 'COMPLETED' ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    <span
                      className={
                        item.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'
                      }
                    >
                      {item.task}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.assignedToName}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    <div className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.dueDate}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add New Action Item Form */}
        <form
          onSubmit={handleAddActionItem}
          className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2.5 text-xs"
        >
          <input
            type="text"
            required
            placeholder="Describe new actionable follow-up task..."
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            className="flex-1 w-full text-xs rounded-xl border border-slate-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <input
            type="text"
            required
            placeholder="Assign to (e.g. Mr. Mrema)..."
            value={newAssignee}
            onChange={(e) => setNewAssignee(e.target.value)}
            className="w-full sm:w-48 text-xs rounded-xl border border-slate-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            className="w-full sm:w-36 text-xs rounded-xl border border-slate-300 py-1.5 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          <button
            type="submit"
            id="add-action-item-btn"
            className="w-full sm:w-auto inline-flex items-center justify-center px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Action Item
          </button>
        </form>
      </div>
    </div>
  );
};
