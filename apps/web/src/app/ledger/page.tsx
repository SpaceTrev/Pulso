'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { createApiClient } from '@pulso/api-client';
import { formatBalance } from '@pulso/shared';

interface LedgerEntry {
  id: string;
  currency: 'GC' | 'SC';
  delta: string;
  balanceAfter: string;
  reason: string;
  refId: string | null;
  createdAt: string;
}

export default function LedgerPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, token } = useAuth();
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (token) {
      loadLedger();
    }
  }, [token, page]);

  const loadLedger = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const api = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', token);
      const res = await api.getLedger(page, 30);
      if (page === 1) {
        setEntries(res.entries);
      } else {
        setEntries((prev) => [...prev, ...res.entries]);
      }
      setHasMore(res.entries.length === 30);
    } catch (err) {
      console.error('Failed to load ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const formatReason = (reason: string) => {
    const labels: Record<string, string> = {
      GRANT: '🎁 Grant',
      DAILY_CLAIM: '📅 Daily Claim',
      GAME_STAKE: '🎲 Stake',
      GAME_WIN: '🏆 Win',
      PURCHASE: '💳 Purchase',
      REDEMPTION: '🎁 Redemption',
    };
    return labels[reason] || reason;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Transaction History</h1>

        {loading && entries.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : entries.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">No transactions yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Type</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Currency</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Amount</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const delta = BigInt(entry.delta);
                    const isPositive = delta > 0n;

                    return (
                      <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 text-sm">
                          {new Date(entry.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-2 text-sm">{formatReason(entry.reason)}</td>
                        <td className="py-3 px-2 text-sm">
                          {entry.currency === 'GC' ? '🪙 GC' : '💎 SC'}
                        </td>
                        <td className="py-3 px-2">
                          <span
                            className={`text-sm font-medium ${
                              isPositive ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {isPositive ? '+' : ''}
                            {formatBalance(delta)}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-500">
                          {formatBalance(BigInt(entry.balanceAfter))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={loading}
                  className="btn btn-secondary"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
