const aws = require('aws-sdk');
const S3 = new aws.S3();
const ExcelJS = require('exceljs');
const uuid = require('uuid');



/**
 * Retrieves the latest file key from a specified S3 bucket.
 * 
 * @param {aws.S3} s3 The AWS S3 instance.
 * @param {string} bucket The name of the S3 bucket.
 * @param {string} prefix The prefix (folder path) inside the bucket.
 * @returns {string|null} The key of the latest file or null if no file is found.
 */

async function getLatestFileKey(s3, bucket, prefix) {
    const params = {
        Bucket: bucket,
        Delimiter: '/',
        Prefix: prefix
    };

    const data = await s3.listObjects(params).promise();
    let latestKey;
    let latestDate = new Date(0); // Epoch
    data.Contents.forEach(item => {
        if (item.LastModified > latestDate) {
            latestKey = item.Key;
            latestDate = item.LastModified;
        }
    });
    return latestKey;
}



/**
 * Gets the content of a specified object in S3.
 * 
 * @param {aws.S3} s3 The AWS S3 instance.
 * @param {string} bucket The name of the S3 bucket.
 * @param {string} key The key of the object in the bucket.
 * @returns {Object} Parsed JSON object from the S3 object's body.
 * @throws Will throw an error if the object cannot be retrieved or parsed.
 */

async function getObjectContent(s3, bucket, key) {
    const file = await s3.getObject({ Bucket: bucket, Key: key }).promise();
    return JSON.parse(file.Body.toString());
}



/**
 * Saves updated employees to S3.
 *
 * @param {aws.S3} s3 - The AWS S3 instance.
 * @param {Object[]} employeeToUpdate - Array of employees to update.
 * @param {Object[]} employeeToCreate - Array of employees to create.
 * @returns {Promise<void>}
 */

async function saveEmployeesToS3(s3, employeeToUpdate, employeeToCreate) {
    try {
        const fileParams = {
            Bucket: "liveiq-employees-json",
            Key: `employees/${uuid.v4()}`,
            Body: JSON.stringify([...employeeToUpdate, ...employeeToCreate]),
            ContentType: 'application/json; charset=utf-8'
        };
        await s3.putObject(fileParams).promise();
    } catch (error) {
        console.error("Error saving employees to S3:", error);
        throw error; // Re-throw the error for upstream handling
    }
}

module.exports = {
    getLatestFileKey,
    getObjectContent,
    saveEmployeesToS3
};
