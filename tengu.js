/*!
 *  Tengu JS
 *
 *  (c) 2014, Mateo Williford of Tengu
 *  tengujs.com
 *
 */
var VERSION_NUMBER = "3.00020";
console.log("Loading Tengu v" + VERSION_NUMBER);

var ISNODE,ROOT;
//Check if running in node or browser
(function () {

    // Establish the root object, `window` in the browser, or `global` on the server.
    ROOT = this; 

    // Create a refeence to this
    var _ = new Object();

    var ISNODE = false;

    // Export the Underscore object for **CommonJS**, with backwards-compatibility
    // for the old `require()` API. If we're not in CommonJS, add `_` to the
    // global object.
    if (typeof module !== 'undefined' && module.exports) {
            module.exports = _;
            ROOT._ = _;
            ISNODE = true;
    } else {
            ROOT._ = _;
    }
})();

function Tengu() {
    


    //turn args into array
    var args = Array.prototype.slice.call(arguments),
        //last arg is callback
        callback = args.pop(),
        //modules as array or individual parameters
        modules = (args[0] && typeof args[0] === "string") ? args : args[0],
        i;

    //make sure function is called as constructor
    if (!(this instanceof Tengu)) {
        return new Tengu(modules, callback);
    }

    //Properties of Tengu
    this.a = 0;

    //now add modules to the core 'this' object
    //no modules or '*' mean 'use all modules'
    if (!modules || modules === '*') {
        modules = [];
        for (i in Tengu.modules) {
            if (Tengu.modules.hasOwnProperty(i)) {
                modules.push(i);
            }
        }
    }

    //initialize the required modules
    for (i = 0; i < modules.length; i += 1) {
        Tengu.modules[modules[i]](this);
    }

    //Note - at some point load each module's required modules

    //call the callback
    callback(this);
}

Tengu.protoype = {
    name: "Tengu JS",
    version: VERSION_NUMBER,
    getName: function() {
        return this.name;
    },
    getVersion: function() {
        return VERSION_NUMBER;
    }
};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Modules
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules = {};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Template Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.template = function(tengu) {
    //Add methods and properties to tengu

    tengu.method = function() {}; //end method

}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Debug Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.debug = function(tengu) {
    var _logCountArray = [],
        _isFunction = function _isFunction(obj) {
            var getType = {};
            return obj && getType.toString.call(obj) === '[object Function]';
        },
        _stackTrace = function _stackTrace() {
            var orig = Error.prepareStackTrace;
            Error.prepareStackTrace = function(_, stack) {
                return stack;
            };
            var err = new Error;
            Error.captureStackTrace(err, arguments.callee);
            var stack = err.stack;
            Error.prepareStackTrace = orig;
            return stack;
        },
        _lineNumber = function _lineNumber(x) {
            x = x || 1;
            return _stackTrace()[x].getLineNumber();
        },
        _log = function _log() {
            var n = _lineNumber(),
                a = [],
                c = arguments[0];

            //Boot if over count
            if (_logCountArray[n] >= c) {
                return false;
            }

            //If only one arg or if first arg isn't a number, console log normally
            if ((arguments.length < 2) || (typeof c != "number")) {
                console.log.apply(console, arguments);
            } else {
                //initialize
                if (!_logCountArray[n]) {
                    _logCountArray[n] = 0;
                }
                //Log
                _logCountArray[n] += 1;
                Array.prototype.push.apply(a, arguments);
                a.shift();
                console.log.apply(console, a);
            }
        };
    var _dumpObj = function(obj, indent) {
      var result = "";
      if (indent == null) indent = "";

      for (var property in obj)
      {
        var value = obj[property];
        if (typeof value == 'string')
          value = "'" + value + "'";
        else if (typeof value == 'object')
        {
          if (value instanceof Array)
          {
            // Just let JS convert the Array to a string!
            value = "[ " + value + " ]";
          }
          else
          {
            // Recursive dump
            // (replace "  " by "\t" or something else if you prefer)
            var od = _dumpObj(value, indent + "  ");
            // If you like { on the same line as the key
            //value = "{\n" + od + "\n" + indent + "}";
            // If you prefer { and } to be aligned
            value = "\n" + indent + "{\n" + od + "\n" + indent + "}";
          }
        }
        result += indent + "'" + property + "' : " + value + ",\n";
      }
      return result.replace(/,\n$/, "");
    };

    tengu.stackTrace = function() {
        return _stackTrace();
    };

    tengu.lineNumber = _lineNumber;

    tengu.log = function(msg) {
        console.log.apply(console, arguments);
    };

    tengu.logObj = function(o){
        console.log(_dumpObj(o,'    '));
    };

    tengu.logObject = tengu.logObj;

    tengu.logError = function(e){
        if (e){
            console.log(e.name,e.message);
        }
    };

    tengu.htmlObj = function(o,indent){
        indent = indent || 2;
        return '<pre id="json">'+JSON.stringify(o,undefined,indent)+'</pre>';
    };

    tengu.breakpoint = function(msg){
        msg = msg || 'Breakpoint';
        msg = 'Line '+_lineNumber(2)+': '+msg;
        throw new Error(msg);
    };

    //Log message a fixed number of times (use in continuous loops to avoid msg spam)
    tengu.logMultiple = function(nTimesToLog, msg) {
        _log.apply(this, arguments);
    };

    tengu.logOnce = function(msg) {
        var n = _lineNumber();
        if (!_logCountArray[n]) {
            _logCountArray[n] = 1;
            console.log.apply(console, arguments);
        } else {
            return false;
        }
    };

    //Converts object or string to uri encoding, returns string
    tengu.encodeURI = function(data){
        var _encodeObj = function(obj){
            var n,uri="";
            for (n in obj) {
              if (obj.hasOwnProperty(n)) {
                uri += encodeURIComponent(n) + "=" + encodeURIComponent(obj[n]);
                uri += "&";
              }
            }
            //Remove last &
            return uri.substring(0, uri.length-1);
        };//end _encodeObj

        var dtype = typeof data;
        switch (dtype){
            case "object": 
                return _encodeObj(data);
                break;
            case "string":
                return encodeURIComponent(data);
                break;
            default:
                throw new Error("Tengu.encodeURI - Bad data type:",dtype);
        }
        return false;
    };

    //Safely wrap a function with error callbacks
    //Set onNotAFunc to null to ignore
    tengu.safeWrap = function(func, onError, onNotAFunc, onFinally) {
        return function() {
            try {
                //Check if func is a function
                if (_isFunction(func)) {
                    return func.apply(this, arguments);
                } else {
                    //func is not a function
                    if (_isFunction(onNotAFunc)) {
                        //Call onNotAFunc if not available
                        onNotAFunc();
                    } else if (onNotAFunc == null) {
                        //Do nothing if onNotAFunc is null
                    } else {
                        //Throw TypeError if onNotAFunc isn't a function
                        throw new TypeError("T.safeWrap: func is not a function, func: " + func);
                    }
                }
            } catch (e) {
                if (_isFunction(onError)) {
                    //Call onError if it's a function
                    onError(e);
                } else {
                    //Throw back out by default
                    throw e;
                }
            } finally {
                if (_isFunction(onFinally)) {
                    //Call onFinally if it's a function
                    onFinally();
                }
            } //end try/catch/finally
        }; //end return function
    }; //end safeWrap

}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// String Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.string = function(tengu) {
    //String Functions

    //Return string of # using optional format
    //Format can be "000", "0.00", "000.00", ect
    tengu.numToString = function(x, format) {
        format = format || "0.00";

        if (x == undefined) {
            return undefined;
        }
        if (x == null) {
            return null;
        }

        var s1 = ("" + x).split("."),
            s2 = format.split("."),
            s3 = [2],
            diff;

        //Pad front w zeros	
        diff = s2[0].length - s1[0].length;
        s3[0] = "";
        while (diff > 0) {
            s3 += "0"
            diff -= 1;
        };
        s3[0] += s1[0];

        diff = s2[1].length - s1[1].length;

        if (s1[1] == undefined) {
            s1[1] = "";
        }
        if (s2[1] == undefined) {
            s2[1] = "";
        }

        s3[1] = s1[1];

        //Pad back w zeros
        while (diff > 0) {
            s3[1] += "0"
            diff -= 1;
        };

        //crop
        if (diff < 0) {
            s3[1] = s1[1].slice(0, s2[1].length);
        }

        return (s3[0] + "." + s3[1]);
    };

    tengu.numToString_minDigits = function(x, n) {
        var s = "" + x;

        while (s.length < n) {
            s = "0" + s;
        }

        return s;
    };

    tengu.capitalizeFirstLetter = function(string) {
        if (typeof string != 'string'){
            return string;
        }
        string = string.toLowerCase();
        return string.charAt(0).toUpperCase() + string.slice(1);
    };

    tengu.htmlColorString = function(string,style,color,background){
        var s='';
        if (!tengu.isString(style)){
            style = 'span';
        }

        s += '<'+style+' style=';
        s += '"';
        if (tengu.isString(background)){
            s += 'background: '+background;
        }
        if (tengu.isString(color)){
            s += ';';
            s += 'color: '+color;
        }
        s += '"';
        s += '>';
        s += string;
        s += '</' + style + '>';
        return s;
    };

    tengu.htmlRenderPercent = function(value,fixed){
        if (fixed==undefined){
            fixed = 2;
        }
        value*=100;

        var s = "",c="black";
        if (value>0){
            s+="+";
            c = "green";
        }
        else if (value<0){
            c = "red";
        }
        s+=value.toFixed(fixed);
        s+="%";

        return tengu.htmlColorString(s,undefined,c,undefined);
    };

    var _arrayToFixed = function(array,fixed){
        if (!tengu.isArray(array)){
            return array;
        };
        if (!tengu.isNumber(fixed)){
            fixed = 2;
        }
        fixed = Math.floor(fixed);
        var s = "[",i,max;
        max = array.length;
        for (i=0;i<max;i+=1){
            if (i>0){
                s+=",";
            }
            if (tengu.isNumber(array[i])){
                s+=array[i].toFixed(fixed); 
            }
            else if (tengu.isArray(array[i])){
                s+=_arrayToFixed(array[i],fixed);
            }
            else {
                s+=array[i];
            }
            
        }
        s+="]";
        return s;
    };

    tengu.arrayToFixed = function(array,ndigits){
        return _arrayToFixed(array,ndigits);
    };


};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Sparkline Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.sparkline = function(tengu) {
    //Create small text based sparkline graphs
    
    tengu.SPARKLINE_LEFT = [
        "_",
        "\u258F",
        "\u258E",
        "\u258D",
        "\u258C",
        "\u258B",
        "\u258A",
        "\u2589",
        "\u2588"
    ];

    tengu.sparklineLeft = function(value,n_chars) {
        var s = "",
            w = 1/n_chars,
            i,n,c;
        for (i=0;i<n_chars;i+=1){
            n = i * w;
            if (value < n){
                s+=tengu.SPARKLINE_LEFT[0];
            }
            else if (value >= n + w){
                s+=tengu.SPARKLINE_LEFT[8]
            }
            else {
                c = Math.floor( (value-n)*n_chars );
                s+=tengu.SPARKLINE_LEFT[c];
            }
        }//end for
        return s;
    }; //end method

}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Validation Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.validation = function(tengu) {
    //Field validation
    tengu.validateDate = function(txtDate) {
        var currVal = txtDate;
        if (currVal == '')
            return false;

        //Declare Regex  
        var rxDatePattern = /^(\d{1,2})(\/|-)(\d{1,2})(\/|-)(\d{4})$/;
        var dtArray = currVal.match(rxDatePattern); // is format OK?

        if (dtArray == null)
            return false;

        //Checks for mm/dd/yyyy format.
        dtMonth = dtArray[1];
        dtDay = dtArray[3];
        dtYear = dtArray[5];

        if (dtMonth < 1 || dtMonth > 12)
            return false;
        else if (dtDay < 1 || dtDay > 31)
            return false;
        else if ((dtMonth == 4 || dtMonth == 6 || dtMonth == 9 || dtMonth == 11) && dtDay == 31)
            return false;
        else if (dtMonth == 2) {
            var isleap = (dtYear % 4 == 0 && (dtYear % 100 != 0 || dtYear % 400 == 0));
            if (dtDay > 29 || (dtDay == 29 && !isleap))
                return false;
        }
        return true;
    }; //End validateDate


}; //End module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Namegen Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.namegen = function(tengu) {
    //Requires util
    var max_length = 20,
        min_length = 3,
        nameData = {},
        getNormalData = function(data) {
            var nData = {
                    loc: [],
                    next: []
                },
                i, j, max;

            for (i in data.loc) {
                nData.loc[i] = tengu.normalize(data.loc[i]);
            }

            for (i in data.next) {
                nData.next[i] = tengu.normalize(data.next[i]);
            }

            return nData;
        },
        config = {
            nextScalar: 0.5,
            locScalar: 0.5,
            randScalar: 0
        },
        baseRatio = 1 / 27,
        randFunction = function() {
            return Math.random();
        },
        _consonants, _vowels;

    _consonants = ("bcdfghjklmnpqrstvwxyz").split("");
    _vowels = ("aeiou").split("");

    tengu.getRandomConsonant = function() {
        return tengu.randArrayValue(_consonants, randFunction);
    };

    tengu.getRandomVowel = function() {
        return tengu.randArrayValue(_vowels, randFunction);
    };

    tengu.namegenSetRFunc = function(f) {
        randFunction = f;
    };


    tengu.makeNationName = function() {
        var s = "",
            r = Math.floor(Math.random() * 4);

        s += tengu.getRandomConsonant();
        s += tengu.getRandomVowel();
        s += tengu.getRandomConsonant();

        if (r != 0) {
            s += tengu.getRandomVowel();
            s += tengu.getRandomConsonant();
        }

        switch (r) {
            case 0:
                s += "land";
                break;
            case 1:
                s += "ia";
                break;
            case 2:
                s += "y";
                break;
            case 3:
                s += "";
        }

        return tengu.capitalizeFirstLetter(s);
    }




    tengu.namegenLearn = function(namelist) {
        var loc = [],
            next = [],
            last = null,
            i, j, k, maxi, maxj, str, chr;

        //Init Next Array
        for (i = 0; i < 27; i += 1) {
            next[i] = tengu.zeroArray(27);
        }

        maxi = namelist.length;
        for (i = 0; i < maxi; i++) {
            str = (namelist[i].replace("[^a-zA-Z]", "")).toUpperCase();
            maxj = namelist[i].length;

            last = 26; //Set to 26 if first in string

            for (j = 0; j < maxj; j++) {
                chr = str.charCodeAt(j) - 65;

                if (loc[j] === undefined) {
                    //Init Loc array at location j
                    loc[j] = tengu.zeroArray(27);
                }

                loc[j][chr] += 1;
                next[last][chr] += 1;
                last = chr;
            }

            //End of String
            if (loc[j] === undefined) {
                //Init Loc array at location j
                loc[j] = [27];
                for (k = 0; k < 27; k += 1) {
                    loc[j][k] = 0;
                }
            }

            loc[j][26] += 1;

            //Next/Loc = 26 is end of string
            if (last == null) {
                next[26][26] += 1;
            } else {
                next[last][26] += 1;
            }

        }

        //Return the data set
        return {
            loc: loc,
            next: next
        };
    };

    tengu.namegenUpdate = function(data) {
        nameData = getNormalData(data);
    };
    tengu.namegenCreate = function() {
        var nS = config.nextScalar,
            lS = config.locScalar,
            rS = config.randScalar,
            bR = baseRatio,
            next = nameData.next,
            loc = nameData.loc,
            done = false,
            index = 0,
            lArray = [],
            last = 26,
            end_array = tengu.zeroArray(27),
            name = "",
            i, j, max, randy, rN;

        end_array[26] = 1;

        while (!done) {

            //Fill Letter Array for this letter
            lArray = tengu.zeroArray(27);
            max = 27;
            for (i = 0; i < max; i += 1) {
                //Add Next
                lArray[i] += next[last][i] * nS;
                //Add Location
                if (index > loc.length - 1) {
                    lArray[i] += end_array[i] * lS;
                } else {
                    lArray[i] += loc[index][i] * lS;
                }
                //Add Random
                lArray[i] += bR * rS;
            }

            if (index < min_length) {
                lArray[26] = 0;
                lArray = tengu.normalize(lArray);
            }

            //Get a random #
            randy = randFunction();
            rN = 0; //Roulette Count
            i = 0; //Index Count
            while (rN <= randy) {
                rN += lArray[i];
                i += 1;
            }

            i -= 1;

            if (i >= 26) {
                done = true;
            } else {
                name += String.fromCharCode(i + 65);
                last = i;
                if (name.length >= max_length) {
                    done = true;
                }
            }
            index += 1;
        }

        return name;
    };
}; //end namegen module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Math Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.math = function(tengu) {
    //Math Functions

    //Returns the sign of x
    tengu.sign = function(x) {
        return typeof x === 'number' ? x ? x < 0 ? -1 : 1 : x === x ? 0 : NaN : NaN;
    };

    //Returns true if x is even
    tengu.isEven = function(x) {
        return (x % 2 == 0);
    };
    tengu.isOdd = function(x) {
        return !tengu.isEven(x);
    };

    //Sets resolution of number
    //i.e. 1003 rez 10 is 1000,
    //		1016 rez 10 is 1010
    tengu.rez = function(x, base) {
        return (Math.floor(x / base) * base);
    };

    //Check if number is in between two other numbers
    tengu.nInRange = function(x, min, max) {
        return (x - min) * (x - max) < 0;
    };

    //Cap a number and return it
    tengu.capNumber = function(num, min, max) {
        if (typeof num != 'number') {
            console.warn("" + num + " is not a number!");
        }
        //Cap min
        if (min != undefined) {
            if (num < min) {
                return min;
            }
        }

        //Cap max
        if (max != undefined) {
            if (num > max) {
                return max;
            }
        }

        return num;
    };

    //Logarithm function with optional base
    tengu.logarithm = (function() {
        var log = Math.log;
        return function(n, base) {
            return log(n) / (base ? log(base) : 1);
        };
    })();

    //Common logarithm
    tengu.log10 = function(x){
        return tengu.logarithm(x,10);
    };
    
    //Returns true if point (x,y) is in rect[x,y,w,h]
    tengu.pointRect = function(x, y, rect) {
        return !((x > rect.x + rect.w) |
            (x < rect.x) |
            (y > rect.y + rect.h) |
            (y < rect.y));
    };

    //Returns angle between 2 points in radians
    tengu.pointDir = function(x1, y1, x2, y2) {
        var dx = x2 - x1,
            dy = y2 - y1,
            theta = Math.atan2(-dy, dx);

        return theta;
    };

    //Returns square distance between 2 points
    tengu.pointDisSq = function(x1, y1, x2, y2) {
        var dx = x2 - x1,
            dy = y2 - y1;

        return ((dx * dx) + (dy * dy));
    };

    //Returns distance between 2 points
    tengu.pointDis = function(x1, y1, x2, y2) {
        return Math.sqrt(tengu.pointDisSq(x1, y1, x2, y2));
    };


    //Returns true if 2 1D line segments (point,mag) intersect 
    tengu.lineIntersect1D = function(x1, m1, x2, m2) {
        var y1 = x1 + m1,
            y2 = x2 + m2;
        return !((x2 < y1) || (y2 < x1))
    };

    //Returns intersection point or null if parallel
    tengu.boundlessLineIntersect2D = function(m1,b1,m2,b2){
        var dm = m1 - m2,
            bm = b2 - b1,
            x,y;
        if (dm==0){
            return null;
        }

        x = bm / dm;
        y = (m1 * x) + b1;
        return {
            x: x,
            y: y
        };

    };

    //Returns true if 2 2d rectangles intersect
    //Format {x,y,w,h}
    tengu.rectIntersect2D = function(r1,r2) {
        //Need this....
    };

    //8 bit array into byte
    //note: bool_littleEndian modifies original array
    tengu.bitArrayToByte = function(bitarray, bool_littleEndian) {
        if (bool_littleEndian) {
            bitarray.reverse();
        }
        var i, n = 0;
        for (i = 0; i < 8; i += 1) {
            if (bitarray[i]) {
                n += Math.pow(2, i);
            }
        }
        return n;
    }; //End bitArrayToByte

    //Byte to 8bit bool array
    tengu.byteToBitArray = function(byte, bool_littleEndian) {
        var ba = [],
            i;
        for (i = 0; i < 8; i += 1) {
            ba[i] = (a >> i) & 1;
        }
        if (bool_littleEndian) {
            ba.reverse();
        }
        return ba;
    }; //End byteToBitArray

    //Returns new rolling mean
    tengu.rollmean = function(value,mean,influence){
        return mean + (influence*(value - mean));
    };//end rollmean

    //Horribly named function, please do better
    //a is array of numbers
    //Returns {mean,sd,v,ss} - mean, standard deviation, variance, sample size
    tengu.statistics = function(a){
        if (!tengu.isArray(a)){
            console.warn("T.statistics - invalid array:",a);
            return false;
        }
        if (a.length<1){
            console.warn("T.statistics - array is empty:",a);
            return false;
        }

        //Private
        var _mean,_v;

        var _getMean = function(a){
            //Get the mean/////////////////
            var m = 0,
                i,n;
            //Sum everything in a
            for (i in a){
                n = a[i];
                if (tengu.isValidNum(n)){
                    m+=n;
                }
            }
            //Divide by sample size
            m/=a.length;

            return m;
        };

        var _getVariance = function(a,m){
            var s = 0,
                i,x,d;
            //Sum (x-m)^2, for everything in a
            for (i in a){
                x = a[i];
                if (tengu.isValidNum(x)){
                    //Difference
                    d = x-m;
                    //Add Square
                    s+=d*d;
                }
            }
            //Divide by (sample size - 1)
            return ( s / (a.length-1) );
        };

        //Get Mean
        _mean = _getMean(a);
        //Get Variance
        _v = _getVariance(a,_mean);

        //Return object
        return {
            mean: _mean,
            v: _v,
            sd: Math.sqrt(_v),
            ss: a.length
        }
    };

}; //end Math Module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Regression Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.regression = function(tengu) {
    //http://stackoverflow.com/questions/11796810/calculate-trendline-and-predict-future-results
    var SquareFitter = function() {
            this.count = 0;
            this.sumX = 0;
            this.sumX2 = 0;
            this.sumX3 = 0;
            this.sumX4 = 0;
            this.sumY = 0;
            this.sumXY = 0;
            this.sumX2Y = 0;
        };

        SquareFitter.prototype = {
            'add': function(x, y) {
                this.count++;
                this.sumX += x;
                this.sumX2 += x*x;
                this.sumX3 += x*x*x;
                this.sumX4 += x*x*x*x;
                this.sumY += y;
                this.sumXY += x*y;
                this.sumX2Y += x*x*y;
            },
            'project': function(x) {
                var det = this.count*this.sumX2*this.sumX4 - this.count*this.sumX3*this.sumX3 - this.sumX*this.sumX*this.sumX4 + this.sumX2*this.sumX*this.sumX2*this.sumX3 - this.sumX2*this.sumX2*this.sumX2;
                var offset = this.sumX*this.sumX2Y*this.sumX3 - this.sumX*this.sumX4*this.sumXY - this.sumX2*this.sumX2*this.sumX2Y + this.sumX2*this.sumX3*this.sumXY + this.sumX2*this.sumX4*this.sumY - this.sumX3*this.sumX3*this.sumY;
                var scale = -this.count*this.sumX2Y*this.sumX3 + this.count*this.sumX4*this.sumXY + this.sumX*this.sumX2*this.sumX2Y - this.sumX*this.sumX4*this.sumY - this.sumX2*this.sumX2*this.sumXY + this.sumX2*this.sumX3*this.sumY;
                var accel = this.sumY*this.sumX*this.sumX3 - this.sumY*this.sumX2*this.sumX2 - this.sumXY*this.count*this.sumX3 + this.sumXY*this.sumX2*this.sumX - this.sumX2Y*this.sumX*this.sumX + this.sumX2Y*this.count*this.sumX2;
                return (offset + x*scale + x*x*accel)/det;
            }
        };

        var _squareProject = function(data) {
            var fitter = new SquareFitter(),
                i,max = data.length;
            for (i = 0; i < max; i++) {
                fitter.add(i, data[i]);
            }
            return fitter.project(60);
        };

        //http://dracoblue.net/dev/linear-least-squares-in-javascript/
        var _findLineByLeastSquares = function(values_x, values_y) {
            var sum_x = 0;
            var sum_y = 0;
            var sum_xy = 0;
            var sum_xx = 0;
            var count = 0;

            /*
             * We'll use those variables for faster read/write access.
             */
            var x = 0;
            var y = 0;
            var values_length = values_x.length;

            if (values_length != values_y.length) {
                throw new Error('The parameters values_x and values_y need to have same size!');
            }

            /*
             * Nothing to do.
             */
            if (values_length === 0) {
                return [ [], [] ];
            }

            /*
             * Calculate the sum for each of the parts necessary.
             */
            for (var v = 0; v < values_length; v++) {
                x = values_x[v];
                y = values_y[v];
                sum_x += x;
                sum_y += y;
                sum_xx += x*x;
                sum_xy += x*y;
                count++;
            }

            /*
             * Calculate m and b for the formular:
             * y = x * m + b
             */
            var m = (count*sum_xy - sum_x*sum_y) / (count*sum_xx - sum_x*sum_x);
            var b = (sum_y/count) - (m*sum_x)/count;

            /*
             * We will make the x and y result line now
             */
            // var result_values_x = [];
            // var result_values_y = [];

            // for (var v = 0; v < values_length; v++) {
            //     x = values_x[v];
            //     y = x * m + b;
            //     result_values_x.push(x);
            //     result_values_y.push(y);
            // }

            return (m*values_length)+b;
    };//end findLinebyLeastSquares

    tengu.findLineByLeastSquares = function(values_x, values_y) {
        return _findLineByLeastSquares(values_x,values_y);
    }; //end method

}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Fingerprinting module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.fingerprint = function(tengu) {
    //Require window (don't load in node)
    if (typeof window == 'undefined'){
        return false;
    }
    //privates
    var _mapData = function(source,target,schema){
        if (!tengu.isObject(source)||!tengu.isArray(schema)){
            console.error("Tengu fingerprint - _mapData, bad objects or schema",source,tengu.isObject(source),schema,tengu.isArray(schema));
            return target;
        }
        if (!tengu.isObject(target)){
            target = {};
        }

        var i,n;
        for (i in schema){
            n=schema[i]
            target[n]=source[n];
        }

        return target;

    };
    var _getWindowNavigator = function(obj){
        var d = [
            "appCodeName",          //string
            "appName",              //string
            "appVersion",           //string
            "cookieEnabled",        //bool
            "doNotTrack",           //null???
            "hardwareConcurrency",  //int?
            "language",             //string
            "languages",            //Array[string]
            "maxTouchPoints",       //int
            "mimeTypes",            //Array[object]
            "platform",             //string
            "plugins",              //Array[object]               
            "product",              //string
            "productSub",           //string
            "userAgent",            //string
            "vendor",               //string
            "vendorSub"             //string
        ];

        return _mapData(window.navigator,obj,d);
    };

    var _getWindowScreen = function(obj){
        var d = [
            "availHeight",          //int
            "availLeft",            //int
            "availTop",             //int
            "availWidth",           //int
            "colorDepth",           //int
            "height",               //int
            "pixelDepth",           //int
            "width"                 //int
        ];

        return _mapData(window.screen,obj,d);
    };

    var _getLongShort = function(obj){
        var w = window.screen.width,
            h = window.screen.height;
        if (w>h){
            obj["screen_long"]=w;   //int
            obj["screen_short"]=h;  //int
        }
        else {
            obj["screen_long"]=h;   //int
            obj["screen_short"]=w;  //int
        }

        return obj;
    };

    var _getDeviceData = function(){
        var o = {};
        o = _getWindowNavigator(o);
        o = _getWindowScreen(o);
        o = _getLongShort(o);
        return o;
    };

    tengu.getDeviceData = function() {
        return _getDeviceData();
    }; //end method

}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// SHA3 512 Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.sha3_512 = function(tengu) {
    //Hash from string generator

    //Public///////////////////////////////////
    tengu.sha3_512 = function() {

    };

    tengu.saltySha3 = function() {

    };

}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Physics Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.physics = function(tengu) {
    //Gets distance given starting velocity, time, and acceleration
    tengu.getDisVTA = function(v, t, a) {
        var t2 = t * t,
            d;

        d = (v * t) + (0.5 * a * t2);

        return d;
    };

}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Random Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.random = function(tengu) {
    //Requires: <none>


    //Starting seed value for the prng
    var _rseed = 279470273,
        //Storage for gaussian numbers
        _gaussStack = [],
        //Box Mueller gaussian transform
        _boxMueller = function() {
            var x1, x2, w, y1, y2;

            do {
                x1 = (2.0 * tengu.prFloat()) - 1.0;
                x2 = (2.0 * tengu.prFloat()) - 1.0;
                w = (x1 * x1) + (x2 * x2);
            } while (w >= 1.0);

            w = Math.sqrt((-2.0 * Math.log(w)) / w);
            y1 = x1 * w;
            y2 = x2 * w;
            _gaussStack.push(y1);
            _gaussStack.push(y2);
        };

    /**
     * 'Cast' number as an unsigned 32bit integer
     * @param  {Number} x     Number to be 'cast'
     * @return {Number}       Unsigned 32bit int
     */
    tengu.uInt32 = function(x) {
        x = Math.abs(x);
        x = Math.round(x);
        x = x % 4294967296;
        return x;
    };

    /**
     * Returns a random seed number based on JS Math.random()
     * @return {Number}       Random unsigned 32bit int
     */
    tengu.randomSeed = function() {
        return tengu.uInt32(Math.random() * 4294967296);
    };

    /**
     * Turns unsigned 32bit number into hash for use as seed value
     * @param  {Number} key   Unsigned 32bit int - starting value
     * @return {Number}       Unsigned 32bit int - hash value
     */
    tengu.hash = function(key) {
        //Thomas Wang’ s 32 bit Mix Function [Wang 2000]
        //use 32bit key value
        key = tengu.uInt32(key);
        key += ~(key << 15);
        key ^= (key >> 10);
        key += (key << 3);
        key ^= (key >> 6);
        key += ~(key << 11);
        key ^= (key >> 16);
        return key;
    };

    /**
     * Make a seed from uInt32 arguments (can be just one value)
     * Use as many arguments as you like
     * @param  {Number} x     Unsigned 32bit int (multiple, or one)
     * @return {Number}       Unsigned 32bit int - seed value
     */
    tengu.makeSeed = function() {
        var args = Array.prototype.slice.call(arguments),
            popHash = function() {
                var a = args.pop(),
                    n = tengu.uInt32(a);
                return tengu.hash(n);
            },
            x, y;

        //Return random if no arguments
        if (args.length <= 0) {
            return tengu.randomSeed();
        }

        //Get next hash
        x = popHash();

        while (args.length > 0) {
            y = popHash();
            x = tengu.hash(x ^ y);
        }

        return x;
    };

    /**
     * Lehmer PRNG
     * Makes a pseudo random # from seed
     * @param  {Number} x     Unsigned 32bit int
     * @return {Number}       Random unsigned 32bit int
     */
    tengu.lehmer = function(x) {
        return ((x * 279470273) % 4294967291);
    };

    /**
     * Set the seed # of the prng
     * Note:  This clears the gaussStack (array of gaussian values)
     * @param  {Number} x     Seed # - Unsigned 32bit int
     * @return {Number}       Returns the seed you just put in
     */
    tengu.seed = function(x) {
        _gaussStack = []; //Clear the gaussStack

        _rseed = x;
        return _rseed;
    };

    /**
     * Spool a number from the PRNG
     * @return {Number}       Random u32int
     */
    tengu.prng = function() {
        var x = tengu.lehmer(_rseed);
        _rseed = x;
        return x;
    };

    /**
     * Spool out 1>x>=0 float
     * @return {Number}       Float
     */
    tengu.prFloat = function() {
        return tengu.prng() / 4294967296;
    };

    /**
     * Spool out a bool
     * @return {Boolean}       Random  Bool
     */
    tengu.prBool = function() {
        return tengu.prng() >= 2147483648;
    };

    /**
     * Spool out a int max>x>=min
     * @param {Number} max     Max integer value
     * @param {Number} min     (Optional) Min integer value
     * @return {Number}        Int (can be signed)
     */
    tengu.prInt = function(max, min) {
        var x = tengu.prng();
        if (min === undefined) {
            min = 0;
        }

        x /= 4294967296;
        x *= (max - min);
        x = Math.floor(x);
        x += min;
        return x;
    };

    /**
     * Spool out a gaussian 1>x>=0 float
     * Note:  This calls prng() twice every other time it's used
     * 	      and stores the 2 values in gaussStack
     * @return {Number}       Float
     */
    tengu.prGauss = function() {
        if (_gaussStack.length <= 0) {
            //Add 2 gauss #'s to stack
            _boxMueller();
        }

        //Pop a number off the gauss stack
        return _gaussStack.pop();
    };
};


