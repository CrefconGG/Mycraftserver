// presignUpload.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3({ region: process.env.AWS_REGION });
const { randomUUID } = require('crypto');

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');

    // สร้าง worldId แบบเดียวกับ createWorld
    const worldId = `world-${randomUUID().substring(0, 8)}`;
    const filename = `${worldId}.zip`;
    const key = `worlds/${filename}`;

    // สร้าง presigned URL สำหรับอัปโหลดไฟล์
    const url = s3.getSignedUrl('putObject', {
      Bucket: process.env.WORLD_BUCKET,
      Key: key,
      Expires: 60 * 10, // 10 minutes
      ContentType: 'application/zip',
    });

    // ส่งกลับ worldId
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        uploadUrl: url, 
        key,
        worldId
      }),
    };
  } catch (err) {
    console.error(err);
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: err.message }) 
    };
  }
};
