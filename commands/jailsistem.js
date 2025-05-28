const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

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

function saveConfig(config) {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('jailsetup')
        .setDescription('Həbsxana sistemini təyin edir.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('logkanal')
                .setDescription('Həbsxana log kanalını təyin edir.')
                .addChannelOption(option =>
                    option.setName('kanal')
                        .setDescription('Log kanalı')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('jailrol')
                .setDescription('Həbsxana rolunu təyin edir.')
                .addRoleOption(option =>
                    option.setName('rol')
                        .setDescription('Jail rolu')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('goruntule')
                .setDescription('Cari parametrləri göstərir.'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const config = loadConfig();
        
        switch (subcommand) {
            case 'logkanal': {
                const channel = interaction.options.getChannel('kanal');
                
                if (!channel.isTextBased()) {
                    return interaction.reply({ content: "Zəhmət olmasa mətn kanalı seçin.", ephemeral: true });
                }
                
                config.logChannelId = channel.id;
                saveConfig(config);
                
                return interaction.reply({ content: `Log kanalı ${channel} olaraq ayarlanıb.` });
            }
            
            case 'jailrol': {
                const role = interaction.options.getRole('rol');
                
                config.jailRoleId = role.id;
                saveConfig(config);
                
                return interaction.reply({ content: `Həbsxana rolu ${role} olaraq təyin edilib.` });
            }
            
            case 'goruntule': {
                const logChannel = config.logChannelId ? `<#${config.logChannelId}>` : "Qurulmayıb";
                const jailRole = config.jailRoleId ? `<@&${config.jailRoleId}>` : "Qurulmayıb";
                
                return interaction.reply({ content: `**Jail Sistemi Ayarları**\n\n📝 Log Kanalı: ${logChannel}\n⛓️ Jail Rolu: ${jailRole}`, ephemeral: true });
            }
        }
    }
};