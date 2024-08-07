import puppeteer from 'puppeteer';
import { bmkToNumber } from './bmkToNumber';
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
        console.log("url" + url)

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


            const extra = { Rows: 0, Columns: '0', CSV: '' };

            console.log(title);
            if (keyword === "Locations and Maps" ||
                title == "UTILITIESCOMMUNICATION.DrainagePipeREFDOC" ||
                title == "Total Summer Rated Capacity (MW)" ||
                title == "Mixed Beverage Sales Receipts" ||
                title?.includes("2021-2022 CACFP Day Care Home Sponsors-Operating2") ||
                title?.includes("2021-2022 CACFP Day Care Home Sponsors")) {
            } else {
                await subPage.goto(subUrl as string);

                await subPage.waitForSelector('dl.metadata-row');

                const pairs = await subPage.$$('dl.metadata-row');

                for (const pair of pairs) {
                    const { object } = await subPage.evaluate(el => {

                        const keys = el.querySelectorAll('dt.metadata-pair-key');
                        const values = el.querySelectorAll('dd.metadata-pair-value');

                        const ret: any = {}

                        for (const key in keys) {
                            const keyText = keys[key].textContent ?? 'null'

                            Object.assign(ret, { [keyText]: values[key].textContent });

                        }

                        return { object: ret };
                    }, pair);

                    Object.assign(extra, object);
                    Object.assign(extra, { 'Rows': bmkToNumber(object['Rows'] as string) });
                }

            }

            const save = {
                title: title as string,
                keyword: keyword as string,
                rows: extra['Rows'],
                columns: parseInt(extra['Columns'] as string),
                csv: extra['CSV'],
                url: subUrl as string,
                last_updated: new Date(updated as string),
                views: parseInt((views as string).replace(/,/g, '')),
            }

            data.push(save)

        }


        // avoid triggering too many request errors
        await sleep(1400);
    }
    console.log(JSON.stringify(data));

    await browser.close();
}

main();
