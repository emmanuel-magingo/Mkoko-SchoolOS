import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, CheckCircle2, AlertTriangle, Settings2 } from 'lucide-react';
import {
  getScheduleConfig,
  updateScheduleConfig,
  SchoolScheduleConfig,
  TimeSlotConfig,
} from '../../api/timetableApi';

interface ScheduleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const ScheduleConfigModal: React.FC<ScheduleConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [config, setConfig] = useState<SchoolScheduleConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      setSuccessMsg(null);
      getScheduleConfig()
        .then((data) => {
          setConfig(data);
        })
        .catch((err) => {
          setError(err?.response?.data?.error?.message || 'Failed to load schedule configuration');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      setIsSaving(true);
      setError(null);
      await updateScheduleConfig(config);
      setSuccessMsg('School schedule configuration saved successfully.');
      setTimeout(() => {
        onSaved();
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err?.response?.data?.error?.message || 'Failed to save configuration. Please verify time intervals.');
    } finally {
      setIsSaving(false);
    }
  };

  const addSlot = () => {
    if (!config) return;
    const nextIndex = config.slots.length > 0 ? Math.max(...config.slots.map((s) => s.index)) + 1 : 1;
    const newSlot: TimeSlotConfig = {
      id: `custom-slot-${Date.now()}`,
      index: nextIndex,
      label: `Period ${nextIndex}`,
      slotType: 'LESSON',
      startTime: '15:15',
      endTime: '15:55',
      durationMinutes: 40,
      isBreak: false,
    };
    setConfig({
      ...config,
      slots: [...config.slots, newSlot],
    });
  };

  const removeSlot = (slotId: string) => {
    if (!config) return;
    if (config.slots.length <= 1) {
      setError('School must have at least one slot.');
      return;
    }
    setConfig({
      ...config,
      slots: config.slots.filter((s) => s.id !== slotId),
    });
  };

  const updateSlotField = (slotId: string, field: keyof TimeSlotConfig, value: any) => {
    if (!config) return;
    setConfig({
      ...config,
      slots: config.slots.map((s) => {
        if (s.id !== slotId) return s;
        const updated = { ...s, [field]: value };
        if (field === 'slotType') {
          updated.isBreak = value === 'BREAK';
          if (value === 'BREAK' && !updated.breakType) {
            updated.breakType = 'SHORT_BREAK';
          }
        }
        if (field === 'startTime' || field === 'endTime') {
          const [sh, sm] = (field === 'startTime' ? value : s.startTime).split(':').map(Number);
          const [eh, em] = (field === 'endTime' ? value : s.endTime).split(':').map(Number);
          if (!isNaN(sh) && !isNaN(sm) && !isNaN(eh) && !isNaN(em)) {
            const dur = (eh * 60 + em) - (sh * 60 + sm);
            if (dur > 0) updated.durationMinutes = dur;
          }
        }
        return updated;
      }),
    });
  };

  const toggleTeachingDay = (day: string) => {
    if (!config) return;
    const exists = config.teachingDays.includes(day);
    if (exists && config.teachingDays.length <= 1) {
      setError('At least one teaching day must remain enabled.');
      return;
    }
    setConfig({
      ...config,
      teachingDays: exists
        ? config.teachingDays.filter((d) => d !== day)
        : [...config.teachingDays, day],
    });
  };

  const ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings2 className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-base">School Operating Hours & Schedule Configuration</h3>
              <p className="text-xs text-slate-500">Configure tenant-specific school hours, teaching days, periods, and prep slots.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md">✕</button>
        </div>

        {/* Form Body */}
        {isLoading || !config ? (
          <div className="p-16 text-center text-slate-500">
            <Clock className="w-8 h-8 animate-spin mx-auto mb-2 text-brand-600" />
            Loading school configuration...
          </div>
        ) : (
          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Section 1: Operating Hours & Timezone */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock size={16} className="text-brand-600" />
                <span>General Operating Hours & Timezone</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Campus Opening Time</label>
                  <input
                    type="time"
                    required
                    value={config.openingTime}
                    onChange={(e) => setConfig({ ...config, openingTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Campus Closing Time</label>
                  <input
                    type="time"
                    required
                    value={config.closingTime}
                    onChange={(e) => setConfig({ ...config, closingTime: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">School Timezone</label>
                  <input
                    type="text"
                    required
                    value={config.timezone}
                    onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-lg text-sm bg-white"
                    placeholder="Africa/Dar_es_Salaam"
                  />
                </div>
              </div>

              {/* Teaching Days */}
              <div>
                <label className="block font-semibold text-slate-600 mb-1.5">Official Teaching Days</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => {
                    const isSelected = config.teachingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleTeachingDay(day)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Overnight permission */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="overnight"
                  checked={config.allowsOvernightActivities ?? false}
                  onChange={(e) => setConfig({ ...config, allowsOvernightActivities: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="overnight" className="text-xs text-slate-600 font-medium">
                  Allow boarding night prep and overnight activities past midnight
                </label>
              </div>
            </div>

            {/* Section 2: Timetable Slots & Break Configuration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Timetable Periods & Break Slots</h4>
                  <p className="text-slate-500 text-[11px]">Define the slot structure used for the Master Timetable and Teacher Weekly View.</p>
                </div>
                <button
                  type="button"
                  onClick={addSlot}
                  className="flex items-center gap-1 px-3 py-1.5 bg-brand-50 border border-brand-200 text-brand-700 rounded-lg text-xs font-semibold hover:bg-brand-100 transition-colors"
                >
                  <Plus size={14} />
                  <span>Add Slot</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                {config.slots
                  .sort((a, b) => a.index - b.index)
                  .map((slot) => (
                    <div key={slot.id} className="p-3 bg-white flex flex-wrap items-center gap-3">
                      <div className="w-12 font-bold text-slate-400 text-xs">#{slot.index}</div>

                      <div className="w-28">
                        <input
                          type="text"
                          value={slot.label}
                          onChange={(e) => updateSlotField(slot.id, 'label', e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded font-semibold text-xs"
                          placeholder="Slot Label"
                        />
                      </div>

                      <div className="w-28">
                        <select
                          value={slot.slotType}
                          onChange={(e) => updateSlotField(slot.id, 'slotType', e.target.value)}
                          className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                        >
                          <option value="LESSON">Lesson</option>
                          <option value="BREAK">Break</option>
                          <option value="PREP">Prep Session</option>
                          <option value="ASSEMBLY">Assembly</option>
                          <option value="REMEDIAL">Remedial</option>
                          <option value="STUDY">Study Hall</option>
                        </select>
                      </div>

                      {slot.slotType === 'BREAK' && (
                        <div className="w-28">
                          <select
                            value={slot.breakType || 'SHORT_BREAK'}
                            onChange={(e) => updateSlotField(slot.id, 'breakType', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-xs bg-white"
                          >
                            <option value="SHORT_BREAK">Short Break</option>
                            <option value="LUNCH_BREAK">Lunch Break</option>
                            <option value="TEA_BREAK">Tea Break</option>
                            <option value="OTHER">Other Break</option>
                          </select>
                        </div>
                      )}

                      <div className="flex items-center gap-1 font-mono">
                        <input
                          type="time"
                          value={slot.startTime}
                          onChange={(e) => updateSlotField(slot.id, 'startTime', e.target.value)}
                          className="p-1 border border-slate-300 rounded text-xs"
                        />
                        <span className="text-slate-400">–</span>
                        <input
                          type="time"
                          value={slot.endTime}
                          onChange={(e) => updateSlotField(slot.id, 'endTime', e.target.value)}
                          className="p-1 border border-slate-300 rounded text-xs"
                        />
                      </div>

                      <div className="text-slate-400 font-mono text-[11px] w-12 text-center">
                        {slot.durationMinutes}m
                      </div>

                      <div className="ml-auto">
                        <button
                          type="button"
                          onClick={() => removeSlot(slot.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove slot"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
              >
                {isSaving && <Clock size={14} className="animate-spin" />}
                <span>Save Schedule Configuration</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
