/**
 * لایه ایمنی.
 *
 * در نسخه ۱، دیتابیس ترکیبات فیلد «ایمنی در بارداری» داشت و کامل هم
 * پر شده بود، ولی هیچ‌جا از کاربر پرسیده نمی‌شد و هیچ هشداری داده
 * نمی‌شد. این جدی‌ترین شکاف اپ بود. اینجا بسته می‌شود.
 */

import { Ingredient, Medication, SkinProfile } from '../types';
import { INGREDIENTS_DATABASE, findIngredientById } from './content/ingredients';

export type SafetyLevel = 'blocked' | 'caution' | 'safe';

export interface SafetyVerdict {
  level: SafetyLevel;
  reasonsFa: string[];
}

/** وضعیت ایمنی یک ترکیب برای این کاربر خاص. */
export function evaluateIngredientSafety(
  ingredient: Ingredient,
  profile: SkinProfile,
  activeMedications: Medication[] = [],
): SafetyVerdict {
  const reasons: string[] = [];
  let level: SafetyLevel = 'safe';

  const escalate = (next: SafetyLevel) => {
    if (next === 'blocked') level = 'blocked';
    else if (next === 'caution' && level !== 'blocked') level = 'caution';
  };

  if (profile.isPregnant) {
    if (ingredient.pregnancySafety === 'avoid') {
      reasons.push('در دوران بارداری توصیه نمی‌شود.');
      escalate('blocked');
    } else if (ingredient.pregnancySafety === 'consult_doctor') {
      reasons.push('در بارداری قبل از مصرف با پزشک مشورت کنید.');
      escalate('caution');
    }
  }

  if (profile.isBreastfeeding) {
    if (ingredient.breastfeedingSafety === 'avoid') {
      reasons.push('در دوران شیردهی توصیه نمی‌شود.');
      escalate('blocked');
    } else if (ingredient.breastfeedingSafety === 'consult_doctor') {
      reasons.push('در شیردهی با پزشک مشورت کنید.');
      escalate('caution');
    }
  }

  // رتینوئید خوراکی: پوست خیلی حساس می‌شود و لایه‌برداری ممنوع است
  if (profile.onOralRetinoid) {
    if (ingredient.id === 'ing_retinol') {
      reasons.push('همزمان با رتینوئید خوراکی، رتینول موضعی لازم نیست و پوست را می‌سوزاند.');
      escalate('blocked');
    }
    if (ingredient.category === 'exfoliant') {
      reasons.push('در دوره مصرف رتینوئید خوراکی، لایه‌برداری شیمیایی توصیه نمی‌شود.');
      escalate('blocked');
    }
  }

  if (ingredient.avoidSkinTypes.includes(profile.skinType)) {
    reasons.push('برای نوع پوست شما مناسب نیست.');
    escalate('caution');
  }

  if (profile.sensitivityScore >= 8 && ingredient.irritationRisk === 'high') {
    reasons.push('پوست شما حساس است و این ترکیب ریسک تحریک بالایی دارد.');
    escalate('caution');
  }

  const allergyHit = profile.allergies.some((item) => {
    const needle = item.trim();
    if (!needle) return false;
    return ingredient.nameFa.includes(needle) || ingredient.name.toLowerCase().includes(needle.toLowerCase());
  });
  if (allergyHit) {
    reasons.push('شما این مورد را جزو حساسیت‌های خود ثبت کرده‌اید.');
    escalate('blocked');
  }

  activeMedications
    .filter((medication) => medication.isActive)
    .forEach((medication) => {
      if ((medication.conflictingIngredientIds || []).includes(ingredient.id)) {
        reasons.push(`با داروی در حال مصرف شما (${medication.nameFa}) تداخل دارد.`);
        escalate('blocked');
      }
    });

  return { level, reasonsFa: reasons };
}

/** تداخل دو ترکیب با هم. دوطرفه بررسی می‌شود. */
export function checkPairConflict(
  first: Ingredient,
  second: Ingredient,
): { conflict: boolean; reasonFa: string } {
  if (first.id === second.id) {
    return { conflict: false, reasonFa: 'یک ترکیب یکسان انتخاب شده است. فقط دوز مصرف را کنترل کنید.' };
  }
  const conflict =
    first.avoidCombiningIds.includes(second.id) || second.avoidCombiningIds.includes(first.id);
  if (!conflict) {
    return {
      conflict: false,
      reasonFa: `${first.nameFa} و ${second.nameFa} در دیتابیس ما تداخل شناخته‌شده‌ای ندارند.`,
    };
  }
  const reason = first.conflictReasonFa || second.conflictReasonFa || 'مصرف همزمان این دو توصیه نمی‌شود.';
  return { conflict: true, reasonFa: `${first.nameFa} با ${second.nameFa}: ${reason}` };
}

export interface ShelfConflict {
  firstIngredientId: string;
  secondIngredientId: string;
  reasonFa: string;
  productNamesFa: string[];
}

/**
 * تداخل واقعی درون قفسه خود کاربر.
 * فرصتی که در نسخه ۱ کاملاً از دست رفته بود: تداخل‌سنج فقط دو ماده
 * انتخابی را چک می‌کرد، در حالی که می‌توانست بگوید سرم و کرم خودت با هم تداخل دارند.
 */
export function findShelfConflicts(
  products: { name: string; ingredientIds: string[]; owned: boolean }[],
): ShelfConflict[] {
  const owned = products.filter((product) => product.owned);
  const conflicts: ShelfConflict[] = [];
  const seen = new Set<string>();

  owned.forEach((productA, indexA) => {
    owned.slice(indexA + 1).forEach((productB) => {
      productA.ingredientIds.forEach((idA) => {
        productB.ingredientIds.forEach((idB) => {
          const first = findIngredientById(idA);
          const second = findIngredientById(idB);
          if (!first || !second) return;
          const result = checkPairConflict(first, second);
          if (!result.conflict) return;
          const key = [idA, idB].sort().join('|') + productA.name + productB.name;
          if (seen.has(key)) return;
          seen.add(key);
          conflicts.push({
            firstIngredientId: idA,
            secondIngredientId: idB,
            reasonFa: result.reasonFa,
            productNamesFa: [productA.name, productB.name],
          });
        });
      });
    });
  });

  return conflicts;
}

/** ترکیباتی که برای این کاربر ممنوعند. موتور روتین از این استفاده می‌کند. */
export function getBlockedIngredientIds(profile: SkinProfile, medications: Medication[] = []): string[] {
  return INGREDIENTS_DATABASE.filter(
    (ingredient) => evaluateIngredientSafety(ingredient, profile, medications).level === 'blocked',
  ).map((ingredient) => ingredient.id);
}

/** جمله هشدار کلی بالای بخش‌های پزشکی. همه‌جا باید دیده شود. */
export const MEDICAL_DISCLAIMER_FA =
  'رزا جای پزشک را نمی‌گیرد و دارو تجویز نمی‌کند. این بخش فقط برای ثبت و یادآوری است. برای تشخیص و درمان به متخصص پوست مراجعه کنید.';
