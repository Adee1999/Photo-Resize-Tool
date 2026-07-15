import React from 'react';
import { motion } from 'motion/react';
import { Upload, Sliders, Paintbrush, Square, Download, Printer } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: '1. Secure Upload',
      description: 'Drag and drop any JPEG, PNG, WEBP, or Apple HEIC image up to 50 MB. Your photo is processed entirely in your browser—it is never uploaded to a remote server, guaranteeing absolute data privacy.',
      color: 'bg-blue-500',
    },
    {
      icon: Sliders,
      title: '2. Fine-Tune & Align',
      description: 'Zoom, rotate, flip, and adjust crop dimensions with real-time feedback. Toggle standard biometric passport grids, thirds grids, or center crosshairs to align the head and face precisely.',
      color: 'bg-indigo-500',
    },
    {
      icon: Paintbrush,
      title: '3. Erase or Color Background',
      description: 'Remove backgrounds instantly with one-click chroma key detection, click a specific color to delete it, or paint fine details using the precision mask brush. Choose solid white, blue, gray, or pick a custom color.',
      color: 'bg-purple-500',
    },
    {
      icon: Square,
      title: '4. Choose Output Dimensions',
      description: 'Select from a comprehensive list of standard international templates (e.g. 3x4 cm, 3.5x4.5 cm, 5x5 cm, or 10x15 cm) or configure custom dimensions down to the millimeter, centimeter, or inch.',
      color: 'bg-pink-500',
    },
    {
      icon: Printer,
      title: '5. Select Print Resolution',
      description: 'Choose 300 PPI (standard print quality), 600 PPI (high-definition), or 900 PPI (ultra-sharp fine art). The app automatically calculates the correct pixel dimensions to guarantee lossless print outputs.',
      color: 'bg-amber-500',
    },
    {
      icon: Download,
      title: '6. Download Print-Ready Files',
      description: 'Export your photo instantly as a PNG, JPEG, or a custom-sized single-page PDF. The output file is engineered to the exact physical size specified—making it immediately ready for professional printing.',
      color: 'bg-emerald-500',
    },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-16 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center space-y-4 mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-sans font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            How the Photo Size Converter Works
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-600 dark:text-slate-400 text-base max-w-xl mx-auto"
          >
            A high-fidelity browser-side Photoshop alternative built specifically to prepare photos for passport, visa, and professional print applications.
          </motion.p>
        </div>

        {/* Steps Grid */}
        <div className="space-y-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -15 : 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.4 }}
                className="bg-white dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl ${step.color} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
                  <Icon size={20} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-sans font-bold text-slate-900 dark:text-white">
                    {step.title}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Why clients love it */}
        <div className="bg-blue-600 dark:bg-blue-500 rounded-3xl p-8 md:p-10 text-white mt-16 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-20" />
          <div className="relative z-10 space-y-4 text-center md:text-left max-w-2xl">
            <h2 className="text-2xl font-sans font-bold tracking-tight">
              Ready to convert your photos?
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              No subscription gates. No server storage. No watermark surprises. Simply upload your photograph, configure the custom dimensions, and download a professional-grade print file immediately.
            </p>
            <div className="pt-2 flex justify-center md:justify-start">
              <motion.a
                href="/"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white text-blue-600 font-bold px-6 py-3 rounded-xl text-sm shadow-md hover:bg-blue-50 transition-colors"
              >
                Launch Photo Editor
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
