// launchWorld.js
const AWS = require('aws-sdk');
const ec2 = new AWS.EC2({region: process.env.AWS_REGION});
const dynamodb = new AWS.DynamoDB.DocumentClient();

const INSTANCE_ID = process.env.EC2_INSTANCE_ID; // or determine dynamically

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const worldId = body.worldId;
    if (!worldId) return { statusCode: 400, body: 'worldId required' };

    // 1) Update DynamoDB: set status STARTING
    await dynamodb.update({
      TableName: process.env.DDB_TABLE,
      Key: { worldId },
      UpdateExpression: 'SET #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'STARTING' }
    }).promise();

    // 2) Tag the instance with ActiveWorld
    await ec2.createTags({
      Resources: [INSTANCE_ID],
      Tags: [{ Key: 'ActiveWorld', Value: worldId }]
    }).promise();

    // 3) Start instance
    await ec2.startInstances({ InstanceIds: [INSTANCE_ID] }).promise();
    // Optionally wait until running
    await ec2.waitFor('instanceRunning', { InstanceIds: [INSTANCE_ID] }).promise();

    // 4) update dynamo status RUNNING and ec2InstanceId
    await dynamodb.update({
      TableName: process.env.DDB_TABLE,
      Key: { worldId },
      UpdateExpression: 'SET #s = :s, ec2InstanceId = :id',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'RUNNING', ':id': INSTANCE_ID }
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Launched', worldId })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: err.message };
  }
};
