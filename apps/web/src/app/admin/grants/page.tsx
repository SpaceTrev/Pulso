'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { createApiClient } from '@pulso/api-client';

export default function AdminGrantsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState<'GC' | 'SC'>('GC');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const amountUnits = BigInt(Math.floor(parseFloat(amount) * 100));
      if (amountUnits <= 0n) {
        throw new Error('Amount must be positive');
      }

      const api = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', token!);
      await api.adminGrant(email, currency, amountUnits.toString(), reason || undefined);

      setSuccess(`Successfully granted ${amount} ${currency} to ${email}`);
      setEmail('');
      setAmount('');
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to grant coins');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || !isAuthenticated || user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Grant Coins</h1>

        <div className="card">
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'GC' | 'SC')}
                className="input"
              >
                <option value="GC">🪙 Gold Coins (GC)</option>
                <option value="SC">💎 Sweepstakes Coins (SC)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                step="0.01"
                min="0.01"
                className="input"
                placeholder="100.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason (optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="input"
                placeholder="Welcome bonus, support credit, etc."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Granting...' : 'Grant Coins'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
