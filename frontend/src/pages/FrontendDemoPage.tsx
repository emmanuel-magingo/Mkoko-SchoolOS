import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FinanceDemo } from './finance/FinanceDemo';
import { financeTotals, initialDemoFinance } from './finance/demoFinanceModel';
import type { DemoStudent } from './finance/demoFinanceModel';
import {
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  BookOpenCheck,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Megaphone,
  School,
  Settings,
  UserPlus,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react';

type DemoSection =
  | 'Overview'
  | 'Students'
  | 'Academics'
  | 'Classes & Streams'
  | 'Subjects & Curriculum'
  | 'Student Enrolments'
  | 'Timetable'
  | 'Teacher on Duty'
  | 'Lessons'
  | 'Mark Center'
  | 'Mark Entry'
  | 'Attendance'
  | 'Admissions'
  | 'Finance'
  | 'Staff & Users'
  | 'Communications'
  | 'Reports'
  | 'Administration'
  | 'Admin Account';

const navigation: Array<{ label: DemoSection; icon: typeof LayoutDashboard }> = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Students', icon: Users },
  { label: 'Academics', icon: BookOpenCheck },
  { label: 'Classes & Streams', icon: School },
  { label: 'Subjects & Curriculum', icon: BookOpen },
  { label: 'Student Enrolments', icon: UserPlus },
  { label: 'Timetable', icon: Clock3 },
  { label: 'Teacher on Duty', icon: CalendarRange },
  { label: 'Lessons', icon: BookOpenCheck },
  { label: 'Mark Center', icon: ClipboardCheck },
  { label: 'Mark Entry', icon: FileText },
  { label: 'Attendance', icon: CalendarCheck },
  { label: 'Admissions', icon: UserPlus },
  { label: 'Finance', icon: Wallet },
  { label: 'Staff & Users', icon: GraduationCap },
  { label: 'Communications', icon: Megaphone },
  { label: 'Reports', icon: FileText },
  { label: 'Administration', icon: Settings },
  { label: 'Admin Account', icon: UserRound },
];

const staff = [
  { name: 'Demo School Admin', role: 'School Administrator', department: 'Administration' },
  { name: 'Grace Nyerere', role: 'Head of Academics', department: 'Academics' },
  { name: 'John Mwakalinga', role: 'Mathematics Teacher', department: 'Mathematics' },
  { name: 'Rehema Ally', role: 'School Bursar', department: 'Administration' },
];

const activities = [
  { title: 'School fee payment received', detail: 'Amina Joseph • Form 3 A', amount: '+ TZS 250,000', time: '09:42 AM' },
  { title: 'Student enrolled', detail: 'Daniel Michael • Form 1 C', amount: 'New student', time: 'Yesterday' },
  { title: 'Attendance submitted', detail: 'Form 2 B • John Mwakalinga', amount: '38 / 40 present', time: 'Yesterday' },
];

const academics = [
  { time: '08:00 – 08:40', subject: 'Mathematics', teacher: 'J. Mwakalinga', room: 'Room 4' },
  { time: '08:40 – 09:20', subject: 'English Language', teacher: 'G. Nyerere', room: 'Room 2' },
  { time: '09:40 – 10:20', subject: 'Biology', teacher: 'P. Mushi', room: 'Laboratory' },
  { time: '10:20 – 11:00', subject: 'History', teacher: 'A. Joseph', room: 'Room 6' },
];

const attendance = [
  { className: 'Form 1 • A', present: '39 / 42', rate: '92.9%', status: 'Submitted' },
  { className: 'Form 2 • B', present: '38 / 40', rate: '95.0%', status: 'Submitted' },
  { className: 'Form 3 • A', present: '35 / 39', rate: '89.7%', status: 'Submitted' },
  { className: 'Form 4 • C', present: '—', rate: '—', status: 'Pending' },
];

const admissions = [
  { applicant: 'Daniel Michael', applied: '08 Nov 2026', className: 'Form 1', status: 'Under review' },
  { applicant: 'Asha Juma', applied: '07 Nov 2026', className: 'Form 1', status: 'Documents received' },
  { applicant: 'Peter Paulo', applied: '05 Nov 2026', className: 'Form 3', status: 'Assessment booked' },
];

