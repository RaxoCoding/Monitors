const Discord = require("discord.js");
const mongoose = require('mongoose');
const userModel = require("./models");
require('dotenv').config();
const db = mongoose.connection;
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES"], partials: ["CHANNEL"] });

mongoose.connect('mongodb://localhost:27017/nfdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// const user = new userModel({ userId: '251754270997610497', keywords: ['Banana', 'Shoe'] });
// user.save();

var users = [];

var channelToMonitor = '907985124090593340';

db.on("error", console.error.bind(console, "connection error: "));
db.once("open", async function() {
    console.log("Database Connected successfully");
    const usersFound = await userModel.find({});
    for (let i = 0; i < usersFound.length; i++) {
        users.push(usersFound[i]);
    }
});

client.on('ready', async() => {
    console.log(`Logged in as ${client.user.username}!`);
});

client.on('messageCreate', async msg => {

    if (msg.channel.id === channelToMonitor) {
        if (msg.embeds.length > 0) {
            for (let i = 0; i < users.length; i++) {
                for (let j = 0; j < users[i].keywords.length; j++) {
                    if (msg.embeds[0].title.toLowerCase().includes(users[i].keywords[j]) || msg.embeds[0].description.toLowerCase().includes(users[i].keywords[j].toLowerCase())) {
                        client.users.cache.get(users[i].userId.toString()).send("WTN recherche ta paire ici : ");
                        client.users.cache.get(users[i].userId.toString()).send({ embeds: [msg.embeds[0]] });
                    }
                }
            }
        }
    } else {
        if (msg.author.bot) return;
    }

    if (msg.content.toLowerCase().substring(0, 2) == `p!`) {
        var msgInfo = msg.content.substring(2).split(' ');
        var parameters = '';

        for (var i = 0; i < msgInfo.length; i++) {
            msgInfo[i] = msgInfo[i].toLowerCase();
            if (i == 1) {
                parameters += msgInfo[i];
            } else if (i > 1) {
                parameters += ' ' + msgInfo[i];
            }
        }
        switch (msgInfo[0]) {
            case `hello`: // Add your commands here
                msg.channel.send('Hello!');
                break;
            case 'setup':
                let embed = new Discord.MessageEmbed()
                    .setTitle(`WTB Bot Setup Guide`)
                    .setDescription('this is a guide on how to use the bot')
                    .addField('Add a keywork to your list', 'p!add (keyword)')
                    .addField('Remove a keywork from your list', 'p!remove (keyword)')
                    .addField('Show all current keywords with matching numbers', 'p!list')
                    .setColor('#FFA500')
                    .setFooter('Powered by NotifyFrance', 'https://pbs.twimg.com/profile_images/1360231339782455298/ypfe2YD2.jpg')
                    .setTimestamp();

                msg.author.send({ embeds: [embed] });
                break;
            case 'add':
                if (msg.channel.type === 'DM') {
                    if (msgInfo.length > 1) {
                        let user = await userModel.findOne({ userId: msg.author.id });
                        if (user) {
                            if (user.keywords.includes(parameters)) {
                                msg.author.send('This keyword is already in your list');
                            } else {
                                user.keywords.push(parameters.toLowerCase());
                                user.save();
                                msg.author.send('Keyword added');
                            }
                        } else {
                            let newUser = new userModel({ userId: msg.author.id, keywords: [parameters.toLowerCase()] });
                            newUser.save();
                            msg.author.send('Keyword added');
                        }
                    } else {
                        msg.author.send('Missing Parameters - p!add (keyword)')
                    }
                } else {
                    msg.channel.send('This command can only be used in DM');
                }
                break;
            case 'remove':
                if (msg.channel.type === 'DM') {

                    if (msgInfo.length > 1) {
                        let user = await userModel.findOne({ userId: msg.author.id });
                        if (user) {
                            if (user.keywords.indexOf(parameters.toLowerCase()) !== -1) {
                                user.keywords.splice(user.keywords.indexOf(parameters.toLowerCase()), 1);
                                user.save();
                                msg.author.send('Keyword removed');
                            } else {
                                msg.author.send('Keyword not found');
                            }
                        } else {
                            msg.author.send('Keyword not found');
                        }
                    } else {
                        msg.author.send('Missing Parameters - p!remove (keyword)')
                    }
                } else {
                    msg.channel.send('This command can only be used in DM');
                }
                break;
            case 'list':
                if (msg.channel.type === 'DM') {

                    let user = await userModel.findOne({ userId: msg.author.id });
                    if (user) {
                        let embed = new Discord.MessageEmbed()
                            .setTitle(`Your current keywords`)
                            .setDescription(user.keywords.join('\n'))
                            .setColor('#FFA500')
                            .setFooter('Powered by NotifyFrance', 'https://pbs.twimg.com/profile_images/1360231339782455298/ypfe2YD2.jpg')
                            .setTimestamp();
                        msg.author.send({ embeds: [embed] });
                    } else {
                        msg.author.send('No keywords found');
                    }
                } else {
                    msg.channel.send('This command can only be used in DM');
                }
                break;

            case 'test':
                let embed2 = new Discord.MessageEmbed()
                    .setTitle(`WTB Bot Test banana`)
                    .setDescription('this is a test')
                    .setColor('#FFA500')
                    .setFooter('Powered by NotifyFrance', 'https://pbs.twimg.com/profile_images/1360231339782455298/ypfe2YD2.jpg')
                    .setTimestamp();

                msg.channel.send({ embeds: [embed2] });
                break;
        }
    }
});


client.login(process.env.DISCORD_TOKEN);


module.exports.sendMessage = async function(embed, channelId) {
    client.channels.cache.get(channelId).send({ embeds: [embed] });
}