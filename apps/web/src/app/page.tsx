'use client';

import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/contexts/AuthContext';
import { COPY } from '@pulso/shared';

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          {COPY.heroTitle}
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {COPY.heroSubtitle}
        </p>
        <div className="flex justify-center gap-4">
          {isAuthenticated ? (
            <Link href="/dashboard" className="btn btn-primary text-lg px-8 py-3">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/register" className="btn btn-primary text-lg px-8 py-3">
                Get Started Free
              </Link>
              <Link href="/login" className="btn btn-secondary text-lg px-8 py-3">
                Login
              </Link>
            </>
          )}
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{COPY.howItWorksTitle}</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {COPY.howItWorksSteps.map((step, i) => (
            <div key={i} className="card text-center">
              <div className="text-4xl mb-4">
                {i === 0 ? '🪙' : i === 1 ? '💎' : '🎁'}
              </div>
              <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">🎲 {COPY.provablyFairTitle}</h3>
              <p className="text-gray-600">{COPY.provablyFairDescription}</p>
            </div>
            <div className="card">
              <h3 className="text-xl font-semibold mb-4">🎁 {COPY.dailyClaimTitle}</h3>
              <p className="text-gray-600">{COPY.dailyClaimDescription}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimers */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-500">
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-100">
            <strong>🪙 Gold Coins:</strong> {COPY.gcDisclaimer}
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-100">
            <strong>💎 Sweepstakes Coins:</strong> {COPY.scDisclaimer}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p className="mb-4">{COPY.footerDisclaimer}</p>
          <p>© 2026 Pulso. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
