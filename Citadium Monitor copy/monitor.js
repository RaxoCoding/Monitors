// Dependencies
const puppeteer = require('puppeteer');
var CronJob = require('cron').CronJob;
// const Bot = require('./bot.js');
// const Discord = require("discord.js");
const { Webhook, MessageBuilder } = require('discord-webhook-node');
const IMAGE_URL = 'https://pbs.twimg.com/profile_images/1360231339782455298/ypfe2YD2.jpg';
const serverUrl = process.env.SERVER_URL || 'localhost:3000';
var alreadyChecked = [];
var alreadyCheckedWithStock = [];
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

const delay = ms => new Promise(res => setTimeout(res, ms));

async function checkNewItems(page, i, webhookUrl, monitorUrl) {
    await page.goto(monitorUrl);
    currentlyRunning = true;

    const hook = new Webhook(webhookUrl);
    hook.setUsername('Citadium Monitor');
    hook.setAvatar(IMAGE_URL);

    try {
        await delay(4000);

        if (await page.$('#onetrust-accept-btn-handler') !== null) await page.$eval('#onetrust-accept-btn-handler', button => button.click());

        let deals = (await page.$$("div.item.w-25"));
        let dealsId = (await page.$$eval("div.item.w-25 > div.product-infos > a", (list) => list.map((elm) => elm.getAttribute("href"))));

        if (deals.length >= 11) {
            deals = deals.slice(0, 9);
        }

        if (i >= deals.length) {
            alreadyChecked = [];
            currentlyRunning = false;
        } else {
            if (alreadyChecked.indexOf(dealsId[i]) === -1) {

                let title = await deals[i].$eval('div.product-infos > a > div > p > span.viewall-item-label', a => a.innerHTML);
                title = title.replace(/&nbsp;/g, ' ');

                var imgUrl = await deals[i].$eval('div.position-relative > a.list-img > div > img.hide-hover', a => a.getAttribute('src'));

                var price = await deals[i].$eval('div.product-infos > a > span.hide-hover', span => span.innerHTML);

                price = price.replace(/&nbsp;/g, ' ');

                var link = await deals[i].$eval('div.product-infos > a', a => a.getAttribute('href'));
                await page.goto(link);

                if (await page.$('div.size-container-custom.hidden') !== null) await page.$eval('div.container-open-menu > div.icon-arrow', button => button.click());

                await page.waitForSelector('div.size-container-custom > div > div')

                let sizes = (await page.$$("div.size-container-custom > div > div"));

                var saleId = await page.$eval('#sale_id', a => a.value);

                var refIds = [];

                var sizeNumbers = 0;


                for (var j = 0; j < sizes.length; j++) {
                    var refIdClasses = await sizes[j].$eval('input', a => a.getAttribute('class'));
                    if (refIdClasses != 'disabled') {
                        var refId = await sizes[j].$eval('input', a => a.getAttribute('value'));
                        var size = await sizes[j].$eval('input', a => a.getAttribute('data-size'));
                        refIds.push({ size: size, refId: refId });
                        sizeNumbers = sizeNumbers + size;
                    }
                }


                if (refIds.length <= 0) {
                    alreadyChecked.push(dealsId[i]);
                    checkNewItems(page, (i + 1), webhookUrl, monitorUrl);
                } else {
                    if (alreadyCheckedWithStock.indexOf(dealsId[i] + sizeNumbers) === -1) {
                        const embed = new MessageBuilder()
                            .setTitle(title)
                            .setURL((link != null ? link : 'https://nintendalerts.com/category/precommandes-bons-plans-et-bonnes-affaires-nintendo/'))
                            .addField('Price', (price != null ? price : 'N/A'))
                            .setColor('#FFA500')
                            .setImage(imgUrl)
                            .setTimestamp()
                            .setFooter('Powered by NotifyFrance', 'https://pbs.twimg.com/profile_images/1360231339782455298/ypfe2YD2.jpg');

                        for (let h = 0; h < refIds.length; h++) {
                            embed.addField(refIds[h].size, '[ATC](' + serverUrl + '?refId=' + refIds[h].refId + '&saleId=' + saleId + ')', true);
                        }

                        hook.send(embed);
                        alreadyChecked.push(dealsId[i]);
                        alreadyCheckedWithStock.push(dealsId[i] + sizeNumbers);

                        currentlyRunning = false;
                    } else {
                        checkNewItems(page, (i + 1), webhookUrl, monitorUrl);
                    }
                }
            } else {
                checkNewItems(page, (i + 1), webhookUrl, monitorUrl);
            }
        }
    } catch (error) {
        console.log(error.message);
        currentlyRunning = false;
    }
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
            // job = new CronJob('*/30 * * * * *', async function() {
            if (currentlyRunning === false) {
                // console.log('Starting New Items Check for ' + channelId);
                console.log('Checking new items');
                checkNewItems(page, 0, webhookUrl, monitorUrl);
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
    Monitor(page, 'https://www.citadium.com/fr/fr/recherche/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear?query=dunk+low&search-universe=Footwear', "https://discord.com/api/webhooks/906504970227056760/VounGcDX0BL3pgJsa_HuI3qHgKZNoRRmcUL-Oh0s-m_1Uxuyb3M9qnsDw62TSWfLzQ0W", 0);
    Monitor(page, 'https://www.citadium.com/fr/fr/recherche/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear/uni/Footwear?query=Dunk+High&search-universe=Footwear', "https://discord.com/api/webhooks/906504970227056760/VounGcDX0BL3pgJsa_HuI3qHgKZNoRRmcUL-Oh0s-m_1Uxuyb3M9qnsDw62TSWfLzQ0W", 20);
    Monitor(page, 'https://www.citadium.com/fr/fr/recherche/uni/Footwear?query=Jordan&sortBy=item_cita_fr_fr_new', "https://discord.com/api/webhooks/906504970227056760/VounGcDX0BL3pgJsa_HuI3qHgKZNoRRmcUL-Oh0s-m_1Uxuyb3M9qnsDw62TSWfLzQ0W", 40);
    // Monitor(page, 'https://www.citadium.com/fr/fr/recherche/uni/Footwear?query=Jordan&sortBy=item_cita_fr_fr_new', "https://discord.com/api/webhooks/905901510439882762/muRZbA27Y1Ed5McD7jSc6eArX-yPI0SHEwj0e27kSpPeoGdH1obWzlLADznrKKnxhmQN", 40);
}

start();

module.exports = {
    Monitor: Monitor
}