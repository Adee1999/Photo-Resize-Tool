import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: 'Is my uploaded photo secure? Will it be saved online?',
      answer: 'Your photo is 100% secure. Unlike traditional online converters, our software operates completely client-side in your browser. All filters, image positioning, background keying, and PDF rendering happen locally within your browser tab. We never upload your images to any remote server, meaning your facial data remains private and secure under your direct control.',
    },
    {
      question: 'How does the one-click background removal work?',
      answer: 'Our background remover uses an advanced Euclidean chroma-keying algorithm to detect solid backgrounds (such as portrait studio backdrops) and erase them instantly. You can adjust the "Tolerance" slider to expand or narrow the erased color range, and use the "Feather" slider to smooth out fine edges like hair. For more complex backgrounds, you can use our manual "Brush Mask" to paint away or restore background details with a soft-edged cursor.',
    },
    {
      question: 'What is PPI and which setting should I select?',
      answer: 'PPI (Pixels Per Inch) represents the printing density of your image. 300 PPI is the professional standard for high-quality printing, yielding clear details. 600 PPI is excellent for close-up viewing on glossy photographic paper, and 900 PPI is ideal for fine art gallery-grade printing. When you select a PPI, our converter automatically scales the output pixel size. E.g. a 3×4 cm photo printed at 300 PPI is 354×472 pixels, whereas at 900 PPI it is 1063×1417 pixels.',
    },
    {
      question: 'Why does the downloaded PDF match my selected photo size instead of A4?',
      answer: 'This application is designed specifically as a professional photo preparation tool. It outputs ONE perfectly dimensioned image file, conforming exactly to your desired physical crop (e.g. 3×4 cm). Printing on A4 often stretches photos or clusters copies. By exporting a PDF that is exactly 30×40 mm, professional print drivers can read the native canvas metadata and print a single copy at the exact dimension specified without scaling errors.',
    },
    {
      question: 'Does the application support Apple HEIC images?',
      answer: 'Yes! We support native, offline conversion of Apple HEIC files in the browser. When you upload a `.heic` file from your iPhone, our system dynamically decodes and translates the image into a standard high-quality JPEG in-browser, letting you edit and crop it instantly without using third-party converter software.',
    },
    {
      question: 'Can I set custom dimensions?',
      answer: 'Absolutely. If none of our standard templates fit your requirements (e.g. visa photo specs for a specific country), simply check the "Custom Size" checkbox. You can enter any width and height, and select your preferred units (Millimeters, Centimeters, or Inches). The canvas crop window will resize in real-time.',
    },
  ];

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen py-16 transition-colors">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center mx-auto shadow-md">
            <HelpCircle size={24} />
          </div>
          <h1 className="text-3xl font-sans font-extrabold tracking-tight text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-lg mx-auto">
            Got questions about print layout, resolution calculations, or file safety? Find immediate answers below.
          </p>
        </div>

        {/* Faq Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left font-sans font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                >
                  <span>{faq.question}</span>
                  {isOpen ? (
                    <ChevronUp size={18} className="text-slate-500" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-500" />
                  )}
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-900 pt-4 bg-slate-50/50 dark:bg-slate-950/20">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
