import {spawn} from 'node:child_process';
import {startNotificationWorker} from './notification-worker.mjs';
const server=spawn(process.execPath,['server.js'],{stdio:'inherit',env:process.env});const stop=startNotificationWorker();
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{stop();server.kill(signal)});
server.on('exit',code=>{stop();process.exit(code??1)});