//////////////////////////////////////////////////////////////////////////////////////////////////////
// Utility Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.util = function(tengu) {
    //Utility Functions (misc)
    var WORKING_DIR = (function() {
        if (typeof window != 'undefined'){
            var wd = window.location.pathname,
                wi = wd.lastIndexOf("/") + 1;
            wd = wd.slice(0, wi);
            return wd;    
        }
        if (ISNODE){
            var path = require('path'),
                wd = path.dirname( process.execPath ),
                wi = wd.lastIndexOf("/") + 1;
            wd = wd.slice(0, wi);
            return wd;
        }
        
    }());

    //Usage:  a = T.argArray(arguments);
    tengu.argArray = function(a) {
        return Array.prototype.slice.call(a, 0);
    };

    //Get working directory
    tengu.getWorkingDir = function() {
        return WORKING_DIR;
    };

    //Return float of string version # (ie 0.80.10.22)
    tengu.versionToFloat = function(str) {
        var n = str.indexOf("."),
            w = str.slice(0, n).replace(/\D/g, ""),
            f = str.slice(n).replace(/\D/g, ""),
            str2 = w + "." + f;

        return parseFloat(str2);
    };

    /**
     * Returns true of character is uppercase
     * @param {String} char		Character to be evaluated
     * @return {Boolean}       	True if its a string
     */
    tengu.isUpperCase = function(char) {
        return char == char.toUpperCase();
    };

    /**
     * Returns true of character is lowercase
     * @param {String} char		Character to be evaluated
     * @return {Boolean}       	True if its a string
     */
    tengu.isLowerCase = function(char) {
        return char == char.toLowerCase();
    };

    /**
     * Returns true of object is a string
     * @param {Object} obj		Object to be evaluated
     * @return {Boolean}       	True if its a string
     */
    tengu.isString = function(obj) {
        if (!obj) {return false;}
        var toString = Object.prototype.toString;

        return toString.call(obj) == '[object String]';
    };

    //Returns true if obj is Number OR a String
    tengu.isNumOrString = function(obj) {
        if (tengu.isValidNum(obj)) {
            return true;
        } else if (tengu.isString(obj)) {
            return true;
        } else {
            return false;
        }
    };

    tengu.isArray = function(obj) {
        if (!obj) {return false;}
        var toString = Object.prototype.toString;

        return toString.call(obj) == "[object Array]";
    };

    tengu.isFunction = function(obj) {
        if (!obj) {return false;}
        var getType = {};
        return obj && getType.toString.call(obj) === "[object Function]";
    };

    tengu.isObject = function(obj) {
        if (!obj) {return false;}
        return (typeof obj == "object");
    };

    tengu.isValidNum = function(x) {
        if (x==null){return false;}
        if ( isNaN(x) ) {return false;}
        if (x==NaN) {return false;}
        return (typeof x == "number");
    };

    //Because I keep typing this function wrong...
    tengu.isNumber = tengu.isValidNum;
    tengu.isValidNumber = tengu.isValidNum;

    tengu.isInt = function(number) {
        if (!tengu.isValidNum(number)) {
            return false;
        }
        return number % 1 == 0;
    };

    //Shuffles an array and returns shuffled
    tengu.shuffle = function(array) {
        var currentIndex = array.length, temporaryValue, randomIndex ;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
        }

        return array;
    };

    //Retuns a random item from an array
    tengu.randArrayValue = function(array, randFunction) {
        randFunction = randFunction || Math.random;

        var l = array.length,
            n = Math.floor(randFunction() * l);

        return array[n];
    };

    //Sets array[i].index to i
    tengu.indexObjArray = function(array) {
        var i, max;
        max = array.length;
        for (i = 0; i < max; i += 1) {
            array[i].index = i;
        }
        return array;
    };

    //Searches array for keys with value of (value)
    //Returns results as new array of index values
    tengu.search = function(array, key, value) {
        var result = [],
            i, max;
        max = array.length;
        for (i = 0; i < max; i += 1) {
            if (array[i] != undefined) {
                if (array[i][key] == value) {
                    result.push(i);
                }
            }
        }

        return result;
    };

    //Returns first index or -1
    tengu.searchIndexOf = function(array, key, value) {
        var l = tengu.search(array, key, value);

        if (l.length > 0) {
            return l[0];
        } else {
            return -1;
        }
    };

    //Removes values from array
    //First argument is array itself, following arguments are values to be removed
    tengu.arrayRemoveValue = function(a){
        var n, 
            arg = arguments, 
            l = a.length, 
            ax;
        while (l > 1 && a.length) {
            n = a[--l];
            while ((ax= a.indexOf(n)) !== -1) {
                a.splice(ax, 1);
            }
        }
        return a;
    };

    //Appends one array to another
    tengu.appendArray = function(a, b) {
        return Array.prototype.push.apply(a, b);
    };

    //Replaces all instances of str1 with str2 in source string (returns new string)
    tengu.stringReplaceAll = function(source,str1, str2, ignore) {
         return source.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
    };

    //Escapes double quotes from string
    tengu.safeDQuoteString = function(str){
        var s = tengu.stringReplaceAll(str,'"', '\\"');
        return tengu.stringReplaceAll(str,'\\', '\\\\');
    };

    //Sort
    //Example T.sort(array,"z");
    //Returns ascending order (low to high)
    tengu.sort = (function() {
        //Insertion Sort
        //https://rawgithub.com/escherba/algorithms-in-javascript/master/src/insertion-sort.js
        "use strict";

        /**
         * Sorts an array of integers using the InsertionSort algorithm.
         * @param {Array.<number>} items Array of items to be sorted.
         */
        return function(arr, key) {
            for (var i = 0, len = arr.length; i < len; i++) {
                var j = i,
                    val = arr[j][key],
                    index = arr[j];
                for (; j > 0 && arr[j - 1][key] > val; j--) {
                    arr[j] = arr[j - 1];
                }
                arr[j] = index;
            }
            return arr;
        };

    })();

    //Returns object with the keys/indexes reversed a[x]=y->a[y]=x
    tengu.keyNverse = function(a) {
        var b = {},
            i, key;
        for (i in a) {
            key = a[i];
            b[key] = i
        }
        return b;
    };

    //Returns an array of zeroes with size n
    tengu.zeroArray = function(n) {
        var o = [],
            i;
        for (i = 0; i < n; i += 1) {
            o.push(0);
        }
        return o;
    };

    //Returns an array of "" with size n
    tengu.emptyStringArray = function(n) {
        var o = [],
            i;
        for (i = 0; i < n; i += 1) {
            o.push("");
        }
        return o;
    };

    //Normalizes and array of numbers and returns array
    //Warning:  zero magnitude vectors get set to +1 mag evenly distributed between dimensions
    tengu.normalize = function(o) {
        var sum = 0,
            i, max, ratio;
        max = o.length;
        for (i = 0; i < max; i += 1) {
            if (typeof o[i] != "number") {
                throw new Error("Array[" + i + "] is not a number!  Val:" + o[i]);
            }
            sum += o[i];
        }

        //No Zero Sum, distribute evenly, make this optional....
        if (sum == 0) {
            ratio = 1 / max;

            for (i = 0; i < max; i += 1) {
                o[i] = ratio;
            }
        } else {
            for (i = 0; i < max; i += 1) {
                o[i] /= sum;
            }
        }

        return o;
    };

    //Returns a prototype inherited copy of object
    tengu.object = function(o) {
        function F() {}
        F.prototype = o;
        return new F();
    };

    //Returns a shallow copy of object
    // Shallow copy
    tengu.clone = function(obj) {
        if (!obj) {
            return obj;
        }
        if (obj instanceof Array) {
            //Return array clone if array
            return obj.slice(0);
        }
        //Turn obj into string and back again
        return (JSON.parse(JSON.stringify(obj)));
    };

    tengu.cloneDeep = function(obj) {
        if (!obj) {
            return obj;
        }
        if (obj instanceof Array) {
            //Return array clone if array
            return obj.slice(0);
        }
        return jQuery.extend(true, {}, obj);
    };

    tengu.parseCSV = function(csvString,key){
        var data = csvString.split("\n"),
            kdata,k,
            i,j;
        if (tengu.isString(key)){
            k = key.split(",");
            kdata = [];
        }
        for (i in data){
            if (k!=undefined){
                kdata[i]={};
            }

            data[i] = data[i].split(",");

            for (j in data[i]){
                if (k!=undefined){
                    kdata[i][k[j]] = data[i][j];
                }
            }//end forj
        }//end fori
        if (k!=undefined){
            return kdata;
        }
        else {
            return data;
        }
    };



    //Old version, illegal constructor error
    /*
	tengu.clone = function(obj) {
		if (obj instanceof Array) {
			//Return array clone if array
			return obj.slice(0);
		}
	    if (null == obj || "object" != typeof obj) return obj;
	    
	    var copy = obj.constructor();
	    for (var attr in obj) {
	        if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
	    }
	    return copy;
	};
	*/


    /**
     * Shallow copies every value of source and overwrites the same values of target
     * @param {Object} source		Object to be copied from
     * @param {Object} target		Object to be copied to
     * @return {Object}       		Returns target
     */
    tengu.mapObj = function(source, target) {
        var i;

        for (i in source) {
            target[i] = source[i];
        }

        return target;
    };

    //Shallow for i of object, pushes to 0 numbered array
    tengu.objToArray = function(obj){
        var a = [],
            i;
        for (i in obj){
            a.push(obj[i]);
        }
        return a;
    };

    //Returns an object with child methods that return sourceObj's child properties of the same name
    //Ex: sourceObj.a = 10;
    //returnObj.a() //returns 10
    //
    //bool_callfuncs - set to true, and it will call functions instead of returning them
    tengu.makeGetter = function(sourceObj, bool_callfuncs) {
        var S = sourceObj,
            T = {},
            i;
        for (i in S) {
            //Namespacing ftw!!!!!! :p
            T[i] = (function() {
                var j = i;
                return function() {
                    if (tengu.isFunction(S[j]) && bool_callfuncs) {
                        S[j].apply(this, arguments);
                    } else {
                        return S[j];
                    }
                };
            }());
        }
        return T;
    };

    //Binds function to object and returns
    tengu.bind = function(object, method) {
        return function() {
            method.apply(object, arguments);
        };
    };

    //Creates a callback function and returns it
    tengu.createCallback = function(object, method, data) {
        return function(data) {
            method.call(object, data);
        };
    };

    //Turns ArrayBuffer to uInt16 String (unicode)
    tengu.binToString = function(bin) {
        var aB = bin;

        //Add a 0 byte if length is odd
        if (aB.byteLength % 2 > 0) {}

        //validate if it's really an array buffer
        if (!(aB instanceof ArrayBuffer)) {
            throw new Error("T.webstorage: Invalid ArrayBuffer", aB);
        }
        return String.fromCharCode.apply(null, new Uint16Array(aB));
    };
    //Turns uInt16 String (unicode) into ArrayBuffer
    tengu.stringToBin = function(string) {
        var aB = new ArrayBuffer(string.length * 2), // 2 bytes for each char
            v = new Uint16Array(aB),
            i, max;
        max = string.length;
        for (i = 0; i < max; i += 1) {
            v[i] = string.charCodeAt(i);
        }
        return aB;
    };

    //Turns rgba string into color
    tengu.rgba = function(str) {
        //shift off # char if in string
        var s1 = str.replace("#", ""),
            s2, i, i2, n, rgba = [];
        //get numbers
        for (i = 0; i < 4; i += 1) {
            //Slice off 2 chars, hex -> dec
            i2 = i * 2;
            s2 = s1.slice(i2, i2 + 2);
            n = parseInt(s2, 16);

            //Validate
            if (typeof n != "number") {
                throw new Error("Invalid rgba color string: " + str);
                return false;
            }

            rgba.push(n);
        }
        //Turn alpha into 0<x<1 float
        rgba[3] /= 256;

        //set rgba
        return "rgba(" + rgba[0] + "," + rgba[1] + "," + rgba[2] + "," + rgba[3] + ")";
    };

    //Turn RGB vals to html style string
    tengu.rgbToString = function(r, g, b) {
        if (r && g === undefined && b === undefined) {
            g = r.g, b = r.b, r = r.r;
        }
        return "rgb(" + Math.round(r) + "," + Math.round(g) + "," + Math.round(b) + ")";
    };

    /* accepts parameters
     * h  Object = {h:x, s:y, v:z}
     * OR
     * h, s, v
     */
    tengu.hsvToRgb = function(h, s, v) {
        var r, g, b, i, f, p, q, t, data;
        if (h && s === undefined && v === undefined) {
            s = h.s, v = h.v, h = h.h;
        }
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                r = v, g = t, b = p;
                break;
            case 1:
                r = q, g = v, b = p;
                break;
            case 2:
                r = p, g = v, b = t;
                break;
            case 3:
                r = p, g = q, b = v;
                break;
            case 4:
                r = t, g = p, b = v;
                break;
            case 5:
                r = v, g = p, b = q;
                break;
        }
        return {
            r: Math.floor(r * 255),
            g: Math.floor(g * 255),
            b: Math.floor(b * 255)
        };
    };

    //Returns href from string
    tengu.getHReffromString = function(s,type) {
        //Add node support later - boot if not in browser for now...
        if (typeof window == 'undefined'){
            console.error("window doesn't exist, not in browser");
            return null;
        }

        var _type = 'text/plain';//; charset=utf-8
        if (tengu.isString(type)){
            _type = type;
        }
        window.URL = window.webkitURL || window.URL;
        var blob = new Blob([s], {
                type: _type
            }),
            a = document.getElementById("dlLink");

        return window.URL.createObjectURL(blob);
    };

    //Creates a text file from s with filename and downloads it
    //Boilerplate, call href^^^^
    tengu.getDLURLfromString = function(s, filename,type) {
        //Add node support later - boot if window is not available
        if (typeof window == 'undefined'){
            console.error("window doesn't exist, not in browser");
            return null;
        }
        var _type = 'text/plain';//; charset=utf-8
        if (tengu.isString(type)){
            _type = type;
        }
        window.URL = window.webkitURL || window.URL;
        var blob = new Blob([s], {
                type: _type
            }),
            a = document.getElementById("dlLink");

        a.download = filename;
        a.href = window.URL.createObjectURL(blob);

        a.click();

        a.download = '';
        a.href = '';
    };

    tengu.randomBool = function() {
        return Math.random() < 0.5;
    };


    //Disables right click
    tengu.disableRightClick = function() {
        //Disable right click script 
        //visit http://www.rainbow.arch.scriptmania.com/scripts/ 
        var message = "Sorry, right-click has been disabled";

        function clickIE() {
            if (document.all) {
                (message);
                return false;
            }
        }

        function clickNS(e) {
            if (document.layers || (document.getElementById && !document.all)) {
                if (e.which == 2 || e.which == 3) {
                    (message);
                    return false;
                }
            }
        }
        if (document.layers) {
            document.captureEvents(Event.MOUSEDOWN);
            document.onmousedown = clickNS;
        } else {
            document.onmouseup = clickNS;
            document.oncontextmenu = clickIE;
        }
        document.oncontextmenu = new Function("return false");
    };

    //Returns the screen resolution in obj {w,h}
    tengu.getScreenResolution = function() {
        return {
            w: screen.width,
            h: screen.height
        };
    };


};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// AFK Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.afk = function(tengu) {
    //Add node support later - boot if window is not available
    if (typeof window == 'undefined'){
        return false;
    }
    if (typeof $ == 'undefined'){
        return false;
    }
    //NOTE:  This will leak if used a lot, replace with object instead of array....

    //Private
    var _listeners=[];
    var _setTimeout = function(n){
        if (n.timeout){
            window.clearTimeout(n.timeout);
        }

        try {
            n.timeout = window.setTimeout(n.callback,n.duration);
        }
        catch(e) {
            console.log(e);
            throw e;
        }
    };

    var _onInput = function(){
        var i,n;
        for (i in _listeners){
            if (_listeners[i]){
                _setTimeout(_listeners[i]);
            }
        }
    };

    var _afk = function(callback,duration){
        var n = _listeners.length;

        _listeners[n]={
            duration: duration,
            callback: callback
        };

        _setTimeout(n);

        return n;
    };

    var _clearAfk = function(index){
        var n = _listeners[index];
        if (n.timeout){
            window.clearTimeout(n.timeout);
        }
        _listeners[index]=undefined;
    };

    //Window onready, add listeners
    //On Ready
    $(document).ready(function() {
        //Initialize event listeners
        var type = [
                'pointerdown',
                'pointerup',
                'pointermove',
                'onkeydown'
            ],
            i, max;

        max = type.length;
        for (i = 0; i < max; i += 1) {
            window.addEventListener(type[i],_onInput);
        }
    });

    tengu.clearAfk = function(index){
        _clearAfk(index);
    };

    tengu.afk = function(callback,duration) {
        return _afk(callback,duration);
    }; 

}; //end afk module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Cookie Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.cookie = function(tengu) {
    //Requires: none

    //Note:  JS cookies aren't secure, so don't use them!!!

    /**
     * Sets a cookie
     * @param {String} cname		Name of cookie
     * @param {String} cvalue		Value of cookie
     * @param {Number} exdays		Days until cookie expires
     */
    tengu.setCookie = function(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toGMTString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    };

    /**
     * Gets a cookie
     * @param {String} cname		Name of cookie
     * @return {String} 				Value of cookie
     */
    tengu.getCookie = function(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i].trim();
            if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
        }
        return "";
    };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Web Worker Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.webworker = function(tengu) {
    //Web worker ref:
    //http://www.w3.org/TR/2012/CR-workers-20120501/
    //tutorial
    //http://www.html5rocks.com/en/tutorials/workers/basics/#toc-gettingstarted

    //Note - some of the more processor intensive functions (in general) for the tengu
    //api could be moved to a separate web worker tengu script and called from here

    //Web worker support
    tengu.startWorker = function(scriptName, callback) {
        var w;

        if (typeof(Worker) !== "undefined") {

            w = new Worker(scriptName);

            w.onmessage = function(event) {
                callback(event.data);
            };
        } else {
            throw new Error("Browser does not support Web Workers");
        }
    };

    //tengu.isWorker = function(object){};

    tengu.stopWorker = function(worker) {
        worker.terminate();
    };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Stream Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

//Binary Streaming
Tengu.modules.stream = function(tengu) {
    //Private
    var _minByteMultiple = 2,
        _dataViewAvailable = (function() {
            return (DataView !== undefined);
        }),
        _littleEndian = (function() {
            if (!_dataViewAvailable) {
                return undefined;
            } else {
                //Check endian
                var buffer = new ArrayBuffer(2);
                new DataView(buffer).setInt16(0, 256, true);
                return new Int16Array(buffer)[0] === 256;
            }
        }),
        _arrayBuffer = null,
        _arrayBufferOffset = 0,
        _buffer = [],
        _bufferPointer = _buffer,
        _getBuffer = function() {
            return _bufferPointer;
        },
        _setBuffer = function(buffer) {
            _bufferPointer = buffer;
        },
        _clearBuffer = function() {
            _buffer = [];
        },
        _getTypeSize = function(type) {
            //Returns # of bytes
            //Assume type is valid
            switch (type) {
                case "uint8":
                    return 1;
                    break;
                case "uint16":
                    return 2;
                    break;
                case "uint32":
                    return 4;
                    break;
                default:
                    throw new Error("Unknown size of type: " + type);
            }
        },
        //Returns the size of the buffer in bytes
        _getBufferSize = function(b) {
            var i, max,
                size = 0;
            b = b || _getBuffer();
            max = b.length;
            for (i = 0; i < max; i += 1) {
                size += _getTypeSize(b[i].type);
            }
            return size;
        },
        //Reads value from data view and returns it
        _readDataView = function(dV, type, offset, littleEndian) {
            //Assume type is valid and value is clamped
            switch (type) {
                case "uint8":
                    return dV.getUint8(offset);
                    break;
                case "uint16":
                    return dV.getUint16(offset, littleEndian);
                    break;
                case "uint32":
                    return dV.getUint32(offset, littleEndian);
                    break;
                case "int8":
                    return dV.getInt8(offset);
                    break;
                case "int16":
                    return dV.getInt16(offset, littleEndian);
                    break;
                case "int32":
                    return dV.getInt32(offset, littleEndian);
                    break;
                case "float32":
                    return dV.getFloat32(offset, littleEndian);
                    break;
                case "float64":
                    return dV.getFloat64(offset, littleEndian);
                    break;
                default:
                    throw new Error("Bad DataView Type: " + type);
                    break;
            }

            return dV;
        },
        //Writes value to data view and returns data view
        _writeDataView = function(dV, value, type, offset) {
            //Assume type is valid and value is clamped
            switch (type) {
                case "uint8":
                    dV.setUint8(offset, value);
                    break;
                case "uint16":
                    dV.setUint16(offset, value);
                    break;
                case "uint32":
                    dV.setUint32(offset, value);
                    break;
                case "int8":
                    dV.setInt8(offset, value);
                    break;
                case "int16":
                    dV.setInt16(offset, value);
                    break;
                case "int32":
                    dV.setInt32(offset, value);
                    break;
                case "float32":
                    dV.setFloat32(offset, value);
                    break;
                case "float64":
                    dV.setFloat64(offset, value);
                    break;
                default:
                    throw new Error("Bad DataView Type: " + type);
                    break;
            }

            return dV;
        },
        //Writes _buffer to new ArrayBuffer and returns it
        _bufferToArrayBuffer = function() {
            var b, size, aB, dV,
                i, max,
                offset = 0;

            //Get buffer & size
            b = _getBuffer();
            size = _getBufferSize();

            //Pad with zeroes if under min size
            while (size % _minByteMultiple > 0) {
                _write(0, "uint8");
                size += 1;
            }

            //Create ArrayBuffer and DataView
            aB = new ArrayBuffer(size);
            dV = new DataView(aB);

            max = b.length;
            //Parse buffer and write to DataView
            for (i = 0; i < max; i += 1) {
                //Write to DataView
                _writeDataView(dV, b[i].value, b[i].type, offset);

                //Increment byte offset
                offset += _getTypeSize(b[i].type);
            }

            console.log("Binary created - " + aB.byteLength + " bytes");

            return aB;
        },
        _arrayBufferToString = function(aB) {
            return String.fromCharCode.apply(null, new Uint8Array(aB));
        },
        //Logs every byte of array buffer to console
        _logArrayBuffer = function(aB) {
            var max = aB.byteLength,
                dV = new DataView(aB),
                i, s;
            for (i = 0; i < max; i += 1) {
                s = "" + i + ": ";
                s += dV.getUint8(i);
                console.log(s);
            }
        },
        //VVV Not sure if this is needed
        _arrayBufferToBlob = function(aB) {
            return new Blob([aB]);
        },
        _validateType = function(type) {
            if (!tengu.isString(type)) {
                throw new Error("T.stream: " + type + " is not a string!");
            }
            type = type.toLowerCase();

            switch (type) {
                case "uint8":
                case "uint16":
                case "uint32":
                    return type;
                    break;
                default:
                    throw new Error("T.stream: Invalid data type (" + type + ")");
                    return false;
                    break;
            }
        },
        _clamp = function(value, type) {
            //Assume type is validated already...
            var max, unsigned, integer, sign, abs;

            switch (type) {
                case "uint8":
                case "uint16":
                case "uint32":
                    unsigned = true;
                    integer = true;
                    break;
                default:
                    unsigned = false;
                    integer = false;
                    break;
            }

            switch (type) {
                case "uint8":
                    max = 0xFF;
                    break;
                case "uint16":
                    max = 0xFFFF;
                    break;
                case "uint32":
                    max = 0xFFFFFFFF;
                    break;
            }

            //Convert bools
            if (typeof value == "bool") {
                if (value) {
                    value = 1;
                } else {
                    value = 0;
                }
            }

            //Drop decimal if integer
            if (integer) {
                value = Math.floor(value);
            }

            //Clamp max values
            sign = tengu.sign(value);
            abs = Math.abs(value);
            if (abs > max) {
                value = max * sign;
            }

            //Convert negatives if unsigned
            if (unsigned) {
                if (value < 0) {
                    value = max - (value + 1);
                }
            }

            //Return value
            return value;

        }, //end clamp 
        //Write value to array
        _write = function(value, type) {
            var t, v,
                b = _getBuffer();
            //Validate Type
            t = _validateType(type);
            //Clamp Value
            v = _clamp(value, t);

            //Push to Buffer
            b.push({
                value: v,
                type: t
            });
        },
        //Read value from arrayBuffer
        _read = function(type, aB, offset, littleEndian) {
            var o, dV, v;

            aB = aB || _arrayBuffer;
            if (!(aB instanceof ArrayBuffer)) {
                throw new Error("T.stream: Nonexistent array buffer");
            }

            dV = new DataView(aB);
            //Validate type
            type = _validateType(type);

            //Get offset to read
            if (offset) {
                o = offset;
            } else {
                o = _arrayBufferOffset;
            }

            //Read from ArrayBuffer
            v = _readDataView(dV, type, o, littleEndian);

            //Increment offset
            if (!offset) {
                //Add to global offset
                _arrayBufferOffset += _getTypeSize(type);
            }

            //Returns the value
            return v;
        }
    _loadArrayBuffer = function(aB) {
        _arrayBuffer = aB;
        _arrayBufferOffset = 0;
        return aB;
    };

    //Public Methods////////////////////////////////////////////////////////////////////

    //Returns true if data format is little endian
    tengu.isLittleEndian = function() {
        return _littleEndian;
    };

    tengu.streamCreate = function() {
        _buffer = [];
        _bufferPointer = _buffer;
        return _bufferPointer;
    };
    tengu.streamOpen = function(arrayBuffer) {
        return _loadArrayBuffer(arrayBuffer);
    };
    tengu.streamWrite = function(value, type) {
        _write(value, type);
    };
    //littleEndian(bool) is optional
    tengu.streamRead = function(type, littleEndian) {
        return _read(type, undefined, undefined, littleEndian);
    };
    tengu.streamGetArrayBuffer = function(stream) {
        stream = stream || _bufferPointer;

        return _bufferToArrayBuffer();
    };

    tengu.logArrayBuffer = function(aB) {
        _logArrayBuffer(aB);
    };



}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Old XHR Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.xhr_old = function(tengu) {
    //XHR Methods

    //Private
    var
    //XMLHttpRequest Get
        _xhrGet = function(path, type, callback) {
            // Create XHR, BlobBuilder and FileReader objects
            if (typeof FileReader === "undefined") {
                throw new Error("FileReader not supported!");
            }

            var xhr = new XMLHttpRequest(),
                blob,
                fileReader = new FileReader(),
                result;

            xhr.open("GET", path, true);
            // Set the responseType to arraybuffer
            xhr.responseType = "arraybuffer";

            xhr.addEventListener("load", function() {
                if (xhr.status === 200) {
                    // Create a blob from the response
                    blob = new Blob([xhr.response], {
                        type: type
                    });

                    // onload needed since Google Chrome doesn't support addEventListener for FileReader
                    fileReader.onload = function(evt) {
                        // Read out file contents as a Data URL, save to src
                        result = evt.target.result;

                        callback(result);
                    };
                    // Load blob as Data URL
                    fileReader.readAsDataURL(blob);
                }
            }, false);
            // Send XHR
            xhr.send();
        },
        //Returns true if file exists
        _fileExists = function(path) {
            var xhr = new XMLHttpRequest(),
                lastModified, date, time;

            xhr.open("HEAD", path, false);
            xhr.send(null);

            return (xhr.status === 200);
        },
        //Gets date modified of file (ms since 1970)
        _getDateModified = function(path) {
            var xhr = new XMLHttpRequest(),
                lastModified, date, time;

            xhr.open("HEAD", path, false);
            xhr.send(null);

            if (xhr.status === 200) {
                lastModified = xhr.getResponseHeader("Last-Modified");
                date = new Date(lastModified);
                time = date.getTime();
            } else {
                time = undefined;
            }

            return time;
        },
        /*
        //Loads text from a file
        _xhrGetText('filename.txt',
         function(data) { console.log(data); },
         function(xhr) { console.error(xhr); }
         );
         */
        _xhrGetText = function(path, success, error) {
            error = error || function(e) {
                console.warn(e);
            };

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        if (success)
                            success(xhr.responseText);
                    } else {
                        if (error) {
                            console.log("xhr", xhr);
                            error(xhr);
                        }
                    }
                }
            };
            xhr.open("GET", path, true);
            xhr.send();
        },
        /*
        //Loads a JSON from a file
        _xhrGetJSON('my-file.json',
         function(data) { console.log(data); },
         function(xhr) { console.error(xhr); }
         );
         */
        _xhrGetJSON = function(path, success, error) {
            var _onSuccess = function(t) {
                success(JSON.parse(t));
            };
            _xhrGetText(path, _onSuccess, error);
        },
        //Download Image from URL
        _xhrGetImg = function(path, callback) {
            var type = _pathToImgType(path),
                img = {
                    path: path,
                    src: undefined
                };
            _xhrGet(path, type, function(src) {
                img.src = src;
                callback(img);
            });
        };

    tengu.xhrFileExists = function(path) {
        return _fileExists(path);
    };

    tengu.xhrGetDateModified = function(path) {
        return _getDateModified(path);
    };

    tengu.xhrGetJSON = function(path, success, error) {
        return _xhrGetJSON(path, success, error);
    };

}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// XHR Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.xhr = function(tengu) {
    //Add node support later - boot if window is not available
    if (typeof window == 'undefined'){
        return false;
    }
    //General Ref
    //https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
    
    //Private methods////////////////////////////////////////
    
    //Returns an xhr object
    var _newXHR = function(){
        var xhr;
        //Everything besides IE<8
        if (window.XMLHttpRequest) {
            xhr = new XMLHttpRequest();
        }
        //A useless life is an early death - Goethe 
        else if (window.ActiveXObject) {
            try {
                xhr = new ActiveXObject('Msxml2.XMLHTTP');
            } catch (e) {
                try {
                    xhr = new ActiveXObject('Microsoft.XMLHTTP');
                } catch (e) {
                    throw e;
                }
            }
        }

        if (!xhr) {
            throw new Error('Cannot create XHR instance');
            console.error("Can't create new xhr instance");
            return false;
        }
        else {
            return xhr;
        }
    };//end newXHR

    //When xhr is ready, call the callback
    var _onReady = function(xhr,callback){
        xhr.onreadystatechange = function(){
            if (xhr.readyState === 4) {
                // Response received, callback
                callback();
            }
        };
    };

    var _onRC = function(xhr,cb){
        //Definitions:
        //http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
        switch (xhr.status){
            case 200:
                if (tengu.isFunction(cb.success)){
                    cb.success();
                }
                if (tengu.isFunction(cb.done)){
                    cb.done();
                }
                break;
            default:
                //Fail by default
                if (tengu.isFunction(cb.fail)){
                    cb.fail();
                }
                break;
        }
        //Always do always
        if (tengu.isFunction(cb.always)){
                    cb.always();
        }
    };

    var _setHeaders = function(xhr,h){
        var i;
        for (i in h){
            if (typeof i == "string"){
                if (typeof h[i]=="string"){
                    //Insert some safety for header name checking...
                    console.log("set header",i,h[i]);
                    xhr.setRequestHeader(i,h[i]);
                }
            }
        }
    };

    var _xhrReq = function(type,url,data,success,dataType,headers){
        var xhr = _newXHR();
        //Callbacks
        var callback = {
            success: null,
            done: null,
            fail: null,
            always: null
        };
        //Callback setters
        var mapper = {
            success: function(cb){
                callback.success=cb;
                return mapper;
            },
            done: function(cb){
                callback.done=cb;
                return mapper;
            },
            fail: function(cb){
                callback.fail=cb;
                return mapper;
            },
            always: function(cb){
                callback.always=cb;
                return mapper;
            }
        };

        //Map success if it exists
        if (tengu.isFunction(success)){
            callback.success = success;
        }

        //Open the xhr
        xhr.open(type,url,true); //true means async

        //Set dataType if it exists
        if (typeof dataType == "string"){
            xhr.setRequestHeader("Content-Type",dataType);
        }


        //Set headers if they exist
        if (tengu.isObject(headers)){
            _setHeaders(xhr,headers);
        }

        //Set rc
        _onRC(xhr,callback);

        //Send the xhr
        xhr.send();


        //Return the mapper
        return mapper;
    };

    //Public////////////////////////////////////////////////////////////
    //.get( url [, data ] [, success ] [, dataType ] )
    tengu.get = function(url,data,success,dataType,headers) {
        return _xhrReq('GET',url,data,success,dataType,headers);
    }; //end get
    //.post( url [, data ] [, success ] [, dataType ] )
    tengu.post = function(url,data,success,dataType,headers) {
        return _xhrReq('POST',url,data,success,dataType,headers);
    }; //end post

    //Gets the date modified of a file
    tengu.getDateModified = function(filename) {
        var xhReq = new XMLHttpRequest(),
            lastModified;
        xhReq.open("HEAD", filename, false);
        xhReq.send(null);

        lastModified = xhReq.getResponseHeader("Last-Modified");

        return lastModified;
    };

}; //end xhr module
//////////////////////////////////////////////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////////////////////////////////////////////
// WebSocket Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.websocket = function(tengu) {

    tengu.initSocket = function(url,msg,callback,error){
        var ws=new WebSocket(url);
        ws.onopen = function (){
          ws.send(msg); //send a message to server once connection is opened.
        };
        ws.onmessage = function(e){
          callback(e.data);
        };
        ws.onerror = function(e){
          error(e);
        };

        return {
            error: ws.onerror
        };
    };

}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Appcache Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.appcache = function(tengu) {
    //Add node support later - boot if window is not available
    if (typeof window == 'undefined'){
        return false;
    }
    if (!window.applicationCache) {
        return false; //Kill the module if appcache can't be found (temporary)
    };

    var _offline = false,
        _offlineEvent = [];
    //Add methods and properties to tengu

    window.applicationCache.onerror = function() {
        var i, max;
        _offline = true;
        max = _offlineEvent.length;
        for (i = 0; i < max; i += 1) {
            _offlineEvent[i]();
        }
        return false;
    };

    tengu.appCache_getStatus = function() {
        var appCache = window.applicationCache;

        switch (appCache.status) {
            case appCache.UNCACHED: // UNCACHED == 0
                return 'UNCACHED';
                break;
            case appCache.IDLE: // IDLE == 1
                return 'IDLE';
                break;
            case appCache.CHECKING: // CHECKING == 2
                return 'CHECKING';
                break;
            case appCache.DOWNLOADING: // DOWNLOADING == 3
                return 'DOWNLOADING';
                break;
            case appCache.UPDATEREADY: // UPDATEREADY == 4
                return 'UPDATEREADY';
                break;
            case appCache.OBSOLETE: // OBSOLETE == 5
                return 'OBSOLETE';
                break;
            default:
                return 'UKNOWN CACHE STATUS';
                break;
        };
    };

    tengu.appCacheOffline = function() {
        return _offline;
    };
    tengu.appCache_onOffline = function(callback) {
        if (_offline) {
            callback();
        } else {
            _offlineEvent.push(callback);
        }
    };

}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// File IO Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.fileio = function(tengu) {
    //Requires jquery
    //Requires util

    /*
	 * PHP Script example:
	 * <?php
		if ($_SERVER["REQUEST_METHOD"] == "POST") {
			$filename = $_SERVER['DOCUMENT_ROOT'].$_POST['filename'];
			file_put_contents($filename, $_POST['str']);
		}
		?>
	 */

    //JSON file IO
    tengu.writeJSON = function(script_url, filename, object, callback) {
        var str = JSON.stringify(object),
            f = tengu.getWorkingDir() + filename;

        $.ajax({

            //URL for the post handler
            url: script_url,
            data: {
                filename: f,
                str: str
            },
            type: 'POST',
            success: function() {
                callback();
            },
            dataType: 'text/json'
        });

    };
    tengu.readJSON = function(filename, callback) {
        $.ajax({
            url: filename,
            cache: false,
            success: function(file) {
                //var o = JSON.parse(file);
                callback(file);
            },
            dataType: 'text/json'
        });
    };

    tengu.readTXT = function(filename, callback) {
        $.ajax({
            url: filename,
            cache: false,
            success: function(file) {
                callback(file);
            },
            dataType: 'text'
        });
    };

};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Web Storage Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.webstorage = function(tengu) {
    //Boot if not in browser
    if (typeof navigator == 'undefined'){
        return false;
    }
    var //True if webstorage is available
        _canDoWS = function() {
            return (typeof(Storage) !== "undefined");
        },
        _checkWS = function() {
            if (!_canDoWS) {
                throw new Error("Web Storage Unavailable");
            }
        },
        //Turns ArrayBuffer to uInt16 String (unicode)
        _arrayBufferToString = function(aB) {
            //validate if it's really an array buffer
            if (!(aB instanceof ArrayBuffer)) {
                throw new Error("T.webstorage: Invalid ArrayBuffer", aB);
            }
            return String.fromCharCode.apply(null, new Uint16Array(aB));
        },
        //Turns uInt16 String (unicode) into ArrayBuffer
        _stringToArrayBuffer = function(string) {
            var aB = new ArrayBuffer(string.length * 2), // 2 bytes for each char
                v = new Uint16Array(aB),
                i, max;
            max = string.length;
            for (i = 0; i < max; i += 1) {
                v[i] = string.charCodeAt(i);
            }
            return aB;
        },
        _validType = function(type) {
            var t = ["string", "bool", "int", "float", "json", "bin"];
            return (t.indexOf(type) >= 0);
        },
        _toString = function(value, type) {
            var str = "";

            if (type == undefined) {
                type = "string";
            }

            switch (type) {
                case "string":
                case "bool":
                case "int":
                case "float":
                    return "" + value;

                case "json":
                    return JSON.stringify(value);
                case "bin":
                    return _arrayBufferToString(value);
            }
        },
        _fromString = function(string, type) {
            if (type == undefined) {
                type = "string";
            }

            //Get undefined or null
            switch (string) {
                case undefined:
                    return undefined;
                case "undefined":
                    return undefined;
                case "null":
                    return null;
                case "":
                    return undefined;
            }

            //Big type switch
            switch (type) {
                case "string":
                    return string;
                case "bool":
                    return (!(
                        string == "0" ||
                        string == "false" ||
                        string == "null" ||
                        string == "undefined" ||
                        string == "NaN"
                    ));
                case "int":
                    return parseInt(string);
                case "float":
                    return parseFloat(string);
                case "json":
                    return JSON.parse(string);
                case "bin":
                    return _stringToArrayBuffer(string);
            }
        },
        _hasPersistentStorage,
        global_key = "";

    //Init Function
    (function() {
        _hasPersistentStorage = (navigator.webkitPersistentStorage != undefined);
    }());

    //Table methods
    var _s4 = function() {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        },
        _db_array_get = function(key) {
            var a = localStorage[global_key + "." + key];
            if (typeof a == "string") {
                return a.split("¬");
            } else {
                return [];
            }
        },
        _db_array_set = function(key, array) {
            if (!tengu.isArray(array)) {
                throw new Error("_db_array_set: Invalid array - " + array);
            } else {
                localStorage[global_key + "." + key] = array.join("¬");
            }
        },
        _db_array_append = function(key, data) {
            if (typeof data != "string") {
                throw new Error("_db_array_append data must be string.");
            }
            var a = _db_array_get(key);
            a.push(data);
            _db_array_set(key, a);
        },
        _db_array_remove = function(key, value) {
            var a = _db_array_get(key);
            //remove value;
            a.splice(a.indexOf(value), 1);
            console.log("arrayRemove", value, a);
            //save
            _db_array_set(key, a);
        },
        _db_new_guid = function() {
            return (_s4() + _s4() + "-" + _s4() + "-" + _s4() + "-" + _s4() + "-" + _s4() + _s4() + _s4());
        },
        _db_getColumnIndex = function(table_name, column) {
            var c = _db_array_get(table_name + ".schema_columnName");
            return c.indexOf(column);
        },
        _db_getColumnType = function(table_name, column_index) {
            var t = _db_array_get(table_name + ".schema_columnType");
            return t[column_index];
        },
        //Returns true if table of name exists
        _db_tableExists = function(name) {
            var key = [
                    global_key + "." + name + ".schema_columnName",
                    global_key + "." + name + ".schema_columnType",
                    global_key + "." + name + ".guidList"
                ],
                i;

            for (i in key) {
                if (!localStorage[key[i]]) {
                    return false;
                }
            }
            return true;
        },
        _db_newTable = function(name, schema) {
            var c = [],
                t = [],
                i;
            for (i in schema) {
                //Validate name
                if (typeof i != "string") {
                    throw new Error("Invalid Name: " + i);
                }
                //Validate type
                if (!_validType(schema[i])) {
                    throw new Error("Invalid Type: " + schema[i]);
                }
                c.push(i);
                t.push(schema[i]);
            }
            _db_array_set(name + ".schema_columnName", c);
            _db_array_set(name + ".schema_columnType", t);
            _db_array_set(name + ".guidList", []);
        },
        _db_addColumn = function(table_name, column_name, type) {
            var c = _db_array_get(table_name + ".schema_columnName"),
                t = _db_array_get(table_name + ".schema_columnType");
            //Validate name
            if (typeof column_name != "string") {
                throw new Error("Invalid Name: " + column_name);
            }
            //Validate type
            if (!_validateType(type)) {
                throw new Error("Invalid Type: " + type);
            }
            c.push(column_name);
            t.push(type);
            _db_array_set(name + ".schema_columnName", c);
            _db_array_set(name + ".schema_columnType", t);
        },
        _db_create = function(table_name, data, force_uid) {
            var c = _db_array_get(table_name + ".schema_columnName"),
                t = _db_array_get(table_name + ".schema_columnType"),
                record = [],
                guid, i, n, s;

            if (force_uid != undefined) {
                guid = "" + force_uid;
            } else {
                guid = _db_new_guid();
            }
            //Parse data, schema column, schema type
            for (i in c) {
                n = data[c[i]];
                if (n == undefined) {
                    console.warn("Column '" + c[i] + "' is missing from record.");
                    //Record is empty at that column if no data
                    record[i] = "";
                } else {
                    //Parse to string
                    record[i] = _toString(n, t[i]);
                }
            }
            //Save Record
            _db_array_set(table_name + "." + guid, record);
            //Add to guidList
            _db_array_append(table_name + ".guidList", guid);

            return guid;
        },
        _db_read_general = function(c, t, table_name, id) {
            var r = _db_array_get(table_name + "." + id),
                d = {},
                i;

            if (r.length == 0) {
                return undefined;
            }

            //Parse strings
            for (i in c) {
                d[c[i]] = _fromString(r[i], t[i]);
            }
            d._id = id;
            return d;
        },
        _db_read = function(table_name, id) {
            //id = "" + id;
            var c = _db_array_get(table_name + ".schema_columnName"),
                t = _db_array_get(table_name + ".schema_columnType");

            return _db_read_general(c, t, table_name, id);
        },

        _db_readMultiple = function(table_name, id_array) {
            var c = _db_array_get(table_name + ".schema_columnName"),
                t = _db_array_get(table_name + ".schema_columnType"),
                a = [],
                r, d, i, j;

            if (!tengu.isArray(id_array)) {
                throw new Error("_db_readMultiple Invalid array: " + id_array);
            }

            for (j in id_array) {
                a.push(_db_read_general(c, t, table_name, id_array[j]))
            }
            return a;
        },
        _db_update = function(table_name, id, data) {
            var c = _db_array_get(table_name + ".schema_columnName"),
                t = _db_array_get(table_name + ".schema_columnType"),
                r = _db_array_get(table_name + "." + id),
                d = {},
                i;

            //Parse data, schema column, schema type
            for (i in c) {
                n = data[c[i]];
                if (n == undefined) {
                    console.warn("Column '" + c[i] + "' is missing from record.");
                } else {
                    //Parse to string
                    r[i] = _toString(n, t[i]);
                }
            }
            //Save Record
            _db_array_set(table_name + "." + id, r);
        },
        _db_delete = function(table_name, id) {
            console.log("db delete " + id);
            //delete from guid list
            _db_array_remove(table_name + ".guidList", "" + id);
            //delete key
            localStorage.removeItem(global_key + "." + table_name + "." + id);
        },
        _db_deleteMultiple = function(table_name, id_array) {
            if (!tengu.isArray(id_array)) {
                throw new Error("_db_deleteMultiple Invalid array: " + id_array);
            }
            var i, n;
            for (i in id_array) {
                n = "" + id_array[i];
                //delete from guid list
                _db_array_remove(table_name + ".guidList", n);
                //delete key
                localStorage.removeItem(global_key + "." + table_name + "." + n);
            }

        },
        //Return an array of jsons, min<guid<max
        _db_queryGuidRange = function(table_name, min, max) {
            var g = _db_array_get(table_name + ".guidList"),
                q = [],
                r = [],
                i, n;
            //Iterate over guidList
            for (i in g) {
                //Get integer from string
                n = parseInt(g[i]);
                //If guid is in range
                if (!((n < min) || (n >= max))) {
                    //Add string index to array
                    q.push("" + n);
                }
            }

            //Return json array
            return _db_readMultiple(table_name, q);
        },
        //Return an array of keys
        _db_queryGuidGetLowest = function(table_name, n_entries) {
            var g = _db_array_get(table_name + ".guidList"),
                i;
            for (i in g) {
                g[i] = parseInt(g[i]);
            }
            //Sort array ascending
            g = tengu.sort(g);

            if (n_entries > g.length) {
                n_entries = g.length;
            }

            //copy lowest n entries to new array and return....
            return g.splice(0, n_entries);
        },
        //_db_queryGetHighest = function(table_name,column,n_entries){},
        _db_querySort = function(array, subindex, bool_descending) {};

    tengu.db_tableExists = function(name) {
        _checkWS(); //Throws error if web storage is unavailable
        return _db_tableExists(name);
    };

    tengu.db_newTable = function(name, schema) {
        _checkWS(); //Throws error if web storage is unavailable
        return _db_newTable(name, schema);
    };

    tengu.db_addColumn = function(table_name, column_name, type) {
        _checkWS(); //Throws error if web storage is unavailable
        return _db_addColumn(table_name, column_name, type);
    };

    tengu.db_create = function(table_name, data, force_uid) {
        _checkWS(); //Throws error if web storage is unavailable
        return _db_create(table_name, data, force_uid);
    };

    tengu.db_read = function(table_name, id) {
        _checkWS(); //Throws error if web storage is unavailable
        return _db_read(table_name, id);
    };

    tengu.db_readMultiple = function(table_name, id_array) {
        _checkWS(); //Throws error if web storage is unavailable
        return _db_readMultiple(table_name, id_array);
    };

    tengu.db_update = function(table_name, id, data) {
        _checkWS(); //Throws error if web storage is unavailable
        return _db_update(table_name, id, data);
    };

    tengu.db_delete = function(table_name, id) {
        _checkWS(); //Throws error if web storage is unavailable
        return _db_delete(table_name, id);
    };

    tengu.db_deleteMultiple = function(table_name, id_array) {
        _checkWS(); //Throws error if web storage is unavailable
        return _db_deleteMultiple(table_name, id_array);
    };

    tengu.db_queryGuidRange = function(table_name, min, max) {
        _checkWS(); //Throws error if web storage is unavailable
        return _db_queryGuidRange(table_name, min, max);
    };

    tengu.db_queryGuidGetLowest = function(table_name, n_entries) {
        _checkWS(); //Throws error if web storage is unavailable
        return _db_queryGuidGetLowest(table_name, n_entries);
    };

    tengu.webStorageAvailable = function() {
        return _canDoWS();
    };

    tengu.setGlobalKey = function(key) {
        global_key = key;
    };

    tengu.getGlobalKey = function() {
        return global_key;
    };

    tengu.requestQuota = (function() {
        var onError = function(e) {
                //Default error Handler
                //e is FileError object
                console.log('File System Error: ', e);
            },
            onSuccess = function(s) {
                //s is FileSystem object

                console.log("File System Request Successful!   " + "Name: " + s.name + ", Root: " + s.root);
            };


        return function(bytes, successHandler, errorHandler) {
            successHandler = successHandler || onSuccess;
            errorHandler = errorHandler || onError;

            //Skip this if there's no webkitPersistentStorage...
            if (_hasPersistentStorage) {
                navigator.webkitPersistentStorage.requestQuota(bytes, function(grantedBytes) {
                    window.webkitRequestFileSystem(PERSISTENT, grantedBytes, successHandler, errorHandler);
                }, errorHandler);
            } else {
                console.log("No webkitPersistentStorage");
            }
        };
    }());

    //calls callback(used,remaining)
    tengu.queryUsageAndQuota = function(callback, error) {
        callback = callback || function(used, remaining) {
            console.log("Used quota: " + used + ", remaining quota: " + remaining);
        };

        error = error || function(e) {
            console.log('Query Usage Error', e);
        };

        //Skip if no webkitPersistentStorage
        if (_hasPersistentStorage) {
            // Request storage usage and capacity left
            navigator.webkitPersistentStorage.queryUsageAndQuota(
                function(used, remaining) {
                    //Optional: do tengu stuff here...

                    //Call the callback
                    callback(used, remaining);
                }, error);
        } else {
            console.log("No webkitPersistentStorage");
        }
    };





    tengu.localSet = function(key, value, type) {
        var str;
        _checkWS(); //Throws error if web storage is unavailable

        str = _toString(value, type);
        localStorage[global_key + "." + key] = str;
    };

    tengu.localGet = function(key, type) {
        var str;
        _checkWS(); //Throws error if web storage is unavailable

        str = localStorage[global_key + "." + key];
        return _fromString(str, type);
    };

    tengu.localDelete = function(key){
        _checkWS(); //Throws error if web storage is unavailable
        return localStorage.removeItem(global_key + "." + key);
    };

    tengu.localArrayClear = function(key){
        _checkWS(); //Throws error if web storage is unavailable
        localStorage[global_key + "." + key] = undefined;

    };

    tengu.localArraySet = function(key, array, type) {
        var a = [],
            i, max;
        _checkWS(); //Throws error if web storage is unavailable

        max = array.length;
        for (i = 0; i < max; i += 1) {
            a[i] = _toString(array[i], type);
        }

        localStorage[global_key + "." + key] = a.join("¬");
    };
    //Removes all instances of value from array
    tengu.localArrayRemoveValue = function(key, value, type) {
        var a1 = tengu.localArrayGet(key,type);
        a1 = a1 || [];
        var a2 = tengu.arrayRemoveValue(a1,value);
        tengu.localArraySet(key, a2, type);
    };

    tengu.localArrayAppend = function(key, value, type) {
        //This can be made faster by not parsing the values already in array
        var a = tengu.localArrayGet(key, type);
        a = a || [];
        a.push(value);
        tengu.localArraySet(key, a, type);
    };

    //Appends array with value if value isn't in array already
    tengu.localAppendIfNotInArray = function(key, value, type) {
        var a = tengu.localArrayGet(key, type);
        a = a || [];
        if (a.indexOf(value) >= 0) {
            return false;
        } else {
            a.push(value);
            tengu.localArraySet(key, a, type);
            return true;
        }
    };

    //Replace the last item in the array
    tengu.localArrayReplaceLast = function(key, value, type) {
        //This can be made faster by not parsing the values already in array
        var a = tengu.localArrayGet(key, type),
            last;
        a = a || [];
        last = a.length - 1;

        if (last < 0) {
            last = 0;
        }

        a[last] = value;
        tengu.localArraySet(key, a, type);
    };

    tengu.localArrayGet = function(key, type) {
        var str, array, a = [],
            i, max;
        _checkWS(); //Throws error if web storage is unavailable

        str = localStorage[global_key + "." + key];

        //Return undefined if array doesn't exist
        if ((str == undefined) || (str == "undefined")) {
            return undefined;
        }

        array = str.split("¬");

        max = array.length;
        for (i = 0; i < max; i += 1) {
            a[i] = _fromString(array[i], type);
        }
        return a;
    };

    //Clears all data from local storage
    tengu.localClearAllData = function() {
        if (!global_key) {
            throw new Error("No Global Key Set!!!!");
        }

        var i, max, gkl, k, dlist = [];
        gkl = global_key.length;
        max = localStorage.length;
        for (i = 0; i < max; i += 1) {
            k = localStorage.key(i);
            //check for global key match
            if (k.slice(0, gkl) == global_key) {
                //add to deletelist
                dlist.push(k);
            }
        }

        for (i in dlist) {
            localStorage.removeItem(dlist[i]);
        }
    };

    //Log everything in local storage
    tengu.localStorageLog = function(show_values) {
        if (show_values == undefined) {
            show_values = false;
        }
        var i, max, k,
            NL = "\r\n",
            s = "";
        max = localStorage.length;
        s += "//Begin localStorage//////////////////////////////////////////////////////////////////////////" + NL;
        for (i = 0; i < max; i += 1) {
            k = localStorage.key(i);
            s += k;
            if (show_values) {
                s += ": " + localStorage[k]
            }
            s += NL;
        }
        s += "//End localStorage////////////////////////////////////////////////////////////////////////////" + NL;

        tengu.getDLURLfromString(s, "localStorageLog.txt");
    };
};


