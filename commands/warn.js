const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warnDataPath = path.join(__dirname, '..', 'data', 'warns.json');


function getWarns() {
  if (!fs.existsSync(warnDataPath)) return {};
  return JSON.parse(fs.readFileSync(warnDataPath));
}

function saveWarns(warns) {
  fs.writeFileSync(warnDataPath, JSON.stringify(warns, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('İstifadəçiyə xəbərdarlıq edir.')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('İstifadəçi xəbərdarlıq edilməlidir').setRequired(true)
    )
    .addStringOption(option =>
      option.setName('sebep').setDescription('Xəbərdarlıq səbəbi').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const member = interaction.options.getUser('kullanıcı');
    const reason = interaction.options.getString('sebep');
    const warns = getWarns();

    if (!warns[member.id]) warns[member.id] = [];
    warns[member.id].push({ reason, date: new Date().toISOString() });
    saveWarns(warns);

    const guildMember = await interaction.guild.members.fetch(member.id);
    const warnCount = warns[member.id].length;

    const roles = {
      1: '1362123100694515722',
      2: '1362123099138424933',
      3: '1362123097892720781',
    };

    for (let i = 1; i <= 3; i++) {
      if (guildMember.roles.cache.has(roles[i])) {
        await guildMember.roles.remove(roles[i]);
      }
    }

 
    if (warnCount <= 3) {
      await guildMember.roles.add(roles[warnCount]);
    }

    await interaction.reply({
      content: `${member.tag} xəbərdar edildi! Səbəb: ${reason} (Toplam: ${warnCount})`,
      ephemeral: true,
    });
  },
};
