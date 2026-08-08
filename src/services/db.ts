import { 
  Article, 
  Ingredient, 
  SkinConditionInfo, 
  Product, 
  Achievement, 
  Challenge, 
  DailyTrackerEntry, 
  PhotoProgress, 
  Routine, 
  SkinProfile, 
  LifestyleProfile, 
  MenstrualCycleConfig, 
  CycleSymptom, 
  UserState
} from '../types';
import { getTodayIsoDate } from './jalali';

// Keys for local storage persistence
const STORAGE_KEYS = {
  USER_STATE: 'roza_user_state_v1',
  PRODUCTS: 'roza_products_v1',
  ROUTINES: 'roza_routines_v1',
  DAILY_LOGS: 'roza_daily_logs_v1',
  CYCLE_SYMPTOMS: 'roza_cycle_symptoms_v1',
  PHOTOS: 'roza_photos_v1',
  ACHIEVEMENTS: 'roza_achievements_v1',
  CHALLENGES: 'roza_challenges_v1',
};

// Default User State
export const DEFAULT_USER_STATE: UserState = {
  profile: {
    age: 0,
    gender: 'other',
    city: '',
    occupation: '',
    skinType: 'normal',
    skinTone: 'medium',
    sensitivityScore: 0,
    primaryConcerns: [],
    hairType: 'straight',
    hairConcerns: [],
    isPregnant: false,
    isBreastfeeding: false,
    medications: [],
    allergies: [],
  },
  lifestyle: {
    waterTargetGlasses: 0,
    sleepTargetHours: 0,
    stressLevel: 'medium',
    exerciseDaysPerWeek: 0,
    sunExposureHours: 0,
    junkFoodFrequency: 'rarely',
    sugarIntake: 'low',
    isSmoking: false,
  },
  cycleConfig: {
    enabled: false,
    lastPeriodDate: '',
    cycleLength: 0,
    periodLength: 0,
    regularity: 'regular',
    pmsStartDaysBefore: 0,
  },
  userXp: 0,
  userLevel: 1,
  currentStreakDays: 0,
  bestStreakDays: 0,
  onboardingCompleted: false,
  themeMode: 'light',
  notifications: { enabled: true, morningRoutine: true, morningHour: 9, morningMinute: 0, nightRoutine: true, nightHour: 21, nightMinute: 0, cycleInsight: true },
};

