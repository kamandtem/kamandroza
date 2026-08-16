/**
 * یادآوری‌های محلی.
 *
 * دو مشکل نسخه ۱ حل شد:
 *  ۱) یادآوری چرخه هرگز ارسال نمی‌شد، چون شرطش وجود cycleLength بود
 *     و cycleLength پیش‌فرض صفر (falsy) بود.
 *  ۲) متن اعلان روی صفحه قفل می‌گفت «در بازه پیش از قاعدگی هستید».
 *     الان حالت خنطی پیش‌فرض است.
 */

import { LocalNotifications } from '@capacitor/local-notifications';
import { UserState } from '../types';
import { getTodayCycleState } from './cycle/cycleService';
import { getUpcomingAppointments } from './providers/appointmentService';
import { LocalDB } from './db';
import { getDaysDifference, getTodayIsoDate } from './jalali';

const IDS = { morning: 2101, night: 2102, cycle: 2103, appointmentBase: 2200, medication: 2300 };

function discreetOr(discreet: boolean, discreetText: string, fullText: string): string {
  return discreet ? discreetText : fullText;
}

export async function scheduleRozaNotifications(userState: UserState): Promise<boolean> {
  try {
    const settings = userState.notifications;
    if (!settings.enabled) {
      await cancelRozaNotifications();
      return true;
    }

    const permission = await LocalNotifications.checkPermissions();
    const granted = permission.display === 'granted' ? permission : await LocalNotifications.requestPermissions();
    if (granted.display !== 'granted') return false;

    await LocalNotifications.createChannel({
      id: 'roza-care',
      name: 'یادآوری‌های رزا',
      description: 'یادآوری روتین، نوبت و دارو',
      importance: 3,
      visibility: settings.discreetText ? 0 : 1,
      sound: 'default',
      vibration: true,
    }).catch(() => undefined);

    await cancelRozaNotifications();

    const notifications: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];
    const discreet = settings.discreetText;

    if (settings.morningRoutine) {
      notifications.push({
        id: IDS.morning,
        title: 'رزا',
        body: 'وقت روتین صبح است. ضدآفتاب را فراموش نکن.',
        schedule: { on: { hour: settings.morningHour, minute: settings.morningMinute }, allowWhileIdle: true },
        channelId: 'roza-care',
      });
    }

    if (settings.nightRoutine) {
      notifications.push({
        id: IDS.night,
        title: 'رزا',
        body: 'چند دقیقه برای روتین شب وقت بگذار.',
        schedule: { on: { hour: settings.nightHour, minute: settings.nightMinute }, allowWhileIdle: true },
        channelId: 'roza-care',
      });
    }

    // یادآوری چرخه — فقط اگر واقعاً داده و پیش‌بینی وجود داشته باشد
    if (settings.cycleInsight && userState.cycleConfig.enabled && !userState.privacy.hideCycleSection) {
      const state = getTodayCycleState(userState.cycleConfig);
      if (state.available && state.inPmsWindow) {
        notifications.push({
          id: IDS.cycle,
          title: 'رزا',
          body: discreetOr(
            discreet,
            'یک یادآوری در برنامه داری. باز کن.',
            'بر اساس ثبت‌های تو، به بازه پیش از قاعدگی نزدیک شده‌ای. روتین ملایم‌تری انتخاب کن.',
          ),
          schedule: { on: { hour: 10, minute: 0 }, allowWhileIdle: true },
          channelId: 'roza-care',
        });
      }
    }

    // یادآوری نوبت‌ها و چک‌لیست قبل از جلسه
    if (settings.appointmentReminder) {
      const providers = LocalDB.getProviders();
      const today = getTodayIsoDate();

      getUpcomingAppointments(6).forEach((appointment, index) => {
        const provider = providers.find((item) => item.id === appointment.providerId);
        const daysAway = getDaysDifference(today, appointment.dateIso);

        appointment.remindersDaysBefore.forEach((daysBefore, reminderIndex) => {
          if (daysAway !== daysBefore) return;
          const hasPrep = (appointment.prepChecklistFa || []).length > 0;
          const label = provider?.name || appointment.titleFa || 'نوبت';
          notifications.push({
            id: IDS.appointmentBase + index * 10 + reminderIndex,
            title: 'رزا',
            body: discreetOr(
              discreet,
              daysBefore === 0 ? 'امروز یک نوبت داری.' : `${daysBefore} روز تا نوبتت.`,
              daysBefore === 0
                ? `امروز نوبت ${label} را داری.`
                : `${daysBefore} روز تا نوبت ${label}.${hasPrep ? ' چک‌لیست قبل از جلسه را ببین.' : ''}`,
            ),
            schedule: { at: new Date(Date.now() + 60 * 1000), allowWhileIdle: true },
            channelId: 'roza-care',
          });
        });
      });
    }

    if (notifications.length > 0) {
      await LocalNotifications.schedule({ notifications });
    }
    return true;
  } catch (error) {
    console.warn('Local notifications unavailable', error);
    return false;
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
