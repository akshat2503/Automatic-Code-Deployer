const express = require('express');
const { generateSlug } = require('random-word-slugs');
const { JobsClient } = require('@google-cloud/run').v2;
const { Server } = require('socket.io');
const Redis = require('ioredis');

process.env.GOOGLE_APPLICATION_CREDENTIALS = 'key.json';
const project = 'web-applications-419218';
const job = 'builder-server';
const location = 'us-central1';

const name = `projects/${project}/locations/${location}/jobs/${job}`;

const app = express();
const PORT = 9000;

// Add Redis server address here
// const subscriber = new Redis('');

const io = new Server({ cors: '*' });
io.on('connection', socket=>{
    socket.on('subscribe', channel=>{
        socket.join(channel)
        socket.emit('message', `Joined ${channel}`)
    })
})
io.listen(9001, ()=>{console.log("Socket server running at :9001")});


app.use(express.json());
app.post('/project', async (req, res) => {
    const { gitURL, slug } = req.body;
    const projectSlug = slug ? slug : generateSlug();

    // Spin container on Cloud Run
    const envs = {
        GIT_REPOSITORY_URL: gitURL,
        PROJECT_ID: projectSlug
    };

    const overrides = {
        containerOverrides: [{
            env: Object.entries(envs).map(([name, value]) => ({
                name,
                value
            }))
        }]
    }

    try {
        const runClient = new JobsClient();

        const request = {
            name,
            overrides
        };

        const [operation] = await runClient.runJob(request);
        // const [response] = await operation.promise();
        // console.log(`Cloud Run job ${job} created successfully.`);
        // console.log(response);
        res.status(200).send('Cloud Run job created successfully.');
    } catch (err) {
        console.error('Error triggering Cloud Run job:', err);
        res.status(500).send('Error triggering Cloud Run job.', err);
    }
});

const initRedisSubscribe = async ()=>{
    console.log("Subscribed to logs...")
    subscriber.psubscribe('logs:*')
    subscriber.on('pmessage', (pattern, channel, message)=>{
        io.to(channel).emit('message', message);
    })
}

initRedisSubscribe();

app.listen(PORT, () => console.log("API Server running on port:", PORT));
