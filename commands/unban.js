const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('İstifadəçinin qadağasını ləğv edir')
        .addStringOption(option => 
            option.setName('userid')
                .setDescription('Qadağadan çıxarılacaq istifadəçinin ID-si')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('sebep')
                .setDescription('Qadağanın götürülməsinin səbəbi')
                .setRequired(false)),
    
    async execute(interaction) {
      
        const unbanPermission = interaction.member.permissions.has(PermissionFlagsBits.BanMembers);
        
       
        const ozelRolID = '1362123102343135466'; 
        const hasSpecialRole = interaction.member.roles.cache.has(ozelRolID);
        
        
        if (!unbanPermission && !hasSpecialRole) {
            return interaction.reply({
                content: '⛔ **Bu əmrdən istifadə etmək icazəniz yoxdur!**',
                ephemeral: true
            });
        }
        
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('sebep') || 'Səbəb göstərilməyib';
        
        if (!/^\d{17,20}$/.test(userId)) {
            return interaction.reply({
                content: '❌ **Yanlış istifadəçi ID-si daxil etdiniz. Discord ID-ləri 17-20 rəqəmli rəqəmlərdən ibarətdir.**',
                ephemeral: true
            });
        }
        
        try {
          
            const banList = await interaction.guild.bans.fetch();
            const bannedUser = banList.find(ban => ban.user.id === userId);
            
            if (!bannedUser) {
                return interaction.reply({
                    content: '❓ **Bu istifadəçi onsuzda serverdə qadağan olunmayıb.**',
                    ephemeral: true
                });
            }
            
         
            const confirmEmbed = new EmbedBuilder()
                .setColor('#00AAFF')
                .setTitle('⚠️ UNBAN TƏSDİQ')
                .setDescription(`**${bannedUser.user.tag}** qadağasını ləğv etmək istədiyinizə əminsiniz?`)
                .addFields(
                    { name: 'İstifadəçi', value: `${bannedUser.user.tag}`, inline: true },
                    { name: 'ID', value: userId, inline: true },
                    { name: 'Səbəb', value: reason, inline: false },
                    { name: 'Əvvəlki Ban Səbəbi', value: bannedUser.reason || 'Müəyyən edilməmiş', inline: false }
                )
                .setThumbnail(bannedUser.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
                
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm_unban')
                        .setLabel('Banı qaldır')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancel_unban')
                        .setLabel('Ləğv et')
                        .setStyle(ButtonStyle.Secondary),
                );

            const response = await interaction.reply({
                embeds: [confirmEmbed],
                components: [row],
                fetchReply: true
            });

           
            const filter = i => i.customId === 'confirm_unban' || i.customId === 'cancel_unban';
            const collector = response.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async i => {
                if (i.user.id !== interaction.user.id) {
                    return i.reply({ content: 'Bu düymələrdən yalnız əmrdən istifadə edən şəxs istifadə edə bilər!', ephemeral: true });
                }

                
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('confirm_unban')
                            .setLabel('Banı qaldır')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('cancel_unban')
                            .setLabel('Ləğv et')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                    );

                if (i.customId === 'confirm_unban') {
                   
                    try {
                        await interaction.guild.members.unban(userId, `${interaction.user.tag} tərəfindən qaldırıldı. Səbəb: ${reason}`);
                        
                        
                        const unbanGifs = [
                            'https://s6.gifyu.com/images/bMTrr.gif'
                        ];
                        
                    
                        const randomGif = unbanGifs[Math.floor(Math.random() * unbanGifs.length)];
                        
                        const successEmbed = new EmbedBuilder()
                            .setColor('#00FF00')
                            .setTitle('🔓 QADAĞAN QALDIRILMASI PROSESİ UĞURLU OLDU')
                            .setDescription(`**${bannedUser.user.tag}** qadağası uğurla ləğv edildi!`)
                            .addFields(
                                { name: 'İstifadəçi', value: `${bannedUser.user.tag}`, inline: true },
                                { name: 'ID', value: userId, inline: true },
                                { name: 'Banı qaldıran', value: `<@${interaction.user.id}>`, inline: true },
                                { name: 'Səbəb', value: reason, inline: false },
                                { name: 'Tarix', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                            )
                            .setImage(randomGif)
                            .setThumbnail(bannedUser.user.displayAvatarURL({ dynamic: true }))
                            .setTimestamp()
                            .setFooter({ text: `${interaction.guild.name} • Moderasiya Sistemi`, iconURL: interaction.guild.iconURL({ dynamic: true }) });
                        
                        await i.update({ embeds: [successEmbed], components: [disabledRow] });

                        
                        const unbanLogChannelId = '1362123299659845632'; 
                        const unbanLogChannel = interaction.guild.channels.cache.get(unbanLogChannelId);
                        
                        if (unbanLogChannel) {
                            const logEmbed = new EmbedBuilder()
                                .setColor('#00FF00')
                                .setTitle('🔓 İstifadəçi qadağası silindi')
                                .addFields(
                                    { name: 'İstifadəçi', value: `${bannedUser.user.tag}`, inline: true },
                                    { name: 'ID', value: userId, inline: true },
                                    { name: 'Banı qaldıran', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
                                    { name: 'Səbəb', value: reason, inline: false },
                                    { name: 'Əvvəlki Ban Səbəbi', value: bannedUser.reason || 'Məlum deyil', inline: false },
                                    { name: 'Tarix', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
                                )
                                .setThumbnail(bannedUser.user.displayAvatarURL({ dynamic: true }))
                                .setTimestamp();
                                
                            unbanLogChannel.send({ embeds: [logEmbed] }).catch(console.error);
                        }

                    } catch (error) {
                        console.error(error);
                        await i.update({ 
                            content: '❌ **İstifadəçi qadağanı ləğv edərkən xəta baş verdi.**', 
                            embeds: [], 
                            components: [] 
                        });
                    }
                } else if (i.customId === 'cancel_unban') {
                  
                    const cancelEmbed = new EmbedBuilder()
                        .setColor('#808080')
                        .setTitle('❌ UNBAN LƏĞV EDİLDİ')
                        .setDescription(`**${bannedUser.user.tag}** qadağasının silinməyi ləğv edildi.`)
                        .setThumbnail(bannedUser.user.displayAvatarURL({ dynamic: true }))
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
                                .setCustomId('confirm_unban')
                                .setLabel('Banı qaldır')
                                .setStyle(ButtonStyle.Success)
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('cancel_unban')
                                .setLabel('Ləğv et')
                                .setStyle(ButtonStyle.Secondary)
                                .setDisabled(true),
                        );

                    const timeoutEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('⏰ VAXT BİTTİ')
                        .setDescription(`**${bannedUser.user.tag}** qadağasının ləğv edilməsi vaxtı başa çatıb.`)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [timeoutEmbed], components: [timeoutRow] }).catch(console.error);
                }
            });
            
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: '❌ **Qadağan edilmiş istifadəçiləri yoxlayarkən xəta baş verdi.**',
                ephemeral: true
            });
        }
    },
};