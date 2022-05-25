const { SlashCommandBuilder } = require('@discordjs/builders');
const ReprModel = require('../database/models/ReprModel');
let monitor;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('watch')
		.setDescription('Monitors disclosures for new reports.'),
	async execute(interaction) {
        const members = await ReprModel.find({})
        
        if (!monitor) {
            const interval = 60 * 1000
            monitor = setInterval(async () => {

                console.log('TEST');

            }, interval)
            await interaction.reply(`Checking for new disclosure reports every ${interval / (1000 * 60)} minutes.`);
        } else {
            clearInterval(monitor);
            monitor = null;
            await interaction.reply('Stopped monitoring for new disclosure reports.')
        }
	},
};