// Initial Ingredients Intelligence Database (Sample dataset containing major active ingredients)
export const INGREDIENTS_DATABASE: Ingredient[] = [
  {
    id: 'ing_niacinamide',
    name: 'Niacinamide (Vitamin B3)',
    nameFa: 'نیاسینامید (ویتامین B3)',
    category: 'active',
    benefitsFa: ['تنظیم ترشح چربی پوست', 'کاهش التیام و قرمزی جوش', 'کم‌رنگ کردن لک‌های تیره', 'کاهش سایز منافذ'],
    suitableSkinTypes: ['dry', 'oily', 'combination', 'normal', 'sensitive', 'dehydrated'],
    avoidSkinTypes: [],
    usageTime: 'both',
    pregnancySafety: 'safe',
    breastfeedingSafety: 'safe',
    compatibleIngredients: ['Hyaluronic Acid', 'Zinc', 'Peptides', 'Ceramides', 'Salicylic Acid'],
    avoidCombining: ['Vitamin C (L-Ascorbic Acid با غلظت بالای همزمان)'],
    irritationRisk: 'low',
    descriptionFa: 'نیاسینامید یکی از ایمن‌ترین و محبوب‌ترین ترکیبات مراقبت از پوست است که سد دفاعی پوست را تقویت کرده و تولید سِـبوم (چربی) را متعادل می‌کند.',
  },
  {
    id: 'ing_retinol',
    name: 'Retinol (Vitamin A)',
    nameFa: 'رتینول (ویتامین A)',
    category: 'active',
    benefitsFa: ['تحریک کلاژن‌سازی', 'کاهش خطوط ریز و چروک', 'درمان جوش‌های سرسیاه و زیرپوستی', 'یکدست‌سازی بافت پوست'],
    suitableSkinTypes: ['oily', 'combination', 'normal', 'dry'],
    avoidSkinTypes: ['sensitive'],
    usageTime: 'night',
    pregnancySafety: 'avoid',
    breastfeedingSafety: 'avoid',
    compatibleIngredients: ['Hyaluronic Acid', 'Niacinamide', 'Ceramides'],
    avoidCombining: ['Salicylic Acid', 'Glycolic Acid', 'Vitamin C', 'Benzoyl Peroxide'],
    sideEffectsFa: 'ممکن است در ۲ تا ۴ هفته اول باعث پوسته ریزی خفیف، خشکی یا سوزش (دیریتینولایزیشن) شود.',
    irritationRisk: 'high',
    descriptionFa: 'طلاداران ضدپیری و نوسازی سلولی! رتینول سرعت گردش سلولی را افزایش داده و پوست را جوان‌تر و شفاف‌تر می‌کند. حتماً فقط شب‌ها استفاده شود و مصرف ضدآفتاب در روز بعد الزامی است.',
  },
  {
    id: 'ing_salicylic_acid',
    name: 'Salicylic Acid (BHA)',
    nameFa: 'سالیسیلیک اسید (BHA)',
    category: 'exfoliant',
    benefitsFa: ['حل کردن چربی داخل منافذ', 'درمان جوش‌های سرسیاه و سرسفید', 'ضدالتهاب و آنتی‌باکتریال'],
    suitableSkinTypes: ['oily', 'combination'],
    avoidSkinTypes: ['dry', 'sensitive'],
    usageTime: 'both',
    pregnancySafety: 'consult_doctor',
    breastfeedingSafety: 'safe',
    compatibleIngredients: ['Niacinamide', 'Hyaluronic Acid', 'Tea Tree Oil'],
    avoidCombining: ['Retinol', 'Glycolic Acid', 'Vitamin C'],
    irritationRisk: 'moderate',
    descriptionFa: 'یک لایه‌بردار محلول در چربی که به عمق منافذ نفوذ کرده و انسدادهای چربی و سلول‌های مرده را حل می‌کند.',
  },
  {
    id: 'ing_hyaluronic_acid',
    name: 'Hyaluronic Acid',
    nameFa: 'هیالورونیک اسید',
    category: 'hydrator',
    benefitsFa: ['جذب رطوبت تا ۱۰۰۰ برابر وزن خود', 'پرکننده خطوط ناشی از کم‌آبی', 'شاداب‌کننده فوری پوست'],
    suitableSkinTypes: ['dry', 'oily', 'combination', 'normal', 'sensitive', 'dehydrated'],
    avoidSkinTypes: [],
    usageTime: 'both',
    pregnancySafety: 'safe',
    breastfeedingSafety: 'safe',
    compatibleIngredients: ['تمام ترکیبات پوستی compatible است'],
    avoidCombining: [],
    irritationRisk: 'low',
    descriptionFa: 'آب‌رسان فوق‌العاده قوی که رطوبت محیط را به سمت خود کشیده و پوست را تپل، نرم و شاداب نگه می‌دارد.',
  },
  {
    id: 'ing_vitamin_c',
    name: 'Vitamin C (L-Ascorbic Acid)',
    nameFa: 'ویتامین C (آنتی‌اکسیدان)',
    category: 'antioxidant',
    benefitsFa: ['خنثی‌سازی رادیکال‌های آزاد', 'روشن‌کننده و شفاف‌کننده پوست', 'کمک به ساخت کلاژن', 'محافظت در برابر آسیب آفتاب'],
    suitableSkinTypes: ['dry', 'normal', 'combination'],
    avoidSkinTypes: ['sensitive'],
    usageTime: 'morning',
    pregnancySafety: 'safe',
    breastfeedingSafety: 'safe',
    compatibleIngredients: ['Vitamin E', 'Ferulic Acid', 'Hyaluronic Acid', 'Sunscreen'],
    avoidCombining: ['Retinol', 'Niacinamide (همزمان در یک روتین)', 'AHAs/BHAs'],
    irritationRisk: 'moderate',
    descriptionFa: 'سپر دفاعی روزانه پوست شما در برابر آلودگی و آفتاب! بهترین مکمل برای ضدآفتاب شما در روتین صبح.',
  },
  {
    id: 'ing_ceramides',
    name: 'Ceramides',
    nameFa: 'سرامیدها (ترمیم‌کننده سد دفاعی)',
    category: 'barrier_repair',
    benefitsFa: ['ترمیم سد دفاعی آسیب‌دیده', 'جلوگیری از تبخیر رطوبت پوست', 'کاهش حس سوزش و کشیدگی'],
    suitableSkinTypes: ['dry', 'sensitive', 'dehydrated', 'combination', 'normal', 'oily'],
    avoidSkinTypes: [],
    usageTime: 'both',
    pregnancySafety: 'safe',
    breastfeedingSafety: 'safe',
    compatibleIngredients: ['Retinol', 'AHAs', 'BHAs', 'Niacinamide', 'Hyaluronic Acid'],
    avoidCombining: [],
    irritationRisk: 'low',
    descriptionFa: 'چسب‌های طبیعی بین سلول‌های پوست! سرامیدها سد محافظتی پوست شما را نفوذناپذیر کرده و رطوبت را حفظ می‌کنند.',
  },
  {
    id: 'ing_azelaic_acid',
    name: 'Azelaic Acid',
    nameFa: 'آزلائیک اسید',
    category: 'active',
    benefitsFa: ['درمان رزاسه و قرمزی پوست', 'کم‌رنگ کردن لک‌های لکه‌دار و ملاسما', 'ضدجوش ملایم'],
    suitableSkinTypes: ['sensitive', 'dry', 'oily', 'combination', 'normal'],
    avoidSkinTypes: [],
    usageTime: 'both',
    pregnancySafety: 'safe',
    breastfeedingSafety: 'safe',
    compatibleIngredients: ['Niacinamide', 'Hyaluronic Acid', 'Centella Asiatica'],
    avoidCombining: ['پیلینگ‌های شیمایی شدید'],
    irritationRisk: 'low',
    descriptionFa: 'یک ماده جادویی برای پوست‌های حساس و مبتلا به رزاسه یا لک! حتی در دوران بارداری نیز با تایید پزشک قابل استفاده است.',
  },
  {
    id: 'ing_centella',
    name: 'Centella Asiatica (Cica)',
    nameFa: 'سنتلا آسیاتیکا (سیکا)',
    category: 'soother',
    benefitsFa: ['التیام‌بخش فوق‌العاده سریع', 'کاهش التهاب و سوزش پوست', 'بازسازی بافت آسیب‌دیده'],
    suitableSkinTypes: ['sensitive', 'dry', 'oily', 'combination', 'normal', 'dehydrated'],
    avoidSkinTypes: [],
    usageTime: 'both',
    pregnancySafety: 'safe',
    breastfeedingSafety: 'safe',
    compatibleIngredients: ['همه ترکیبات'],
    avoidCombining: [],
    irritationRisk: 'low',
    descriptionFa: 'گیاه معجزه‌آسای التیام‌بخش آسیایی! اگر پوستتان قرمز یا دچار التهاب شده، سیکا سریعاً آرامش را به پوست برمی‌گرداند.',
  },
  {
    id: 'ing_zinc_pca',
    name: 'Zinc PCA',
    nameFa: 'زینک پی‌سی‌ای',
    category: 'active',
    benefitsFa: ['مات‌کننده چربی اضافی پوست', 'ضدمیکروب و ضدباکتری عامل آکنه', 'کاهش منافذ باز'],
    suitableSkinTypes: ['oily', 'combination'],
    avoidSkinTypes: ['dry'],
    usageTime: 'both',
    pregnancySafety: 'safe',
    breastfeedingSafety: 'safe',
    compatibleIngredients: ['Niacinamide', 'Salicylic Acid'],
    avoidCombining: [],
    irritationRisk: 'low',
    descriptionFa: 'ترکیب زینک و عامل مرطوب‌کننده طبیعی پوست که چربی بی‌رویه را کنترل کرده و از ایجاد جوش‌های جدید جلوگیری می‌کند.',
  },
  {
    id: 'ing_panthenol',
    name: 'Panthenol (Pro-Vitamin B5)',
    nameFa: 'پانتنول (پرو ویتامین B5)',
    category: 'soother',
    benefitsFa: ['آب‌رسانی عمیق', 'تسکین خارش و سوزش', 'افزایش انعطاف‌پذیری پوست'],
    suitableSkinTypes: ['dry', 'sensitive', 'dehydrated', 'normal', 'combination', 'oily'],
    avoidSkinTypes: [],
    usageTime: 'both',
    pregnancySafety: 'safe',
    breastfeedingSafety: 'safe',
    compatibleIngredients: ['تمامی ترکیبات'],
    avoidCombining: [],
    irritationRisk: 'low',
    descriptionFa: 'پانتنول پس از جذب تبدیل به ویتامین B5 شده و مانند مرهمی نرم، خشکی و التهاب را تسکین می‌دهد.',
  }
];

