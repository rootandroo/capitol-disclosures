const { SlashCommandBuilder } = require('@discordjs/builders');
const { Scraper } = require('../modules/ebay')
const { MessageEmbed } = require('discord.js');

let monitor = {};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('watchEbayAuctions')
		.setDescription('Toggle monitor to check for ebay auctions that are ending soon.')
        .addStringOption(option => 
            option.setName('metric')
            .setDescription('Choose metric of time for interval.')
            .setRequired(true)
            .addChoices({ name: 'Seconds', value: 'seconds' })
            .addChoices({ name: 'Minutes', value: 'minutes' })
            .addChoices({ name: 'Hours', value: 'hours' }))
        .addIntegerOption(option => 
            option.setName('interval')
            .setDescription('Enter how often to check for auctions in selected metric of time.')
            .setRequired(true))
        .addStringOption(option =>
            option.setName('query')
            .setDescription('Enter search query for a product.')
            .setRequired(true))
        .addIntegerOption(option => 
            option.setName('price'))
            .setDescription('Filter out auctions that exceed this price.')
            .setRequired(true),
	async execute(interaction) {        
        if (interaction.user.id != "189469745215438849") return;
        
        const guildId = interaction.guildId
        
        if (!guildId) return;

        if (!monitor[guildId]) {
            const metric = interaction.options.getString('metric')
            const unit = interaction.options.getInteger('interval')
            const query = interaction.options.getString('query')
            const price = interaction.options.getInteger('price')
            const interval = (metric == "hours") ? unit * 60 * 60 * 1000 
                : (metric == "minutes") ? unit * 60 * 1000 
                : unit * 1000


            monitor[guildId] = setInterval(async () => {
                const scraper = new Scraper(query, price)
                scraper.fetchListings()

                if (!scraper.results) return 

                for (result of scraper.results) {
                    const auctionEmbed = new MessageEmbed()
                        .setTitle(result.title)
                        .setColor('#85bb65')
                        .setUrl(result.link)
                        .addField(result.timeLeft)
                        .addField(result.price)
                    interaction.channel.send({ embeds: [auctionEmbed] });
                }

                console.log(`Looking for auctions for server [${guildId}]`);
            }, interval)

            await interaction.reply(`Checking for auctions every ${unit} ${metric}.`);
        } else {
            clearInterval(monitor[guildId]);
            monitor[guildId] = null;
            await interaction.reply('Stopped monitoring for auctions reports.')
        }
	},
};