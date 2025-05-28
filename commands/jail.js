const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '..', 'data', 'jailedUsers.json');
const configPath = path.join(__dirname, '..', 'config.json');


function loadConfig() {
    if (!fs.existsSync(configPath)) {
        
        const defaultConfig = {
            logChannelId: "", 
            jailRoleId: ""   
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
        return defaultConfig;
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
}


function ensureDataFileExists() {
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(dataPath)) {
        fs.writeFileSync(dataPath, JSON.stringify({}), 'utf8');
    }
}


function loadJailedUsers() {
    ensureDataFileExists();
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
}


function saveJailedUsers(data) {
    ensureDataFileExists();
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}


async function sendLog(guild, embed) {
    const config = loadConfig();
    if (!config.logChannelId) return;
    
    try {
        const logChannel = await guild.channels.fetch(config.logChannelId);
        if (logChannel && logChannel.isTextBased()) {
            await logChannel.send({ embeds: [embed] });
        }
    } catch (error) {
        console.error("Log gönderilemedi:", error);
    }
}


async function sendDM(user, message) {
    try {
        await user.send(message);
        return true;
    } catch (error) {
     
        return false;
    }
}


const MAX_TIMEOUT = 2147483647;


module.exports = {
    data: new SlashCommandBuilder()
        .setName('jail')
        .setDescription('İstifadəçini həbs edir və rollarını saxlayır.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Həbs ediləcək istifadəçi')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sure')
                .setDescription('Həbs vaxtı (1h, 1d, 1w kimi)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Həbs səbəbi')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    async execute(interaction, client) {
      
        if (!interaction.guild) {
            return interaction.reply({ content: "Bu əmr yalnız serverlərdə istifadə edilə bilər.", ephemeral: true });
        }

        const config = loadConfig();
        if (!config.jailRoleId) {
            return interaction.reply({ content: "Həbsxana rolu təyin edilməyib. Config.json faylında jailRoleId dəyərini yeniləyin.", ephemeral: true });
        }

        const targetUser = interaction.options.getUser('kullanici');
        const duration = interaction.options.getString('sure');
        const reason = interaction.options.getString('sebep');
        
     
        const jailRoleId = config.jailRoleId;
        const jailRole = interaction.guild.roles.cache.get(jailRoleId);
        
        if (!jailRole) {
            return interaction.reply({ content: "Həbsxana rolu tapılmadı. Lütfən, rol ID-ni yoxlayın.", ephemeral: true });
        }
        
        try {
            
            const member = await interaction.guild.members.fetch(targetUser.id);
            
            
            const roles = Array.from(member.roles.cache.keys()).filter(roleId => roleId !== interaction.guild.id);
            
           
            await member.roles.remove(roles);
            
       
            await member.roles.add(jailRoleId);
            
          
            const jailedUsers = loadJailedUsers();
            jailedUsers[targetUser.id] = {
                userId: targetUser.id,
                guildId: interaction.guildId,
                roles: roles,
                reason: reason,
                jailedBy: interaction.user.id,
                jailedAt: new Date().toISOString()
            };
            
         
            let releaseTime = null;
            let ms = 0;
            if (duration) {
                const durationMatch = duration.match(/^(\d+)([hdwm])$/);
                if (durationMatch) {
                    const value = parseInt(durationMatch[1]);
                    const unit = durationMatch[2];
                    
                    switch (unit) {
                        case 'h': ms = value * 60 * 60 * 1000; break; 
                        case 'd': ms = value * 24 * 60 * 60 * 1000; break; 
                        case 'w': ms = value * 7 * 24 * 60 * 60 * 1000; break; 
                        case 'm': ms = value * 30 * 24 * 60 * 60 * 1000; break; 
                    }
                    
                    if (ms > 0) {
                        releaseTime = new Date(Date.now() + ms).toISOString();
                        jailedUsers[targetUser.id].releaseTime = releaseTime;
                    }
                }
            }
            
            saveJailedUsers(jailedUsers);
            
          
            const jailEmbed = new EmbedBuilder()
                .setTitle('❌ İstifadəçi Həbs edildi')
                .setColor('#FF0000')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'İstifadəçi', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
                    { name: 'Mute atan', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
                    { name: 'Səbəb', value: reason, inline: false },
                    { name: 'Vaxt', value: duration, inline: false }
                )
                .setTimestamp();
            
            if (releaseTime) {
                const releaseDate = new Date(releaseTime);
                jailEmbed.addFields({ name: 'Buraxılış vaxtı', value: `<t:${Math.floor(releaseDate.getTime() / 1000)}:F>`, inline: false });
            }
          
            await sendLog(interaction.guild, jailEmbed);
         
            let replyMessage = `${targetUser} uğurla həbs olundu.\nSəbəb: ${reason}`;
            if (releaseTime) {
                const releaseDate = new Date(releaseTime);
                replyMessage += `\nVaxt: ${duration}`;
                replyMessage += `\nBuraxılış vaxtı: <t:${Math.floor(releaseDate.getTime() / 1000)}:F>`;
            }
            
           
            const dmSent = await sendDM(targetUser, `Siz ${interaction.guild.name} serverində həbs olunmusunuz.\nSəbəb: ${reason}\n${releaseTime ? `Vaxt: ${duration}\nBuraxılış vaxtı: <t:${Math.floor(new Date(releaseTime).getTime() / 1000)}:F>` : 'Error'}`);
            
            if (!dmSent) {
                replyMessage += "\n(İstifadəçi DM-ləri deaktiv edildiyi üçün bildiriş göndərilə bilmədi)";
            }
            
      
            await interaction.reply({ content: replyMessage });
            
            
            if (ms > 0) {
              
                const clientRef = client;
                const guildId = interaction.guildId;
                const userId = targetUser.id;
                const jailRoleIdRef = jailRoleId;
                const releaseTimeRef = releaseTime;
                
             
                if (ms <= MAX_TIMEOUT) {
                    
                    setTimeout(async function() {
                        await handleJailRelease(clientRef, guildId, userId, jailRoleIdRef, releaseTimeRef);
                    }, ms);
                } else {
                  
                    const CHECK_INTERVAL = 24 * 60 * 60 * 1000; 
                    
                    const intervalId = setInterval(async function() {
                        const currentTime = new Date();
                        const releaseDate = new Date(releaseTimeRef);
                        
                        if (currentTime >= releaseDate) {
                            clearInterval(intervalId);
                            await handleJailRelease(clientRef, guildId, userId, jailRoleIdRef, releaseTimeRef);
                        }
                    }, CHECK_INTERVAL);
                }
            }
            
        } catch (error) {
            console.error("Jail error:", error);
            return interaction.reply({ content: "İstifadəçini jailbreak edərkən xəta baş verdi. İcazələri yoxlayın.", ephemeral: true });
        }
    }
};


async function handleJailRelease(client, guildId, userId, jailRoleId, releaseTimeRef) {
    try {
        
        if (!client || !client.guilds) {
            console.error("error");
            return;
        }
        
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error("Guild tapilmadi:", guildId);
            return;
        }
        
        const currentData = loadJailedUsers();
        
      
        if (currentData[userId] && currentData[userId].releaseTime === releaseTimeRef) {
            try {
                const memberToUnjail = await guild.members.fetch(userId).catch(() => null);
                
                if (memberToUnjail) {
                   
                    await memberToUnjail.roles.remove(jailRoleId);
                    
                    
                    await memberToUnjail.roles.add(currentData[userId].roles);
                    
                    
                    const autoUnjailEmbed = new EmbedBuilder()
                        .setTitle('✅ İstifadəçi Avtomatik Həbs edilib')
                        .setColor('#00FF00')
                        .setThumbnail(memberToUnjail.user.displayAvatarURL({ dynamic: true }))
                        .addFields(
                            { name: 'İstifadəçi', value: `${memberToUnjail.user.tag} (${memberToUnjail.user.id})`, inline: false },
                            { name: 'Məlumat', value: 'Həbs müddəti bitdiyi üçün o, avtomatik olaraq həbsdən azad edilib.', inline: false }
                        )
                        .setTimestamp();
                    
                    
                    await sendLog(guild, autoUnjailEmbed);
             
                    delete currentData[userId];
                    saveJailedUsers(currentData);
                    
               
                    await sendDM(memberToUnjail.user, `${guild.name} serverində həbs müddətiniz bitdi. Yenidən xoş gəlmisiniz!`);
                }
            } catch (error) {
                console.error("oto jail xətası", error);
            }
        }
    } catch (error) {
        console.error("Jail error:", error);
    }
}