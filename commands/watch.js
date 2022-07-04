const { SlashCommandBuilder } = require("@discordjs/builders");
const memberController = require("../database/controllers/memberController");
const { isValidObjectId } = require('mongoose');

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
    const channel = `${interaction.channelId}`;

    await interaction.deferReply();

    const choice = interaction.options.getString("name");
    if (!isValidObjectId(choice)) return;

    const member = await memberController.findById(choice);

    if (!member) {
      await interaction.editReply(`Invalid member.`);
      return;
    }

    const prefix = `${member.position.substring(0, 3)}.`
    const name = `${prefix} ${member.last}, ${member.first}`
    
    if (action === "add") {
      // Check if this server is monitoring this member
      if (member.servers.includes(channel)) {
        await interaction.editReply(`${name} already in monitor.`);
        return;
      }

      // Add server to member's monitor
      member.servers.push(channel);
      await member.save();
      await interaction.editReply(`Added ${name} to monitor.`);
    }

    if (action === "remove") {
      if (!member.servers.includes(channel)) {
        await interaction.editReply(`${name} not in monitor.`);
        return;
      }

      const index = member.servers.indexOf(channel);
      member.servers.splice(index, 1);
      await interaction.editReply(`${name} removed from monitor.`);
    }
  },
};
