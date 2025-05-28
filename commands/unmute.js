const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('İstifadəçinin susdurulmasını silir.')
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Susdurulması silinəcək istifadəçi')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('sebep')
                .setDescription('Susdurulmanı qaldırma səbəbi')
                .setRequired(false)),
    
    async execute(interaction) {
      
        const unmutePermission = interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers);
        
        
        const ozelRolID = '1362123105933463794'; 
        const hasSpecialRole = interaction.member.roles.cache.has(ozelRolID);
        
      
        if (!unmutePermission && !hasSpecialRole) {
            return interaction.reply({
                content: '⛔ **Bu əmrdən istifadə etmək icazəniz yoxdur!**',
                ephemeral: true
            });
        }
        
        const targetUser = interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('sebep') || 'Səbəb göstərilməyib';
        
       
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
       
        if (!targetMember) {
            return interaction.reply({
                content: '❌ **Bu istifadəçi tapılmadı.**',
                ephemeral: true
            });
        }
        
       
        if (!targetMember.isCommunicationDisabled()) {
            return interaction.reply({
                content: '⚠️ **Bu istifadəçi hələ susdurulmayıb.**',
                ephemeral: true
            });
        }
        
       
        const confirmEmbed = new EmbedBuilder()
            .setColor('#00AAFF')
            .setTitle('⚠️ UNMUTE TƏSDİQ')
            .setDescription(`**${targetUser.tag}** səsini açmaq istədiyinizə əminsiniz?`)
            .addFields(
                { name: 'İstifadəçi', value: `<@${targetUser.id}>`, inline: true },
                { name: 'ID', value: targetUser.id, inline: true },
                { name: 'Bitiş', value: `<t:${Math.floor(targetMember.communicationDisabledUntilTimestamp / 1000)}:R>`, inline: true },
                { name: 'Səbəb', value: reason, inline: false }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
            
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_unmute')
                    .setLabel('Susdurulma sil')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('cancel_unmute')
                    .setLabel('Ləğv et')
                    .setStyle(ButtonStyle.Secondary),
            );

        const response = await interaction.reply({
            embeds: [confirmEmbed],
            components: [row],
            fetchReply: true
        });

        
        const filter = i => i.customId === 'confirm_unmute' || i.customId === 'cancel_unmute';
        const collector = response.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'Bu düymələrdən yalnız əmrdən istifadə edən şəxs istifadə edə bilər!', ephemeral: true });
            }

            
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_unmute')
                        .setLabel('Susdurulma sil')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('cancel_unmute')
                        .setLabel('Ləğv et')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                );

            if (i.customId === 'confirm_unmute') {
               
                try {
                   
                    await targetMember.timeout(null, `${interaction.user.tag} tərəfindən səssizdən çıxarıldı. Səbəb: ${reason}`);
                    
                    
                    const unmuteGifs = [
                        'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
                        'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
                        'https://media.giphy.com/media/35HTaxVJWzp2QOShct/giphy.gif',
                        'https://media.giphy.com/media/QsZol42CPIjMzq5CA3/giphy.gif',
                        'https://media.giphy.com/media/ASvQ3A2Q7blzq/giphy.gif'
                    ];
                    
                   
                    const randomGif = unmuteGifs[Math.floor(Math.random() * unmuteGifs.length)];
                    
                    const successEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('🔊 UNMUTE PROSESİ UĞURLU OLDU')
                        .setDescription(`**${targetUser.tag}** istifadəçisinin susdurulması silindi.`)
                        .addFields(
                            { name: 'İstifadəçi', value: `<@${targetUser.id}>`, inline: true },
                            { name: 'ID', value: targetUser.id, inline: true },
                            { name: 'Heyət', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Səbəb', value: reason, inline: false },
                            { name: 'Tarix', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                        )
                        .setImage(randomGif)
                        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: `${interaction.guild.name} • Moderasiya Sistemi`, iconURL: interaction.guild.iconURL({ dynamic: true }) });
                    
                    await i.update({ embeds: [successEmbed], components: [disabledRow] });
                    
                    
                    try {
                        const dmEmbed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle(`🔊 ${interaction.guild.name} sunucusunda susdurulmanız silindi.`)
                            .addFields(
                                { name: 'Heyət', value: `${interaction.user.tag}`, inline: true },
                                { name: 'Səbəb', value: reason, inline: false },
                                { name: 'Tarix', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                            )
                            .setTimestamp()
                            .setFooter({ text: interaction.guild.name, iconURL: interaction.guild.iconURL({ dynamic: true }) });
                            
                        await targetUser.send({ embeds: [dmEmbed] });
                    } catch (err) {
                   
                    }

                    const unmuteLogChannelId = '1362123301534568448';
                    const unmuteLogChannel = interaction.guild.channels.cache.get(unmuteLogChannelId);
                    
                    if (unmuteLogChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle('🔊 İstifadəçi Səssizi Silindi')
                            .addFields(
                                { name: 'İstifadəçi', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
                                { name: 'ID', value: targetUser.id, inline: true },
                                { name: 'Heyət', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                                { name: 'Səbəb', value: reason, inline: false },
                                { name: 'Tarix', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                            )
                            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                            .setTimestamp();
                            
                        unmuteLogChannel.send({ embeds: [logEmbed] }).catch(console.error);
                    }

                } catch (error) {
                    console.error(error);
                    await i.update({ 
                        content: '❌ **İstifadəçinin səsini çıxararkən xəta baş verdi.**', 
                        embeds: [], 
                        components: [] 
                    });
                }
            } else if (i.customId === 'cancel_unmute') {
              
                const cancelEmbed = new EmbedBuilder()
                    .setColor('#808080')
                    .setTitle('❌ UNMUTE LƏĞV ET')
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
                            .setCustomId('confirm_unmute')
                            .setLabel('Susdurmağı sil')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('cancel_unmute')
                            .setLabel('Ləğv et')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                    );

                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('⏰ VAXT BİTTİ')
                    .setDescription(`**${targetUser.tag}** səsini açmaq üçün vaxt başa çatıb.`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [timeoutEmbed], components: [timeoutRow] }).catch(console.error);
            }
        });
    },
};