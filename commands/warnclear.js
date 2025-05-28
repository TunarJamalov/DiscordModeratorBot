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
    .setName('warnclear')
    .setDescription('İstifadəçinin xəbərdarlıqlarını təmizləyir.')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Xəbərdarlıqları silinəcək istifadəçi').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanıcı');
    const warns = getWarns();

    if (!warns[user.id]) {
      return interaction.reply({ content: 'Bu istifadəçinin xəbərdarlığı yoxdur.', ephemeral: true });
    }

    delete warns[user.id];
    saveWarns(warns);

    const roles = ['1362123100694515722', '1362123099138424933', '1362123097892720781'];
    const guildMember = await interaction.guild.members.fetch(user.id);

    for (const roleId of roles) {
      if (guildMember.roles.cache.has(roleId)) {
        await guildMember.roles.remove(roleId);
      }
    }

    await interaction.reply({ content: `${user.tag} istifadəçisi üçün bütün xəbərdarlıqlar silindi.`, ephemeral: true });
  },
};
