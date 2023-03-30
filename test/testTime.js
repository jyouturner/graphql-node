const moment = require('moment-timezone');

//
let epochSeconds = 1572307200;
var dateString = moment.tz(epochSeconds * 1000, null).format(),
               YYYY = dateString.substring(0,4),
               MM = dateString.substring(5,7),
               DD = dateString.substring(8,10),
               gameDate = YYYY + MM + DD;

               console.log(gameDate);