const os = require("os");
const fs = require("fs");
const ExcelJS = require("exceljs");
const aws = require("aws-sdk");
const S3 = new aws.S3();
const fsPromises = fs.promises;
const uuid = require('uuid');
// const puppeteer = require("puppeteer");
const puppeteer = require("puppeteer");
const chromium = require("@sparticuz/chromium");

async function startLiveIQ(secret, folder){
    const DOWNLOAD_FOLDER = folder;
    const USERNAME_SELECTOR = '#signInName';
    const PASSWORD_SELECTOR = '#password';
    const CTA_SELECTOR = '#next';
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: false, // Set to false if you need a visual browser for debugging
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        console.log('Puppeteer - Configure Download folder');

        const client = await page.target().createCDPSession()
        await client.send('Page.setDownloadBehavior', {
          behavior: 'allow',
          downloadPath: DOWNLOAD_FOLDER,
        })
        // await page._client.send('Page.setDownloadBehavior', {
        //     behavior: 'allow',
        //     downloadPath: DOWNLOAD_FOLDER
        // });
        await page.setViewport({width: 1366, height: 768});
        await page.setCacheEnabled(false);
        console.log('Puppeteer - Goto https://liveiq.subway.com/');
        await page.goto('https://liveiq.subway.com/', {waitUntil: 'networkidle2'});
        await page.cookies();

        console.log(`Puppeteer - Wait for Selector ${USERNAME_SELECTOR}`);
        await page.waitForSelector(USERNAME_SELECTOR);
        console.log(`Puppeteer - Found Selector ${USERNAME_SELECTOR}`);
        await page.click(USERNAME_SELECTOR);
        await page.keyboard.type(secret.username);
        await page.click(PASSWORD_SELECTOR);
        await page.keyboard.type(secret.password);
        console.log('Puppeteer - Click on login Button');
        await page.click(CTA_SELECTOR);
        console.log('Puppeteer - Wait for Selector #page-title');
        await page.waitForSelector('#page-title');
        console.log('Puppeteer - Found Selector #page-title');
        return [browser, page];
    }catch (e) {
         throw e;
    }
}


async function checkIfDownloadFinish(folder, file, maxRetries = 5){
    if (maxRetries <= 0) {
        console.log("Max retries reached, file not found.");
        return "file_not_downloaded";
    }

    console.log(`Checking for file: ${file}, attempts remaining: ${maxRetries}`);
    let listFiles = await fsPromises.readdir(folder);
    console.log("Files in directory:", listFiles);
    
    let el = listFiles.find(a =>a.includes(file));
    if(el && el.length>0){
        return "file_downloaded";
    }else{
        await new Promise(r => setTimeout(r, 2000));
        await checkIfDownloadFinish(folder, file, maxRetries - 1);
    }
}

async function getFile(secret, folder){
    let browser, page;
    try{
        [browser, page] = await startLiveIQ(secret, folder);
        console.log('Puppeteer - We are logged in. Continue!');
        console.log('Puppeteer - Now open https://liveiq.subway.com/Labour/EmployeeExport')
        await page.goto('https://liveiq.subway.com/Labour/EmployeeExport', {waitUntil: 'networkidle2'});
        console.log(`Puppeteer - Wait for Selector #exportEmployees`);
        await page.waitForSelector('#exportEmployees');
        console.log('Puppeteer - Click on button export');
        await page.click('#exportEmployees');

        console.log('Puppeteer wait noPayrollNumbers Popup should appear');
        //il y a un popup qui s ouvre
        await page.waitForXPath('//*[@id="noPayrollNumbers"][@class="white-popup mfp-with-anim"]');

        console.log(`Puppeteer - Popup should be open`);

        console.log(`Puppeteer - Popup - Wait for selector validateOkBtn`);
        const button = await page.$(`#validateOkBtn`);
        await page.waitForSelector('#validateOkBtn');
        console.log(`Puppeteer - Popup - Click on Button validateOkBtn`);
        await page.click('#validateOkBtn');
        console.log(`Puppeteer - Downloading file wait 1 sec`);
        await new Promise(r => setTimeout(r, 1000));
        console.log(`Puppeteer - Check if download finished`);
        await checkIfDownloadFinish(folder, 'LiveIQ_Employee_Export.xlsx');
        console.log(`Puppeteer - file downloaded`);

    } catch (e) {
        console.error('Error occurred:', e);
        await page.screenshot({ path: 'error-screenshot.png' });
    }

}

function delay(time) {
   return new Promise(function(resolve) {
       setTimeout(resolve, time)
   });
}


