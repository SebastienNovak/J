const fs = require('fs');
const csv = require('csvtojson');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;



/**
 * Exports data to a CSV file.
 * 
 * @param {Object[]} data - Array of objects to be written to the CSV.
 * @param {string} filePath - The file path where the CSV will be saved.
 * @param {Object[]} headers - Array of header objects for the CSV.
 */
async function exportToCSV(data, filePath, headers) {
    const csvWriter = createCsvWriter({
        path: filePath,
        header: headers
    });

    await csvWriter.writeRecords(data);
}




/**
 * Imports data from a CSV file.
 * 
 * @param {string} filePath - The file path of the CSV file.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of objects.
 */
function importFromCSV(filePath) {
    return new Promise((resolve, reject) => {
        let results = [];
        fs.createReadStream(filePath)
            .pipe(csv.parse({ headers: true }))
            .on('error', error => reject(error))
            .on('data', row => results.push(row))
            .on('end', rowCount => resolve(results));
    });
}

module.exports = {
    exportToCSV,
    importFromCSV
};
