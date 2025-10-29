// createWorld.js
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const TABLE = process.env.DDB_TABLE;
const { randomUUID } = require('crypto');
exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    // expect body: { worldId: 'world-123.zip' OR worldId: 'world-123', displayName: 'My World', uploader: 'jirat', s3Key: 'worlds/..' }
    const worldId = body.worldId || (body.s3Key && body.s3Key.split('/').pop());
    const uniqueSuffix = randomUUID().substring(0, 8);
    if (!worldId.endsWith('.zip')) {
      worldId = `${worldId}-${uniqueSuffix}.zip`;
    } else {
      const baseName = worldId.replace(/\.zip$/, '');
      worldId = `${baseName}-${uniqueSuffix}.zip`;
    }
    
    
    const item = {
      worldId,
      displayName: body.displayName || worldId,
      s3Key: body.s3Key,
      status: 'STOPPED',
      lastModified: new Date().toISOString(),
      lastModified: null
    };

    await ddb.put({ TableName: TABLE, Item: item }).promise();

    return { statusCode: 201, body: JSON.stringify(item) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};