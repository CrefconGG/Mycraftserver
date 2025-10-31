// listWorlds.js

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.DDB_TABLE;

exports.handler = async () => {
  try {
    const data = await ddb.scan({ TableName: TABLE }).promise();
    const items = data.Items || [];
    return { statusCode: 200, body: JSON.stringify(items) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};