//////////////////////////////////////////////////////////////////////////////////////////////////////
// Animation Tweening Module
//////////////////////////////////////////////////////////////////////////////////////////////////////
Tengu.modules.tween = function(tengu) {
    //Functions for Animation Tweening
    //
    //Sine returns sine wave based on interval(ms), with offset of start_time (T.now() time at start as offset )
    tengu.getSine = function(interval, start_time) {
        var now = tengu.now(),
            x;
        if (start_time) {
            now += start_time % interval;
        }

        x = now % interval;
        x /= interval;
        x *= Math.PI * 2;
        return (Math.sin(x) + 1) / 2;
    };

    tengu.middleSquare = function(x) {
        var n = x,
            p = 64,
            hp = p / 2,
            qp = p / 4,
            max = Math.pow(2, p),
            min,
            s;

        while (n < max) {
            n *= x;
        }

        max = Math.pow(2, hp + qp);
        min = Math.pow(2, qp);
        s = Math.pow(2, hp);

        n = n % max;
        n = Math.floor(n / min);
        n /= s;
        return n;
    };

    tengu.getSmoothNoise = function(interval) {
        var n0 = Math.floor(tengu.now() / interval),
            n1 = n0 + 1,
            x = (tengu.now() % interval) / interval,
            r0 = tengu.middleSquare(n0),
            r1 = tengu.middleSquare(n1);

        return ((r0 * (1 - x)) + (r1 * x));
    };

    tengu.getIntervalRot = function(interval, clockwise) {
        var x = (tengu.now() % interval) / interval;
        if (!clockwise) {
            x = 1 - x;
        }
        return x * Math.PI * 4;
    };

    tengu.getIntervalDiscrete = function(interval, n) {
        var x = (tengu.now() % interval) / interval;
        return Math.floor(x * n);
    };

    tengu.arcFadeIn = function(tween) {
        var idt = 1 - tween;
        return (1 - Math.sqrt(1 - (idt * idt)));
    };

    tengu.arcFadeOut = function(tween) {
        return Math.sqrt(1 - (tween * tween));
    };

    tengu.Tween = function() {
        this.time = [];
        this.nCallback = [];
        this.time.push(0);
        this.startTime = tengu.now();
        this.data = {};

        this.callback = null;
        this.state = 0;
    }

    tengu.Tween.prototype.addInterval = function(time, callback) {
        var n = this.time.length - 1;
        this.time.push(this.time[n] + time);
        if (callback) {
            this.nCallback[n + 1] = callback;
        }
    };

    tengu.Tween.prototype.setStartTime = function(time) {
        this.startTime = tengu.now() + time;
    };

    tengu.Tween.prototype.restart = function() {
        this.startTime = tengu.now();
        this.update();
    };

    tengu.Tween.prototype.setCallback = function(callback) {
        this.callback = callback;
    };

    tengu.Tween.prototype.update = function() {
        var now = tengu.now(),
            n = 0,
            i,
            t,
            m,
            x;

        for (i = 0; i < this.time.length; i += 1) {
            if (now >= this.time[i] + this.startTime) {
                n = i;
            }
        }

        if (this.state != n) {
            //Call the general callback if available
            if (this.callback) {
                this.callback({
                    n: n
                });
            }
            //Call the interval specific callback if available
            if (this.nCallback[n]) {
                this.nCallback[n]();
            }

            //Update the state
            this.state = n;
        }

        t = -1;
        if (n < this.time.length - 1) {
            m = this.time[n + 1] - this.time[n];
            x = now - (this.time[n] + this.startTime);
            t = x / m;
        }

        this.data = {
            n: n,
            t: t
        };
    };

    tengu.Tween.prototype.getIndex = function() {
        return this.data.n;
    };
    tengu.Tween.prototype.getTween = function(index) {
        if (index == undefined) {
            return this.data.t;
        } else {
            var n = this.data.n;

            if (n < index) {
                return 0;
            }

            if (n == index) {
                return this.data.t;
            }

            if (n > index) {
                return 1;
            }
        }
    };

};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Geolocation Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.geoloc = function(tengu) {
    //Requires date module
    var onSuccess = function(p) {
            console.log("Geoloc Success: ", p);
            //Get last response time
            _lastResponseTime = tengu.date() - _lastCallDate;

            //Add values to p
            p.date = _lastCallDate;
            p.response_time = _lastResponseTime;

            //Save p to lastPosition
            _lastPosition = p;


            if (_onSuccessCallback != undefined) {
                _onSuccessCallback(p);
            }
        },
        onError = function(e) {
            console.warn('Geoloc Error: (' + e.code + '): ' + e.message);
        },
        _geoLocGeneral = function(funcName, success, error) {
            console.log("Geoloc Called");
            _onSuccessCallback = success;
            error = error || onError;

            _lastCallDate = tengu.date();

            if (navigator.geolocation) {
                _geolocID = navigator.geolocation[funcName](onSuccess, error, _pOptions);
                return _geolocID;
            } else {
                console.warn("ERROR: navigator.geolocation is unavailable");
                return false;
            }
        },
        _geolocID,
        _pOptions,
        _onSuccessCallback,
        _lastPosition,
        _lastCallDate,
        _lastResponseTime;

    /**
     * Returns true of character is uppercase
     * @param {Boolean} enableHighAccuracy		Enables high accuracy results
     * @param {Int} timeout			Max ms to wait for result.  Infinity waits until position is available.
     * @param {Int} maximumAge		Max age in ms of cached result.  Set to 0 to never use cached result.
     * @return {Boolean}       		True if its a string
     */

    /*
     * Documentation:
     * PositionOptions.enableHighAccuracy
		Is a Boolean that indicates the application would like to receive the best possible results. If true and if the device is able to provide a more accurate position, it will do so. Note that this can result in slower response times or increased power consumption (with a GPS chip on a mobile device for example). On the other hand, if false (the default value), the device can take the liberty to save resources by responding more quickly and/or using less power.

		PositionOptions.timeout
		Is a positive long value representing the maximum length of time (in milliseconds) the device is allowed to take in order to return a position. The default value is Infinity, meaning that getCurrentPosition() won't return until the position is available.

		PositionOptions.maximumAge
		Is a positive long value indicating the maximum age in milliseconds of a possible cached position that is acceptable to return. If set to 0, it means that the device cannot use a cached position and must attempt to retrieve the real current position. If set to Infinity the device must return a cached position regardless of its age.
     */

    //Returns array of [lat,long]
    tengu.getLastCoords = function() {
        //coords
        if (!_lastPosition) {
            return undefined;
        } else {
            var p = _lastPosition,
                c = [
                    p.coords.latitude,
                    p.coords.longitude
                ];
            return c;
        }
    };

    tengu.getLastGeoloc = function() {
        return tengu.clone(_lastPosition);

        //position: {coords,timestamp}
        /*coords: {
         * 	latitude,
         *  longitude,
         *  altitude,
         *  accuracy,
         *  altitudeAccuracy,
         *  heading,
         *  speed,
         * }
         * date,           -When was the geoloc call sent
         * response_time   -How long did it take for geoloc to respond?
         */
    };

    tengu.setGeolocOptions = function(enableHighAccuracy, timeout, maximumAge) {
        _pOptions = {
            enableHighAccuracy: enableHighAccuracy || false,
            timeout: timeout || Infinity,
            maximumAge: maximumAge || 0
        };
    };

    //Asks the user whether to use geoloc
    tengu.pingGeoloc = function(success, error) {
        return tengu.getGeoloc(success, error);
    };

    //Get geoloc with success & error callbacks
    tengu.getGeoloc = function(success, error) {
        return _geoLocGeneral("getCurrentPosition", success, error);
    };

    //Continuous success calls
    tengu.watchGeoloc = function(success, error) {
        id = _geoLocGeneral("watchPosition", success, error);
        return id;
    };

    //Clear watch
    tengu.clearWatchGeoloc = function(id) {
        id = id || _geolocID;

        if (navigator.geolocation) {
            navigator.geolocation.clearWatch(id);
        } else {
            console.warn("ERROR: navigator.geolocation is unavailable");
        }
    }; //end method

}; //end module


