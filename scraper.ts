import puppeteer from 'puppeteer';
import { Data } from './Data';
import { sleep } from './sleep';
// Or import puppeteer from 'puppeteer-core';

const BASE_URL = 'https://data.austintexas.gov/browse?limitTo=datasets,filters&page='; // starts on 1 ends on 440

const main = async () => {
    // Launch the browser and open a new blank page
    const browser = await puppeteer.launch({
        headless: false,
    });
    const page = await browser.newPage();

    const subPage = await browser.newPage();

    // Navigate the page to a URL.

    const urls = new Array(440).fill(0).map((_, i) => `${BASE_URL}${i + 1}`);

    const data: Data[] = []
    for (const url of urls) {

        await page.goto(url);

        // Set screen size.
        await page.setViewport({ width: 1080, height: 1024 });

        // Wait for the page to load.
        const elements = await page.$$('div.browse2-result');

        for (const element of elements) {
            const { title, subUrl, views, updated, keyword } = await page.evaluate(el => {

                const title = el.querySelector('h2 > a')?.textContent;

                const subUrl = el.querySelector('h2 > a')?.getAttribute('href');
                const views = el.querySelector('div.browse2-result-view-count-value')?.textContent;

                const updated = el.querySelector('div.browse2-result-timestamp-value > span')?.textContent;
                const keyword = el.querySelector('div > div.browse2-result-title > a')?.textContent;

                return { title, subUrl, views, updated, keyword };
            }, element);



            if (keyword === "Locations and Maps") {
                console.log('skipping', title)
            } else {
                await subPage.goto(subUrl as string);

                await subPage.waitForSelector('dl.metadata-pair');

                const pairs = await subPage.$$('dl.metadata-pair');

                for (const pair of pairs) {
                    const { key, value } = await subPage.evaluate(el => {
                        const key = el.querySelector('dt.metadata-pair-key')?.textContent;
                        const value = el.querySelector('dd.metadata-pair-value')?.textContent;

                        return { key, value };
                    }, pair);

                    if (key === 'Columns') {
                        // data[data.length - 1].columns = parseInt(value as string);
                        console.log(value)

                    }

                    if (key === 'Rows') {
                        // data[data.length - 1].rows = parseInt(value as string);
                        console.log(value)

                    }

                    if (key === 'CSV') {
                        // data[data.length - 1].csv = value as string;
                        console.log(value)

                    }
                }

            }



            data.push({
                title: title as string,
                keyword: keyword as string,
                rows: 0,
                columns: 0,
                csv: '',
                url: subUrl as string,
                last_updated: new Date(updated as string),
                views: parseInt((views as string).replace(/,/g, '')),
            })

        }


        // avoid triggering too many request errors
        await sleep(2000);
        break;
    }
    console.log(data);

    await browser.close();
}

main();
