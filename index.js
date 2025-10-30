// index.js

const launch = require('./launchWorld');
const create = require('./createWorld');
const stop = require('./stopWorld');
const list = require('./listWorlds');
const edit = require('./editWorld');
const presign = require('./presignUpload');

exports.handler = async (event) => {
    const httpMethod = event.httpMethod || event.requestContext?.http?.method;
    const resource = event.resource || event.rawPath;

    console.log(`Processing ${httpMethod} request for resource: ${resource}`);

    const path = resource.replace('/test1', '');

    try {
        if (path === '/worlds' && httpMethod === 'POST') {
            return await create.handler(event);
        } else if (path === '/worlds/launch' && httpMethod === 'POST') {
            return await launch.handler(event);
        } else if (path === '/worlds/stop' && httpMethod === 'POST') {
            return await stop.handler(event);
        } else if (path === '/worlds' && httpMethod === 'GET') {
            return await list.handler(event);
        } else if (path === '/worlds/edit' && httpMethod === 'PUT') {
            return await edit.handler(event);
        } else if (path === '/worlds/upload' && httpMethod === 'POST') {
            return await presign.handler(event);
        } else if (path === '/worlds/delete' && httpMethod === 'DELETE') {
            return await presign.handler(event);
        }

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