//////////////////////////////////////////////////////////////////////////////////////////////////////
// Date Module
//////////////////////////////////////////////////////////////////////////////////////////////////////
Tengu.modules.date = function(tengu) {
    //Add node support later - boot if window is not available
    if (typeof window != 'undefined'){

    var p = window.performance || {},
        Timer = function Timer() {
            this.callstack = [];
            this.index = 0;
            this.looping = false;
        },
        _timeNow = function(dateObj) {
            return ((dateObj.getHours() < 10) ? "0" : "") + dateObj.getHours() + ":" + ((dateObj.getMinutes() < 10) ? "0" : "") + dateObj.getMinutes() + ":" + ((dateObj.getSeconds() < 10) ? "0" : "") + dateObj.getSeconds();
        },
        _setDate = function(datetime, year, month, date, day, hours, minutes, seconds, ms) {
            var d = new Date(datetime),
                dd;
            //month,week,midnight
            if (month != undefined) {
                d.setMonth(month);
            }
            if (date != undefined) {
                d.setDate(date);
            }
            if (day != undefined) {

                dd = day - d.getDay();
                console.log("dd", dd, day, d.getDay());
                while (dd < -6) {
                    dd += 7;
                }
                while (dd > 0) {
                    dd -= 7;
                }

                d.setTime(d.getTime() + (dd * 86400000));
            }
            if (hours != undefined) {
                d.setHours(hours);
            }
            if (minutes != undefined) {
                d.setMinutes(minutes);
            }
            if (seconds != undefined) {
                d.setSeconds(seconds);
            }
            if (ms != undefined) {
                d.setMilliseconds(ms);
            }
            return d.getTime();
        },
        timer;
    //Window.perfNow polyfill
    //http://bkcore.com/blog/code/performance-now-polyfill-timer.html
    (function(w) {
        var perfNow;
        var perfNowNames = ['now', 'webkitNow', 'msNow', 'mozNow'];
        if (!!w['performance'])
            for (var i = 0; i < perfNowNames.length; ++i) {
                var n = perfNowNames[i];
                if (!!w['performance'][n]) {
                    perfNow = function() {
                        return w['performance'][n]()
                    };
                    break;
                }
            }
        if (!perfNow) {
            perfNow = Date.now;
        }
        w.perfNow = perfNow;
    })(window);

    //tengu.now()
    tengu.now = function() {
        return window.perfNow();
    };

    //Timer - Private Functions
    Timer.prototype._loop = function() {
        var n,
            i;

        for (i in this.callstack) {
            n = this.callstack[i];

            if (n.t <= tengu.now()) {
                n.c();
                this.callstack.splice(i, 1);
            }
        }

        this.looping = false;
        if (this.callstack.length > 0) {
            this.looping = true;
            setTimeout(tengu.createCallback(this, this._loop, null), 0);
        }
    };

    Timer.prototype.set = function(callback, duration) {
        var t = tengu.now() + duration;
        this.callstack[this.index] = {
            n: this.index,
            c: callback,
            t: t
        };
        this.index += 1;

        if (!this.looping) {
            this._loop();
        }

        return (this.index - 1);
    };

    Timer.prototype.clear = function(index) {
        var i;
        for (i in this.callstack) {
            if (this.callstack[i].n == index) {
                this.callstack.splice(i, 1);
            }
        }
    };

    timer = new Timer();

    }//end if window exists

    //Time constants
    
    tengu.MS_PER_YEAR = 31560000000;
    tengu.MS_PER_MONTH = 2630000000;
    tengu.MS_PER_DAY = 86400000;
    tengu.MS_PER_WEEK = tengu.MS_PER_DAY * 7;
    tengu.MS_PER_HOUR = 3600000;
    tengu.MS_PER_MINUTE = 60000;
    tengu.MS_PER_SECOND = 1000;

    //Get date (ms from 1970)
    tengu.date = function() {
        return new Date().getTime();
    };

    //Parse date - returns ms
    tengu.parseDate = function(string) {
        var d = new Date(string);
        return d.getTime();
    };

    tengu.getYear = function(datetime) {
        var d = new Date(datetime);
        return d.getFullYear();
    };

    //Get timespan in hours
    tengu.getHourSpan = function(t1, t2) {
        return ((t2 - t1) / 3600000);
    };

    //Get local am or pm
    tengu.getAMPM = function(datetime) {
        var d = new Date(datetime);
        return d.getHours() >= 12 ? 'PM' : 'AM';
    };
    //Arg is data structure {d,h,m,s}, each being optional
    //returns total millisecs
    tengu.dhmsToMs = function(data) {
        var ms = 0,
            key = {
                d: 86400000,
                h: 3600000,
                m: 60000,
                s: 1000
            },
            i;

        for (i in data) {
            if (key[i]) {
                ms += key[i] * data[i];
            }
        }
        return ms;
    };

    tengu.dhmsStringSingle = function(ms) {
        var d = 86400000,
            h = 3600000,
            m = 60000,
            s = 1000;
        if (ms > d) {
            return "" + Math.round(ms / d) + "d";
        } else if (ms > h) {
            return "" + Math.round(ms / h) + "h";
        } else if (ms > m) {
            return "" + Math.round(ms / m) + "m";
        } else {
            return "" + Math.round(ms / s) + "s";
        }
    };

    tengu.dhmsString = function(ms) {
        var st = "",
            y = 31560000000,
            mo = 2630000000,
            d = 86400000,
            h = 3600000,
            m = 60000,
            s = 1000;

        if (ms < 0){
            st += "-";
        }

        ms = Math.abs(ms);

        if (ms >= y) {
            st += Math.floor(ms / y) + "Y";
            ms = ms % y;
        }

        if (ms >= mo) {
            st += Math.floor(ms / mo) + "M";
            ms = ms % mo;
        }

        if (ms >= d) {
            st += Math.floor(ms / d) + "d";
            ms = ms % d;
        } 

        if (ms >= h) {
            st += Math.floor(ms / h) + "h";
            ms = ms % h;
        } 

        if (ms >= m) {
           st += Math.floor(ms / m) + "m";
           ms = ms % m;
        } 

        st += Math.floor(ms / s) + "s";

        return st;
        
    };

    tengu.hmsString = function(ms) {
        var h = Math.floor(ms / 3600000),
            m = Math.floor(ms % 3600000 / 60000),
            s = Math.floor(ms % 60000 / 1000),
            str = "";
        str += tengu.numToString_minDigits(h, 2) + ":";
        str += tengu.numToString_minDigits(m, 2) + ":";
        str += tengu.numToString_minDigits(s, 2);
        return str;
    }

    //Returns string "Xh XXm" from ms
    tengu.msToHourMinString = function(ms) {
        var s = "",
            h = Math.floor(ms / 3600000),
            m = Math.floor((ms % 3600000) / 60000);

        if (h) {
            s += h + "h";
            if (m) {
                s += " ";
            }
        }
        if (m) {
            s += m + "m";
        }

        return s;
    };

    tengu.getLast_midnight = function(datetime) {
        return _setDate(datetime, undefined, undefined, undefined, undefined, 0, 0, 0, 0);
    };

    tengu.getLast_sunday = function(datetime) {
        //(datetime,year,month,date,day,hours,minutes,seconds,ms)
        var d = _setDate(datetime, undefined, undefined, undefined, 0, 0, 0, 0, 0);
        return tengu.getLast_midnight(d);
    };

    tengu.getLast_firstOfMonth = function(datetime) {
        var d = _setDate(datetime, undefined, undefined, 1, undefined, 0, 0, 0, 0);
        return d;
    };

    tengu.getLast_firstOfYear = function(datetime) {
        var d = _setDate(datetime, undefined, 0, 1, undefined, 0, 0, 0, 0);
        return d;
    };
    tengu.getNext_firstOfYear = function(datetime) {
        var d = tengu.getLast_firstOfYear(datetime),
            dd = new Date(d);
        dd.setFullYear(dd.getFullYear() + 1);

        return dd.getTime();
    };

    tengu.getNext_firstOfMonth = function(datetime) {
        var d = tengu.getLast_firstOfMonth(datetime),
            dd = new Date(d),
            m = dd.getMonth() + 1;
        if (m >= 12) {
            m -= 12;
        }
        dd.setMonth(m);

        return dd.getTime();
    };

    tengu.daysInMonth = function(datetime) {
        var d = new Date(datetime);
        return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    };

    var _getMonthIndex = function(datetime) {
        var d = new Date(datetime);
        return d.getMonth();
    };

    tengu.getMonthName_short = function(datetime) {
        var m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return m[_getMonthIndex(datetime)]
    };

    tengu.getMonthName = function(datetime) {
        var m = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return m[_getMonthIndex(datetime)]
    };

    tengu.addHours = function(datetime, hours) {
        return datetime + (hours * 3600000);
    };

    tengu.addDays = function(datetime, days) {
        return datetime + (days * 86400000);
    };
    tengu.addWeeks = function(datetime, weeks) {
        return datetime + (weeks * 604800000);
    };
    tengu.addMonths = function(datetime, months) {
        var d = new Date(datetime),
            m = d.getMonth(),
            y = 0;
        m += months;
        while (m >= 12) {
            m -= 12;
            y += 1;
        }
        while (m < 0) {
            m += 12;
            y -= 1;
        }
        d.setFullYear(d.getFullYear() + y);
        d.setMonth(m);

        return d.getTime();
    };

    tengu.addYears = function(datetime, years) {
        var d = new Date(datetime);
        d.setFullYear(d.getFullYear() + years);

        return d.getTime();
    };

    //Get timestamp string
    //2013-12-12_05:04
    tengu.dateToTimeStamp = function(datetime) {
        var d = new Date(datetime),
            s;

        d.f = function() {
            var s = this.getFullYear() + "-";
            s += (((this.getMonth() + 1) < 10) ? "0" : "") + (this.getMonth() + 1) + "-";
            s += ((this.getDate() < 10) ? "0" : "") + this.getDate() + "_";
            s += _timeNow(this);
            return s;
        }

        s = d.f();
        delete d;
        return s;
    };

    //Get timestring
    //4:00 AM  12/12/13
    tengu.dateToTimeString = function(datetime, flag) {
        var d = new Date(datetime),
            s;

        d.f = function() {
            var _flag = flag;
            if (_flag == "date_only") {
                return this.toLocaleDateString();
            }

            var s = this.toLocaleTimeString(),
                s0 = s.substr(0, s.length - 6),
                s1 = s.substr(s.length - 3, 3);

            if (_flag == "time_only") {
                return (s0 + s1);
            }

            s = s0 + s1 + "  ";
            s += this.toLocaleDateString();

            return s;
        };

        s = d.f();
        delete d;
        return s;
    };

    tengu.dateToHourString = function(datetime) {
        return tengu.dateToTimeString(datetime, "time_only");
    };
    tengu.dateToDateString = function(datetime) {
        return tengu.dateToTimeString(datetime, "date_only");
    };

    //Timer Public Functions
    tengu.setTimeout = function(callback, duration) {
        return timer.set(callback, duration);
    };

    tengu.clearTimeout = function(index) {
        timer.clear(index);
    };

};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Draw Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.draw = function(tengu) {
    //Add node support later - boot if window is not available
    if (typeof window == 'undefined'){
        return false;
    }
    var SQRT3DIV4 = 0.43301270189221932338186158537647;

    //Canvas drawing methods
    //Draws a circle
    tengu.drawCircle = function(ctx, x, y, r) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    };


    //Draws a line
    tengu.drawLine = function(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };


    //Tri is [{x,y},{x,y},{x,y}]
    tengu.drawTriangle = function(ctx, x, y, tri, scale, cache) {
        scale = scale || 1;
        if (cache == undefined) {
            cache = false;
        }

        var p = [],
            i;

        for (i = 0; i < 3; i += 1) {
            p[i] = {
                x: (tri[i].x * scale),
                y: (tri[i].y * scale)
            }
        }

        //Save to cache here if needed....

        ctx.beginPath();
        ctx.moveTo(x + p[0].x, y + p[0].y);
        ctx.lineTo(x + p[1].x, y + p[1].y);
        ctx.lineTo(x + p[2].x, y + p[2].y);
        ctx.closePath();
    }; //end method

    tengu.drawTriRect = function(ctx, x, y, w, h, dir) {
        var hx = (w / 2) + x,
            hy = (h / 2) + y,
            fx = w + x,
            fy = h + y,
            p;

        switch (dir) {
            case "left":
                p = [{
                    x: x,
                    y: hy
                }, {
                    x: fx,
                    y: y
                }, {
                    x: fx,
                    y: fy
                }];
                break;
            case "right":
                p = [{
                    x: fx,
                    y: hy
                }, {
                    x: x,
                    y: y
                }, {
                    x: x,
                    y: fy
                }];
                break;
            case "down":
                p = [{
                    x: hx,
                    y: fy
                }, {
                    x: x,
                    y: y
                }, {
                    x: fx,
                    y: y
                }];
                break;
            case "up":
            default:
                p = [{
                    x: hx,
                    y: y
                }, {
                    x: x,
                    y: fy
                }, {
                    x: fx,
                    y: fy
                }];
                break;
        }

        //Draw
        ctx.beginPath();
        ctx.moveTo(p[0].x, p[0].y);
        ctx.lineTo(p[1].x, p[1].y);
        ctx.lineTo(p[2].x, p[2].y);
        ctx.closePath();
    }; //End Method


    //Dir is string "up","right","down","left"
    tengu.drawEqTri = function(ctx, x, y, scale, dir) {
        var p = [{
                x: 0,
                y: -0.5
            }, {
                x: -SQRT3DIV4,
                y: 0.25
            }, {
                x: SQRT3DIV4,
                y: 0.25
            }],
            i, a;

        switch (dir) {
            case "right":
                for (i = 0; i < 3; i += 1) {
                    a = p[i].y * -1;
                    p[i].y = p[i].x;
                    p[i].x = a;
                }
                break;

            case "left":
                for (i = 0; i < 3; i += 1) {
                    a = p[i].y;
                    p[i].y = p[i].x;
                    p[i].x = a;
                }
                break;

            case "down":
                for (i = 0; i < 3; i += 1) {
                    p[i].y *= -1;
                }
                break;

            case "up":
            default:
                //Do nothing, default p is up
                break;
        } //end switch

        //Draw the triangle
        tengu.drawTriangle(ctx, x, y, p, scale);

    }; //end method

    //'data' is a string of svg path data
    tengu.drawPath = function(ctx, x, y, scale, data) {
        var p, i, len, c, pos;
        pos = {
            x: x,
            y: y
        };
        p = data.split(/[\s,]/i);
        c = null;
        for (i = 0, len = p.length; i < len; i++) {
            //Ref - http://www.w3schools.com/svg/svg_path.asp
            //https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths
            switch (p[i].toLowerCase()) {
                case 'm':
                case 'l':
                case 'c':
                case 'z':
                case 'h':
                case 'v':
                case 'a':
                    c = p[i];
                    if (c.toLowerCase() == 'z')
                        ctx.closePath();
                    break;

                default:
                    switch (c.toLowerCase()) {
                        case 'm':
                            if (tengu.isUpperCase(c)) {
                                //Absolute positioning
                                pos.x = x + (p[i] * scale);
                                pos.y = y + (p[i + 1] * scale);
                            } else {
                                //Relative positioning
                                pos.x += p[i] * scale;
                                pos.y += p[i + 1] * scale;
                            }

                            ctx.moveTo(pos.x, pos.y);
                            i += 1;
                            c = "l";
                            break;
                        case 'l':
                            if (tengu.isUpperCase(c)) {
                                //Absolute positioning
                                pos.x = x + (p[i] * scale);
                                pos.y = y + (p[i + 1] * scale);
                            } else {
                                //Relative positioning
                                pos.x += p[i] * scale;
                                pos.y += p[i + 1] * scale;
                            }

                            ctx.lineTo(pos.x, pos.y);
                            i += 1;
                            break;
                        case 'h':
                            if (tengu.isUpperCase(c)) {
                                //Absolute positioning
                                pos.x = x + (p[i] * scale);
                            } else {
                                //Relative positioning
                                pos.x += p[i] * scale;
                            }

                            ctx.lineTo(pos.x, pos.y);
                            break;
                        case 'v':
                            if (tengu.isUpperCase(c)) {
                                //Absolute positioning
                                pos.y = y + (p[i] * scale);
                            } else {
                                //Relative positioning
                                pos.y += p[i] * scale;
                            }

                            ctx.lineTo(pos.x, pos.y);
                            break;
                        case 'c':
                            if (tengu.isUpperCase(c)) {
                                //Absolute positioning
                                var cp1 = {
                                    x: x + (p[i] * scale),
                                    y: y + (p[i + 1] * scale)
                                };
                                var cp2 = {
                                    x: x + (p[i + 2] * scale),
                                    y: y + (p[i + 3] * scale)
                                };
                                pos.x = x + p[i + 4] * scale;
                                pos.y = y + p[i + 5] * scale;
                            } else {
                                //Relative positioning
                                var cp1 = {
                                    x: pos.x + (p[i] * scale),
                                    y: pos.y + (p[i + 1] * scale)
                                };
                                var cp2 = {
                                    x: pos.x + (p[i + 2] * scale),
                                    y: pos.y + (p[i + 3] * scale)
                                };
                                pos.x += p[i + 4] * scale;
                                pos.y += p[i + 5] * scale;
                            }

                            ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, pos.x, pos.y);
                            i += 5;
                            break;
                        case 'a':
                            //Draw arc....
                            //Paramenters: rx, ry, x-axis-rotation, large-arc-flag, sweep-flag, x, y
                            var rx = p[i] * scale,
                                ry = p[i + 1] * scale,
                                xAxisRotation = p[i + 2],
                                largeArcFlag = p[i + 3],
                                sweepFlag = p[i + 4],
                                tx = p[i + 5] * scale,
                                ty = p[i + 6] * scale;
                            if (tengu.isUpperCase(c)) {
                                //Absolute positioning
                                rx += x;
                                ry += y;
                                tx += x;
                                ty += y;
                            } else {
                                //Relative positioning
                                rx += pos.x;
                                ry += pos.y;
                                tx += pos.x;
                                ty += pos.y;
                            }
                            // //endpoint to center conversion
                            // var currp = {
                            //     x: Math.cos(xAxisRotation) * (pos.x - tx) / 2.0 + Math.sin(xAxisRotation) * (pos.y - ty) / 2.0,
                            //     y: -Math.sin(xAxisRotation) * (pos.x - tx) / 2.0 + Math.cos(xAxisRotation) * (pos.y - ty) / 2.0
                            // };

                            // // adjust radii
                            // var l = Math.pow(currp.x,2)/Math.pow(rx,2)+Math.pow(currp.y,2)/Math.pow(ry,2);
                            // if (l > 1) {
                            //     rx *= Math.sqrt(l);
                            //     ry *= Math.sqrt(l);
                            // }

                            // // cx', cy'
                            // var s = (largeArcFlag == sweepFlag ? -1 : 1) * Math.sqrt(
                            //     ((Math.pow(rx,2)*Math.pow(ry,2))-(Math.pow(rx,2)*Math.pow(currp.y,2))-(Math.pow(ry,2)*Math.pow(currp.x,2))) /
                            //     (Math.pow(rx,2)*Math.pow(currp.y,2)+Math.pow(ry,2)*Math.pow(currp.x,2))
                            // );
                            // if (isNaN(s)) s = 0;
                            // var cpp = {
                            //             x: s * rx * currp.y / ry, 
                            //             y: s * -ry * currp.x / rx
                            //         };

                            // // cx, cy
                            // var centp = {
                            //     (pos.x + cp.x) / 2.0 + Math.cos(xAxisRotation) * cpp.x - Math.sin(xAxisRotation) * cpp.y,
                            //     (pos.y + cp.y) / 2.0 + Math.sin(xAxisRotation) * cpp.x + Math.cos(xAxisRotation) * cpp.y
                            // };
                            // // vector magnitude
                            // var m = function(v) { return Math.sqrt(Math.pow(v[0],2) + Math.pow(v[1],2)); }
                            // // ratio between two vectors
                            // var r = function(u, v) { return (u[0]*v[0]+u[1]*v[1]) / (m(u)*m(v)) }
                            // // angle between two vectors
                            // var a = function(u, v) { return (u[0]*v[1] < u[1]*v[0] ? -1 : 1) * Math.acos(r(u,v)); }
                            // // initial angle
                            // var a1 = a([1,0], [(currp.x-cpp.x)/rx,(currp.y-cpp.y)/ry]);
                            // // angle delta
                            // var u = [(currp.x-cpp.x)/rx,(currp.y-cpp.y)/ry];
                            // var v = [(-currp.x-cpp.x)/rx,(-currp.y-cpp.y)/ry];
                            // var ad = a(u, v);
                            // if (r(u,v) <= -1) ad = Math.PI;
                            // if (r(u,v) >= 1) ad = 0;

                            i += 6;
                            break;
                            /*
                        case 'A':
                    case 'a':
                        while (!pp.isCommandOrEnd()) {
                            var curr = pp.current;
                            var rx = pp.getScalar();
                            var ry = pp.getScalar();
                            var xAxisRotation = pp.getScalar() * (Math.PI / 180.0);
                            var largeArcFlag = pp.getScalar();
                            var sweepFlag = pp.getScalar();
                            var cp = pp.getAsCurrentPoint();

                            // Conversion from endpoint to center parameterization
                            // http://www.w3.org/TR/SVG11/implnote.html#ArcImplementationNotes
                            // x1', y1'
                            var currp = new svg.Point(
                                Math.cos(xAxisRotation) * (curr.x - cp.x) / 2.0 + Math.sin(xAxisRotation) * (curr.y - cp.y) / 2.0,
                                -Math.sin(xAxisRotation) * (curr.x - cp.x) / 2.0 + Math.cos(xAxisRotation) * (curr.y - cp.y) / 2.0
                            );
                            // adjust radii
                            var l = Math.pow(currp.x,2)/Math.pow(rx,2)+Math.pow(currp.y,2)/Math.pow(ry,2);
                            if (l > 1) {
                                rx *= Math.sqrt(l);
                                ry *= Math.sqrt(l);
                            }
                            // cx', cy'
                            var s = (largeArcFlag == sweepFlag ? -1 : 1) * Math.sqrt(
                                ((Math.pow(rx,2)*Math.pow(ry,2))-(Math.pow(rx,2)*Math.pow(currp.y,2))-(Math.pow(ry,2)*Math.pow(currp.x,2))) /
                                (Math.pow(rx,2)*Math.pow(currp.y,2)+Math.pow(ry,2)*Math.pow(currp.x,2))
                            );
                            if (isNaN(s)) s = 0;
                            var cpp = new svg.Point(s * rx * currp.y / ry, s * -ry * currp.x / rx);
                            // cx, cy
                            var centp = new svg.Point(
                                (curr.x + cp.x) / 2.0 + Math.cos(xAxisRotation) * cpp.x - Math.sin(xAxisRotation) * cpp.y,
                                (curr.y + cp.y) / 2.0 + Math.sin(xAxisRotation) * cpp.x + Math.cos(xAxisRotation) * cpp.y
                            );
                            // vector magnitude
                            var m = function(v) { return Math.sqrt(Math.pow(v[0],2) + Math.pow(v[1],2)); }
                            // ratio between two vectors
                            var r = function(u, v) { return (u[0]*v[0]+u[1]*v[1]) / (m(u)*m(v)) }
                            // angle between two vectors
                            var a = function(u, v) { return (u[0]*v[1] < u[1]*v[0] ? -1 : 1) * Math.acos(r(u,v)); }
                            // initial angle
                            var a1 = a([1,0], [(currp.x-cpp.x)/rx,(currp.y-cpp.y)/ry]);
                            // angle delta
                            var u = [(currp.x-cpp.x)/rx,(currp.y-cpp.y)/ry];
                            var v = [(-currp.x-cpp.x)/rx,(-currp.y-cpp.y)/ry];
                            var ad = a(u, v);
                            if (r(u,v) <= -1) ad = Math.PI;
                            if (r(u,v) >= 1) ad = 0;

                            // for markers
                            var dir = 1 - sweepFlag ? 1.0 : -1.0;
                            var ah = a1 + dir * (ad / 2.0);
                            var halfWay = new svg.Point(
                                centp.x + rx * Math.cos(ah),
                                centp.y + ry * Math.sin(ah)
                            );
                            pp.addMarkerAngle(halfWay, ah - dir * Math.PI / 2);
                            pp.addMarkerAngle(cp, ah - dir * Math.PI);

                            bb.addPoint(cp.x, cp.y); // TODO: this is too naive, make it better
                            if (ctx != null) {
                                var r = rx > ry ? rx : ry;
                                var sx = rx > ry ? 1 : rx / ry;
                                var sy = rx > ry ? ry / rx : 1;

                                ctx.translate(centp.x, centp.y);
                                ctx.rotate(xAxisRotation);
                                ctx.scale(sx, sy);
                                ctx.arc(0, 0, r, a1, a1 + ad, 1 - sweepFlag);
                                ctx.scale(1/sx, 1/sy);
                                ctx.rotate(-xAxisRotation);
                                ctx.translate(-centp.x, -centp.y);
                            }
                        }
                        break;
                         */

                        case 'Z':
                        case 'z':
                            ctx.closePath();
                            break;
                        default:
                            if (window.console) {
                                window.console.log(p[i]);
                            }
                            break;
                    }
            } //end switch
        } //end for
    }; //end method
}; //end module


