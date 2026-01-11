'use client';

import { Navbar } from '@/components/Navbar';

export default function CoinsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Get Coins</h1>

        <div className="card text-center py-12">
          <div className="text-6xl mb-4">🪙</div>
          <h2 className="text-xl font-semibold mb-4">Coming Soon!</h2>
          <p className="text-gray-600 mb-4">
            Gold Coin purchase packages will be available here.
          </p>
          <p className="text-sm text-gray-500">
            Remember: Gold Coins are for entertainment only and have no cash value.
          </p>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
          <h3 className="font-semibold text-yellow-800 mb-2">🎁 Free Ways to Get Coins</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Claim your daily free Sweepstakes Coins</li>
            <li>• Future: Social media giveaways</li>
            <li>• Future: Referral bonuses</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
