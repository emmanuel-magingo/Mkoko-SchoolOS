import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
vi.mock('../components/common/PrivateBrandingImage', () => ({
  brandingAssetIdFromPath: (value?: string | null) => value?.match(/branding\/assets\/([^/]+)\/content/)?.[1] ?? null,
  PrivateBrandingImage: ({ assetId, alt }: {assetId:string;alt:string}) => React.createElement('img', { src: `private:${assetId}`, alt }),
}));
import { BrandingTemplatePreview } from '../pages/administration/BrandingTemplatePreview';

describe('document-specific branding preview', () => {
  const base = {
    school: { name: 'Example School', address: 'School Road', contactPhone: '555-0100', motto: 'Learn well', logoUrl: '/logo.png' },
    primaryColor: '#123456', accentColor: '#654321', configured: true,
  };

  it('renders the selected report card configuration and omits disabled signature and stamp areas', () => {
    const html = renderToStaticMarkup(<BrandingTemplatePreview
      {...base}
      documentType="REPORT_CARD"
      title="Term Two Results"
      configuration={{ headerText: 'Report header', footerText: 'Report footer', includeLogo: true, includeStamp: false }}
      slots={[
        { designation: 'Class Teacher', required: false, enabled: true, displayName: 'Teacher A', assetId: 'teacher-signature' },
        { designation: 'Headmaster', required: false, enabled: false, displayName: 'Principal B', assetId: 'disabled-signature' },
      ]}
      stampAssetId="stamp-a"
    />);
    expect(html).toContain('Term Two Results');
    expect(html).toContain('Report header');
    expect(html).toContain('Report footer');
    expect(html).toContain('Sample academic summary');
    expect(html).toContain('teacher-signature');
    expect(html).not.toContain('disabled-signature');
    expect(html).not.toContain('stamp-a');
  });

  it('renders a separate configured receipt with its own stamp and signatory choices', () => {
    const html = renderToStaticMarkup(<BrandingTemplatePreview
      {...base}
      documentType="FEE_RECEIPT"
      title="Cash Receipt"
      configuration={{ headerText: 'Finance office', footerText: 'Keep this receipt', includeLogo: false, includeStamp: true }}
      slots={[{ designation: 'Bursar', required: true, enabled: true, displayName: 'Bursar C', assetId: 'bursar-signature' }]}
      stampAssetId="receipt-stamp"
    />);
    expect(html).toContain('data-document-type="FEE_RECEIPT"');
    expect(html).toContain('Cash Receipt');
    expect(html).toContain('Sample fee receipt');
    expect(html).toContain('bursar-signature');
    expect(html).toContain('receipt-stamp');
    expect(html).not.toContain('src="/logo.png"');
    expect(html).toContain('Keep this receipt');
  });

  it('shows a configuration empty state for an unsaved document type', () => {
    const html = renderToStaticMarkup(<BrandingTemplatePreview
      {...base}
      configured={false}
      documentType="REPORT_CARD"
      title="Student Report Card"
      configuration={{ headerText: '', footerText: '', includeLogo: false, includeStamp: false }}
      slots={[]}
    />);
    expect(html).toContain('No report card template has been saved yet');
  });
});
