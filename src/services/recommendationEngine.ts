/**
 * موتور توصیه روزانه.
 *
 * این یک سیستم قواعد شفاف است، نه هوش مصنوعی. عنوان‌های اپ هم همین را
 * می‌گویند. جلوی هر توصیه، دلیلش نوشته می‌شود.
 *
 * ترتیب اولویت قواعد (مهم‌ترین اول):
 *   ۱) ایمنی (بارداری، شیردهی، دارو، حساسیت)
 *   ۲) پرهیز نوبت آرایشگاه یا کلینیک
 *   ۳) فاز چرخه (اگر فعال باشد)
 *   ۴) آب‌وهوا (اگر داده موجود باشد)
 *   ۵) نوع پوست و دغدغه‌ها
 */

import {
  AdviceSeverity,
  AdviceSource,
  IngredientAdvice,
  LifestyleProfile,
  MenstrualCycleConfig,
  Medication,
  Product,
  ProductCategory,
  RoutineStep,
  SkinProfile,
  WeatherData,
} from '../types';
import { findIngredientById, INGREDIENTS_DATABASE } from './content/ingredients';
import { evaluateIngredientSafety, getBlockedIngredientIds } from './safety';
import { escalate, SEVERITY_LABEL_FA } from './advice/severity';
import { getSensitivityLevel, getSkinSignals, resolveShelfActives, ShelfActive } from './advice/userContext';
import { getTodayCycleState, PHASE_INGREDIENTS } from './cycle/cycleService';
import { getRoutineRestrictionForDate, RoutineRestriction } from './providers/appointmentService';
import { getAgeFromBirthDate, getTodayIsoDate } from './jalali';

export interface DailyGuidance {
  /** متن چرخه. null = چرخه خاموش یا داده ناکافی. در این حالت چیزی نشان نده. */
  cycleInsightFa: string | null;
  weatherInsightFa: string | null;
  /** پرهیز مربوط به نوبت آرایشگاه یا کلینیک. */
  procedureInsightFa: string | null;
  pmsWarningFa: string | null;
  safetyWarningsFa: string[];
  recommendedIngredientIds: string[];
  avoidIngredientIds: string[];
  morningRoutine: RoutineStep[];
  nightRoutine: RoutineStep[];
  gentleMode: boolean;
  lifestyleInsightFa: string | null;
  /** توصیه متناسب با سن؛ اگر تاریخ تولد ثبت نشده باشد null است. */
  ageInsightFa: string | null;
  /**
   * توصیه‌های سطح‌بندی‌شده (INFO تا PROFESSIONAL_INSTRUCTION).
   * avoidIngredientIds برای سازگاری با کامپوننت‌های قدیمی نگه داشته شده،
   * ولی این آرایه منبع واقعی برای هر UI جدید است — چون بین «شاید بهتره
   * کمتر استفاده کنی» و «طبق نوبت درمانی باید متوقف شود» فرق می‌گذارد.
   */
  ingredientAdvice: IngredientAdvice[];
}

/**
 * توصیه‌های ایمنی (بارداری/شیردهی/رتینوئید خوراکی/آلرژی/تداخل دارویی/نوع پوست).
 * از همان evaluateIngredientSafety در safety.ts استفاده می‌کند تا قاعده دوبار
 * نوشته نشود؛ اینجا فقط منبع و شدت متناسب با نوع دلیل واقعی تعیین می‌شود —
 * همه‌چیز دیگر یکسان IMPORTANT نیست.
 */
