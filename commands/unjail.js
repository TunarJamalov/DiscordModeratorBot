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
        console.error("Log error:", error);
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


module.exports = {
    data: new SlashCommandBuilder()
        .setName('unjail')
        .setDescription('İstifadəçini həbsdən azad edir və köhnə roluna qaytarır.')
        .addUserOption(option =>
            option.setName('kullanici')
                .setDescription('Həbsdən azad ediləcək istifadəçi')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('sebep')
                .setDescription('Həbsdən azad edilmə səbəbi')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    async execute(interaction) {
       
        if (!interaction.guild) {
            return interaction.reply({ content: "Bu əmr yalnız serverlərdə istifadə edilə bilər.", ephemeral: true });
        }

        const config = loadConfig();
        if (!config.jailRoleId) {
            return interaction.reply({ content: "Həbsxana rolu təyin edilməyib. Config.json faylında jailRoleId dəyərini yeniləyin.", ephemeral: true });
        }

        const targetUser = interaction.options.getUser('kullanici');
        const reason = interaction.options.getString('sebep') || 'Məlum deyil';
      
        const jailRoleId = config.jailRoleId;
        
        try {
          
            const member = await interaction.guild.members.fetch(targetUser.id);
            
         
            const jailedUsers = loadJailedUsers();
            
            if (!jailedUsers[targetUser.id]) {
                return interaction.reply({ content: "Bu istifadəçi həbsdə deyil.", ephemeral: true });
            }
            
          
            await member.roles.remove(jailRoleId);
            
         
            await member.roles.add(jailedUsers[targetUser.id].roles);
            
           
            const unjailEmbed = new EmbedBuilder()
                .setTitle('✅ İstifadəçi Həbsdən çıxarıldı')
                .setColor('#00FF00')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: 'İstifadəçi', value: `${targetUser.tag} (${targetUser.id})`, inline: false },
                    { name: 'Jail Staff', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
                    { name: 'Səbəb', value: reason, inline: false }
                )
                .setTimestamp();
            
         
            if (jailedUsers[targetUser.id].jailedBy) {
                unjailEmbed.addFields({ name: 'Jaile Atan Heyət', value: `<@${jailedUsers[targetUser.id].jailedBy}>`, inline: false });
            }
            
            if (jailedUsers[targetUser.id].reason) {
                unjailEmbed.addFields({ name: 'Jail Səbəbi', value: jailedUsers[targetUser.id].reason, inline: false });
            }
            
            if (jailedUsers[targetUser.id].jailedAt) {
                const jailDate = new Date(jailedUsers[targetUser.id].jailedAt);
                unjailEmbed.addFields({ name: 'Jail Tarixi', value: `<t:${Math.floor(jailDate.getTime() / 1000)}:F>`, inline: false });
            }
            
          
            if (jailedUsers[targetUser.id].jailedAt) {
                const jailDate = new Date(jailedUsers[targetUser.id].jailedAt);
                const now = new Date();
                const diffMs = now - jailDate;
                const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                
                unjailEmbed.addFields({ name: 'Jail Vaxtı', value: `${diffDays} gün, ${diffHours} saat, ${diffMinutes} dəqiqə`, inline: false });
            }
            
      
            await sendLog(interaction.guild, unjailEmbed);
          
            delete jailedUsers[targetUser.id];
            saveJailedUsers(jailedUsers);
            
            
            const dmSent = await sendDM(targetUser, `${interaction.guild.name} serverində həbs müddətiniz vaxtından əvvəl dayandırıldı. Yenidən xoş gəlmisiniz!`);
            
            let replyMessage = `${targetUser} həbsdən uğurla çıxdı və əvvəlki vəzifələrinə bərpa edildi.`;
            if (!dmSent) {
                replyMessage += "\n(İstifadəçi DM-ləri deaktiv edildiyi üçün bildiriş göndərilə bilmədi)";
            }
            
      
            return interaction.reply({ content: replyMessage });
            
        } catch (error) {
            console.error("Unjail error:", error);
            return interaction.reply({ content: "İstifadəçini jailbreak edərkən xəta baş verdi. İcazələri yoxlayın.", ephemeral: true });
        }
    }
};