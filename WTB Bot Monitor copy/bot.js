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

var channelToMonitor = '841416426161963099';

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
                    .setTitle(`Notify Keyword Bot Setup Guide`)
                    .setDescription("ceci est un guide sur la façon d'utiliser le bot")
                    .addField('Ajouter un mot-clé à votre liste', 'p!add (mot-clé)')
                    .addField('Supprimer un mot-clé de votre liste', 'p!remove (mot-clé)')
                    .addField('Afficher tous les mot-clé actuels', 'p!list')
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
                                msg.author.send('Ce mot-clé est déjà dans votre liste');
                            } else {
                                user.keywords.push(parameters.toLowerCase());
                                user.save();
                                msg.author.send('mot-clé ajouter');
                            }
                        } else {
                            let newUser = new userModel({ userId: msg.author.id, keywords: [parameters.toLowerCase()] });
                            newUser.save();
                            msg.author.send('mot-clé ajouter');
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
                                user.save();
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
                            msg.author.send({ embeds: [embed] });
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