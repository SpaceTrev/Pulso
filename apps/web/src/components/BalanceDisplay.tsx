'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatBalance } from '@pulso/shared';

interface Balances {
  gc: string;
  sc: string;
}

export function BalanceDisplay() {
  const { api, isAuthenticated } = useAuth();
  const [balances, setBalances] = useState<Balances | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBalances = async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getBalances();
      setBalances(data);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    // Poll every 5 seconds
    const interval = setInterval(fetchBalances, 5000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (!isAuthenticated || loading) {
    return null;
  }

  return (
    <div className="flex gap-4">
      <div className="flex items-center gap-2 px-4 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
        <span className="text-xl">🪙</span>
        <div>
          <div className="text-xs text-yellow-700 font-medium">Gold Coins</div>
          <div className="text-lg font-bold text-yellow-800">
            {balances ? formatBalance(balances.gc) : '0.00'}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
        <span className="text-xl">💎</span>
        <div>
          <div className="text-xs text-green-700 font-medium">Sweepstakes Coins</div>
          <div className="text-lg font-bold text-green-800">
            {balances ? formatBalance(balances.sc) : '0.00'}
          </div>
        </div>
      </div>
    </div>
  );
}
