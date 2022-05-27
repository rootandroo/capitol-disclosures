const { SlashCommandBuilder } = require('@discordjs/builders');
const { fetchDisclosures, parseDisclosures, fetchDocuments } = require('../house-reports')
const ReprModel = require('../database/models/ReprModel');
const DiscModel = require('../database/models/DiscModel');
const { MessageEmbed } = require('discord.js');

let monitor = {};

// TODO
// Seperate out uniqueDocID + serverID into seprate collection
// Disclosures will only store disclosures in the schema of the embed

// rename comment to toggle-monitor

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
        const guildId = interaction.guildId
        if (!monitor[guildId]) {
            const metric = interaction.options.getString('metric')
            const unit = interaction.options.getInteger('interval')
            const interval = (metric == "hours") ? unit * 60 * 60 * 1000 
                : (metric == "minutes") ? unit * 60 * 1000 
                : unit * 1000

            monitor[guildId] = setInterval(async () => {
                const timestamp = new Date(Date.now());
                const year = timestamp.getFullYear();

                console.log(`Fetching new financial disclosures for the year [${year}] for server [${guildId}]`);
                const disclosures = await fetchDisclosures(year);
                const members = await ReprModel.find({ guildID: guildId });
                const parsedDisclosures = await parseDisclosures(disclosures, members);

                const uniqueDisclosures = []
                for (disc of parsedDisclosures) {
                    let doc = await DiscModel.findOne({ docID: disc.DocID, guildID: guildId})
                    // doc embed has not been sent for this guild
                    if (!doc) {
                        disclosureDoc = await DiscModel.create({
                            docID: disc.DocID,
                            last: disc.Last,
                            first: disc.First,
                            guildID: guildId });
                        await disclosureDoc.save();
                        uniqueDisclosures.push(disc);
                    }
                };
                console.log(`Found ${uniqueDisclosures.length} new disclosures for server [${guildId}].`);
                const documents = await fetchDocuments(uniqueDisclosures, year);

                for (doc of documents) {
                    const reportEmbed = new MessageEmbed()
                        .setColor('#85bb65')
                        .setTitle('Financial Disclosure Report')
                        .setURL(doc.report)
                        .addField('Representative', `${doc.first} ${doc.last}`, true)
                        .addField('Date', doc.date)
                        .addField('State District', doc.state)
                        .addField('Filing Type', doc.type)
                    interaction.channel.send({ embeds: [reportEmbed] });
                }
            }, interval)
            await interaction.reply(`Checking for new disclosure reports every ${unit} ${metric}.`);
        } else {
            clearInterval(monitor[guildId]);
            monitor[guildId] = null;
            await interaction.reply('Stopped monitoring for new disclosure reports.')
        }
	},
};