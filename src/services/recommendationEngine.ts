import { 
  SkinProfile, 
  LifestyleProfile, 
  MenstrualPhase, 
  RoutineStep, 
  WeatherData,
  Product
} from '../types';
import { computeCycleInfo } from './jalali';

export interface GeneratedRecommendations {
  skinScore: number;
  hormonalCompatibilityScore: number;
  primaryInsightFa: string;
  cycleInsightFa: string;
  weatherInsightFa: string;
  recommendedIngredientsFa: string[];
  avoidIngredientsFa: string[];
  morningRoutine: RoutineStep[];
  nightRoutine: RoutineStep[];
  pmsWarningAlert?: string;
}

/**
 * Calculates Overall Skin Health Score (0 - 100)
 * Evaluates: Routine habits, sleep, water, stress, sun protection, skin concerns
 */
export function calculateSkinScore(
  profile: SkinProfile,
  lifestyle: LifestyleProfile,
  streakDays: number = 3,
  completedTodayCount: number = 2
): number {
  let score = 70; // Base score

  // Water bonus
  if (lifestyle.waterTargetGlasses >= 8) score += 5;
  else if (lifestyle.waterTargetGlasses < 5) score -= 5;

  // Sleep bonus
  if (lifestyle.sleepTargetHours >= 7) score += 5;
  else if (lifestyle.sleepTargetHours < 6) score -= 8;

  // Stress penalty
  if (lifestyle.stressLevel === 'high') score -= 10;
  else if (lifestyle.stressLevel === 'low') score += 5;

  // Streak bonus
  score += Math.min(streakDays * 2, 10);

  // Today routine completion bonus
  if (completedTodayCount >= 2) score += 5;

  // Smoking penalty
  if (lifestyle.isSmoking) score -= 8;

  // Cap score between 35 and 99
  return Math.max(35, Math.min(99, Math.round(score)));
}

/**
 * Generates personalized daily skincare insights & routine recommendations
 */
