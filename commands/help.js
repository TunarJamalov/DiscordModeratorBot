const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows information about commands and features')
        .addStringOption(option => 
            option.setName('command')
                .setDescription('Get information about a specific command')
                .setRequired(false)),
    
    async execute(interaction) {
        const client = interaction.client;
        const specificCommand = interaction.options.getString('command');
        
        // If a specific command was requested
        if (specificCommand) {
            return await showSpecificCommandHelp(interaction, specificCommand);
        }
        
        // Create categories for organization
        const categories = {
            'Moderation': ['ban', 'kick', 'mute', 'purge', 'setnick', 'addemote'],
            'Utility': ['info', 'help', 'ping', 'avatar'],
            'Fun': ['giveaway'],
            'Settings': ['setup'],
        };
        
        // Create main help embed
        const helpEmbed = new EmbedBuilder()
            .setTitle('📚 Bot Help Menu')
            .setDescription('Select a category from the dropdown menu below to view available commands, or use `/help <command>` to get detailed information about a specific command.')
            .setColor('#5865F2')
            .addFields(
                { name: '🛠️ Moderation', value: 'Commands for server management and moderation.', inline: true },
                { name: '🔧 Utility', value: 'Useful tools and information commands.', inline: true },
                { name: '🎮 Fun', value: 'Entertainment and fun commands for everyone.', inline: true },
                { name: '⚙️ Settings', value: 'Configure the bot for your server.', inline: true }
            )
            .setFooter({ text: `${client.user.username} • Use /help <command> for more info`, iconURL: client.user.displayAvatarURL() })
            .setTimestamp();
        
        // Create dropdown menu for categories
        const categorySelect = new StringSelectMenuBuilder()
            .setCustomId('help-category-select')
            .setPlaceholder('Select a category...')
            .addOptions([
                { label: 'Moderation', description: 'Commands for server management', value: 'Moderation', emoji: '🛠️' },
                { label: 'Utility', description: 'Useful tools and information commands', value: 'Utility', emoji: '🔧' },
                { label: 'Fun', description: 'Entertainment and fun commands', value: 'Fun', emoji: '🎮' },
                { label: 'Settings', description: 'Configure bot settings', value: 'Settings', emoji: '⚙️' }
            ]);
        
        // Create action row with dropdown
        const actionRow = new ActionRowBuilder()
            .addComponents(categorySelect);
        
        // Create support button
        const buttonRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Support Server')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://discord.gg/yourserver'), // Replace with your actual support server
                new ButtonBuilder()
                    .setLabel('Invite Bot')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`)
            );
        
        // Send the initial help message
        const response = await interaction.reply({
            embeds: [helpEmbed],
            components: [actionRow, buttonRow],
            fetchReply: true
        });
        
        // Set up collector for dropdown menu
        const collector = response.createMessageComponentCollector({
            time: 120000 // 2 minutes
        });
        
        collector.on('collect', async i => {
            // Verify the interaction is from the original user
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'This menu is not for you!', ephemeral: true });
            }
            
            if (i.customId === 'help-category-select') {
                const categoryName = i.values[0];
                const categoryCommands = categories[categoryName] || [];
                
                const categoryEmbed = new EmbedBuilder()
                    .setTitle(`${getCategoryEmoji(categoryName)} ${categoryName} Commands`)
                    .setColor('#5865F2')
                    .setDescription(categoryCommands.length > 0 
                        ? 'Here are the commands in this category:'
                        : 'No commands found in this category.')
                    .setFooter({ text: `${client.user.username} • Use /help <command> for more info`, iconURL: client.user.displayAvatarURL() })
                    .setTimestamp();
                
                // Add each command to the embed
                for (const cmd of categoryCommands) {
                    categoryEmbed.addFields({
                        name: `/${cmd}`,
                        value: getCommandDescription(cmd),
                        inline: true
                    });
                }
                
                await i.update({ embeds: [categoryEmbed], components: [actionRow, buttonRow] });
            }
        });
        
        // When the collector expires, remove the components
        collector.on('end', () => {
            interaction.editReply({ components: [buttonRow] }).catch(error => console.error('Failed to update help message:', error));
        });
    }
};

// Show help for a specific command
async function showSpecificCommandHelp(interaction, commandName) {
    // Normalize command name (remove slash if present, lowercase)
    commandName = commandName.toLowerCase().replace(/^\//, '');
    
    // Check if command exists in your command collection
    const command = interaction.client.commands.get(commandName);
    
    if (!command) {
        return interaction.reply({
            content: `❌ Command \`/${commandName}\` not found. Use \`/help\` to see all available commands.`,
            ephemeral: true
        });
    }
    
    // Create embed for command details
    const commandEmbed = new EmbedBuilder()
        .setTitle(`Command Help: /${commandName}`)
        .setColor('#5865F2')
        .setDescription(getCommandDescription(commandName))
        .addFields(
            { name: 'Usage', value: getCommandUsage(commandName) },
            { name: 'Examples', value: getCommandExamples(commandName) },
            { name: 'Required Permissions', value: getCommandPermissions(commandName) }
        )
        .setFooter({ text: interaction.client.user.username, iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();
    
    // Create button to go back to main help menu
    const actionRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('help-back')
                .setLabel('Back to Help Menu')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔙')
        );
    
    const response = await interaction.reply({
        embeds: [commandEmbed],
        components: [actionRow],
        fetchReply: true
    });
    
    // Set up collector for back button
    const collector = response.createMessageComponentCollector({
        time: 60000 // 1 minute
    });
    
    collector.on('collect', async i => {
        // Verify the interaction is from the original user
        if (i.user.id !== interaction.user.id) {
            return i.reply({ content: 'This menu is not for you!', ephemeral: true });
        }
        
        if (i.customId === 'help-back') {
            // Execute the command again with no specific command to show main help
            await i.update({ content: 'Loading help menu...', embeds: [], components: [] });
            await module.exports.execute(interaction);
        }
    });
}

