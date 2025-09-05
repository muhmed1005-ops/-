let local = {};
try { local = require('./config.json'); } catch (_) {}

const CONFIG = {
  token: process.env.DISCORD_TOKEN || local.token,
  clientId: process.env.DISCORD_CLIENT_ID || local.clientId,
  guildId: process.env.DISCORD_GUILD_ID || local.guildId,
  ministryChannelId: process.env.MINISTRY_CHANNEL_ID || local.ministryChannelId,
  monthlyHourQuota: Number(process.env.MONTHLY_HOUR_QUOTA || local.monthlyHourQuota || 160),
  allowedRoleIds: (process.env.ALLOWED_ROLE_IDS || '').split(',').filter(Boolean) || local.allowedRoleIds || []
};

if (!CONFIG.token) {
  console.error('❌ لا يوجد توكن. ضعه في DISCORD_TOKEN أو في config.json (محلي فقط).');
  process.exit(1);
}

const {
  Client,
  GatewayIntentBits,
  Partials,
  Routes,
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  Events,
} = require("discord.js");
const { REST } = require("@discordjs/rest");
const fs = require("fs");
const path = require("path");
const dayjs = require("dayjs");
require("dayjs/locale/ar");

require("dotenv").config();
client.login(process.env.TOKEN);



// مسار لحفظ البيانات
const leavesFile = path.join(__dirname, "data", "leaves.json");
if (!fs.existsSync(path.dirname(leavesFile))) {
  fs.mkdirSync(path.dirname(leavesFile), { recursive: true });
}
if (!fs.existsSync(leavesFile)) {
  fs.writeFileSync(leavesFile, JSON.stringify([]));
}

// تحميل / حفظ بيانات
function loadLeaves() {
  return JSON.parse(fs.readFileSync(leavesFile));
}
function saveLeaves(data) {
  fs.writeFileSync(leavesFile, JSON.stringify(data, null, 2));
}

// إنشاء العميل
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

// تسجيل الأوامر
const commands = [
  new SlashCommandBuilder()
    .setName("leave")
    .setDescription("نظام الإجازات")
    .addSubcommand(sc =>
      sc.setName("new")
        .setDescription("طلب إجازة جديدة لعسكري")
        .addUserOption(o =>
          o.setName("user")
            .setDescription("صاحب الإجازة (العسكري)")
            .setRequired(true)
        )
    )
    .addSubcommand(sc =>
      sc.setName("audit")
        .setDescription("جرد إجازات الشهر")
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(CONFIG.token);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId), { body: commands });
    console.log("✅ تم تسجيل الأوامر");
  } catch (err) {
    console.error(err);
  }
})();

// عند تشغيل البوت
client.once(Events.ClientReady, () => {
  console.log(`🚀 Logged in as ${client.user.tag}`);
});

// معالجة الأوامر
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "leave" && interaction.options.getSubcommand() === "new") {
        const targetUser = interaction.options.getUser("user");

        // فتح نموذج
        const modal = new ModalBuilder()
          .setCustomId(`leaveNew_${targetUser.id}`)
          .setTitle("طلب إجازة جديدة");

        const nameInput = new TextInputBuilder()
          .setCustomId("name")
          .setLabel("الاسم والرتبة")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const sectorInput = new TextInputBuilder()
          .setCustomId("sector")
          .setLabel("القطاع")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const startInput = new TextInputBuilder()
          .setCustomId("start")
          .setLabel("تاريخ البداية (YYYY-MM-DD)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const endInput = new TextInputBuilder()
          .setCustomId("end")
          .setLabel("تاريخ النهاية (YYYY-MM-DD)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const reasonInput = new TextInputBuilder()
          .setCustomId("reason")
          .setLabel("السبب")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true);

        modal.addComponents(
          new ActionRowBuilder().addComponents(nameInput),
          new ActionRowBuilder().addComponents(sectorInput),
          new ActionRowBuilder().addComponents(startInput),
          new ActionRowBuilder().addComponents(endInput),
          new ActionRowBuilder().addComponents(reasonInput)
        );

        await interaction.showModal(modal);
      }
    }

    // عند إرسال النموذج
    if (interaction.isModalSubmit() && interaction.customId.startsWith("leaveNew_")) {
      const targetId = interaction.customId.split("_")[1];
      const targetUser = await client.users.fetch(targetId);

      const name = interaction.fields.getTextInputValue("name");
      const sector = interaction.fields.getTextInputValue("sector");
      const start = interaction.fields.getTextInputValue("start");
      const end = interaction.fields.getTextInputValue("end");
      const reason = interaction.fields.getTextInputValue("reason");

      const startDate = dayjs(start, "YYYY-MM-DD");
      const endDate = dayjs(end, "YYYY-MM-DD");
      if (!startDate.isValid() || !endDate.isValid() || endDate.isBefore(startDate)) {
        return interaction.reply({ content: "⚠️ التواريخ غير صحيحة.", ephemeral: true });
      }

      const durationHours = endDate.diff(startDate, "hour");
      const durationDays = endDate.diff(startDate, "day");

      const baseEmbed = new EmbedBuilder()
  .setColor(0x2ecc71) // أخضر
  .setTitle('تم قبول الإجازة ✅')
  .addFields(
    { name: 'صاحب الإجازة', value: `<@${targetUser.id}>` },
    { name: 'الرتبة', value: rankOnly },
    { name: 'القطاع', value: sector },
    { name: 'من', value: start.format('YYYY-MM-DD') },
    { name: 'إلى', value: end.format('YYYY-MM-DD') },
    { name: 'المدة', value: `${days} يوم (${hours} ساعة)` },
    { name: 'المتبقي', value: `${rem.d} يوم ${rem.h} ساعة ${rem.m} دقيقة` },
    { name: 'السبب', value: reason },
    { name: 'المسؤول', value: `<@${interaction.user.id}>` }
  )
  .setFooter({ text: `📅 التاريخ والوقت: ${dayjs().format('YYYY-MM-DD HH:mm')}` });

      // إرسال للغرفة
      const channel = await client.channels.fetch(CONFIG.ministryChannelId);
      await channel.send({ embeds: [embed] });

      // إرسال للشخص
      try {
        await targetUser.send({ embeds: [embed] });
      } catch {}

      // رد للمسؤول
      await interaction.reply({ content: `✅ تم تسجيل الإجازة وإشعار ${targetUser}`, ephemeral: true });

      // حفظ محلي
      const leaves = loadLeaves();
      leaves.push({
        userId: targetUser.id,
        approvedBy: interaction.user.id,
        name,
        sector,
        start,
        end,
        reason,
        createdAt: new Date().toISOString(),
      });
      saveLeaves(leaves);
    }
  } catch (err) {
    console.error("❌ خطأ:", err);
  }
});

client.login(config.token);
