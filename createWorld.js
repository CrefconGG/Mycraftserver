// createWorld.js
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();

const TABLE = process.env.DDB_TABLE;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    // ใช้ worldId จาก presignUpload ถ้ามี
    let worldId = body.worldId;

    // สร้าง item สำหรับ DynamoDB
    const item = {
      worldId,
      displayName: body.displayName || worldId,
      s3Key: body.s3Key || `worlds/${worldId}.zip`,
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
