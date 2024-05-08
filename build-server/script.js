const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const { Storage } = require('@google-cloud/storage');
const storage = new Storage({ keyFilename: 'key.json' });

const Redis = require('ioredis');

// Add Redis server address here
// const publisher = new Redis('');
const PROJECT_ID = process.env.PROJECT_ID;
const publishLog = (log) => {
    publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }))
}

async function init() {
    console.log("Executing script.js");
    publishLog('Build Started ...');
    const outDirPath = path.join(__dirname, 'output');

    const p = exec(`cd ${outDirPath} && npm install && npm run build`);

    p.stdout.on('data', (data) => {
        console.log(data.toString());
        publishLog(data.toString());
    })
    p.stderr.on('data', (data) => {
        console.log("Error", data.toString());
        publishLog(`Error: ${data.toString()}`);
    })
    p.stdout.on('close', async () => {
        console.log("Build completed");
        publishLog("Build completed");
        const buildFolderPath = path.join(__dirname, 'output', 'build');
        const buildFolderContents = fs.readdirSync(buildFolderPath, { recursive: true });

        publishLog("Pushing files to cloud storage ...");
        for (const file of buildFolderContents) {
            const filePath = path.join(buildFolderPath, file);
            if (fs.lstatSync(filePath).isDirectory()) continue;

            console.log("Uploading: ", filePath);
            await storage.bucket('vercel-clone-project').upload(filePath, {
                destination: `__outputs/${PROJECT_ID}/${file}`
            })
            publishLog(`Uploading: ${file}`);
            console.log("Uploaded: ", filePath);
        }
        publishLog("Upload completed !");

        console.log("Done ...");
        publishLog("Your site is live !");
        publisher.quit();
    })
}

init()