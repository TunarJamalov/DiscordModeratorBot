const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, version } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Bot, server və ya istifadəçi haqqında məlumat əldə edin')
        .addSubcommand(subcommand =>
            subcommand
                .setName('bot')
                .setDescription('Bot haqqında məlumat əldə edin'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('server')
                .setDescription('Server haqqında məlumat əldə edin'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('user')
                .setDescription('İstifadəçi haqqında məlumat əldə edin')
                .addUserOption(option => 
                    option.setName('target')
                        .setDescription('İstifadəçi haqqında məlumat almaq üçün')
                        .setRequired(false))),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'bot') {
            await handleBotInfo(interaction);
        } else if (subcommand === 'server') {
            await handleServerInfo(interaction);
        } else if (subcommand === 'user') {
            await handleUserInfo(interaction);
        }
    }
};


async function handleBotInfo(interaction) {
    const client = interaction.client;
    
    
    const uptime = formatUptime(client.uptime);
   
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = (memoryUsage.rss / 1024 / 1024).toFixed(2);
    const totalMemoryMB = (os.totalmem() / 1024 / 1024).toFixed(2);
    
    const embed = new EmbedBuilder()
        .setTitle(`${client.user.username} Bot Məlumatı`)
        .setColor('#5865F2')
        .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
        .addFields(
            { name: '🤖 Bot Adı', value: client.user.tag, inline: true },
            { name: '🆔 Bot ID', value: client.user.id, inline: true },
            { name: '📆 Yaranış Tarixi', value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:F>`, inline: true },
            { name: '⌛ Uptime', value: uptime, inline: true },
            { name: '🏓 Gecikmə', value: `${client.ws.ping}ms`, inline: true },
            { name: '🖥️ Yaddaş İstifadəsi', value: `${memoryUsedMB} MB`, inline: true },
            { name: '🌐 Serverlər', value: `${client.guilds.cache.size.toString()}`, inline: true },
            { name: '👥 İstifadəçi', value: `${client.users.cache.size.toString()}`, inline: true },
            { name: '📚 Discord.js', value: `v${version}`, inline: true },
            { name: '📦 Node.js', value: `${process.version}`, inline: true },
            { name: '💻 OS', value: `${os.type()} ${os.release()}`, inline: true },
            { name: '🔄 CPU', value: `${os.cpus()[0].model}`, inline: true }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
    
    
    
    await interaction.reply({
        embeds: [embed],
      
    });
}


async function handleServerInfo(interaction) {
    const guild = interaction.guild;
    
   
    const completeGuild = await guild.fetch();
    
   
    const textChannels = guild.channels.cache.filter(c => c.type === 0).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === 2).size;
    const categoryChannels = guild.channels.cache.filter(c => c.type === 4).size;
    const forumChannels = guild.channels.cache.filter(c => c.type === 15).size;
   
    const regularEmojis = guild.emojis.cache.filter(e => !e.animated).size;
    const animatedEmojis = guild.emojis.cache.filter(e => e.animated).size;
    
   
    const totalMembers = guild.memberCount;
    const botCount = guild.members.cache.filter(member => member.user.bot).size;
    const humanCount = totalMembers - botCount;
    
    
    const boostLevel = guild.premiumTier;
    const boostCount = guild.premiumSubscriptionCount;
    
   
    const embed = new EmbedBuilder()
        .setTitle(`${guild.name} Server Məlumat`)
        .setColor('#5865F2')
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
            { name: '📝 Server Adı', value: guild.name, inline: true },
            { name: '🆔 Server ID', value: guild.id, inline: true },
            { name: '👑 Qurucu', value: `<@${guild.ownerId}>`, inline: true },
            { name: '📆 Yaradılış Tarixi', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
            { name: '🌍 Region', value: completeGuild.preferredLocale || 'Unknown', inline: true },
            { name: '🔒 Doğrulama Səviyyəsi', value: getVerificationLevel(guild.verificationLevel), inline: true },
            { name: '👥 Üzvlər', value: `Cəmi: ${totalMembers}\nİnsan: ${humanCount}\nBot: ${botCount}`, inline: true },
            { name: '📊 Kanallar', value: `Cəmi: ${guild.channels.cache.size}\n📝 Text: ${textChannels}\n🔊 Voice: ${voiceChannels}\n📁 Categories: ${categoryChannels}\n📢 Forums: ${forumChannels}`, inline: true },
            { name: '😀 Emojilər', value: `Normal: ${regularEmojis}\nAnimasiyalı: ${animatedEmojis}\nCəmi: ${guild.emojis.cache.size}`, inline: true },
            { name: '🚀 Boost Statusu', value: `Level: ${boostLevel}\nBoosts: ${boostCount}`, inline: true },
            { name: '🔖 Rollar', value: `${guild.roles.cache.size} roles`, inline: true }
        )
        .setImage(guild.bannerURL({ size: 1024 }))
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
}


async function handleUserInfo(interaction) {
    
    const targetUser = interaction.options.getUser('target') || interaction.user;
    
    try {
       
        const member = await interaction.guild.members.fetch(targetUser.id);
        
        const accountCreated = `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`;
      
        const joinedServer = `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`;
        
       
        const roles = member.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .sort((a, b) => b.position - a.position)
            .map(role => `<@&${role.id}>`)
            .join(', ') || 'No roles';
        
        const isBot = targetUser.bot ? 'Yes' : 'No';
        
        
        let status = 'Offline';
        if (member.presence) {
            status = {
                online: 'Online',
                idle: 'Idle',
                dnd: 'Do Not Disturb',
                offline: 'Offline'
            }[member.presence.status] || 'Unknown';
        }
       
        const embed = new EmbedBuilder()
            .setTitle(`İstifadəçi Məlumatı - ${targetUser.tag}`)
            .setColor(member.displayHexColor || '#5865F2')
            .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                { name: '🏷️ Ad', value: targetUser.username, inline: true },
                { name: '🆔 ID', value: targetUser.id, inline: true },
                { name: '🤖 Bot', value: isBot, inline: true },
                { name: '📆 Hesab Yaradıldı', value: accountCreated, inline: true },
                { name: '🔰 Sunucuya qoşuldu', value: joinedServer, inline: true },
                { name: '🟢 Status', value: status, inline: true },
                { name: '💻 Platforma', value: getPlatforms(member), inline: true },
                { name: `🎭 Rollar [${member.roles.cache.size - 1}]`, value: roles.substring(0, 1024) }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();
        
       
        if (targetUser.banner) {
            embed.setImage(targetUser.bannerURL({ dynamic: true, size: 1024 }));
        }
        
        
        const actionRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Avatara bax')
                    .setStyle(ButtonStyle.Link)
                    .setURL(targetUser.displayAvatarURL({ dynamic: true, size: 4096 }))
            );
        
        await interaction.reply({
            embeds: [embed],
            components: [actionRow]
        });
        
    } catch (error) {
        console.error('Error getting user info:', error);
        await interaction.reply({
            content: 'Failed to get user information. The user might not be in this server.',
            ephemeral: true
        });
    }
}


function formatUptime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

function getVerificationLevel(level) {
    const levels = {
        0: 'None',
        1: 'Low',
        2: 'Medium',
        3: 'High',
        4: 'Very High'
    };
    
    return levels[level] || 'Unknown';
}

function getPlatforms(member) {
    const platforms = [];
    
    if (!member.presence) return 'Unknown';
    
    if (member.presence.clientStatus) {
        if (member.presence.clientStatus.desktop) platforms.push('Desktop');
        if (member.presence.clientStatus.mobile) platforms.push('Mobile');
        if (member.presence.clientStatus.web) platforms.push('Web');
    }
    
    return platforms.length > 0 ? platforms.join(', ') : 'Unknown';
}