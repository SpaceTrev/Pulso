'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { createApiClient } from '@pulso/api-client';
import { formatBalance, CURRENCY_LABELS } from '@pulso/shared';

interface GamePlay {
  id: string;
  gameType: string;
  currency: 'GC' | 'SC';
  stake: string;
  multiplierTenK: number;
  payout: string;
  diceTarget: number | null;
  diceRoll: number | null;
  diceDirection: string | null;
  createdAt: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, token } = useAuth();
  const [history, setHistory] = useState<GamePlay[]>([]);
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
      loadHistory();
    }
  }, [token, page]);

  const loadHistory = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const api = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', token);
      const res = await api.getGameHistory(page, 20);
      if (page === 1) {
        setHistory(res.plays);
      } else {
        setHistory((prev) => [...prev, ...res.plays]);
      }
      setHasMore(res.plays.length === 20);
    } catch (err) {
      console.error('Failed to load history:', err);
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

  const formatMultiplier = (tenK: number) => (tenK / 10000).toFixed(2);

  const isWin = (play: GamePlay) => BigInt(play.payout) > BigInt(play.stake);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Play History</h1>

        {loading && history.length === 0 ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">No plays yet</p>
            <p className="text-gray-400 text-sm mt-2">Start playing to see your history here</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Game</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Stake</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Roll</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Mult.</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((play) => (
                    <tr key={play.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 text-sm">
                        {new Date(play.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2 text-sm capitalize">
                        {play.gameType.toLowerCase()}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {formatBalance(BigInt(play.stake))} {CURRENCY_LABELS[play.currency]}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {play.diceRoll !== null && play.diceTarget !== null && (
                          <span>
                            {(play.diceRoll / 100).toFixed(2)} {play.diceDirection === 'UNDER' ? '<' : '>'}{' '}
                            {(play.diceTarget / 100).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-sm">{formatMultiplier(play.multiplierTenK)}x</td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            isWin(play)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isWin(play) ? `+${formatBalance(BigInt(play.payout) - BigInt(play.stake))}` : 'Loss'}
                        </span>
                      </td>
                    </tr>
                  ))}
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
