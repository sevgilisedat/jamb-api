var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var morgan = require('morgan');
var restful = require('node-restful');
var mongoose = restful.mongoose;
var session = require('express-session');
var ejs = require('ejs');
var passport = require('passport');

var UserModel = require('./models/user');
var PostModel = require('./models/post');
var ClientModel = require('./models/client');

var OAuth2Controller = require('./controllers/oauth2');

var AuthModule = require('./modules/auth');

var app = express();
var router = express.Router();

app.set('view engine', 'ejs');

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({type:'application/vnd.api+json'}));
app.use(methodOverride());
app.use(session({
	secret: 'Super Secret Session Key',
	saveUninitialized: true,
	resave: true
}));
app.use(passport.initialize());

mongoose.connect('mongodb://localhost:27017/jamb');

var userResource = restful.model('user', UserModel.schema).methods(['get', 'post', 'put', 'delete']);
userResource.before('get',AuthModule.isBearerAuthenticated)
  .before('post', AuthModule.isBearerAuthenticated)
  .before('put', AuthModule.isBearerAuthenticated)
  .before('delete', AuthModule.isBearerAuthenticated);
userResource.register(app, '/users');

var postResource = restful.model('post', PostModel.schema).methods(['get', 'post', 'put', 'delete']);
postResource.before('get', AuthModule.isBearerAuthenticated)
  .before('post', AuthModule.isBearerAuthenticated)
  .before('put', AuthModule.isBearerAuthenticated)
  .before('delete', AuthModule.isBearerAuthenticated);
postResource.register(app, '/posts');

var clientResource = restful.model('client', ClientModel.schema).methods(['get', 'post']);
clientResource.register(app, '/clients');

router.route('/authorize')
	.get(AuthModule.isUserAuthenticated, OAuth2Controller.authorization)
	.post(AuthModule.isUserAuthenticated, OAuth2Controller.decision);

router.route('/token')
	.post(AuthModule.isClientAuthenticated, OAuth2Controller.token);

app.use('/oauth2', router);

app.listen(3000);

console.log('listening on ' + 3000);
