// Dependencies
const puppeteer = require('puppeteer');
var CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
const axios = require('axios');
const Bot = require('./bot.js');
const Discord = require("discord.js");
const sdk = require('api')('@opensea/v1.0#gbq4cz1cksxopxqw');

var alreadyChecked = [];
var currentlyRunning = false;
var d = new Date();
var startTime = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()));

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

async function checkNewItems(page, i, min, max, channelId, collectionUrl) {
    currentlyRunning = true;
    // Main Page
    if (i == 0) {
        console.log("   Refreshing page...");
        await page.reload();
    }

    // const href = await page.$$eval("a.Asset--anchor", (elm) => elm.href);
    var hrefs = [];

    hrefs = await page.$$eval("a.Asset--anchor", (list) => list.map((elm) => elm.href));
    if (hrefs.length <= 0) {
        await page.waitForSelector('a.styles__CoverLink-sc-nz4knd-1')
        hrefs = await page.$$eval("a.styles__CoverLink-sc-nz4knd-1", (list) => list.map((elm) => elm.href));
    }

    if (i >= hrefs.length) {
        console.log(`       No matches found after ${i} tries.`)
        currentlyRunning = false;
    } else {
        if (alreadyChecked.indexOf(hrefs[i]) === -1) {
            axios.get('https://api.opensea.io/api/v1/asset' + hrefs[i].split('https://opensea.io/assets')[1], {
                    headers: {
                        'X-API-KEY': '0508401d2ccf48848d5e925a2a68164a',
                    }
                })
                .then(function(response) {
                    var listing = response.data;
                    var orders = [];
                    for (let i = 0; i < listing.orders.length; i++) {
                        if (listing.orders[i].side == 1) {
                            orders.push(listing.orders[i]);
                        }
                    }

                    if (orders.length == 0) {
                        console.log('       No orders found.');
                        alreadyChecked.push(hrefs[i]);
                        checkNewItems(page, (i + 1), min, max, channelId, collectionUrl);
                    } else {

                        var listingDate = new Date(orders[0].created_date).addHours(1);
                        var listingPrice = (orders[0].current_price / 1000000000000000000).toString();

                        if (!(alreadyChecked.some(item => item.link === hrefs[i] && item.price === listingPrice))) {
                            if (listingDate > startTime) {
                                if (parseFloat(min) > parseFloat(listingPrice) || parseFloat(listingPrice) > parseFloat(max)) {
                                    console.log('       Product is not in price range');
                                    alreadyChecked.push({ link: hrefs[i], price: listingPrice });
                                    currentlyRunning = false;
                                } else {
                                    var listingImage = listing.image_url;
                                    var listingName = listing.name;
                                    var listingTokenId = listing.token_id;
                                    var listingLink = listing.permalink;
                                    var listingOwner = listing.owner;
                                    let embed = new Discord.MessageEmbed()
                                        .setTitle(`New NFT ${listingName != null ? listingName : listingTokenId}`)
                                        .setURL(listingLink)
                                        .setDescription('[Collection Link](' + collectionUrl + ')')
                                        .addField('Price', listingPrice + ' ETH')
                                        .addField('Current Owner', `${listingOwner.user != null ? listingOwner.user.username : 'NaN'} [Visit Profile](https://opensea.io/${listingOwner.user != null ? listingOwner.user.username : ''})`)
                                        .setColor('#FFA500')
                                        .setImage(listingImage != '' ? listingImage : 'https://archive.org/download/no-photo-available/no-photo-available.png')
                                        .setFooter('Powered by NotifyFrance', 'https://pbs.twimg.com/profile_images/1360231339782455298/ypfe2YD2.jpg')
                                        .setTimestamp();

                                    Bot.sendMessage(embed, channelId);
                                    console.log('     Discord Message sent!');

                                    alreadyChecked.push({ link: hrefs[i], price: listingPrice });
                                    currentlyRunning = false;
                                }
                            } else {
                                console.log('       Product is to Old');
                                alreadyChecked.push({ link: hrefs[i], price: listingPrice });
                                currentlyRunning = false;
                            }
                        } else {
                            checkNewItems(page, (i + 1), min, max, channelId, collectionUrl);
                        }
                    }
                })
                .catch(function(error) {
                    console.log(error.message);
                    alreadyChecked.push(hrefs[i]);
                    currentlyRunning = false;
                })
        } else {
            checkNewItems(page, (i + 1), min, max, channelId, collectionUrl);
        }
    }

}

async function initBrowser(collectionUrl) {
    const browser = await puppeteer.launch({
        headless: true, // Set to true for heroku,
        defaultViewport: null,
        args: [
            '--window-size=1920,1080',
            '--no-sandbox',
        ]
    });
    const page = await browser.newPage();
    await page.goto(collectionUrl);
    return page;
}

function Monitor(collectionUrl, min, max, channelId) {
    var job;

    this.startMonitor = async function() {
        const page = await initBrowser(collectionUrl);
        job = new CronJob('*/5 * * * * *', function() {
            if (currentlyRunning === false) {
                console.log('Starting New Items Check for ' + channelId);
                try {
                    checkNewItems(page, 0, min, max, channelId, collectionUrl);
                } catch (error) {
                    currentlyRunning = false;
                }
            }
        }, null, true);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
        job.start();
        this.stopMonitor = function() {
            job.stop();
        };
    }
}

module.exports = {
    Monitor: Monitor
}