var getPagedCandles;

//Mongo db, gets passed on function call
var db;

var OANDAAdapter = require('oanda-adapter');

//Your keys hereVVVV
var apiKey = 'xxxxx',
	accountId = 'xxx',
	accountMt4 = 'xxxxx';

var O = new OANDAAdapter({
  // 'live', 'practice' or 'sandbox'
  environment: 'live',
  // Generate your API access in the 'Manage API Access' section of 'My Account' on OANDA's website
  accessToken: apiKey,
  // Optional. Required only if evironment is 'sandbox'
  username: apiKey,
});

var async = require('async');

//VV Needed for oanda extension
var querystring = require('querystring');


var Tengu = require('./tengu.js');
Tengu(function(T) {

  // var start_date = 1022800000000000,
  // 	now = Date.now();


  //Get with params
  O.getCandlesAdv = function(options,instrument, start, granularity, callback) {
    var defaultOptions = {
      instrument: instrument,
      start: new Date(start).getTime(),
      granularity: granularity,
      count: 500,
    };

    var i;
    if (T.isObject(options)) {
      for (i in options) {
        defaultOptions[i] = options[i];
      }
    }


    this._sendRESTRequest({
      method: 'GET',
      path: '/v1/candles?' + querystring.stringify(defaultOptions),
      headers: {
        Authorization: 'Bearer ' + this.accessToken,
        'X-Accept-Datetime-Format': 'UNIX',
      },
    }, function(error, body, statusCode) {
      if (error) {
        if (body && body.message) {
          console.error('[ERROR] Response from Oanda', statusCode + ' Error: ' + body.message + ' (OANDA error code ' + body.code + ')');
          return callback(body.message);
        }
        return callback(error);
      }
      if (body && body.candles) {
        callback(null, body.candles);
      } else if (body === '') {
        // Body is an empty string if there are no candles to return
        callback(null, []);
      } else {
        callback('Unexpected candles response for ' + instrument);
      }
    });
  };

  /*data: {
  		instrument
  		granularity
  		page_size
  	}
  	*/

  var pagedCandleCall = function(instrument,start,granularity,callback) {
    O.getCandlesAdv({includeFirst: 'false'}, instrument, start,granularity,function(e,d) {
      var pd;
      //T.logError(e);
      if (e) {
        console.log('Error: calling back');
        callback(e,undefined);
      }      else if (d) {
        pd = processCandles(d);
        callback(null,pd);
      }
    });
  };

  var logCandles = function(instrument,granularity,docArray,callback) {
    var collection = instrument + '_' + granularity;
    db[collection].insert(docArray, function(err, saved) {
      if (err || !saved) {
        T.logError(err);
        console.log('Candles not logged in db');
        db.close();
        callback(err);
      }      else {
        console.log('Candles Logged in db');
        //Call the callback
        if (T.isFunction(callback)) {
          callback(null);
        }
      }
    });
  };

  var processCandles = (function() {
    var page_last,
    page_last_bar;

    return function(docArray) {
      var d1,d2,i,maxi = docArray.length;
      for (i = 0;i < maxi;i += 1) {
        d1 = docArray[i];
        d2 = docArray[i + 1];
        d1.start_time = parseInt(d1.time);

        //Set end time if available
        if (T.isObject(d2)) {
          d1.end_time = parseInt(d2.time);
        }

        //Default last volume of null
        d1.last_volume = null;
        d1.last_close = null;
        d1.last_closeSpread = null;
        //Set d1 last if page_last is defined
        if (T.isObject(page_last)) {
          d1.last_volume = page_last.volume;
          d1.last_close = page_last.close;
          d1.last_closeSpread = page_last.closeSpread;
        }
        //Store d1 data as page_last
        page_last = {
          volume: d1.volume,
          close: d1.closeBid,
          closeSpread: d1.closeAsk - d1.closeBid,
        }
        delete d1.time;
      }//end fori

      //Clear data and boot on empty array
      if (docArray.length == 0) {
        //Clear stored data on empty array
        page_last = undefined;
        page_last_bar = undefined;
        console.log('Returned array is empty, clearing buffer.');
        console.log('/////////////////////////////////////////////////');
        return {
          data: [],
          next_bar_timestamp: null,
        };
      }

      //Append stored bar
      if (T.isObject(page_last_bar)) {
        //Set end time
        page_last_bar.end_time = docArray[0].start_time;
        //Insert into array
        docArray.unshift(page_last_bar);
      };

      //Store last array instance
      page_last_bar = docArray.pop();

      return {
        data: docArray,
        next_bar_timestamp: page_last_bar.start_time,
      };
    };
  }());

  var timestring = function(timestamp) {
    var d = new Date(timestamp / 1000);
    return d.toUTCString();
  };

  getPagedCandles = function(params,callback) {
    var timestamp = 0,
    bar_data,
    count;

    //Set global db value
    db = params.db;

    function fn(cb) {
      pagedCandleCall(params.instrument,timestamp,params.granularity,function(e,d) {

        if (d) {
          //bar_data is already processed candles
          bar_data = d.data;
          //Store timestamp
          timestamp = d.next_bar_timestamp;
          //Store count
          count = bar_data.length;

          //Store in mongo
          //Callback when done (cb)
          if (timestamp != null) {
            console.log(params.instrument + '_' + params.granularity + ' Logged: ' + (bar_data.length - 1) + 'bars, Next Timestamp: ' + timestring(timestamp));
            logCandles(params.instrument,params.granularity,bar_data,cb);
          }          else {
            callback();
          }

        }
      })
    };

    function test() {
      return count === 0;
    };

    async.doUntil(fn, test, callback);
  };

  //Node export
  if (typeof module != 'undefined') {
    module.exports = getPagedCandles;
  }

});//end Tengu