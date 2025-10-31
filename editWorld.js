const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.DDB_TABLE;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const worldId = body.worldId;
    const displayName = body.displayName;

    if (!worldId || !displayName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing worldId or displayName' }),
      };
    }

    await ddb
      .update({
        TableName: TABLE,
        Key: { worldId },
        UpdateExpression: 'SET #dn = :newName, lastModified = :now',
        ExpressionAttributeNames: { '#dn': 'displayName' },
        ExpressionAttributeValues: {
          ':newName': displayName,
          ':now': new Date().toISOString(),
        },
      })
      .promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Display name updated successfully' }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
