const Airtable = require('airtable');



/**
 * Initializes and returns an Airtable base instance.
 *
 * @param {string} apiKey - The API key for Airtable.
 * @returns {Airtable.Base} - The Airtable base instance.
 */

function getAirtableBase(apiKey) {
    return new Airtable({ apiKey }).base('appVg4zzR64OSKJPX');
}




/**
 * Retrieves current data from Airtable.
 *
 * @param {Airtable.Base} base - The Airtable base instance.
 * @returns {Promise<Object>} - An object containing arrays of employees and stores.
 */

async function retrieveAirtableData(base) {
    let employeesActual = [];
    let stores = [];

    try {
        const employeesRecords = await base('Employees Development').select().all();
        employeesRecords.forEach(record => {
            employeesActual.push({"payroll": record.get('LiQ - Payroll Number'), "id": record.id});
        });

        const storesRecords = await base('Stores').select().all();
        storesRecords.forEach(record => {
            stores.push({"store_id": record.get('Store ID'), "id": record.id});
        });
    } catch (error) {
        console.error("Error retrieving data from Airtable:", error);
        throw error; // Re-throw the error for upstream handling
    }

    return { employeesActual, stores };
}




/**
 * Updates records in Airtable.
 *
 * @param {Airtable.Base} base - The Airtable base instance.
 * @param {Object[]} employeeToUpdate - Array of employees to update.
 * @returns {Promise<void>}
 */

async function updateAirtableRecords(base, employeeToUpdate) {
    try {
        const employeeChunk = _.chunk(employeeToUpdate, 10); // Chunk updates to batches of 10 due to Airtable limits
        for (const chunk of employeeChunk) {
            await base('Employees').update(chunk);
        }
    } catch (error) {
        console.error("Error updating records in Airtable:", error);
        throw error; // Re-throw the error for upstream handling
    }
}




/**
 * Creates records in Airtable.
 *
 * @param {Airtable.Base} base - The Airtable base instance.
 * @param {Object[]} employeeToCreate - Array of employees to create.
 * @returns {Promise<void>}
 */

async function createAirtableRecords(base, employeeToCreate) {
    try {
        const employeeChunkCreate = _.chunk(employeeToCreate, 10); // Chunk creates to batches of 10
        for (const chunk of employeeChunkCreate) {
            await base('Employees').create(chunk);
        }
    } catch (error) {
        console.error("Error creating records in Airtable:", error);
        throw error; // Re-throw the error for upstream handling
    }
}

module.exports = {
    getAirtableBase,
    retrieveAirtableData,
    updateAirtableRecords,
    createAirtableRecords
};
