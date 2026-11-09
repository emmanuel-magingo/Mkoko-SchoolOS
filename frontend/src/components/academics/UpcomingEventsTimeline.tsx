import React, { useEffect, useState } from 'react';
import { Calendar, MapPin } from 'lucide-react';
import { api } from '../../api/client';

export interface AcademicEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  dayOfMonth?: string | number;
  month?: string;
  dayOfWeek?: string;
  category?: 'EXAMINATION' | 'MEETING' | 'CAMP' | 'MODERATION' | 'GOVERNANCE' | 'GENERAL';
  location?: string;
}

const DEFAULT_EVENTS: AcademicEvent[] = [
  {
    id: 'evt-1',
    title: 'Mid-Term Examinations Begin',
    description: 'Form 2 & Form 4 continuous assessment examination papers commencement across core subjects.',
    date: '2026-10-24',
    dayOfMonth: '24',
    month: 'OCT',
    dayOfWeek: 'Fri',
    category: 'EXAMINATION',
    location: 'Main Exam Halls',
  },
  {
    id: 'evt-2',
    title: 'Departmental Meeting - Sciences',
    description: 'Review of laboratory practical requisitions, syllabus coverage pacing, and assessment schedules.',
    date: '2026-10-27',
    dayOfMonth: '27',
    month: 'OCT',
    dayOfWeek: 'Mon',
    category: 'MEETING',
    location: 'Science Staffroom',
  },
  {
    id: 'evt-3',
    title: 'Form 4 Study Camp',
    description: 'Intensive revision and national exam preparation workshop for candidate streams.',
    date: '2026-10-30',
    dayOfMonth: '30',
    month: 'OCT',
    dayOfWeek: 'Thu',
    category: 'CAMP',
    location: 'Senior Wing Block B',
  },
  {
    id: 'evt-4',
    title: 'Continuous Assessment Moderation',
    description: 'Academic Board verification and moderation of compiled term mark sheets.',
    date: '2026-11-03',
    dayOfMonth: '03',
    month: 'NOV',
    dayOfWeek: 'Mon',
    category: 'MODERATION',
    location: 'Academic Office',
  },
  {
    id: 'evt-5',
    title: 'Parents-Teachers Consultation Day',
    description: 'Academic clinic for underperforming candidate streams and term performance briefing.',
    date: '2026-11-09',
    dayOfMonth: '09',
    month: 'NOV',
    dayOfWeek: 'Sun',
    category: 'GOVERNANCE',
    location: 'School Assembly Hall',
  },
  {
    id: 'evt-6',
    title: 'Final Examination Paper Deposit',
    description: 'All subject teachers deposit moderated final examination sets with the exam coordinator.',
    date: '2026-11-14',
    dayOfMonth: '14',
    month: 'NOV',
    dayOfWeek: 'Fri',
    category: 'EXAMINATION',
    location: 'Depository Vault',
  },
];

const categoryStyles: Record<string, string> = {
  EXAMINATION: 'bg-rose-50 text-rose-700 border-rose-200/80',
  MEETING: 'bg-blue-50 text-blue-700 border-blue-200/80',
  CAMP: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  MODERATION: 'bg-amber-50 text-amber-700 border-amber-200/80',
  GOVERNANCE: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  GENERAL: 'bg-slate-50 text-slate-700 border-slate-200/80',
};

export interface UpcomingEventsTimelineProps {
  className?: string;
  maxHeightClass?: string;
}

export const UpcomingEventsTimeline: React.FC<UpcomingEventsTimelineProps> = ({
  className = '',
  maxHeightClass = 'h-80 max-h-80',
}) => {
  const [events, setEvents] = useState<AcademicEvent[]>(DEFAULT_EVENTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let active = true;

    const fetchEvents = async () => {
      try {
        const res = await api
          .get<AcademicEvent[] | { data: AcademicEvent[] }>('/api/academics/events')
          .catch(() => api.get<any>('/academics/events'));

        if (!active) return;

        const rawData = (res as any)?.data;
        const eventList = Array.isArray(rawData)
          ? rawData
          : Array.isArray(rawData?.data)
          ? rawData.data
          : null;

        if (eventList && eventList.length > 0) {
          // Format raw events if necessary
          const formatted: AcademicEvent[] = eventList.map((e: any, idx: number) => {
            const d = e.date ? new Date(e.date) : new Date();
            const monthStr = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            const dayStr = d.getDate().toString().padStart(2, '0');
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

            return {
              id: e.id || `api-evt-${idx}`,
              title: e.title || e.name || 'Academic Event',
              description: e.description || e.reason || 'Scheduled academic session',
              date: e.date || new Date().toISOString(),
              month: e.month || monthStr,
              dayOfMonth: e.dayOfMonth || dayStr,
              dayOfWeek: e.dayOfWeek || dayName,
              category: e.category || 'GENERAL',
              location: e.location,
            };
          });
          setEvents(formatted);
        } else {
          setEvents(DEFAULT_EVENTS);
        }
      } catch {
        if (active) {
          setEvents(DEFAULT_EVENTS);
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div
      id="upcoming-events-card"
      className={`flex flex-col rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300 hover:shadow-md ${maxHeightClass} ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="rounded-lg p-1.5 bg-blue-50 text-blue-600 border border-blue-100/80">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-tight">
              Upcoming Academic Events
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Term II Schedule</span>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
          {events.length} upcoming
        </span>
      </div>

      {/* Timeline List (Vertically Scrollable) */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 divide-y divide-slate-100/80">
        {isLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse items-start">
                <div className="h-10 w-10 bg-slate-100 rounded-lg shrink-0" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <div className="h-3 bg-slate-100 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-50 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-8 text-center">
            <Calendar className="mx-auto h-6 w-6 text-slate-300 mb-1" />
            <p className="text-xs font-medium text-slate-500">No upcoming events scheduled</p>
          </div>
        ) : (
          events.map((evt, idx) => {
            const badgeClass =
              categoryStyles[evt.category || 'GENERAL'] || categoryStyles.GENERAL;

            return (
              <div
                key={evt.id}
                className={`flex items-start gap-3 pt-2.5 first:pt-0 group transition-colors hover:bg-slate-50/60 rounded-lg p-1 -mx-1`}
              >
                {/* Date Badge on the Left */}
                <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200/80 bg-slate-50/90 w-11 h-11 shrink-0 text-center shadow-2xs group-hover:bg-blue-50/70 group-hover:border-blue-200 transition-colors">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 group-hover:text-blue-600 leading-none">
                    {evt.month || 'DAY'}
                  </span>
                  <span className="text-sm font-black text-slate-800 group-hover:text-blue-700 leading-none mt-0.5">
                    {evt.dayOfMonth || idx + 1}
                  </span>
                  {evt.dayOfWeek && (
                    <span className="text-[8px] font-medium text-slate-400 leading-none mt-0.5">
                      {evt.dayOfWeek}
                    </span>
                  )}
                </div>

                {/* Event Details on the Right */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate">
                      {evt.title}
                    </h4>
                    {evt.category && (
                      <span
                        className={`inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-semibold border ${badgeClass} shrink-0`}
                      >
                        {evt.category}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                    {evt.description}
                  </p>

                  {evt.location && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-0.5">
                      <MapPin className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
