'use strict';

const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const redis = require('redis');

let app = express();

const views_path = path.join(__dirname, 'views');
const public_path = path.join(__dirname, 'public');
const server_port = 3000;
const server_hostname = 'localhost';

// view engine setup
app.set('views', views_path);
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(public_path));

// Create Redis client
const redis_client = redis.createClient();

redis_client.on('connect', () => {
    console.log(`Redis server connected ...`);
});

// setup routes
app.get('/', (req, res) => {
    const title = "Task List";

    redis_client.lrange('tasks', 0, -1, (err, reply) => {
        redis_client.hgetall('call', (err, call) =>{
            res.render('index', { 
                title: title,
                tasks: reply,
                call: call
            });    
        });
    });
});

app.post('/task/add', (req, res) =>{
    const task = req.body.task;

    redis_client.lpush('tasks', task, (err, reply) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log('Task Added');
        }
        res.redirect('/');
    });
});

app.post('/task/delete', (req, res) => {
    const tasksToDel = req.body.tasks;
    console.log(`tasksToDel = ${tasksToDel}`);
    redis_client.lrange('tasks', 0, -1, (err, tasks) => {
        for(let i=0; i<tasksToDel.length; i++){
            if (tasks.indexOf(tasksToDel[i]) > -1){
                redis_client.lrem('tasks', 0, tasksToDel[i], (err, response) => {
                    console.log(err);
                });
            }
        }
        res.redirect('/');
    });
});

app.post('/call/add', (req, res) => {
    const newCall = {};

     newCall.name = req.body.name;
     newCall.company = req.body.company;
     newCall.phone = req.body.phone;
     newCall.time = req.body.time;

     redis_client.HMSET('call', 
        ['name', newCall.name, 'company', newCall.company,
         'phone', newCall.phone, 'time', newCall.time], (err, response) => {
            if (err) {
                console.log(err);
            }
            console.log(response);
            res.redirect('/');
         });
});

// start the http server
app.listen(server_port, server_hostname, 0, () => {
    console.log(`Server started on port ${server_port} ...`);
});

module.exports = app;
