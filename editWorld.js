const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const TABLE = process.env.DDB_TABLE;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const displayName = body.displayName; // ใช้ displayName เป็นตัวอ้างอิง
    const newName = body.newName;

    if (!displayName || !newName) {
      return { statusCode: 400, body: 'Missing displayName or newName' };
    }

    // หา worldId จาก displayName ก่อน (เพราะ DynamoDB ใช้ worldId เป็น key)
    const result = await ddb.scan({
      TableName: TABLE,
      FilterExpression: '#dn = :dn',
      ExpressionAttributeNames: { '#dn': 'displayName' },
      ExpressionAttributeValues: { ':dn': displayName }
    }).promise();

    if (result.Items.length === 0) {
      return { statusCode: 404, body: 'World not found' };
    }

    const worldId = result.Items[0].worldId;

    // อัปเดตชื่อใหม่
    await ddb.update({
      TableName: TABLE,
      Key: { worldId },
      UpdateExpression: 'SET #dn = :new',
      ExpressionAttributeNames: { '#dn': 'displayName' },
      ExpressionAttributeValues: { ':new': newName }
    }).promise();

    return { statusCode: 200, body: JSON.stringify({ message: 'Updated' }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
