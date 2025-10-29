// editWorld.js

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.DDB_TABLE;

exports.handler = async (event) => {
  try {
    const worldId = event.pathParameters.worldId;
    const body = JSON.parse(event.body || '{}');
    const updates = [];
    const ExpressionAttributeValues = {};
    const ExpressionAttributeNames = {};

    if (body.displayName) {
      ExpressionAttributeNames['#dn'] = 'displayName';
      ExpressionAttributeValues[':dn'] = body.displayName;
      updates.push('#dn = :dn');
    }
    if (updates.length === 0) return { statusCode: 400, body: 'Nothing to update' };

    const updateExpr = 'SET ' + updates.join(', ');

    await ddb.update({
      TableName: TABLE,
      Key: { worldId },
      UpdateExpression: updateExpr,
      ExpressionAttributeNames,
      ExpressionAttributeValues
    }).promise();

    return { statusCode: 200, body: JSON.stringify({ message: 'Updated' }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};