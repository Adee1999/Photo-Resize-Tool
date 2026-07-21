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
            Құпиялылық саясаты
          </h1>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 text-sm space-y-6 leading-relaxed">
          <p className="text-slate-900 dark:text-slate-200 font-semibold text-base">
            Күшіне ену күні: 2026 жылғы 15 шілде
          </p>

          <p>
            <strong>Photo Size Converter</strong>-ге қош келдіңіз. Біз сіздің құпиялылығыңызды өте маңызды деп санаймыз. Фотоларыңыз бен жеке басыңызды растайтын деректер үшінші тараптармен ешқашан сақталмауы, талданбауы немесе ақшаландырылмауы керек деп есептейтіндіктен, біздің қолданба <strong>толығымен браузеріңізде, 100% жергілікті</strong> жұмыс істейтіндей жасалған.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            1. Серверде өңдеу мүлдем жоқтығына кепілдік
          </h2>
          <p>
            Осы сайтқа сурет таңдап жүктегенде, ол <strong>құрылғыңыздан ешқашан кетпейді</strong>. Ешбір фондық файл тасымалы, веб-сұраныс немесе бұлтты сақтауға жүктеу орындалмайды. Суретті кесу, бұру, сүзгі қолдану, фонды өшіру (chroma keying), маска бояу және PDF құрастыру сияқты барлық әрекеттер стандартты браузер WebGL және 2D canvas API қабаттарын пайдаланып, тек браузер қойындысының жедел жадында (RAM) орындалады.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            2. Биометриялық бет деректері мен торлар
          </h2>
          <p>
            Біздің "Паспорттық бет" бағыттауыш қабаттары — жұмыс кеңістігіңіздің үстіне визуалды туралау үшін салынған қарапайым векторлық анықтамалық графика ғана. Біз автоматты бет belgілерін салыстыру, бетті тану немесе биометриялық қадағалау модельдерін іске қоспаймыз, әрі бет пішініңіз туралы ешбір телеметрия есептелмейді немесе жиналмайды.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            3. Жергілікті сақтау және cookie файлдары
          </h2>
          <p>
            Біз тек тақырып таңдауыңыз (Ашық немесе Қараңғы режим) сияқты шағын баптау параметрлерін ғана, тұрақты тәжірибеңізді жақсарту үшін, браузеріңіздің тұрақты кілт-мән <code>localStorage</code> дерекқорында сақтаймыз. Біз бақылау пиксельдерін, аналитика құралдарын немесе үшінші тарап жарнама cookie файлдарын қолданбаймыз.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            4. Деректерді сақтау мерзімі
          </h2>
          <p>
            Біз ешбір серверде файл сақтамайтындықтан, файлдарыңызды өшіретін дерекқор жоқ. Браузер қойындысын жабу компьютеріңіздің қысқа мерзімді жадына (RAM) жүктелген барлық сурет көшірмелерін дереу жойып, фотоларыңыздан ешбір із қалдырмайды.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            5. Байланыс ақпараты
          </h2>
          <p>
            Браузерде жұмыс істейтін түрлендіргішіміз жайлы сұрақтарыңыз немесе қауіпсіздікке қатысты алаңдаушылығыңыз болса, арнайы <a href="/contact" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">Байланыс формасы</a> арқылы бізге хабарласыңыз.
          </p>
        </div>
      </div>
    </div>
  );
}