const announcements = [
  { title: 'End of term examinations', audience: 'All students and parents', date: '06 Nov 2026' },
  { title: 'Parents meeting – Form 4', audience: 'Form 4 parents', date: '04 Nov 2026' },
  { title: 'School sports day', audience: 'All school community', date: '01 Nov 2026' },
];

const reportHighlights = [
  { label: 'Student attendance', value: '92.4%', note: 'This term' },
  { label: 'Fee collection', value: '68%', note: 'Of term target' },
  { label: 'Enrolment', value: '1,248', note: 'Across 24 classes' },
];

const classes = [
  { name: 'Form 1 • A', level: 'Form 1', stream: 'A', students: 42, teacher: 'G. Nyerere' },
  { name: 'Form 2 • B', level: 'Form 2', stream: 'B', students: 40, teacher: 'J. Mwakalinga' },
  { name: 'Form 3 • A', level: 'Form 3', stream: 'A', students: 39, teacher: 'P. Mushi' },
  { name: 'Form 4 • C', level: 'Form 4', stream: 'C', students: 36, teacher: 'A. Joseph' },
];

const subjects = [
  { name: 'Mathematics', code: 'MATH', level: 'O-Level', lessons: 5 },
  { name: 'English Language', code: 'ENGL', level: 'O-Level', lessons: 4 },
  { name: 'Biology', code: 'BIOL', level: 'O-Level', lessons: 4 },
  { name: 'History', code: 'HIST', level: 'O-Level', lessons: 3 },
];

const dutyRoster = [
  { day: 'Monday', teacher: 'Grace Nyerere', area: 'Main gate', shift: 'Morning' },
  { day: 'Tuesday', teacher: 'John Mwakalinga', area: 'Assembly ground', shift: 'Morning' },
  { day: 'Wednesday', teacher: 'Rehema Ally', area: 'Dining hall', shift: 'Lunch' },
  { day: 'Thursday', teacher: 'Peter Mushi', area: 'Library block', shift: 'Afternoon' },
];

const lessonLogs = [
  { subject: 'Mathematics', className: 'Form 3 • A', topic: 'Quadratic equations', teacher: 'J. Mwakalinga', status: 'Completed' },
  { subject: 'Biology', className: 'Form 2 • B', topic: 'Plant transport systems', teacher: 'P. Mushi', status: 'Completed' },
  { subject: 'English Language', className: 'Form 1 • C', topic: 'Descriptive writing', teacher: 'G. Nyerere', status: 'In progress' },
];

const marks = [
  { student: 'Amina Joseph', admission: 'MWL-2026-0142', score: '82', grade: 'A' },
  { student: 'Baraka Mushi', admission: 'MWL-2026-0138', score: '74', grade: 'B' },
  { student: 'Neema Peter', admission: 'MWL-2026-0129', score: '91', grade: 'A' },
  { student: 'Daniel Michael', admission: 'MWL-2026-0117', score: '68', grade: 'C' },
];

const MetricCard: React.FC<{
  label: string;
  value: string;
  note: string;
  icon: typeof Users;
  tone: string;
  trend?: 'up' | 'down';
}> = ({ label, value, note, icon: Icon, tone, trend = 'up' }) => (
  <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      </div>
      <span className={`rounded-xl p-2.5 ${tone}`}><Icon className="h-5 w-5" /></span>
    </div>
    <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-500">
      {trend === 'up' ? <ArrowUpRight className="h-4 w-4 text-emerald-600" /> : <ArrowDownRight className="h-4 w-4 text-amber-600" />}
      {note}
    </p>
  </article>
);

