const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const MemberModel = require('../database/models/MemberModel')
const ReportModel = require('../database/models/ReportModel')
const house = require('../house-reports');
const senate = require('../senate-reports');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('toggle')
		.setDescription('Toggle monitor to check for reports.'),
	async execute(interaction) {        
        const interval = 60 * 1000
        
        const monitor = setInterval(async () => {
            const timestamp = new Date(Date.now());
            const day = timestamp.getDay();
            const month = timestamp.getMonth();
            const year = timestamp.getFullYear();
            
            // Fetch Congress Members 
            if (month % 4 == 0 && month == day) {
                const members = await house.fetchCongressMembers(year);
                for (item of members) {
                    let member = await MemberModel.findOne({ last: item.last, first: item.first });
                    if (!member) {
                        member = await MemberModel.create({
                            chamber: item.Served,
                            last: item.last,
                            first: item.first,
                            state: item.State,
                            district: item.District,
                            party: item.Party
                        })
                        await member.save()
                    }
                }
            }

            // Fetch House Reports
            const houseDisclosures = await house.fetchDisclosures(year);
            const houseReports = house.parseDisclosures(houseDisclosures, year);
            for (item of houseReports) {
                let report = await ReportModel.findOne({ url: item.URL });
                if (!report) {
                    report = await ReportModel.create({
                        
                    })
                }
            }

            // Fetch Senate Reports 
            const session = senate.createSession();
            const senateDisclosures = await senate.fetchDisclosures(session, year);
            const senateReports = await senate.parseDisclosures(session, senateDisclosures);
        }, interval)
        const guildId = interaction.guildId;
	},
};