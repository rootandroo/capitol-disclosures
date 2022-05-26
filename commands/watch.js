const { SlashCommandBuilder } = require('@discordjs/builders');
const { fetchDisclosures, parseDisclosures, fetchDocuments } = require('../house-reports')
const ReprModel = require('../database/models/ReprModel');
const DiscModel = require('../database/models/DiscModel');
const { MessageEmbed } = require('discord.js');

let monitor;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('watch')
		.setDescription('Monitors disclosures for new reports.')
        .addStringOption(option => 
            option.setName('metric')
            .setDescription('Choose metric of time for interval.')
            .setRequired(true)
            .addChoices({ name: 'Seconds', value: 'seconds' })
            .addChoices({ name: 'Minutes', value: 'minutes' })
            .addChoices({ name: 'Hours', value: 'hours' }))
        .addIntegerOption(option => 
            option.setName('interval')
            .setDescription('Enter how often to check for new disclosures in selected metric of time.')
            .setRequired(true)),
	async execute(interaction) {        
        if (!monitor) {
            const metric = interaction.options.getString('metric')
            const unit = interaction.options.getInteger('interval')
            const interval = (metric == "hours") ? unit * 60 * 60 * 1000 
                : (metric == "minutes") ? unit * 60 * 1000 
                : unit * 1000

            monitor = setInterval(async () => {
                const timestamp = new Date(Date.now());
                const year = timestamp.getFullYear();

                console.log(`Fetching new financial disclosures for the year [${year}].`);
                const disclosures = await fetchDisclosures(year);
                const members = await ReprModel.find();
                const parsedDisclosures = await parseDisclosures(disclosures, members);

                const uniqueDisclosures = []
                for (disc of parsedDisclosures) {
                    let doc = await DiscModel.findOne({docID: disc.DocID})
                    if (!doc) {
                        disclosureDoc = await DiscModel.create({
                            docID: disc.DocID,
                            last: disc.Last,
                            first: disc.First });
                        await disclosureDoc.save();
                        uniqueDisclosures.push(disc);
                    }
                };
                console.log(`Found ${uniqueDisclosures.length} new disclosures.`);
                const documents = await fetchDocuments(uniqueDisclosures, year);

                for (doc of documents) {
                    const reportEmbed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setTitle('Financial Disclosure Report')
                        .setURL(doc.report)
                        .addField('Representative', `${doc.first} ${doc.last}`, true)
                        .addField('Date', doc.date)
                        .addField('State', doc.state)
                    interaction.channel.send({ embeds: [reportEmbed] });
                }
            }, interval)
            await interaction.reply(`Checking for new disclosure reports every ${unit} ${metric}.`);
        } else {
            clearInterval(monitor);
            monitor = null;
            await interaction.reply('Stopped monitoring for new disclosure reports.')
        }
	},
};