// Helper functions for command information
function getCommandDescription(command) {
    const descriptions = {
        'ban': 'Ban a user from the server with an optional reason.',
        'kick': 'Kick a user from the server with an optional reason.',
        'mute': 'Temporarily mute a user, preventing them from sending messages.',
        'purge': 'Delete multiple messages at once from a channel.',
        'setnick': 'Change a user\'s nickname in the server.',
        'addemote': 'Add a new emoji to the server from various sources.',
        'info': 'Get detailed information about the bot, server, or users.',
        'help': 'Shows information about commands and features.',
        'ping': 'Check the bot\'s latency and API response time.',
        'avatar': 'View a user\'s avatar in full size.',
        'giveaway': 'Start a giveaway for members to enter and win prizes.',
        'setup': 'Configure bot settings for your server.'
    };
    
    return descriptions[command] || 'No description available.';
}

function getCommandUsage(command) {
    const usages = {
        'ban': '`/ban <user> [reason] [delete_messages]`',
        'kick': '`/kick <user> [reason]`',
        'mute': '`/mute <user> <duration> [reason]`',
        'purge': '`/purge <amount> [user] [contains] [pinned]`',
        'setnick': '`/setnick <user> [nickname]`',
        'addemote': '`/addemote <name> [image] [url] [emote]`',
        'info': '`/info bot` or `/info server` or `/info user [target]`',
        'help': '`/help [command]`',
        'ping': '`/ping`',
        'avatar': '`/avatar [user]`',
        'giveaway': '`/giveaway <prize> <duration> <winners> [channel]`',
        'setup': '`/setup`'
    };
    
    return usages[command] || '`/' + command + '`';
}

function getCommandExamples(command) {
    const examples = {
        'ban': '`/ban @user Spamming 7` - Ban user for spamming and delete 7 days of messages',
        'kick': '`/kick @user Breaking rules` - Kick the user with reason',
        'mute': '`/mute @user 1h Spam` - Mute user for 1 hour for spamming',
        'purge': '`/purge 10` - Delete the last 10 messages\n`/purge 50 @user` - Delete 50 messages from user',
        'setnick': '`/setnick @user Cool Nickname` - Change nickname\n`/setnick @user` - Reset nickname',
        'addemote': '`/addemote happy 😄` - Add emoji\n`/addemote cool [upload]` - Upload emoji',
        'info': '`/info bot` - Bot information\n`/info user @someone` - User information',
        'help': '`/help` - Show all commands\n`/help ban` - Show help for ban command',
        'ping': '`/ping` - Check bot latency',
        'avatar': '`/avatar` - Show your avatar\n`/avatar @user` - Show someone else\'s avatar',
        'giveaway': '`/giveaway "Nitro" 24h 1 #giveaways` - Start a Nitro giveaway',
        'setup': '`/setup` - Start the interactive setup process'
    };
    
    return examples[command] || 'No examples available.';
}

function getCommandPermissions(command) {
    const permissions = {
        'ban': 'Ban Members',
        'kick': 'Kick Members',
        'mute': 'Moderate Members',
        'purge': 'Manage Messages',
        'setnick': 'Manage Nicknames',
        'addemote': 'Manage Emojis and Stickers',
        'info': 'None',
        'help': 'None',
        'ping': 'None',
        'avatar': 'None',
        'giveaway': 'Manage Guild',
        'setup': 'Administrator'
    };
    
    return permissions[command] || 'None';
}

function getCategoryEmoji(category) {
    const emojis = {
        'Moderation': '🛠️',
        'Utility': '🔧',
        'Fun': '🎮',
        'Settings': '⚙️'
    };
    
    return emojis[category] || '📝';
}