//////////////////////////////////////////////////////////////////////////////////////////////////////
// Graph Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.graph = function(tengu) {
    //Wrap tengu's now function
    var _now = tengu.now;
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Visual Object Manager
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    var _makeVOM = function(w,h){
        //Privates /////////////////////////////////////////////////////////////////////
        var _tween_duration = 500;
        //View is all 0-1 float
        var _view = {
            x:0,
            y:0,
            w:1,
            h:1
        }
        //Private Data Model////////////////////////////////////////////////////////////
        var _data = [];
        //for each: x,y,w,h,s,r - [target,old,tween_start,tween_end] - as array!!!!!
        
        //Private Methods/////////////////////////////////////////////////////////////
        var _createValue = function(x){
            return [x,null,null,null] //[target,old,tween_start,tween_duration]
        };
        var _createPoint = function(x,y,data){
            return {
                x: _createValue(x),
                y: _createValue(y),
                w: _createValue(0),
                h: _createValue(0),
                type: "point",
                data: data
            }
        };

        var _createRect = function(x,y,w,h,style,data){
            return {
                x: _createValue(x),
                y: _createValue(y),
                w: _createValue(w),
                h: _createValue(h),
                style: style,
                type: "rect",
                data: data
            }
        };

        var _createLine = function(pointArray,style,data){
            var l = {
                point: [],
                style: style,
                type: "line",
                data: data
            }

            var i,n;
            for (i in pointArray){
                n = pointArray[i];
                l.point.push(_createPoint(n.x,n.y,n.data));
            }

            return l;
        };

        var _getDrawValue = function(vArray){
            var now = _now(),
                tv = vArray[0],
                ov = vArray[1],
                t_start = vArray[2],
                t_duration = vArray[3],
                t_end,dv,r,delta;
            //If old value isn't set, return current
            if (ov==null){
                return tv;
            }
            //Calc tween end
            t_end = t_start + t_duration;

            //If now is past tween end, stop tween
            if (now>=t_end){
                vArray[1]=null;
                vArray[2]=null;
                vArray[3]=null;
                return tv;
            }

            //Calc tween ratio
            r = (now-t_start)/t_duration;

            //Calc delta
            delta = tv - ov;

            //Calc drawvalue
            dv = (delta*r) + ov;

            //Return drawvalue
            return dv;

        };

        var _setTween = function(vArray,target_value,start_time,duration){
            var va = vArray,
                tv = target_value,
                t_duration = duration,
                ov;
            //Get current draw value
            ov = _getDrawValue(va);
            //Set
            vArray[0]=tv;
            vArray[1]=ov;
            vArray[2]=start_time;
            vArray[3]=t_duration;

            return vArray;
        };

        var _render = function(vx,vy,vw,vh){
            var left = vx,
                top = vy,
                right = vx+vw,
                bottom = vy+vh,
                buffer = [];
                view = [];

            var _checkIntersect = function(drawBufferObj,view){
                var o = drawBufferObj,
                    v = view;
                
            };

            var _getDrawBuffer = function(data){
                var buffer=[],
                    i,n,d,
                    j,nn,dd,
                    line_l,line_r,line_t,line_b;

                for (i in data){
                    n = data[i];
                    d = {};
                    d.type = n.type;
                    d.style = n.style;
                    d.data = n.data;

                    switch (n.type){
                        case "rect":
                        case "point":
                            d.x = _getDrawValue(n.x);
                            d.y = _getDrawValue(n.y);
                            d.w = _getDrawValue(n.w);
                            d.h = _getDrawValue(n.h);
                            break;
                        case "line":
                            line_l = null;
                            line_r = null;
                            line_t = null;
                            line_b = null;
                            d.point = [];
                            for (j in n.point){
                                dd = {};
                                nn = n.point[j];
                                //a little boilerplate, but ok
                                dd.x = _getDrawValue(nn.x);
                                dd.y = _getDrawValue(nn.y);
                                dd.w = _getDrawValue(nn.w);
                                dd.h = _getDrawValue(nn.h);
                                dd.type = nn.type;
                                dd.data = nn.data;
                                d.point.push(dd)

                                //Check for bounds////////////
                                //Check horizontal bounds
                                if (line_l==null){
                                    line_l = dd.x;
                                    line_r = dd.x+dd.w;
                                }
                                else {
                                    if (line_l>dd.x){
                                        line_l = dd.x;
                                    }
                                    if (line_r<dd.x+dd.w){
                                        line_r = dd.x+dd.w;
                                    }
                                }
                                //Check vertical bounds
                                if (line_t==null){
                                    line_t = dd.y;
                                    line_b = dd.y+dd.h;
                                }
                                else {
                                    if (line_t> dd.y){
                                        line_t = dd.y;
                                    }
                                    if (line_b<dd.y+dd.h){
                                        line_b = dd.y+dd.h;
                                    }
                                }
                            }//end for j
                            //Set line bounds
                            d.x = line_l;
                            d.y = line_t;
                            d.w = line_r - line_l;
                            d.h = line_b - line_t;
                            break;
                    }//end switch
                    buffer.push(d);
                }//end for i
                return buffer;
            };

            buffer = _getDrawBuffer(_data);

            

        };

        //Public Interface////////////////////////////////////////////////////////////
        var V = {};
        V.addPoint = function(x,y,style,data){
            var p = _createPoint(x,y,data);
            p.style = style;
            return _data.push(p)-1;
        };
        //Array of {x,y,data}
        V.addLine = function(pointArray,style,data){
            var l = _createLine(pointArray,style,data);
            return _data.push(l)-1;
        };
        V.addRect = function(x,y,w,h,style,data){
            var r = _createRect(x,y,w,h,style,data);
            return _data.push(r)-1;
        };
        //V.addCircle = function(x,y,r,style,data){};
        V.translate = function(id,dx,dy){
            var n = _data[id],
                now = _now();
            if (n==undefined){
                console.warn("VOM - id not found: ",id);
                return false;
            }

            if (n.type=="line"){
                console.warn("VOM - can't translate line, id: ",id);
                return false;
            }

            n.x = _setTween(n.x,dx,now,_tween_duration);
            n.y = _setTween(n.y,dy,now,_tween_duration);
            return true;
        };
        //V.scale = function(id,dsx,dsy){};
        V.appendToLine = function(id,x,y,data){};
        V.remove = function(id){
            if (_data[id]!=undefined){
                delete _data[id];
                return true;
            }
            return false;
        }
        V.setTweenDuration = function(ms){
            if (tengu.isValidNum(ms)){
                if (ms>=0){
                    _tween_duration = ms;
                    return true;
                }
            }
            console.warn("VOM.setTweenDuration - bad value : ",ms);
            return false;
        };
        V.setView = function(x,y,w,h){
            _view = {
                x:x,
                y:y,
                w:w,
                h:h
            }
        };
        //Returns data structure, doesn't draw
        V.renderView = function(){};
    };
    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // End Visual Object Manager
    //////////////////////////////////////////////////////////////////////////////////////////////////////


    //Add methods and properties to tengu

    tengu.method = function() {}; //end method

}; //end module



