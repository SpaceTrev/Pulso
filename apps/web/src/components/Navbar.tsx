'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-primary-600">
              🎲 Pulso
            </Link>
            {isAuthenticated && (
              <div className="hidden md:flex ml-10 space-x-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                  Dashboard
                </Link>
                <Link href="/play" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                  Play
                </Link>
                <Link href="/history" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                  History
                </Link>
                <Link href="/redemptions" className="text-gray-600 hover:text-gray-900 px-3 py-2">
                  Rewards
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="text-primary-600 hover:text-primary-700 px-3 py-2 font-medium">
                    Admin
                  </Link>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">{user?.email}</span>
                <button onClick={logout} className="btn btn-secondary text-sm">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-secondary text-sm">
                  Login
                </Link>
                <Link href="/register" className="btn btn-primary text-sm">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
