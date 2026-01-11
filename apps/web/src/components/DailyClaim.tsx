'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatTimeRemaining, DAILY_CLAIM_COOLDOWN_MS } from '@pulso/shared';

interface DailyClaimStatus {
  canClaim: boolean;
  lastClaimAt: string | null;
  nextClaimAt: string | null;
}

export function DailyClaim() {
  const { api } = useAuth();
  const [status, setStatus] = useState<DailyClaimStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const data = await api.getDailyClaimStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch claim status:', error);
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    fetchStatus();
  });

  const handleClaim = async () => {
    setClaiming(true);
    setMessage(null);

    try {
      const result = await api.claimDaily();
      setMessage(`Claimed ${Number(result.amount) / 100} SC! 🎉`);
      setStatus({
        canClaim: false,
        lastClaimAt: new Date().toISOString(),
        nextClaimAt: result.nextClaimAt,
      });
    } catch (error: any) {
      setMessage(error.message || 'Failed to claim');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse h-24 bg-gray-100 rounded-lg"></div>;
  }

  const timeRemaining = status?.nextClaimAt
    ? Math.max(0, new Date(status.nextClaimAt).getTime() - Date.now())
    : 0;

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-2">🎁 Daily Reward</h3>
      <p className="text-gray-600 text-sm mb-4">
        Claim your free Sweepstakes Coins every 24 hours!
      </p>

      {message && (
        <div className={`p-3 rounded-lg mb-4 ${message.includes('🎉') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {status?.canClaim ? (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="btn btn-sweeps w-full"
        >
          {claiming ? 'Claiming...' : 'Claim 1.00 SC'}
        </button>
      ) : (
        <div className="text-center">
          <div className="text-gray-500 text-sm">Next claim in:</div>
          <div className="text-2xl font-bold text-gray-700">
            {formatTimeRemaining(timeRemaining)}
          </div>
        </div>
      )}
    </div>
  );
}
