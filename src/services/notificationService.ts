/**
 * یادآوری‌های محلی.
 *
 * تفاوت بنیادین با نسخه قبل: هر یادآوری بر اساس یک «تاریخ مطلق»
 * زمان‌بندی می‌شود (schedule.on با year/month/day)، نه یک بررسی
 * لحظه‌ای مثل «آیا الان در بازه PMS هستم؟». دلیلش این است که این
 * تابع فقط گاه‌به‌گاه دوباره اجرا می‌شود (تغییر تنطیمات، تغییر
 * تنطیمات چرخه، یا باز شدن دوباره اپ)، نه هر روز. یک یادآوری که با
 * «ساعت ۱۰ هر روز، اگر امروز PMS بود» ساخته شود، همان وضعیتِ لحظه
 * ساخته‌شدن را برای همیشه هر روز تکرار می‌کند — چون خودِ اعلان
 * زمان‌بندی‌شده دیگر دوباره ارزیابی نمی‌شود. با تاریخ مطلق، هر روز
 * دقیقاً یک اعلان واقعی و درست دارد و بعد از تاریخش خودبه‌خود تمام
 * می‌شود.
 *
 * مشکلات نسخه‌های قبل که اینجا حل شدند:
 *  ۱) یادآوری چرخه هرگز ارسال نمی‌شد، چون شرطش وجود cycleLength بود
 *     و cycleLength پیش‌فرض صفر (falsy) بود.
 *  ۲) متن اعلان روی صفحه قفل می‌گفت «در بازه پیش از قاعدگی هستید».
 *     الان حالت خنطی پیش‌فرض است.
 *  ۳) یادآوری نوبت با schedule.at = «۶۰ ثانیه دیگر» ساخته می‌شد،
 *     یعنی صرف‌نظر از این‌که ۳ روز یا ۰ روز مانده، همیشه یک دقیقه
 *     بعد از باز کردن اپ می‌آمد و برای روزهای بعد هیچ اعلانی نبود.
 *     الان هر یادآوری دقیقاً روی روز واقعی‌اش زمان‌بندی می‌شود.
 *  ۴) یادآوری PMS فقط «امروز» را می‌سنجید. الان کل بازه PMS
 *     پیش‌بینی‌شده، یک روز قبل از شروع PMS، فاز تخمک‌گذاری، و یک روز
 *     قبل از شروع پریود، هرکدام با تاریخ دقیق خودشان زمان‌بندی
 *     می‌شوند.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { Medication, UserState } from '../types';
import { getTodayCycleState } from './cycle/cycleService';
import { getUpcomingAppointments } from './providers/appointmentService';
import { getCachedWeather } from './weatherService';
import { LocalDB } from './db';
import { addDays, fromIsoDate, getDaysDifference, getTodayIsoDate } from './jalali';

// هر بلوک فاصله کافی از بلوک بعدی دارد تا offset/index داخلی‌اش هرگز با
// شناسه بلوک بعدی برخورد نکند (appointmentBase تا ۶ نوبت × ۱۰ = ۶۰ عدد،
// pmsWindowBase/ovulationBase تا ۱۳ عدد هرکدام، medicationBase تا ۶ دارو
// × ۵۰ عدد).
const IDS = {
  morning: 2101,
  night: 2102,
  symptom: 2104,
  appointmentBase: 2200,
  pmsWindowBase: 2300,
  ovulationBase: 2340,
  pmsTomorrow: 2380,
  periodTomorrow: 2381,
  medicationBase: 2400,
  uvBase: 2700,
};

/** حداکثر تعداد روزهای متوالی که برای یک بازه (مثلاً PMS) اعلان جدا می‌سازیم. */
const MAX_WINDOW_DAYS = 12;

/** حداکثر تعداد یادآوری دارو که از امروز به بعد زمان‌بندی می‌کنیم (برای هر دارو). */
const MAX_MEDICATION_DAYS = 14;

