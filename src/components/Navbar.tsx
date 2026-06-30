'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Zap, LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  // Highlight active link
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/5 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center">
              <Zap className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">EV Chakra</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-brand-primary' : 'text-slate-300 hover:text-white'}`}
            >
              Home
            </Link>
            
            {user ? (
              <>
                <Link 
                  href="/dashboard" 
                  className={`text-sm font-medium transition-colors ${isActive('/dashboard') ? 'text-brand-primary' : 'text-slate-300 hover:text-white'}`}
                >
                  Dashboard
                </Link>
                
                {(user.role === 'admin' || user.role === 'super_admin') && (
                  <Link 
                    href="/admin" 
                    className={`text-sm font-medium transition-colors ${isActive('/admin') ? 'text-brand-primary' : 'text-slate-300 hover:text-white'}`}
                  >
                    Admin
                  </Link>
                )}
                
                <button 
                  onClick={logout}
                  className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-red-400 transition-colors ml-4"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <Link 
                href="/login" 
                className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/30 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
