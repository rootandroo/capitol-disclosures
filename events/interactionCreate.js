const memberController = require("../database/controllers/memberController");

module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (interaction.isCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        });
      }
    }

    if (interaction.isAutocomplete()) {
      if (!interaction.commandName === "watch") return;
      const guildId = interaction.guildId;
      if (!guildId) return;

      const name = interaction.options.getFocused();
      if (!/[a-zA-z]\s[a-zA-Z]/.test(name)) return;

      const results = await memberController.searchByName(name);
      await interaction.respond(
        results.map((choice) => ({
          name: `${choice.position.substring(0, 3)}. ${choice.first}, ${choice.last}`,
          value: choice._id,
        }))
      );
    }
  },
};
