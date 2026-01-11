export type Language = 'en' | 'he' | 'ar';

export type TranslationKey = keyof typeof translations.en;

export const languages: { code: Language; name: string; nativeName: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'he', name: 'Hebrew', nativeName: 'עברית', dir: 'rtl' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', dir: 'rtl' },
];

export const translations = {
  en: {
    // Step 1: Service Selection
    selectService: 'Select a service',
    whatToBook: 'What would you like to book?',
    minutes: 'min',
    
    // Step 2: Date Selection
    chooseDate: 'Choose a date',
    
    // Step 3: Time Selection
    pickTime: 'Pick a time',
    noAvailableTimes: 'No available times',
    tryAnotherDate: 'Try selecting another date',
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    available: 'available',
    
    // Step 4: Details
    almostThere: 'Your Details',
    enterYourDetails: 'Enter your contact information',
    yourAppointment: 'Your Appointment',
    date: 'Date',
    time: 'Time',
    price: 'Price',
    whoIsBookingFor: "Who's this booking for?",
    yourFullName: 'Your full name',
    phoneNumber: 'Phone number',
    whatsappVerification: "We'll send a verification code via WhatsApp",
    contactInfo: 'Contact Information',
    howWeReachYou: "How we'll reach you",
    fullName: 'Full Name',
    enterYourName: 'Enter your name',
    whatsappNumber: 'WhatsApp Number',
    verificationInfo: "We'll send a verification code to this number via WhatsApp to confirm your booking request.",
    verificationHint: "We'll send a code via WhatsApp to verify",
    
    // Step 5: OTP
    verification: 'Verification',
    enterCode: 'Enter the 4-digit code sent to',
    verifyingCode: 'Verifying your code...',
    verified: 'Verified!',
    didntReceiveCode: "Didn't receive the code?",
    resendCode: 'Resend code',
    sending: 'Sending...',
    secondsToResend: 'seconds to resend',
    whatsappHelp: 'Make sure you have WhatsApp installed and your phone number is correct.',
    
    // Step 6: Success
    requestSent: 'Request Sent!',
    requestSubmitted: 'Your appointment request has been submitted',
    service: 'Service',
    notifyWhatsapp: "We'll notify you on WhatsApp once confirmed",
    submitAnother: 'Submit another request',
    
    // Common
    continue: 'Continue',
    back: 'Back',
    loading: 'Loading...',
    error: 'Error',
    tryAgain: 'Try again',
    sendingCode: 'Sending code...',
    errorLoadingDates: 'Unable to load available dates',
    noAvailableDates: 'No available dates this month. Try next month.',
    
    // Weekdays (short)
    sun: 'Su',
    mon: 'Mo',
    tue: 'Tu',
    wed: 'We',
    thu: 'Th',
    fri: 'Fr',
    sat: 'Sa',
    
    // Months
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    may: 'May',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December',
    
    // Weekdays (full)
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    
    // Landing Page
    nailStudio: 'Nail Studio',
    bookNow: 'Book Now',
    nailArt: 'Nail Art',
    redefined: 'Redefined',
    heroDescription: 'Premium nail care crafted with precision and passion in the heart of Nazareth',
    callUs: 'Call Us',
    rating: 'Rating',
    clients: 'Clients',
    experience: 'Experience',
    yearsShort: 'yrs',
    ourWork: 'Our Work',
    swipeToExplore: 'Swipe to explore',
    gelArt: 'Gel Art',
    frenchTips: 'French Tips',
    chrome: 'Chrome',
    ombre: 'Ombré',
    minimalist: 'Minimalist',
    services: 'Services',
    popularTreatments: 'Popular treatments',
    viewAll: 'View All',
    classicManicure: 'Classic Manicure',
    classicManicureDesc: 'Shape, buff, cuticle care & polish',
    gelManicure: 'Gel Manicure',
    gelManicureDesc: 'Long-lasting gel with nail art options',
    luxuryPedicure: 'Luxury Pedicure',
    luxuryPedicureDesc: 'Full treatment with massage & mask',
    popular: 'Popular',
    clientLove: 'Client Love',
    whatClientsSay: 'What our clients say',
    testimonial1: 'Absolutely amazing! Best nail salon in Nazareth. The attention to detail is incredible.',
    testimonial2: 'I\'ve been coming here for years. Always leave with beautiful nails and a smile.',
    testimonial3: 'Professional, clean, and the results are always stunning. Highly recommend!',
    findUs: 'Find Us',
    locatedIn: 'Located in the heart of Nazareth',
    getDirections: 'Get Directions',
    poweredBy: 'Powered by Calendi',
    bookYourAppointment: 'Book Your Appointment',
    hoursWeekdays: 'Sun-Thu',
    hoursFriday: 'Fri',
  },
  
  he: {
    // Step 1: Service Selection
    selectService: 'בחר שירות',
    whatToBook: 'מה תרצה להזמין?',
    minutes: 'דק׳',
    
    // Step 2: Date Selection
    chooseDate: 'בחר תאריך',
    
    // Step 3: Time Selection
    pickTime: 'בחר שעה',
    noAvailableTimes: 'אין שעות פנויות',
    tryAnotherDate: 'נסה לבחור תאריך אחר',
    morning: 'בוקר',
    afternoon: 'צהריים',
    evening: 'ערב',
    available: 'זמינים',
    
    // Step 4: Details
    almostThere: 'הפרטים שלך',
    enterYourDetails: 'הזן את פרטי הקשר שלך',
    yourAppointment: 'התור שלך',
    date: 'תאריך',
    time: 'שעה',
    price: 'מחיר',
    whoIsBookingFor: 'למי התור?',
    yourFullName: 'שם מלא',
    phoneNumber: 'מספר טלפון',
    contactInfo: 'פרטי התקשרות',
    howWeReachYou: 'איך ניצור איתך קשר',
    fullName: 'שם מלא',
    enterYourName: 'הכנס את שמך',
    whatsappNumber: 'מספר וואטסאפ',
    verificationInfo: 'נשלח קוד אימות למספר זה דרך וואטסאפ כדי לאשר את בקשת התור.',
    verificationHint: 'נשלח קוד אימות בוואטסאפ',
    whatsappVerification: 'נשלח קוד אימות בוואטסאפ',
    
    // Step 5: OTP
    verification: 'אימות',
    enterCode: 'הזן את הקוד בן 4 הספרות שנשלח אל',
    verifyingCode: 'מאמת את הקוד...',
    verified: 'אומת!',
    didntReceiveCode: 'לא קיבלת את הקוד?',
    resendCode: 'שלח שוב',
    sending: 'שולח...',
    secondsToResend: 'שניות לשליחה חוזרת',
    whatsappHelp: 'ודא שוואטסאפ מותקן ושמספר הטלפון נכון.',
    
    // Step 6: Success
    requestSent: 'הבקשה נשלחה!',
    requestSubmitted: 'בקשת התור שלך הוגשה בהצלחה',
    service: 'שירות',
    notifyWhatsapp: 'נודיע לך בוואטסאפ כשהתור יאושר',
    submitAnother: 'שלח בקשה נוספת',
    
    // Common
    continue: 'המשך',
    back: 'חזור',
    loading: 'טוען...',
    error: 'שגיאה',
    tryAgain: 'נסה שוב',
    sendingCode: 'שולח קוד...',
    errorLoadingDates: 'לא ניתן לטעון תאריכים פנויים',
    noAvailableDates: 'אין תאריכים פנויים החודש. נסה את החודש הבא.',
    
    // Weekdays (short)
    sun: 'א׳',
    mon: 'ב׳',
    tue: 'ג׳',
    wed: 'ד׳',
    thu: 'ה׳',
    fri: 'ו׳',
    sat: 'ש׳',
    
    // Months
    january: 'ינואר',
    february: 'פברואר',
    march: 'מרץ',
    april: 'אפריל',
    may: 'מאי',
    june: 'יוני',
    july: 'יולי',
    august: 'אוגוסט',
    september: 'ספטמבר',
    october: 'אוקטובר',
    november: 'נובמבר',
    december: 'דצמבר',
    
    // Weekdays (full)
    sunday: 'יום ראשון',
    monday: 'יום שני',
    tuesday: 'יום שלישי',
    wednesday: 'יום רביעי',
    thursday: 'יום חמישי',
    friday: 'יום שישי',
    saturday: 'שבת',
    
    // Landing Page
    nailStudio: 'סטודיו לציפורניים',
    bookNow: 'הזמן עכשיו',
    nailArt: 'אמנות ציפורניים',
    redefined: 'מוגדרת מחדש',
    heroDescription: 'טיפוח ציפורניים פרימיום בדיוק ותשוקה בלב נצרת',
    callUs: 'התקשרו אלינו',
    rating: 'דירוג',
    clients: 'לקוחות',
    experience: 'ניסיון',
    yearsShort: 'שנים',
    ourWork: 'העבודות שלנו',
    swipeToExplore: 'החליקו לגילוי',
    gelArt: "אמנות ג'ל",
    frenchTips: 'פרנץ׳',
    chrome: 'כרום',
    ombre: 'אומברה',
    minimalist: 'מינימליסטי',
    services: 'שירותים',
    popularTreatments: 'טיפולים פופולריים',
    viewAll: 'הצג הכל',
    classicManicure: 'מניקור קלאסי',
    classicManicureDesc: 'עיצוב, ליטוש, טיפול בציפורניים ולכה',
    gelManicure: "מניקור ג'ל",
    gelManicureDesc: "ג'ל עמיד עם אפשרויות לאמנות ציפורניים",
    luxuryPedicure: 'פדיקור יוקרתי',
    luxuryPedicureDesc: 'טיפול מלא עם עיסוי ומסכה',
    popular: 'פופולרי',
    clientLove: 'הלקוחות אוהבים',
    whatClientsSay: 'מה הלקוחות אומרים',
    testimonial1: 'פשוט מדהים! מכון הציפורניים הטוב ביותר בנצרת. תשומת הלב לפרטים מדהימה.',
    testimonial2: 'אני מגיעה לכאן כבר שנים. תמיד יוצאת עם ציפורניים יפות וחיוך.',
    testimonial3: 'מקצועי, נקי, והתוצאות תמיד מרהיבות. ממליצה בחום!',
    findUs: 'מצאו אותנו',
    locatedIn: 'ממוקם בלב נצרת',
    getDirections: 'קבל הוראות הגעה',
    poweredBy: 'מופעל על ידי Calendi',
    bookYourAppointment: 'הזמינו תור',
    hoursWeekdays: 'א׳-ה׳',
    hoursFriday: 'ו׳',
  },
  
  ar: {
    // Step 1: Service Selection
    selectService: 'اختر خدمة',
    whatToBook: 'ماذا تريد أن تحجز؟',
    minutes: 'دقيقة',
    
    // Step 2: Date Selection
    chooseDate: 'اختر تاريخ',
    
    // Step 3: Time Selection
    pickTime: 'اختر وقت',
    noAvailableTimes: 'لا توجد أوقات متاحة',
    tryAnotherDate: 'جرب اختيار تاريخ آخر',
    morning: 'صباحاً',
    afternoon: 'ظهراً',
    evening: 'مساءً',
    available: 'متاح',
    
    // Step 4: Details
    almostThere: 'بياناتك',
    enterYourDetails: 'أدخل معلومات الاتصال الخاصة بك',
    yourAppointment: 'موعدك',
    date: 'التاريخ',
    time: 'الوقت',
    price: 'السعر',
    whoIsBookingFor: 'لمن هذا الحجز؟',
    yourFullName: 'الاسم الكامل',
    phoneNumber: 'رقم الهاتف',
    whatsappVerification: 'سنرسل رمز التحقق عبر واتساب',
    contactInfo: 'معلومات الاتصال',
    howWeReachYou: 'كيف سنتواصل معك',
    fullName: 'الاسم الكامل',
    enterYourName: 'أدخل اسمك',
    whatsappNumber: 'رقم واتساب',
    verificationInfo: 'سنرسل رمز تحقق إلى هذا الرقم عبر واتساب لتأكيد طلب حجزك.',
    verificationHint: 'سنرسل رمز تحقق عبر واتساب',
    
    // Step 5: OTP
    verification: 'التحقق',
    enterCode: 'أدخل الرمز المكون من 4 أرقام المرسل إلى',
    verifyingCode: 'جاري التحقق من الرمز...',
    verified: 'تم التحقق!',
    didntReceiveCode: 'لم تستلم الرمز؟',
    resendCode: 'إعادة الإرسال',
    sending: 'جاري الإرسال...',
    secondsToResend: 'ثانية لإعادة الإرسال',
    whatsappHelp: 'تأكد من تثبيت واتساب وصحة رقم هاتفك.',
    
    // Step 6: Success
    requestSent: 'تم إرسال الطلب!',
    requestSubmitted: 'تم تقديم طلب موعدك بنجاح',
    service: 'الخدمة',
    notifyWhatsapp: 'سنخبرك عبر واتساب عند التأكيد',
    submitAnother: 'تقديم طلب آخر',
    
    // Common
    continue: 'متابعة',
    back: 'رجوع',
    loading: 'جاري التحميل...',
    error: 'خطأ',
    tryAgain: 'حاول مرة أخرى',
    sendingCode: 'جاري إرسال الرمز...',
    errorLoadingDates: 'تعذر تحميل التواريخ المتاحة',
    noAvailableDates: 'لا توجد تواريخ متاحة هذا الشهر. جرب الشهر القادم.',
    
    // Weekdays (short)
    sun: 'أحد',
    mon: 'إثن',
    tue: 'ثلا',
    wed: 'أرب',
    thu: 'خمي',
    fri: 'جمع',
    sat: 'سبت',
    
    // Months
    january: 'يناير',
    february: 'فبراير',
    march: 'مارس',
    april: 'أبريل',
    may: 'مايو',
    june: 'يونيو',
    july: 'يوليو',
    august: 'أغسطس',
    september: 'سبتمبر',
    october: 'أكتوبر',
    november: 'نوفمبر',
    december: 'ديسمبر',
    
    // Weekdays (full)
    sunday: 'الأحد',
    monday: 'الإثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت',
    
    // Landing Page
    nailStudio: 'صالون أظافر',
    bookNow: 'احجز الآن',
    nailArt: 'فن الأظافر',
    redefined: 'بتعريف جديد',
    heroDescription: 'عناية فاخرة بالأظافر بدقة وشغف في قلب الناصرة',
    callUs: 'اتصل بنا',
    rating: 'التقييم',
    clients: 'العملاء',
    experience: 'الخبرة',
    yearsShort: 'سنة',
    ourWork: 'أعمالنا',
    swipeToExplore: 'اسحب للاستكشاف',
    gelArt: 'فن الجل',
    frenchTips: 'فرنسي',
    chrome: 'كروم',
    ombre: 'أومبري',
    minimalist: 'بسيط',
    services: 'الخدمات',
    popularTreatments: 'العلاجات الشائعة',
    viewAll: 'عرض الكل',
    classicManicure: 'مانيكير كلاسيكي',
    classicManicureDesc: 'تشكيل وتلميع والعناية بالبشرة وطلاء',
    gelManicure: 'مانيكير جل',
    gelManicureDesc: 'جل طويل الأمد مع خيارات فن الأظافر',
    luxuryPedicure: 'باديكير فاخر',
    luxuryPedicureDesc: 'علاج كامل مع تدليك وقناع',
    popular: 'شائع',
    clientLove: 'عملاؤنا يحبوننا',
    whatClientsSay: 'ماذا يقول عملاؤنا',
    testimonial1: 'رائع تماماً! أفضل صالون أظافر في الناصرة. الاهتمام بالتفاصيل مذهل.',
    testimonial2: 'أزور هنا منذ سنوات. دائماً أخرج بأظافر جميلة وابتسامة.',
    testimonial3: 'محترف ونظيف والنتائج دائماً مذهلة. أنصح بشدة!',
    findUs: 'موقعنا',
    locatedIn: 'يقع في قلب الناصرة',
    getDirections: 'احصل على الاتجاهات',
    poweredBy: 'مدعوم من Calendi',
    bookYourAppointment: 'احجز موعدك',
    hoursWeekdays: 'أحد-خميس',
    hoursFriday: 'جمعة',
  },
} as const;

