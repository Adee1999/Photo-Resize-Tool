import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, ShieldAlert, Heart, Info } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="app-footer" className="bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-900 transition-colors py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/10">
                <Camera size={14} />
              </div>
              <span className="font-sans font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                Photo Size Converter
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
              Prepare passport photos, visa applications, and professional prints inside your browser. No registration, no ads, 100% free and private.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-sans font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Application
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                  Photo Editor
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal / Info */}
          <div>
            <h3 className="font-sans font-semibold text-xs text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Privacy & Trust
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/privacy" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy badge */}
          <div className="bg-blue-50/50 dark:bg-slate-900/40 p-4 rounded-xl border border-blue-100 dark:border-slate-800/80">
            <div className="flex items-start space-x-2">
              <ShieldAlert size={16} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-slate-900 dark:text-white flex items-center">
                  Local-Only Guarantee
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Images never leave your computer. All processing, cropping, filters, and file generation run in-browser using Web APIs. Secure and private by design.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-900 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <p>© {currentYear} Photo Size Converter. All rights reserved.</p>
          <p className="flex items-center space-x-1 mt-2 md:mt-0">
            <span>Made with</span>
            <Heart size={10} className="text-red-500 fill-current" />
            <span>locally in the browser.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
