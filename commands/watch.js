const { SlashCommandBuilder } = require("@discordjs/builders");
const memberController = require("../database/controllers/memberController");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("watch")
    .setDescription(
      "Add or remove the names of congress members to be monitored."
    )
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Select action.")
        .setRequired(true)
        .addChoices({ name: "Add", value: "add" })
        .addChoices({ name: "Remove", value: "remove" })
    )
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Enter a congress member's name. (e.g. John Doe)")
        .setAutocomplete(true)
        .setRequired(true)
    ),
  async execute(interaction) {
    const action = interaction.options.getString("action");
    const last = interaction.options.getString("last");
    const first = interaction.options.getString("first");
    const guildId = interaction.guildId;

    await interaction.deferReply();

    const choice = interaction.options.getString("name");

    const member = await memberController.findById(choice);

    if (!member) await interaction.editReply(`Invalid member.`);

    const name = `${member.position.substring(0, 3)}. ${member.first}, ${member.last}`
    if (action === "add") {
      // Check if this server is monitoring this member
      if (member.servers.includes(guildId)) {
        await interaction.editReply(`${name} already in monitor.`);
        return;
      }
      
      // Add server to member's monitor
      member.servers.push(guildId);
      await member.save();
      await interaction.editReply(`Added ${name} to monitor.`);
    }

    if (action === "remove") {
      if (!member.servers.includes(guildId)) {
        await interaction.editReply(`${name} not in monitor.`);
        return;
      }

      const index = member.servers.indexOf(guildId);
      member.servers.splice(index, 1);
      await interaction.editReply(`${name} removed from monitor.`);
    }
  },
};
