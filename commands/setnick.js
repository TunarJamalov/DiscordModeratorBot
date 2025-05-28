const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addeyis')
        .setDescription('İstifadəçinin adını dəyişdirin')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Adı dəyişdirmək üçün istifadəçi')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('nickname')
                .setDescription('Yeni ad (sıfırlamaq üçün boş buraxın)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
    
    async execute(interaction) {
       
        const targetUser = interaction.options.getUser('user');
        const newNickname = interaction.options.getString('nickname') || null;
      
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
            return interaction.reply({
                content: 'Mənə adları dəyişdirmək üçün "Adları idarə et" icazəsi lazımdır!',
                ephemeral: true
            });
        }
        
        try {
            
            const targetMember = await interaction.guild.members.fetch(targetUser.id);
            
            
            if (targetMember.id === interaction.guild.ownerId) {
                return interaction.reply({
                    content: 'Mən server sahibinin adını dəyişə bilmirəm.',
                    ephemeral: true
                });
            }
            
            if (targetMember.roles.highest.position > interaction.guild.members.me.roles.highest.position) {
                return interaction.reply({
                    content: 'Məndən yüksək rolu olan üzvün adını dəyişə bilmərəm.',
                    ephemeral: true
                });
            }

            if (interaction.member.id !== interaction.guild.ownerId && 
                targetMember.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    content: 'Sizdən bərabər və ya daha yüksək rolu olan üzvün adını dəyişə bilməzsiniz.',
                    ephemeral: true
                });
            }
            
          
            await targetMember.setNickname(newNickname);
            
        
            let responseMessage;
            if (newNickname) {
                responseMessage = `${targetUser.username} istifadəçisinin adı "${newNickname}" olaraq dəyişdirildi.`;
            } else {
                responseMessage = `${targetUser.username} istifadəçisinin adı sıfırlandı.`;
            }
            
            await interaction.reply({
                content: responseMessage,
                ephemeral: false 
            });
            
        } catch (error) {
            console.error('Error setting nickname:', error);
            
            let errorMessage = 'An error occurred while trying to change the nickname.';
            
           
            if (error.code === 50013) {
                errorMessage = 'I don\'t have permission to change that user\'s nickname. They might have a higher role than me.';
            }
            
            await interaction.reply({
                content: errorMessage,
                ephemeral: true
            });
        }
    }
};