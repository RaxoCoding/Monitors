const Discord = require("discord.js");
const monitors = require("./monitor.js");
let Monitor = monitors.Monitor;

const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] });

client.on('ready', async() => {
    console.log(`Logged in as ${client.user.username}!`);
});

var monitorStore = [];

client.on('messageCreate', async msg => {

    if (msg.author.bot) return;
    if (!(msg.member.roles.cache.some(role => role.id === '888813386492686357'))) return;

    if (msg.content.toLowerCase().substring(0, 2) == `m!`) { // Replace YOUR_PREFIX with something like a!
        var msgInfo = msg.content.substring(2).split(' ');
        switch (msgInfo[0]) {
            case `hello`: // Add your commands here
                msg.channel.send('Hello!');
                break;
            case 'start':
                if (msgInfo[1] !== undefined) {
                    if (msgInfo[2] !== undefined) {
                        if (msgInfo[3] !== undefined) {
                            if (msgInfo[4] !== undefined) {
                                var monitorObject = monitorStore.filter(obj => {
                                    return obj.channelId === msgInfo[4];
                                });

                                if (monitorObject.length === 0) {
                                    msg.channel.send('Starting Monitor');
                                    let monitor = new Monitor(msgInfo[1], msgInfo[2], msgInfo[3], msgInfo[4]);
                                    monitor.startMonitor();
                                    monitorStore.push({ channelId: msgInfo[4], monitor: monitor });
                                } else {
                                    msg.channel.send('Channel already has a monitor active');
                                }
                                break;
                            } else {
                                msg.channel.send('Missing channel Id');
                                break;
                            }
                        } else {
                            msg.channel.send('Missing max ETH price');
                            break;
                        }
                    } else {
                        msg.channel.send('Missing min ETH price');
                        break;
                    }
                } else {
                    msg.channel.send('Missing collection link');
                    break;
                }
            case 'stop':
                if (msgInfo[1] !== undefined) {
                    msg.channel.send('Stopping Monitor');
                    var monitorObject = monitorStore.filter(obj => {
                        return obj.channelId === msgInfo[1];
                    });

                    if (monitorObject.length === 0) {
                        msg.channel.send('No monitor active for that channel');
                    } else {
                        monitorObject[0].monitor.stopMonitor(msgInfo[1]);
                        monitorStore.splice(monitorStore.indexOf({ channelId: msgInfo[1], monitor: monitorObject[0].monitor }), 1);
                    }
                    break;
                } else {
                    msg.channel.send('Missing channel Id');
                    break;
                }
        }
    }
});

client.login(process.env.DISCORD_TOKEN || 'ODkxNDMyNjUwOTE1NTg2MTA5.YU-RWQ.jrJ-1ZXIyiN52DkjrXYyCf3Bhu0');


module.exports.sendMessage = async function(embed, channelId) {
    client.channels.cache.get(channelId).send({ embeds: [embed] });
}