const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojiac')
        .setDescription('Serverə emoji əlavə edin')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('Emojinin adı')
                .setRequired(true))
        .addAttachmentOption(option => 
            option.setName('image')
                .setDescription('Emoji kimi istifadə ediləcək şəkil')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('url')
                .setDescription('Emoji şəklinin URL-i (yükləmə üçün alternativ)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('emote')
                .setDescription('Kopyalamaq üçün mövcud Discord emojisini (faktiki emosiyadan istifadə edin)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers),
    
    async execute(interaction) {
      
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
            return interaction.reply({
                content: 'Emosiyalar əlavə etmək üçün mənə "Emojiləri və Etiketləri idarə et" icazəsi lazımdır!',
                ephemeral: true
            });
        }
        
      
        const name = interaction.options.getString('name');
        const attachment = interaction.options.getAttachment('image');
        const url = interaction.options.getString('url');
        const existingEmote = interaction.options.getString('emote');
        
        
        if (!/^[\w_]{2,32}$/.test(name)) {
            return interaction.reply({
                content: 'Emote adları 2 ilə 32 simvol arasında olmalıdır və yalnız hərf-rəqəm simvolları və alt xətt işarələrindən ibarət olmalıdır.',
                ephemeral: true
            });
        }
        
        
        let imageUrl;
        
        if (existingEmote) {
           
            const emojiRegex = /<(a)?:(\w+):(\d+)>/;
            const match = existingEmote.match(emojiRegex);
            
            if (match) {
                const isAnimated = Boolean(match[1]);
                const emojiId = match[3];
                imageUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}`;
            } else {
                return interaction.reply({
                    content: 'Lütfən, etibarlı fərdi emoji təqdim edin. Standart emojiləri bu şəkildə əlavə etmək olmaz.',
                    ephemeral: true
                });
            }
        } else if (attachment) {
            imageUrl = attachment.url;
        } else if (url) {
            imageUrl = url;
        } else {
            return interaction.reply({
                content: 'Emote əlavə etmək üçün ya şəkil əlavəsi, URL, ya da mövcud fərdi emoji təqdim etməlisiniz.',
                ephemeral: true
            });
        }
        
      
        if (!imageUrl.includes('cdn.discordapp.com') && !imageUrl.match(/\.(jpeg|jpg|gif|png|webp)$/)) {
            return interaction.reply({
                content: 'Xahiş edirik, düzgün şəkil URL və ya qoşma (jpeg, jpg, gif, png və ya webp) təqdim edin.',
                ephemeral: true
            });
        }
      
        await interaction.deferReply();
        
        try {
           
            const emoji = await interaction.guild.emojis.create({
                attachment: imageUrl,
                name: name
            });
            
            const successEmbed = new EmbedBuilder()
                .setTitle('Emoji elave olundu!')
                .setDescription(`Emote **${name}** serverə əlavə edildi: ${emoji}`)
                .setColor('#00FF00')
                .setThumbnail(emoji.url)
                .setFooter({ text: `${interaction.user.tag} tərəfindən əlavə olundu.` })
                .setTimestamp();
            
            await interaction.followUp({ embeds: [successEmbed] });
        } catch (error) {
            console.error('Error adding emote:', error);
            
           
            let errorMessage = 'An error occurred while adding the emote.';
            
            if (error.code === 30008) {
                errorMessage = 'Maximum number of emotes reached for this server!';
            } else if (error.message.includes('Invalid Form Body')) {
                errorMessage = 'The image file is too large. Discord emotes must be under 256KB.';
            } else if (error.message.includes('CloudFlare')) {
                errorMessage = 'There was an issue downloading the image. Make sure the URL is accessible.';
            }
            
            await interaction.followUp({
                content: `Failed to add emote: ${errorMessage}`,
                ephemeral: true
            });
        }
    }
};