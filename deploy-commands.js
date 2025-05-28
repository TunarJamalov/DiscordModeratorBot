const { REST, Routes } = require('discord.js');
const { clientId, token, guildId } = require('./config.json');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.log(`[WARNING] ${filePath} dosyasında data funksiyası yoxdur.`);
    }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log(`[INFO] ${commands.length} command yadda saxlanılır...`);

      
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands },
        );

        console.log(`[SUCCESS] ${data.length} slash komanda yükləndi!`);
    } catch (error) {
        console.error(error);
    }
})();