const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const ms = require('ms'); 


const allowedRoleIds = ['1377245234517512292', '1354944399049752687','1354944427562631359']; 

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cekilis')
        .setDescription('Çəkiliş Başlat')
        .addStringOption(option => 
            option.setName('prize')
                .setDescription('Hansı mükafatı verirsiniz?')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('duration')
                .setDescription('Hədiyyə nə qədər davam etməlidir? (məsələn, 1 gün, 12 saat, 30 dəq)')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('winners')
                .setDescription('Neçə qalib seçilməlidir?')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(10))
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Hədiyyə hansı kanalda yayımlanmalıdır?')
                .setRequired(false)),
    
    async execute(interaction) {

    
        const hasPermission = interaction.member.roles.cache.some(role => allowedRoleIds.includes(role.id));

        if (!hasPermission) {
            return interaction.reply({ 
                content: '❌ Yetkin yoxdur.',
                ephemeral: true 
            });
        }

        const prize = interaction.options.getString('prize');
        const duration = interaction.options.getString('duration');
        const winnerCount = interaction.options.getInteger('winners');
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        
    
        let durationMs;
        try {
            durationMs = ms(duration);
            if (!durationMs) throw new Error('Invalid duration');
        } catch (error) {
            return interaction.reply({ content: 'Please provide a valid duration (e.g. 1d, 12h, 30m)', ephemeral: true });
        }
        
       
        const endTime = Date.now() + durationMs;
        const endTimeFormat = new Date(endTime).toLocaleString();
        
       
        const giveawayEmbed = new EmbedBuilder()
            .setTitle('🎉 ÇƏKİLİŞ 🎉')
            .setDescription(`**Hədiyyə:** ${prize}\n\n**Qaliblər:** ${winnerCount}\n**Bitiş Tarixi:** <t:${Math.floor(endTime / 1000)}:R>\n\nDaxil olmaq üçün aşağıdakı düyməni basın!`)
            .setColor('#FF5252')
            .setFooter({ text: `Hosted by ${interaction.user.tag}` })
            .setTimestamp(endTime);
        
    
        const enterButton = new ButtonBuilder()
            .setCustomId('giveaway-enter')
            .setLabel('Giveaway daxil olun')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎉');
        
        const actionRow = new ActionRowBuilder().addComponents(enterButton);
        
       
        await interaction.reply({ content: `Giveaway created in ${channel}!`, ephemeral: true });
        const giveawayMessage = await channel.send({ embeds: [giveawayEmbed], components: [actionRow] });
        
       
        const participants = new Set();
        
        
        const collector = giveawayMessage.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: durationMs
        });
        
      
        collector.on('collect', async i => {
            if (i.customId === 'giveaway-enter') {
                if (participants.has(i.user.id)) {
                    await i.reply({ content: 'Siz artıq bu çəkilişdə iştirak etmisiniz!', ephemeral: true });
                } else {
                    participants.add(i.user.id);
                    await i.reply({ content: 'Siz çəkilişə qoşuldunuz.', ephemeral: true });
                }
            }
        });
        
       
        collector.on('end', async () => {
            const participantsArray = Array.from(participants);
            
           
            const endedEmbed = EmbedBuilder.from(giveawayEmbed)
                .setTitle('🎉 ÇƏKİLİŞ BİTTİ 🎉')
                .setColor('#808080');
            
           
            if (participantsArray.length === 0) {
                endedEmbed.setDescription(`**Hədiyyə:** ${prize}\n\n**Qaliblər:** Heç kim qalib olmadı\n**Bitiş Tarixi:** <t:${Math.floor(endTime / 1000)}:R>`);
                await giveawayMessage.edit({ embeds: [endedEmbed], components: [] });
                return;
            }
        
            const winnerIds = [];
            for (let i = 0; i < Math.min(winnerCount, participantsArray.length); i++) {
                const winnerId = participantsArray.splice(Math.floor(Math.random() * participantsArray.length), 1)[0];
                winnerIds.push(winnerId);
            }
            
          
            const winnerMentions = await Promise.all(winnerIds.map(async id => {
                try {
                    const user = await interaction.client.users.fetch(id);
                    return `<@${user.id}>`;
                } catch {
                    return 'Unknown User';
                }
            }));
            
           
            endedEmbed.setDescription(`**Hədiyyə:** ${prize}\n\n**Qaliblər:** ${winnerMentions.join(', ')}\n**Bitiş Tarixi:** <t:${Math.floor(endTime / 1000)}:R>`);
            
         
            await giveawayMessage.edit({ embeds: [endedEmbed], components: [] });
            
           
            if (winnerIds.length > 0) {
                await channel.send({
                    content: `Təbriklər ${winnerMentions.join(', ')}! Siz **${prize}** qazandınız!`,
                    allowedMentions: { users: winnerIds }
                });
            } else {
                await channel.send(`Heçkim **${prize}** qazanmadı!`);
            }
        });
        
      
        setTimeout(async () => {
            if (!collector.ended) collector.stop();
        }, durationMs);
    }
};
