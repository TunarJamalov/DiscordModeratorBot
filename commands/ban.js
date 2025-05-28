const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('İstifadəçini serverdən qadağan edir')
        .addUserOption(option => 
            option.setName('kullanici')
                .setDescription('Qadağan etmək üçün istifadəçi')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('sebep')
                .setDescription('Qadağa səbəbi')
                .setRequired(false))
        .addNumberOption(option =>
            option.setName('gün')
                .setDescription('Neçə günlük mesajlar silinməlidir (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false)),
    
    async execute(interaction) {
       
        const banPermission = interaction.member.permissions.has(PermissionFlagsBits.BanMembers);
        
        const ozelRolID = '1362123102343135466'; 
        const hasSpecialRole = interaction.member.roles.cache.has(ozelRolID);
        
       
        if (!banPermission && !hasSpecialRole) {
            return interaction.reply({
                content: '⛔ **Bu əmrdən istifadə etmək icazəniz yoxdur!**',
                ephemeral: true
            });
        }
        
        const targetUser = interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('sebep') || 'Səbəb göstərilməyib';
        const deleteMessageDays = interaction.options.getNumber('gün') || 1;
     
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        
     
        if (!targetMember) {
            return interaction.reply({
                content: '❌ **Bu istifadəçini tapmaq və ya qadağan etmək mümkün deyil.**',
                ephemeral: true
            });
        }
        
       
        if (targetMember.roles.highest.position >= interaction.member.roles.highest.position && interaction.member.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: '⚠️ **Bu istifadəçini qadağan edə bilməzsiniz, çünki onlar sizdən daha yüksək və ya bərabər rola malikdirlər.**',
                ephemeral: true
            });
        }

        // Ban onay mesajı
        const confirmEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('⚠️ BAN TƏSDİQ')
            .setDescription(`**${targetUser.tag}** qadağan etmək istədiyinizə əminsiniz?`)
            .addFields(
                { name: 'İstifadəçi', value: `<@${targetUser.id}>`, inline: true },
                { name: 'ID', value: targetUser.id, inline: true },
                { name: 'Səbəb', value: reason, inline: false },
                { name: 'Silinəcək Mesaj Müddəti', value: `${deleteMessageDays} gün`, inline: false }
            )
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
            .setTimestamp();
            
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_ban')
                    .setLabel('Banla')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_ban')
                    .setLabel('Banlama')
                    .setStyle(ButtonStyle.Secondary),
            );

        const response = await interaction.reply({
            embeds: [confirmEmbed],
            components: [row],
            fetchReply: true
        });


        const filter = i => i.customId === 'confirm_ban' || i.customId === 'cancel_ban';
        const collector = response.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'Bu düymələrdən yalnız əmrdən istifadə edən şəxs istifadə edə bilər!', ephemeral: true });
            }

           
            const disabledRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_ban')
                        .setLabel('Banla')
                        .setStyle(ButtonStyle.Danger)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('cancel_ban')
                        .setLabel('Banlama')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                );

            if (i.customId === 'confirm_ban') {
                
                try {
                    await interaction.guild.members.ban(targetUser, { 
                        reason: `${interaction.user.tag} tərəfindən banlandı. Səbəb: ${reason}`,
                        deleteMessageDays: deleteMessageDays
                    });
                    
                    // Ban GIF'leri - kendi GIF URL'lerinizle değiştirin
                    const banGifs = [
                        'https://s6.gifyu.com/images/bMTrr.gif',
                        'https://images-ext-1.discordapp.net/external/NihUm2MdmFvthhMZ_W400VGFGm6WLWS2ZIAPoLgS2vY/https/media.tenor.com/_x5kGlaLOwYAAAPo/duck-fuck.mp4',
                        'https://images-ext-1.discordapp.net/external/Di1RYPS2b7X8nJo-t9UVbwGN0XPszir5ZJlB6tE8Plc/https/media.tenor.com/KRRPGnVGK8wAAAPo/damin-toell.mp4'
                    ];
                    
                    // Rastgele bir GIF seç
                    const randomGif = banGifs[Math.floor(Math.random() * banGifs.length)];
                    
                    const successEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('🔨 BAN PROSESİ UĞURLU OLDU')
                        .setDescription(`İstifadəçi **${targetUser.tag}** uğurla qadağan edildi!`)
                        .addFields(
                            { name: 'İstifadəçi', value: `<@${targetUser.id}>`, inline: true },
                            { name: 'ID', value: targetUser.id, inline: true },
                            { name: 'Banlayan', value: `<@${interaction.user.id}>`, inline: true },
                            { name: 'Səbəb', value: reason, inline: false },
                            { name: 'Tarix', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                        )
                        .setImage(randomGif)
                        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                        .setTimestamp()
                        .setFooter({ text: `${interaction.guild.name} • Moderasya Sistemi`, iconURL: interaction.guild.iconURL({ dynamic: true }) });
                    
                    await i.update({ embeds: [successEmbed], components: [disabledRow] });

                   
                    const banLogChannelId = '1362123299659845632'; 
                    const banLogChannel = interaction.guild.channels.cache.get(banLogChannelId);
                    
                    if (banLogChannel) {
                        const logEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('🔨 İstifadəçi Qadağan Edildi')
                            .addFields(
                                { name: 'İstifadəçi', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: true },
                                { name: 'ID', value: targetUser.id, inline: true },
                                { name: 'Banlayan', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                                { name: 'Səbəb', value: reason, inline: false },
                                { name: 'Tarix', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                            )
                            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                            .setTimestamp();
                            
                        banLogChannel.send({ embeds: [logEmbed] }).catch(console.error);
                    }

                } catch (error) {
                    console.error(error);
                    await i.update({ 
                        content: '❌ **İstifadəçiyə qadağa qoyularkən xəta baş verdi.**', 
                        embeds: [], 
                        components: [] 
                    });
                }
            } else if (i.customId === 'cancel_ban') {
                // İptal edildi
                const cancelEmbed = new EmbedBuilder()
                    .setColor('#808080')
                    .setTitle('❌ BAN LƏĞV')
                    .setDescription(`**${targetUser.tag}** qadağası ləğv edildi.`)
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
                            .setCustomId('confirm_ban')
                            .setLabel('Banla')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('cancel_ban')
                            .setLabel('Ləğv et')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                    );

                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('⏰ VAXT BİTTİ')
                    .setDescription(`**${targetUser.tag}** qadağasının müddəti bitdi.`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [timeoutEmbed], components: [timeoutRow] }).catch(console.error);
            }
        });
    },
};