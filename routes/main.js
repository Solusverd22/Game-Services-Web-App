module.exports = function (app, siteData) {
	const { check, validationResult } = require('express-validator');
	const redirectLogin = (req, res, next) => {
		if (!req.session.userId) {
			res.redirect('./login')
		} else { next(); }
	}

	// Handle our routes
	app.get('/', function (req, res) {
		res.render('index.pug', siteData)
	});

	app.get('/register', function (req, res) {
		res.render('register.pug', siteData);
	});
	app.post('/registered', [check('email').isEmail(), check('password').isLength({ min: 8 })], function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.redirect('./register');
		}
		else {
			const bcrypt = require('bcrypt');
			const saltRounds = 10;
			const plainPassword = req.sanitize(req.body.password);
			const username = req.sanitize(req.body.username);
			const email = req.sanitize(req.body.email);
			bcrypt.hash(plainPassword, saltRounds, function (err, hashedPassword) {
				// saving data in database
				let sqlquery = "INSERT INTO users (username,email,passwordhash) VALUES (?,?,?)";
				// execute sql query
				let newrecord = [req.sanitize(req.body.username), email, hashedPassword];
				db.query(sqlquery, newrecord, (err, result) => {
					if (err) {
						res.redirect('./register');
						return console.error(err.message);
					}
					else
						result = 'Hello ' + username + ' you are now registered! We will send an email to you at ' + email;
					result += 'Your password is: ' + plainPassword + ' and your hashed password is: ' + hashedPassword;
					let newData = Object.assign({}, siteData, { text: result });
					res.render('data2text.pug', newData);
				});
			})
		}
	});

	app.get('/login', function (req, res) {
		let newData = Object.assign({}, siteData, { errorMessage: "" });
		res.render('login.pug', newData);
	});
	app.post('/loggedin', function (req, res) {
		const bcrypt = require('bcrypt');
		const saltRounds = 10;
		const plainPassword = req.sanitize(req.body.password);
		const username = req.sanitize(req.body.username);
		let sqlquery = "SELECT passwordhash FROM users WHERE username ='" + username + "'"; // query database to find the user
		// execute sql query
		db.query(sqlquery, (err, databaseHash) => {
			if (err || databaseHash[0] === undefined) {
				let newData = Object.assign({}, siteData, { errorMessage: "Username not found, check your spelling" });
				//let newData = Object.assign({}, siteData, { errorMessage: err });
				res.render("login.pug", newData);
				return;
			}
			// user found in Database, hash returned
			bcrypt.compare(plainPassword, databaseHash[0].passwordhash, function (err, result) {
				if (err) {
					let newData = Object.assign({}, siteData, { errorMessage: "Username not found, check your spelling" });
					res.render("login.pug", newData)
				}
				else if (result) {
					// Save user session here, when login is successful
					req.session.userId = username;
					let newData = Object.assign({}, siteData, { text: "Hello " + username + " you are now logged in!" });
					res.render("data2text.pug", newData);
				}
				else {
					let newData = Object.assign({}, siteData, { errorMessage: "Wrong password, try again." });
					res.render("login.pug", newData)
				}
			});
		});
	});

	app.get('/logout', (req, res) => {
		req.session.destroy(err => {
			if (err) {
				return res.redirect('./')
			}
			let newData = Object.assign({}, siteData, { text: "you are now logged out." });
			res.render('data2text.pug', newData);
		})
	})

}
