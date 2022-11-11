const { SlashCommandBuilder } = require("@discordjs/builders");
const queryController = require("../database/controllers/queryController");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-auction-query")
    .setDescription("Query to search for ebay auctions that are ending soon.")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("Enter search query for a product.")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("price")
        .setDescription("Filter out auctions that exceed this price.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("action")
        .setRequired(true)
        .addChoices({ name: "Add", value: "add" })
        .setDescription("Select action.")
        .addChoices({ name: "Remove", value: "remove" })
    ),
  async execute(interaction) {
    if (interaction.user.id != "189469745215438849") return;

    const action = interaction.options.getString("action");
    const queryString = interaction.options.getString("query");
    const price = interaction.options.getInteger("price");

    if (action === "add") {
      const query = await queryController.saveQuery(queryString, price);
      await interaction.reply(`Added query [${query.query}] to database.`);
    } else if (action === "remove") {
      queryController.deleteQueryIfExists(queryString);
      await interaction.reply(`Query [${queryString}] removed from monitor.`);
    }

    let queries = await queryController.getQueries();
    if (!queries) return
    queryEmbeds = []
    for (query of queries) {
        const queryEmbed = new EmbedBuilder()
              .setColor('#85bb65')
              .addFields(
                  { name: 'Query', value: String(query.query) },
                  { name: 'Price', value: String(query.price) })
        queryEmbeds.push(queryEmbed)
    }
    await interaction.followUp({ embeds: queryEmbeds });;
  },
};
