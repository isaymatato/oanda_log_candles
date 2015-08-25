#Oanada Log Candles 
========

Pulls historical data from Oanda and logs it into MongoDB for faster reference.  Useful for backtesting.

###Installation

###Usage in Node.js
```javascript
var logCandles = require('./log_candles.js');

logCandles({
	databaseUrl: 'oanda',
	instruments: ['AUD_USD','USD_CAD','USD_CHF','USD_JPY','USD_NZD'],
	granularities: ['M','W','D','H6','H1','M15','M5']
},function(e){
  if (e) {
    console.log('Error: ',e);
  }
  else {
    console.log('Data successfully logged! :)');
  }
});
```
