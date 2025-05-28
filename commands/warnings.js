const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const warnDataPath = path.join(__dirname, '..', 'data', 'warns.json');

function getWarns() {
  if (!fs.existsSync(warnDataPath)) return {};
  return JSON.parse(fs.readFileSync(warnDataPath));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('İstifadəçinin xəbərdarlıq tarixçəsini göstərir.')
    .addUserOption(option =>
      option.setName('kullanıcı').setDescription('Xəbərdarlıqları göstəriləcək istifadəçi').setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const user = interaction.options.getUser('kullanıcı');
    const warns = getWarns();

    if (!warns[user.id] || warns[user.id].length === 0) {
      return interaction.reply({ 
        content: `${user.tag} istifadəçisinin heç bir xəbərdarlığı yoxdur.`, 
        ephemeral: true 
      });
    }

    const embed = new EmbedBuilder()
      .setColor('#ff9900')
      .setTitle(`${user.tag} - Xəbərdarlıq Tarixçəsi`)
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `Toplam: ${warns[user.id].length} xəbərdarlıq` })
      .setTimestamp();

    warns[user.id].forEach((warn, index) => {
      const date = new Date(warn.date);
      const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      
      embed.addFields({
        name: `#${index + 1} Xəbərdarlıq`,
        value: `**Səbəb:** ${warn.reason}\n**Tarix:** ${formattedDate}`
      });
    });

    await interaction.reply({ 
      embeds: [embed],
      ephemeral: true
    });
  },
};