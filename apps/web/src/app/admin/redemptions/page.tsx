'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { createApiClient } from '@pulso/api-client';
import { formatBalance } from '@pulso/shared';

interface Redemption {
  id: string;
  userId: string;
  user: { email: string };
  amountSC: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes: string | null;
  createdAt: string;
  processedAt: string | null;
}

export default function AdminRedemptionsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (token && user?.role === 'ADMIN') {
      loadRedemptions();
    }
  }, [token, user]);

  const loadRedemptions = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const api = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', token);
      const res = await api.adminListRedemptions('PENDING');
      setRedemptions(res.redemptions);
    } catch (err) {
      console.error('Failed to load redemptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!token) return;
    setProcessing(id);

    try {
      const api = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', token);
      await api.adminProcessRedemption(id, action, notes[id] || undefined);
      loadRedemptions();
    } catch (err) {
      console.error('Failed to process redemption:', err);
    } finally {
      setProcessing(null);
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pending Redemptions</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : redemptions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 text-lg">No pending redemptions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {redemptions.map((r) => (
              <div key={r.id} className="card">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="font-semibold">{r.user.email}</p>
                    <p className="text-sm text-gray-600">
                      Amount: <span className="font-medium">{formatBalance(BigInt(r.amountSC))} SC</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Requested: {new Date(r.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      value={notes[r.id] || ''}
                      onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                      placeholder="Admin notes (optional)"
                      className="input text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAction(r.id, 'approve')}
                        disabled={processing === r.id}
                        className="btn bg-green-600 text-white hover:bg-green-700 flex-1"
                      >
                        {processing === r.id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleAction(r.id, 'reject')}
                        disabled={processing === r.id}
                        className="btn bg-red-600 text-white hover:bg-red-700 flex-1"
                      >
                        {processing === r.id ? '...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
