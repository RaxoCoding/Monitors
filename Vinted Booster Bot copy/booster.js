const puppeteer = require('puppeteer-extra')
var userAgent = require('user-agents');
const fs = require('fs');
// const MailSlurp = require('mailslurp-client').default;
const randName = require('moxname');
const randomEmail = require('random-email');
const axios = require('axios').default;

require('dotenv').config();

// let rawdata = fs.readFileSync('accounts.json');
// let accounts = JSON.parse(rawdata).allAccounts;

const StealthPlugin = require('puppeteer-extra-plugin-stealth')

var inbox;

const delay = ms => new Promise(res => setTimeout(res, ms));

// Browser Setup
(async() => {
    const browser = await puppeteer.use(StealthPlugin()).launch({
        headless: true, // Set to true for production,
        defaultViewport: null,
        args: [
            '--incognito',
        ],
    });

    // const apiKey = process.env.MAIL_API_KEY;
    // const mailslurp = new MailSlurp({ apiKey: apiKey });

    done(browser);
})();

async function done(browser) {
    const pages = [];

    async function createAccounts(amount) {
        for (let i = 0; i < amount; i++) {
            try {
                const context = await browser.createIncognitoBrowserContext();
                const page = await context.newPage();

                await page.goto('https://www.vinted.com/');
                await page.setUserAgent(new userAgent().toString());

                if (await page.$('button.Button_button__1HmfN.Button_flat__34jig.Button_primary__7rvYY.Button_inline__3k2so.Button_truncated__3pQ92.Button_icon-left__1QZEf.Button_without-text__3li-d') !== null) await page.$eval('button.Button_button__1HmfN.Button_flat__34jig.Button_primary__7rvYY.Button_inline__3k2so.Button_truncated__3pQ92.Button_icon-left__1QZEf.Button_without-text__3li-d', button => button.click());
                if (await page.$('#onetrust-accept-btn-handler') !== null) await page.$eval('#onetrust-accept-btn-handler', button => button.click());

                await page.$eval('a.js-signin-button', button => button.click());


                const [a] = await page.$x("//a[contains(., 'Email')]");
                if (a) {
                    await a.click();
                }

                await page.waitForNavigation();

                // inbox = await mailslurp.createInbox();

                var realName = randName.getFullName((Math.random() < 0.5 ? 'male' : 'female'), 1)[0];

                var username = (realName.toLowerCase() + (Math.random().toString(36).slice(-6))).replace(/\s/g, '').substring(0, 20);

                var email = randomEmail({ domain: 'gmail.com' }); // inbox.emailAddress

                var password = (Math.random().toString(36).slice(-8) + (Math.floor(Math.random() * 1000) + 1));

                await page.$eval('[id="user[real_name]"]', (el, valueToInsert) => el.value = valueToInsert, realName);

                await page.$eval('[id="user[login]"]', (el, valueToInsert) => el.value = valueToInsert, username);

                await page.$eval('[id="user[email]"]', (el, valueToInsert) => el.value = valueToInsert, email);

                await page.$eval('#user_password', (el, valueToInsert) => el.value = valueToInsert, password);

                await page.$eval('button.c-button--filled.c-button--default.c-button.js-signup-submit-button.c-button--truncated', button => button.click());

                console.log(email, password);

                await page.waitForNavigation();

                await delay(3000);

                if (await page.$('a.Button_button__1HmfN.Button_filled__ShyyU.Button_primary__7rvYY.Button_inline__3k2so.Button_truncated__3pQ92') !== null) {
                    if (await page.$('#onetrust-accept-btn-handler') !== null) await page.$eval('#onetrust-accept-btn-handler', button => button.click());

                    let buttons = (await page.$$('button.Button_button__1HmfN.Button_flat__34jig.Button_primary__7rvYY.Button_inline__3k2so.Button_truncated__3pQ92.Button_icon-left__1QZEf.Button_without-text__3li-d'));

                    for (let i = 0; i < buttons.length; i++) {
                        if (await page.evaluate(el => el.getAttribute("data-testid"), buttons[i]) === 'onboarding-close-button') {
                            await buttons[i].click();
                        }
                    }

                    let account = {
                        password: `${password}`,
                        email: `${email}`
                    };
                    accounts.push(account);

                    console.log(accounts);
                    console.log(JSON.stringify({ "allAccounts": accounts }));
                    fs.writeFileSync('accounts.json', JSON.stringify({ "allAccounts": accounts }));
                    console.log('Account #' + (i + 1) + ' created!');

                } else {
                    await page.$eval('a.c-button--filled.c-button--default.c-button--medium.c-button.c-button--truncated', button => button.click());

                    await delay(3000);

                    var vintedAvailable = '';
                    var balanceAvailable = '';

                    await axios.post(`https://api.sms-activate.org/stubs/handler_api.php?api_key=${process.env.PHONE_API_KEY}&action=getNumbersStatus&country=${78}`)
                        .then(function(response) {
                            // handle success
                            vintedAvailable = response.data.kc_0;
                        })
                        .catch(function(error) {
                            // handle error
                            console.log(error.message);
                        })

                    await axios.post(`https://api.sms-activate.org/stubs/handler_api.php?api_key=${process.env.PHONE_API_KEY}&action=getBalance`)
                        .then(function(response) {
                            // handle success
                            balanceAvailable = response.data.replace('ACCESS_BALANCE:', '');
                        })
                        .catch(function(error) {
                            // handle error
                            console.log(error.message);
                        })

                    var phoneNumber = '';
                    var phoneId = '';
                    var serviceCode = 'kc'
                    var verification_code = '';

                    if (vintedAvailable != '0' && balanceAvailable != '30') {
                        await axios.post(`https://api.sms-activate.org/stubs/handler_api.php?api_key=${process.env.PHONE_API_KEY}&action=getNumber&service=${serviceCode}&ref=${915541}&country=${78}`)
                            .then(async function(response) {
                                // handle success

                                phoneId = response.data.replace('ACCESS_NUMBER:', '').split(':')[0];
                                phoneNumber = response.data.replace('ACCESS_NUMBER:', '').split(':')[1];

                                await page.focus('#number');

                                await page.keyboard.type('+' + phoneNumber, { delay: 100 });

                                if (await page.$('div.Validation_validation__18UuF.Validation_warning__3_aPX') !== null) {
                                    await axios.post(`https://api.sms-activate.org/stubs/handler_api.php?api_key=${process.env.PHONE_API_KEY}&action=setStatus&status=${8}&id=${phoneId}`);
                                } else {
                                    await page.$eval('button.Button_button__1HmfN.Button_filled__ShyyU.Button_primary__7rvYY.Button_truncated__3pQ92', button => button.click());

                                    await axios.post(`https://api.sms-activate.org/stubs/handler_api.php?api_key=${process.env.PHONE_API_KEY}&action=setStatus&status=${1}&id=${phoneId}`)
                                        .then(async function(response) {

                                            while (verification_code == '') {
                                                await delay(5000);
                                                console.log('looping');
                                                await axios.post(`https://api.sms-activate.org/stubs/handler_api.php?api_key=${process.env.PHONE_API_KEY}&action=getStatus&id=${phoneId}`)
                                                    .then(async function(response) {
                                                        if (response.data.includes('STATUS_OK:') == true) {
                                                            verification_code = response.data.replace('STATUS_OK:', '');

                                                            await page.focus('#verification_code');

                                                            await page.keyboard.type(verification_code, { delay: 100 });

                                                            await delay(5000);

                                                            await page.$eval('button.Button_button__1HmfN.Button_filled__ShyyU.Button_primary__7rvYY.Button_truncated__3pQ92', button => button.click());

                                                            page.waitForNavigation();

                                                            console.log('Account #' + (i + 1) + ' created!');

                                                            pages.push(page);

                                                            // let account = {
                                                            //     password: `${password}`,
                                                            //     email: `${email}`
                                                            // };

                                                            // accounts.push(account);

                                                            // fs.writeFileSync('accounts.json', JSON.stringify({ "allAccounts": accounts }));
                                                            // await delay(5000);
                                                        }
                                                    })
                                                    .catch(function(error) {
                                                        // handle error
                                                        console.log(error.message);
                                                    });
                                            }
                                        })
                                        .catch(function(error) {
                                            // handle error
                                            console.log(error.message);
                                        })
                                }
                            })
                            .catch(function(error) {
                                // handle error
                                console.log(error.message);
                            })
                    } else {
                        console.log('No More Available');
                    }
                }
            } catch (error) {
                console.log(error.message);
            }

        }
    }

    // await createAccounts(3);
}

function Booster(link) {

    this.startBooster = async function(link, amount) {
        for (let i = 0; i < amount && i < pages.length; i++) {
            pages[i].bringToFront();
            const page = pages[i];
            await page.goto(link);
            await page.setUserAgent(new userAgent().toString());

            await delay(1000);

            if (await page.$('#onetrust-accept-btn-handler') !== null) await page.$eval('#onetrust-accept-btn-handler', button => button.click());

            await delay(3000);

            await page.$eval('button.Button_button__1HmfN.Button_medium__1Kljk.Button_muted__3hngQ.Button_truncated__3pQ92.Button_icon-left__1QZEf', a => a.click());
        };
    };

    startBooster(link, 5);
}

module.exports = {
    Booster: Booster
}

// async function test(browser) {

//     const pages = [];

//     for (let i = 0; i < 2; i++) {
//         const context = await browser.createIncognitoBrowserContext();
//         const page = await context.newPage();

//         await page.goto('https://www.vinted.com/');

//         pages.push(page);
//     }

//     console.log(pages);
//     for (let i = 0; i < pages.length; i++) {
//         await delay(5000);
//         await pages[i].close();
//     }

// }