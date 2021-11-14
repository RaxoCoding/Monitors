const Discord = require("discord.js");
const booster = require("./booster.js");
let Booster = booster.Booster;
require('dotenv').config();

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', async() => {
    console.log(`Logged in as ${client.user.username}!`);
});

var currentlyRunning = false;

client.on('messageCreate', async msg => {

    if (msg.author.bot) return;
    if (!(msg.member.roles.cache.some(role => role.id === '735191907180740750'))) return;

    if (msg.content.toLowerCase().substring(0, 2) == `!vintedgoat`) { // Replace YOUR_PREFIX with something like a!
        if (!currentlyRunning) {
            var msgInfo = msg.content.substring(11).split(' ');
            var vintedLink = msgInfo[0];
            let booster = new Booster(msgInfo[0]);

            currentlyRunning = true;
            await booster.startBooster();
            currentlyRunning = false;
        } else {
            msg.channel.send('Already running a booster.');
        }
    }
});

client.login(process.env.DISCORD_TOKEN);


module.exports.sendMessage = async function(embed, channelId) {
    client.channels.cache.get(channelId).send({ embeds: [embed] });
}