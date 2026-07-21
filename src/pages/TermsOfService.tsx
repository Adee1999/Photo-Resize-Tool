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
            Қызмет көрсету шарттары
          </h1>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 text-sm space-y-6 leading-relaxed">
          <p className="text-slate-900 dark:text-slate-200 font-semibold text-base">
            Соңғы жаңарту: 2026 жылғы 15 шілде
          </p>

          <p>
            <strong>Photo Size Converter</strong>-ды қолданбас бұрын осы Қызмет көрсету шарттарын мұқият оқып шығыңыз. Осы жергілікті құралды пайдалану немесе оған кіру арқылы сіз төмендегі қарапайым шарттарды сақтауға келісесіз.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            1. Қолдану аясы
          </h2>
          <p>
            Бұл қолданба жеке, коммерциялық және білім беру мақсатындағы фото дайындау үшін толығымен тегін ұсынылады. Сізге кез келген өлшемдегі фотосуреттерді (50 МБ шегіне дейін) жүктеп, басып шығаруға дайын өлшемдерге келтіруге рұқсат етіледі.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            2. Төлемдер мен жасырын алымдар жоқ
          </h2>
          <p>
            Бағдарлама 100% тегін. Тіркелу формалары, жазылымдар, премиум сүзгілер, су таңбалар, экспорт шектеулері немесе кез келген түрдегі төлем сұраулары жоқ. Сізден несие карта деректерін немесе банк деректерін ешқашан сұрамаймыз.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            3. Кепілдіктерден бас тарту
          </h2>
          <p>
            Бұл құрал "бар күйінде" және "қолжетімді болғанда" ешбір тікелей немесе жанама кепілдіксіз ұсынылады. Шығыс арақатынастарының математикалық тұрғыда дәл болуын қамтамасыз етуге тырысамыз (мысалы, 3×4 см үлгісі үшін дәл 30×40 мм), дегенмен пайдаланушыларға масштабтау қателерін болдырмау үшін физикалық басып шығару орталықтарында төлем жасамас бұрын соңғы басып шығару масштабын тексеруді ұсынамыз.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            4. Жауапкершілікті шектеу
          </h2>
          <p>
            Қолданба файлдарды тасымалдамайтын немесе сақтамайтындықтан, кенеттен электр қуатының өшуі, кездейсоқ бетті жаңарту немесе құрылғы жүйесінің істен шығуы салдарынан жергілікті жұмыстың жоғалуына жауап бере алмаймыз.
          </p>

          <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider pt-4">
            5. Өзгерістер
          </h2>
          <p>
            Браузердегі өнімділікті жақсарту немесе жаңа өлшем үлгілерін қосу мақсатында осы тегін құралдың мүмкіндіктерін кез келген уақытта жетілдіру немесе өзгерту құқығын өзімізде қалдырамыз.
          </p>
        </div>
      </div>
    </div>
  );
}
