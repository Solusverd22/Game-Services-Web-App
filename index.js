// module imports
var express = require ('express')
var pug = require('pug')
var bodyParser= require ('body-parser')
var session = require ('express-session');
var validator = require ('express-validator');
const expressSanitizer = require('express-sanitizer');
const mysql = require('mysql');

// Create the express application object
const app = express()
const port = 8000
app.use(bodyParser.urlencoded({ extended: true }))

// Define the database connection
const db = mysql.createConnection ({
    host: 'localhost',
    user: 'gsappuser',
    password: 'eggg',
    database: 'gameServices'
});
// Connect to the database
db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});
global.db = db;

// makes public directory static(easily visible/accesible on server)
// __dirname gets the current directory
app.use(express.static(__dirname + '/public'));

// Create input sanitizer
app.use(expressSanitizer());

// Set the HTML directory for express
app.set('views', __dirname + '/views');

// Tell Express that we want to use PUG as the templating engine
app.set('view engine', 'pug');

// Tells Express how we should process html files
// We want to use the PUG rendering engine
app.engine('html', pug.renderFile);

// Create a session
app.use(session({
    secret: 'somerandomstuff',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// Define our data
var siteData = {siteName: "Conor's Various Game Services"}

// Requires the main.js file inside the routes folder passing in the Express app and data as arguments.  All the routes will go in this file
require("./routes/main")(app, siteData);

// Start the web app listening
app.listen(port, () => console.log(`GS web app listening on port ${port}!`))
