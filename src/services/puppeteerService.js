const puppeteer = require("puppeteer");
const fsPromises = require("fs").promises;


/**
 * Starts a Puppeteer session and logs into the LiveIQ system.
 * 
 * @param {Object} secret - Contains the username and password for LiveIQ.
 * @param {string} folder - The download folder path.
 * @returns {Promise<Array>} - Returns a Promise that resolves to an array containing the browser and page objects.
 */
async function startLiveIQ(secret, folder) {
    const DOWNLOAD_FOLDER = folder;
    const USERNAME_SELECTOR = '#signInName';
    const PASSWORD_SELECTOR = '#password';
    const CTA_SELECTOR = '#next';

    try {
        const browser = await puppeteer.launch({
            headless: true, // Set headless to true for production
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();

        // Configure the download behavior
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: DOWNLOAD_FOLDER
        });

        await page.setViewport({ width: 1366, height: 768 });
        await page.setCacheEnabled(false);

        // Navigate to the LiveIQ login page
        await page.goto('https://liveiq.subway.com/', { waitUntil: 'networkidle2' });

        // Perform login
        await page.waitForSelector(USERNAME_SELECTOR);
        await page.click(USERNAME_SELECTOR);
        await page.keyboard.type(secret.username);
        await page.click(PASSWORD_SELECTOR);
        await page.keyboard.type(secret.password);
        await page.click(CTA_SELECTOR);

        // Wait for successful login
        await page.waitForSelector('#page-title', { visible: true });

        return [browser, page];
    } catch (e) {
        console.error('Error starting LiveIQ session:', e);
        throw e;
    }
}

module.exports = { startLiveIQ };




/**
 * Checks if a specified file has been downloaded in a folder.
 * 
 * @param {string} folder - The folder to check for the downloaded file.
 * @param {string} file - The name of the file to check.
 * @param {number} maxRetries - Maximum number of retries to check for the file.
 * @param {number} interval - Time interval (in milliseconds) between each retry.
 * @returns {Promise<string>} - A promise that resolves to a string indicating the download status.
 */
async function checkIfDownloadFinished(folder, file, maxRetries = 5, interval = 2000) {
    if (maxRetries <= 0) {
        console.log("Max retries reached, file not found.");
        return "file_not_downloaded";
    }

    console.log(`Checking for file: ${file}, attempts remaining: ${maxRetries}`);
    let listFiles = await fsPromises.readdir(folder);
    console.log("Files in directory:", listFiles);
    
    if (listFiles.includes(file)) {
        return "file_downloaded";
    } else {
        await new Promise(resolve => setTimeout(resolve, interval));
        return checkIfDownloadFinished(folder, file, maxRetries - 1, interval);
    }
}





/**
 * Downloads the employee file from a specific web page.
 * 
 * @param {Object} secret - Contains the credentials and other secrets.
 * @param {string} downloadFolder - The folder where the file should be downloaded.
 * @returns {Promise<string>} - Returns a promise that resolves to the download status.
 */
