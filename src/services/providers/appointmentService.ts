/**
 * سرویس نوبت‌ها.
 *
 * نقطه اتصال سه بخش اپ: آرایشگاه/پزشک ←→ روتین پوست ←→ چرخه.
 * بدون این فایل، بخش آرایشگاه فقط یک تقویم است.
 */

import {
  Appointment,
  AppointmentStatus,
  MenstrualCycleConfig,
  Provider,
  ProviderKind,
  ProviderService,
  ServiceCategory,
  SkinProfile,
} from '../../types';
import { LocalDB, createId } from '../db';
import { addDays, getDaysDifference, getTodayIsoDate } from '../jalali';
import { computeCycleState } from '../cycle/cycleService';
import { PROCEDURE_RULES, ProcedureRule, findProcedureRule } from './procedureRules';
import { createReferralId, trackReferralEvent } from '../telemetry';

/* ----------------------------- موجودیت‌ها ----------------------------- */

export function createProvider(input: Partial<Provider> & { name: string; kind: ProviderKind }): Provider {
  const provider: Provider = {
    id: createId('prov'),
    kind: input.kind,
    source: input.source || 'user',
    name: input.name,
    specialties: input.specialties || [],
    contactName: input.contactName,
    phone: input.phone,
    instagram: input.instagram,
    city: input.city,
    address: input.address,
    myRating: input.myRating,
    isFavorite: input.isFavorite ?? false,
    notesFa: input.notesFa,
    bookingMode: input.bookingMode || 'manual',
    partnerId: input.partnerId,
    isSponsored: input.isSponsored,
    updatedAt: new Date().toISOString(),
  };
  LocalDB.saveProvider(provider);
  return provider;
}

export function getServicesOfProvider(providerId: string): ProviderService[] {
  return LocalDB.getProviderServices().filter((service) => service.providerId === providerId);
}

/* ----------------------------- چک‌لیست‌ها ----------------------------- */

function collectRules(categories: ServiceCategory[]): ProcedureRule[] {
  const rules = categories
    .map((category) => findProcedureRule(category))
    .filter((rule): rule is ProcedureRule => Boolean(rule));
  return rules;
}

/** چک‌لیست قبل و بعد جلسه، بر اساس خدمات و وضعیت خود کاربر. */
export function buildChecklists(
  categories: ServiceCategory[],
  profile: SkinProfile,
): { prepFa: string[]; aftercareFa: string[]; warningsFa: string[] } {
  const rules = collectRules(categories);
  const prep = new Set<string>();
  const aftercare = new Set<string>();
  const warnings = new Set<string>();

  rules.forEach((rule) => {
    rule.prepChecklistFa.forEach((item) => prep.add(item));
    rule.aftercareChecklistFa.forEach((item) => aftercare.add(item));

    if (profile.isPregnant && rule.pregnancyCautionFa) warnings.add(rule.pregnancyCautionFa);
    if (profile.isBreastfeeding && rule.category === 'keratin' && rule.pregnancyCautionFa) {
      warnings.add(rule.pregnancyCautionFa);
    }
    if (profile.onOralRetinoid && rule.blockedOnOralRetinoid) {
      warnings.add(
        `در دوره مصرف رتینوئید خوراکی، ${rule.labelFa} معمولاً توصیه نمی‌شود. قبل از رزرو با پزشکت مشورت کن.`,
      );
    }
  });

  return { prepFa: Array.from(prep), aftercareFa: Array.from(aftercare), warningsFa: Array.from(warnings) };
}

/* ----------------------------- هوشمندی چرخه ----------------------------- */

export type DaySuitability = 'good' | 'neutral' | 'avoid';

export interface DayAdvice {
  suitability: DaySuitability;
  reasonFa: string;
}

/**
 * می‌گوید یک روز خاص برای این خدمت مناسب است یا نه.
 * اگر چرخه فعال نباشد یا داده کافی نباشد، neutral برمی‌گرداند.
 * هرگز حدس نمی‌زند.
 */
