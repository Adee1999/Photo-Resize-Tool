import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Sun, Moon, HelpCircle, BookOpen, MessageSquare, Shield, FileText } from 'lucide-react';

export default function Header() {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  const navLinks = [
    { path: '/how-it-works', label: 'Қалай жұмыс істейді', icon: BookOpen },
    { path: '/faq', label: 'Жиі қойылатын сұрақтар', icon: HelpCircle },
    { path: '/contact', label: 'Байланыс', icon: MessageSquare },
  ];

  return (
    <header id="app-header" className="sticky top-0 z-50 w-full border-b bg-white/90 dark:bg-slate-950/90 border-slate-200 dark:border-slate-800 backdrop-blur-md transition-colors shrink-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2.5 group">
          <div className="w-8 h-8 rounded bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <Camera size={16} />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="font-sans font-bold text-base tracking-tight text-slate-900 dark:text-white">
              PhotoSize<span className="text-blue-600 dark:text-blue-400">Pro</span>
            </span>
            <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest hidden sm:inline">
              Браузерде жұмыс істейді
            </span>
          </div>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-1">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors ${
              isLinkActive('/')
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
            }`}
          >
            Редактор
          </Link>
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-1.5 ${
                  isLinkActive(link.path)
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <Icon size={12} className="opacity-70" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center space-x-2">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            title={theme === 'light' ? 'Қараңғы режимге ауысу' : 'Ашық режимге ауысу'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Quick Start CTA on Other Pages */}
          {location.pathname !== '/' && (
            <Link
              to="/"
              className="bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white px-3.5 py-1.5 rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-[0.98]"
            >
              Түрлендіруді бастау
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
