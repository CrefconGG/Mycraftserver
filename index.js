// index.js

const launch = require('./launchWorld');
const create = require('./createWorld');
const stop = require('./stopWorld');
const list = require('./listWorlds');
const edit = require('./editWorld');
const presign = require('./presignUpload');

exports.handler = async (event) => {
    // 1. ดึงข้อมูล Path และ Method จาก API Gateway Event
    const resource = event.resource; // เช่น '/worlds/launch'
    const httpMethod = event.httpMethod; // เช่น 'POST', 'GET', 'DELETE'

    console.log(`Processing ${httpMethod} request for resource: ${resource}`);

    try {
        // 2. ใช้ switch หรือ if/else ในการ Map ตรรกะ
        if (resource === '/worlds' && httpMethod === 'POST') {
            return await create.handler(event);
        } else if (resource === '/worlds/launch' && httpMethod === 'POST') {
            return await launch.handler(event);
        } else if (resource === '/worlds/stop' && httpMethod === 'POST') {
            return await stop.handler(event);
        } else if (resource === '/worlds' && httpMethod === 'GET') {
            return await list.handler(event);
        } else if (resource === '/worlds/edit' && httpMethod === 'PUT') {
            return await edit.handler(event);
        } else if (resource === '/worlds/upload' && httpMethod === 'POST') {
            return await presign.handler(event);
        }
        
        // กรณีที่ไม่ตรงกับ Path ใดๆ
        return {
            statusCode: 404,
            body: JSON.stringify({ message: `Resource Not Found: ${resource}` })
        };

    } catch (error) {
        console.error("Execution Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};