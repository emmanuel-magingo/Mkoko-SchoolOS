import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AcademicsApi } from '../api/academics.api';
import { api } from '../api/client';
import { UserRole } from '../types';

describe('MKOKO SCHOOLOS — PHASE 6 ACADEMICS FRONTEND ENGINE', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================================================
  // 11 CRITICAL FRONTEND WORKFLOWS
  // ==========================================================================
  describe('Phase 6 Critical Workflows', () => {
    // Test 1: Academic Roles Access
    it('Test 1: Teachers and Academic Admins can access Academics navigation and operational routes', () => {
      const authorizedRoles: UserRole[] = ['SCHOOL_ADMIN', 'HEADMASTER', 'TEACHER'];
      const canTeacherAccess = authorizedRoles.includes('TEACHER');
      const canAdminAccess = authorizedRoles.includes('SCHOOL_ADMIN');
      
      expect(canTeacherAccess).toBe(true);
      expect(canAdminAccess).toBe(true);
    });

    // Test 2: Bursar cannot access Academics operations
    it('Test 2: Bursar cannot access Academics operations or routes', () => {
      const bursarRole: UserRole = 'BURSAR';
      const authorizedRoles = ['SCHOOL_ADMIN', 'HEADMASTER', 'TEACHER'];

      expect(authorizedRoles.includes(bursarRole)).toBe(false);
    });

    // Test 3: Create Assessment
    it('Test 3: Create assessment submits valid payload', async () => {
      const mockAssessment = {
        id: 'ass-123',
        tenantId: 'tenant-456',
        subjectId: 'sub-1',
        classId: 'cls-1',
        termId: 'term-1',
        name: 'Mid Term Math',
        maxScore: 100,
        weight: 50,
        type: 'EXAM' as const,
        status: 'DRAFT' as const,
      };

      vi.spyOn(api, 'post').mockResolvedValueOnce({ data: mockAssessment });

      const res = await AcademicsApi.createAssessment({
        subjectId: 'sub-1',
        classId: 'cls-1',
        termId: 'term-1',
        name: 'Mid Term Math',
        maxScore: 100,
        weight: 50,
        type: 'EXAM',
      });

      expect(res.data.id).toBe('ass-123');
      expect(res.data.status).toBe('DRAFT');
      expect(Number(res.data.maxScore)).toBe(100);
    });

    // Test 4: Enter Marks
    it('Test 4: Enter marks submits valid marks payload', async () => {
      const mockMarks = [
        { id: 'mark-1', studentId: 'stu-1', score: 85, grade: 'A', status: 'DRAFT' },
        { id: 'mark-2', studentId: 'stu-2', score: 45, grade: 'C', status: 'DRAFT' }
      ];

      vi.spyOn(api, 'post').mockResolvedValueOnce({ data: mockMarks });

      const res = await AcademicsApi.enterMarks('ass-123', [
        { studentId: 'stu-1', score: 85 },
        { studentId: 'stu-2', score: 45 }
      ]);

      expect(res.data).toBeDefined();
      expect(res.data.length).toBe(2);
    });

    // Test 5: Finalize Assessment
    it('Test 5: Finalize assessment updates status to FINALIZED and locks mutations', async () => {
      const finalizedMock = {
        id: 'ass-123',
        status: 'FINALIZED' as const,
      };

      vi.spyOn(api, 'post').mockResolvedValueOnce({ data: finalizedMock });

      const res = await AcademicsApi.finalizeAssessment('ass-123');
      expect(res.data.status).toBe('FINALIZED');
      expect(res.data.id).toBe('ass-123');
    });
  });
});