async function downloadEmployeeFile(secret, downloadFolder) {
    let browser, page;

    try {
        // Start Puppeteer browser
        [browser, page] = await startLiveIQ(secret, downloadFolder);

        // Navigate to the page where the employee export can be triggered
        await page.goto('https://liveiq.subway.com/Labour/EmployeeExport', { waitUntil: 'networkidle2' });

        // Wait for the export button and click it
        await page.waitForSelector('#exportEmployees');
        await page.click('#exportEmployees');

        // Handle any popups if necessary
        // Example: Waiting for a confirmation popup and clicking OK
        // await page.waitForSelector('#confirmPopup');
        // await page.click('#confirmOkBtn');

        // Check if the download is finished
        const downloadStatus = await checkIfDownloadFinished(downloadFolder, 'LiveIQ_Employee_Export.xlsx');

        return downloadStatus;
    } catch (error) {
        console.error(`Error downloading employee file: ${error}`);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}





/**
 * Downloads a report from a specific web page.
 * 
 * @param {Object} secret - Contains the credentials and other secrets.
 * @param {string} downloadFolder - The folder where the report file should be downloaded.
 * @param {string} startDate - The start date for the report.
 * @param {string} endDate - The end date for the report.
 * @returns {Promise<string>} - Returns a promise that resolves to the download status.
 */
async function downloadReport(secret, downloadFolder, startDate, endDate) {
    let browser, page;

    try {
        // Start Puppeteer browser
        [browser, page] = await startLiveIQ(secret, downloadFolder);

        // Navigate to the page where the report can be generated
        await page.goto('https://liveiq.subway.com/Reporting/Forms/ReportViewer.aspx?entityId=x8Bs-cIw6-2nddHfrRJVtw%7e%7e&entityType=group&extractReportId=favGJcmd3RU%7e&factor=510');

        // Configure the report parameters (start date and end date)
        await page.waitForSelector('#rptViewer_ctl00_ctl03_txtValue');
        const inputStartDate = await page.$('#rptViewer_ctl00_ctl03_txtValue');
        await inputStartDate.click({ clickCount: 3 });
        await inputStartDate.press('Backspace');
        await inputStartDate.type(startDate);

        await page.waitForSelector('#rptViewer_ctl00_ctl05_txtValue');
        const inputEndDate = await page.$('#rptViewer_ctl00_ctl05_txtValue');
        await inputEndDate.click({ clickCount: 3 });
        await inputEndDate.press('Backspace');
        await inputEndDate.type(endDate);

        // Click the "View report" button
        await page.waitForSelector('#rptViewer_ctl00_ctl00');
        await page.click('#rptViewer_ctl00_ctl00');

        // Wait for any necessary elements to load (e.g., report data)
        // You may need to adjust this based on the actual behavior of the website

        // Handle report export (e.g., select CSV and click export)
        // Example:
        // await page.waitForSelector('#rptViewer_ctl01_ctl05_ctl00');
        // await page.select('#rptViewer_ctl01_ctl05_ctl00', 'CSV');
        // await page.click('#rptViewer_ctl01_ctl05_ctl01');

        // Check if the report download is finished
        const downloadStatus = await checkIfDownloadFinished(downloadFolder, 'AccountingReport_Simple.csv');

        return downloadStatus;
    } catch (error) {
        console.error(`Error downloading report: ${error}`);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}





async function importFileIntoLiveIQ(secret, file) {
    let browser, page;

    try {
        // Start Puppeteer browser
        browser = await puppeteer.launch({
            headless: false, // Set to false if you need a visual browser for debugging
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        page = await browser.newPage();
        console.log('Puppeteer - Configure Download folder');

        // Configure download behavior
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: '/tmp', // Update with your desired download folder
        });

        await page.setViewport({ width: 1366, height: 768 });
        await page.setCacheEnabled(false);
        console.log('Puppeteer - Go to https://liveiq.subway.com/');
        await page.goto('https://liveiq.subway.com/', { waitUntil: 'networkidle2' });

        // Login
        console.log(`Puppeteer - Wait for Selector #signInName`);
        await page.waitForSelector('#signInName');
        console.log(`Puppeteer - Found Selector #signInName`);
        await page.click('#signInName');
        await page.keyboard.type(secret.username);
        await page.click('#password');
        await page.keyboard.type(secret.password);
        console.log('Puppeteer - Click on login Button');
        await page.click('#next');

        console.log('Puppeteer - Wait for Selector #page-title');
        await page.waitForSelector('#page-title');
        console.log('Puppeteer - Found Selector #page-title');

        // Navigate to file import page
        console.log('Puppeteer - Now open https://liveiq.subway.com/Labour/EmployeeExport');
        await page.goto('https://liveiq.subway.com/Labour/EmployeeExport', { waitUntil: 'networkidle2' });

        console.log(`Puppeteer - Wait for Selector #fileUpload`);
        await page.waitForSelector('#fileUpload');

        // Find the file upload input and upload the file
        console.log('Puppeteer - Find FileChooser');
        const fileInputElement = await page.$("[name='files[]']");
        console.log(`Puppeteer - Upload file ${file}`);
        await fileInputElement.uploadFile(file);

        // Wait for the "Are you sure?" popup
        console.log('Puppeteer - Wait for areYouSure Popup to appear');
        await page.waitForXPath('//*[@id="areYouSure"][@class="white-popup mfp-with-anim"]');

        // Handle the popup
        console.log(`Puppeteer - Popup should be open`);
        console.log(`Puppeteer - Popup - Wait for selector validateOkBtn`);
        const popup = (await browser.pages())[1]; // Get the latest popup page
        await popup.waitForSelector('#validateOkBtn');
        console.log(`Puppeteer - Popup - Click on Button validateOkBtn`);
        await popup.click('#validateOkBtn');

        // Wait for any additional actions (e.g., rows added) if needed
        // You may need to adjust this based on the actual behavior of the website

        // Click the "Save" button or perform any other necessary actions
        // You may need to adjust this based on the actual behavior of the website

        // Close the browser
        await browser.close();
    } catch (error) {
        console.error(`Error importing file: ${error}`);
        throw error;
    }
}


module.exports = {
    startLiveIQ,
    checkIfDownloadFinished,
    downloadEmployeeFile,
    downloadReport,
    importFileIntoLiveIQ
};
