import React, { useState } from 'react';
import { AttendanceManifest, ClassManifestItem } from '../../components/academics/attendance/AttendanceManifest';
import { ClassRegister } from '../../components/academics/attendance/ClassRegister';
import { AttendanceSession } from '../../api/attendance';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

export const AttendanceEnginePage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<ClassManifestItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSelectClass = (
    classItem: ClassManifestItem,
    date: string,
    existingSession?: AttendanceSession | null
  ) => {
    setSelectedClass(classItem);
    setSelectedDate(date);
    setSelectedSession(existingSession || null);
  };

  const handleCloseRegister = () => {
    setSelectedClass(null);
    setSelectedSession(null);
  };

  const handleRegisterSuccess = () => {
    const className = selectedClass?.name || 'Class';
    handleCloseRegister();
    setToastMessage(`Register for ${className} submitted and synced successfully!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="attendance-success-toast"
          data-testid="attendance-success-toast"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-white shadow-lg animate-in fade-in"
        >
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb Navigation when viewing a specific register */}
      {selectedClass && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-4 py-2.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={handleCloseRegister}
            className="hover:text-emerald-700 font-medium transition"
          >
            Daily Manifest
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-semibold text-slate-800">
            {selectedClass.name} Register
          </span>
          <span className="text-slate-400">({selectedDate})</span>
        </div>
      )}

      {selectedClass ? (
        <ClassRegister
          classItem={selectedClass}
          date={selectedDate}
          existingSession={selectedSession}
          onClose={handleCloseRegister}
          onSuccess={handleRegisterSuccess}
        />
      ) : (
        <AttendanceManifest onSelectClassForRegister={handleSelectClass} />
      )}
    </div>
  );
};
