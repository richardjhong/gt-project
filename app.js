require('dotenv').config()
var express = require('express');
var app = express();
const google = require('googleapis');
const NodeCache = require( "node-cache" );

const OAuth2 = google.auth.OAuth2;
const myCache = new NodeCache();

let savedTokens

const googleAuth = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.DOMAIN + '/connect/callback'
)

const GOOGLE_SCOPE = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.readonly'
];

app.get('/connect', function(req, res) {
    var url = googleAuth.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: GOOGLE_SCOPE,
    });
    res.redirect(url);
})

app.get('/connect/callback', function(req, res) {
  googleAuth.getToken(req.query.code, function(err, tokens) {
    if (err) {
      res.status(500).json({ err22: err })
    } else {
      googleAuth.setCredentials(tokens)
      // console.log('tokens: ', tokens)
      res.redirect('../../calendar-events')
    }
  })
})

app.get('/calendar-events', function (req, res2) {
  let stringifiedevents
  myCache.get('storedEvents', function(err, value) {
    if (!err) {
      if (value === undefined) {
        const calendar = google.calendar({ version: 'v3', auth: googleAuth })
        let criterion = {
          calendarId: 'primary',
          timeMin: req.query.startDate || (new Date()).toISOString(),
          maxResults: 5,
          singleEvents: true,
          orderBy: 'startTime',
        }

        if (req.query.endDate) {
          criterion['timeMax'] = req.query.endDate
        }

        calendar.events.list({ ...criterion }, (err, res) => {
          if (err) return console.log('The API returned an error: ' + err);
          const events = res.items;
          let resultObj = {
            status: 200,
            query: {
              startDate: req.query.startDate,
              endDate: req.query.endDate || null
            },
            results: {
              ...events
            }
          }
          stringifiedevents = resultObj
          myCache.set('storedEvents', resultObj, function(err, success) {
            if (!err && success) {
              console.log('Events have been saved in cache!')
            } else {
              console.log(err)
            }
          })
          res2.send(stringifiedevents)
        })
      } else {
        res2.send(value)
      }
    }
  })
})

app.get('/', function (req, res) {
   if (Object.keys(googleAuth.credentials).length === 0) {
     res.redirect('/connect')
   }
   res.redirect('/calendar-events')
   // res.send('Hello world!')
});

app.listen(3007, function () {
    console.log('Example app listening on port 3007!');
    console.log('http://localhost:3007/');
});
