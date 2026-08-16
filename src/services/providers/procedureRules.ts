/**
 * قواعد خدمات زیبایی.
 *
 * این فایل، دلیل وجود بخش آرایشگاه داخل رزا است. وگرنه یک تقویم
 * ساده روی گوشی کافی بود. سه کار می‌کند:
 *   ۱) می‌گوید چند روز قبل از جلسه، کدام ترکیبات باید قطع شوند.
 *   ۲) روتین روزهای قبل و بعد را خودکار ملایم می‌کند.
 *   ۳) می‌گوید کدام روزهای چرخه برای این خدمت مناسب یا نامناسبند.
 */

import { MenstrualPhase, ServiceCategory } from '../../types';

export interface ProcedureRule {
  category: ServiceCategory;
  labelFa: string;
  /** چند روز قبل، ترکیبات فعال قطع شوند. ۰ = لازم نیست. */
  pauseActivesDaysBefore: number;
  /** چند روز بعد، روتین باید ملایم و فقط ترمیمی باشد. */
  gentleRoutineDaysAfter: number;
  /** شناسه ترکیباتی که در بازه پرهیز باید حذف شوند. */
  avoidIngredientIds: string[];
  prepChecklistFa: string[];
  aftercareChecklistFa: string[];
  /** فازهایی که بهتر است این خدمت انجام نشود. */
  discouragedPhases: MenstrualPhase[];
  /** در بازه پیش از قاعدگی توصیه نمی‌شود. */
  discouragedInPms: boolean;
  /** فاز طلایی برای این خدمت. */
  preferredPhases: MenstrualPhase[];
  reasonFa: string;
  /** در بارداری باید هشدار داده شود. */
  pregnancyCautionFa?: string;
  /** در دوره مصرف رتینوئید خوراکی ممنوع است. */
  blockedOnOralRetinoid?: boolean;
  /** فاصله تکرار معمول (روز). ملاک پیشنهاد جلسه بعدی. */
  typicalIntervalDays?: number;
}

const ACIDS = ['ing_retinol', 'ing_glycolic_acid', 'ing_salicylic_acid', 'ing_vitamin_c'];
const STRONG_ACTIVES = ['ing_retinol', 'ing_glycolic_acid', 'ing_salicylic_acid'];

