export type SkinType = 'dry' | 'oily' | 'combination' | 'normal' | 'sensitive' | 'dehydrated';

export type SkinTone = 'fair' | 'light' | 'medium' | 'tan' | 'dark';

export type SkinConcern = 
  | 'acne' 
  | 'hyperpigmentation' 
  | 'wrinkles' 
  | 'fine_lines' 
  | 'dryness' 
  | 'oiliness' 
  | 'redness' 
  | 'rosacea' 
  | 'eczema' 
  | 'pores' 
  | 'texture' 
  | 'dark_circles';

export interface SkinProfile {
  name?: string;
  avatarUrl?: string;
  age: number;
  gender: 'female' | 'male' | 'other';
  city: string;
  occupation: string;
  skinType: SkinType;
  skinTone: SkinTone;
  sensitivityScore: number; // 1-10
  primaryConcerns: SkinConcern[];
  hairType: 'straight' | 'wavy' | 'curly' | 'coily';
  hairConcerns: string[];
  isPregnant: boolean;
  isBreastfeeding: boolean;
  medications: string[];
  allergies: string[];
}

export interface LifestyleProfile {
  waterTargetGlasses: number; // e.g., 8
  sleepTargetHours: number; // e.g., 8
  stressLevel: 'low' | 'medium' | 'high'; // low, medium, high
  exerciseDaysPerWeek: number;
  sunExposureHours: number;
  junkFoodFrequency: 'rarely' | 'sometimes' | 'frequently';
  sugarIntake: 'low' | 'moderate' | 'high';
  isSmoking: boolean;
}

export type MenstrualPhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export interface MenstrualCycleConfig {
  enabled: boolean;
  lastPeriodDate: string; // ISO date 'YYYY-MM-DD'
  cycleLength: number; // Average cycle length in days (e.g., 28)
  periodLength: number; // Days of period bleeding (e.g., 5)
  regularity: 'regular' | 'irregular' | 'somewhat_irregular';
  pmsStartDaysBefore: number; // Usually 7 days before period
}

export interface CycleSymptom {
  date: string; // ISO date YYYY-MM-DD
  acne: number; // 0-5
  oiliness: number; // 0-5
  dryness: number; // 0-5
  redness: number; // 0-5
  sensitivity: number; // 0-5
  mood: 'great' | 'calm' | 'anxious' | 'irritated' | 'fatigued';
  stress: number; // 1-5
  pain: number; // 0-5
  bloating: boolean;
  notes?: string;
}

export type ProductCategory = 
  | 'cleanser' 
  | 'moisturizer' 
  | 'serum' 
  | 'sunscreen' 
  | 'treatment' 
  | 'mask' 
  | 'eyecare' 
  | 'toner' 
  | 'exfoliant' 
  | 'haircare';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  ingredients: string[]; // List of ingredient names or IDs
  owned: boolean;
  notes?: string;
  usageInstructionsFa?: string;
  warningsFa?: string;
  rating?: number; // 1-5
  openedDate?: string;
  expirationMonths?: number;
}

export interface Ingredient {
  id: string;
  name: string; // English scientific name e.g. "Niacinamide"
  nameFa: string; // Persian name e.g. "نیاسینامید"
  category: 'active' | 'hydrator' | 'soother' | 'exfoliant' | 'antioxidant' | 'barrier_repair' | 'oil';
  benefitsFa: string[];
  risksFa?: string[];
  suitableSkinTypes: SkinType[];
  avoidSkinTypes: SkinType[];
  usageTime: 'morning' | 'night' | 'both';
  pregnancySafety: 'safe' | 'avoid' | 'consult_doctor';
  breastfeedingSafety: 'safe' | 'avoid' | 'consult_doctor';
  compatibleIngredients: string[]; // Names of ingredients that pair well
  avoidCombining: string[]; // Names of ingredients to avoid mixing
  sideEffectsFa?: string;
  irritationRisk: 'low' | 'moderate' | 'high';
  descriptionFa: string;
}

export interface Article {
  id: string;
  titleFa: string;
  categoryId: string; // category key
  categoryFa: string;
  summaryFa: string;
  fullContentFa: string;
  tagsFa: string[];
  readTimeMin: number;
  difficultyFa: 'مقدماتی' | 'متوسط' | 'تخصصی';
  imageUrl?: string;
  relatedIngredients?: string[];
  relatedSkinProblems?: string[];
}

export interface SkinConditionInfo {
  id: string;
  nameFa: string;
  summaryFa: string;
  descriptionFa: string;
  symptomsFa: string[];
  possibleCausesFa: string[];
  lifestyleFactorsFa: string[];
  recommendedHabitsFa: string[];
  suitableIngredients: string[];
  avoidIngredients: string[];
  imageUrl?: string;
}

export interface RoutineStep {
  id: string;
  titleFa: string;
  category: ProductCategory;
  productId?: string;
  productNameFa?: string;
  completed: boolean;
  timeSeconds?: number;
  descriptionFa: string;
  isCustom?: boolean;
}

export type RoutineType = 'morning' | 'night';

export interface Routine {
  id: string;
  date: string; // YYYY-MM-DD
  type: RoutineType;
  steps: RoutineStep[];
  completed: boolean;
  completedAt?: string;
}

export interface DailyTrackerEntry {
  id: string;
  date: string; // YYYY-MM-DD
  waterGlasses: number;
  sleepHours: number;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  exerciseMinutes: number;
  junkFood: boolean;
  sugarIntake: 'low' | 'moderate' | 'high';
  skinStatusScore: number; // 1-10 (1 = poor, 10 = radiant)
  mood: string;
  rednessScore: number; // 0-5
  drynessScore: number; // 0-5
  acneScore: number; // 0-5
  oilinessScore: number; // 0-5
  notes?: string;
}

export interface PhotoProgress {
  id: string;
  date: string; // YYYY-MM-DD
  imagePath: string; // Data URL or local blob path
  notes?: string;
  skinConditionScore: number;
  tagsFa: string[];
}

export interface Achievement {
  id: string;
  titleFa: string;
  descriptionFa: string;
  iconName: string;
  xp: number;
  target: number;
  current: number;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface Challenge {
  id: string;
  titleFa: string;
  descriptionFa: string;
  categoryFa: string;
  targetDays: number;
  currentDays: number;
  completed: boolean;
  rewardXp: number;
}

export interface WeatherData {
  city: string;
  temp: number;
  conditionFa: string;
  humidity: number;
  uvIndex: number;
  recommendationFa: string;
  city?: string;
  weatherCode?: number;
  updatedAt?: string;
  isStale?: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  morningRoutine: boolean;
  morningHour: number;
  morningMinute: number;
  nightRoutine: boolean;
  nightHour: number;
  nightMinute: number;
  cycleInsight: boolean;
}

export interface UserState {
  profile: SkinProfile;
  lifestyle: LifestyleProfile;
  cycleConfig: MenstrualCycleConfig;
  userXp: number;
  userLevel: number;
  currentStreakDays: number;
  bestStreakDays: number;
  onboardingCompleted: boolean;
  themeMode: 'light' | 'dark' | 'system';
  notifications: NotificationSettings;
}
