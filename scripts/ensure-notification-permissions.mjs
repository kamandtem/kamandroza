#!/usr/bin/env node
/**
 * اطمینان از وجود مجوزهای لازم برای اعلان‌های محلی قابل‌اعتماد در
 * AndroidManifest.xml (POST_NOTIFICATIONS، SCHEDULE_EXACT_ALARM،
 * USE_EXACT_ALARM، VIBRATE) — دقیقاً همان مجموعه‌ای که برنامه‌ی مرجع
 * daroto (که نوتیفیکیشنش قابل‌اعتماد کار می‌کند) در مانیفست خودش دارد.
 *
 * چرا این اسکریپت لازم است:
 * از اندروید ۱۲ به بعد، حتی وقتی کاربر مجوز نمایش اعلان را داده،
 * @capacitor/local-notifications نمی‌تواند اعلان‌ها را «دقیق» (exact)
 * زمان‌بندی کند مگر SCHEDULE_EXACT_ALARM در AndroidManifest.xml اعلام شده
 * باشد. بدون آن، دقیقاً همان باگ گزارش‌شده رخ می‌دهد: کاربر ساعتی را
 * تنظیم می‌کند، آن لحظه می‌رسد، ولی اعلانی نمی‌آید (یا با تاخیر نامشخص
 * می‌آید).
 *
 * چرا خودکار: پوشه android/ معمولاً با `npx cap add android` ساخته
 * می‌شود و بعضی وقت‌ها (مثلاً پاک و دوباره ساخته شدن پروژه بومی) این
 * فایل از نو تولید می‌شود؛ خودکار بودن این اسکریپت یعنی هیچ‌وقت این
 * مجوز فراموش نمی‌شود. اسکریپت idempotent است: اگر خط از قبل باشد
 * کاری نمی‌کند، و اگر android/ اصلاً وجود نداشته باشد (هنوز
 * `cap add android` اجرا نشده) بی‌خطر و بی‌صدا خارج می‌شود.
 *
 * این اسکریپت در package.json به `cap:sync` وصل شده تا بعد از هر
 * `npx cap sync` خودش اجرا شود.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const manifestPath = join(process.cwd(), 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

const REQUIRED_PERMISSIONS = [
  // اندروید ۱۳+: بدون این، هیچ اعلانی اصلاً نمایش داده نمی‌شود؛ خودِ
  // پلاگین در زمان اجرا هم درخواستش می‌کند (requestPermissions)، ولی
  // اعلام صریح در مانیفست هم مثل برنامه‌ی مرجع daroto، یک لایه ایمنی است.
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
  // اندروید ۱۲+: بدون این، اعلان‌های زمان‌بندی‌شده «دقیق» نیستند و ممکن
  // است با تأخیر نامشخص برسند یا اصلاً نرسند — همان ریشه اصلی باگ رفع‌شده.
  '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />',
  '<uses-permission android:name="android.permission.USE_EXACT_ALARM" />',
  // برای الگوی لرزش کانال اعلان.
  '<uses-permission android:name="android.permission.VIBRATE" />',
];

function main() {
  if (!existsSync(manifestPath)) {
    console.log('[ensure-notification-permissions] android/ هنوز ساخته نشده (npx cap add android)؛ رد شد.');
    return;
  }

  let xml = readFileSync(manifestPath, 'utf8');
  let changed = false;

  for (const permissionTag of REQUIRED_PERMISSIONS) {
    if (xml.includes(permissionTag)) continue;
    if (!xml.includes('<manifest')) {
      console.warn('[ensure-notification-permissions] ساختار AndroidManifest.xml شناخته‌شده نیست؛ رد شد.');
      return;
    }
    // بلافاصله بعد از تگ باز <manifest ...> اضافه می‌شود، قبل از <application>.
    xml = xml.replace(/(<manifest[^>]*>)/, `$1\n    ${permissionTag}`);
    changed = true;
  }

  if (changed) {
    writeFileSync(manifestPath, xml, 'utf8');
    console.log('[ensure-notification-permissions] مجوز(های) هشدار دقیق به AndroidManifest.xml اضافه شد.');
  } else {
    console.log('[ensure-notification-permissions] مجوزها از قبل موجود بودند؛ تغییری لازم نبود.');
  }
}

main();