const DemoTable: React.FC<{ section: DemoSection; students: DemoStudent[] }> = ({ section, students }) => {
  if (section === 'Classes & Streams') {
    return (
      <DataTable title="Classes & streams" subtitle="Sample class structure for the 2026 academic year">
        <div className="hidden grid-cols-4 gap-3 border-b border-slate-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
          <span>Class</span><span>Level</span><span>Students</span><span>Class teacher</span>
        </div>
        {classes.map((item) => (
          <div key={item.name} className="grid grid-cols-2 items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-4">
            <span className="text-sm font-semibold text-slate-800"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Class</span>{item.name}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Level</span>{item.level} • Stream {item.stream}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Students</span>{item.students}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Class teacher</span>{item.teacher}</span>
          </div>
        ))}
      </DataTable>
    );
  }

  if (section === 'Subjects & Curriculum') {
    return (
      <DataTable title="Subjects & curriculum" subtitle="Sample subjects configured for the school">
        {subjects.map((item) => (
          <div key={item.code} className="grid grid-cols-2 items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-4">
            <span className="text-sm font-semibold text-slate-800"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Subject</span>{item.name}</span>
            <span className="text-xs text-slate-500"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Code</span>{item.code}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Level</span>{item.level}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Lessons / week</span>{item.lessons}</span>
          </div>
        ))}
      </DataTable>
    );
  }

  if (section === 'Student Enrolments') {
    return (
      <DataTable title="Student enrolments" subtitle="Active demo students • register new students in Finance">
        {students.filter((item) => item.status === 'Active').map((item) => (
          <div key={item.admission} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 last:border-0">
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.name}</p>
              <p className="mt-1 text-xs text-slate-500">{item.admission}</p>
            </div>
            <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">{item.className}</span>
          </div>
        ))}
      </DataTable>
    );
  }

  if (section === 'Timetable') {
    return (
      <DataTable title="Class timetable" subtitle="Wednesday • Form 3 A • Term II, 2026">
        {academics.map((lesson) => (
          <div key={lesson.time} className="grid grid-cols-2 items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-[1fr_1.2fr_1.2fr_1fr]">
            <span className="text-xs font-semibold text-slate-500"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Time</span>{lesson.time}</span>
            <span className="text-sm font-semibold text-slate-800"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Subject</span>{lesson.subject}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Teacher</span>{lesson.teacher}</span>
            <span className="text-xs text-slate-500"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Room</span>{lesson.room}</span>
          </div>
        ))}
      </DataTable>
    );
  }

  if (section === 'Teacher on Duty') {
    return (
      <DataTable title="Teacher on duty roster" subtitle="Sample weekly duty assignments">
        {dutyRoster.map((item) => (
          <div key={item.day} className="grid grid-cols-2 items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-4">
            <span className="text-sm font-semibold text-slate-800"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Day</span>{item.day}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Teacher</span>{item.teacher}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Duty area</span>{item.area}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Shift</span>{item.shift}</span>
          </div>
        ))}
      </DataTable>
    );
  }

  if (section === 'Lessons') {
    return (
      <DataTable title="Lesson logs" subtitle="Sample teaching activity recorded this week">
        {lessonLogs.map((item) => (
          <div key={`${item.subject}-${item.className}`} className="grid grid-cols-2 items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-[1fr_1fr_1.4fr_1fr]">
            <span className="text-sm font-semibold text-slate-800"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Subject</span>{item.subject}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Class</span>{item.className}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Topic • Teacher</span>{item.topic} • {item.teacher}</span>
            <span><span className="mb-1 block text-[10px] uppercase text-slate-400 sm:hidden">Status</span><StatusBadge status={item.status} /></span>
          </div>
        ))}
      </DataTable>
    );
  }

  if (section === 'Mark Center') {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <MetricCard label="Assessments" value="8" note="This academic year" icon={ClipboardCheck} tone="bg-sky-50 text-sky-700" />
          <MetricCard label="Awaiting moderation" value="2" note="Ready for review" icon={Clock3} tone="bg-amber-50 text-amber-700" trend="down" />
          <MetricCard label="Results approved" value="6" note="Available to teachers" icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
        </div>
        <DataTable title="Assessment overview" subtitle="Sample examination and moderation status">
          <div className="grid grid-cols-2 items-center gap-3 px-5 py-4 sm:grid-cols-3">
            <span className="text-sm font-semibold text-slate-800">Mid-Term Assessment</span>
            <span className="text-sm text-slate-600">Form 3 • Term II</span>
            <StatusBadge status="Moderation pending" />
          </div>
        </DataTable>
      </div>
    );
  }

  if (section === 'Mark Entry') {
    return (
      <DataTable title="Marks entry" subtitle="Mathematics • Form 3 A • Mid-Term Assessment (sample scores)">
        <div className="hidden grid-cols-4 gap-3 border-b border-slate-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
          <span>Student</span><span>Admission no.</span><span>Score / 100</span><span>Grade</span>
        </div>
        {marks.map((item) => (
          <div key={item.admission} className="grid grid-cols-2 items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-4">
            <span className="text-sm font-semibold text-slate-800"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Student</span>{item.student}</span>
            <span className="text-xs text-slate-500"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Admission no.</span>{item.admission}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Score / 100</span>{item.score}</span>
            <span className="text-sm font-bold text-emerald-700"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Grade</span>{item.grade}</span>
          </div>
        ))}
      </DataTable>
    );
  }

  if (section === 'Students') {
    return (
      <DataTable title="Student registry" subtitle="A sample view of enrolled students">
        <div className="hidden grid-cols-4 gap-3 border-b border-slate-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
          <span>Student</span><span>Admission no.</span><span>Class</span><span>Status</span>
        </div>
        {students.map((student) => (
          <div key={student.admission} className="grid grid-cols-2 items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-4">
            <span className="min-w-0"><span className="block text-[10px] font-semibold uppercase text-slate-400 sm:hidden">Student</span><span className="text-sm font-semibold text-slate-800">{student.name}</span></span>
            <span className="min-w-0 break-all text-xs text-slate-500"><span className="block text-[10px] font-semibold uppercase text-slate-400 sm:hidden">Admission no.</span>{student.admission}<span className="block">Demo control: {student.controlNumber ?? 'Not issued'}</span></span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] font-semibold uppercase text-slate-400 sm:hidden">Class</span>{student.className}</span>
            <span><span className="mb-1 block text-[10px] font-semibold uppercase text-slate-400 sm:hidden">Status</span><StatusBadge status={student.status} /></span>
          </div>
        ))}
      </DataTable>
    );
  }

  if (section === 'Academics') {
    return (
      <DataTable title="Today's timetable" subtitle="Wednesday • Term II, 2026">
        {academics.map((lesson) => (
          <div key={lesson.time} className="grid grid-cols-2 items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-[1fr_1.2fr_1.2fr_1fr]">
            <span className="text-xs font-semibold text-slate-500"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Time</span>{lesson.time}</span>
            <span className="text-sm font-semibold text-slate-800"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Subject</span>{lesson.subject}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Teacher</span>{lesson.teacher}</span>
            <span className="text-xs text-slate-500"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Room</span>{lesson.room}</span>
          </div>
        ))}
      </DataTable>
    );
  }

  if (section === 'Attendance') {
    return (
      <DataTable title="Class attendance" subtitle="Today's sample register status">
        <div className="hidden grid-cols-4 gap-3 border-b border-slate-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
          <span>Class</span><span>Present</span><span>Attendance</span><span>Register</span>
        </div>
        {attendance.map((item) => (
          <div key={item.className} className="grid grid-cols-2 items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-4">
            <span className="text-sm font-semibold text-slate-800"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Class</span>{item.className}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Present</span>{item.present}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] uppercase text-slate-400 sm:hidden">Attendance</span>{item.rate}</span>
            <span><span className="mb-1 block text-[10px] uppercase text-slate-400 sm:hidden">Register</span><StatusBadge status={item.status} /></span>
          </div>
        ))}
      </DataTable>
    );
  }

  if (section === 'Admissions') {
    return (
      <DataTable title="Recent applications" subtitle="Sample applications awaiting the next step">
        {admissions.map((item) => (
          <div key={item.applicant} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 last:border-0">
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.applicant}</p>
              <p className="mt-1 text-xs text-slate-500">{item.className} • Applied {item.applied}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </DataTable>
    );
  }

  if (section === 'Communications') {
    return (
      <DataTable title="School announcements" subtitle="Recent messages shared with the school community">
        {announcements.map((item) => (
          <div key={item.title} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 last:border-0">
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.title}</p>
              <p className="mt-1 text-xs text-slate-500">{item.audience}</p>
            </div>
            <span className="text-xs text-slate-400">{item.date}</span>
          </div>
        ))}
      </DataTable>
    );
  }

  if (section === 'Reports') {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {reportHighlights.map((item) => (
          <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{item.label}</p>
            <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
            <p className="mt-2 text-xs text-slate-500">{item.note}</p>
          </article>
        ))}
      </div>
    );
  }

  if (section === 'Administration') {
    return (
      <DataTable title="School profile" subtitle="Sample school settings and configuration">
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div><p className="text-xs text-slate-500">School name</p><p className="mt-1 text-sm font-semibold text-slate-800">Mwilamvya Secondary School</p></div>
          <div><p className="text-xs text-slate-500">School code</p><p className="mt-1 text-sm font-semibold text-slate-800">MWL</p></div>
          <div><p className="text-xs text-slate-500">Academic year</p><p className="mt-1 text-sm font-semibold text-slate-800">2026</p></div>
          <div><p className="text-xs text-slate-500">Current term</p><p className="mt-1 text-sm font-semibold text-slate-800">Term II</p></div>
        </div>
      </DataTable>
    );
  }

  if (section === 'Admin Account') {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 p-5 sm:p-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-lg font-bold text-emerald-800">SA</span>
          <div>
            <h2 className="font-bold text-slate-900">Demo School Admin</h2>
            <p className="mt-1 text-sm text-slate-500">School Administrator</p>
          </div>
          <span className="ml-auto rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">Demo account</span>
        </div>
        <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
          <div><p className="text-xs text-slate-500">Email</p><p className="mt-1 break-all text-sm font-semibold text-slate-800">school.admin@demo.schoolos.local</p></div>
          <div><p className="text-xs text-slate-500">School</p><p className="mt-1 text-sm font-semibold text-slate-800">Mwilamvya Secondary School</p></div>
          <div><p className="text-xs text-slate-500">Account type</p><p className="mt-1 text-sm font-semibold text-slate-800">Sample administrator profile</p></div>
          <div><p className="text-xs text-slate-500">Access</p><p className="mt-1 text-sm font-semibold text-slate-800">Preview only • no sign-in enabled</p></div>
        </div>
        <p className="border-t border-slate-100 bg-slate-50 px-5 py-4 text-xs leading-relaxed text-slate-500 sm:px-6">
          This is a fictional profile to preview the admin account screen. It is not a real SchoolOS account, and no password or account data is stored.
        </p>
      </section>
    );
  }

  if (section === 'Staff & Users') {
    return (
      <DataTable title="Staff directory" subtitle="A sample view of school staff">
        <div className="hidden grid-cols-3 gap-3 border-b border-slate-100 px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400 sm:grid">
          <span>Name</span><span>Role</span><span>Department</span>
        </div>
        {staff.map((member) => (
          <div key={member.name} className="grid grid-cols-2 items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-0 sm:grid-cols-3">
            <span className="text-sm font-semibold text-slate-800"><span className="block text-[10px] font-semibold uppercase text-slate-400 sm:hidden">Name</span>{member.name}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] font-semibold uppercase text-slate-400 sm:hidden">Role</span>{member.role}</span>
            <span className="text-sm text-slate-600"><span className="block text-[10px] font-semibold uppercase text-slate-400 sm:hidden">Department</span>{member.department}</span>
          </div>
        ))}
      </DataTable>
    );
  }

  return (
    <DataTable title="Recent school activity" subtitle="Illustrative school updates; separate from Finance demo transactions">
      {activities.map((activity) => (
        <div key={activity.title} className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 last:border-0">
          <div>
            <p className="text-sm font-semibold text-slate-800">{activity.title}</p>
            <p className="mt-1 text-xs text-slate-500">{activity.detail}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-700">{activity.amount}</p>
            <p className="mt-1 text-xs text-slate-400">{activity.time}</p>
          </div>
        </div>
      ))}
    </DataTable>
  );
};

