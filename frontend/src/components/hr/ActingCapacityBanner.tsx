import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { delegationApi, DelegatedAuthority } from '../../api/hrApi';

export const ActingCapacityBanner: React.FC = () => {
  const { user } = useAuth();
  const [activeDelegations, setActiveDelegations] = useState<DelegatedAuthority[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchActive = async () => {
      try {
        const res = await delegationApi.getMyActive();
        if (isMounted) {
          setActiveDelegations(res.data || []);
        }
      } catch (err) {
        // Silent fail or non-blocking
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (user) {
      fetchActive();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  if (loading || activeDelegations.length === 0) return null;

  // We show banner for the highest/active delegation
  const delegation = activeDelegations[0];
  const actingTitle = delegation.actingRole
    ? delegation.actingRole.replace(/_/g, ' ')
    : 'Delegated Officer';

  const formattedEnd = new Date(delegation.endDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-amber-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-bold">
          <ShieldCheck className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-bold tracking-wide uppercase text-amber-100 text-[11px] block">
            Active Delegated Authority
          </span>
          <span className="font-semibold text-white">
            Acting as <strong className="underline underline-offset-2">{actingTitle}</strong> until {formattedEnd}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <div className="hidden md:flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full border border-white/10">
          <span className="text-amber-200">Base Role:</span>
          <span className="font-bold uppercase">{user?.role?.replace(/_/g, ' ')}</span>
          <span className="text-white/40">|</span>
          <span className="text-amber-200">Acting Authority:</span>
          <span className="font-bold uppercase text-amber-100">{actingTitle}</span>
        </div>
      </div>
    </div>
  );
};