export function generateDailyRecommendations(
  profile: SkinProfile,
  lifestyle: LifestyleProfile,
  lastPeriodIso: string,
  cycleLength: number = 28,
  periodLength: number = 5,
  weather: WeatherData = {
    city: '',
    temp: 24,
    conditionFa: 'اطلاعات جدید در دسترس نیست',
    humidity: 0,
    uvIndex: 0,
    recommendationFa: 'شاخص UV خورشید بالا است. استفاده از ضدآفتاب تجدیدشونده الزامی است.'
  },
  ownedProducts: Product[] = []
): GeneratedRecommendations {
  const cycleInfo = computeCycleInfo(lastPeriodIso, cycleLength, periodLength);
  const phase = cycleInfo.phase;

  const skinScore = calculateSkinScore(profile, lifestyle);
  let hormonalScore = 85;

  let primaryInsight = 'پوست شما امروز در شرایط متعادلی قرار دارد. روتین مرطوب‌کننده و ضدآفتاب را فراموش نکنید.';
  let cycleInsight = '';
  let weatherInsight = weather.recommendationFa;
  let pmsWarningAlert: string | undefined = undefined;

  const recommendedIngredients: string[] = ['هیالورونیک اسید', 'نیاسینامید', 'سرامیدها'];
  const avoidIngredients: string[] = [];

  // 1. Phase-based Intelligence & Rules
  if (phase === 'menstrual') {
    hormonalScore = 78;
    cycleInsight = `امروز روز ${cycleInfo.cycleDay} چرخه (فاز قاعدگی) است. سد دفاعی پوست به علت افت استروژن کمی حساس‌تر است. تمرکز روتین باید روی آبرسانی و آرام‌سازی باشد.`;
    recommendedIngredients.push('سنتلا آسیاتیکا (سیکا)', 'پانتنول', 'آلوئه‌ورا');
    avoidIngredients.push('اسیدهای لایه‌بردار قوی', 'پیلینگ شیمیایی', 'رتینول درصد بالا');
    primaryInsight = 'در فاز قاعدگی، پوست به نوازش و آبرسانی ملایم نیاز دارد. ترکیبات تسکین‌دهنده بهترین دوست شما هستند.';
  } else if (phase === 'follicular') {
    hormonalScore = 95;
    cycleInsight = `روز ${cycleInfo.cycleDay} چرخه (فاز فولیکولار). استروژن در حال افزایش است. پوست در درخشان‌ترین، شاداب‌ترین و مقاوم‌ترین حالت قرار دارد!`;
    recommendedIngredients.push('ویتامین C', 'هیالورونیک اسید', 'پپتیدها');
    primaryInsight = 'بهترین زمان ماه برای پوست شما! درخشش طبیعی افزایش یافته و تحمل پوست برای مواد فعال بالاتر است.';
  } else if (phase === 'ovulation') {
    hormonalScore = 88;
    cycleInsight = `روز ${cycleInfo.cycleDay} چرخه (تخمک‌گذاری). افزایش خفیف ترشح چربی سبوم. شستشوی دقیق و سبک نگه داشتن روتین توصیه می‌شود.`;
    recommendedIngredients.push('نیاسینامید', 'زینک', 'سالیسیلیک اسید ملایم');
    primaryInsight = 'ترشح چربی طبیعی پوست در حال افزایش است. پاکسازی ملایم منافذ را در اولویت بگذارید.';
  } else if (phase === 'luteal') {
    hormonalScore = 65;
    if (cycleInfo.inPmsWindow) {
      pmsWarningAlert = `حدود ${cycleInfo.daysUntilPeriod} روز تا شروع احتمالی پریود باقی مانده است. نوسانات پروژسترون ممکن است باعث ایجاد جوش‌های زیرپوستی هورمونی شود.`;
      cycleInsight = `فاز لوتئال؛ اگر الگوی قبلی شما این را نشان دهد، بازه پیش از قاعدگی نزدیک است. منافذ پوست تحت تاثیر هورمون‌ها تمایل به تورم و انسداد دارند. پیشگیری از جوش اولویت اصلی است.`;
    } else {
      cycleInsight = `فاز لوتئال اولیه. ترشح چربی رو به افزایش است. روتین کنترل چربی و مرطوب‌کننده فاقد چربی توصیه می‌شود.`;
    }
    recommendedIngredients.push('نیاسینامید', 'آزلائیک اسید');
    avoidIngredients.push('کرم‌های چرب کومدون‌زا', 'روغن‌های سنگین صورت');
    primaryInsight = 'در دوره PMS، پوست ممکن است حساس‌تر یا چرب‌تر شود. با سالیسیلیک اسید و پاکسازی ملایم جلو ایجاد جوش را بگیرید.';
  }

  // 2. Weather & UV Rules
  if (weather.uvIndex >= 6) {
    recommendedIngredients.push('ضدآفتاب SPF 50', 'ویتامین C (آنتی‌اکسیدان)');
    weatherInsight = `شاخص UV امروز ${weather.uvIndex} (بالا) است! استفاده از ضدآفتاب و تجدید آن هر ۲ ساعت برای جلوگیری از لک الزامی است.`;
  }
  if (weather.humidity < 30) {
    recommendedIngredients.push('هیالورونیک اسید', 'کرم حاوی سرامید');
    weatherInsight += ' رطوبت هوا پایین است؛ از آبرسانی لایه‌ای روی پوست نم‌دار استفاده کنید.';
  }

  // 3. Dynamic Morning Routine Steps Construction
  const morningRoutine: RoutineStep[] = [
    {
      id: 'm_step_1',
      titleFa: 'پاکسازی ملایم صبحگاهی',
      category: 'cleanser',
      productNameFa: ownedProducts.find(p => p.category === 'cleanser')?.name || 'شوینده ملایم صورت',
      completed: false,
      timeSeconds: 60,
      descriptionFa: 'صورت خود را با آب ولرم و شوینده ملایم بشویید تا چربی شبانه پاک شود.'
    },
    {
      id: 'm_step_2',
      titleFa: 'سرم آبرسان یا آنتی‌اکسیدان',
      category: 'serum',
      productNameFa: ownedProducts.find(p => p.category === 'serum')?.name || (phase === 'follicular' ? 'سرم ویتامین C' : 'سرم نیاسینامید و آبرسان'),
      completed: false,
      timeSeconds: 30,
      descriptionFa: '۳ تا ۴ قطره سرم روی صورت پمپ کرده و با ضربات آرام جذب کنید.'
    },
    {
      id: 'm_step_3',
      titleFa: 'مرطوب‌کننده سبـک',
      category: 'moisturizer',
      productNameFa: ownedProducts.find(p => p.category === 'moisturizer')?.name || 'مرطوب‌کننده و آبرسان فاقد چربی',
      completed: false,
      timeSeconds: 30,
      descriptionFa: 'برای حفظ رطوبت پوست و تقویت سد دفاعی، کرم مرطوب‌کننده بزنید.'
    },
    {
      id: 'm_step_4',
      titleFa: 'ضدآفتاب طیف گسترده (ضروری)',
      category: 'sunscreen',
      productNameFa: ownedProducts.find(p => p.category === 'sunscreen')?.name || 'ضدآفتاب SPF 50',
      completed: false,
      timeSeconds: 45,
      descriptionFa: 'به مقدار دو بند انگشت ضدآفتاب بزنید تا از لک و چروک ناشی از آفتاب جلوگیری شود.'
    }
  ];

  // 4. Dynamic Night Routine Steps Construction
  const nightRoutine: RoutineStep[] = [
    {
      id: 'n_step_1',
      titleFa: 'پاکسازی دو مرحله‌ای (می‌سلار / شوینده)',
      category: 'cleanser',
      productNameFa: ownedProducts.find(p => p.category === 'cleanser')?.name || 'ژل شوینده پاک‌کننده آلودگی',
      completed: false,
      timeSeconds: 60,
      descriptionFa: 'آلودگی‌ها، ضدآفتاب و چربی طول روز را کاملاً پاکسازی کنید.'
    },
    {
      id: 'n_step_2',
      titleFa: phase === 'luteal' ? 'روتین ملایم کنترل چربی' : 'سرم ترمیم‌کننده و ضدچروک شب',
      category: 'treatment',
      productNameFa: ownedProducts.find(p => p.category === 'treatment' || p.category === 'serum')?.name || (phase === 'luteal' ? 'سرم سالیسیلیک اسید BHA' : 'سرم نیاسینامید یا هیالورونیک اسید'),
      completed: false,
      timeSeconds: 30,
      descriptionFa: phase === 'luteal' ? 'کنترل چربی منافذ و پیشگیری از جوش‌های هورمونی.' : 'تغذیه عمیق و ترمیم سلولی پوست در طول خواب.'
    },
    {
      id: 'n_step_3',
      titleFa: 'کرم مغذی یا مرطوب‌کننده شب',
      category: 'moisturizer',
      productNameFa: ownedProducts.find(p => p.category === 'moisturizer')?.name || 'کرم مرطوب‌کننده حاوی سرامید',
      completed: false,
      timeSeconds: 45,
      descriptionFa: 'قفل کردن تمام رطوبت و بازسازی سد دفاعی پوست در هنگام استراحت شبانه.'
    }
  ];

  return {
    skinScore,
    hormonalCompatibilityScore: hormonalScore,
    primaryInsightFa: primaryInsight,
    cycleInsightFa: cycleInsight,
    weatherInsightFa: weatherInsight,
    recommendedIngredientsFa: Array.from(new Set(recommendedIngredients)),
    avoidIngredientsFa: Array.from(new Set(avoidIngredients)),
    morningRoutine,
    nightRoutine,
    pmsWarningAlert,
  };
}
