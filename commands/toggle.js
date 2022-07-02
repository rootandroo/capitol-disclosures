const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('toggle')
		.setDescription('Toggle monitor to check for reports.'),
	async execute(interaction) {        
        const guildId = interaction.guildId;
	},
};