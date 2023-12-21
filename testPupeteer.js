const puppeteer = require('puppeteer');

async function run() {
    try {
        // Launching the Puppeteer controlled browser
        const browser = await puppeteer.launch();

        // Creating a new page
        const page = await browser.newPage();

        // Navigating to a website
        await page.goto('http://example.com');

        // Taking a screenshot and saving it as 'example.png'
        await page.screenshot({ path: 'example.png' });

        // Closing the browser
        await browser.close();
        console.log("Browser closed. Screenshot saved as 'example.png'");
    } catch (error) {
        // Handling any errors that occur in the process
        console.error("An error occurred: ", error);
    }
}

run();