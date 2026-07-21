import React from 'react';
import { Link } from 'react-router-dom';
import { Camera, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-24 flex items-center justify-center transition-colors">
      <div className="max-w-md w-full px-6 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-slate-950 border border-red-100 dark:border-slate-800 text-red-500 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-sans font-extrabold tracking-tight text-slate-900 dark:text-white">
            404
          </h1>
          <h2 className="text-lg font-sans font-bold text-slate-800 dark:text-slate-200">
            Бет табылмады
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Іздеп жатқан бетті таба алмадық. Қане, кәсіби фотоларыңызды дайындауға қайта оралайық.
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-semibold shadow-md transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Camera size={16} />
            <span>Фото редакторға өту</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
