// ... نفس الاستيرادات القديمة
const commands = [
  new SlashCommandBuilder()
    .setName('leave')
    .setDescription('إدارة الإجازات')
    .addSubcommand(sc =>
      sc.setName('new')
        .setDescription('طلب إجازة جديدة لعسكري')
        .addUserOption(o => o.setName('user').setDescription('العسكري').setRequired(true))
    )
    .addSubcommand(sc =>
      sc.setName('audit')
        .setDescription('جرد شهري')
        .addIntegerOption(o => o.setName('year').setDescription('السنة'))
        .addIntegerOption(o => o.setName('month').setDescription('الشهر 1-12'))
    )
    .addSubcommand(sc =>
      sc.setName('revoke')
        .setDescription('سحب/إلغاء إجازة')
        .addStringOption(o => o.setName('leave_id').setDescription('رقم الإجازة').setRequired(true))
        .addStringOption(o => o.setName('reason').setDescription('سبب السحب').setRequired(true))
    )
    .addSubcommand(sc =>
      sc.setName('edit')
        .setDescription('تعديل إجازة (يمدّد/ينقص/تغيير بيانات)')
        .addStringOption(o => o.setName('leave_id').setDescription('رقم الإجازة').setRequired(true))
        .addStringOption(o => o.setName('name_rank').setDescription('الاسم والرتبة (اختياري)'))
        .addStringOption(o => o.setName('sector').setDescription('القطاع (اختياري)'))
        .addStringOption(o => o.setName('start').setDescription('تاريخ البداية الجديد (اختياري)'))
        .addStringOption(o => o.setName('end').setDescription('تاريخ النهاية الجديد (اختياري)'))
        .addStringOption(o => o.setName('reason').setDescription('السبب (اختياري)'))
    )
    .toJSON()
];

// أنشرها كالعادة...
