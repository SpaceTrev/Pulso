'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Navbar } from '@/components/Navbar';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!isLoading && isAuthenticated && user?.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [isLoading, isAuthenticated, user, router]);

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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/admin/grants" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🎁</div>
              <div>
                <h3 className="text-lg font-semibold">Grant Coins</h3>
                <p className="text-gray-600 text-sm">Give GC or SC to users</p>
              </div>
            </div>
          </Link>

          <Link href="/admin/redemptions" className="card hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📋</div>
              <div>
                <h3 className="text-lg font-semibold">Review Redemptions</h3>
                <p className="text-gray-600 text-sm">Approve or reject requests</p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
