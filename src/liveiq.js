const aws = require('aws-sdk');
const S3 = new aws.S3();
const os = require('os');
const DOWNLOAD_FOLDER = `${os.tmpdir()}/download`;

// Import from new utility modules
const { getLatestFileKey, getObjectContent, saveEmployeesToS3 } = require('./utils/s3helpers.js');
const { getSecrets, handleError } = require('./utils/utilityHelpers.js');
const { getAirtableBase, retrieveAirtableData, updateAirtableRecords, createAirtableRecords } = require('./utils/airtableHelpers.js');
const { processEmployeeFile } = require('./utils/employeeDataHelpers.js');

const { parseCSV } = require('./handlers/csvHandler.js'); // CSV operations
const { downloadReport  } = require("./services/puppeteerService.js"); // Puppeteer operations
const { getSecret } = require('./getSecret');


module.exports.getEmployees = async event => {
    try {
        // Get the latest file from S3
        const lastFileKey = await getLatestFileKey(S3, "liveiq-employees-json", 'employees/');
        
        // Get content of the latest file
        const lastFileContent = await getObjectContent(S3, "liveiq-employees-json", lastFileKey);

        // Get secrets
        const { secret, secretApiKey } = await getSecrets();

        // // Get Airtable base
        const base = getAirtableBase(secretApiKey.apiKey);

        // Retrieve current data from Airtable
        const { employeesActual, stores } = await retrieveAirtableData(base);

        // Process the file
        const { employeeToUpdate, employeeToCreate } = await processEmployeeFile(lastFileContent, stores, employeesActual, secret, DOWNLOAD_FOLDER);

        // Save updated employees to S3
        await saveEmployeesToS3(S3, employeeToUpdate, employeeToCreate);

        // Update and create records in Airtable
        await updateAirtableRecords(base, employeeToUpdate);
        await createAirtableRecords(base, employeeToCreate);

        return employeeToUpdate;

    } catch (error) {
        console.error("Stack Trace:", error.stack);
        return {
            statusCode: 502,
            body: {
                "error": error,
                "errorDetails": error.message,
                "stackTrace": error.stack
            }
        };
    }
}

module.exports.putEmployees = async event => {
    try {
        const employee = event;

        // Fetch secrets
        const secret = await getSecret('liveiq');

        // Remove this line, as it references updateExcelFile
        const excelFilePath = await updateExcelFile(employee, secret);

        // Import file to LiveIQ
        await importFile(secret, excelFilePath);

        return "success";
    } catch (error) {
        console.error("Stack Trace:", error.stack);
        return handleError(error, "putEmployees");
    }
};

module.exports.getReporting = async event => {
    try {
        const { start_date, end_date } = event;

        // Fetch secrets
        const secret = await getSecret('liveiq');

        // Generate report
        await downloadReport(secret, DOWNLOAD_FOLDER, start_date, end_date);

        // Parse CSV data
        const reportData = await parseCSV(`${DOWNLOAD_FOLDER}/AccountingReport_Simple.csv`);

        return {
            statusCode: 200,
            body: reportData,
            length: reportData.length
        };
    } catch (error) {
        console.error("Stack Trace:", error.stack);
        return handleError(error, "getReporting");
    }
};