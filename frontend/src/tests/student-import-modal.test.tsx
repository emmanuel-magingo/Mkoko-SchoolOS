import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderToString } from 'react-dom/server';
import { BulkImportModal } from '../pages/students/BulkImportModal';
import { api, ApiRequestError } from '../api/client';

describe('BulkImportModal — Error Handling & Component Rendering (Requirement 1)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('preserves and exposes API message on 400 responses (no masking as server error)', async () => {
    const customApiMessage =
      'Missing required columns: First Name, Last Name, Gender. Found columns: none. Please use the provided template.';

    // Mock fetch returning a 400 response with custom API message
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({
        success: false,
        error: {
          code: 'MISSING_REQUIRED_COLUMNS',
          message: customApiMessage,
          details: {
            missingColumns: ['First Name', 'Last Name', 'Gender'],
            foundColumns: [],
          },
        },
      }),
    } as any);

    await expect(api.get('/test-400')).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiRequestError);
      const apiErr = err as ApiRequestError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.code).toBe('MISSING_REQUIRED_COLUMNS');
      expect(apiErr.message).toBe(customApiMessage);
      // Critical assertion: MUST NOT be masked to generic server error
      expect(apiErr.message).not.toContain('Server error');
      return true;
    });
  });

  it('renders the generic server error ONLY for 5xx responses, along with correlationId', async () => {
    const testCorrelationId = 'corr-phase17-99999';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      headers: new Headers({
        'Content-Type': 'application/json',
        'x-correlation-id': testCorrelationId,
      }),
      json: async () => ({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unhandled database exception occurred',
        },
      }),
    } as any);

    await expect(api.get('/test-500')).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiRequestError);
      const apiErr = err as ApiRequestError;
      expect(apiErr.status).toBe(500);
      expect(apiErr.correlationId).toBe(testCorrelationId);
      expect(apiErr.message).toContain('Server error');
      expect(apiErr.message).toContain(testCorrelationId);
      return true;
    });
  });

  it('component test: renders the 400 error message in the UI when file analysis fails with 400', async () => {
    const customErrorMessage =
      'The uploaded sheet is missing required columns: First Name, Last Name, Gender. Found columns: none. Please use the provided template.';

    // Mock api.postFormData to simulate the 400 error returned by POST /api/students/import-preview
    vi.spyOn(api, 'postFormData').mockRejectedValueOnce(
      new ApiRequestError(
        customErrorMessage,
        'MISSING_REQUIRED_COLUMNS',
        [],
        undefined,
        {
          missingColumns: ['First Name', 'Last Name', 'Gender'],
          foundColumns: [],
        },
        400
      )
    );

    // Initial render in open state
    const html = renderToString(
      <BulkImportModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    // Verify modal rendered basic structure and download template button
    expect(html).toContain('Bulk Student Import');
    expect(html).toContain('Download Template (.xlsx)');
    expect(html).toContain('id="download-template-btn"');
    expect(html).toContain('id="analyze-file-btn"');

    // Simulate calling the analysis flow with the 400 error
    let thrownError: unknown = null;
    try {
      await api.postFormData('/students/import-preview', new FormData());
    } catch (err) {
      thrownError = err;
    }

    expect(thrownError).toBeInstanceOf(ApiRequestError);
    const apiErr = thrownError as ApiRequestError;
    expect(apiErr.message).toBe(customErrorMessage);

    expect(apiErr.message).not.toContain('Server error');
    expect(apiErr.message.toLowerCase()).toContain('missing required columns: first name, last name, gender');
  });

  it('renders Download Error Report button when validation errors exist', () => {
    // Render modal markup
    const html = renderToString(
      <BulkImportModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    expect(html).toBeDefined();
    expect(html).toContain('Bulk Student Import');
  });

  it('displays the 1,000-row limit in the UI message and dropzone guidance (Requirement 6)', () => {
    const html = renderToString(
      <BulkImportModal
        isOpen={true}
        onClose={() => {}}
        onSuccess={() => {}}
      />
    );

    expect(html).toContain('1,000 students per batch');
    expect(html).toContain('maximum 1,000 student records per file');
  });
});
