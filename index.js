var fs = require('fs');
var path = require('path');
var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var FileStreamRotator = require('file-stream-rotator');
var morgan = require('morgan');

var u = require('./common/utils');
var router = require('./routers');
var passport = require('./common/passport');
var io = require('./websocket/io');

var logDirectory = path.join(__dirname, 'log');
var app = express();
var sessionMiddleWare = session({
  secret: 'hive6 coming',
  resave: false,
  saveUninitialized: false,
  cookie: {},
  store: new MongoStore({
    url: 'mongodb://localhost/hive6'
  })
});

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

io({ middlewares: [sessionMiddleWare] });

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.static('wwwroot'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(sessionMiddleWare);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function (err, req, res, next) {
  res.status(500);
  res.send('Something Wrong: ' + err.stack);
});
app.use(morgan('combined', {
  stream: FileStreamRotator.getStream({
    date_format: 'YYYYMMDD',
    filename: path.join(logDirectory, 'access-%DATE%.log'),
    frequency: 'daily',
    verbose: false
  })
}));

u.setRouter(app, router);

app.listen('3030', function () {
  console.log('hive6 is listening on port 3030');
});