export const PROCEDURE_RULES: ProcedureRule[] = [
  {
    category: 'laser',
    labelFa: 'لیزر یا آی پی ال',
    pauseActivesDaysBefore: 7,
    gentleRoutineDaysAfter: 3,
    avoidIngredientIds: ACIDS,
    prepChecklistFa: [
      '۷ روز قبل، رتینول و همه اسیدهای لایه‌بردار را قطع کنید.',
      '۲ هفته قبل برنزه نشوید و از آفتاب مستقیم دوری کنید.',
      'روز جلسه پوست تمیز و بدون کرم و میکاپ باشد.',
      'اگر داروی حساس‌کننده به نور مصرف می‌کنید، به اپراتور اطلاع دهید.',
    ],
    aftercareChecklistFa: [
      '۴۸ ساعت فقط شوینده ملایم و کرم ترمیمی سرامیددار.',
      'ضدآفتاب اجباری و تجدید هر دو ساعت؛ ۲ هفته جدی بگیرید.',
      'تا ۳ روز سونا، استخر، ورزش سنگین و آب داغ ممنوع.',
      'رتینول و اسیدها را حداقل ۳ روز بعد شروع کنید.',
    ],
    discouragedPhases: ['menstrual'],
    discouragedInPms: true,
    preferredPhases: ['follicular'],
    reasonFa: 'در روزهای قاعدگی و پیش از آن، آستانه درد پایین‌تر و پوست مستعد قرمزی است.',
    pregnancyCautionFa: 'در بارداری قبل از لیزر حتماً با پزشک مشورت کنید.',
    blockedOnOralRetinoid: true,
    typicalIntervalDays: 35,
  },
  {
    category: 'wax',
    labelFa: 'اپیلاسیون و وکس',
    pauseActivesDaysBefore: 3,
    gentleRoutineDaysAfter: 2,
    avoidIngredientIds: STRONG_ACTIVES,
    prepChecklistFa: [
      '۳ روز قبل، رتینول و اسیدها را روی ناحیه مورد نطر قطع کنید.',
      'پوست را مرطوب نگه دارید ولی روز جلسه چربی نزنید.',
    ],
    aftercareChecklistFa: [
      '۲۴ ساعت اول فقط تسکین‌دهنده (پانتنول یا سیکا).',
      'تا ۲ روز بدون لایه‌بردار و بدون ورزش سنگین.',
    ],
    discouragedPhases: ['menstrual'],
    discouragedInPms: true,
    preferredPhases: ['follicular', 'ovulation'],
    reasonFa: 'در روزهای قاعدگی و PMS درد بیشتر حس می‌شود و پوست زودتر تحریک می‌شود.',
    blockedOnOralRetinoid: true,
    typicalIntervalDays: 25,
  },
  {
    category: 'threading',
    labelFa: 'بند و اصلاح صورت',
    pauseActivesDaysBefore: 2,
    gentleRoutineDaysAfter: 1,
    avoidIngredientIds: STRONG_ACTIVES,
    prepChecklistFa: ['۲ روز قبل لایه‌بردار نزنید.'],
    aftercareChecklistFa: ['تا ۲۴ ساعت ترکیب فعال نزنید؛ فقط تسکین‌دهنده و ضدآفتاب.'],
    discouragedPhases: ['menstrual'],
    discouragedInPms: true,
    preferredPhases: ['follicular', 'ovulation'],
    reasonFa: 'در روزهای حساس، قرمزی بعد از بند بیشتر و ماندگارتر است.',
    typicalIntervalDays: 21,
  },
  {
    category: 'peeling',
    labelFa: 'پیلینگ شیمیایی',
    pauseActivesDaysBefore: 7,
    gentleRoutineDaysAfter: 10,
    avoidIngredientIds: ACIDS,
    prepChecklistFa: [
      '۷ روز قبل همه ترکیبات فعال را قطع کنید.',
      'سابقه تبخال و حساسیت را به متخصص بگویید.',
    ],
    aftercareChecklistFa: [
      '۱۰ روز فقط آبرسان و ترمیم‌کننده.',
      'پوسته‌ها را نکنید؛ خودشان می‌روند.',
      'ضدآفتاب مطلقاً اجباری.',
    ],
    discouragedPhases: ['menstrual', 'luteal'],
    discouragedInPms: true,
    preferredPhases: ['follicular'],
    reasonFa: 'در فاز لوتئال و قاعدگی، ریسک لک التهابی بعد از پیلینگ بالاتر است.',
    pregnancyCautionFa: 'پیلینگ شیمیایی در بارداری معمولاً توصیه نمی‌شود.',
    blockedOnOralRetinoid: true,
    typicalIntervalDays: 30,
  },
  {
    category: 'microneedling',
    labelFa: 'میکرونیدلینگ',
    pauseActivesDaysBefore: 7,
    gentleRoutineDaysAfter: 7,
    avoidIngredientIds: ACIDS,
    prepChecklistFa: ['۷ روز قبل ترکیبات فعال را قطع کنید.', 'پوست نباید جوش فعال التهابی داشته باشد.'],
    aftercareChecklistFa: [
      '۲۴ ساعت فقط سرم آبرسان ساده و بدون میکاپ.',
      '۷ روز لایه‌برداری ممنوع.',
      'ضدآفتاب معدنی ملایم از روز دوم.',
    ],
    discouragedPhases: ['menstrual', 'luteal'],
    discouragedInPms: true,
    preferredPhases: ['follicular'],
    reasonFa: 'در فاز لوتئال و PMS، پوست ملتهب‌تر است و ترمیم کندتر انجام می‌شود.',
    pregnancyCautionFa: 'در بارداری توصیه نمی‌شود.',
    blockedOnOralRetinoid: true,
    typicalIntervalDays: 30,
  },
  {
    category: 'facial',
    labelFa: 'فیشیال',
    pauseActivesDaysBefore: 2,
    gentleRoutineDaysAfter: 1,
    avoidIngredientIds: STRONG_ACTIVES,
    prepChecklistFa: ['۲ روز قبل لایه‌بردار قوی نزنید.'],
    aftercareChecklistFa: ['امشب روتین را ساده نگه دارید.', 'فردا ضدآفتاب را جدی بگیرید.'],
    discouragedPhases: [],
    discouragedInPms: false,
    preferredPhases: ['follicular', 'ovulation'],
    reasonFa: 'در فاز فولیکولار پوست مقاوم‌تر است و نتیجه بهتر دیده می‌شود.',
    typicalIntervalDays: 30,
  },
  {
    category: 'cleansing',
    labelFa: 'پاکسازی پوست',
    pauseActivesDaysBefore: 3,
    gentleRoutineDaysAfter: 3,
    avoidIngredientIds: STRONG_ACTIVES,
    prepChecklistFa: ['۳ روز قبل رتینول و اسید را قطع کنید.'],
    aftercareChecklistFa: [
      '۴۸ ساعت میکاپ سنگین نزنید.',
      '۳ روز فقط روتین ملایم و ترمیمی.',
    ],
    discouragedPhases: ['menstrual', 'luteal'],
    discouragedInPms: true,
    preferredPhases: ['follicular'],
    reasonFa: 'در روزهای پیش از قاعدگی، منافذ متورم‌تر و پوست حساس‌تر است.',
    typicalIntervalDays: 30,
  },
  {
    category: 'hair_color',
    labelFa: 'رنگ مو',
    pauseActivesDaysBefore: 0,
    gentleRoutineDaysAfter: 0,
    avoidIngredientIds: [],
    prepChecklistFa: [
      '۲۴ تا ۴۸ ساعت قبل مو را نشویید (چربی طبیعی پوست سر محافط است).',
      'تست حساسیت پوست پشت گوش را ۴۸ ساعت قبل انجام دهید.',
      'فرمول دفعه قبل را از دفترچه رزا به آرایشگر نشان دهید.',
    ],
    aftercareChecklistFa: [
      '۴۸ ساعت اول مو را نشویید.',
      'شامپوی بدون سولفات استفاده کنید.',
      'موعد رنگ ریشه را در رزا ثبت کنید تا یادآوری بگیرید.',
    ],
    discouragedPhases: [],
    discouragedInPms: false,
    preferredPhases: [],
    reasonFa: '',
    pregnancyCautionFa: 'در سه ماه اول بارداری بهتر است رنگ مو را به تاخیر بیندازید یا از روش بدون تماس با پوست سر استفاده کنید.',
    typicalIntervalDays: 28,
  },
  {
    category: 'highlight',
    labelFa: 'هایلایت و دکلره',
    pauseActivesDaysBefore: 0,
    gentleRoutineDaysAfter: 0,
    avoidIngredientIds: [],
    prepChecklistFa: ['۴۸ ساعت قبل مو را نشویید.', 'ماسک ترمیمی پروتئینی را یک هفته قبل شروع کنید.'],
    aftercareChecklistFa: ['شامپو و ماسک مخصوص موی دکلره.', 'حرارت مستقیم (سشوار داغ) را کم کنید.'],
    discouragedPhases: [],
    discouragedInPms: false,
    preferredPhases: [],
    reasonFa: '',
    typicalIntervalDays: 60,
  },
  {
    category: 'keratin',
    labelFa: 'کراتین و احیا',
    pauseActivesDaysBefore: 0,
    gentleRoutineDaysAfter: 0,
    avoidIngredientIds: [],
    prepChecklistFa: ['ترکیبات ماده مصرفی را بپرسید (فرمالدئید).', 'محل کار باید تهویه داشته باشد.'],
    aftercareChecklistFa: ['تا ۷۲ ساعت مو را نشویید و نبندید.', 'شامپوی بدون سولفات اجباری است.'],
    discouragedPhases: [],
    discouragedInPms: false,
    preferredPhases: [],
    reasonFa: '',
    pregnancyCautionFa: 'در بارداری و شیردهی، تماس با مواد حاوی فرمالدئید توصیه نمی‌شود.',
    typicalIntervalDays: 120,
  },
  {
    category: 'brow',
    labelFa: 'ابرو (تاتو، لیفت، رنگ)',
    pauseActivesDaysBefore: 5,
    gentleRoutineDaysAfter: 7,
    avoidIngredientIds: ACIDS,
    prepChecklistFa: ['۵ روز قبل رتینول و اسید روی ناحیه ابرو نزنید.'],
    aftercareChecklistFa: ['۷ روز روی ابرو ترکیب فعال نزنید.', 'ناحیه را خشک نگه دارید.'],
    discouragedPhases: ['menstrual'],
    discouragedInPms: true,
    preferredPhases: ['follicular'],
    reasonFa: 'در روزهای حساس، تورم و درد بیشتر است و ماندگاری رنگ کمتر می‌شود.',
    typicalIntervalDays: 45,
  },
  {
    category: 'procedure',
    labelFa: 'خدمت پوستی دیگر',
    pauseActivesDaysBefore: 3,
    gentleRoutineDaysAfter: 3,
    avoidIngredientIds: STRONG_ACTIVES,
    prepChecklistFa: ['۳ روز قبل ترکیبات فعال را قطع کنید.'],
    aftercareChecklistFa: ['تا ۳ روز روتین ملایم و ضدآفتاب.'],
    discouragedPhases: ['menstrual'],
    discouragedInPms: true,
    preferredPhases: ['follicular'],
    reasonFa: 'در روزهای حساس، تحمل پوست پایین‌تر است.',
    typicalIntervalDays: 30,
  },
];

export function findProcedureRule(category: ServiceCategory): ProcedureRule | undefined {
  return PROCEDURE_RULES.find((rule) => rule.category === category);
}

/** خدماتی که قاعده پرهیز دارند — برای نمایش نشان هشدار در لیست. */
export function hasRoutineImpact(category: ServiceCategory): boolean {
  const rule = findProcedureRule(category);
  if (!rule) return false;
  return rule.pauseActivesDaysBefore > 0 || rule.gentleRoutineDaysAfter > 0;
}