/**
 * iOS حداکثر ۶۴ اعلان محلی معلق را می‌پذیرد؛ بیشتر از آن بی‌صدا نادیده
 * گرفته می‌شود (نه خطا، نه هشدار). برای این‌که یک کاربر با چند نوبت و
 * چند دارو و بازه‌های چرخه، اعلان‌های حیاتی‌ترش (روتین، ثبت علائم، نوبت
 * نزدیک) را از دست ندهد، کل لیست را قبل از ارسال به همین سقف محدود
 * می‌کنیم؛ آیتم‌ها به ترتیب اولویت ساخته می‌شوند، پس برش از انتها درست است.
 */
const MAX_PENDING_NOTIFICATIONS = 60;

/** ساعت‌های ثابت هر بازه دارویی، هماهنگ با نوبت‌های روتین. */
const MEDICATION_HOURS: Record<Medication['timing'][number], { hour: number; minute: number }> = {
  morning: { hour: 8, minute: 30 },
  noon: { hour: 13, minute: 30 },
  night: { hour: 21, minute: 30 },
};

/** ساعت‌هایی از روز که در آن‌ها یادآور تجدید ضدآفتاب معنا دارد (تابش فعال روز). */
const UV_CHECK_HOURS = [10, 12, 14, 16, 18];

export type NotificationScheduleResult = 'scheduled' | 'disabled' | 'permission-denied' | 'error';

type NotificationList = Parameters<typeof LocalNotifications.schedule>[0]['notifications'];

function discreetOr(discreet: boolean, discreetText: string, fullText: string): string {
  return discreet ? discreetText : fullText;
}

/** روز/ماه/سال محلی یک تاریخ ISO، برای schedule.on. */
function dateParts(iso: string): { year: number; month: number; day: number } {
  const date = fromIsoDate(iso);
  return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() };
}

/**
 * یک اعلان تک‌روزه در تاریخ مطلق مشخص می‌سازد.
 * اگر تاریخ از امروز گذشته باشد، چیزی اضافه نمی‌کند (اعلانِ گذشته بی‌فایده است).
 */
function pushOneOff(
  list: NotificationList,
  today: string,
  dateIso: string,
  id: number,
  title: string,
  body: string,
  hour: number,
  minute: number,
): void {
  if (getDaysDifference(today, dateIso) < 0) return;
  const { year, month, day } = dateParts(dateIso);
  list.push({
    id,
    title,
    body,
    schedule: { on: { year, month, day, hour, minute }, allowWhileIdle: true },
    channelId: 'roza-care',
  });
}

