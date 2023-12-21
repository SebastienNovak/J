// we pull only secrets client
const SecretsManager = require("aws-sdk/clients/secretsmanager");
const region = 'ca-central-1';

const client = new SecretsManager({
  region,
});

async function getSecret(secretName) {

  /* this will return promise,
   if you add .promise() at the end aws-sdk calls will return a promise
   no need to wrap in custom one
   */
  const response = await client
                          .getSecretValue({ SecretId: secretName })
                            .promise();

  //what is left is to return the right data
  if ("SecretString" in response) {
    return response.SecretString;
  }

  return Buffer.from(response.SecretBinary, "base64").toString("ascii");
}

module.exports = { getSecret };