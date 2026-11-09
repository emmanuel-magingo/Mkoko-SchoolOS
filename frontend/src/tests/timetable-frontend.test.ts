import { describe, it, expect } from 'vitest';
import {
  STANDARD_TIMETABLE_SLOTS,
  TimetableConflict,
} from '../api/timetableApi';

describe('Timetable Frontend Components & Logic', () => {
  it('defines the standard 10 slots with 8 academic periods and 2 configured breaks', () => {
    expect(STANDARD_TIMETABLE_SLOTS.length).toBe(10);

    const academicPeriods = STANDARD_TIMETABLE_SLOTS.filter((s) => !s.isBreak);
    expect(academicPeriods.length).toBe(8);

    const breaks = STANDARD_TIMETABLE_SLOTS.filter((s) => s.isBreak);
    expect(breaks.length).toBe(2);

    const shortBreak = breaks.find((b) => b.breakType === 'SHORT_BREAK');
    expect(shortBreak).toBeDefined();
    expect(shortBreak?.startTime).toBe('09:30');
    expect(shortBreak?.endTime).toBe('09:50');

    const lunchBreak = breaks.find((b) => b.breakType === 'LUNCH_BREAK');
    expect(lunchBreak).toBeDefined();
    expect(lunchBreak?.startTime).toBe('12:05');
    expect(lunchBreak?.endTime).toBe('13:00');
  });

  it('correctly structures conflict alerts for blocking warnings', () => {
    const conflict: TimetableConflict = {
      type: 'TEACHER',
      message: 'Teacher Baraka Juma is already teaching Mathematics in Form 1A (08:00-08:45)',
      conflictingPeriod: {
        id: 'p-1',
        className: 'Form 1A',
        subjectName: 'Mathematics',
        teacherName: 'Baraka Juma',
        room: 'Lab 1',
        startTime: '08:00',
        endTime: '08:45',
      },
    };

    expect(conflict.type).toBe('TEACHER');
    expect(conflict.message).toContain('Baraka Juma');
    expect(conflict.conflictingPeriod?.startTime).toBe('08:00');
  });

  it('preserves start and end time boundaries across periods', () => {
    const p1 = STANDARD_TIMETABLE_SLOTS[0];
    const p2 = STANDARD_TIMETABLE_SLOTS[1];

    expect(p1.startTime).toBe('08:00');
    expect(p1.endTime).toBe('08:45');
    expect(p2.startTime).toBe('08:45');
    expect(p2.endTime).toBe('09:30');

    // Adjacent without overlap
    expect(p1.endTime).toBe(p2.startTime);
  });
});
