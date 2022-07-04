const { SlashCommandBuilder } = require("@discordjs/builders");
const memberController = require("../database/controllers/memberController");
const { isValidObjectId } = require('mongoose')
module.exports = {
  data: new SlashCommandBuilder()
    .setName("alias")
    .setDescription("Set aliases for congress members. (ADMIN ONLY)")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Enter a congress member's name. (e.g. John Doe)")
        .setAutocomplete(true)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("alias")
        .setDescription("Enter an alias.")
        .setRequired(true)
    ),
  async execute(interaction) {
    if (interaction.user.id != "189469745215438849") return;
    await interaction.deferReply();

    const choice = interaction.options.getString("name");
    if (!isValidObjectId(choice)) return;
    const alias = interaction.options.getString("alias");
    const member = await memberController.findById(choice);

    if (!member) await interaction.editReply(`Invalid member.`);

    const prefix = `${member.position.substring(0, 3)}.`
    const name = `${prefix} ${member.last}, ${member.first}`


    member.alias = alias;
    await member.save();
    await interaction.editReply(`Set alias [${alias}] for ${name}`);
  },
};