export function getTranslation(lang: Language, key: TranslationKey): string {
  return translations[lang][key] || translations.en[key] || key;
}

export function getDirection(lang: Language): 'ltr' | 'rtl' {
  const langConfig = languages.find(l => l.code === lang);
  return langConfig?.dir || 'ltr';
}

export function isRTL(lang: Language): boolean {
  return getDirection(lang) === 'rtl';
}

// Format date in current language: "Weekday, Month Day"
export function formatDateLocalized(date: Date, lang: Language): string {
  const t = translations[lang];
  
  const weekdays = [t.sunday, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday];
  const months = [t.january, t.february, t.march, t.april, t.may, t.june, 
                  t.july, t.august, t.september, t.october, t.november, t.december];
  
  const weekday = weekdays[date.getDay()];
  const month = months[date.getMonth()];
  const day = date.getDate();
  
  return `${weekday}, ${month} ${day}`;
}

// Short format: "Month Day" (e.g., "Jan 7" or "ינואר 7")
export function formatDateShort(date: Date, lang: Language): string {
  const t = translations[lang];
  const months = [t.january, t.february, t.march, t.april, t.may, t.june, 
                  t.july, t.august, t.september, t.october, t.november, t.december];
  
  const month = months[date.getMonth()];
  const day = date.getDate();
  
  // For shorter month display, take first 3 chars for English, full for Hebrew/Arabic
  const shortMonth = lang === 'en' ? month.substring(0, 3) : month;
  
  return `${shortMonth} ${day}`;
}

// Short format with weekday: "Weekday, Month Day" (e.g., "Tue, Jan 7")
export function formatDateShortWithWeekday(date: Date, lang: Language): string {
  const t = translations[lang];
  
  const weekdays = [t.sunday, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday];
  const months = [t.january, t.february, t.march, t.april, t.may, t.june, 
                  t.july, t.august, t.september, t.october, t.november, t.december];
  
  const weekday = weekdays[date.getDay()];
  const month = months[date.getMonth()];
  const day = date.getDate();
  
  // For shorter display, take first 3 chars for English
  const shortWeekday = lang === 'en' ? weekday.substring(0, 3) : weekday;
  const shortMonth = lang === 'en' ? month.substring(0, 3) : month;
  
  return `${shortWeekday}, ${shortMonth} ${day}`;
}