export function adviseDayForServices(
  dateIso: string,
  categories: ServiceCategory[],
  cycleConfig: MenstrualCycleConfig,
): DayAdvice {
  const rules = collectRules(categories).filter(
    (rule) => rule.discouragedPhases.length > 0 || rule.discouragedInPms || rule.preferredPhases.length > 0,
  );
  if (rules.length === 0) return { suitability: 'neutral', reasonFa: '' };

  const state = computeCycleState(cycleConfig, LocalDB.getPeriodLogs(), dateIso);
  if (!state.available || !state.phase) return { suitability: 'neutral', reasonFa: '' };

  const blocking = rules.find(
    (rule) => rule.discouragedPhases.includes(state.phase!) || (rule.discouragedInPms && state.inPmsWindow),
  );
  if (blocking) {
    const context = state.inPmsWindow ? 'بازه پیش از قاعدگی' : `فاز ${state.phaseNameFa}`;
    const hedge = state.confidence === 'high' || state.confidence === 'medium' ? '' : ' (این پیش‌بینی تقریبی است)';
    return {
      suitability: 'avoid',
      reasonFa: `این روز احتمالاً در ${context} است. ${blocking.reasonFa}${hedge}`,
    };
  }

  const preferred = rules.find((rule) => rule.preferredPhases.includes(state.phase!));
  if (preferred) {
    return { suitability: 'good', reasonFa: `روز مناسبی است. ${preferred.reasonFa}` };
  }

  return { suitability: 'neutral', reasonFa: '' };
}

/** بهترین روزهای پیشنهادی در ۴۵ روز آینده برای یک خدمت. */
export function suggestBestDays(
  categories: ServiceCategory[],
  cycleConfig: MenstrualCycleConfig,
  horizonDays = 45,
): { dateIso: string; reasonFa: string }[] {
  const today = getTodayIsoDate();
  const results: { dateIso: string; reasonFa: string }[] = [];
  for (let offset = 1; offset <= horizonDays; offset += 1) {
    const dateIso = addDays(today, offset);
    const advice = adviseDayForServices(dateIso, categories, cycleConfig);
    if (advice.suitability === 'good') results.push({ dateIso, reasonFa: advice.reasonFa });
    if (results.length >= 5) break;
  }
  return results;
}

/* ----------------------------- تاثیر بر روتین ----------------------------- */

export interface RoutineRestriction {
  /** شناسه ترکیباتی که امروز نباید مصرف شوند. */
  blockedIngredientIds: string[];
  /** روتین امروز باید ملایم و ترمیمی باشد. */
  gentleMode: boolean;
  /** دلیل قابل نمایش به کاربر. */
  reasonFa: string;
  /** نوبت مربوطه. */
  appointmentId?: string;
}

/**
 * مهم‌ترین تابع این فایل.
 * وقتی کاربر نوبت لیزر یا پیلینگ ثبت می‌کند، روتین روزهای قبل و
 * بعد خودکار عوض می‌شود. کاربر لازم نیست چیزی یادش بماند.
 */
export function getRoutineRestrictionForDate(dateIso: string = getTodayIsoDate()): RoutineRestriction {
  const services = LocalDB.getProviderServices();
  const appointments = LocalDB.getAppointments().filter(
    (appointment) => appointment.status !== 'canceled' && appointment.status !== 'missed',
  );

  const blocked = new Set<string>();
  let gentleMode = false;
  const reasons: string[] = [];
  let appointmentId: string | undefined;

  appointments.forEach((appointment) => {
    const categories = appointment.serviceIds
      .map((id) => services.find((service) => service.id === id)?.category)
      .filter((category): category is ServiceCategory => Boolean(category));
    if (categories.length === 0) return;

    const distance = getDaysDifference(dateIso, appointment.dateIso); // منفی = گذشته

    collectRules(categories).forEach((rule) => {
      // بازه پرهیز قبل از جلسه
      if (distance > 0 && distance <= rule.pauseActivesDaysBefore) {
        rule.avoidIngredientIds.forEach((id) => blocked.add(id));
        reasons.push(`${distance} روز تا ${rule.labelFa}: ترکیبات فعال باید قطع باشند.`);
        appointmentId = appointment.id;
      }
      // بازه مراقبت بعد از جلسه
      if (distance <= 0 && Math.abs(distance) <= rule.gentleRoutineDaysAfter) {
        rule.avoidIngredientIds.forEach((id) => blocked.add(id));
        gentleMode = true;
        const dayLabel = distance === 0 ? 'امروز' : `${Math.abs(distance)} روز پس از`;
        reasons.push(`${dayLabel} ${rule.labelFa}: روتین ملایم و ترمیمی.`);
        appointmentId = appointment.id;
      }
    });
  });

  return {
    blockedIngredientIds: Array.from(blocked),
    gentleMode,
    reasonFa: reasons.join(' '),
    appointmentId,
  };
}

