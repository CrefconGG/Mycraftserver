// presignUpload.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3({region: process.env.AWS_REGION});
const uuid = require('crypto').randomUUID;

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const filename = body.filename || `world-${uuid()}.zip`;
    const key = `worlds/${filename}`;

    const url = s3.getSignedUrl('putObject', {
      Bucket: process.env.WORLD_BUCKET,
      Key: key,
      Expires: 60*10, // 10 minutes
      ContentType: 'application/zip'
    });

    // write DynamoDB metadata item with status STOPPED
    // ... create item with worldId derived from filename (strip .zip)
    // Save worldId = filename without .zip
    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl: url, key })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: err.message };
  }
};