//////////////////////////////////////////////////////////////////////////////////////////////////////
// Image Module
//////////////////////////////////////////////////////////////////////////////////////////////////////
//Requires: <none>

//Load & draw images & image frames
Tengu.modules.image = function(tengu) {
    var imgList = {},
        loaded = false,
        _getImgFrame = function(img) {
            var f;
            if (typeof img == "string") {
                //Make the image frame if 'filename' is a string
                f = tengu.newImgFrame(img);
            } else {
                //Assume 'filename' is a imgframe
                f = img;
            }
            return f;
        },
        onLoad = function(img) {
            imgList[img].loaded = true;

            checkLoaded();
        },
        checkLoaded = function() {
            var l = true,
                i;
            for (i in imgList) {
                if (!imgList[i].loaded) {
                    l = false;
                }
            }

            //Call onLoadCallback if its not undefined, and if all images are loaded
            if (onLoadCallback !== undefined) {
                if (l) {
                    onLoadCallback();
                }
            }

            //Return true if loaded
            return l;
        },

        imgFrameZeroWidthCheck = function(imgFrame) {
            var imf = imgFrame,
                n = imgList[imgFrame.filename],
                img,loaded;

            if (n==undefined){
                console.error("imgFrameZeroWidthCheck - img not found:",imgFrame.filename);
                return false;
            }

            img = n.img;
            loaded = n.loaded;

            if (!loaded) {
                return false;
            }

            if ((imf.sw <= 0) || (imf.sh <= 0)) {
                imf.sw = img.width;
                imf.sh = img.height;
                imf.ox = imf.sw / 2;
                imf.oy = imf.sh / 2;
            }

            return true;
        },

        //Not used or accesible anywhere... but might be useful for laterVVVVV
        drawImage = function(ctx, filename, sx, sy, swidth, sheight, x, y, width, height) {
            var img = imgList[filename].img,
                loaded = imgList[filename].loaded;

            if (!loaded) {
                return false;
            } else {
                //Default values
                if (sx === undefined) {
                    sx = 0;
                }
                if (sy === undefined) {
                    sy = 0;
                }
                if (swidth === undefined) {
                    swidth = img.width;
                }
                if (sheight === undefined) {
                    sheight = img.height;
                }
                if (x === undefined) {
                    x = sx;
                }
                if (y === undefined) {
                    y = sy;
                }
                if (width === undefined) {
                    width = swidth;
                    swidth = img.width;
                }
                if (height === undefined) {
                    height = sheight;
                    sheight = img.height;
                }

                ctx.drawImage(img, sx, sy, swidth, sheight, x, y, width, height);

                return true;
            }
        },

        drawImgFrame = function(ctx, imgFrame, x, y, scaleX, scaleY, rot, alpha) {
            var f = imgFrame,
                img = imgList[f.filename].img,
                loaded = imgList[f.filename].loaded;

            if (!loaded) {
                return false;
            } else {
                //Default values
                if (x === undefined) {
                    x = f.sx;
                }
                if (y === undefined) {
                    y = f.sy;
                }
                if (scaleX === undefined) {
                    scaleX = 1;
                }
                if (scaleY === undefined) {
                    scaleY = 1;
                }
                if (rot === undefined) {
                    rot = 0;
                }
                if (alpha === undefined) {
                    alpha = 1;
                }

                ctx.save();
                ctx.globalAlpha *= alpha;
                ctx.translate(x, y);
                ctx.rotate(rot);
                ctx.scale(scaleX, scaleY);
                ctx.translate(-f.ox, -f.oy);
                ctx.drawImage(img, f.sx, f.sy, f.sw, f.sh, 0, 0, f.sw, f.sh);
                ctx.restore();

                return true;
            }
        },
        onLoadCallback;

    tengu.imgGetWidth = function(img) {
        var f = _getImgFrame(img);
        return f.sw;
    };
    tengu.imgGetHeight = function(img) {
        var f = _getImgFrame(img);
        return f.sh;
    };

    //This is a pretty low level function, please don't use it :p
    tengu.getImage = function(filename) {
        return imgList[filename];
    };

    //Returns true if file is loaded
    tengu.isLoaded = function(filename) {
        return (imgList[filename].loaded == true);
    };

    tengu.setImgLoadCallback = function(callback) {
        onLoadCallback = callback;
        return callback;
    };

    tengu.loadImage = function(filename, callback) {
        var img, n;

        //Return if img is in list
        if (imgList[filename] !== undefined) {
            return filename;
        }

        loaded = false;
        img = new Image();
        img.onload = function() {
            onLoad(filename);
            if (callback !== undefined) {
                callback(filename);
            }
        }

        imgList[filename] = {};
        imgList[filename].img = img;
        imgList[filename].loaded = false;

        img.src = filename;

        return filename;
    };
    //VV Boilerplate, merge with loadImage... doesn't work....
    tengu.loadCanvasAsImage = function(canvas, name, callback) {
        var img, n;

        //Return if img is in list
        if (imgList[name] !== undefined) {
            return name;
        }

        loaded = false;
        img = new Image();
        img.onload = function() {
            onLoad(name);
            if (callback !== undefined) {
                callback(name);
            }
        }

        imgList[name] = {};
        imgList[name].img = img;
        imgList[name].loaded = false;

        img.src = canvas.toDataURL("image/png"); //<this is the only thing different from loadImage

        return name;
    };

    tengu.newImgFrame = function(filename, sx, sy, sw, sh) {
        var f = {
            filename: filename,
            sx: sx || 0,
            sy: sy || 0,
            sw: sw || 0,
            sh: sh || 0,

            //Center Origin by Default
            ox: sw / 2,
            oy: sw / 2,

            update: function() {
                imgFrameZeroWidthCheck(this);
            },

            setOrigin: function(x, y) {
                ox = x;
                oy = y;
            },

            isLoaded: function() {
                return tengu.isLoaded(this.filename);
            },

            getBbox: function() {
                return {
                    x: -this.ox,
                    y: -this.oy,
                    w: this.sw,
                    h: this.sh
                };
            }
        }; //end definition

        f.update();
        return f;
    }; //end function

    tengu.drawImage = function(ctx, filename, x, y, width, height, rot, alpha) {
        var f = _getImgFrame(filename);
        width = width || f.sw;
        height = height || f.sh;
        return tengu.drawImgFrame(ctx, f, x, y, width / f.sw, height / f.sh, rot, alpha);
    };

    tengu.drawImgFrame = function(ctx, imgFrame, x, y, scaleX, scaleY, rot, alpha) {
        var f = _getImgFrame(imgFrame);
        if (!imgFrameZeroWidthCheck(f)) {
            return false;
        }

        return drawImgFrame(ctx, f, x, y, scaleX, scaleY, rot, alpha);
    };

};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// ImageData Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.imagedata = function(tengu) {
    //Methods related to the creation of ImageData objects
    //https://developer.mozilla.org/en-US/docs/Web/API/ImageData
    tengu.createImageData = function(ctx, width, height) {
        return ctx.createImageData(width, height);
    }; //end method

    tengu.getImageDataBitArray = function(imageData) {
        //Is a Uint8ClampedArray representing a one-dimensional array containing 
        //the data in the RGBA order, with integer values between 0 and 255 (included).
        return imageData.data;
    };

    tengu.getImageDataResolution = function(imageData) {
        //resolution is read only
        return imageData.resolution;
    };

}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Fullscreen Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.fullscreen = function(tengu) {
    //HTML5 Full Screen API Wrapper

    var _launchFullScreen = function(element) {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        },
        _exitFullScreen = function() {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        },
        _isFullScreen = function() {
            return (document.fullscreenEnabled || document.mozFullscreenEnabled || document.webkitIsFullScreen ? true : false);
        };

    tengu.setFullScreen = function() {
        _launchFullScreen(document.documentElement);
    };

    tengu.exitFullScreen = function() {
        _exitFullScreen();
    };

    tengu.isFullScreen = function() {
        return _isFullScreen();
    };

    tengu.toggleFullScreen = function() {
        if (_isFullScreen()) {
            tengu.exitFullScreen();
        } else {
            tengu.setFullScreen();
        }
    };

};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// FPS Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.fps = function(tengu) {
    //Frames per second functions
    var _fps = null,
        _weight_ratio = 0.9,
        _time = null,
        _last_time = -1,
        _last_tick = null;

    tengu.fpsCycle = function() {
        var now = tengu.now();
        if (!_last_tick) {
            //First use, set last tick and return null
            _last_tick = now;
            return null;
        } else {
            //Update the clocks
            _last_time = _time;
            _time = ((now - _last_tick) * (1 - _weight_ratio)) + (_last_time * _weight_ratio);
            _last_tick = now;

            if (_last_time >= 0) {
                _fps = 1000 / _time;
                return _fps;
            } else {
                return null;
            }
        }
    };

    tengu.fpsGet = function() {
        return _fps;
    };

}; //end module


//////////////////////////////////////////////////////////////////////////////////////////////////////
// Canvas Module
//////////////////////////////////////////////////////////////////////////////////////////////////////
//Requires: jquery
//Requires: util

