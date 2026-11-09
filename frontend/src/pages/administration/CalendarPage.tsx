import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { administrationApi, CalendarEvent } from '../../api/administration';
import { usePermissions } from '../../hooks/usePermissions';
import { Permissions } from '../../types/permissions';
import { EventModal } from './EventModal';

export const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await administrationApi.listCalendarEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEdit = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await administrationApi.deleteCalendarEvent(id);
      fetchEvents();
    } catch (err) {
      console.error('Failed to delete event:', err);
    }
  };

  const { hasPermission } = usePermissions();
  const canManageCalendar = hasPermission(Permissions.MANAGE_CALENDAR);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-brand-500" />
          School Calendar
        </h1>
        {canManageCalendar && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Event
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No events scheduled.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <div key={event.id} className="p-6 hover:bg-slate-50 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                    {event.isHoliday && (
                      <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        Holiday
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
                      {event.type}
                    </span>
                  </div>
                  <div className="text-sm text-slate-600 mb-2">
                    {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.startDate))} -{' '}
                    {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(event.endDate))}
                  </div>
                  {event.description && (
                    <p className="text-sm text-slate-500">{event.description}</p>
                  )}
                </div>
                
                {canManageCalendar && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(event)}
                      className="text-sm font-medium text-brand-600 hover:text-brand-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <EventModal
          event={selectedEvent}
          onClose={() => setIsModalOpen(false)}
          onSaved={() => {
            setIsModalOpen(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
};
