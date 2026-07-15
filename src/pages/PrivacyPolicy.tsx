import React from 'react';
import { Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-16 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-slate-100 dark:border-slate-900">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Shield size={20} />
          </div>
          <h1 className="text-2xl font-sans font-bold text-slate-900 dark:text-white">
            Privacy Policy
          </h1>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 text-sm space-y-6 leading-relaxed">
          <p className="text-slate-900 dark:text-slate-200 font-semibold text-base">
            Effective Date: July 15, 2026
          </p>

          <p>
            Welcome to the <strong>Photo Size Converter</strong>. We take your privacy extremely seriously. Because we believe your photos and personal identity should never be stored, analyzed, or monetized by third parties, our application is engineered to operate <strong>100% locally in your browser</strong>.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            1. Zero Server Processing Guarantee
          </h2>
          <p>
            When you select and upload an image to this website, the image <strong>never leaves your device</strong>. No background file transfers, web requests, or cloud storage uploads occur. All operations—including image cropping, rotation, filter rendering, background removal (chroma keying), mask painting, and PDF compiles—occur within your local browser tab's RAM using standard browser WebGL and 2D canvas API layers.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            2. Biometric Facial Data and Grids
          </h2>
          <p>
            Our "Passport Face" guide overlays are strictly vector reference graphics drawn on top of your live workspace for visual alignment. We do not run automated facial feature mapping, facial recognition, or biometric tracking models, and no telemetry about your face shape is calculated or harvested.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            3. Local Storage and Cookies
          </h2>
          <p>
            We only store minor configuration preferences, such as your theme choice (Light or Dark mode), inside your browser's persistent key-value <code>localStorage</code> database to improve your recurring experience. We do not use tracking pixels, analytics hooks, or third-party advertising cookies.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            4. Data Retention
          </h2>
          <p>
            Because we do not store any files on any server, there is no database from which to erase your files. Closing your browser tab immediately destroys all image representations loaded into your computer's short-term memory (RAM), leaving no traces of your photographs.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            5. Contact Information
          </h2>
          <p>
            If you have any questions or security concerns regarding our browser-side converter, please reach out to us using our dedicated <a href="/contact" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Contact Form</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