// Initial Skin Condition Encyclopedia Database (20 Complete Conditions)
export const SKIN_CONDITIONS_DATABASE: SkinConditionInfo[] = [
  {
    id: 'cond_acne',
    nameFa: 'آکنه و جوش (Acne & Blemishes)',
    summaryFa: 'التهاب منافذ پوست ناشی از تجمع چربی (سبوم)، سلول‌های مرده و باکتری آکنه.',
    descriptionFa: 'آکنه می‌تواند به دلایل هورمونی، تغییرات چرخه ماهانه، استرس، تغذیه یا روتین نامناسب ایجاد شود. در فاز لوتئال (PMS)، افزایش پروژسترون و تستوسترون نسبی باعث افزایش ترشح چربی و ایجاد جوش می‌شود.',
    symptomsFa: ['جوش‌های سرسیاه و سرسفید', 'جوش‌های التهابی قرمز و دردناک', 'جوش‌های زیرپوستی (کومدون)'],
    possibleCausesFa: ['تغییرات هورمونی چرخه ماهانه', 'چربی زیاد پوست', 'استرس و کم‌خوابی', 'استفاده از محصولات کومدون‌زا'],
    lifestyleFactorsFa: ['کاهش مصرف قند و چربی اشباع', 'تعویض منظم روبالشتی', 'عدم دستکاری و فشار دادن جوش‌ها'],
    recommendedHabitsFa: ['استفاده از شوینده سالیسیلیک اسید', 'مصرف نیاسینامید در روتین روزانه', 'استفاده از مرطوب‌کننده فاقد چربی (Oil-Free)'],
    suitableIngredients: ['سالیسیلیک اسید (BHA)', 'نیاسینامید', 'زینک', 'آزلائیک اسید', 'عصاره درخت چای'],
    avoidIngredients: ['روغن‌های سنگین مانند روغن نارگیل', 'ترکیبات کومدون‌زا (Comedogenic)', 'عطرهای مصنوعی شدید'],
    imageUrl: '/assets/conditions/cond_acne.svg',
  },
  {
    id: 'cond_rosacea',
    nameFa: 'رزاسه و قرمزی حساس (Rosacea & Flushing)',
    summaryFa: 'عارضه مزمن پوستی با علائم قرمزی، رگ‌های گشادشده و حساسیت شدید به دما و استرس.',
    descriptionFa: 'پوست‌های مبتلا به رزاسه دارای سد دفاعی بسیار شکننده هستند. هرگونه لایه‌برداری فیزیکی یا اسیدهای قوی می‌تواند باعث گرگرفتگی و سوزش شدید شود.',
    symptomsFa: ['قرمزی مداوم گونه‌ها و بینی', 'احساس سوزش و داغی پوست', 'رگ‌های خونی ریز نمایان'],
    possibleCausesFa: ['حساسیت ژنتیکی', 'غذاهای تند و داغ', 'تغییرات ناگهانی دما', 'استرس عصبی'],
    lifestyleFactorsFa: ['اجناب از آب داغ هنگام شستشو', 'کاهش استرس با تمرینات تنفسی', 'استفاده مداوم از ضدآفتاب مینرال'],
    recommendedHabitsFa: ['استفاده از محصولات حاوی سنتلا (سیکا)', 'روتین بسیار ساده و مینیمال', 'اجتناب از اسکراب فیزیکی'],
    suitableIngredients: ['آزلائیک اسید', 'سنتلا آسیاتیکا (Cica)', 'پانتنول', 'سرامیدها'],
    avoidIngredients: ['الکل ساده', 'عطر و اسانس', 'سالیسیلیک اسید با غلظت بالا', 'ویتامین C خالص اسیدی'],
    imageUrl: '/assets/conditions/cond_rosacea.svg',
  },
  {
    id: 'cond_hyperpigmentation',
    nameFa: 'لک و تیرگی پوست (Hyperpigmentation & Melasma)',
    summaryFa: 'تولید بیش از حد رنگدانه ملانین ناشی از آفتاب، جا ماندن جای جوش یا ملاسما هورمونی.',
    descriptionFa: 'لک‌ها زمانی ایجاد می‌شوند که سلول‌های ملانوسیت در پاسخ به آسیب آفتاب یا التهاب جوش (PIH) ملانین بیشتری تولید می‌کنند.',
    symptomsFa: ['لک‌های قهوه‌ای به جا مانده از جوش', 'ملاسما (لک‌های بارداری یا هورمونی)', 'نایکدستی رنگ پوست'],
    possibleCausesFa: ['اشعه ماوراء بنفش آفتاب (UV)', 'دستکاری جوش‌ها', 'تغییرات استروژن و پروژسترون'],
    lifestyleFactorsFa: ['تجدید ضدآفتاب هر ۲ ساعت یک‌بار', 'استفاده از کلاه و عینک آفتابی'],
    recommendedHabitsFa: ['استفاده از ویتامین C در روتین صبح', 'مصرف آزلائیک اسید یا نیاسینامید', 'استفاده از رتینول شبانه'],
    suitableIngredients: ['ویتامین C', 'نیاسینامید', 'آزلائیک اسید', 'ترانگزامیک اسید', 'آربوتین', 'رتینول'],
    avoidIngredients: ['آفتاب گرفتن بدون پوشش ضدآفتاب', 'محصولات لایه‌بردار بدون مرطوب‌کننده'],
    imageUrl: '/assets/conditions/cond_hyperpigmentation.svg',
  },
  {
    id: 'cond_dehydration',
    nameFa: 'کم‌آبی پوست (Dehydrated Skin)',
    summaryFa: 'کمبود آب در لایه‌های سطحی پوست که هم در پوست خشک و هم در پوست چرب رخ می‌دهد.',
    descriptionFa: 'پوست دهیدراته یک "نوع" پوست نیست، بلکه یک "وضعیت" موقت است. حتی پوست‌های چرب هم می‌توانند دهیدراته باشند و در نتیجه چربی بیشتری تولید کنند تا کم‌آبی را جبران کنند!',
    symptomsFa: ['احساس کشیدگی همراه با برق افتادن چربی', 'خطوط ریز ناشی از خشکی', 'کدر شدن چهره'],
    possibleCausesFa: ['مصرف کم آب', 'آب و هوای خشک یا باد', 'شستشوی زیاد با شوینده‌های قوی'],
    lifestyleFactorsFa: ['نوشیدن حداقل ۸ لیوان آب در روز', 'استفاده از دستگاه بخار سرد در اتاق'],
    recommendedHabitsFa: ['استفاده از هیالورونیک اسید روی پوست نم‌دار', 'قفـل کردن رطوبت با آبرسان مناسب'],
    suitableIngredients: ['هیالورونیک اسید', 'گلیسیرین', 'پانتنول', 'آلوئه‌ورا', 'سرامیدها'],
    avoidIngredients: ['تونرهای حاوی الکل خشک‌کننده', 'شوینده‌های صابونی شدید'],
    imageUrl: '/assets/conditions/cond_dehydration.svg',
  },
  {
    id: 'cond_pores',
    nameFa: 'منافذ باز و بزرگ (Enlarged Pores)',
    summaryFa: 'گشاد شدن منافذ پوست به دلیل چربی اضافی، کاهش الاستیسیته یا انسداد سلول‌های مرده.',
    descriptionFa: 'منافذ پوست عضلاتی برای باز و بسته شدن ندارند، اما تمیز نگه داشتن آن‌ها و تحریک کلاژن‌سازی باعث کوچک‌تر دیده شدن آن‌ها می‌شود.',
    symptomsFa: ['بافت سوراخ سوراخ رو گونه و بینی', 'برق افتادن چربی', 'تجمع جوش سرسیاه'],
    possibleCausesFa: ['وراثت', 'ترشح بالای چربی', 'کاهش کلاژن در اثر سن و آفتاب'],
    lifestyleFactorsFa: ['شستشوی منظم دو مرحله‌ای شبانه', 'پرهیز از خوابیدن با آرایش'],
    recommendedHabitsFa: ['استفاده از سرم نیاسینامید ۱۰٪', 'لایه‌برداری هفته‌ای ۲ بار با BHA'],
    suitableIngredients: ['نیاسینامید', 'سالیسیلیک اسید', 'زینک PCA', 'رتینول'],
    avoidIngredients: ['کرم‌های سنگین و چرب سنگین'],
    imageUrl: '/assets/conditions/cond_pores.svg',
  },
  {
    id: 'cond_dark_circles',
    nameFa: 'تیرگی و پف دور چشم (Dark Circles & Puffiness)',
    summaryFa: 'کبود شدن یا متورم شدن پوست نازک اطراف چشم به دلایل ژنتیکی، کم‌خوابی یا خستگی عروقی.',
    descriptionFa: 'پوست دور چشم ۵ برابر نازک‌تر از سایر مناطق صورت است و نازک شدن آن عروق زیرین را بیشتر نمایان می‌سازد.',
    symptomsFa: ['حلقه سایه‌دار بنفش یا قهوه‌ای زیر چشم', 'پف صبحگاهی'],
    possibleCausesFa: ['کم‌خوابی', 'کار زیاد با گوشی و مانیتور', 'آلژیک بودن و مالش چشم'],
    lifestyleFactorsFa: ['خواب خواب ۷-۸ ساعته', 'کمپرس خنک صبحگاهی'],
    recommendedHabitsFa: ['استفاده از کرم دور چشم حاوی کافئین و پپتید'],
    suitableIngredients: ['کافئین', 'هیالورونیک اسید', 'پپتیدها', 'ویتامین K'],
    avoidIngredients: ['عطر شدید در محصولات دور چشم'],
    imageUrl: '/assets/conditions/cond_dark_circles.svg',
  },
  {
    id: 'cond_eczema',
    nameFa: 'اگزما و درماتیت اتوپیک (Eczema)',
    summaryFa: 'التهاب مزمن همراه با خارش شدید، خشکی و قرمزی پوست.',
    descriptionFa: 'اگزما در اثر نقص ژنتیکی در ساخت پروتئین فیلاگرین ایجاد شده و سد دفاعی پوست را شکننده می‌کند.',
    symptomsFa: ['پوسته‌پوسته شدن شدید', 'خارش آزاردهنده', 'قرمزی و تَرَک'],
    possibleCausesFa: ['آلرژن‌های محیطی', 'هوای بسیار خشک', 'شوینده‌های حاوی سولفات'],
    lifestyleFactorsFa: ['استفاده از شوینده‌های بدون کف و صابون', 'پوشیدن لباس‌های نخی'],
    recommendedHabitsFa: ['استفاده بلافاصله از لوسیون سرامید بعد از حمام'],
    suitableIngredients: ['سرامیدها', 'کلوئید جو دو سر', 'گلیسیرین', 'پانتنول'],
    avoidIngredients: ['اسیدهای لایه‌بردار', 'عطر و اسانس'],
    imageUrl: '/assets/conditions/cond_eczema.svg',
  },
  {
    id: 'cond_wrinkles',
    nameFa: 'چروک‌های ریز و پیری زودرس (Fine Lines & Aging)',
    summaryFa: 'کاهش کلاژن و الاستین در اثر آفتاب، سن و رادیکال‌های آزاد.',
    descriptionFa: 'از سن ۲۵ سالگی، تولید کلاژن طبیعی پوست سالانه حدود ۱٪ کاهش می‌یابد که با روتین مناسب می‌توان روند آن را معکوس یا کُند کرد.',
    symptomsFa: ['خطوط پنجه کلاغی دور چشم', 'خط اخم و خنده', 'افتادگی شادابی'],
    possibleCausesFa: ['اشعه UV آفتاب', 'سیگار و آلودگی', 'کاهش رطوبت عمیق'],
    lifestyleFactorsFa: ['استفاده روزانه از ضدآفتاب', 'مصرف آنتی‌اکسیدان‌های خوراکی'],
    recommendedHabitsFa: ['استفاده از رتینول شبانه', 'مصرف پپتیدها و ویتامین C'],
    suitableIngredients: ['رتینول', 'پپتیدها', 'ویتامین C', 'هیالورونیک اسید'],
    avoidIngredients: ['شستشوی خشن و خشک‌کننده'],
    imageUrl: '/assets/conditions/cond_wrinkles.svg',
  },
  {
    id: 'cond_dullness',
    nameFa: 'کدری و خستگی چهره (Dull & Tired Skin)',
    summaryFa: 'تجمع سلول‌های مرده در سطح پوست و کاهش گردش خون مویرگی.',
    descriptionFa: 'وقتی سرعت نوسازی سلولی کند می‌شود، نور از سطح پوست به خوبی منعکس نشده و چهره کدر به نظر می‌رسد.',
    symptomsFa: ['چهره خسته و بی‌روح', 'بافت ناصاف', 'عدم انعکاس نور'],
    possibleCausesFa: ['استرس', 'کم‌خوابی', 'عدم لایه‌برداری منظم'],
    lifestyleFactorsFa: ['ورزش منظم', 'نوشیدن آب کافی'],
    recommendedHabitsFa: ['لایه‌برداری هفته‌ای ۱-۲ بار با AHA', 'سرم ویتامین C صبح‌ها'],
    suitableIngredients: ['گلیکولیک اسید (AHA)', 'ویتامین C', 'عصاره برنج'],
    avoidIngredients: ['سیگار و شوینده‌های سنگین'],
    imageUrl: '/assets/conditions/cond_dullness.svg',
  },
  {
    id: 'cond_milia',
    nameFa: 'میلیا و برجستگی‌های زیرپوستی (Milia)',
    summaryFa: 'کیست‌های کوچک کراتینی سفید رنگ تحت لایه بیرونی پوست.',
    descriptionFa: 'میلیا با جوش سرسفید متفاوت است و فشار دادن آن باعث آسیب به پوست می‌شود.',
    symptomsFa: ['برجستگی‌های ریز سفت سفید رنگ دور چشم و گونه'],
    possibleCausesFa: ['استفاده از کرم‌های بسیار سنگین دور چشم', 'عدم لایه‌برداری'],
    lifestyleFactorsFa: ['استفاده از کرم‌های دور چشم با بافت ژلی سبک'],
    recommendedHabitsFa: ['مصرف ملایم سرم AHA/BHA در صورت نیاز'],
    suitableIngredients: ['سالیسیلیک اسید ملایم', 'رتینول ضعیف'],
    avoidIngredients: ['روغن‌های بسیار سنگین زبر'],
    imageUrl: '/assets/conditions/cond_milia.svg',
  },
  {
    id: 'cond_hormonal_acne',
    nameFa: 'جوش‌های هورمونی فک و چانه (Hormonal Jawline Acne)',
    summaryFa: 'جوش‌های دردناک و عمیق ناحیه پایین صورت ناشی از نوسانات چرخه ماهانه.',
    descriptionFa: 'در روزهای قبل از پریود (فاز PMS) افرایش پروژسترون چربی پوست را غلیظ کرده و جوش‌های زیرپوستی چانه را ایجاد می‌کند.',
    symptomsFa: ['جوش‌های قرمز عمیق و دردناک در خط فک و چانه'],
    possibleCausesFa: ['نوسانات استروژن/پروژسترون', 'استرس بالا'],
    lifestyleFactorsFa: ['کاهش مصرف قندهای مصنوعی در فاز PMS'],
    recommendedHabitsFa: ['استفاده از سرم سالیسیلیک اسید و آزلائیک اسید پیشگیرانه'],
    suitableIngredients: ['سالیسیلیک اسید', 'آزلائیک اسید', 'نیاسینامید', 'زینک'],
    avoidIngredients: ['کرم‌های چرب سنگین'],
    imageUrl: '/assets/conditions/cond_hormonal_acne.svg',
  },
  {
    id: 'cond_sebum',
    nameFa: 'چربی بی‌رویه و برق افتادن (Sebum Overproduction)',
    summaryFa: 'ترشح بیش از حد غدد سباسه که باعث برق افتادن مداوم صورت می‌شود.',
    descriptionFa: 'شستشوی زیاد با شوینده‌های خشن باعث دهیدراته شدن پوست و ترشح بیشتر چربی می‌شود!',
    symptomsFa: ['برق افتادن شدید صورت پس از ۱ ساعت از شستشو'],
    possibleCausesFa: ['ژنتیک', 'شستشوی بیش از حد', 'هورمون‌های آندروژن'],
    lifestyleFactorsFa: ['استفاده از کاغذهای جذب‌کننده چربی'],
    recommendedHabitsFa: ['استفاده از آبرسان‌های Oil-Free ژلی', 'نیاسینامید'],
    suitableIngredients: ['نیاسینامید', 'زینک PCA', 'چای سبز'],
    avoidIngredients: ['الکل خشک‌کننده'],
    imageUrl: '/assets/conditions/cond_sebum.svg',
  },
  {
    id: 'cond_damaged_barrier',
    nameFa: 'آسیب سد دفاعی و سوزش (Damaged Skin Barrier)',
    summaryFa: 'تخریب لایه محافظتی اپیدرم در اثر زیاده‌روی در مصرف اسیدها یا رتینول.',
    descriptionFa: 'وقتی سد دفاعی آسیب می‌بیند، حتی ساده‌ترین آب خنک هم ممکن است باعث سوزش شود.',
    symptomsFa: ['سوزش شدید', 'قرمزی ناگهانی', 'جوش‌های ریز خارش‌دار'],
    possibleCausesFa: ['استفاده همزمان چندین لایه‌بردار', 'شوینده خشن'],
    lifestyleFactorsFa: ['توقف کامل تمام اسیدها برای ۲ هفته'],
    recommendedHabitsFa: ['استفاده از کرم‌های ترمیم‌کننده سرامید و سیکا'],
    suitableIngredients: ['سرامیدها', 'سنتلا (سیکا)', 'پانتنول B5'],
    avoidIngredients: ['هر نوع اسید یا رتینول یا عطر'],
    imageUrl: '/assets/conditions/cond_damaged_barrier.svg',
  },
  {
    id: 'cond_flaky_skin',
    nameFa: 'پوسته‌پوسته شدن و خشکی شدید (Flaky Dry Skin)',
    summaryFa: 'کمبود چربی‌های طبیعی و لیپید در پوست‌های بسیار خشک.',
    descriptionFa: 'پوست خشک نیازمند هر دو عامل هومکتانت (جذب آب) و امولینت (چربی مغذی) است.',
    symptomsFa: ['پوسته ریزی در اطراف بینی و ابروها', 'خارش و سفتی'],
    possibleCausesFa: ['آب و هوای سرد و خشک', 'کمبود لیپید'],
    lifestyleFactorsFa: ['استفاده از مرطوب‌کننده‌های غنی غلیظ'],
    recommendedHabitsFa: ['استفاده از روغنی‌های سبک خمیر شده مثل اسکوالان'],
    suitableIngredients: ['اسکوالان', 'شی باتر', 'سرامیدها'],
    avoidIngredients: ['شوینده‌های فوم دار خشن'],
    imageUrl: '/assets/conditions/cond_flaky_skin.svg',
  },
  {
    id: 'cond_fungal_acne',
    nameFa: 'آکنه قارچی / مالاسزیا (Fungal Acne)',
    summaryFa: 'رشد بیش از حد قارچ مالاسزیا در فولیکول‌های مو.',
    descriptionFa: 'با آکنه معمولی متفاوت است و به درمان‌های ضدباکتری پاسخ نمی‌دهد.',
    symptomsFa: ['جوش‌های بسیار ریز هم‌اندازه خارش‌دار رو پیشانی و سینه'],
    possibleCausesFa: ['تعریق زیاد', 'استفاده از روغن‌های تغذیه‌کننده قارچ'],
    lifestyleFactorsFa: ['تعویض فوری لباس‌های ورزشی خیس'],
    recommendedHabitsFa: ['استفاده از محصولات Fungal-Acne Safe فاقد روغن'],
    suitableIngredients: ['سالیسیلیک اسید', 'عصاره درخت چای'],
    avoidIngredients: ['بیشتر روغن‌های طبیعی و اسیدهای چرب'],
    imageUrl: '/assets/conditions/cond_fungal_acne.svg',
  },
  {
    id: 'cond_pie',
    nameFa: 'لک‌های قرمز جای جوش (PIE - Post Inflammatory Erythema)',
    summaryFa: 'قرمزی بجا مانده از لکه‌های التهابی مویرگی پس از بهبود جوش.',
    descriptionFa: 'این لک‌ها ملانین نیستند بلکه ناشی از مویرگ‌های متورم شده زیر پوست هستند.',
    symptomsFa: ['لک‌های قرمز یا صورتی صاف در محل جوش‌های قبلی'],
    possibleCausesFa: ['فشار دادن و دستکاری جوش‌ها'],
    lifestyleFactorsFa: ['پرهیز اکید از دستکاری جوش'],
    recommendedHabitsFa: ['استفاده از آزلائیک اسید و نیاسینامید و سیکا'],
    suitableIngredients: ['آزلائیک اسید', 'نیاسینامید', 'سنتلا آسیاتیکا'],
    avoidIngredients: ['اسکراب‌های دانه درشت زبر'],
    imageUrl: '/assets/conditions/cond_pie.svg',
  },
  {
    id: 'cond_blackheads',
    nameFa: 'جوش‌های سرسیاه بینی و چانه (Blackheads)',
    summaryFa: 'منافذ باز پر شده از چربی و سلول مرده که در مجاورت هوا اکسید شده و سیاه می‌شوند.',
    descriptionFa: 'سیاهی آنها کثیفی نیست بلکه اکسیداسیون چربی در مجاورت اکسیژن هوا است.',
    symptomsFa: ['نقاط کوچک سیاه روی بینی و چانه'],
    possibleCausesFa: ['عدم لایه‌برداری منظم منافذ'],
    lifestyleFactorsFa: ['استفاده از روش شستشوی دو مرحله‌ای روغن + شوینده'],
    recommendedHabitsFa: ['سرم سالیسیلیک اسید ۲٪'],
    suitableIngredients: ['سالیسیلیک اسید (BHA)', 'خاک رس'],
    avoidIngredients: ['چسب‌های بینی چسبنده خشن'],
    imageUrl: '/assets/conditions/cond_blackheads.svg',
  },
  {
    id: 'cond_whiteheads',
    nameFa: 'جوش سرسفید و کومدون بسته (Closed Comedones)',
    summaryFa: 'منافذ مسدود شده توسط لایه‌ای از سلول‌های مرده پوستی.',
    descriptionFa: 'به صورت برجستگی‌های کوچک پوستی رنگ روی پیشانی و گونه دیده می‌شوند.',
    symptomsFa: ['برجستگی‌های ریز پوستی بدون التهاب قرمز'],
    possibleCausesFa: ['تجمع سلول مرده و محصولات سنگین'],
    lifestyleFactorsFa: ['استفاده از لایه‌بردار AHA مثل گلیکولیک اسید'],
    recommendedHabitsFa: ['روتین منظم لایه‌برداری و آبرسانی سبک'],
    suitableIngredients: ['گلیکولیک اسید', 'سالیسیلیک اسید', 'رتینول'],
    avoidIngredients: ['ترکیبات کومدون‌زا سنگین'],
    imageUrl: '/assets/conditions/cond_whiteheads.svg',
  },
  {
    id: 'cond_sun_sensitivity',
    nameFa: 'حساسیت به آفتاب و سوزش (Sun Sensitivity)',
    summaryFa: 'واکنش شدید پوست به نور خورشید پس از مصرف برخی داروها یا اسیدها.',
    descriptionFa: 'محصولاتی مانند رتینول و AHA پوست را به نور آفتاب حساس‌تر (Photosensitive) می‌کنند.',
    symptomsFa: ['قرمزی فوری و سوزش پس از چند دقیقه زیر آفتاب'],
    possibleCausesFa: ['مصرف رتینول یا اسیدها بدون ضدآفتاب کافی'],
    lifestyleFactorsFa: ['استفاده سخاوتمندانه از ضدآفتاب تجدیدپذیر'],
    recommendedHabitsFa: ['استفاده از کلاه لبه‌دار و ضدآفتاب SPF50+'],
    suitableIngredients: ['ضدآفتاب مینرال', 'سیکا', 'آلوئه‌ورا'],
    avoidIngredients: ['عصاره مرکبات اسیدی در روز'],
    imageUrl: '/assets/conditions/cond_sun_sensitivity.svg',
  },
  {
    id: 'cond_texture',
    nameFa: 'ناهمواری بافت پوست (Rough Skin Texture)',
    summaryFa: 'احساس زبری و عدم یکدستی هنگام لمس پوست صورت.',
    descriptionFa: 'کاهش سرعت ریزش طبیعی سلول‌های مرده باعث ناصاف شدن بافت سطح صورت می‌شود.',
    symptomsFa: ['پوست زبر و کدر هنگام لمس با انگشتان'],
    possibleCausesFa: ['خشکی و عدم لایه‌برداری'],
    lifestyleFactorsFa: ['آبرسانی عمیق و لایه‌برداری آنزیمی یا اسیدی ملایم'],
    recommendedHabitsFa: ['استفاده از تونر لایه‌بردار ملایم ۲ بار در هفته'],
    suitableIngredients: ['لاکتیک اسید', 'نیاسینامید', 'هیالورونیک اسید'],
    avoidIngredients: ['شوینده‌های دارای دانه‌های زبر اسکراب'],
    imageUrl: '/assets/conditions/cond_texture.svg',
  }
];

