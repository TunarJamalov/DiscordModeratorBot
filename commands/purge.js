const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sil')
        .setDescription('Birdən çox mesajı silin')
        .addIntegerOption(option => 
            option.setName('amount')
                .setDescription('Silinəcək mesajların sayı (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Yalnız bu istifadəçinin mesajlarını silin')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('contains')
                .setDescription('Yalnız bu mətni ehtiva edən mesajları silin')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('pinned')
                .setDescription('Saxlanmış mesajları daxil edin (defolt: yanlış)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    async execute(interaction) {
    
        if (!interaction.channel.permissionsFor(interaction.client.user).has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: 'Mesajları silmək üçün mənə "Mesajları idarə et" icazəsi lazımdır!',
                ephemeral: true
            });
        }
        
       
        const amount = interaction.options.getInteger('amount');
        const user = interaction.options.getUser('user');
        const containsText = interaction.options.getString('contains');
        const includePinned = interaction.options.getBoolean('pinned') ?? false;
        
        
        await interaction.deferReply({ ephemeral: true });
        
        try {
           
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            
         
            let filteredMessages = messages;
            
            
            if (user) {
                filteredMessages = filteredMessages.filter(msg => msg.author.id === user.id);
            }
            
            
            if (containsText) {
                filteredMessages = filteredMessages.filter(msg => 
                    msg.content.toLowerCase().includes(containsText.toLowerCase())
                );
            }
            
            
            if (!includePinned) {
                filteredMessages = filteredMessages.filter(msg => !msg.pinned);
            }
            
          
            filteredMessages = filteredMessages.first(amount);
            
           
            if (filteredMessages.length === 0) {
                return interaction.followUp({
                    content: 'Göstərilən meyarlara uyğun mesaj tapılmadı.',
                    ephemeral: true
                });
            }
            
            
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const bulkDeleteMessages = filteredMessages.filter(msg => msg.createdTimestamp > twoWeeksAgo);
            const oldMessages = filteredMessages.filter(msg => msg.createdTimestamp <= twoWeeksAgo);
            
         
            let deletedCount = 0;
            
           
            if (bulkDeleteMessages.length > 0) {
                const bulkDeleted = await interaction.channel.bulkDelete(bulkDeleteMessages, true);
                deletedCount += bulkDeleted.size;
            }
            
            
            for (const message of oldMessages) {
                try {
                    await message.delete();
                    deletedCount++;
                } catch (error) {
                    console.error(`Mesajı silmək alınmadı ${message.id}:`, error);
                }
            }
            
         
            let responseMessage = `Uğurla ${deletedCount} mesaj silindi ${deletedCount !== 1 ? 's' : ''}.`;
            
            if (oldMessages.length > 0) {
                const failedCount = oldMessages.length - (deletedCount - bulkDeleteMessages.length);
                if (failedCount > 0) {
                    responseMessage += ` Failed to delete ${failedCount} message${failedCount !== 1 ? 's' : ''} (older than 14 days or other issues).`;
                }
            }
            
            await interaction.followUp({
                content: responseMessage,
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Error purging messages:', error);
            await interaction.followUp({
                content: 'An error occurred while trying to delete messages.',
                ephemeral: true
            });
        }
    }
};