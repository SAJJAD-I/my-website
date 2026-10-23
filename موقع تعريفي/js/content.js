// كل نصوص الموقع وروابطه هنا: عدّل هذا الملف فقط.
// الرابط الفارغ ('') يعني أن الحساب لم يُضَف بعد.
window.SITE = {
  name: { ar: 'سجاد', en: 'Sajjad' },
  cafeName: { ar: 'مقهى المطر', en: 'RAIN CAFE' },

  bio: {
    ar: [
      'أنا سجاد، أخطو خطوتي الأولى في عالم البرمجة.',
      'جمعتُ في هذه المساحة كل حساباتي.. ولا تنسَ ذكر الله والدعاء لنفسك ولغيرك بالخير.'
    ],
    en: [
      "I'm Sajjad, taking my first steps into programming.",
      "I gathered all my accounts in this space.. and don't forget to remember God and pray for yourself and others."
    ]
  },

  accounts: [
    { id: 'youtube',   label: { ar: 'يوتيوب',  en: 'YouTube' },   handle: '@S191P',           url: 'https://youtube.com/@S191P' },
    { id: 'tiktok',    label: { ar: 'تيك توك', en: 'TikTok' },    handle: '@im_just_muslim7', url: 'https://tiktok.com/@im_just_muslim7' },
    { id: 'instagram', label: { ar: 'انستغرام', en: 'Instagram' }, handle: 'abu_kawthar7',     url: 'https://instagram.com/abu_kawthar7' },
    { id: 'telegram',  label: { ar: 'تيليجرام', en: 'Telegram' },  handle: '@QHDS2',           url: 'https://t.me/QHDS2' },
    { id: 'whatsapp',  label: { ar: 'واتساب',  en: 'WhatsApp' },  handle: '+964 788 350 7864', url: 'https://wa.me/9647883507864' },
    { id: 'github',    label: { ar: 'GitHub',  en: 'GitHub' },    handle: 'SAJJAD-I',         url: 'https://github.com/SAJJAD-I' }
  ],

  // اسم الحساب على GitHub (بدون @) لتظهر المشاريع على كمبيوتر الغرفة
  github: 'SAJJAD-I',

  // أشياء أحبها: تظهر عند لمس رف الغرفة
  likes: {
    ar: ['نص مؤقت: كتاب أحبه', 'نص مؤقت: لعبة أحبها', 'نص مؤقت: شيء أتعلمه هذه الأيام'],
    en: ['Placeholder: a book I love', 'Placeholder: a game I love', "Placeholder: something I'm learning"]
  },

  // قائمة المقهى: تظهر على لوح المشروبات خلف الكاونتر
  menu: {
    ar: [['قهوة عربية', 'بالهيل'], ['شاي', 'مُخدَّر على الفحم'], ['كابتشينو', 'برغوة كثيفة'], ['كرك', 'بالحليب والزعفران'], ['ماء بارد', 'مجانًا']],
    en: [['Arabic coffee', 'with cardamom'], ['Tea', 'brewed over coals'], ['Cappuccino', 'thick foam'], ['Karak', 'milk and saffron'], ['Cold water', 'on the house']]
  },

  // كتب على رف المقهى: تظهر عند لمس رف الكتب داخل المقهى
  cafeBooks: {
    ar: ['كليلة ودمنة', 'ألف ليلة وليلة', 'رحلة ابن بطوطة', 'مقدمة ابن خلدون', 'البخلاء للجاحظ'],
    en: ['Kalila and Dimna', 'One Thousand and One Nights', 'The Travels of Ibn Battuta', 'The Muqaddimah', 'The Misers by al-Jahiz']
  },
  // سطر قصير يظهر عند فتح كل كتاب، بالترتيب نفسه
  cafeBookNotes: {
    ar: ['حكايات على ألسنة الحيوان تحمل الحكمة، نقلها ابن المقفع إلى العربية.', 'حكايات شهرزاد التي تتوالد حكايةً بعد حكاية.', 'رحلة ابن بطوطة الطويلة من طنجة إلى أقاصي الشرق.', 'مقدمة ابن خلدون في العمران وأحوال الأمم.', 'نوادر الجاحظ الطريفة عن البخل وأهله.'],
    en: ['Wisdom told through animal fables, rendered into Arabic by Ibn al-Muqaffa.', "Scheherazade's tales, each opening into the next.", "Ibn Battuta's long journey from Tangier to the far East.", "Ibn Khaldun's study of societies and how nations rise and fall.", "Al-Jahiz's witty stories about misers."]
  },

  ui: {
    ar: {
      board: 'حساباتي',
      door: 'ادخل',
      doorLabel: 'ادخل المقهى',
      close: 'إغلاق',
      lang: 'EN',
      langLabel: 'Switch to English',
      noteTitle: 'تنبيه',
      noteBody: 'لم يُضَف هذا الرابط بعد.',
      house: 'بيتي',
      mosque: 'المسجد',
      cafe: 'المقهى',
      panLeft: 'إلى اليسار',
      panRight: 'إلى اليمين',
      soundOn: 'تشغيل الصوت',
      soundOff: 'كتم الصوت',
      enterHome: 'ادخل البيت',
      enterMosque: 'ادخل المسجد',
      exit: 'اخرج إلى الشارع',
      roomHint: 'المس أي شيء في الغرفة.',
      cafeHint: 'المس أي شيء في المقهى.',
      pc: 'الكمبيوتر',
      tv: 'التلفاز',
      shelf: 'الرف',
      light: 'الضوء',
      pcTitle: 'سطح المكتب',
      pcProjects: 'مشاريعي',
      pcEmpty: 'أضف اسم حسابك على GitHub في ملف المحتوى لتظهر مشاريعك هنا.',
      pcLoading: 'جارٍ جلب المشاريع…',
      pcFail: 'تعذّر جلب المشاريع الآن.',
      tvTitle: 'قناتي',
      tvBody: 'نص مؤقت: هنا يظهر آخر مقطع من قناتي.',
      tvGo: 'اذهب إلى القناة',
      shelfTitle: 'أشياء أحبها'
    },
    en: {
      board: 'Find me',
      door: 'Open',
      doorLabel: 'Step into the café',
      close: 'Close',
      lang: 'ع',
      langLabel: 'التبديل للعربية',
      noteTitle: 'Notice',
      noteBody: "This link hasn't been added yet.",
      house: 'Home',
      mosque: 'Mosque',
      cafe: 'Café',
      panLeft: 'Go left',
      panRight: 'Go right',
      soundOn: 'Sound on',
      soundOff: 'Mute',
      enterHome: 'Enter the house',
      enterMosque: 'Enter the mosque',
      exit: 'Back to the street',
      roomHint: 'Touch anything in the room.',
      cafeHint: 'Touch anything in the café.',
      pc: 'Computer',
      tv: 'TV',
      shelf: 'Shelf',
      light: 'Light',
      pcTitle: 'Desktop',
      pcProjects: 'My projects',
      pcEmpty: 'Add your GitHub username in the content file and your projects appear here.',
      pcLoading: 'Loading projects…',
      pcFail: "Couldn't load the projects right now.",
      tvTitle: 'My channel',
      tvBody: 'Placeholder: my latest video shows up here.',
      tvGo: 'Go to the channel',
      shelfTitle: 'Things I love'
    }
  }
};
