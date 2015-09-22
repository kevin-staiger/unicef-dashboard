var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var fs = require('fs')
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cacheResponseDirective = require('express-cache-response-directive');
var stream = require('logrotate-stream');
var AWS = require('aws-sdk')
var _ = require('underscore');

var app = express();

fs.exists('./config.json', function (exists){
  console.log(exists)
  if (exists == true) {
    AWS.config.loadFromPath('./config.json');
  } 
})

app.use(
  "/", 
  express.static(__dirname) 
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({}));

app.post('/api/encrypt', function (req, res, next) {

  AWS.config.update({region: req.body.region});
  console.log(AWS.config)
  var params = {
    KeyId: 'f394764b-4557-4e55-8725-719a07f30614',
    Plaintext: req.body.encryptionData
  }
  var kms = new AWS.KMS({apiVersion: '2014-11-01'});
  kms.encrypt(params, function(err, data) {
    if (err) console.log(err, err.stack);
    // else console.log(data.CiphertextBlob.toString('utf8'))
    else res.json({cipher: data.CiphertextBlob.toString('base64')});
  }) 
})

//load config
var config = require('./config/config')

//set port
app.set('port', config.port)

// view engine setup
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

//set access logs
try {
    fs.mkdirSync(__dirname + '/logs/');
}
catch (ex) {
    if (ex.code != 'EEXIST') {
        throw ex;
    }
}

var accessLogStream = stream({
                                 file: __dirname + '/logs/access.log',
                                 size: config.accessLog.fileSize,
                                 keep: config.accessLog.keep,
                                 compress: config.accessLog.compress
                             });

logger.format('access', '[:date] ip=:remote-addr mtd=:method url=:url http=:http-version rfr=":referrer" st=:status cl=:res[content-length] - time=:response-time ms');
app.use(logger('access', {stream: accessLogStream, buffer: true}));

//configure

app.use(cookieParser());
app.disable('etag')
app.use(cacheResponseDirective());
app.use(express.static(path.join(__dirname, 'public')));

//routes
var routes = require('./routes/index')(config);
var isactive = require('./routes/isactive');
var buildinfo = require('./routes/buildinfo');
app.use('/', routes);
app.use('/isActive', isactive);
app.use('/buildInfo', buildinfo);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'dev') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