function buildSafetyAdvice(
  profile: SkinProfile,
  medications: Medication[],
  shelfActives: Map<string, ShelfActive>,
  sensitivity: ReturnType<typeof getSensitivityLevel>,
  skinSignals: ReturnType<typeof getSkinSignals>,
): IngredientAdvice[] {
  const activeMedications = medications.filter((medication) => medication.isActive);
  const advice: IngredientAdvice[] = [];

  INGREDIENTS_DATABASE.forEach((ingredient) => {
    const verdict = evaluateIngredientSafety(ingredient, profile, activeMedications);
    if (verdict.level === 'safe') return;

    const shelf = shelfActives.get(ingredient.id);
    const inUserShelf = Boolean(shelf);

    let source: AdviceSource = 'skin_profile';
    let severity: AdviceSeverity = verdict.level === 'blocked' ? 'IMPORTANT' : 'CAUTION';

    const medConflict = activeMedications.find((medication) =>
      (medication.conflictingIngredientIds || []).includes(ingredient.id),
    );
    if (medConflict) {
      // تداخل با دارویی که پزشک تجویز کرده — این دیگر «پیشنهاد» نیست.
      source = 'medication';
      severity = 'PROFESSIONAL_INSTRUCTION';
    } else if (profile.onOralRetinoid && (ingredient.id === 'ing_retinol' || ingredient.category === 'exfoliant')) {
      // رتینوئید خوراکی هم دستور پزشک است، نه ترجیح اپ.
      source = 'medication';
      severity = 'PROFESSIONAL_INSTRUCTION';
    } else if (profile.allergies.some((item) => item.trim() && ingredient.nameFa.includes(item.trim()))) {
      // حساسیت ثبت‌شده خود کاربر: ایمنی واقعی، ولی دستور پزشک نیست.
      source = 'safety';
      severity = 'IMPORTANT';
    } else if (
      (profile.isPregnant && ingredient.pregnancySafety !== 'safe') ||
      (profile.isBreastfeeding && ingredient.breastfeedingSafety !== 'safe')
    ) {
      source = 'pregnancy';
    }

    // پوست ملتهب همین چند روز یا حساسیت بالا: یک پله شدت را بالا می‌بریم،
    // ولی هرگز از IMPORTANT بالاتر نمی‌رویم مگر منبع واقعاً پزشکی/دارویی باشد.
    if (severity === 'CAUTION' && (sensitivity === 'high' || skinSignals.irritatedNow)) {
      severity = escalate(severity, 1, 'IMPORTANT');
    }

    advice.push({
      ruleId: `safety_${ingredient.id}`,
      ingredientId: ingredient.id,
      ingredientNameFa: ingredient.nameFa,
      severity,
      action: severity === 'CAUTION' || severity === 'INFO' ? 'reduce' : 'stop',
      headlineFa: `${ingredient.nameFa} — ${SEVERITY_LABEL_FA[severity]}`,
      reasonFa: verdict.reasonsFa.join(' '),
      triggersFa: verdict.reasonsFa,
      productNamesFa: shelf?.productNamesFa || [],
      inUserShelf,
      educationalOnly: !inUserShelf,
      source,
    });
  });

  return advice;
}

/**
 * توصیه‌های مربوط به نوبت آرایشگاه/کلینیک. این‌ها واقعاً «دستور جلسه درمانی»
 * هستند (نه حدس اپ)، پس همیشه PROFESSIONAL_INSTRUCTION با تاریخ انقضای مشخص.
 */
function buildProcedureAdvice(
  restriction: RoutineRestriction,
  shelfActives: Map<string, ShelfActive>,
): IngredientAdvice[] {
  return restriction.blockedIngredientIds.map((id) => {
    const ingredient = findIngredientById(id);
    const shelf = shelfActives.get(id);
    return {
      ruleId: `procedure_${id}_${restriction.appointmentId || 'na'}`,
      ingredientId: id,
      ingredientNameFa: ingredient?.nameFa || id,
      severity: 'PROFESSIONAL_INSTRUCTION',
      action: restriction.gentleMode ? 'pause' : 'stop',
      headlineFa: `${ingredient?.nameFa || id} — طبق برنامه نوبت متوقف است`,
      reasonFa: restriction.reasonFa,
      triggersFa: restriction.reasonFa ? [restriction.reasonFa] : [],
      productNamesFa: shelf?.productNamesFa || [],
      inUserShelf: Boolean(shelf),
      educationalOnly: !shelf,
      source: 'procedure',
      appointmentId: restriction.appointmentId,
    };
  });
}

