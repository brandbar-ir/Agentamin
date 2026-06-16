import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.8638788737:AAH4rQiXXuLIBsdYOGFrg_vdLQihTCtxRpE);
const APP_URL = process.env.https://agentamin.vercel.app/; // e.g. https://yourapp.vercel.app

bot.start(async (ctx) => {
  const userId = ctx.from.id;
  const name = ctx.from.first_name || "کارفرما";

  await ctx.reply(
    `سلام ${name} 👋\n\nاینجا میتونی نیازهای استخدامی تیم برنامه‌نویسیت رو با کمک AI تعریف کنی.\n\nیه مصاحبه هوشمند داریم که بهت کمک میکنه:\n✅ نیاز فنی تیم رو مشخص کنی\n✅ ساختار تیم رو طراحی کنی\n✅ بودجه رو تخمین بزنی\n\nبعدش یه Job Profile کامل میگیری! 🎯`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 شروع مصاحبه",
              web_app: { url: `${APP_URL}?uid=${userId}` },
            },
          ],
        ],
      },
    }
  );
});

bot.on("web_app_data", async (ctx) => {
  const data = JSON.parse(ctx.webAppData.data);

  if (data.type === "profile_complete") {
    const profile = data.profile;
    const msg = formatProfile(profile);
    await ctx.reply(`✅ پروفایل استخدامی آماده شد!\n\n${msg}`, {
      parse_mode: "Markdown",
    });
  }
});

function formatProfile(p) {
  return `
*📌 پروفایل نیاز فنی*
---
*Stack:* ${p.stack}
*سطح:* ${p.level}
*تعداد:* ${p.count} نفر
*ساختار تیم:* ${p.teamStructure}
*بودجه ماهانه:* ${p.budget}
*اولویت‌ها:* ${p.priorities}
*توضیحات پروژه:* ${p.projectDesc}
  `.trim();
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    await bot.handleUpdate(req.body);
    res.status(200).json({ ok: true });
  } else {
    res.status(200).send("Bot is running ✅");
  }
}
