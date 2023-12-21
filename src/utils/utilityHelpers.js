const { getSecret } = require('../getSecret');

/**
 * Retrieves secrets from a secret management service.
 *
 * @returns {Promise<Object>} - An object containing the retrieved secrets.
 */

async function getSecrets() {
    const secretString = await getSecret('liveiq');
    const secret = JSON.parse(secretString);
    const apiKeyString = await getSecret('airtable_key');
    const secretApiKey = JSON.parse(apiKeyString);
    return { secret, secretApiKey };
}




/**
 * Handles errors and standardizes the response structure.
 * 
 * @param {Error} error - The error object.
 * @param {string} context - The context or function name where the error occurred.
 * @returns {Object} - Standardized error response object.
 */
function handleError(error, context) {
    console.error(`Error in ${context}:`, error.stack);
    return {
        statusCode: error.statusCode || 500,
        body: {
            "error": error,
            "message": error.message,
            "context": context,
            "stackTrace": error.stack
        }
    };
}

module.exports = {
    getSecrets,
    handleError
};