function pickProductName(products: Product[], category: ProductCategory, blockedIds: string[]): string | undefined {
  const candidate = products.find(
    (product) =>
      product.owned &&
      product.category === category &&
      !product.ingredientIds.some((id) => blockedIds.includes(id)),
  );
  return candidate ? `${candidate.brand} ${candidate.name}`.trim() : undefined;
}

function ingredientNameFa(id: string): string {
  return findIngredientById(id)?.nameFa || id;
}

export function buildDailyGuidance(args: {
  profile: SkinProfile;
  lifestyle: LifestyleProfile;
  cycleConfig: MenstrualCycleConfig;
  weather: WeatherData;
  products: Product[];
  medications?: Medication[];
  dateIso?: string;
}): DailyGuidance {
  const { profile, cycleConfig, weather, products } = args;
  let lifestyleInsightFa: string | null = null;
  if (profile.hairType === 'curly' || profile.hairType === 'coily') lifestyleInsightFa = 'برای موی فر، بعد از شست‌وشو مو را با حوله زبر نساب؛ رطوبت را با کرم یا نرم‌کننده نگه دار.';
  else if (profile.hairType === 'oily') lifestyleInsightFa = 'اگر پوست سرت زود چرب می‌شود، محصول‌های سنگین را نزدیک ریشه نزن.';
  if (args.lifestyle.stressLevel === 'high') lifestyleInsightFa = lifestyleInsightFa ? `${lifestyleInsightFa} استرس زیاد می‌تواند ثبت‌های پوست و چرخه را تغییر دهد؛ اینجا فقط ثبت کن، نه قضاوت.` : 'استرس زیاد می‌تواند ثبت‌های پوست و چرخه را تغییر دهد؛ اینجا فقط ثبت کن، نه قضاوت.';
  const medications = args.medications || [];
  const dateIso = args.dateIso || getTodayIsoDate();

  /* --- ۱) ایمنی --- */
  const safetyBlocked = getBlockedIngredientIds(profile, medications);
  const safetyWarnings: string[] = [];
  if (profile.isPregnant) {
    safetyWarnings.push('برای دوران بارداری، رتینول و لایه‌بردارهای قوی از روتین حذف شدند.');
  }
  if (profile.isBreastfeeding) {
    safetyWarnings.push('در دوران شیردهی، ترکیبات نامناسب از روتین حذف شدند.');
  }
  if (profile.onOralRetinoid) {
    safetyWarnings.push(
      'چون رتینوئید خوراکی مصرف می‌کنید، روتین فقط روی آبرسانی و ترمیم سد دفاعی تنطیم شد. لایه‌برداری و لیزر در این دوره توصیه نمی‌شود.',
    );
  }

  /* --- ۲) پرهیز نوبت‌ها --- */
  const restriction = getRoutineRestrictionForDate(dateIso);

  /* --- ۳) چرخه --- */
  // در بارداری، پیش‌بینی فاز/PMS از داده‌های پیش از بارداری بی‌معنی و
  // گمراه‌کننده است؛ چرخه کاملاً غیرفعال در نظر گرفته می‌شود.
  const cycle = getTodayCycleState(profile.isPregnant ? { ...cycleConfig, enabled: false } : cycleConfig);
  const recommended = new Set<string>(['ing_hyaluronic_acid', 'ing_ceramides']);
  const avoid = new Set<string>([...safetyBlocked, ...restriction.blockedIngredientIds]);

  let cycleInsight: string | null = null;
  let pmsWarning: string | null = null;

  if (cycle.available && cycle.phase && cycle.cycleDay) {
    const hedge = cycle.confidence === 'low' || cycle.confidence === 'none' ? ' (برآورد تقریبی است)' : '';
    if (cycle.phase === 'menstrual') {
      cycleInsight = `روز ${cycle.cycleDay} چرخه، فاز قاعدگی. سد دفاعی پوست حساس‌تر است؛ تمرکز روی آبرسانی و آرام‌سازی.${hedge}`;
    } else if (cycle.phase === 'follicular') {
      cycleInsight = `روز ${cycle.cycleDay} چرخه، فاز فولیکولار. تحمل پوست برای ترکیبات فعال بیشتر است.${hedge}`;
    } else if (cycle.phase === 'ovulation') {
      cycleInsight = `روز ${cycle.cycleDay} چرخه، تخمک‌گذاری تقریبی. ترشح چربی رو به افزایش است.${hedge}`;
    } else {
      cycleInsight = `روز ${cycle.cycleDay} چرخه، فاز لوتئال. منافذ مستعد انسداد هستند؛ پیشگیری اولویت دارد.${hedge}`;
    }
    // همان جدول ترکیبات فاز که کارت چرخه هم از آن می‌خواند (PHASE_INGREDIENTS) — یک منبع واحد.
    const phaseIngredients = PHASE_INGREDIENTS[cycle.phase];
    phaseIngredients.recommendedIds.forEach((id) => recommended.add(id));
    phaseIngredients.avoidIds.forEach((id) => avoid.add(id));

    if (cycle.inPmsWindow && cycle.daysUntilNextPeriod !== null) {
      pmsWarning = `حدود ${cycle.daysUntilNextPeriod} روز تا شروع احتمالی پریود. اگر الگوی جوش هورمونی داری، الان بهترین زمان شروع روتین پیشگیرانه است. این یک برآورد است، نه تشخیص پزشکی.`;
    }
  }

  /* --- ۴) آب‌وهوا --- */
  let weatherInsight: string | null = null;
  if (weather.hasData) {
    if (weather.uvIndex >= 6) {
      weatherInsight = `شاخص فرابنفش امروز ${weather.uvIndex} است. ضدآفتاب را هر دو ساعت تجدید کنید.`;
      recommended.add('ing_vitamin_c');
    } else if (weather.humidity > 0 && weather.humidity < 30) {
      weatherInsight = `رطوبت هوا ${weather.humidity} درصد است. مرطوب‌کننده را روی پوست نم‌دار بزنید.`;
      recommended.add('ing_ceramides');
    } else {
      weatherInsight = weather.recommendationFa || null;
    }
  }

  /* --- ۵) نوع پوست و دغدغه‌ها --- */
  if (profile.skinType === 'oily' || profile.skinType === 'combination') recommended.add('ing_niacinamide');
  if (profile.skinType === 'dry' || profile.skinType === 'dehydrated') recommended.add('ing_panthenol');
  if (profile.skinType === 'sensitive') {
    recommended.add('ing_centella');
  }
  if (profile.primaryConcerns.includes('acne')) recommended.add('ing_azelaic_acid');
  if (profile.primaryConcerns.includes('hyperpigmentation')) recommended.add('ing_azelaic_acid');
  if (profile.primaryConcerns.includes('redness') || profile.primaryConcerns.includes('rosacea')) {
    recommended.add('ing_azelaic_acid');
  }

  /* --- ۶) سن --- */
  // سن فقط داده تزئینی نیست: بازه سنی روی ترکیبات پیشنهادی و لحن توصیه اثر می‌گذارد.
  let ageInsightFa: string | null = null;
  const age = getAgeFromBirthDate(profile.birthDateIso);
  const canUseRetinol = !profile.isPregnant && !profile.isBreastfeeding && !profile.onOralRetinoid;
  if (profile.birthDateIso && age > 0) {
    if (age < 18) {
      ageInsightFa =
        'در سن نوجوانی، پوست به روتین ساده و ملایم نیاز دارد؛ فعلاً از رتینول و لایه‌بردارهای قوی فاصله بگیر و روی شست‌وشوی ملایم و ضدآفتاب روزانه تمرکز کن.';

    } else if (age < 25) {
      ageInsightFa =
        'در این سن، بهترین سرمایه‌گذاری پیشگیری است: ضدآفتاب روزانه و آنتی‌اکسیدان‌ها جلوی سالخوردگی زودرس پوست را می‌گیرند.';
      recommended.add('ing_vitamin_c');
    } else if (age < 35) {
      ageInsightFa =
        'اوایل دهه سوم زمان خوبی برای شروع رتینول سبک در شب و ویتامین C در صبح است تا اولین خطوط ریز دیرتر بیفتند.';
      recommended.add('ing_vitamin_c');
      if (canUseRetinol) recommended.add('ing_retinol');
    } else if (age < 45) {
      ageInsightFa =
        'در این سن تولید کلاژن پوست کم‌کم کاهش می‌یابد؛ رتینول و مرطوب‌کننده‌های حاوی سرامید نقش پررنگ‌تری در روتین شب پیدا می‌کنند.';
      recommended.add('ing_ceramides');
      if (canUseRetinol) recommended.add('ing_retinol');
    } else {
      ageInsightFa =
        'با نزدیک شدن به یائسگی، افت استروژن پوست را خشک‌تر و نازک‌تر می‌کند؛ آبرسانی عمیق و ترمیم سد دفاعی اولویت اول روتین می‌شود.';
      recommended.add('ing_ceramides');
      recommended.add('ing_hyaluronic_acid');
    }
  }

  // ایمنی و پرهیز الویت دارند: هر چیزی که ممنوع است، از توصیه حذف می‌شود
  avoid.forEach((id) => recommended.delete(id));

  const blockedList = Array.from(avoid);
  const gentleMode = restriction.gentleMode || profile.onOralRetinoid;

  /* --- توصیه‌های سطح‌بندی‌شده --- */
  const shelfActives = resolveShelfActives(products);
  const skinSignals = getSkinSignals(dateIso);
  const sensitivity = getSensitivityLevel(profile);
  const ingredientAdvice: IngredientAdvice[] = [
    ...buildSafetyAdvice(profile, medications, shelfActives, sensitivity, skinSignals),
    ...buildProcedureAdvice(restriction, shelfActives),
  ];

  /* --- ساخت گام‌های روتین --- */
  const morning: RoutineStep[] = [
    {
      id: 'm_cleanse',
      titleFa: 'شوینده ملایم صبح',
      category: 'cleanser',
      productNameFa: pickProductName(products, 'cleanser', blockedList) || 'شوینده ملایم صورت',
      completed: false,
      timeSeconds: 60,
      descriptionFa: 'با آب ولرم بشویید و فقط ۳۰ تا ۶۰ ثانیه ماساژ دهید.',
      reasonFa: 'پاکسازی چربی شبانه بدون آسیب به سد دفاعی',
    },
  ];

  if (!gentleMode && !blockedList.includes('ing_vitamin_c') && recommended.has('ing_vitamin_c')) {
    morning.push({
      id: 'm_serum_vitc',
      titleFa: 'سرم ویتامین C',
      category: 'serum',
      productNameFa: pickProductName(products, 'serum', blockedList) || 'سرم ویتامین C',
      completed: false,
      timeSeconds: 30,
      descriptionFa: '۳ تا ۴ قطره روی پوست خشک و سپس مرطوب‌کننده.',
      reasonFa: 'محافطت آنتی‌اکسیدانی در برابر آلودگی و آفتاب',
    });
  } else {
    morning.push({
      id: 'm_serum_hydra',
      titleFa: 'سرم آبرسان',
      category: 'serum',
      productNameFa: pickProductName(products, 'serum', blockedList) || 'سرم هیالورونیک اسید',
      completed: false,
      timeSeconds: 30,
      descriptionFa: 'روی پوست کمی نم‌دار بزنید و بلافاصله مرطوب‌کننده رویش بگذارید.',
      reasonFa: gentleMode ? 'روتین امروز ملایم تنطیم شده' : 'آبرسانی پایه',
    });
  }

  morning.push(
    {
      id: 'm_moisturizer',
      titleFa: 'مرطوب‌کننده',
      category: 'moisturizer',
      productNameFa: pickProductName(products, 'moisturizer', blockedList) || 'مرطوب‌کننده سبک',
      completed: false,
      timeSeconds: 30,
      descriptionFa: 'یک لایه یکنواخت روی صورت و گردن.',
      reasonFa: 'حفظ رطوبت و تقویت سد دفاعی',
    },
    {
      id: 'm_sunscreen',
      titleFa: 'ضدآفتاب (مهم‌ترین گام روز)',
      category: 'sunscreen',
      productNameFa: pickProductName(products, 'sunscreen', blockedList) || 'ضدآفتاب SPF 50',
      completed: false,
      timeSeconds: 45,
      descriptionFa: 'دو بند انگشت برای صورت و گردن.',
      reasonFa: gentleMode
        ? 'پوست امروز در حال ترمیم است و به نور خیلی حساس‌تر است'
        : 'پیشگیری از لک و پیری زودرس',
    },
  );

  const night: RoutineStep[] = [
    {
      id: 'n_cleanse',
      titleFa: 'پاکسازی شب',
      category: 'cleanser',
      productNameFa: pickProductName(products, 'cleanser', blockedList) || 'ژل شوینده ملایم',
      completed: false,
      timeSeconds: 90,
      descriptionFa: 'اگر ضدآفتاب یا میکاپ زده‌اید، اول میسلار یا روغن پاک‌کننده.',
      reasonFa: 'باقی‌ماندن ضدآفتاب روی پوست منافذ را می‌بندد',
    },
  ];

  const nightActive = ['ing_retinol', 'ing_azelaic_acid', 'ing_salicylic_acid', 'ing_niacinamide'].find(
    (id) => recommended.has(id) && !blockedList.includes(id),
  );

  if (gentleMode || !nightActive) {
    night.push({
      id: 'n_repair',
      titleFa: 'سرم ترمیمی و آبرسان',
      category: 'serum',
      productNameFa: pickProductName(products, 'serum', blockedList) || 'سرم هیالورونیک یا پانتنول',
      completed: false,
      timeSeconds: 30,
      descriptionFa: 'در این بازه فقط آبرسانی و ترمیم.',
      reasonFa: restriction.reasonFa || (profile.onOralRetinoid ? 'دوره مصرف رتینوئید خوراکی' : 'روتین ملایم'),
      blockedReasonFa: restriction.reasonFa || undefined,
    });
  } else {
    night.push({
      id: 'n_active',
      titleFa: `ترکیب فعال شب: ${ingredientNameFa(nightActive)}`,
      category: 'treatment',
      productNameFa: pickProductName(products, 'treatment', blockedList) || pickProductName(products, 'serum', blockedList),
      completed: false,
      timeSeconds: 30,
      descriptionFa: 'کم شروع کنید: ابتدا هفته‌ای دو شب، بعد افزایش دهید.',
      reasonFa: cycle.available && cycle.phase === 'luteal' ? 'فاز لوتئال و پیشگیری از جوش هورمونی' : 'دغدغه اصلی پوست شما',
    });
  }

  night.push({
    id: 'n_moisturizer',
    titleFa: 'کرم شب ترمیم‌کننده',
    category: 'moisturizer',
    productNameFa: pickProductName(products, 'moisturizer', blockedList) || 'کرم حاوی سرامید',
    completed: false,
    timeSeconds: 45,
    descriptionFa: 'لایه نهایی برای قفل کردن رطوبت.',
    reasonFa: 'ترمیم سد دفاعی در طول خواب',
  });

  return {
    cycleInsightFa: cycleInsight,
    weatherInsightFa: weatherInsight,
    procedureInsightFa: restriction.reasonFa || null,
    pmsWarningFa: pmsWarning,
    safetyWarningsFa: safetyWarnings,
    recommendedIngredientIds: Array.from(recommended),
    avoidIngredientIds: blockedList,
    morningRoutine: morning,
    nightRoutine: night,
    gentleMode,
    lifestyleInsightFa,
    ageInsightFa,
    ingredientAdvice,
  };
}

/** نام فارسی لیست ترکیبات — برای نمایش در UI. */
export function ingredientNamesFa(ids: string[]): string[] {
  return ids.map((id) => ingredientNameFa(id));
}
