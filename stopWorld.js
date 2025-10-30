// stopWorld.js
const AWS = require('aws-sdk');
const ec2 = new AWS.EC2({region: process.env.AWS_REGION});
const ssm = new AWS.SSM({region: process.env.AWS_REGION});
const dynamodb = new AWS.DynamoDB.DocumentClient();

const INSTANCE_ID = process.env.EC2_INSTANCE_ID;
const S3_BUCKET = process.env.WORLD_BUCKET;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const worldId = body.worldId;
    if (!worldId) return { statusCode: 400, body: 'worldId required' };

    // 1) Trigger SSM RunCommand on EC2 to create backup and upload to S3
    // Requires SSMAgent and IAM role for EC2 to allow s3:PutObject
    const commands = [
      'TIMESTAMP=$(date +%Y%m%d-%H%M%S)',
      `cd /home/ec2-user/minecraft`,
      `zip -r /tmp/${worldId}-$TIMESTAMP.zip world`,
      `aws s3 cp /tmp/${worldId}-$TIMESTAMP.zip s3://${S3_BUCKET}/backups/${worldId}/`
      `aws s3 cp /tmp/${worldId}-${timestamp}.zip s3://${S3_BUCKET}/worlds/${worldId}.zip`
    ];

    await ssm.sendCommand({
      InstanceIds: [INSTANCE_ID],
      DocumentName: 'AWS-RunShellScript',
      Parameters: { commands },
    }).promise();

    // Optionally wait or poll command invocation to finish — for simplicity we wait a fixed time or poll
    // 2) Stop instance
    await ec2.stopInstances({ InstanceIds: [INSTANCE_ID] }).promise();
    await ec2.waitFor('instanceStopped', { InstanceIds: [INSTANCE_ID] }).promise();

    // 3) Update DynamoDB: set status STOPPED
    await dynamodb.update({
      TableName: process.env.DDB_TABLE,
      Key: { worldId },
      UpdateExpression: 'SET #s = :s',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: { ':s': 'STOPPED' }
    }).promise();

    return { statusCode: 200, body: 'Stopped and backed up' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: err.message };
  }
};
