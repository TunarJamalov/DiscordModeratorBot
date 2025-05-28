const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');


const allowedRoleId = '1362123032868556830';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kilit')
    .setDescription('Kanalı kilitler veya açar (sadece @everyone için).')
    .addStringOption(option =>
      option.setName('durum')
        .setDescription('Kanalı kilitle veya aç')
        .setRequired(true)
        .addChoices(
          { name: 'Bağla (Kilit)', value: 'kapali' },
          { name: 'Aç (Serbest)', value: 'acik' }
        )
    ),

  async execute(interaction) {
  
    if (!interaction.member.roles.cache.has(allowedRoleId)) {
      return interaction.reply({
        content: '❌ Yetkin yoxdur.',
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const durum = interaction.options.getString('durum');
    const channel = interaction.channel;
    const everyoneRole = interaction.guild.roles.everyone;

    if (durum === 'kapali') {
      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: false,
      });
      return interaction.editReply({ content: `🔒 ${channel.name} kanalı bağlandı.` });
    }

    if (durum === 'acik') {
      await channel.permissionOverwrites.edit(everyoneRole, {
        SendMessages: null,
      });
      return interaction.editReply({ content: `🔓 ${channel.name} kanalı açıldı` });
    }
  }
};
