const Discord = require("discord.js");
const mongoose = require('mongoose');
const userModel = require("./models");
require('dotenv').config();
const db = mongoose.connection;
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES", "DIRECT_MESSAGES", 'GUILD_PRESENCES'], partials: ["CHANNEL"] });

mongoose.connect('mongodb://localhost:27017/nfdb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// const user = new userModel({ userId: '251754270997610497', keywords: ['Banana', 'Shoe'] });
// user.save();

var users = [];

var channelsToMonitor = ['841416426161963099', '829747340520456252'];
var commandsChannel = '908086587529773056';


db.on("error", console.error.bind(console, "connection error: "));
db.once("open", async function() {
    console.log("Database Connected successfully");
    users = await userModel.find({});
});

client.on('ready', async() => {
    console.log(`Logged in as ${client.user.username}!`);
});

client.on('messageCreate', async msg => {

    if (channelsToMonitor.indexOf(msg.channel.id) !== -1) {
        if (msg.embeds.length > 0) {
            for (let i = 0; i < users.length; i++) {
                if (users[i].channels.indexOf(msg.channel.id) !== -1) {
                    var tempMemmory = [];
                    for (let j = 0; j < users[i].keywords.length; j++) {
                        if (msg.embeds[0].title.toLowerCase().includes(users[i].keywords[j])) {
                            if (tempMemmory.indexOf(msg.embeds[0].title) === -1) {
                                try {
                                    client.users.cache.find(user => user.id === users[i].userId).send({ embeds: [msg.embeds[0]] });
                                    tempMemmory.push(msg.embeds[0].title);
                                } catch (e) {
                                    console.log(e.message);
                                }
                            }
                        }
                    }
                }
            }
        }
    } else {
        if (msg.author.bot) return;
    }

    if (msg.content.toLowerCase().substring(0, 2) == `p!` && msg.channel.id == commandsChannel || msg.content.toLowerCase().substring(0, 2) == `p!` && msg.channel.type === 'DM') {
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
                    .setTitle(`Notify Keyword Bot Setup Guide`)
                    .setDescription("Ceci est un guide sur la façon d'utiliser le bot")
                    .addField('Ajouter un mot-clé à votre liste', 'p!add (mot-clé)')
                    .addField('Supprimer un mot-clé de votre liste', 'p!remove (mot-clé)')
                    .addField('Afficher tous les mot-clé actuels', 'p!list')
                    .addField('Changer de channel a monitorer', 'p!channel')
                    .setColor('#FFA500')
                    .setFooter('Powered by NotifyFrance', 'https://pbs.twimg.com/profile_images/1360231339782455298/ypfe2YD2.jpg')
                    .setTimestamp();

                msg.author.send({ embeds: [embed] });
                break;
            case 'help':
                let embedHelp = new Discord.MessageEmbed()
                    .setTitle(`Notify Keyword Bot Setup Guide`)
                    .setDescription("Ceci est un guide sur la façon d'utiliser le bot")
                    .addField('Ajouter un mot-clé à votre liste', 'p!add (mot-clé)')
                    .addField('Supprimer un mot-clé de votre liste', 'p!remove (mot-clé)')
                    .addField('Afficher tous les mot-clé actuels', 'p!list')
                    .addField('Changer de channel a monitorer', 'p!channel')
                    .setColor('#FFA500')
                    .setFooter('Powered by NotifyFrance', 'https://pbs.twimg.com/profile_images/1360231339782455298/ypfe2YD2.jpg')
                    .setTimestamp();

                msg.author.send({ embeds: [embedHelp] });
                break;
            case 'add':
                if (msg.channel.type === 'DM') {
                    if (msgInfo.length > 1) {
                        let user = await userModel.findOne({ userId: msg.author.id });
                        if (user) {
                            if (user.keywords.includes(parameters)) {
                                msg.author.send('Ce mot-clé est déjà dans votre liste');
                            } else {
                                user.keywords.push(parameters.toLowerCase());
                                await user.save();
                                users = await userModel.find({});
                                msg.author.send('Mot clé ajouté');
                            }
                        } else {

                            msg.author.send('De quels salons voulez-vous recevoir les notifications ?').then(async() => {
                                for (var i = 0; i < channelsToMonitor.length; i++) {
                                    msg.author.send('**' + (i + 1) + '** ' + client.guilds.cache.get('733703591436746762').channels.cache.get(channelsToMonitor[i]).toString())
                                    if (i == channelsToMonitor.length - 1) {
                                        msg.author.send('**' + (i + 2) + '** Tous')
                                    }
                                }

                                var response = '';

                                try {
                                    var collectedMessages = await msg.author.dmChannel.awaitMessages({ time: 30000, max: 1, errors: ['time'], filter: (m) => m.author.id == msg.author.id });
                                    response = collectedMessages.first().content;
                                } catch (e) {
                                    msg.author.send("On dirait que tu as mis trop de temps à répondre !");
                                    response = 'false';
                                };

                                if (parseInt(response) >= channelsToMonitor.length + 2 || parseInt(response) <= 0) {
                                    msg.author.send('Pas une option, reccomencer.')
                                } else if (parseInt(response) >= 1) {
                                    var newUser = new userModel({ userId: msg.author.id, keywords: [parameters.toLowerCase()], channels: [] });

                                    for (let i = 0; i < channelsToMonitor.length; i++) {
                                        (parseInt(response) == (i + 1)) ? newUser.channels.push(channelsToMonitor[i]): null;
                                        if (i == channelsToMonitor.length - 1 && newUser.channels.length == 0) {
                                            newUser.channels = channelsToMonitor;
                                        }
                                    }

                                    msg.author.send('Setup finis');

                                    await newUser.save();
                                    users = await userModel.find({});
                                } else {
                                    msg.author.send('Veuillez recommencer s’il vous plaît.')
                                }
                            });
                        }
                    } else {
                        msg.author.send('Paramètres manquants - p!add (mot-clé)')
                    }
                } else {
                    msg.channel.send("Cette commande ne peut être utilisée qu'en DM");
                }
                break;
            case 'remove':
                if (msg.channel.type === 'DM') {
                    if (msgInfo.length > 1) {
                        let user = await userModel.findOne({ userId: msg.author.id });
                        if (user) {
                            if (user.keywords.indexOf(parameters.toLowerCase()) !== -1) {
                                user.keywords.splice(user.keywords.indexOf(parameters.toLowerCase()), 1);
                                await user.save();
                                users = await userModel.find({});
                                msg.author.send('Mot clé supprimé');
                            } else {
                                msg.author.send('Mot clé introuvable');
                            }
                        } else {
                            msg.author.send('Mot clé introuvable');
                        }
                    } else {
                        msg.author.send('Paramètres manquants - p!remove (mot-clé)')
                    }
                } else {
                    msg.channel.send("Cette commande ne peut être utilisée qu'en DM");
                }
                break;
            case 'list':
                if (msg.channel.type === 'DM') {

                    let user = await userModel.findOne({ userId: msg.author.id });
                    if (user) {
                        if (user.keywords.length > 0) {
                            let embed = new Discord.MessageEmbed()
                                .setTitle(`Vos mots-clés actuels`)
                                .setDescription(user.keywords.join('\n'))
                                .setColor('#FFA500')
                                .setFooter('Powered by NotifyFrance', 'https://pbs.twimg.com/profile_images/1360231339782455298/ypfe2YD2.jpg')
                                .setTimestamp();

                            for (let i = 0; i < user.channels.length; i++) {
                                embed.addField('Salon #' + (i + 1) + ': ', client.guilds.cache.get('733703591436746762').channels.cache.get(user.channels[i]).toString(), true);
                            }
                            msg.author.send({ embeds: [embed] });
                            users = await userModel.find({});
                        } else {
                            msg.author.send('Vous n\'avez aucun mot-clé');
                        }
                    } else {
                        msg.author.send('Aucun mot clé trouvé');
                    }
                } else {
                    msg.channel.send("Cette commande ne peut être utilisée qu'en DM");
                }
                break;
            case 'channel':
                msg.author.send('De quels salons voulez-vous recevoir les notifications ?').then(async() => {
                    for (var i = 0; i < channelsToMonitor.length; i++) {
                        msg.author.send('**' + (i + 1) + '** ' + client.guilds.cache.get('733703591436746762').channels.cache.get(channelsToMonitor[i]).toString())
                        if (i == channelsToMonitor.length - 1) {
                            msg.author.send('**' + (i + 2) + '** Tous')
                        }
                    }

                    var response = '';

                    try {
                        var collectedMessages = await msg.author.dmChannel.awaitMessages({ time: 30000, max: 1, errors: ['time'], filter: (m) => m.author.id == msg.author.id });
                        response = collectedMessages.first().content;
                    } catch (e) {
                        msg.author.send("On dirait que tu as mis trop de temps à répondre !");
                        response = 'false';
                    };

                    if (parseInt(response) >= channelsToMonitor.length + 2 || parseInt(response) <= 0) {
                        msg.author.send('Pas une option, reccomencer.')
                    } else if (parseInt(response) >= 1) {
                        let user = await userModel.findOne({ userId: msg.author.id });
                        if (user) {
                            user.channels = [];
                            for (let i = 0; i < channelsToMonitor.length; i++) {
                                (parseInt(response) == (i + 1)) ? user.channels.push(channelsToMonitor[i]): null;
                                if (i == channelsToMonitor.length - 1 && user.channels.length == 0) {
                                    user.channels = channelsToMonitor;
                                }
                            }

                            msg.author.send('Channel changer');

                            await user.save();
                            users = await userModel.find({});
                        } else {
                            var newUser = new userModel({ userId: msg.author.id, keywords: [], channels: [] });

                            for (let i = 0; i < channelsToMonitor.length; i++) {
                                (parseInt(response) == (i + 1)) ? newUser.channels.push(channelsToMonitor[i]): null;
                                if (i == channelsToMonitor.length - 1 && newUser.channels.length == 0) {
                                    newUser.channels = channelsToMonitor;
                                }
                            }

                            msg.author.send('Setup finis');

                            await newUser.save();
                            users = await userModel.find({});
                        }
                    } else {
                        msg.author.send('Veuillez recommencer s’il vous plaît.')
                    }
                });
                break;
            default:
                msg.author.send('Commande Invalid, p!help');
        }
    }
});



client.login(process.env.DISCORD_TOKEN);