const DataTable: React.FC<{ title: string; subtitle: string; children: React.ReactNode }> = ({ title, subtitle, children }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-100 px-5 py-4">
      <h2 className="font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </div>
    {children}
  </section>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
    {status}
  </span>
);

export const FrontendDemoPage: React.FC = () => {
  const [section, setSection] = useState<DemoSection>('Overview');
  const [financeState, setFinanceState] = useState(initialDemoFinance);
  const financeSummary = financeTotals(financeState);
  const selectedNavigation = navigation.find((item) => item.label === section);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-lg font-black text-white">M</span>
            <div>
              <p className="font-extrabold tracking-tight text-slate-900">Mkoko <span className="text-emerald-700">SchoolOS</span></p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">School workspace</p>
            </div>
          </div>
          <div className="px-4 pt-6">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">School workspace</p>
            <nav aria-label="Demo sections" className="mt-3 max-h-[calc(100vh-15rem)] space-y-1 overflow-y-auto">
              {navigation.map(({ label, icon: Icon }) => (
                <React.Fragment key={label}>
                  {label === 'Classes & Streams' && (
                    <p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Academic modules</p>
                  )}
                  <button
                    type="button"
                    aria-current={section === label ? 'page' : undefined}
                    onClick={() => setSection(label)}
                    className={`flex w-full items-center gap-3 rounded-xl py-2.5 text-left text-sm font-semibold transition-colors ${label === 'Classes & Streams' || ['Subjects & Curriculum', 'Student Enrolments', 'Timetable', 'Teacher on Duty', 'Lessons', 'Mark Center', 'Mark Entry'].includes(label) ? 'pl-6 pr-3' : 'px-3'} ${section === label ? 'bg-emerald-50 text-emerald-800' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                  >
                    <Icon className="h-4 w-4" />{label}
                  </button>
                </React.Fragment>
              ))}
            </nav>
          </div>
          <div className="mt-auto p-4">
            <div className="rounded-2xl bg-slate-900 p-4 text-white">
              <p className="text-xs font-bold">Frontend preview</p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-300">Explore sample school screens. Nothing here is saved or sent to a server.</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
            <div>
              <p className="text-xs font-medium text-slate-400">School workspace</p>
              <h1 className="mt-1 text-sm font-bold text-slate-900">Mwilamvya Secondary School</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-semibold text-amber-800 sm:inline-flex">Demo preview</span>
              <Link to="/login" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900">
                Back to sign in
              </Link>
            </div>
          </header>

          <main className="mx-auto max-w-7xl space-y-6 p-5 sm:p-8">
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
              <strong>Demo data only.</strong> This frontend preview works without a backend; sample information is for demonstration and is not saved.
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navigation.map(({ label }) => (
                <button key={label} type="button" aria-current={section === label ? 'page' : undefined} onClick={() => setSection(label)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold ${section === label ? 'bg-emerald-700 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-500">Term II • 2026</p>
                <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">
                  {section === 'Overview' ? 'Good morning, School Admin' : section}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {section === 'Overview' ? 'Here is a snapshot of what is happening at your school.' : `Explore the ${section.toLowerCase()} sample screen.`}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-500">
                <CalendarDays className="h-4 w-4 text-emerald-700" /> Sunday, 8 November 2026
              </div>
            </div>

            {section === 'Overview' && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Total students" value="1,248" note="4.8% from last term" icon={Users} tone="bg-emerald-50 text-emerald-700" />
                  <MetricCard label="Active classes" value="24" note="Across Forms 1–6" icon={Building2} tone="bg-sky-50 text-sky-700" />
                  <MetricCard label="Teaching staff" value="58" note="2 new this term" icon={GraduationCap} tone="bg-violet-50 text-violet-700" />
                  <MetricCard label="Demo fees collected" value={`TZS ${financeSummary.collected.toLocaleString('en-US')}`} note="Matched simulated bank payments" icon={Wallet} tone="bg-amber-50 text-amber-700" />
                </div>
                <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
                  <DemoTable section="Overview" students={financeState.students} />
                  <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="font-bold text-slate-900">Today's attendance</h2>
                        <p className="mt-1 text-xs text-slate-500">Student attendance overview</p>
                      </div>
                      <Clock3 className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div className="mt-6 flex items-end justify-between">
                      <div><p className="text-3xl font-extrabold text-slate-900">92.4%</p><p className="mt-1 text-xs text-slate-500">1,153 of 1,248 students</p></div>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">On track</span>
                    </div>
                    <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-[92.4%] rounded-full bg-emerald-600" /></div>
                    <div className="mt-5 flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Attendance recorded for 22 of 24 classes</div>
                  </section>
                </div>
              </>
            )}

            {section !== 'Overview' && section !== 'Finance' && <DemoTable section={section} students={financeState.students} />}
            <div hidden={section !== 'Finance'}><FinanceDemo onStateChange={setFinanceState} /></div>

            {selectedNavigation && <p className="pb-2 text-center text-[11px] text-slate-400">Mkoko SchoolOS • Interactive frontend demo</p>}
          </main>
        </div>
      </div>
    </div>
  );
};
