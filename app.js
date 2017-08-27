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
        
        res.render('index', { 
            title: title,
            tasks: reply
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

// start the http server
app.listen(server_port, server_hostname, 0, () => {
    console.log(`Server started on port ${server_port} ...`);
});

module.exports = app;