/* ----------------------------- نوبت‌دهی ----------------------------- */

export function createAppointment(input: {
  provider: Provider;
  serviceIds: string[];
  titleFa?: string;
  dateIso: string;
  timeHhmm?: string;
  profile: SkinProfile;
  remindersDaysBefore?: number[];
  notesFa?: string;
}): Appointment {
  const services = LocalDB.getProviderServices();
  const categories = input.serviceIds
    .map((id) => services.find((service) => service.id === id)?.category)
    .filter((category): category is ServiceCategory => Boolean(category));

  const checklists = buildChecklists(categories, input.profile);
  const isPartner = Boolean(input.provider.partnerId);
  const referralId = isPartner ? createReferralId() : undefined;

  const appointment: Appointment = {
    id: createId('appt'),
    providerId: input.provider.id,
    providerKind: input.provider.kind,
    serviceIds: input.serviceIds,
    titleFa: input.titleFa,
    dateIso: input.dateIso,
    timeHhmm: input.timeHhmm,
    status: input.provider.bookingMode === 'request' ? 'requested' : 'planned',
    notesFa: input.notesFa,
    remindersDaysBefore: input.remindersDaysBefore || [3, 1, 0],
    prepChecklistFa: checklists.prepFa,
    aftercareChecklistFa: checklists.aftercareFa,
    referralId,
    updatedAt: new Date().toISOString(),
  };

  LocalDB.saveAppointment(appointment);

  if (isPartner) {
    trackReferralEvent('booking_created', { partnerId: input.provider.partnerId, referralId });
  }
  return appointment;
}

export function updateAppointmentStatus(appointment: Appointment, status: AppointmentStatus): void {
  LocalDB.saveAppointment({ ...appointment, status });

  const provider = LocalDB.getProviders().find((item) => item.id === appointment.providerId);
  if (!provider?.partnerId) return;
  if (status === 'done') {
    trackReferralEvent('booking_completed', { partnerId: provider.partnerId, referralId: appointment.referralId });
  }
  if (status === 'canceled') {
    trackReferralEvent('booking_canceled', { partnerId: provider.partnerId, referralId: appointment.referralId });
  }
}

/** نوبت‌های آینده، مرتب شده از نزدیک‌ترین. */
export function getUpcomingAppointments(limit = 5): Appointment[] {
  const today = getTodayIsoDate();
  return LocalDB.getAppointments()
    .filter(
      (appointment) =>
        getDaysDifference(today, appointment.dateIso) >= 0 &&
        appointment.status !== 'canceled' &&
        appointment.status !== 'done',
    )
    .slice(0, limit);
}

/**
 * جلساتی که بر اساس بازه تکرار، موعدشان رسیده ولی نوبتی ثبت نشده.
 * منبع یادآوری خودکار مانند «۲۸ روز از رنگ ریشه گذشته».
 */
export function getDueServices(): { service: ProviderService; provider?: Provider; daysSince: number }[] {
  const today = getTodayIsoDate();
  const appointments = LocalDB.getAppointments().filter((appointment) => appointment.status === 'done');
  const providers = LocalDB.getProviders();
  const results: { service: ProviderService; provider?: Provider; daysSince: number }[] = [];

  LocalDB.getProviderServices().forEach((service) => {
    const interval = service.repeatIntervalDays || findProcedureRule(service.category)?.typicalIntervalDays;
    if (!interval) return;

    const past = appointments
      .filter((appointment) => appointment.serviceIds.includes(service.id))
      .sort((a, b) => (a.dateIso < b.dateIso ? 1 : -1));
    if (past.length === 0) return;

    const daysSince = getDaysDifference(past[0].dateIso, today);
    if (daysSince < interval) return;

    const alreadyPlanned = LocalDB.getAppointments().some(
      (appointment) =>
        appointment.serviceIds.includes(service.id) &&
        appointment.status !== 'done' &&
        appointment.status !== 'canceled' &&
        getDaysDifference(today, appointment.dateIso) >= 0,
    );
    if (alreadyPlanned) return;

    results.push({
      service,
      provider: providers.find((provider) => provider.id === service.providerId),
      daysSince,
    });
  });

  return results.sort((a, b) => b.daysSince - a.daysSince);
}

export { PROCEDURE_RULES };
