import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const SYSTEM_PROMPT = `تو یه مشاور متخصص استخدام برنامه‌نویس Senior هستی که به شرکت‌های ایرانی کمک میکنی.
هدفت اینه که در ۳ فاز اطلاعات کامل از کارفرما بگیری:

فاز ۱ - نیاز فنی:
- چه Stack فنی نیاز دارن؟ (مثلاً React، Node، Python، Go، ...)
- سطح تجربه مورد نیاز؟ (Senior 5+ سال یا Lead؟)
- چند نفر نیاز دارن؟
- Remote هست یا حضوری؟

فاز ۲ - ساختار تیم:
- الان تیم چند نفره هستن؟
- این Senior چه نقشی داره؟ (Lead، Architect، Member)
- آیا نیاز به مدیریت تیم دارن؟
- چه پروژه‌ای دارن؟ (Product، Outsource، Startup)

فاز ۳ - بودجه:
- رنج حقوق مد نظر؟
- فول‌تایم یا پاره‌وقت؟
- مزایا و بنفیت‌ها چیه؟

قوانین:
- هر بار فقط ۱-۲ سوال بپرس
- فارسی صحبت کن
- دوستانه و حرفه‌ای باش
- وقتی همه اطلاعات رو گرفتی، یه خلاصه JSON بفرست با این فرمت:
  PROFILE_JSON:{"stack":"...","level":"...","count":...,"teamStructure":"...","budget":"...","priorities":"...","projectDesc":"..."}
- قبل از JSON بنویس: "✅ اطلاعات کامل شد! پروفایل شما:"`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { userId, message } = req.body;
  if (!userId || !message) return res.status(400).json({ error: "Missing fields" });

  const sessionKey = `session:${userId}`;

  // Load history from Redis
  let history = [];
  try {
    const stored = await redis.get(sessionKey);
    if (stored) history = JSON.parse(stored);
  } catch {}

  // Add user message
  history.push({ role: "user", content: message });

  // Call Claude
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: history,
    }),
  });

  const data = await response.json();
  const reply = data.content?.[0]?.text || "خطا در پردازش";

  // Add assistant reply to history
  history.push({ role: "assistant", content: reply });

  // Save updated history to Redis (TTL: 2 hours)
  await redis.set(sessionKey, JSON.stringify(history), { ex: 7200 });

  // Check if profile is complete
  let profileJson = null;
  const match = reply.match(/PROFILE_JSON:(\{.*\})/);
  if (match) {
    try { profileJson = JSON.parse(match[1]); } catch {}
  }

  res.status(200).json({
    reply: reply.replace(/PROFILE_JSON:\{.*\}/, "").trim(),
    profile: profileJson,
  });
}
