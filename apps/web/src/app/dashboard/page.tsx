'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import { BalanceDisplay } from '@/components/BalanceDisplay';
import { DailyClaim } from '@/components/DailyClaim';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
          </h1>
          <p className="text-gray-600">Ready to play?</p>
        </div>

        {/* Balances */}
        <div className="mb-8">
          <BalanceDisplay />
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <DailyClaim />

          <Link href="/play" className="card hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-4xl mb-2">🎲</div>
              <h3 className="text-lg font-semibold">Play Dice</h3>
              <p className="text-gray-600 text-sm">Try your luck!</p>
            </div>
          </Link>

          <Link href="/coins" className="card hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="text-4xl mb-2">🪙</div>
              <h3 className="text-lg font-semibold">Get Coins</h3>
              <p className="text-gray-600 text-sm">Purchase Gold Coins</p>
            </div>
          </Link>
        </div>

        {/* More Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/history" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="text-3xl">📜</div>
              <div>
                <h3 className="text-lg font-semibold">Play History</h3>
                <p className="text-gray-600 text-sm">View your recent plays</p>
              </div>
            </div>
          </Link>

          <Link href="/redemptions" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="text-3xl">🎁</div>
              <div>
                <h3 className="text-lg font-semibold">Rewards</h3>
                <p className="text-gray-600 text-sm">Request SC redemption</p>
              </div>
            </div>
          </Link>

          <Link href="/provably-fair" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="text-3xl">🔐</div>
              <div>
                <h3 className="text-lg font-semibold">Provably Fair</h3>
                <p className="text-gray-600 text-sm">Verify your plays</p>
              </div>
            </div>
          </Link>

          <Link href="/ledger" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="text-3xl">📊</div>
              <div>
                <h3 className="text-lg font-semibold">Transaction History</h3>
                <p className="text-gray-600 text-sm">View all transactions</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
