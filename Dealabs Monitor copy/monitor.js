// Dependencies
const puppeteer = require('puppeteer');
var CronJob = require('cron').CronJob;
// const Bot = require('./bot.js');
// const Discord = require("discord.js");
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const IMAGE_URL = 'https://pbs.twimg.com/profile_images/1360231339782455298/ypfe2YD2.jpg';

var alreadyChecked = [];
var currentlyRunning = false;
var d = new Date();
var startTime = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes()));

var minPrice = process.env.MIN_PRICE;
var minDiscount = -25;

Date.prototype.addHours = function(h) {
    this.setTime(this.getTime() + (h * 60 * 60 * 1000));
    return this;
}

function strikeThrough(text) {
    return text
        .split('')
        .map(char => char + '\u0336')
        .join('')
}

async function checkNewItems(page, i, webhookUrl) {
    currentlyRunning = true;

    const hook = new Webhook(webhookUrl);
    hook.setUsername('Dealabs Monitor');
    hook.setAvatar(IMAGE_URL);

    if (i == 0) {
        await page.reload();
    }
    try {
        let deals = (await page.$$("article.thread > div.threadGrid"));
        let dealsId = (await page.$$eval("article.thread", (list) => list.map((elm) => elm.id)));

        if (deals.length >= 11) {
            deals = deals.slice(0, 9);
        }

        if (i >= deals.length) {
            currentlyRunning = false;
        } else {
            if (alreadyChecked.indexOf(dealsId[i]) === -1) {
                let expired = await deals[i].$('span.cept-show-expired-threads');

                if (!expired) {
                    let price = null;
                    try {
                        price = await deals[i].$eval('span.thread-price', span => span.innerHTML);
                    } catch (error) {}

                    if (price == null || price == 'GRATUIT' || price.includes('%') || price.includes('- ') || parseInt(price) >= minPrice) {

                        let originalPrice = null;
                        let discount = null;
                        try {
                            originalPrice = await deals[i].$eval('span.cept-next-best-price', span => span.innerHTML);
                            discount = await deals[i].$eval('span.cept-discount', span => span.innerHTML);
                        } catch (error) {}

                        let title = await deals[i].$eval('a.thread-link', a => a.innerHTML);
                        title = title.replace(/&nbsp;/g, ' ');

                        let link = null;
                        try {
                            link = await deals[i].$eval('a.thread-link', a => a.getAttribute('href'));
                        } catch (error) {}

                        const imgUrl = await deals[i].$eval('img.thread-image', a => a.getAttribute('src'));

                        const embed = new MessageBuilder()
                            .setTitle(title)
                            .setURL((link != null ? link : 'https://www.dealabs.com/'))
                            .addField('Price', (price != null ? price : 'N/A') + ' ' + (originalPrice != null ? '~~' + originalPrice + '~~ ' + (discount != null ? discount : '') : ''), true)
                            .setColor('#FFA500')
                            .setImage(imgUrl)
                            .setTimestamp()
                            .setFooter('Powered by NotifyFrance', 'https://pbs.twimg.com/profile_images/1360231339782455298/ypfe2YD2.jpg');

                        hook.send(embed);

                        alreadyChecked.push(dealsId[i]);
                        currentlyRunning = false;
                    } else {
                        alreadyChecked.push(dealsId[i]);
                        checkNewItems(page, (i + 1), webhookUrl);
                    }
                } else if (expired) {
                    alreadyChecked.push(dealsId[i]);
                    checkNewItems(page, (i + 1), webhookUrl);
                }
            } else {
                checkNewItems(page, (i + 1), webhookUrl);
            }
        }
    } catch (error) {
        console.log(error.message);
    }

    currentlyRunning = false;
}

async function initBrowser(url) {
    const browser = await puppeteer.launch({
        headless: true, // Set to true for heroku,
        defaultViewport: null,
        args: [
            '--window-size=1920,1080',
            '--no-sandbox',
        ]
    });
    const page = await browser.newPage();
    await page.goto(url);
    return page;
}

async function Monitor(page, monitorUrl, webhookUrl, delay) {
    var job;

    console.log('Starting Monitor for: ' + monitorUrl + " with delay: " + delay);

    this.startMonitor = async function(monitorUrl, webhookUrl, delay, page) {
        job = new CronJob((0 + delay) + ' * * * * *', async function() {
            // job = new CronJob('*/10 * * * * *', async function() {
            if (currentlyRunning === false) {
                // console.log('Starting New Items Check for ' + channelId);
                await page.goto(monitorUrl);
                console.log('Checking new items');
                checkNewItems(page, 0, webhookUrl);
            }
        }, null, true);
        job.start();
        this.stopMonitor = function() {
            job.stop();
        };
    }

    startMonitor(monitorUrl, webhookUrl, delay, page);
}

async function start() {
    const page = await initBrowser('https://www.google.com');
    await page.setDefaultNavigationTimeout(0);
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
    Monitor(page, 'https://www.dealabs.com/bons-plans-nouveaux', "https://discord.com/api/webhooks/898608926168326185/8H3PMeI2VZs7Kzq2cwSZdvNXS9SZON9ym4E_cKEZiSS8PrztOVtr6jhmZs7I7vH_CnLn", 0);
    Monitor(page, 'https://www.dealabs.com/codes-promo', "https://discord.com/api/webhooks/898608786837733376/HIY2q1WVSy_NDEW0QKAOd0VRp5QQb2ER_n6p1dKDwPPVkhltmRas7G021v0JXKw6w39z", 15);
    Monitor(page, 'https://www.dealabs.com/groupe/gratuit-nouveaux', "https://discord.com/api/webhooks/898608359949860974/fJuEEtefPds6L0JBud5kmIuZCfeupCAzVdwi5EUwR0hUzSRbwBOj6ShHYC9fwCatvr49", 30);
    // Monitor(page, 'https://www.dealabs.com/codes-promo', "https://discord.com/api/webhooks/897107117213888562/8qSf1ZVNsM9u6N53vuI04qQ_wfrMUVe6np93K9g4-kjH2uORhedOaVkRNDJJeiZqOZ_r", 0)
}

start();

module.exports = {
    Monitor: Monitor
}