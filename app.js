var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var passport = require('passport');
var session = require('express-session');
var flash = require('connect-flash');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var messagedata = require('./routes/message');
var passport_local = require('passport-local');
passport.use(new passport_local(usersRouter.authenticate()));
var app = express();
const _ = require('lodash');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(session({
  resave:false,
  saveUninitialized:false,
  secret:'89789hdjh',
  cookie: {
    secure: false,
    maxAge: 2 * 60 * 60 * 1000 
}
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(usersRouter.serializeUser());
passport.deserializeUser(usersRouter.deserializeUser());

app.use((req, res, next) => {

  res.locals.currentUser  = req.user
  next();
  
});


 
app.use(async(req, res, next) => {
 
  if (req.session && req.session.passport && req.session.passport.user) {
    var user = await usersRouter.findOne({username:req.session.passport.user}).populate('senderid').populate('reciverid').sort({ _id: -1 });
    res.locals.currentUserdata = user._id;
  var messages = await messagedata.find({senderid:user._id}).populate('senderid').populate('receiverid').sort({ _id: -1 });
    var messages = await messagedata.find({senderid:user._id}).populate('senderid').populate('receiverid');
  var receiverid = await messagedata.find({receiverid:user._id}).populate('senderid').populate('receiverid');

  var finalmessage = await messagedata.find().populate('senderid').populate('receiverid');
  var finaluniquemessage = null;
  if(finalmessage.length > 0){
    var dataMap = [];
    finalmessage.forEach(function(event){
       dataMap[event['message_id']] = event;
    });
     finaluniquemessage = Object.values(dataMap);
  

  }
  else {
    finaluniquemessage = null
  }


  
  const alldata= {
    messages,user,receiverid,finalmessage,finaluniquemessage
  }
  res.locals.userMessage = alldata;
}
  next();
});



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
