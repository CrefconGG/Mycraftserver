const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const TABLE = process.env.DDB_TABLE;
const BUCKET = process.env.WORLD_BUCKET;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const { worldId } = body;

    if (!worldId) {
      return { statusCode: 400, body: 'Missing worldId' };
    }

    
    const result = await ddb.get({
      TableName: TABLE,
      Key: { worldId },
    }).promise();

    if (!result.Item) {
      return { statusCode: 404, body: 'World not found' };
    }

    const s3Key = result.Item.s3Key;

    // delete from s3
    if (s3Key) {
      await s3.deleteObject({
        Bucket: BUCKET,
        Key: s3Key,
      }).promise();
    }

    // delete from dynamoDB
    await ddb.delete({
      TableName: TABLE,
      Key: { worldId },
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Deleted ${worldId}` }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};