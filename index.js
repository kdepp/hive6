var express = require('express');
var session = require('express-session');
var bodyParser = require('body-parser');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');

var u = require('./common/utils');
var router = require('./routers');
var passport = require('./common/passport');
var io = require('./websocket/io');

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

io({ middlewares: [sessionMiddleWare] });

app.set('view engine', 'pug');
app.set('views', './views');

app.use(express.static('wwwroot'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(sessionMiddleWare);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function (err, req, res, next) {
  res.status(500);
  res.send('Something Wrong: ' + err.stack);
});

u.setRouter(app, router);

app.listen('3030', function () {
  console.log('hive6 is listening on port 3030');
});
