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
      question: 'Менің жүктеген фотом қауіпсіз бе? Ол онлайн сақтала ма?',
      answer: 'Сіздің фотоңыз 100% қауіпсіз. Дәстүрлі онлайн түрлендіргіштерден айырмашылығы, біздің құрал толығымен браузеріңізде, клиент жағында жұмыс істейді. Барлық сүзгілер, суретті орналастыру, фон түсін таңдау және PDF жасау браузер қойындысында жергілікті түрде орындалады. Біз суреттеріңізді ешқашан алыстағы серверге жүктемейміз, яғни бет деректеріңіз тек сізде, толық бақылауыңызда қалады.',
    },
    {
      question: 'Бір батырмамен фонды өшіру қалай жұмыс істейді?',
      answer: 'Біздің фон өшіргіш біртекті фондарды (мысалы, студиялық портрет фондарын) анықтап, оларды бірден өшіру үшін жетілдірілген евклидтік chroma-key алгоритмін қолданады. Өшірілетін түс ауқымын кеңейту немесе тарылту үшін "Төзімділік" жүгірткісін, ал шаш секілді нәзік жиектерді жұмсарту үшін "Жиек жұмсарту" жүгірткісін реттей аласыз. Күрделірек фондар үшін жұмсақ жиекті курсормен фонды қолмен өшіретін немесе қалпына келтіретін "Қыл маскасын" қолдануға болады.',
    },
    {
      question: 'PPI дегеніміз не және қай мәнді таңдау керек?',
      answer: 'PPI (дюймдегі пиксель саны) суретіңіздің басып шығару тығыздығын білдіреді. 300 PPI — жоғары сапалы басып шығарудың кәсіби стандарты, ол анық детальдар береді. 600 PPI жылтыр фотоқағазда жақыннан қарауға өте қолайлы, ал 900 PPI көркем галерея деңгейіндегі басып шығаруға сай келеді. PPI таңдағанда, түрлендіргіш шығыс пиксель өлшемін автоматты түрде масштабтайды. Мысалы, 3×4 см фото 300 PPI-де 354×472 пиксель болса, 900 PPI-де 1063×1417 пиксель болады.',
    },
    {
      question: 'Неге жүктелген PDF A4 емес, менің таңдаған фото өлшеміме сай келеді?',
      answer: 'Бұл қолданба арнайы кәсіби фото дайындау құралы ретінде жасалған. Ол сіздің қалаған физикалық кесіміңізге (мысалы, 3×4 см) дәл сай келетін БІР суретті шығарады. A4-ке басып шығару көбіне суреттерді созады немесе көшірмелерді топтайды. Дәл 30×40 мм өлшемді PDF экспорттау арқылы кәсіби басып шығару принтерлері canvas метадеректерін оқып, масштабтау қателерінсіз бір көшірмені дәл көрсетілген өлшемде басып шығара алады.',
    },
    {
      question: 'Қолданба Apple HEIC суреттерін қолдай ма?',
      answer: 'Иә! Біз Apple HEIC файлдарын браузерде жергілікті түрде түрлендіруді қолдаймыз. iPhone-нан `.heic` файлын жүктегенде, жүйе оны браузерде автоматты түрде сапалы JPEG форматына айналдырады, осылайша сіз оны сыртқы түрлендіргіш бағдарламаны қолданбай-ақ бірден өңдеп, кесе аласыз.',
    },
    {
      question: 'Өз өлшемімді орната аламын ба?',
      answer: 'Әрине. Стандартты үлгілердің ешқайсысы сіздің талабыңызға сай келмесе (мысалы, белгілі бір елдің виза фото талабы), жай ғана "Өз өлшемі" құсбелгісін қойыңыз. Кез келген ені мен биіктігін енгізіп, қалаған өлшем бірлігін (миллиметр, сантиметр немесе дюйм) таңдай аласыз. Кесу терезесі нақты уақытта өлшемін өзгертеді.',
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
            Жиі қойылатын сұрақтар
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm max-w-lg mx-auto">
            Басып шығару пішімі, ажыратымдылықты есептеу немесе файл қауіпсіздігі жайлы сұрақтарыңыз бар ма? Жауаптарды төменнен табыңыз.
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
