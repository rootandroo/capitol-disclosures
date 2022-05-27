const { SlashCommandBuilder } = require('@discordjs/builders');
const ReprModel = require('../database/models/ReprModel');

// rename command to edit-members
module.exports = {
	data: new SlashCommandBuilder()
		.setName('toggle')
		.setDescription('Add or remove the names of Rep. to be monitored.')
        .addStringOption(option => 
            option.setName('action')
            .setDescription('Select action.')
            .setRequired(true)
            .addChoices({ name: 'Add', value: 'add' })
            .addChoices({ name: 'Remove', value: 'remove' }))
        .addStringOption(option => 
            option.setName('last')
            .setDescription("Enter the Rep.'s last name. (e.g. Doe)")
            .setRequired(true))
        .addStringOption(option => 
            option.setName('first')
            .setDescription("Enter the Rep.'s first name. (e.g. John) ")
            .setRequired(true)),
	async execute(interaction) {
        const action = interaction.options.getString('action');
        const last = interaction.options.getString('last');
        const first = interaction.options.getString('first');
        const guildId = interaction.guildId

        if (!guildID) return;
        
        await interaction.deferReply();
        
        
        let member = await ReprModel.findOne({
            last: last,
            first: first,
            guildID: guildId
        })

        if (action === 'add') {
            if (!member) {
                member = await ReprModel.create({
                    last: last,
                    first: first,
                    guildID: guildId
                });
                await member.save();
                await interaction.editReply(`Added ${first} ${last} to monitor.`);
                return;
            }
            await interaction.editReply(`${first} ${last} already in monitor.`);
        }
        
        if (action === "remove") {
          if (!member) {
              await interaction.editReply(`${first} ${last} not in monitor.`);
              return;
          }
          await ReprModel.deleteOne({ _id: member._id });
          await interaction.editReply(`${first} ${last} removed from monitor.`);
        }
	},
};