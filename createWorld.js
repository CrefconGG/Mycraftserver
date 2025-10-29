// createWorld.js
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const { randomUUID } = require('crypto');

const TABLE = process.env.DDB_TABLE;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    
    let worldId = body.worldId || (body.s3Key && body.s3Key.split('/').pop()) || 'world';
    
    // เพิ่ม unique suffix จาก UUID
    const uniqueSuffix = randomUUID().substring(0, 8);
    
    
    if (worldId.endsWith('.zip')) {
      worldId = `${worldId.replace(/\.zip$/, '')}-${uniqueSuffix}`;
    } else {
      worldId = `${worldId}-${uniqueSuffix}`;
    }

    // สร้าง item สำหรับ DynamoDB
    const item = {
      worldId,
      displayName: body.displayName || worldId,
      s3Key: body.s3Key || null,
      status: 'STOPPED',
      lastModified: new Date().toISOString()
    };

    // บันทึกลง DynamoDB
    await ddb.put({ TableName: TABLE, Item: item }).promise();

    return {
      statusCode: 201,
      body: JSON.stringify(item)
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