async function getReport(secret, folder, start_date, end_date){
    try{
        // step to do on liveiq to get the report...
        //login to liveiq
        //go to https://liveiq.subway.com/Reporting/Forms/ReportViewer.aspx?entityId=x8Bs-cIw6-2nddHfrRJVtw%7e%7e&entityType=group&extractReportId=favGJcmd3RU%7e&factor=510
        //put date debut //*[@id="rptViewer_ctl00_ctl03_txtValue"]
        //wait reload
        //put date end //*[@id="rptViewer_ctl00_ctl05_txtValue"]
        //click //*[@id="rptViewer_ctl00_ctl00"]
        //wait reload
        // select CSV *[@id="rptViewer_ctl01_ctl05_ctl00"]
        // click on export //*[@id="rptViewer_ctl01_ctl05_ctl01"]
        //download a csv

        // #rptViewer_ctl00_ctl03_txtValue
        console.log('Open LiveIQ')
        let  [browser, page] = await startLiveIQ(secret, folder);
        console.log('playwright - We are logged in. Continue!');
        console.log('playwright - Now open https://liveiq.subway.com/Reporting/Forms/ReportViewer.aspx?entityId=x8Bs-cIw6-2nddHfrRJVtw%7e%7e&entityType=group&extractReportId=favGJcmd3RU%7e&factor=510')
        await page.goto('https://liveiq.subway.com/Reporting/Forms/ReportViewer.aspx?entityId=x8Bs-cIw6-2nddHfrRJVtw%7e%7e&entityType=group&extractReportId=favGJcmd3RU%7e&factor=510');
        console.log(`playwright - Wait for Selector #rptViewer_ctl00_ctl03_txtValue`);
        await page.waitForSelector('#rptViewer_ctl00_ctl03_txtValue');
        console.log("click on #rptViewer_ctl00_ctl05_txtValue and put date")
        let inputEndDate2 = await page.$('#rptViewer_ctl00_ctl05_txtValue');
        await inputEndDate2.click({clickCount: 3});
        await inputEndDate2.press('Backspace');
        await inputEndDate2.type(end_date);


        console.log("click on rptViewer_ctl00_ctl03_txtValue and put date")



        let inputStartDate = await page.$('#rptViewer_ctl00_ctl03_txtValue');
        await inputStartDate.click({clickCount: 3});
        await inputStartDate.press('Backspace');
        await inputStartDate.type(start_date);
        await inputEndDate2.click({clickCount: 3});


        console.log("playwright - Wait for Selector #rptViewer_ctl00_ctl00")

        await page.waitForSelector('#rptViewer_ctl00_ctl00');

        console.log("Click on View report")
        try{
            await page.click('#rptViewer_ctl00_ctl00');
        }catch (e) {
            console.log(e)
        }
        try {
        console.log('Je select CSV!!!')

        await page.waitForSelector('#rptViewer_ctl01_ctl05_ctl00');

        }catch (e) {
            console.log(e)
        }
        try {
       console.log("select CSV on #rptViewer_ctl01_ctl05_ctl00")
        await page.select('#rptViewer_ctl01_ctl05_ctl00', 'CSV');

        }catch (e) {
            console.log(e)
        }



        try{
            console.log("Click on View report")
            await page.click('#rptViewer_ctl01_ctl05_ctl01')
            console.log(`Puppeteer - Downloading file wait 1 sec`);
            await new Promise(r => setTimeout(r, 1000));
            console.log(`Puppeteer - Check if download finished`);
            await checkIfDownloadFinish(folder, 'AccountingReport_Simple.csv');
            console.log(`Puppeteer - file downloaded`);
        }catch (e) {
            console.log(`error ${e}`)
            console.log(e)
        }finally {
             await browser.close();
        }
    }catch (e) {
        throw e;
    }

}



async function importFile(secret, file){
    try{
        console.log(`Current directory: ${process.cwd()}`);
        let  [browser, page] = await startLiveIQ(secret, '/tmp');
        await page.goto('https://liveiq.subway.com/Labour/EmployeeExport', {waitUntil: 'networkidle2'});
        console.log(`Puppeteer - Wait for Selector #fileUpload`);
        await page.waitForSelector('#fileUpload');
        console.log('Puppeteer - find FileChooser')
        let up = await page.$("[name='files[]']");
        console.log(`Puppeteer - Upload file ${file}`)
        await up.uploadFile(file);
        console.log('Puppeteer wait areYouSure Popup appear')
        await page.waitForXPath('//*[@id="areYouSure"][@class="white-popup mfp-with-anim"]');
        //il y a un popup qui s ouvre
        console.log(`Puppeteer - Popup should be open`);
        const pages = await browser.pages(); // get all open pages by the browser
        const popup = pages[pages.length - 1];
        const popup_content = await popup.content();
        console.log(`Puppeteer - Popup - Wait for selector validateOkBtn`);
        const button = await popup.$(`#validateOkBtn`);
        await popup.waitForSelector('#validateOkBtn');
        console.log(`Puppeteer - Popup - Click on Button validateOkBtn`);
        await popup.click('#validateOkBtn');
        console.log('Wait for rows added')
        await page.waitForSelector('.employeeRow');
        console.log('Now I click the save button')
        await page.click('#saveImportButton');
        console.log('Puppeteer wait areYouSure Popup appear')
        await page.waitForXPath('//*[@id="areYouSure"][@class="white-popup mfp-with-anim"]');
        //il y a un popup qui s ouvre
        console.log(`Puppeteer - Popup should be open`);
        console.log(`Puppeteer - Popup - Wait for selector saveToDBbtn`);
        const buttonSaveToDb = await popup.$(`#saveToDBbtn`);
        await popup.waitForSelector('#saveToDBbtn');
        const screenshot = await popup.screenshot();
        const key = `import/saveToDBbtn_printscreen_${uuid.v4()}`
        const params = { Bucket: "liveiq-employees-json", Key: key, Body: screenshot };
        await S3.putObject(params).promise();

        console.log(`Puppeteer - Popup - Click on Button saveToDBbtn`);
        await popup.evaluate('pxtech.labour.employeeimportexport.saveToDB()');
        // await popup.click('#saveToDBbtn');
        console.log('Finish User was edited')
    }catch (e) {
        console.error('Error occurred:', e);
    }
}

module.exports = { startLiveIQ, importFile, getFile, getReport };