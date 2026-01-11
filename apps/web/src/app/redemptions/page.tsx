'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { createApiClient } from '@pulso/api-client';
import { formatBalance, COPY } from '@pulso/shared';

interface Redemption {
  id: string;
  amountSC: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes: string | null;
  createdAt: string;
  processedAt: string | null;
}

interface Balance {
  currency: 'GC' | 'SC';
  amount: string;
}

export default function RedemptionsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, token } = useAuth();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [scBalance, setScBalance] = useState<bigint>(0n);
  const [amount, setAmount] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const api = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', token);
      const [balances, redemptionData] = await Promise.all([
        api.getBalances(),
        api.getMyRedemptions(),
      ]);

      const sc = balances.balances.find((b: Balance) => b.currency === 'SC');
      setScBalance(sc ? BigInt(sc.amount) : 0n);
      setRedemptions(redemptionData.redemptions);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreating(true);

    try {
      const amountUnits = BigInt(Math.floor(parseFloat(amount) * 100));
      if (amountUnits < 100n) {
        throw new Error('Minimum redemption is 1.00 SC');
      }
      if (amountUnits > scBalance) {
        throw new Error('Insufficient SC balance');
      }

      const api = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', token!);
      await api.createRedemption(amountUnits.toString());

      setAmount('');
      setSuccess('Redemption request submitted successfully!');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create redemption');
    } finally {
      setCreating(false);
    }
  };

  const getStatusBadge = (status: Redemption['status']) => {
    const styles = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Rewards Redemption</h1>

        {/* Info Box */}
        <div className="p-4 mb-6 bg-green-50 rounded-lg border border-green-100">
          <p className="text-sm text-green-800">{COPY.scDisclaimer}</p>
        </div>

        {/* Create Redemption */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">Request Redemption</h2>
          <p className="text-sm text-gray-600 mb-4">
            Available SC Balance: <span className="font-semibold">{formatBalance(scBalance)} 💎</span>
          </p>

          {error && (
            <div className="p-3 mb-4 bg-red-100 text-red-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 mb-4 bg-green-100 text-green-800 rounded-lg text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleCreate} className="flex gap-4">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount SC"
              step="0.01"
              min="1"
              required
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={creating || scBalance < 100n}
              className="btn btn-primary"
            >
              {creating ? 'Submitting...' : 'Request Redemption'}
            </button>
          </form>
        </div>

        {/* Redemption History */}
        <h2 className="text-lg font-semibold mb-4">Redemption History</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : redemptions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">No redemptions yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Date</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Amount</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-sm">
                      {formatBalance(BigInt(r.amountSC))} SC
                    </td>
                    <td className="py-3 px-2">{getStatusBadge(r.status)}</td>
                    <td className="py-3 px-2 text-sm text-gray-500">{r.adminNotes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
