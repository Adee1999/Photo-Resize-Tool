import React from 'react';
import { motion } from 'motion/react';
import { Upload, Sliders, Paintbrush, Square, Download, Printer } from 'lucide-react';

export default function HowItWorks() {
  const steps = [
    {
      icon: Upload,
      title: '1. Қауіпсіз жүктеу',
      description: 'Кез келген JPEG, PNG, WEBP немесе Apple HEIC суретін 50 МБ-қа дейін сүйреп апарыңыз. Фотоңыз толығымен браузеріңізде өңделеді — ол ешқашан алыстағы серверге жүктелмейді, бұл деректеріңіздің толық құпиялылығына кепілдік береді.',
      color: 'bg-blue-500',
    },
    {
      icon: Sliders,
      title: '2. Дәл баптау және туралау',
      description: 'Масштабтаңыз, бұраңыз, аударыңыз және кесу өлшемдерін нақты уақытта реттеңіз. Басты мен бетті дәл туралау үшін стандартты биометриялық паспорт торларын, үштен бір торларын немесе орталық крест сызықтарын қосыңыз.',
      color: 'bg-indigo-500',
    },
    {
      icon: Paintbrush,
      title: '3. Фонды өшіру немесе бояу',
      description: 'Бір батырмамен chroma-key технологиясы арқылы фонды бірден өшіріңіз, белгілі бір түске басып оны жойыңыз немесе дәл маска қылымен нәзік бөлшектерді бояңыз. Ақ, көк, сұр түстерін таңдаңыз немесе өз түсіңізді белгілеңіз.',
      color: 'bg-purple-500',
    },
    {
      icon: Square,
      title: '4. Шығыс өлшемін таңдау',
      description: 'Стандартты халықаралық үлгілердің толық тізімінен таңдаңыз (мысалы, 3x4 см, 3.5x4.5 см, 5x5 см немесе 10x15 см) немесе миллиметрге дейінгі дәлдікпен өз өлшемін теруге болады.',
      color: 'bg-pink-500',
    },
    {
      icon: Printer,
      title: '5. Басып шығару ажыратымдылығын таңдау',
      description: '300 PPI (стандартты басып шығару сапасы), 600 PPI (жоғары анықтық) немесе 900 PPI (өте анық көркем сапа) таңдаңыз. Қолданба жоғалтусыз басып шығаруға кепілдік беретін дұрыс пиксель өлшемдерін автоматты есептейді.',
      color: 'bg-amber-500',
    },
    {
      icon: Download,
      title: '6. Басып шығаруға дайын файлдарды жүктеу',
      description: 'Фотоңызды бірден PNG, JPEG немесе өз өлшеміндегі бір беттік PDF ретінде экспорттаңыз. Шығыс файл көрсетілген нақты физикалық өлшемге сай жасалады — бұл оны кәсіби басып шығаруға бірден дайын етеді.',
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
            Photo Size Converter қалай жұмыс істейді
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-slate-600 dark:text-slate-400 text-base max-w-xl mx-auto"
          >
            Паспорт, виза және кәсіби басып шығару қажеттіліктеріне арналған, браузерде жұмыс істейтін жоғары сапалы Photoshop баламасы.
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
              Фотоларыңызды түрлендіруге дайынсыз ба?
            </h2>
            <p className="text-blue-100 text-sm leading-relaxed">
              Жазылым қажет емес, сервердегі сақтау жоқ, күтпеген су таңбалар жоқ. Жай ғана фотоңызды жүктеп, өз өлшемін баптап, кәсіби деңгейдегі басып шығару файлын бірден жүктеп алыңыз.
            </p>
            <div className="pt-2 flex justify-center md:justify-start">
              <motion.a
                href="/"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white text-blue-600 font-bold px-6 py-3 rounded-xl text-sm shadow-md hover:bg-blue-50 transition-colors"
              >
                Фото редакторды ашу
              </motion.a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
