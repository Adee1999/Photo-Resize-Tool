import React from 'react';
import { FileText } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-16 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-950 p-8 md:p-12 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3 mb-8 pb-6 border-b border-slate-100 dark:border-slate-900">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileText size={20} />
          </div>
          <h1 className="text-2xl font-sans font-bold text-slate-900 dark:text-white">
            Terms of Service
          </h1>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 text-sm space-y-6 leading-relaxed">
          <p className="text-slate-900 dark:text-slate-200 font-semibold text-base">
            Last Updated: July 15, 2026
          </p>

          <p>
            Please read these Terms of Service carefully before using the <strong>Photo Size Converter</strong>. By accessing or using this local utility, you agree to comply with and be bound by the following simple terms.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            1. Scope of Use
          </h2>
          <p>
            This application is provided completely free of charge for personal, commercial, and educational photographic preparation. You are permitted to upload and process photographs of any size (up to our 50 MB limits) to produce print-ready dimensions.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            2. No Payments or Hidden Fees
          </h2>
          <p>
            The software is 100% free. There are no registration forms, subscriptions, premium filters, watermarks, export gates, or payment requests of any kind. You will never be asked to input credit card details or bank credentials.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            3. Disclaimer of Warranties
          </h2>
          <p>
            This tool is provided "as is" and "as available" without warranties of any kind, whether express or implied. While we strive to ensure that output ratios are mathematically precise (e.g., exactly 30×40 mm for a 3×4 cm template), users are advised to verify final print scale settings before paying physical print centers to avoid scaling mistakes.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            4. Limitation of Liability
          </h2>
          <p>
            Because the application does not transmit or store files, we cannot be held responsible for any loss of local work due to sudden power outages, accidental page refreshes, or device system crashes.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            5. Amendments
          </h2>
          <p>
            We reserve the right to refine or adjust features of this free utility at any time to improve browser performance or add sizing templates.
          </p>
        </div>
      </div>
    </div>
  );
}
