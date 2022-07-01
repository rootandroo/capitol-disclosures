const { connectDatabase } = require('../database/dbConnect')

module.exports = {
	name: 'ready',
	once: true,
	async execute(client) {
        await connectDatabase();
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};