//Stores Canvas Data
Tengu.modules.canvas = function(tengu) {
    //Add node support later - boot if window is not available
    if (typeof window == 'undefined'){
        return false;
    }
    //Privates
    var doc_ready = false,
        initHTMLBody = function() {
            var bod = '<a id="dlLink"></a>';
            bod += '<p id="textDiv"></p>';
            bod += '<div id="stretch" overflow="hidden">';
            bod += '<div id="garbage"></div>';
            bod += '<canvas id="mainCanvas" width="0" height="0" overflow="hidden" position="fixed"></canvas>';
            bod += '<div id="canvasOverlay" overflow="hidden" position="fixed"></div>';
            bod += '<div id="fadeOverlay" position="fixed"></div>';
            bod += '</div>';
            bod += '<span id="debug"></span>';

            //Disable scrolling (hopefully)
            document.ontouchmove = function(event) {
                event.preventDefault();
            }

            if (!document.body) {
                throw new Error("document.body doesn't exist!");
            } else {
                document.body.innerHTML += bod;
                if (!document.body.style){
                    console.warn("document.body.style not initialized, initializing now")
                    document.body.style = {};
                }
                document.body.style.overflow = "hidden";
            }
        },
        checkHTMLInit = function() {
            if (document.getElementById("canvasOverlay")) {
                return true;
            } else {
                return false;
            }
        },
        getOverlay = function() {
            return document.getElementById("canvasOverlay");
        },
        getCanvas = function() {
            return document.body.getElementsByTagName('canvas')[0];
        },
        setCanvasRect = function(x, y, w, h) {
            var c, o;

            c = getCanvas();
            o = getOverlay();

            c.width = w;
            c.height = h;

            //o.style.left = x;
            //o.style.top = y;
            o.style.width = w;
            o.style.height = h;
        },
        canvasData = {
            update: function() {
                //Set the page zoom to 1
                document.body.style.zoom = 1;
                document.body.style.MozTransform = 'scale(1)';
                document.body.style.WebkitTransform = 'scale(1)';

                var c;

                doc_ready = true;
                this.canvas = getCanvas();
                this.overlay = getOverlay();
                this.ctx = this.canvas.getContext('2d');
                c = this.canvas;

                if (fullscreen) {
                    setCanvasRect(0, 0, window.innerWidth, window.innerHeight);
                }

                this.w = c.width;
                this.h = c.height;
                this.cx = c.width / 2;
                this.cy = c.height / 2;
                this.vertical = c.height > c.width;
                this.scalar = c.height / 960;
            }
        },
        callback = function() {
            if (!checkHTMLInit()) {
                initHTMLBody();
            }

            canvasData.update();
        },
        getCData = function getCData() {
            var c = tengu.clone(canvasData);
            c.canvas = canvasData.canvas;
            c.ctx = canvasData.ctx;

            return c;
        },
        fullscreen = false;

    //$(document).ready(callback);

    tengu.initTenguCanvas = function(){
        callback();
    };

    tengu.canvasFillScreen = function(bool) {
        if (bool === undefined) {
            bool = true;
        }
        fullscreen = bool;

        return fullscreen;
    };

    tengu.canvasSetAntiAlias = function(bool) {
        canvasData.ctx.webkitImageSmoothingEnabled = bool;
    };

    //Usage:  setCanvasRect(w,h), or setCanvasRect(x,y,w,h)
    tengu.setCanvasRect = function(x, y, w, h) {
        if ((w == undefined) && (h == undefined)) {
            w = x;
            h = y;
            x = 0;
            y = 0;
        }
        setCanvasRect(x, y, w, h);
    };

    tengu.updateCanvasData = function() {
        if (!doc_ready) {
            console.warn("Can't get canvas, document isn't ready yet!");
        }
        canvasData.update();
        return getCData();
    };

    tengu.getCanvasData = function() {
        if (!doc_ready) {
            console.warn("Can't get canvas, document isn't ready yet!");
        }
        return getCData();
    };
    tengu.getCtx = function() {
        return (tengu.getCanvasData.ctx);
    };

};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Canvas Manipulation Module
//////////////////////////////////////////////////////////////////////////////////////////////////////
//Module for creating and manipulating new canvases
//
//Image filters:
//http://www.html5rocks.com/en/tutorials/canvas/imagefilters/
//
Tengu.modules.canvasmanip = function(tengu) {
    //Private
    var _isImage = function(x) {
            return x instanceof HTMLImageElement;
        },
        _clear = function(canvas) {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return canvas;
        },
        _newCanvas = function(w, h) {
            var c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            c.ctx = c.getContext('2d');
            c.clear = function() {
                c.ctx.save();
                c.ctx.setTransform(1, 0, 0, 1, 0, 0);
                c.ctx.clearRect(0, 0, c.width, c.height);
                c.ctx.restore();
            };
            return c;
        },
        _newCanvasFromImg = function(img) {
            var c = _newCanvas(img.width, img.height),
                ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0);
            return c;
        },
        //Size array is array of [{w:x,h:x},{w:x,h:x},ect...]
        _mipmap = function(canvas, sizeArray) {
            var map = [],
                cw = canvas.width,
                ch = canvas.height,
                i, n, c;
            for (i in sizeArray) {
                n = sizeArray[i];
                //Validate x y
                if (typeof n.w != 'number') {
                    throw new Error("Invalid w: " + w + " at index: " + i);
                }
                if (typeof n.h != 'number') {
                    throw new Error("Invalid h: " + h + " at index: " + i);
                }
                //Note: ^^^^ Eventually change that so it accepts one and calculates the missing one
                //based on the canvas w/h ratio

                c = _newCanvas(n.w, n.h);
                c.ctx.drawImage(canvas, 0, 0, cw, ch, 0, 0, n.w, n.h);
                map[i] = c;
            }

            return map;
        },
        _newCanvasElement = function(canvas) {
            var my_canvas = canvas,
                e = tengu.newElement("canvas"),
                cw = canvas.width,
                ch = canvas.height;
            e.width = cw;
            e.height = ch;

            e.clear = function() {
                _clear(my_canvas);
            };

            e.drawFunction = function(c, d) {
                var ox = 0,
                    oy = 0;
                switch (e.halign) {
                    case "center":
                        ox = d.width / 2;
                        break;
                    case "right":
                        ox = d.width;
                        break;
                }
                switch (e.valign) {
                    case "middle":
                        oy = d.height / 2;
                        break;
                    case "bottom":
                        oy = d.height;
                        break;
                }

                c.ctx.drawImage(my_canvas, 0, 0, my_canvas.width, my_canvas.height, d.x - ox, d.y - oy, d.width, d.height);
            };

            e.getCanvas = function() {
                return my_canvas;
            };

            e.setCanvas = function(canvas) {
                e.width = canvas.width;
                e.height = canvas.height;
                my_canvas = canvas;
            };

            return e;
        };

    tengu.newCanvasElement = function(canvas) {
        return _newCanvasElement(canvas);
    };

    tengu.newCanvas = function(w, h) {
        //If it's a string, get the tengu image
        if (typeof w == 'string') {
            w = tengu.getImage(w);
            if (!w) {
                throw new Error(w + " image not found.");
            }
        }

        //if w is an image, create canvas from image
        if (_isImage(w)) {
            return _newCanvasFromImg(w);
        } else {
            return _newCanvas(w, h);
        }

    }; //end newCanvas

    tengu.drawCanvas = function(ctx, canvas, sx, sy, swidth, sheight, x, y, width, height) {
        ctx.drawImage(canvas, sx, sy, swidth, sheight, x, y, width, height);
    };

    tengu.mipmapCanvas = function(canvas, sizeArray) {
        return _mipmap(canvas, sizeArray);
    };

}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Canvas Drawing Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.canvasDraw = function(tengu) {
    tengu.drawLine = function(ctx, x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    };
    tengu.fillRect = function(ctx, rect) {
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    };
    tengu.strokeRect = function(ctx, rect) {
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// Pointer Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.pointer = function(tengu) {
    //Add node support later - boot if window is not available
    if (typeof window == 'undefined'){
        return false;
    }
    // pointer.js, version 1.0
    //edited by tengu

    // Synthesize 'pointer' events using mouse/touch events.

    // (c) 2013 Copyright (c) 2013, Mozilla Corporation
    // project located at https://github.com/mozilla/pointer.js.
    // Licenced under the BSD license (see LICENSE file)

    // Pointer events have the following custom properties:
    // * maskedEvent: the event that triggered the pointer event.
    // * touch: boolean- is maskedEvent a touch event?
    // * mouse: boolean- is maskedEvent a mouse event?
    // * x: page-normalized x coordinate of the event.
    // * y: page-normalized y coordinate of the event.

    (function() {
        var touchEnabled = false;

        var body = document; //old: body = document.body;

        var isScrolling = false;
        var timeout = false;
        var sDistX = 0;
        var sDistY = 0;
        window.addEventListener('scroll', function() {
            if (!isScrolling) {
                sDistX = window.pageXOffset;
                sDistY = window.pageYOffset;
            }
            isScrolling = true;
            clearTimeout(timeout);
            timeout = setTimeout(function() {
                isScrolling = false;
                sDistX = 0;
                sDistY = 0;
            }, 100);
        });

        body.addEventListener('mousedown', pointerDown);
        body.addEventListener('touchstart', pointerDown);
        body.addEventListener('mouseup', pointerUp);
        body.addEventListener('touchend', pointerUp);
        body.addEventListener('mousemove', pointerMove);
        body.addEventListener('touchmove', pointerMove);
        body.addEventListener('mouseout', pointerLeave);
        body.addEventListener('touchleave', pointerLeave);

        // 'pointerdown' event, triggered by mousedown/touchstart.
        function pointerDown(e) {
            var evt = makePointerEvent('down', e);
            if (!evt) {
                return false;
            }
            // don't maybeClick if more than one touch is active.
            var singleFinger = evt.mouse || (evt.touch && e.touches.length === 1);
            if (!isScrolling && singleFinger) {
                e.target.maybeClick = true;
                e.target.maybeClickX = evt.x;
                e.target.maybeClickY = evt.y;
            }
        }

        // 'pointerdown' event, triggered by mouseout/touchleave.
        function pointerLeave(e) {
            e.target.maybeClick = false;
            makePointerEvent('leave', e);
        }

        // 'pointermove' event, triggered by mousemove/touchmove.
        function pointerMove(e) {
            var evt = makePointerEvent('move', e);
        }

        // 'pointerup' event, triggered by mouseup/touchend.
        function pointerUp(e) {
            var evt = makePointerEvent('up', e);
            if (!evt) {
                return false;
            }
            // Does our target have maybeClick set by pointerdown?
            if (e.target.maybeClick) {
                // Have we moved too much?
                if (Math.abs(e.target.maybeClickX - evt.x) < 5 &&
                    Math.abs(e.target.maybeClickY - evt.y) < 5) {
                    // Have we scrolled too much?
                    if (!isScrolling ||
                        (Math.abs(sDistX - window.pageXOffset) < 5 &&
                            Math.abs(sDistY - window.pageYOffset) < 5)) {
                        makePointerEvent('click', e);
                    }
                }
            }
            e.target.maybeClick = false;
        }

        function makePointerEvent(type, e) {
            var tgt = e.target;

            if (touchEnabled && (e.type.indexOf('mouse') === 0)) {
                return false;
            }

            var evt = document.createEvent('CustomEvent');
            evt.initCustomEvent('pointer' + type, true, true, {});
            evt.touch = e.type.indexOf('touch') === 0;
            evt.mouse = (e.type.indexOf('mouse') === 0);

            if (evt.touch) {
                //Ignore mouse events if touch is enabled...
                touchEnabled = true;
            }

            if (evt.touch) {
                evt.x = e.changedTouches[0].pageX;
                evt.y = e.changedTouches[0].pageY;
            }
            if (evt.mouse) {
                evt.x = e.clientX + window.pageXOffset;
                evt.y = e.clientY + window.pageYOffset;
            }
            evt.maskedEvent = e;
            tgt.dispatchEvent(evt);
            return evt;
        }

    })();
}; //end module

//////////////////////////////////////////////////////////////////////////////////////////////////////
// GUI Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.gui = function(tengu) {
    //Add node support later - boot if window is not available
    if (typeof window == 'undefined'){
        return false;
    }
    //Requires: pointer.js	https://github.com/mozilla/pointer.js
    //Requires: image, canvas, tween, util, math



    var
    /**
     * Takes rect and returns rect with only float values
     * @param {Object} sR		Object with x,y,w,h values
     * @param {Object} pR		Parent object with x,y,w,h values
     * @return {Object}       	Returns {x,y,w,h}
     */
        _posToNum = function(sR, pR) {
            /**
             * If a is a percentage, multiply by pA and return, otherwise return float of a
             * @param a					String or Number
             * @return {Number}       	Returns a or (a*pA)/100 if percentage
             */
            var _valToFloat = function(a, pA) {
                    //If a is a number, return a
                    if (typeof a == 'number') {
                        return a;
                    }

                    if (tengu.isString(a)) {
                        if (a.indexOf("%") == -1) {
                            //If not percentage, return float of a
                            return parseFloat(a);
                        } else {
                            //If percentage, return a/100 * pA
                            return (parseFloat(a) / 100) * pA;
                        }
                    }
                },
                r = {};

            //Iterate through x,y,w,h and perform _valToFloat
            r.x = _valToFloat(sR.x, pR.width);
            r.width = _valToFloat(sR.width, pR.width);
            r.y = _valToFloat(sR.y, pR.height);
            r.height = _valToFloat(sR.height, pR.height);

            //Return the new rect
            return r;

        },

        //Get the fade overlay
        _getFadeOverlay = function() {
            return document.getElementById("fadeOverlay");
        },

        //Set Fade Overlay rgba
        _setFadeRGBA = function(r, g, b, a) {
            var f = _getFadeOverlay(),
                c = [r, g, b, a];
            f.style.background = "rgba(" + c.join(',') + ")";

            if (a <= 0) {
                f.style.width = 0;
                f.style.height = 0;
            } else {
                f.style.width = "100%";
                f.style.height = "100%";
            }
        },

        _element = function(name) {
            this.id = name;
            this.element = [];
            this.x = 0;
            this.y = 0;
            this.z = 0;
            this.width = "100%";
            this.height = "100%";
            this.halign = "center";
            this.valign = "middle";

            this.visible = true;
            this.disabled = false;

            this._pressed = false;
            this._over = false;

            this.alpha = 1;
            this.parent = null;
            this.scale = 1;
            this.mirror = false;
            this.flip = false;
            this.imgFrame = null;
            this.preDrawFunction = function(canvasData, drawData) {};
            this.drawFunction = function(canvasData, drawData) {};
            this.postDrawFunction = function(canvasData, drawData) {};

            this._drawbbox = false; //Set to true to draw bbox 
            this.bbox = {
                x: 0,
                y: 0,
                w: 0,
                h: 0
            }; //Preset used for bbox
            this._bbox = {
                x: 0,
                y: 0,
                w: 0,
                h: 0
            }; //Used for mouse intersection
            this.positioning = "relative"; //Set to absolute for noninherited xyz

            this._create_timestamp = tengu.now();
        },

        /**
         * Create a new element and return it
         * @return {Object}       Element Object
         */
        _newElement = function(name) {
            var e = new _element(name);

            //Add stop propagation function to e
            e.stopPropagation = (function() {
                var self = this;
                return function() {
                    _stopPropagation.call(self);
                };
            }());
            return e;
        },
        /**
         * Sets the target x,y,w,h to source x,y,w,h, and sets scale to 1
         * @param {Object} source		Source Element Object
         * @param {Object} target		Target Element Object
         * @return {Object}       		Returns target element
         */
        _fitElement = function(source, target) {
            target.x = source.x;
            target.y = source.y;
            target.width = source.width;
            target.height = source.height;
            target.scale = 1;

            return target;
        },
        /**
         * Draw the element and its children
         * @param {Object} element		The element object
         * @param {Object} canvasData	canvasData data structure
         * @param {Object} parentData	parentData data structure
         * @return {Object}       Returns element object (first param)
         */
        _drawElement = function(element, canvasData, parentData) {
            var e = element,
                ctx = canvasData.ctx,
                pData, rData, i, r;

            if (parentData === undefined) {
                //if (true) {
                pData = _newElement();

                //Use Canvas Data if undefined

                //Set X
                switch (e.halign) {
                    case "left":
                        pData.x = 0;
                        break;
                    case "right":
                        pData.x = canvasData.w;
                        break;
                    case "center":
                        pData.x = canvasData.cx;
                        break;
                }

                //Set Y
                switch (e.valign) {
                    case "top":
                        pData.y = 0;
                        break;
                    case "bottom":
                        pData.y = canvasData.h;
                        break;
                    case "middle":
                        pData.y = canvasData.cy;
                        break;
                }

                pData.width = canvasData.w;
                pData.height = canvasData.h;
                pData.scale = canvasData.scalar;
            } else {
                pData = tengu.clone(parentData);

                if (!e.fit_to_parent) {
                    //Set X
                    switch (e.halign) {
                        case "left":
                            pData.x = parentData.x;
                            break;
                        case "right":
                            pData.x = parentData.x + parentData.width;
                            break;
                        case "center":
                            pData.x = parentData.x + (parentData.width / 2);
                            break;
                    }

                    //Set Y
                    switch (e.valign) {
                        case "top":
                            pData.y = parentData.y;
                            break;
                        case "bottom":
                            pData.y = parentData.y + parentData.height;
                            break;
                        case "middle":
                            pData.y = parentData.y + (parentData.height / 2);
                            break;
                    }
                }

            }

            if (!e.fit_to_parent) {
                //Create this element's parent data

                //Convert percentages to real numbers
                r = _posToNum(e, pData);

                //If values are not percentages, multiply by scale
                if (typeof e.x == 'number') {
                    r.x *= pData.scale;
                }
                if (typeof e.y == 'number') {
                    r.y *= pData.scale;
                }
                if (typeof e.width == 'number') {
                    r.width *= pData.scale;
                }
                if (typeof e.height == 'number') {
                    r.height *= pData.scale;
                }

                //Add offset (r) to pData
                pData.x += r.x;
                pData.y += r.y;
                pData.width = r.width;
                pData.height = r.height;

                //Note:  Not sure why this works better commented out...
                /*
			switch (e.halign) {
					case "right": pData.x -= pData.width; break;
					case "center": pData.x -= pData.width/2; break;
				}
				
				//Set Y
				switch (e.valign) {
					case "bottom": pData.y -= pData.height; break;
					case "middle": pData.y -= pData.height/2; break;
				}
				*/

                //Multiply scale
                pData.scale *= e.scale;

                //Set alignment
                pData.halign = e.halign;
                pData.valign = e.valign;

            } else {
                //Fit to parent code here
            }

            //Update bbox
            e._bbox = {
                x: pData.x + (e.bbox.x * pData.scale),
                y: pData.y + (e.bbox.y * pData.scale),
                w: e.bbox.w * pData.scale,
                h: e.bbox.h * pData.scale
            };

            //Update Fade (optional)
            if (e.updateFade != undefined) {
                e.updateFade();
            }

            pData.alpha = e.alpha;


            //Reset to default if positioning is absolute
            if (e.positioning == "absolute") {
                pData.x = e.x;
                pData.y = e.y;
                pData.width = e.width;
                pData.height = e.height;
                pData.scale = e.scale;
                e._bbox = tengu.clone(e.bbox);
                e._bbox.x += pData.x;
                e._bbox.y += pData.y;
            }

            //Pre Draw
            e.preDrawFunction.call(e, canvasData, pData);

            //Log pdata to e._draw_data (for debugging)
            pData._posToNum = r;
            e._draw_data = pData;


            //Only draw if visible
            if (e.visible) {
                ctx.save();

                //Draw the xywh box
                if (e._drawbox) {
                    ctx.save();
                    if (e._drawbox_color != undefined) {
                        ctx.strokeStyle = e._drawbox_color;
                    } else {
                        ctx.strokeStyle = "red";
                    }
                    ctx.strokeRect(pData.x, pData.y, pData.width, pData.height);
                    ctx.restore();
                }

                //Set Alpha
                ctx.globalAlpha *= pData.alpha;

                //Clip to Bbox
                if (e._clipToBbox) {
                    ctx.rect(e._bbox.x, e._bbox.y, e._bbox.w, e._bbox.h);
                    ctx.clip();
                }

                //Note:  predraw and post draw should eventually 
                //be arrays of functions, not single ones. It's
                //more dynamic that way

                //Draw this element
                e.drawFunction.call(e, canvasData, pData);

                //Draw the bbox
                if (e._drawbbox) {
                    ctx.save();
                    if (e._drawbbox_color != undefined) {
                        ctx.strokeStyle = e._drawbox_color;
                    } else {
                        ctx.strokeStyle = "red";
                    }
                    ctx.strokeRect(e._bbox.x, e._bbox.y, e._bbox.w, e._bbox.h);
                    ctx.restore();
                }

                //Draw all the child elements
                for (i in e.element) {
                    _drawElement(e.element[i], canvasData, pData);
                }

                //Post Draw
                e.postDrawFunction.call(e, canvasData, pData);

                //Restore Ctx
                ctx.restore();
            }

            return e;
        },
        /**
         * Create a fade in or out
         * @param {Boolean} boolFadeIn		True if fadein, false if fadeout
         * @param {String} type				Type of fade
         * @param {Number} duration			Duration of fade
         * @param {Function} callback		Callback function when fade is done
         */
        _setFade = function(type, duration, callback) {
            var valid_type = false,
                tween;
            //Default duration
            if (duration == undefined) {
                duration = 500;
            }
            //Default callback
            callback = callback || function() {}

            switch (type) {
                case "white":
                case "slideLeft":
                case "slideRight":
                case "alpha":
                    valid_type = true;
                    break;
            }

            if (valid_type) {
                tween = new tengu.Tween();
                tween.addInterval(duration, callback);
                tween.fade_type = type;

                return tween;
            } else {
                throw new Error("Invalid fade type:  " + type);
            }
        },

        //Bubbling and stoppropagation for events
        _keep_bubbling = undefined,
        _stopPropagation = function() {
            if (_keep_bubbling == undefined) {
                throw new Error("Don't call stopPropagation outside of an event handler!");
            } else {
                _keep_bubbling = false;
            }
        },

        //Main Draw Loop
        _drawDoc = function() {
            //Get Canvas Data
            var c = tengu.updateCanvasData(),
                e = _docElement.element,
                i;

            //Draw all the child elements
            for (i in e) {
                _drawElement(e[i], c);
            }

            //Set timeout to _framerate to draw again
            _drawTimer = window.setTimeout(function() {
                _drawDoc.call(this)
            }, _framerate);
        },
        _eventMap = (function() {
            var map = [{
                    etype: 'pointerdown',
                    local: 'onDown',
                    global: 'globalOnDown'

                }, {
                    etype: 'pointerup',
                    local: 'onUp',
                    global: 'globalOnUp'
                }, {
                    etype: 'pointermove',
                    local: 'onMove',
                    global: 'globalOnMove'
                },

            ];

            return map;

        }()),
        //Generalized event handler
        _handleEvent = function(e) {
            var ee, map, i, check_intersect;

            map = _eventMap;

            for (i in map) {
                if (e.event_type == map[i].etype) {

                    //VV  Support legacy code
                    this.globalOnClick = this.onClickAnywhere;

                    if (this[map[i].global] != undefined) {
                        this[map[i].global](e);
                    }

                    //Global onClick
                    if (map[i].global == "globalOnDown") {
                        if (this.globalOnClick) {
                            this.globalOnClick(e);
                        }
                    }

                    //Look at functions to determine if we should check intersection
                    check_intersect = false;
                    if (this[map[i].local]) {
                        check_intersect = true;
                    }
                    switch (map[i].local) {
                        case "onDown":
                            if (this.onClick || this.onClickOff) {
                                check_intersect = true;
                            }
                            break;
                        case "onMove":
                            if (this.onEnter || this.onLeave) {
                                check_intersect = true;
                            }
                    }

                    if (!this.disabled && check_intersect) {
                        if (tengu.pointRect(e.x, e.y, this._bbox)) {
                            ee = tengu.clone(e);
                            ee.x -= e.x;
                            ee.y -= e.y;
                            switch (map[i].local) {
                                case "onDown":
                                    this._pressed = true;
                                    if (this.onClick) {
                                        this.onClick(e, ee);
                                    }
                                    break;
                                case "onUp":
                                    this._pressed = false;
                                    break;
                                case "onMove":
                                    if (!this._over && this.onEnter) {
                                        this.onEnter(e, ee);
                                    }
                                    this._over = true;
                                    break;
                            } // end switch

                            if (this[map[i].local]) {
                                this[map[i].local](e, ee);
                            }

                        } //end inrect
                        else {
                            switch (map[i].local) {
                                case "onDown":
                                    if (this.onClickOff) {
                                        this.onClickOff(e, ee);
                                    }
                                case "onMove":
                                    if (this._over && this.onLeave) {
                                        this.onLeave(e, ee);
                                    }
                                    if (this._over && this._pressed && this.onUp) {
                                        this.onUp(e, ee);
                                    }
                                    this._over = false;
                                    this._pressed = false;
                                    break;
                                case "onUp":
                                    this._pressed = false;
                                    break;
                            } //end switch
                        } //end not in rect

                    } // end if local func & !disbaled
                } // end if evtype = mape.evtype

            } //end for

        },

        //Generalized event callback
        _onEvent = function(e) {
            //Ignore events that are too close together (like double mouse/touch events)
            var now = tengu.now(),
                last = _lastInputEventTime || 0,
                margin = _lastInputEventMargin;

            _keep_bubbling = true;
            _lastInputEventTime = now;

            if (now - last < margin) {
                return false;
            }

            var _blist = [],
                _zlist = [],
                bubbleUp = function(e) {
                    //Attempt to handle the event for this element
                    _handleEvent.call(this, e);
                    //Add this to blist to prevent double calls
                    _blist.push(this);

                    //Keep bubbling up if _keep_bubbling is still true
                    // AND parent hasn't fired yet
                    if ((this.parent != null) &&
                        (_blist.indexOf(this.parent) == -1)) {

                        if (_keep_bubbling) {
                            bubbleUp.call(this.parent, e);
                        }

                    }

                },
                bubbleDown = function(element) {
                    if (element == undefined) {
                        return false;
                    }
                    //Don't bubble down if element is disabled
                    if (element.disabled) {
                        return false;
                    }

                    var n = element.element,
                        i, max;

                    max = n.length;
                    if (max > 0) {
                        //If it has children, keep bubbling down
                        for (i = 0; i < max; i += 1) {
                            bubbleDown(n[i]);
                        }
                    } else {
                        //Add to zlist if there's no children
                        _zlist.push(element);
                    }
                },

                element = _docElement.element,
                i;


            //Bubble down to child elements
            for (i in element) {
                bubbleDown(element[i]);
            }

            //Sort zlist here!!!!!

            for (i in _zlist) {
                bubbleUp.call(_zlist[i], e);
            }

            _keep_bubbling = undefined;
        },

        //setTimeout is set to duration of _framerate
        _framerate = 1,

        //Timer for the main draw loop
        _drawTimer,

        //Doc Element is the document (similar to DOM document)
        _docElement,
        _createElement = function(type) {
            d = document.createElement(type);
            d.style.position = "absolute";
            return d;
        },
        _createDiv = function() {
            return _createElement("div");
        },
        _lastInputEventMargin = 10,
        _lastInputEventTime,
        _discardNode,
        _garbageBin,
        _fadeIn_type;

    //_element prototype
    _element.prototype = {
        getPressed: function() {
            return this._pressed;
        },
        //Get pointer over
        getOver: function() {
            return this._over;
        },
        getCreateTime: function() {
            return this._create_timestamp;
        },
        addChild: function(element) {
            this.element.push(element);
            element.parent = this;
            return element;
        },

        //These two are a little boilerplate....
        drawBbox: function(bool) {
            if (bool == undefined) {
                bool = true;
            }

            if (typeof bool == "string") {
                this._drawbbox_color = bool;
                bool = true;
            }

            this._drawbbox = bool;
        },

        drawBox: function(bool) {
            if (bool == undefined) {
                bool = true;
            }
            if (typeof bool == "string") {
                this._drawbox_color = bool;
                bool = true;
            }
            this._drawbox = bool;
        },

        /**
         * Remove child element
         * 		Returns removed element if it exists,
         *  	returns -1 if element doesn't exist
         * @param {Object} element		Element to be removed
         * @return {Mixed}				Returns element removed or -1
         */
        removeChild: function(element) {
            var e = this.element,
                n = e.indexOf(element);

            element.parent = null;

            if (n != -1) {
                return e.splice(n, 1);
            } else {
                return -1;
            }
        },

        //VVVVV This doesn't work!!!!!!! fix it!!!!!
        setAlign: function() {
            var args = Array.prototype.slice.call(arguments),
                i, max;

            max = args.length;
            for (i = 0; i < max; i += 1) {
                switch (args[i]) {
                    case "left":
                        this.halign = "left";
                        break;
                    case "right":
                        this.halign = "right";
                        break;
                    case "center":
                        this.halign = "center";
                        break;
                    case "top":
                        this.valign = "top";
                        break;
                    case "bottom":
                        this.valign = "bottom";
                        break;
                    case "middle":
                        this.valign = "middle";
                        break;
                }
            }

            return this;
        },

        /**
         * Destroys all children and removes from parent list
         */
        destroy: function() {
            var i;
            //Destroy all children
            for (i in this.element) {
                this.element[i].destroy();
            }
            this.element = [];

            //This leaks child dom elements, no idea why...
            /*
					//Remove from parent
					if (this.parent!=null) {
						this.parent.removeChild(this);
					}
					*/
        },

        setPositioning: function(p) {
            switch (p) {
                case "relative":
                case "absolute":
                    this.positioning = p;
                    break;
                default:
                    throw new Error("Bad positioning value: " + p);
            }
        },

        setPosition: function(x, y) {
            this.x = x;
            this.y = y;
        },

        setWidthHeight: function(w, h) {
            this.width = w;
            this.height = h;
        },

        //Sets the bbox/w,h to rect (TOP LEFT oriented only!!!)
        setRect: function(rect) {
            var a = tengu.argArray(arguments),
                l = a.length;
            if (l == 1) {
                this.width = rect.w;
                this.height = rect.h;
                this.x = rect.x;
                this.y = rect.y;
            } else if (l == 4) {
                this.width = a[2];
                this.height = a[3];
                this.x = a[0];
                this.y = a[1];
            } else {
                throw new Error("setRect requires either a rect{x,y,w,h}, or 4 arguments");
            }

            this.scale = 1;
            this.bbox = {
                x: 0,
                y: 0,
                w: this.width,
                h: this.height
            };
        },
        //get xywh rect
        getRect: function() {
            return {
                x: this.x,
                y: this.y,
                w: this.width,
                h: this.height
            }
        },

        //Sets the bbox
        setBbox: function(x, y, w, h) {
            this.bbox = {
                x: x,
                y: y,
                w: w,
                h: h
            };
        },

        //Sets the image of an element
        setImage: function(img) {
            if (tengu.isString(img)) {
                //Create image frame from filename
                this.imgFrame = tengu.newImgFrame(img);
            } else if (tengu.isObject(img)){
                //Presume img is a imgFrame
                this.imgFrame = img;
            }
            else {
                //Something weird happened
                console.warn("T.element.setImage(img) - img is not an object or string.  img:",img);
                return false;
            }

            //Update image frame dimensions
            this.imgFrame.update();

            //Set width,height, and bbox to image
            this.bbox = this.imgFrame.getBbox();
            if (!this.bbox) {
                throw new Error("Bad bbox from imgFrame");
            }
            this.width = this.bbox.w;
            this.height = this.bbox.h;

            return this.imgFrame.isLoaded();
        },

        clipToBbox: function(bool) {
            if (bool == undefined) {
                bool = true;
            }
            this._clipToBbox = bool;
        },

        logParent: function() {
            var e = this;

            while (e != null) {
                console.log(e);
                e = e.parent;
            }
        },

        logDrawData: function() {
            var e = this;

            while (e != null) {
                if (e._draw_data) {
                    console.log(e._draw_data);
                }
                e = e.parent;
            }
        },
    };

    //Create the docElement
    //Note - this needs to run after _element.prototype is defined
    _docElement = _newElement("document");


    //On Ready
    $(document).ready(function() {
        //Initialize event listeners
        var type = [
                'pointerdown',
                'pointerup',
                'pointermove'
            ],
            i, max;

        max = type.length;
        for (i = 0; i < max; i += 1) {
            //Uses immediate function to validate each type[i] individually
            window.addEventListener(type[i], (function(type) {
                return function(e) {
                    e.event_type = type;
                    _onEvent(e);
                }
            }(type[i])));
        }

        //Init _garbageBin
        if (typeof(_garbageBin) === 'undefined') {
            //Here we are creating a 'garbage bin' object to temporarily 
            //store elements that are to be discarded
            _garbageBin = document.createElement('div');
            _garbageBin.style.display = 'none'; //Make sure it is not displayed
            document.body.appendChild(_garbageBin);
        }
        //Init _discardNode function
        _discardNode = function(element) {
            //The way this works is due to the phenomenon whereby child nodes
            //of an object with it's innerHTML emptied are removed from memory

            //Move the element to the garbage bin element
            _garbageBin.appendChild(element);
            //Empty the garbage bin
            _garbageBin.innerHTML = "";
        };

    });

    //Start the draw doc loop
    tengu.startDrawDocLoop = function(){
        _drawTimer = window.setTimeout(function() {
            _drawDoc.call(this)
        }, _framerate);
    };

    //Force clears the white overlay and sets it to alpha=0
    tengu.clearFadeOverlay = function() {
        _setFadeRGBA(255, 255, 255, 0);
    };

    tengu.setFramerate = function(x) {
        _framerate = x;
    };

    tengu.tempDrawElement = function(element, canvasData, parentData) {
        return _drawElement(element, canvasData, parentData);
    };

    tengu.docAddChild = function(element) {
        return _docElement.addChild(element);
    };

    tengu.docRemoveChild = function(element) {
        return _docElement.removeChild(element);
    };

    tengu.newElement = function(name) {
        return _newElement(name);
    };

    tengu.newCanvasTextElement = function(text) {
        //Should 
    };

    tengu.newScreenElement = function(name) {
        name = name || "screen";
        var element = _newElement(name),
            fade;

        element.fit_to_parent = true;
        element.halign = "left";
        element.valign = "top";

        element.fadeState = 0;
        element._fade = {
            state: 0,
            value: 0
        };

        element.updateFade = function() {
            var fade = this._fade,
                fadeType,
                fadeTween;

            switch (fade.state) {
                case 0:
                    fadeTween = fade.tweenIn;
                    break;
                case 2:
                    fadeTween = fade.tweenOut;
                    break;
            }

            //Enable Input by default
            this.disabled = false;

            if (fadeTween != undefined) {
                //Disable Input while tweening
                this.disabled = true;

                switch (fade.state) {
                    case 0:
                        //Set the fadein type to global if it exists
                        if (_fadeIn_type != undefined) {
                            fadeTween.fade_type = _fadeIn_type;
                        }
                        break;
                    case 2:
                        //Set global fadeIn_type to same as this screens fadeout
                        _fadeIn_type = fadeTween.fade_type;
                        break;
                }

                fadeType = fadeTween.fade_type;

                switch (fadeType) {
                    //Validate fade_type with switch
                    case "white":
                    case "slideRight":
                    case "slideLeft":
                    case "alpha":

                        //Update tween (only once!)
                        fadeTween.update();
                        x = fadeTween.getTween(0);

                        //Inverse x if fading in
                        if (fade.state < 2) {
                            x = 1 - x;
                        }

                        //Set fade.value (use later in drawing)
                        fade.value = x;
                        break;
                }

            }
        };

        element.setFadeIn = function(type, duration, callback) {
            var fade = this._fade,
                cb = tengu.createCallback(element, function() {
                    fade.state = 1;

                    if (callback != undefined) {
                        callback();
                    }
                });
            fade.tweenIn = _setFade(type, duration, cb);
        };

        element.fadeOut = function() {
            var fade = this._fade;
            fade.state = 2;
            fade.tweenOut.restart();
            //Disable input if fading out
            this.disabled = true;
        };

        element.setFadeOut = function(type, duration, callback) {
            var fade = this._fade,
                cb = tengu.createCallback(element, function() {
                    fade.state = 3;

                    if (callback != undefined) {
                        callback();
                    }

                    element.destroy();
                });
            fade.tweenOut = _setFade(type, duration, cb);
        };

        element.preDrawFunction = function(cData, drawData) {
            var ctx = cData.ctx,
                fade = this._fade,
                fadeTween, x, dt, idt, offC, offX, cw;

            switch (fade.state) {
                case 0:
                    fadeTween = fade.tweenIn;
                    break;
                case 2:
                    fadeTween = fade.tweenOut;
                    break;
            }

            if (fadeTween != undefined) {
                switch (fadeTween.fade_type) {
                    case "alpha":
                        switch (fade.state) {
                            case 0:
                                drawData.alpha = fade.value;
                                break;
                            case 2:
                                drawData.alpha = 1 - fade.value;
                                break;
                        }
                        break;


                    case "slideRight":
                    case "slideLeft":

                        dt = fade.value;
                        idt = 1 - dt;
                        //Get offC
                        switch (fade.state) {
                            case 0:
                                offC = 1 - Math.sqrt(1 - (dt * dt));
                                break;
                            case 2:
                                offC = Math.sqrt(1 - (dt * dt));
                                break;
                        }

                        cw = cData.w;
                        switch (fade.state) {
                            case 0:
                                offX = cw * offC;
                                break;
                            case 1:
                                offX = 0;
                                break;
                            case 2:
                                offX = (cw * offC) - cw;
                                break;
                            case 3:
                                offX = -cw;
                                break;
                        }

                        if (fadeTween.fade_type == "slideRight") {
                            offX *= -1;
                        }
                        drawData.x += offX;
                        break;
                }

            }
        };

        element.postDrawFunction = function(cData, drawData) {
            var ctx = cData.ctx,
                fade = this._fade,
                fadeTween, x;

            switch (fade.state) {
                case 0:
                    fadeTween = fade.tweenIn;
                    break;
                case 2:
                    fadeTween = fade.tweenOut;
                    break;
            }

            if (fadeTween != undefined) {
                switch (fadeTween.fade_type) {
                    case "white":
                        _setFadeRGBA(255, 255, 255, fade.value);
                        break;
                    default:
                        _setFadeRGBA(255, 255, 255, 0); //white to alpha 0 if white fade isn't running
                }

            }
        };

        return element;
    };

    tengu.newImgElement = function(img) {
        var element = _newElement();
        //Set the element's image
        element.setImage(img);

        element.drawFunction = function(canvasData, drawData) {
            var c = canvasData,
                d = drawData,
                f = this.imgFrame,
                x, y, sx, sy;

            f.update();
            this.width = f.sw;
            this.height = f.sh;

            var hscale = d.scale,
                vscale = d.scale;
            if (this.mirror) {
                hscale *= -1;
            }
            if (this.flip) {
                vscale *= -1
            }

            tengu.drawImgFrame(c.ctx, this.imgFrame, d.x, d.y, hscale, vscale, this.rotation);
        };

        //Set the default draw function as equal to the draw function
        element.defaultDraw = element.drawFunction;

        return element;
    };

    tengu.newImageElement = tengu.newImgElement;

    tengu.newStaticBgElement = function(filename) {
        var element = _newElement(filename);

        //element.imgFrame = tengu.newImgFrame(filename);

        element.drawFunction = function(canvasData, drawData) {
            var c = canvasData,
                d = drawData,
                f = tengu.getImage(filename);

            //tengu.drawImgFrame(c.ctx,this.imgFrame,d.x,d.y,d.scale,d.scale);

            //Draw if the image is loaded
            if (f.loaded) {
                //if bg image is vertically oriented, isVertical = true
                var isVertical = true,
                    cW = c.w,
                    cH = c.h,
                    boolRot = ((cH > cW) != isVertical),
                    isx = 0,
                    isy = 0,
                    iw = 640,
                    ih = 960,
                    icx = iw / 2,
                    icy = ih / 2,
                    wRatio = cW / cH,
                    iRatio = iw / ih,
                    ctx = c.ctx;

                ctx.save();
                if (boolRot) {
                    ctx.translate(cW, 0);
                    ctx.rotate((Math.PI / 2));
                    ctx.drawImage(f.img, 0, 0, iw, ih, 0, 0, cH, cW);
                } else {
                    ctx.drawImage(f.img, 0, 0, iw, ih, 0, 0, cW, cH);
                }
                ctx.restore();
            }
        }; //End draw function

        //Set the default draw function as equal to the draw function
        element.defaultDraw = element.drawFunction;

        return element;
    }; //End make bg

    //End gui module////////////////////////////////////////////
};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// HTML Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.html = function(tengu) {
    //HTML functions

    tengu.html_createRadioElement = function(name, checked) {
        var radioHtml = '<input type="radio" name="' + name + '"';
        if (checked) {
            radioHtml += ' checked="checked"';
        }
        radioHtml += '/>';

        var radioFragment = document.createElement('div');
        radioFragment.innerHTML = radioHtml;

        return radioFragment.firstChild;
    };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////
