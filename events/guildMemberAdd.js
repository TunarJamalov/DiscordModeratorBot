const { PermissionsBitField } = require("discord.js");

module.exports = {
    name: "guildMemberAdd",
    execute(member) {
        if (!member || !member.guild) {
            console.error('Member or guild is undefined in guildMemberAdd event');
            return;
        }
        
        const config = require("../config.json");
        const channel = member.guild.channels.cache.get(config.welcomeChannelID);
        
        if (!channel) {
            console.error("Kanal tapılmadı.");
            return;
        }

        if (!channel.permissionsFor(member.guild.members.me).has(PermissionsBitField.Flags.SendMessages)) {
            console.error("Botun ytsi yoxdu.");
            return;
        }

        channel.send(`${member} 🍵 Sunucumuza xoş gəldin! Siz qısa müddət ərzində qeydiyyatdan keçəcəksiniz. Bu arada <#1356321269649375303> kanalımıza baxa bilərsiniz.`);
    }
};
