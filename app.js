require('dotenv').config()
var express = require('express');
var app = express();
const google = require('googleapis');
const NodeCache = require( "node-cache" );

const OAuth2 = google.auth.OAuth2;
const myCache = new NodeCache();

const googleAuth = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.DOMAIN + '/connect/callback',
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
      //res.redirect('../../calendar-events')
    res.send('Authenticated; navigate to /calendar-events now!')
    }
  })
})

app.get('/calendar-events', function (req, res2) {
  //console.log('line 45 ', req.query.startDate, req.query.endDate)
  myCache.mget(['storedQueryvalues', 'storedEvents'], (err, value) => {
    if (!err) {
      //console.log('line 48 is being read: ', value)
      if (value.storedEvents === undefined || (req.query.startDate && req.query.startDate !== value.storedQueryvalues.startDate) ||
      (req.query.endDate && req.query.endDate !== value.storedQueryvalues.endDate) || (value.storedQueryvalues.endDate && !req.query.endDate) || !req.query.startDate) {
        const grabEventList = new Promise(resolve => {
          const calendar = google.calendar({ version: 'v3', auth: googleAuth })
          let criterion = { // object passed along into line 83
            calendarId: 'primary',
            maxResults: 5,
            singleEvents: true,
            orderBy: 'startTime',
            timeMin: req.query.startDate || new Date().toISOString(),
          }

          let resultObj = { // JSON to be sent eventually with added information that is not necessary in line 83
            status: 200,
            query: {
              startDate: criterion.timeMin,
            }
          }

          if (req.query.endDate) { // accounting for when to add an optional endDate, etc. to JSONs resultObj & criterion
            criterion['timeMax'] = req.query.endDate
            resultObj['query']['endDate'] = req.query.endDate
            myCache.set('storedQueryvalues', { startDate: req.query.startDate, endDate: req.query.endDate })
          } else {
            myCache.set('storedQueryvalues', { startDate: criterion.timeMin })
          }

          calendar.events.list({ ...criterion }, (err, res) => {
            if (err) return console.log('The API returned an error: ' + err);
            const events = res.items;
            resultObj['events'] = events

            myCache.set('storedEvents', resultObj, function(err, success) {
              if (!err && success) {
                console.log('Events have been saved in cache!')
                resolve(resultObj)
              } else {
                console.log(err)
              }
            })
          })
        })
        grabEventList
        //.then(console.log('testtest 1231232!!!!'))
        //.then(myCache.mget(['storedEvents', 'storedQueryvalues'], (err, value) => { console.log(value) }))
        .then(result => res2.send(result))
      } else {
        console.log('No need to do another api call, retrieving stored events')
        res2.send(value.storedEvents)
      }
    } else {
      console.log(err)
    }
  })

})

app.get('/', function (req, res) {
   if (Object.keys(googleAuth.credentials).length === 0) {
     res.redirect('/connect')
   } else {
     res.redirect('/calendar-events')
   }
   //res.send('Hello world!!')
});

app.listen(3007, function () {
    console.log('Example app listening on port 3007!');
    console.log('http://localhost:3007/');
});
