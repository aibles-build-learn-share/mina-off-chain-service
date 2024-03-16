# Worker

## 1. About the project

## 2. Development

## 2.1. Set up the environment
Recommend: node 10
Required:

```
$ sudo apt-get install gcc-c++
$ sudo npm install -g node-gyp
```

In the root folder. </br>
Copy and set environment variables in `.env` file.

```
$ cp .env.example .env
```

Note: you may also need config some variables in the `env_config` table to run the app up.

## 2.2. Install and build

Install the dependencies and build the project:

```
$ make all
```

Install the dependencies for built code:

```
$ make install
```

## 2.3. Start the services

We use the process manager [pm2](https://www.npmjs.com/package/pm2) to up the services. </br>
For eth's:

```
$ pm2 start app_common.json
$ pm2 start app_eth.json
```
UPDATE FILE README WORKER
