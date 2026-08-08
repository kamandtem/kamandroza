import { LocalNotifications } from '@capacitor/local-notifications';
import { UserState } from '../types';
import { computeCycleInfo, getTodayIsoDate } from './jalali';

const IDS = { morning: 2101, night: 2102, cycle: 2103 };
const DEFAULTS = { enabled: true, morningRoutine: true, morningHour: 9, morningMinute: 0, nightRoutine: true, nightHour: 21, nightMinute: 0, cycleInsight: true };

export async function scheduleRozaNotifications(userState: UserState): Promise<boolean> {
  try {
    const settings = userState.notifications || DEFAULTS;
    if (!settings.enabled) { await cancelRozaNotifications(); return true; }
    const permission = await LocalNotifications.checkPermissions();
    const granted = permission.display === 'granted' ? permission : await LocalNotifications.requestPermissions();
    if (granted.display !== 'granted') return false;

    await LocalNotifications.createChannel({
      id: 'roza-care', name: 'یادآوری‌های رزا', description: 'یادآوری روتین و چرخه بدن', importance: 3, visibility: 1, sound: 'default', vibration: true,
    }).catch(() => undefined);

    await LocalNotifications.cancel({ notifications: Object.values(IDS).map(id => ({ id })) });
    const notifications = [];
    if (settings.morningRoutine) notifications.push({ id: IDS.morning, title: 'صبح بخیر، وقت مراقبت از پوست است', body: 'روتین صبح را با آرامش انجام دهید و ضدآفتاب را فراموش نکنید.', schedule: { on: { hour: settings.morningHour, minute: settings.morningMinute }, allowWhileIdle: true }, channelId: 'roza-care' });
    if (settings.nightRoutine) notifications.push({ id: IDS.night, title: 'روتین شب رزا', body: 'چند دقیقه برای پاکسازی و مراقبت امشب وقت بگذارید.', schedule: { on: { hour: settings.nightHour, minute: settings.nightMinute }, allowWhileIdle: true }, channelId: 'roza-care' });

    if (settings.cycleInsight && userState.cycleConfig.enabled && userState.cycleConfig.lastPeriodDate && userState.cycleConfig.cycleLength) {
      const info = computeCycleInfo(userState.cycleConfig.lastPeriodDate, userState.cycleConfig.cycleLength, userState.cycleConfig.periodLength || 5, userState.cycleConfig.pmsStartDaysBefore || 7, getTodayIsoDate());
      if (info.inPmsWindow) {
        notifications.push({ id: IDS.cycle, title: 'یادآوری چرخه بدن', body: 'بر اساس ثبت‌های شما، احتمالاً در بازه پیش از قاعدگی هستید. روتین ملایم‌تری انتخاب کنید.', schedule: { on: { hour: 10, minute: 0 }, allowWhileIdle: true }, channelId: 'roza-care' });
      }
    }
    await LocalNotifications.schedule({ notifications });
    return true;
  } catch (error) {
    console.warn('Local notifications unavailable', error);
    return false;
  }
}

export async function cancelRozaNotifications(): Promise<void> {
  try { await LocalNotifications.cancel({ notifications: Object.values(IDS).map(id => ({ id })) }); } catch { /* web fallback */ }
}
