'use strict';
const express = require('express');
const LiveIQController = require('./src/controllers/liveiqController');
const app = express();

app.use(express.json());

app.get('/employees', LiveIQController.getEmployees);
app.post('/employees', LiveIQController.putEmployees);
app.get('/reporting', LiveIQController.getReporting);

module.exports.hello = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(
      {
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: event,
      },
      null,
      2
    ),
  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};