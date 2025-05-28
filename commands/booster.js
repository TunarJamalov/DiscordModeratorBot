const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('booster')
    .setDescription('Booster üzvlər üçün ad dəyişdirmə əmri')
    .addStringOption(option =>
      option.setName('isim')
        .setDescription('İstədiyiniz yeni ad')
        .setRequired(true)
    ),

  async execute(interaction) {
    const member = interaction.member;
    
    // Check if the user is a server booster
    if (!member.premiumSince) {
      return interaction.reply({ 
        content: 'Bu əmri yalnız server booster üzvləri istifadə edə bilər!', 
        ephemeral: true 
      });
    }
    
    const newName = interaction.options.getString('isim');
    
    // Check if the name is too long (Discord limit is 32 characters)
    if (newName.length > 32) {
      return interaction.reply({
        content: 'Ad çox uzundur! Maksimum 32 simvol olmalıdır.',
        ephemeral: true
      });
    }
    
    try {
      // Change the member's nickname
      await member.setNickname(newName);
      
      return interaction.reply({
        content: `Adınız uğurla dəyişdirildi: **${newName}**`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error changing nickname:', error);
      
      return interaction.reply({
        content: 'Ad dəyişdirilərkən xəta baş verdi. Zəhmət olmasa daha sonra cəhd edin və ya adminlə əlaqə saxlayın.',
        ephemeral: true
      });
    }
  },
};