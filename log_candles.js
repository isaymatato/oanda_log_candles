var Mongo = require('mongojs');
var db; //Define db for use later

var async = require('async');

var Tengu = require('./tengu.js');

var getPagedCandles = require('./oanda_getCandles.js');

var logCandles;

Tengu(function(T) {

  var getCollectionNames = function(instruments,granularities) {
    var n = instruments,
    g = granularities,
    c = [],
    i,j;
    //For every instrument and granularity combo, pushes string of <INSTRUMENT>_<GRANULARITY>
    for (i in n) {
      for (j in g) {
        c.push(n[i] + '_' + g[j]);
      }
    }
    return c;
  };

  var getCreateList = function(collections,callback) {
    db.getCollectionNames(function(e,d) {
      if (e) {
        callback(e);
        return false;
      }

      var created = d,
      createList = [],
      i;
      for (i in collections) {
        if (created.indexOf(collections[i]) == -1) {
          createList.push(collections[i]);
        }
      }
      callback(null,createList);
    });
  };

  var createCollections = function(collections,callback) {
    getCreateList(collections,function(err,createList) {
      if (err) {
        callback(err);
        return false;
      }

      async.each(createList,
				function(name,cb) {
  db.createCollection(name,undefined,cb);
				},
				function(e,d) {
  callback(e,d);
				});
    });
  };

  var registerCollections = function(collections,callback) {
    var i,c;
    for (i in collections) {
      c = collections[i];
      db[c] = db.collection(c);
    }
    callback();
  };

  var logOandaCandles = function(params,callback) {
    var flist = [],i,j,p,f;
    for (i in params.instruments) {
      for (j in params.granularities) {
        p = {
          db: db,
          instrument: params.instruments[i],
          granularity: params.granularities[j],
        };
        //Fancy wrap because async.each is parallel, gotta use async.series instead :p
        f = (function(fparams) {
          return function(fcb) {
            console.log('Logging ' + fparams.instrument + '_' + fparams.granularity);
            getPagedCandles(fparams,fcb);
          };
        }(p));

        flist.push(f);

      }//end forj
    }//end fori

    async.series(flist,function(e,d) {
      console.log('Done logging Oanda candles!');
      callback(e,d);
    });
  };

  var connect = function(databaseUrl,callback) {
    db = Mongo.connect(databaseUrl);

    //T.logObject(db);

    // db.on('error', function (err) {
    // 	console.log('Database Error', err)
    // 	callback(err);
    // });
    // db.on('ready', function(){
    //     callback(null,'Database is Ready.');
    // });

    setTimeout(function() {
      callback(null,'1 second has passed...');
    },1000);
  };

  //VVV Function to export
  logCandles = function(params,callback) {
    //Get list of collections to log
    var collections = getCollectionNames(params.instruments,params.granularities);


    //get oanda data (paged)
    //log data to db as it comes in (see oanda_test.js)


    async.series([
			function(cb) {
        console.log('Connecting to DB');
        connect(params.databaseUrl,cb);
			},
	    function(cb) {
        console.log('Creating collections');
        createCollections(collections,cb);
	    },
	    function(cb) {
        console.log('Registering collections to DB');
        registerCollections(collections,cb);
	    },
	    function(cb) {
        console.log('Logging the data...');
        logOandaCandles(params,cb);
	    },
		],
		function(e,dd) {
  db.close();
  callback(e,dd);
		});
  };//end logCandles

  //Node export
  if (typeof module != 'undefined') {
    module.exports = logCandles;
  }

});//end Tengu




