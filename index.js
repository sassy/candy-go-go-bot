'use strict';

const express = require('express');
const line = require('@line/bot-sdk');
const request = require("request");
require('dotenv').config();

const PORT = process.env.PORT || 3000;
let message = '';

const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result));
});


app.get('/message', line.middleware(config), (req, res) => {
    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result));
});

const client = new line.Client(config);

function sortData(items) {
    items.sort((a, b) => {
        const dateA = new Date(a.start.dateTime);
        const dateB = new Date(b.start.dateTime);
        return dateA.getTime() < dateB.getTime() ? -1 : 1;
    });
    return items;
}

function convertLiveInfo(items) {
    const lives = [];
    const today = new Date();
    items.forEach((item) => {
        const date = new Date(item.start.dateTime)
        lives.push(
            '' + date.getFullYear() + '/' 
            + date.getMonth()+1 + '/' 
            + date.getDate() + '\n'
            + item.summary + '\n'
            + item.description
        );
    });
    return lives;
}

function getData(event) {
    let today = new Date();
    let url = 'https://www.googleapis.com/calendar/v3/calendars/4vfiijma3k6rjhm26j63tbvmgs@group.calendar.google.com/events?';
    url += 'key=AIzaSyBSv_tRfcR4vkmdXN8n2DPeIxIIzcIwnhU';
    url += '&timeMin=';
    url += today.toISOString();
    console.log(url);
    const options = {
        uri: url,
        method: 'GET',
    };
    request.get(options, (error, response, body) => {
        if (!error && response.statusCode === 200) {
            const json = JSON.parse(body);
            const items = sortData(json.items);
            const infos = convertLiveInfo(items);
            console.log(infos[0].replace(/<br>/g, '\n'));

            return client.replyMessage(event.replyToken, {
                type: 'text',
                text: infos[0].replace(/<br>/g, '\n').replace(/<\/?[a-z]*>/g, '')
            });
        } else {
            console.log(response);
        }
    });
}

function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return Promise.resolve(null);
    }

    console.log(event.message.text);
    if (event.message.text === 'スケジュール一覧') {
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'line://app/1635629817-x9o7W3qr',
        });
    } else if (event.message.text === '予約') {
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'http://www.one2one-agency.com/reserve.html',
        });
    } else {
        return getData(event);
    }
}

app.listen(PORT);
console.log(`Server running at ${PORT}`);