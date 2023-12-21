const _ = require('lodash');
const ExcelJS = require('exceljs');
const fsPromises = require("fs").promises;
const path = require('path');


/**
 * Checks if the payroll number is valid.
 *
 * @param {string} payrollNumber - The payroll number to validate.
 * @returns {boolean} - True if the payroll number is valid, false otherwise.
 */

function isValidPayrollNumber(payrollNumber) {
    return /^([0-9]+-)*([0-9]+)$/.test(payrollNumber);
}



/**
 * Creates an employee object from a row of data.
 *
 * @param {Object[]} row - Array representing a row of data from the Excel sheet.
 * @param {Object[]} stores - Array of stores data.
 * @returns {Object} - The constructed employee object.
 */

function createEmployeeObject(row, stores) {
    const storeEmployee = stores.find(s => s["store_id"] === row.values[42]);

    return {
        "LiQ - Payroll Number": row.values[2] || null,
        "LiQ - First Name✏️": row.values[4] || null,
        "LiQ - Last Name✏️": row.values[6] || null,
        "LiQ - Date Of Birth✏️": row.values[8] ? new Date(`${row.values[8]} 13:00:00`).toISOString() : null,
        "LiQ - Address Line 1✏️": row.values[9] || null,
        "LiQ - Address Line 2✏️": row.values[10] || null,
        "LiQ - Address Town✏️": row.values[11] || null,
        "LiQ - Province✏️": row.values[12] || null,
        "LiQ - Address Post Code✏️": row.values[13] || null,
        "LiQ - Home Phone✏️": row.values[14] || null,
        "LiQ - Cell Phone✏️": row.values[15] || null,
        "LiQ - Email✏️": row.values[16] || null,
        "LiQ - Hired Date": row.values[17] ? new Date(`${row.values[17]} 13:00:00`).toISOString() : null,
        "LiQ - Position": row.values[18] ? [row.values[18]] : [],
        "LiQ - Subway Id": row.values[20] || null,
        "LiQ - Salaried Employee": row.values[21] ? !!row.values[21] : false,
        "LiQ - Separation date": row.values[22] ? new Date(`${row.values[22]} 13:00:00`).toISOString() : null,
        "LiQ - Emergency 1 - Name✏️": row.values[23] || null,
        "LiQ - Emergency 1 - Relationship✏️": row.values[24] || null,
        "LiQ - Emergency 1 - Home Phone Number✏️": row.values[25] || null,
        "LiQ - Emergency 1 - Mobile Phone Number✏️": row.values[26] || null,
        "LiQ - Emergency 2 - Name✏️": row.values[27] || null,
        "LiQ - Emergency 2 - Relationship✏️": row.values[28] || null,
        "LiQ - Emergency 2 - Home Phone Number✏️": row.values[29] || null,
        "LiQ - Emergency 2 - Mobile Phone Number✏️": row.values[30] || null,
        "LiQ - Standard Rate": row.values[33] ? parseFloat(row.values[33]) : null,
        "LiQ - Standard Rate - Start Date": row.values[34] ? new Date(`${row.values[34]} 13:00:00`).toISOString() : null,
        "LiQ - Standard Rate - End Date": row.values[35] ? new Date(`${row.values[35]} 13:00:00`).toISOString() : null,
        "LiQ - Allocated Store": storeEmployee ? [storeEmployee["id"]] : [],
        "LiQ - Clerk ID": row.values[43] ? parseFloat(row.values[43]) : null,
        "LiQ - Main Store - Start Date": row.values[44] ? new Date(`${row.values[44]} 13:00:00`).toISOString() : null,
        "LiQ - Main Store End Date": row.values[45] ? new Date(`${row.values[45]} 13:00:00`).toISOString() : null,
    };
}




/**
 * Validates an employee object.
 * 
 * @param {Object} employee - The employee object to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
function isValidEmployee(employee) {
    // Example validation: checks if essential fields are present
    return employee.hasOwnProperty('payroll') && employee.hasOwnProperty('first_name') && employee.hasOwnProperty('last_name');
}




/**
 * Transforms employee data to match a specific format or structure.
 * 
 * @param {Object} employee - The raw employee data.
 * @returns {Object} - Transformed employee data.
 */
function transformEmployeeData(employee) {
    // Example transformation
    return {
        ...employee,
        fullName: `${employee["LiQ - First Name✏️"]} ${employee["LiQ - Last Name✏️"]}`,
        // Add more transformations as needed
    };
}




/**
 * Processes the employee file.
 *
 * @param {Object[]} lastFileContent - The content of the last file from S3.
 * @param {Object[]} stores - Array of stores data.
 * @param {Object[]} employeesActual - Array of current employees data.
 * @param {string} downloadFolder - The folder where the employee file is downloaded.
 * @returns {Promise<Object>} - An object containing arrays of employees to update and create.
 */

async function processEmployeeFile(lastFileContent, stores, employeesActual, downloadFolder) {
    let employeeToUpdate = [];
    let employeeToCreate = [];

    const listFiles = await fsPromises.readdir(downloadFolder);
    const workbook = new ExcelJS.Workbook();

    for (const file of listFiles) {
        await workbook.xlsx.readFile(path.join(downloadFolder, file));
        let workSheet = workbook.getWorksheet("Sheet1");

        workSheet.eachRow(function(row, rowNumber) {
            if (rowNumber > 6 && isValidPayrollNumber(row.values[2])) {
                const payrollNumber = row.values[2];
                let employee = createEmployeeObject(row, stores);
                const lastEmployeeSaved = lastFileContent.find(e => e["LiQ - Payroll Number"] === payrollNumber);
                const employeeRecord = employeesActual.find(e => e["payroll"] === payrollNumber);

                if (!lastEmployeeSaved || !employeeRecord) {
                    // New employee
                    employeeToCreate.push({"fields": employee});
                } else if (!_.isEqual(employee, lastEmployeeSaved)) {
                    // Existing employee with updates
                    employeeToUpdate.push({"id": employeeRecord["id"], "fields": employee});
                }
            }
        });
    }

    return { employeeToUpdate, employeeToCreate };
}

module.exports = {
    isValidPayrollNumber,
    createEmployeeObject,
    isValidEmployee,
    transformEmployeeData,
    processEmployeeFile
};
