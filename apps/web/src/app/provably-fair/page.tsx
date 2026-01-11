'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { createApiClient } from '@pulso/api-client';
import { verify } from '@pulso/provably-fair';

interface Session {
  id: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  revealed: boolean;
  serverSeed: string | null;
  createdAt: string;
}

export default function ProvablyFairPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, token } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [clientSeed, setClientSeed] = useState('');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Verification
  const [verifyServerSeed, setVerifyServerSeed] = useState('');
  const [verifyClientSeed, setVerifyClientSeed] = useState('');
  const [verifyNonce, setVerifyNonce] = useState('');
  const [verifyResult, setVerifyResult] = useState<null | { roll: number; hash: string }>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (token) {
      loadSession();
    }
  }, [token]);

  const loadSession = async () => {
    if (!token) return;
    setLoading(true);

    try {
      const api = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', token);
      const res = await api.getSession();
      setSession(res.session);
      setClientSeed(res.session.clientSeed);
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateClientSeed = async () => {
    if (!token) return;
    setUpdating(true);

    try {
      const api = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', token);
      await api.setClientSeed(clientSeed);
      await loadSession();
    } catch (err) {
      console.error('Failed to update client seed:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRotate = async () => {
    if (!token) return;
    setUpdating(true);

    try {
      const api = createApiClient(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', token);
      await api.rotateSession();
      await loadSession();
    } catch (err) {
      console.error('Failed to rotate session:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleVerify = () => {
    try {
      const result = verify(verifyServerSeed, verifyClientSeed, parseInt(verifyNonce, 10));
      setVerifyResult(result);
    } catch (err) {
      console.error('Verification failed:', err);
      setVerifyResult(null);
    }
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Provably Fair</h1>

        {/* Explanation */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">🔐 How It Works</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Before any play, we commit to a server seed by showing you its SHA256 hash</li>
            <li>You can set your own client seed to influence the outcome</li>
            <li>Each play uses: HMAC-SHA256(serverSeed, clientSeed + nonce)</li>
            <li>After rotating your session, we reveal the old server seed</li>
            <li>You can verify any past play using the revealed seed</li>
          </ol>
        </div>

        {/* Current Session */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : session ? (
          <div className="card mb-8">
            <h2 className="text-lg font-semibold mb-4">Current Session</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Server Seed Hash (commitment)
                </label>
                <code className="block p-2 bg-gray-100 rounded text-xs break-all">
                  {session.serverSeedHash}
                </code>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Your Client Seed
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clientSeed}
                    onChange={(e) => setClientSeed(e.target.value)}
                    className="input flex-1"
                  />
                  <button
                    onClick={handleUpdateClientSeed}
                    disabled={updating}
                    className="btn btn-secondary"
                  >
                    Update
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Current Nonce
                </label>
                <p className="text-lg font-mono">{session.nonce}</p>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={handleRotate}
                  disabled={updating}
                  className="btn btn-primary"
                >
                  Rotate Session (reveals server seed)
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  This will reveal the current server seed and create a new one.
                </p>
              </div>

              {session.revealed && session.serverSeed && (
                <div className="pt-4 border-t">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Revealed Server Seed (previous)
                  </label>
                  <code className="block p-2 bg-green-100 rounded text-xs break-all">
                    {session.serverSeed}
                  </code>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Verifier */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">🔍 Verify a Play</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Server Seed
              </label>
              <input
                type="text"
                value={verifyServerSeed}
                onChange={(e) => setVerifyServerSeed(e.target.value)}
                placeholder="Revealed server seed"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Client Seed
              </label>
              <input
                type="text"
                value={verifyClientSeed}
                onChange={(e) => setVerifyClientSeed(e.target.value)}
                placeholder="Your client seed"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Nonce
              </label>
              <input
                type="number"
                value={verifyNonce}
                onChange={(e) => setVerifyNonce(e.target.value)}
                placeholder="0"
                className="input"
              />
            </div>

            <button onClick={handleVerify} className="btn btn-primary">
              Verify
            </button>

            {verifyResult && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-lg font-semibold text-green-800">
                  Roll Result: {(verifyResult.roll / 100).toFixed(2)}
                </p>
                <p className="text-sm text-green-600 mt-2">
                  Hash: <code className="break-all">{verifyResult.hash}</code>
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