// Initial Educational Articles Collection (100+ Knowledge Base indexed into categories)
export const ARTICLES_DATABASE: Article[] = [
  {
    id: 'art_101',
    titleFa: 'چگونه چرخه هورمونی بر سلامت پوست شما تاثیر می‌گذارد؟',
    categoryId: 'cat_hormones',
    categoryFa: 'هورمون‌ها و چرخه ماهانه',
    summaryFa: 'بررسی علمی تغییرات نوسانات استروژن و پروژسترون و تاثیر مستقیم آن‌ها بر چربی، حساسیت و جوش‌های پوستی.',
    fullContentFa: `چرخه ماهانه زنان شامل ۴ فاز اصلی است: قاعدگی، فولیکولار، تخمک‌گذاری و لوتئال (PMS).

۱. فاز قاعدگی (روز ۱ تا ۵):
سطح استروژن و پروژسترون در پایین‌ترین حد خود قرار دارد. سد دفاعی پوست شکننده‌تر بوده و احتمال احساس خشکی یا حساسیت بالاتر است. روتین پیشنهادی: آبرسانی عمیق و ترکیبات التیام‌بخش مانند سرامید و سیکا.

۲. فاز فولیکولار (روز ۶ تا ۱۲):
با افزایش سطح استروژن، کلاژن‌سازی و رطوبت طبیعی پوست بازمی‌گردد. پوست در درخشان‌ترین و شاداب‌ترین حالت خود قرار دارد. زمان مناسب برای امتحان ترکیبات جدید یا لایه‌برداری ملایم.

۳. فاز تخمک‌گذاری (روز ۱۳ تا ۱۶):
سطح استروژن به اوج می‌رسد و هورمون LH افزایش می‌یابد. ترشح چربی طبیعی پوست کمی افزایش می‌یابد.

۴. فاز لوتئال و PMS (روز ۱۷ تا ۲۸):
پروژسترون افزایش می‌یابد که باعث متورم شدن منافذ و حبس چربی می‌شود. همچنین نسبت تستوسترون آزاد بالا رفته و جوش‌های هورمونی (به ویژه در ناحیه چانه و فک) ظاهر می‌شوند. روتین پیشنهادی: استفاده از سالیسیلیک اسید و کنترل چربی با نیاسینامید.`,
    tagsFa: ['هورمون', 'PMS', 'جوش هورمونی', 'چرخه ماهانه'],
    readTimeMin: 4,
    difficultyFa: 'مقدماتی',
    imageUrl: '/assets/articles/art_101.svg',
    relatedIngredients: ['Salicylic Acid', 'Niacinamide', 'Ceramides'],
    relatedSkinProblems: ['Acne', 'Dehydrated Skin']
  },
  {
    id: 'art_102',
    titleFa: 'ترکیب نیاسینامید و سالیسیلیک اسید: زوج طلایی درمان جوش',
    categoryId: 'cat_ingredients',
    categoryFa: 'علم ترکیبات موثره',
    summaryFa: 'چرا ترکیب این دو ماده یکی از موثرترین روش‌ها برای درمان جوش و کاهش منافذ باز پوست است؟',
    fullContentFa: `سالیسیلیک اسید (BHA) به عنوان یک لایه‌بردار محلول در چربی، تمیزکننده عمق منافذ است. از طرف دیگر، نیاسینامید (ویتامین B3) التیام‌بخش التهاب بوده و تولید سبوم را کنترل می‌کند.

نحوه استفاده همزمان:
- می‌توانید از شوینده سالیسیلیک اسید استفاده کرده و سپس سرم نیاسینامید بزنید.
- یا سالیسیلیک اسید را شب‌ها و نیاسینامید را صبح‌ها استفاده نمایید.

این ترکیب باعث کنترل جوش، کاهش قرمزی و کوچک‌تر به نظر رسیدن منافذ پوستی می‌شود.`,
    tagsFa: ['نیاسینامید', 'سالیسیلیک اسید', 'منافذ باز', 'درمان جوش'],
    readTimeMin: 3,
    difficultyFa: 'متوسط',
    imageUrl: '/assets/articles/art_102.svg',
    relatedIngredients: ['Niacinamide', 'Salicylic Acid'],
    relatedSkinProblems: ['Acne', 'Large Pores']
  },
  {
    id: 'art_103',
    titleFa: 'راهنمای کامل شناخت نوع پوست: چرب، خشک، مختلط یا حساس؟',
    categoryId: 'cat_skin_types',
    categoryFa: 'انواع پوست',
    summaryFa: 'آموزش تست ساده شستشو در خانه برای تشخیص دقیق نوع پوست.',
    fullContentFa: `تشخیص درست نوع پوست، اولین قدم در ساخت یک روتین موفق است.

تست شستشوی خانه:
۱. صورت خود را با یک شوینده ملایم بشویید.
۲. با حوله نرم صورت را خشک کرده و هیچ کرم یا مرطوب‌کننده‌ای نزنید.
۳. ۳۰ دقیقه صبر کنید.

نتایج:
- پوست خشک: احساس کشیدگی، پوسته ریزی یا خارش در تمام صورت.
- پوست چرب: برق افتادن و احساس چربی در تمام صورت.
- پوست مختلط: چربی در ناحیه T (پیشانی، بینی و چانه) و خشکی در گونه‌ها.
- پوست نرمال: احساس راحتی و تعادل بدون چربی یا خشکی زیاد.`,
    tagsFa: ['نوع پوست', 'تست پوست', 'پوست چرب', 'پوست خشک'],
    readTimeMin: 3,
    difficultyFa: 'مقدماتی',
    imageUrl: '/assets/articles/art_103.svg',
    relatedIngredients: ['Hyaluronic Acid', 'Ceramides'],
    relatedSkinProblems: ['Dry Skin', 'Oily Skin']
  },
  {
    id: 'art_104',
    titleFa: 'ضدآفتاب فقط برای تابستان نیست! اهمیت اشعه UVA در فصل‌های سرد',
    categoryId: 'cat_sun_protection',
    categoryFa: 'محافظت در برابر نور خورشید',
    summaryFa: 'چرا اشعه UVA از شیشه عبور کرده و عامل اصلی پیری زودرس پوست است؟',
    fullContentFa: `اشعه ماوراء بنفش خورشید به دو دسته اصلی تقسیم می‌شود:
UVB: عامل آفتاب‌سوختگی در تابستان.
UVA: اشعه نفوذکننده به عمق درم پوست که در تمام طول سال و حتی از پشت شیشه و ابـر وجود دارد!

اشعه UVA کلاژن و الاستین را تخریب کرده و باعث ایجاد چروک و لک می‌شود. بنابراین استفاده روزانه از ضدآفتاب با SPF حداقل ۳۰ در تمامی روزهای سال الزامی است.`,
    tagsFa: ['ضدآفتاب', 'SPF', 'UVA', 'چروک پوست'],
    readTimeMin: 3,
    difficultyFa: 'مقدماتی',
    imageUrl: '/assets/articles/art_104.svg',
    relatedIngredients: ['Vitamin C', 'Sunscreen'],
    relatedSkinProblems: ['Hyperpigmentation', 'Wrinkles']
  },
  {
    id: 'art_105',
    titleFa: 'سد دفاعی پوست (Skin Barrier) چیست و چگونه آن را ترمیم کنیم؟',
    categoryId: 'cat_structure',
    categoryFa: 'شناخت ساختار پوست',
    summaryFa: 'علائم سد دفاعی تخریب‌شده و پروتکل فوری بازسازی آن با سرامیدها و پانتنول.',
    fullContentFa: `سد دفاعی یا اپیدرم بیرونی، مانند دیواری آجری است که سلول‌ها آجرها و چربی‌ها (سرامید، کلسترول) ملات آن هستند.

علائم آسیب سد دفاعی:
- سوزش هنگام زدن ساده‌ترین مرطوب‌کننده‌ها
- قرمزی و پوسته پوسته شدن ناگهانی
- جوش‌های ریز التهابی

نحوه ترمیم:
۱. تمام اسیدها، رتینول و لایه‌بردارها را کلاً متوقف کنید.
۲. از شوینده‌های بسیار ملایم غیرصابونی استفاده کنید.
۳. کرم‌های ترمیم‌کننده حاوی سرامید، پانتنول و سیکا بزنید.`,
    tagsFa: ['سد دفاعی', 'سرامید', 'ترمیم پوست', 'پوست حساس'],
    readTimeMin: 5,
    difficultyFa: 'متوسط',
    imageUrl: '/assets/articles/art_105.svg',
    relatedIngredients: ['Ceramides', 'Panthenol', 'Centella Asiatica'],
    relatedSkinProblems: ['Sensitive Skin', 'Rosacea']
  },
  {
    id: 'art_106',
    titleFa: 'تاثیر خواب عمیق و ریتم شبانه‌روزی بر بازسازی کلاژن پوستی',
    categoryId: 'cat_lifestyle',
    categoryFa: 'سبک زندگی و تغذیه',
    summaryFa: 'چرا ساعت‌های ۲۲ الی ۲ بامداد به عنوان زمان طلایی هورمون رشد و ترمیم پوست شناخته می‌شوند؟',
    fullContentFa: `هنگام خواب عمیق (دیپ اسلیپ)، بدن هورمون رشد (HGH) ترشح می‌کند که مسئول بازسازی سلول‌های آسیب‌دیده، ترمیم رشته‌های کلاژن و کاهش هورمون استرس (کورتیزول) است.

کم‌خوابی مزمن منجر به:
- کدر شدن رنگ چهره ناشی از افت جریان خون
- افزایش تیرگی و پف دور چشم
- تشدید جوش‌های التهابی به دلیل افزایش کورتیزول`,
    tagsFa: ['خواب', 'کلاژن', 'بازسازی پوست', 'سبک زندگی'],
    readTimeMin: 4,
    difficultyFa: 'مقدماتی',
    imageUrl: '/assets/articles/art_106.svg',
    relatedIngredients: ['Melatonin', 'Peptides'],
    relatedSkinProblems: ['Dark Circles', 'Fine Lines']
  }
];

