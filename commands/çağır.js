const { SlashCommandBuilder } = require('discord.js');
const { unregisteredRole, modRole } = require('../config.json');

const cooldowns = new Map();
const FIVE_MINUTES = 5 * 60 * 1000; // 5 minutes in milliseconds
const MAX_USES = 2; // Maximum allowed uses before ban

module.exports = {
    data: new SlashCommandBuilder()
        .setName('çağır')
        .setDescription('Qeydiyyatdan keçməmiş üzvlər bundan istifadə edə bilər.'),

    async execute(interaction) {
        const member = interaction.member;
        const guild = interaction.guild;

        if (!member.roles.cache.has(unregisteredRole)) {
            return interaction.reply({ content: "Yalnız qeydiyyatdan keçməmiş üzvlər bu əmrdən istifadə edə bilər.", ephemeral: true });
        }

        const userId = member.id;
        const now = Date.now();
        const cooldown = cooldowns.get(userId) || { count: 0, time: now };

        if (now - cooldown.time < FIVE_MINUTES) { 
            cooldown.count++;
            if (cooldown.count > MAX_USES) {
                await guild.members.ban(userId, { reason: "Spam çağırma komutu (5 dəqiqə ərzində 2+ istifadə)" });
                cooldowns.delete(userId);
                return;
            }
        } else {
            cooldown.count = 1;
            cooldown.time = now;
        }

        cooldowns.set(userId, cooldown);

        const modRoleMention = guild.roles.cache.get(modRole);
        if (!modRoleMention) {
            return interaction.reply({ content: "Yetkili rolu tapılmadı!", ephemeral: true });
        }

        interaction.reply({ content: `${modRoleMention} Salam! Yeni üzvümüz qeydiyyatdan keçməyi gözləyir!`, allowedMentions: { roles: [modRole] } });
    }
};