// DOM Module
//////////////////////////////////////////////////////////////////////////////////////////////////////

Tengu.modules.dom = function(tengu) {
    //Boot if not in browser
    if (typeof window == 'undefined'){
        return false;
    }
    //Requires: gui

    var _garbageBin,
        _discardNode,
        _ancestorInvisible,
        getGarbageBin,
        defaultDestroy,
        _disableDOMScaling = false,

        _log_node_discard = false,

        _ancestorInvisible = function(element) {
            var p = element;
            while (p.parent != null) {
                if (!p.visible) {
                    return true;
                }
                p = p.parent;
            }
            return false;
        };

    //Initiate Garbage Bin
    //garbage bin code by Andrew Dunn
    window.onload = function() {
        if (typeof(_garbageBin) === 'undefined') {
            //Here we are creating a 'garbage bin' object to temporarily 
            //store elements that are to be discarded
            _garbageBin = document.createElement('div');
            _garbageBin.style.display = 'none'; //Make sure it is not displayed
            _garbageBin.style.zIndex = -100;
            document.body.appendChild(_garbageBin);
        }

        _discardNode = function(element) {
            //The way this works is due to the phenomenon whereby child nodes
            //of an object with it's innerHTML emptied are removed from memory
            if (_log_node_discard) {
                console.log("Node Discarded");
            }

            //Move the element to the garbage bin element
            _garbageBin.appendChild(element);
            //Empty the garbage bin
            _garbageBin.innerHTML = "";
        };
        defaultDestroy = (function() {
            var e = tengu.newElement();
            return e.destroy;
        }());

    };

    //Enable console logging of node discards (will say "Node Discarded")
    tengu.logNodeDiscard = function() {
        _log_node_discard = true;
    };

    //Disable scaling of DOM elements for legacy projects
    tengu.disableDOMScaling = function(bool) {
        if (bool == undefined) {
            bool = true;
        }
        _disableDOMScaling = bool;
    };

    tengu.newDOMElement = function(type) {
        var e = tengu.newElement(),
            c = tengu.getCanvasData(),
            o = c.overlay,
            d = document.createElement(type),
            added = false;

        e._domElement = d;
        d.style.position = "absolute";

        //Set up onPropertyChange listener and callback
        if ("onpropertychange" in d)
            d.attachEvent($.proxy(function() {
                if (event.propertyName == "value")
                    e.onValueChange(d.value);
            }, d));
        else
            d.addEventListener("input", function() {
                e.onValueChange(d.value);
            }, false);

        //Add pointerdown listener
        d.addEventListener("pointerdown", function() {
            if (e.onClickAnywhere != undefined) {
                e.onClickAnywhere();
            }

            if (e.onClick != undefined) {
                e.onClick();
            }
        }, false);

        e.setText = function(txt) {
            d.innerHTML = txt;
        };

        e.destroy = function() {
            if (d) {
                _discardNode(d);
            }
            defaultDestroy.call(e);
        };

        e.onValueChange = function(value) {};

        e.preDrawFunction = function(c, p) {

            //Set position, width, and z
            d.style.left = p.x;
            d.style.top = p.y;

            //Default width, height
            d.style.width = e.width;
            d.style.height = e.height;

            d.style.zIndex = p.z;

            d.style.fontSize = e.fontSize * p.scale;

            if (e.visible) {
                d.style.visibility = "visible";
            } else {
                d.style.visibility = "hidden";
            }

            //Alter position based on alignment
            switch (this.halign) {
                case "center":
                    d.style.left = p.x - (p.width / 2);
                    break;
                case "right":
                    d.style.left = p.x - p.width;
                    break;
            };

            switch (this.valign) {
                case "middle":
                    d.style.top = p.y - (p.height / 2);
                    break;
                case "bottom":
                    d.style.top = p.y - p.height;
                    break;
            };

            //Add dom element to page if it hasn't been already
            if (!added) {
                added = true;
                o.appendChild(d);
            }

            if ((_disableDOMScaling && e.scaling_enabled) || !_disableDOMScaling) {
                //Set Scale
                d.style.transform = "scale(" + p.scale + ")";
                d.style.webkitTransform = "scale(" + p.scale + ")";
                d.style.mozTransform = "scale(" + p.scale + ")";
                d.style.oTransform = "scale(" + p.scale + ")";
                d.style.msTransform = "scale(" + p.scale + ")";

                //I have no clue why this works VVVV
                d.style.left = p.x + (-p.width * (1 / p.scale) * 0.5) + (p.x * 0.05);
                d.style.top = p.y + (-p.height * (1 / p.scale) * 0.5) + (p.y * 0.05);

            } else {
                //Set w/h
                if (d.style.width != "auto") {
                    d.style.width = p.width;
                }

                if (d.style.height != "auto") {
                    d.style.height = p.height;
                }
            }
        };

        e.drawFunction = function(c, p) {
            d.style.opacity = c.ctx.globalAlpha;
        };

        e.getValue = function() {
            return d.value;
        };

        e.getDOMElement = function() {
            return e._domElement;
        };

        e.getDOMStyle = function() {
            return e._domElement.style;
        };

        e.setDOMClass = function(cl) {
            e._domElement.className = cl;
        };

        e.setAlpha = function(a) {
            e._domElement.opacity = a;
        };



        return e;
    };

    tengu.newCheckboxElement = function(checked) {
        var e = tengu.newDOMElement("input"),
            d = e.getDOMElement();

        d.type = "checkbox";
        d.defaultChecked = checked;

        //This doesn't work, not sure why...
        d.onclick = function() {
            e.onValueChange(d.checked);
        };

        e.isChecked = function() {
            return d.checked;
        }

        e.setChecked = function(bool) {
            d.checked = bool;
        }

        return e;
    };

    tengu.newTextElement = function(text) {
        var e = tengu.newDOMElement("div"),
            d = e.getDOMElement(),
            f = e.preDrawFunction;

        //d.style.width = "auto";
        //d.style.height = "auto";
        d.innerHTML = text;

        e.fontSize = 30;
        //e.height = (d.clientHeight + 1);
        //e.width = (d.clientWidth + 1);
        e.textAlign = "left";
        e.textVAlign = "top"; //valign doesn't work...

        e.preDrawFunction = function(c, p) {
            d.fontSize = e.fontSize * p.scale;
            d.style.textAlign = e.textAlign;
            d.style.verticalAlign = e.textVAlign; //this doesn't work....


            switch (d.style.textAlign) {
                //case "center": p.x += p.width/2; break;
                //case "right": p.x += p.width; break;
            }


            f(c, p);
        };

        e.setText = function(txt){
            d.innerHTML = txt;
        };

        return e;
    };

    //End gui module////////////////////////////////////////////
};

//Node export
if (typeof module != "undefined"){
    module.exports = Tengu;
}
