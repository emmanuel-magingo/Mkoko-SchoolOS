import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

export function brandingAssetIdFromPath(path?: string | null): string | null {
  if (!path) return null;
  return path.match(/\/branding\/assets\/([0-9a-f-]{36})\/content(?:\?.*)?$/i)?.[1] ?? null;
}

export const BrandingImageFromPath: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => {
  const assetId = brandingAssetIdFromPath(src);
  return assetId ? <PrivateBrandingImage assetId={assetId} alt={alt} className={className} /> : <img src={src} alt={alt} className={className} />;
};

export const PrivateBrandingImage: React.FC<{
  assetId: string;
  alt: string;
  className?: string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
}> = ({ assetId, alt, className, onError }) => {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    let objectUrl = '';
    setSrc(''); setFailed(false);
    void api.getBlob(`/administration/branding/assets/${assetId}/content`)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [assetId]);
  if (failed) return <span role="img" aria-label={`${alt} unavailable`} className={className}>Image unavailable</span>;
  return <img src={src || undefined} alt={alt} className={className} onError={onError} />;
};