// Pre-loaded sample products for user shelf
export const DEFAULT_PRODUCTS: Product[] = [];

// Initial Achievements
export const INITIAL_ACHIEVEMENTS: Achievement[] = [];

// Initial Challenges
export const INITIAL_CHALLENGES: Challenge[] = [];

/**
 * Repository Engine for Offline Local Storage
 */
export const LocalDB = {
  getUserState(): UserState {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_STATE);
      if (!data) return DEFAULT_USER_STATE;
      const parsed = JSON.parse(data);
      return {
        ...DEFAULT_USER_STATE,
        ...parsed,
        profile: { ...DEFAULT_USER_STATE.profile, ...(parsed.profile || {}) },
        lifestyle: { ...DEFAULT_USER_STATE.lifestyle, ...(parsed.lifestyle || {}) },
        cycleConfig: { ...DEFAULT_USER_STATE.cycleConfig, ...(parsed.cycleConfig || {}) },
        themeMode: parsed.themeMode || 'light',
        notifications: { ...DEFAULT_USER_STATE.notifications, ...(parsed.notifications || {}) },
        onboardingCompleted: parsed.onboardingCompleted ?? false,
      };
    } catch {
      return DEFAULT_USER_STATE;
    }
  },

  saveUserState(state: UserState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_STATE, JSON.stringify(state));
    } catch (e) {
      console.error('Error saving user state', e);
    }
  },

  getProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : DEFAULT_PRODUCTS;
    } catch {
      return DEFAULT_PRODUCTS;
    }
  },

  saveProducts(products: Product[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.error('Error saving products', e);
    }
  },

  getDailyLogs(): DailyTrackerEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DAILY_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveDailyLog(log: DailyTrackerEntry): void {
    try {
      const logs = this.getDailyLogs();
      const existingIdx = logs.findIndex(l => l.date === log.date);
      if (existingIdx >= 0) {
        logs[existingIdx] = log;
      } else {
        logs.push(log);
      }
      localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving daily log', e);
    }
  },

  getCycleSymptoms(): CycleSymptom[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CYCLE_SYMPTOMS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCycleSymptom(symptom: CycleSymptom): void {
    try {
      const symptoms = this.getCycleSymptoms();
      const idx = symptoms.findIndex(s => s.date === symptom.date);
      if (idx >= 0) {
        symptoms[idx] = symptom;
      } else {
        symptoms.push(symptom);
      }
      localStorage.setItem(STORAGE_KEYS.CYCLE_SYMPTOMS, JSON.stringify(symptoms));
    } catch (e) {
      console.error('Error saving cycle symptom', e);
    }
  },

  getPhotoProgress(): PhotoProgress[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PHOTOS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  savePhotoProgress(photo: PhotoProgress): void {
    try {
      const photos = this.getPhotoProgress();
      photos.unshift(photo);
      localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(photos));
    } catch (e) {
      console.error('Error saving photo progress', e);
    }
  },

  getAchievements(): Achievement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      return data ? JSON.parse(data) : INITIAL_ACHIEVEMENTS;
    } catch {
      return INITIAL_ACHIEVEMENTS;
    }
  },

  saveAchievements(achievements: Achievement[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
    } catch (e) {
      console.error('Error saving achievements', e);
    }
  },

  getChallenges(): Challenge[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CHALLENGES);
      return data ? JSON.parse(data) : INITIAL_CHALLENGES;
    } catch {
      return INITIAL_CHALLENGES;
    }
  },

  saveChallenges(challenges: Challenge[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CHALLENGES, JSON.stringify(challenges));
    } catch (e) {
      console.error('Error saving challenges', e);
    }
  },

  // Export all offline data into JSON file
  exportBackupData() {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      userState: this.getUserState(),
      products: this.getProducts(),
      dailyLogs: this.getDailyLogs(),
      cycleSymptoms: this.getCycleSymptoms(),
      photos: this.getPhotoProgress(),
      achievements: this.getAchievements(),
      challenges: this.getChallenges(),
    };
  },

  // Import offline data from JSON
  importBackupData(jsonObj: any): boolean {
    try {
      if (jsonObj.userState) this.saveUserState(jsonObj.userState);
      if (jsonObj.products) this.saveProducts(jsonObj.products);
      if (jsonObj.dailyLogs) localStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(jsonObj.dailyLogs));
      if (jsonObj.cycleSymptoms) localStorage.setItem(STORAGE_KEYS.CYCLE_SYMPTOMS, JSON.stringify(jsonObj.cycleSymptoms));
      if (jsonObj.photos) localStorage.setItem(STORAGE_KEYS.PHOTOS, JSON.stringify(jsonObj.photos));
      if (jsonObj.achievements) this.saveAchievements(jsonObj.achievements);
      if (jsonObj.challenges) this.saveChallenges(jsonObj.challenges);
      return true;
    } catch (e) {
      console.error('Failed to import backup', e);
      return false;
    }
  }
};