export async function scheduleRozaNotifications(userState: UserState): Promise<NotificationScheduleResult> {
  try {
    const settings = userState.notifications;
    if (!settings.enabled) {
      await cancelRozaNotifications();
      return 'disabled';
    }

    const permission = await LocalNotifications.checkPermissions();
    // مشکل نسخه قبل: نتیجه این تابع (true/false) در App.tsx نادیده گرفته
    // می‌شد. اگر کاربر یک‌بار مجوز اعلان را رد می‌کرد (خیلی رایج، چون
    // اندروید ۱۳+ و iOS همان بار اول این پرامپت را نشان می‌دهند)، تمام
    // کلیدهای این صفحه «روشن» می‌ماندند ولی هیچ اعلانی هرگز ساخته
    // نمی‌شد و کاربر هیچ نشانه‌ای نمی‌دید. الان وضعیت واقعی برگردانده
    // می‌شود تا رابط کاربری بتواند هشدار «برو تنظیمات سیستم را باز کن»
    // نشان دهد.
    const granted = permission.display === 'granted' ? permission : await LocalNotifications.requestPermissions();
    if (granted.display !== 'granted') {
      await cancelRozaNotifications();
      return 'permission-denied';
    }

    await LocalNotifications.createChannel({
      id: 'roza-care',
      name: 'یادآوری‌های رزا',
      description: 'یادآوری روتین، چرخه، نوبت و هواشناسی',
      importance: 3,
      visibility: settings.discreetText ? 0 : 1,
      sound: 'default',
      vibration: true,
    }).catch(() => undefined);

    await cancelRozaNotifications();

    const notifications: NotificationList = [];
    const discreet = settings.discreetText;
    const today = getTodayIsoDate();
    const title = 'رزا';
    const genericBody = 'یک یادآوری در برنامه داری. باز کن.';

    if (settings.morningRoutine) {
      notifications.push({
        id: IDS.morning,
        title,
        body: 'وقت روتین صبح است. ضدآفتاب را فراموش نکن.',
        schedule: { on: { hour: settings.morningHour, minute: settings.morningMinute }, allowWhileIdle: true },
        channelId: 'roza-care',
      });
    }

    if (settings.nightRoutine) {
      notifications.push({
        id: IDS.night,
        title,
        body: 'چند دقیقه برای روتین شب وقت بگذار.',
        schedule: { on: { hour: settings.nightHour, minute: settings.nightMinute }, allowWhileIdle: true },
        channelId: 'roza-care',
      });
    }

    // یادآوری ثبت علائم روزانه — با ساعتی که کاربر خودش انتخاب کرده
    if (settings.symptomReminder) {
      notifications.push({
        id: IDS.symptom,
        title,
        body: discreetOr(discreet, genericBody, 'وقتشه علائم امروزت را در بخش سیکل ثبت کنی.'),
        schedule: {
          on: { hour: settings.symptomReminderHour, minute: settings.symptomReminderMinute },
          allowWhileIdle: true,
        },
        channelId: 'roza-care',
      });
    }

    /* ------------------------- یادآوری‌های چرخه ------------------------- */
    // فقط اگر واقعاً چرخه فعال، قابل مشاهده و کاربر باردار نباشد
    const cycleAllowed =
      userState.cycleConfig.enabled && !userState.privacy.hideCycleSection && !userState.profile.isPregnant;

    if (cycleAllowed) {
      const state = getTodayCycleState(userState.cycleConfig);

      if (state.available) {
        // بازه پیش از قاعدگی (PMS): یک اعلان برای هر روزِ باقی‌مانده این بازه،
        // نه فقط «امروز». هر روز تاریخ مطلق خودش را دارد و بعد از رد شدنش
        // اعلان بعدی هرگز به اشتباه دوباره ظاهر نمی‌شود.
        if (settings.cycleInsight && state.pmsStartIso && state.predictedPeriodStartIso) {
          const lastPmsDay = addDays(state.predictedPeriodStartIso, -1);
          const span = Math.min(MAX_WINDOW_DAYS, Math.max(0, getDaysDifference(state.pmsStartIso, lastPmsDay)));
          for (let offset = 0; offset <= span; offset += 1) {
            const dateIso = addDays(state.pmsStartIso, offset);
            pushOneOff(
              notifications,
              today,
              dateIso,
              IDS.pmsWindowBase + offset,
              title,
              discreetOr(
                discreet,
                genericBody,
                'بر اساس ثبت‌های تو، امروز در بازه پیش از قاعدگی هستی. روتین ملایم‌تری انتخاب کن.',
              ),
              10,
              0,
            );
          }
        }

        // «از فردا وارد PMS می‌شوی» — یک روز قبل از شروع بازه
        if (settings.periodReminder && state.pmsStartIso) {
          pushOneOff(
            notifications,
            today,
            addDays(state.pmsStartIso, -1),
            IDS.pmsTomorrow,
            title,
            discreetOr(
              discreet,
              genericBody,
              'از فردا احتمالاً وارد بازه پیش از قاعدگی می‌شوی. مراقب خودت باش و روتین ملایم‌تری برای روزهای پیش رو در نظر بگیر.',
            ),
            20,
            0,
          );
        }

        // «فردا پریودت شروع می‌شود» — فقط وقتی پیش‌بینی حداقلی معتبر باشد
        if (settings.periodReminder && state.predictedPeriodStartIso && state.confidence !== 'none') {
          const hedge = state.confidence === 'low' ? ' (این پیش‌بینی تقریبی است)' : '';
          pushOneOff(
            notifications,
            today,
            addDays(state.predictedPeriodStartIso, -1),
            IDS.periodTomorrow,
            title,
            discreetOr(discreet, genericBody, `به احتمال زیاد فردا پریودت شروع می‌شود. مراقب باش.${hedge}`),
            20,
            0,
          );
        }

        // فاز تخمک‌گذاری
        if (settings.ovulationReminder && state.ovulationFromIso && state.ovulationToIso) {
          const span = Math.min(
            MAX_WINDOW_DAYS,
            Math.max(0, getDaysDifference(state.ovulationFromIso, state.ovulationToIso)),
          );
          for (let offset = 0; offset <= span; offset += 1) {
            const dateIso = addDays(state.ovulationFromIso, offset);
            pushOneOff(
              notifications,
              today,
              dateIso,
              IDS.ovulationBase + offset,
              title,
              discreetOr(discreet, genericBody, 'الان احتمالاً در فاز تخمک‌گذاری هستی. مراقب خودت باش.'),
              9,
              0,
            );
          }
        }
      }
    }

    /* ---------------------- یادآوری نوبت‌ها و چک‌لیست ---------------------- */
    if (settings.appointmentReminder) {
      const providers = LocalDB.getProviders();

      getUpcomingAppointments(6).forEach((appointment, index) => {
        const provider = providers.find((item) => item.id === appointment.providerId);
        const hasPrep = (appointment.prepChecklistFa || []).length > 0;
        const label = provider?.name || appointment.titleFa || 'نوبت';

        appointment.remindersDaysBefore.forEach((daysBefore, reminderIndex) => {
          const reminderDateIso = addDays(appointment.dateIso, -daysBefore);

          // اگر خودِ نوبت امروز است و ساعت مشخصی دارد، یادآوری چند ساعت
          // قبل از همان ساعت باشد، نه یک ساعت ثابت صبح.
          let hour = 9;
          let minute = 0;
          if (daysBefore === 0 && appointment.timeHhmm) {
            const [apptHour, apptMinute] = appointment.timeHhmm.split(':').map((part) => parseInt(part, 10));
            const totalMinutes = ((apptHour || 0) * 60 + (apptMinute || 0) - 120 + 1440) % 1440;
            hour = Math.floor(totalMinutes / 60);
            minute = totalMinutes % 60;
          }

          pushOneOff(
            notifications,
            today,
            reminderDateIso,
            IDS.appointmentBase + index * 10 + reminderIndex,
            title,
            discreetOr(
              discreet,
              daysBefore === 0 ? 'امروز یک نوبت داری.' : `${daysBefore} روز تا نوبتت.`,
              daysBefore === 0
                ? `امروز نوبت ${label} را داری.`
                : `${daysBefore} روز تا نوبت ${label}.${hasPrep ? ' چک‌لیست قبل از جلسه را ببین.' : ''}`,
            ),
            hour,
            minute,
          );
        });
      });
    }

    /* --------------------------- یادآوری دارو --------------------------- */
    // مشکل نسخه قبل: تنظیم medicationReminder وجود داشت (و پیش‌فرض روشن
    // بود)، شناسه‌اش هم رزرو شده بود، ولی هیچ‌جای کد از لیست داروهای فعال
    // کاربر (که در بخش پزشک/پرونده پوست ثبت می‌شود) یک اعلان واقعی
    // نمی‌ساخت — یعنی این یادآوری همیشه، برای همه، کاملاً غیرفعال بود.
    // الان برای هر دارویی که isActive است، به ازای هر بازه مصرف
    // (صبح/ظهر/شب) و هر روزِ داخل بازه startDateIso..durationDays یک
    // اعلان روی تاریخ مطلق همان روز ساخته می‌شود.
    if (settings.medicationReminder) {
      const medications = LocalDB.getMedications()
        .filter((item) => item.isActive)
        .slice(0, 6);

      medications.forEach((medication, medIndex) => {
        const startedAlready = getDaysDifference(today, medication.startDateIso) <= 0;
        const firstDay = startedAlready ? today : medication.startDateIso;
        const windowEnd = medication.durationDays
          ? addDays(medication.startDateIso, medication.durationDays - 1)
          : addDays(today, MAX_MEDICATION_DAYS - 1);
        const span = Math.min(MAX_MEDICATION_DAYS - 1, Math.max(0, getDaysDifference(firstDay, windowEnd)));
        const timings = medication.timing.length > 0 ? medication.timing : (['morning'] as const);

        for (let offset = 0; offset <= span; offset += 1) {
          const dateIso = addDays(firstDay, offset);
          timings.forEach((timing, timingIndex) => {
            const { hour, minute } = MEDICATION_HOURS[timing];
            pushOneOff(
              notifications,
              today,
              dateIso,
              IDS.medicationBase + medIndex * 50 + offset * 3 + timingIndex,
              title,
              discreetOr(
                discreet,
                genericBody,
                `وقت مصرف ${medication.nameFa} است.${medication.dose ? ` (${medication.dose})` : ''}`,
              ),
              hour,
              minute,
            );
          });
        }
      });
    }

    /* --------------------------- هشدار یووی --------------------------- */
    // مشکل نسخه قبل: این اعلان با schedule.at = «۶۰ ثانیه دیگر» ساخته
    // می‌شد. یعنی فقط وقتی معنا داشت که کاربر همان لحظه اپ را باز کرده
    // بود؛ اگر بعد از باز کردن اپ صبح، یووی ظهر بالا می‌رفت، یا کاربر
    // بعد از آن لحظه دیگر اپ را باز نمی‌کرد، هیچ هشداری نمی‌آمد — و
    // «هر چند ساعت تجدیدش کن» که در متن نوشته می‌شد، عملاً هیچ تکراری
    // نداشت (فقط یک‌بار، همان یک دقیقه بعد).
    // الان: بر اساس آخرین داده کش‌شده (حداکثر UV پیش‌بینی امروز)، اگر
    // بالا باشد، برای همه ساعت‌های فعالِ باقی‌مانده امروز (UV_CHECK_HOURS)
    // یک اعلان تجدید ضدآفتاب جداگانه زمان‌بندی می‌شود — نه فقط یکی.
    // چون این بخش با هر resume/تغییر تنظیمات دوباره ساخته می‌شود و
    // HomeDashboard کش هواشناسی را هر بار که اپ باز است تازه می‌کند،
    // این لیست هم با تازه‌ترین پیش‌بینی هماهنگ می‌ماند.
    if (settings.uvAlert) {
      const weather = getCachedWeather();
      if (weather?.hasData && !weather.isStale && weather.uvIndex >= 6) {
        const uvBody = discreetOr(
          discreet,
          genericBody,
          `شاخص یووی${weather.city ? ` در ${weather.city}` : ''} امروز بالاست (${weather.uvIndex}). ضدآفتاب را تجدید کن.`,
        );
        const now = new Date();
        const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
        const upcomingHours = UV_CHECK_HOURS.filter((hour) => hour * 60 > currentTotalMinutes);

        if (upcomingHours.length > 0) {
          upcomingHours.forEach((hour, index) => {
            pushOneOff(notifications, today, today, IDS.uvBase + index, title, uvBody, hour, 0);
          });
        } else if (now.getHours() < 19) {
          // هیچ‌کدام از ساعت‌های ثابت باقی نمانده ولی هنوز روز است (مثلاً
          // ساعت ۱۸:۳۰ اپ باز شده): یک هشدار فوری، نه یک ساعت بی‌ربط.
          notifications.push({
            id: IDS.uvBase,
            title,
            body: uvBody,
            schedule: { at: new Date(Date.now() + 60 * 1000), allowWhileIdle: true },
            channelId: 'roza-care',
          });
        }
      }
    }

    // سقف امن تعداد اعلان‌های معلق (رجوع کنید به توضیح MAX_PENDING_NOTIFICATIONS).
    // آیتم‌ها به ترتیب اولویت بالا به پایین ساخته شدند، پس برش از انتها
    // یعنی روتین صبح/شب/ثبت‌علائم و نزدیک‌ترین یادآوری‌ها همیشه می‌مانند.
    const finalNotifications =
      notifications.length > MAX_PENDING_NOTIFICATIONS
        ? notifications.slice(0, MAX_PENDING_NOTIFICATIONS)
        : notifications;

    if (finalNotifications.length > 0) {
      await LocalNotifications.schedule({ notifications: finalNotifications });
    }
    return 'scheduled';
  } catch (error) {
    console.warn('Local notifications unavailable', error);
    return 'error';
  }
}

export async function cancelRozaNotifications(): Promise<void> {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map((item) => ({ id: item.id })),
      });
    }
  } catch {
    /* در وب موجود نیست */
  }
}
