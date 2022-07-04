const { SlashCommandBuilder } = require("@discordjs/builders");
const memberController = require("../database/controllers/memberController");
const reportController = require("../database/controllers/reportController");
const { isValidObjectId } = require("mongoose");
const { createReportEmbeds, sendReportEmbeds } = require("../modules/utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pull")
    .setDescription("Pull reports from database on demand.")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Enter a congress member's name. (e.g. John Doe)")
        .setAutocomplete(true)
        .setRequired(true)
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const channel = `${interaction.channelId}`;

    const choice = interaction.options.getString("name");
    if (!isValidObjectId(choice)) return;

    const member = await memberController.findById(choice);
    if (!member) {
      await interaction.editReply(`Invalid member.`);
      return;
    }

    const prefix = `${member.position.substring(0, 3)}.`
    const name = `${prefix} ${member.last}, ${member.first}`

    const reports = await reportController.findByMemberID(member._id);

    // Send reports pulled on command
    await interaction.editReply(`Pulling reports for ${name}.`);
    reports.forEach(async (report) => {
      const reportEmbeds = await createReportEmbeds({ report, name });
      await sendReportEmbeds({embeds: reportEmbeds, interaction });
    });
  },
};
