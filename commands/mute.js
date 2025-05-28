const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mute')
        .setDescription('İstifadəçini müvəqqəti olaraq susdurur (taym-out)')
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Səssiz etmək üçün istifadəçi')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('sure')
                .setDescription('Səssiz qalma müddəti (Məsələn: 1dəq, 2saat, 3d)')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('sebep')
                .setDescription('Susmaq üçün səbəb')
                .setRequired(false)),
    
    async execute(interaction) {
      
        const mutePermission = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);
        
   
        const ozelRolID = '1362123105933463794'; 
        const hasSpecialRole = interaction.member.roles.cache.has(ozelRolID);
        
       
        if (!mutePermission && !hasSpecialRole) {
            return interaction.reply({
                content: '⛔ **Bu əmrdən istifadə etmək icazəniz yoxdur!**',
                ephemeral: true
            });
        }
        
        const targetUser = interaction.options.getUser('kullanici');
        const durationInput = interaction.options.getString('sure');
        const reason = interaction.options.getString('sebep') || 'Səbəb göstərilməyib';
        
        
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
       
        if (!targetMember) {
            return interaction.reply({
                content: '❌ **Bu istifadəçini tapmaq və ya susdurmaq mümkün deyil.**',
                ephemeral: true
            });
        }
        
       
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && interaction.member.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: '⚠️ **Bu istifadəçinin səsini susdura bilməzsiniz, çünki onlar sizdən daha yüksək və ya bərabər rola malikdirlər.**',
                ephemeral: true
            });
        }
        
     
        if (targetMember.isCommunicationDisabled()) {
            return interaction.reply({
                content: '⚠️ **Bu istifadəçi artıq susdurulub.**',
                ephemeral: true
            });
        }
        
       
        const duration = parseDuration(durationInput);
        
        if (!duration) {
            return interaction.reply({
                content: '❌ **Yanlış müddət formatı. Misal: 5m (5 dəqiqə), 2h (2 saat), 1d (1 gün).**',
                ephemeral: true
            });
        }
        
      
        if (duration < 60000) { 
            return interaction.reply({
                content: '❌ **Minimum səssizləşdirmə müddəti 1 dəqiqədir.**',
                ephemeral: true
            });
        }
        
        if (duration > 2419200000) { 
            return interaction.reply({
                content: '❌ **Maksimum susdurma müddəti 28 gündür.**',
                ephemeral: true
            });
        }
        
       
        const readableDuration = getReadableDuration(duration);
        
        
        const confirmEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('⚠️ MUTE TƏSDİQ')
            .setDescription(`**${targetUser.tag}** susdurmaq istədiyinizə əminsiniz?`)
            .addFields(
                { name: 'İstifadəçi', value: `<@${targetUser.id}>`, inline: true },
                { name: 'ID', value: targetUser.id, inline: true },
                { name: 'Vaxt', value: readableDuration, inline: true },
                { name: 'Səbəb', value: reason, inline: false }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
            
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_mute')
                    .setLabel('Susdur')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_mute')
                    .setLabel('Ləğv et')
                    .setStyle(ButtonStyle.Secondary),
            );

        const response = await interaction.reply({
            embeds: [confirmEmbed],
            components: [row],
            fetchReply: true
        });

        
        const filter = i => i.customId === 'confirm_mute' || i.customId === 'cancel_mute';
        const collector = response.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'Bu düymələrdən yalnız əmrdən istifadə edən şəxs istifadə edə bilər!', ephemeral: true });
            }

            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_mute')
                        .setLabel('Susdur')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('cancel_mute')
                        .setLabel('Ləğv et')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                );

            if (i.customId === 'confirm_mute') {
               
                try {
                    await targetMember.timeout(duration, `${interaction.user.tag} tərəfindən səssizləşdirildi. Səbəb: ${reason}`);
                    
                    
                    const muteGifs = [
                        'https://media.giphy.com/media/H7qmfG8LE8j8BLTBFf/giphy.gif',
                        'https://media.giphy.com/media/kaq6GnxDlJaBq/giphy.gif',
                        'https://media.giphy.com/media/11fnCV9rd0m58c/giphy.gif',
                        'https://media.giphy.com/media/Ov5NiLVXT8JEc/giphy.gif',
                        'https://media.giphy.com/media/ljtfkyTD3PIUZaKWRi/giphy.gif'
                    ];
                    
                    
                    const randomGif = muteGifs[Math.floor(Math.random() * muteGifs.length)];
                    
                  
                    const endTime = Math.floor((Date.now() + duration) / 1000);
                    
                    const successEmbed = new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle('🔇 SUSDURULMA PROSESİ UĞURLU OLDU')
                        .setDescription(`İstifadəçi **${targetUser.tag}** uğurla susduruldu!`)
                        .addFields(
                            { name: 'İstifadəçi', value: `<@${targetUser.id}>`, inline: true },
                            { name: 'ID', value: targetUser.id, inline: true },
                            { name: 'Susduran', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Vaxt', value: readableDuration, inline: true },
                            { name: 'Səbəb', value: reason, inline: false },
                            { name: 'Başlangıc', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                            { name: 'Bitiş', value: `<t:${endTime}:F> (<t:${endTime}:R>)`, inline: false }
                        )
                        .setImage(randomGif)
                        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: `${interaction.guild.name} • Moderasiya Sistemi`, iconURL: interaction.guild.iconURL({ dynamic: true }) });
                    
                    await i.update({ embeds: [successEmbed], components: [disabledRow] });
                    
                   
                    try {
                        const dmEmbed = new EmbedBuilder()
                            .setColor('#FFA500')
                            .setTitle(`🔇 ${interaction.guild.name} serverində susdurulduz`)
                            .addFields(
                                { name: 'Susduran', value: `${interaction.user.tag}`, inline: true },
                                { name: 'Vaxt', value: readableDuration, inline: true },
                                { name: 'Səbəb', value: reason, inline: false },
                                { name: 'Bitiş', value: `<t:${endTime}:F> (<t:${endTime}:R>)`, inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) });
                            
                        await targetUser.send({ embeds: [dmEmbed] });
                    } catch (err) {
                  
                    }

                    
                    const muteLogChannelId = '1362123301534568448';
                    const muteLogChannel = interaction.guild.channels.cache.get(muteLogChannelId);
                    
                    if (muteLogChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setColor('#FFA500')
                            .setTitle('🔇 İstifadəçi susdurulub')
                            .addFields(
                                { name: 'İstifadəçi', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
                                { name: 'ID', value: targetUser.id, inline: true },
                                { name: 'Susduran', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                                { name: 'Vaxt', value: readableDuration, inline: true },
                                { name: 'Səbəb', value: reason, inline: false },
                                { name: 'Başlangıc', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
                                { name: 'Bitiş', value: `<t:${endTime}:F> (<t:${endTime}:R>)`, inline: false }
                            )
                            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                            .setTimestamp();
                            
                        muteLogChannel.send({ embeds: [logEmbed] }).catch(console.error);
                    }

                } catch (error) {
                    console.error(error);
                    await i.update({ 
                        content: '❌ **İstifadəçini susdurarken xəta baş verdi.**', 
                        embeds: [], 
                        components: [] 
                    });
                }
            } else if (i.customId === 'cancel_mute') {
                
                const cancelEmbed = new EmbedBuilder()
                    .setColor('#808080')
                    .setTitle('❌ MUTE LƏĞV EDİLDİ')
                    .setDescription(`**${targetUser.tag}** susdurulması ləğv edildi.`)
                    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                    .setTimestamp();
                
                await i.update({ embeds: [cancelEmbed], components: [disabledRow] });
            }

            collector.stop();
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
             
                const timeoutRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm_mute')
                            .setLabel('Susdur')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('cancel_mute')
                            .setLabel('Ləğv et')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                    );

                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('⏰ VAXT BİTTİ')
                    .setDescription(`**${targetUser.tag}**-ın səssiz qalma müddəti başa çatıb.`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [timeoutEmbed], components: [timeoutRow] }).catch(console.error);
            }
        });
    },
};


function parseDuration(durationString) {
    const regex = /^(\d+)([mhd])$/;
    const match = durationString.match(regex);
    
    if (!match) return null;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
        case 'm': return value * 60 * 1000; 
        case 'h': return value * 60 * 60 * 1000;
        case 'd': return value * 24 * 60 * 60 * 1000; 
        default: return null;
    }
}


function getReadableDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days} gün ${hours % 24} saat`;
    } else if (hours > 0) {
        return `${hours} saat ${minutes % 60} dəqiqə`;
    } else {
        return `${minutes} dəqiqə`;
    }
}