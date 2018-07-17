Instructions:
- npm install: involves included express, adds googleapis (https://www.npmjs.com/package/googleapis), node-cache (https://www.npmjs.com/package/node-cache), dotenv (https://www.npmjs.com/package/dotenv), and nodemon (https://www.npmjs.com/package/nodemon)
- After installation, cd into directory and run 'npm start'
- On going to localhost:3007/, depending on whether the user has made an API call already, the user will either be redirected to /connect or /calendar-events based on lines 109-133 within app.js
- Create an .env file with a CLIENT_ID, CLIENT_SECRET, and DOMAIN set to 'http://localhost:3007'
- localhost:3007/connect will be connected to Google oAuth client, which will eventually redirect to /connect/callback to gain Authorization. Getting Authorization will set credentials to access token and refresh token based on CLIENT_ID and CLIENT_SECRET which are stored within .env file
- After gaining access, user will be redirected to /calendar-events
- Navigating to /calendar-events will do the initial API call to the user's google calendar's events, which has the following parameters as default:
{
  calendarId: 'primary',
  maxResults: 5,
  singleEvents: true,
  orderBy: 'startTime',
  timeMin: req.query.startDate,
}

Note: if a startDate query is not given, it will be assumed that the user wants the starting time of events to be listed based on the time the API is called. The default in this event will be new Date().toISOString().slice(0, 16)+':00.000Z'. The portion after the slice is so that the API is not called again within the same minute; otherwise another API call would be valid for the same results each second.

- During the API call, certain factors will be taken into consideration:

i.  Have the events from an API call have already been stored? For the first time it is called, there are no stored events so it knows to go ahead and continue with the API call, res.send the results, and then store these events within the cache as an object called storedEvents. In addition, the parameters in which this initial API call was made will be stored within the cache in an object called storedQueryvalues.

 ii.  If there are events stored but the query endDate does not match that of the endDate value within storedQueryvalues or does not exist, an API call will be requested again with the criterion of the stored value of startDate. After doing the new API request, the new values will be stored with storedQueryvalues.

 iii. If there are events stored but the query startDate does not match that of the startDate value within storedQueryvalues, an API call will be requested again with the query startDate or default of new Date().toISOString().slice(0, 16)+':00.000Z'. After doing the new API request, the new values will be stored with storedQueryvalues.

Note:
- by default, when the user redirects to /calendar-events within some browsers e.g. Chrome, a # will be appended to the end making it effectively a redirect to /calendar-events# . This seems to be a design choice of the google API call to prevent having sensitive auth data from one app accessible to another.

- lines 85 and 103 are just for visual effect to see the startTime be reflective of real time of when the user requests going to the same calendar-events. The stored cache object of storedEvents is the same in all other regards.
