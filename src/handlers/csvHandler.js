const fs = require('fs');
const csv = require('csvtojson');

/**
 * Parses a CSV file into JSON.
 * 
 * @param {string} filePath - The path to the CSV file.
 * @returns {Promise<Object[]>} - A promise that resolves to an array of objects, each representing a row in the CSV.
 */
async function parseCSV(filePath) {
    try {
        const jsonArray = await csv().fromFile(filePath);
        return jsonArray;
    } catch (error) {
        console.error('Error parsing CSV file:', error);
        throw error;
    }
}

module.exports = {
    parseCSV
};
