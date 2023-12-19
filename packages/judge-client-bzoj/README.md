## JudgeClient of BZOJ

### How does this work?

It fetches your submission and submit it to a remote server
which provides bzoj judge, and it's `zshfoj.com` by default.

### Will there be a fee for this feature?

No, we guarantee that this feature will be free for all Hydro
users for as long as our website is up and running.

### How can I deploy a judge server by myself?

Install `judge-server-bzoj` plugin.

### How to use this plugin?

1. Install this plugin: `hydrooj install https://img.zshfoj.com/Plugins/judge-client-bzoj.zip`.  
2. Restart Hydro (`pm2 restart hydrooj`) and import problems from [this zip](https://www.miaofile.com/s/ReO2T1).
3. Restart Hydro (`pm2 restart hydrooj`) again.

And enjoy BZOJ!
