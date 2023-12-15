module.exports = function (app, siteData) {
	const { check, validationResult } = require('express-validator');
	const redirectLogin = (req, res, next) => {
		if (!req.session.userId) {
			res.redirect('./login');
		} else { next(); }
	}

	// Handle our routes
	app.get('/', function (req, res) {
		res.render('index.pug', siteData);
	});

	app.get('/register', function (req, res) {
		res.render('register.pug', siteData);
	});
	app.post('/registered', [check('email').isEmail(), check('password').isLength({min: 8})], function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.redirect('./register');
		}
		else {
			const bcrypt = require('bcryptjs');
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
						// Save user session here, when login is successful
						req.session.userId = username;
						result = 'Hello ' + username + ' you are now registered! We will send an email to you at ' + email;
						//result += ' Your password is: ' + plainPassword + ' and your hashed password is: ' + hashedPassword;
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
		const bcrypt = require('bcryptjs');
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
					res.render("login.pug", newData);
				}
				else if (result) {
					// Save user session here, when login is successful
					req.session.userId = username;
					let newData = Object.assign({}, siteData, { text: "Hello " + username + " you are now logged in!" });
					res.render("data2text.pug", newData);
				}
				else {
					let newData = Object.assign({}, siteData, { errorMessage: "Wrong password, try again." });
					res.render("login.pug", newData);
				}
			});
		});
	});

	app.get('/logout', (req, res) => {
		req.session.destroy(err => {
			if (err) {
				return res.redirect('./');
			}
			let newData = Object.assign({}, siteData, { text: "you are now logged out." });
			res.render('data2text.pug', newData);
		})
	})

	app.get('/about', (req,res) => {
		res.render('about.pug', siteData);
	})

	app.get('/gamelist', redirectLogin, (req,res) => {
		let ownedQuery = "SELECT title, games.id FROM games ";
		ownedQuery = ownedQuery.concat("INNER JOIN game_profiles ON game_profiles.game_id=games.id ");
		ownedQuery = ownedQuery.concat("INNER JOIN users ON users.id=game_profiles.user_id ");
		ownedQuery = ownedQuery.concat("WHERE username LIKE '"+req.session.userId+"';");
		// execute sql query
		db.query(ownedQuery, (err, ownedresult) => {
			if (err) {
				res.redirect('./');
			}
			let unownedQuery = "SELECT games.title, games.id FROM games ";
			unownedQuery = unownedQuery.concat("WHERE NOT EXISTS ( ");
			unownedQuery = unownedQuery.concat("SELECT 1 FROM game_profiles ");
			unownedQuery = unownedQuery.concat("INNER JOIN users ON game_profiles.user_id = users.id ");
			unownedQuery = unownedQuery.concat("WHERE users.username = '"+req.session.userId+"' AND game_profiles.game_id = games.id );")
			db.query(unownedQuery, (err, unownedresult) => {
				if (err) {
					res.redirect('./');
				}
				let newData = Object.assign({}, siteData, { owned: ownedresult,unowned: unownedresult });
				res.render('gamelist.pug',newData);
			})
		})
	})

	app.get('/gamesearch',redirectLogin,[check('keyword').isEmpty()], function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.redirect('/gamelist');
		}
		else {
			const comparison_id = req.sanitize(req.query.keyword);
			let sqlquery = "SELECT * FROM users ";
			sqlquery = sqlquery.concat("INNER JOIN game_profiles ON game_profiles.user_id=users.id ");
			sqlquery = sqlquery.concat("INNER JOIN games ON games.id=game_profiles.game_id ");
			sqlquery = sqlquery.concat("WHERE user_id="+req.session.userId+" AND user_id="+comparison_id+";");
			// execute sql query
			db.query(sqlquery, (err, result) => {
				if (err) {
					res.redirect('./');
				}
				let newData = Object.assign({}, siteData, { list: result });
				res.render('userlist.pug',newData);
			})
		}
	})

	app.get('/userlist',redirectLogin, (req,res) => {
		let sqlquery = "SELECT * FROM users ";
		// execute sql query
		db.query(sqlquery, (err, result) => {
			if (err) {
				res.redirect('./');
			}
			let newData = Object.assign({}, siteData, { list: result });
			res.render('userlist.pug',newData);
		})
	})

	app.get('/addgame',redirectLogin, (req,res) => {
		res.render('addgame.pug',siteData);
	})
	app.post('/gameadded', redirectLogin,[check('price').isFloat(),check('max_players').isInt()], function (req, res) {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			res.redirect('/addgame');
		}
		else {
			const title = req.sanitize(req.body.title);
			const max_players = req.sanitize(req.body.max_players);
			const price = req.sanitize(req.body.price);
			// saving data in database
			let sqlquery = "INSERT INTO games (title, price, max_players) VALUES (?,?,?)";
			let newrecord = [title, price, max_players];
			db.query(sqlquery, newrecord, (err, result) => {
				if (err) {
					return console.error(err.message);
				}
				//get user and game ids to update the merge table
				db.query( "SELECT id FROM users WHERE username LIKE '"+req.session.userId+"';", (err, user_id_result) => {
					if (err) {
						console.error(err);
					}
						let user_id =user_id_result[0].id;
						db.query("SELECT id FROM games WHERE title LIKE '"+title+"';", (err, game_id_result) => {
							if (err) {
								console.error(err);
							}
							let game_id =game_id_result[0].id;
							let newrecord2 = [user_id,game_id];
							db.query("INSERT INTO game_profiles (user_id, game_id) VALUES (?,?)", newrecord2, (err, result) => {
								if (err) {
								return console.error(err.message);
								}
								res.redirect('/gamelist');
							});
				})
			})
		  	});
		}
	});
	app.get('/registergame', redirectLogin,[check('keyword').isEmpty()], function (req, res) {
		const errors = validationResult(req);
		if (errors.isEmpty()) {
			res.redirect('/gamelist');
		}
		else {
			const game_id = req.sanitize(req.query.keyword);
			db.query( "SELECT id FROM users WHERE username LIKE '"+req.session.userId+"';", (err, user_id_result) => {
				if (err) {
					console.error(err);
				}
				let ids = [user_id_result[0].id,game_id]
				db.query("INSERT INTO game_profiles (user_id, game_id) VALUES (?,?)", ids, (err, result) => {
					if (err) {
					return console.error(err.message);
					}
					res.redirect('/gamelist');
			});
			})
		}
	  });
	  app.get('/deregistergame', redirectLogin,[check('keyword').isEmpty()], function (req, res) {
		const errors = validationResult(req);
		if (errors.isEmpty()) {
			res.redirect('/gamelist');
		}
		else {
			const game_id = req.sanitize(req.query.keyword);
			db.query( "SELECT id FROM users WHERE username LIKE '"+req.session.userId+"';", (err, user_id_result) => {
				if (err) {
					console.error(err);
				}
				let user_id = user_id_result[0].id;
				db.query("DELETE FROM game_profiles WHERE user_id='"+user_id+"' AND game_id='+"+game_id+"';", (err, result) => {
					if (err) {
					return console.error(err.message);
					}
					res.redirect('/gamelist');
			});
			})
		}
	  });


	  app.post('/filter', redirectLogin, function (req, res) {
		if(req.body=={}) return res.redirect("/userlist");

		let ids= Object.keys(req.body);
		
		let sqlquery = "SELECT games.* FROM games ";
		sqlquery = sqlquery.concat("INNER JOIN game_profiles ON games.id = game_profiles.game_id ");
		sqlquery = sqlquery.concat("INNER JOIN users ON game_profiles.user_id = users.id ");
		sqlquery = sqlquery.concat("WHERE users.id IN ("+ids[0]);
		for(let i=1;i<ids.length;i++) sqlquery = sqlquery.concat(", "+ids[i]);
		sqlquery = sqlquery.concat(") ");
		sqlquery = sqlquery.concat("GROUP BY games.id ");
		sqlquery = sqlquery.concat("HAVING COUNT(DISTINCT users.id) = "+ids.length+";");
		// execute sql query
		console.log(sqlquery);
		db.query(sqlquery, (err, result) => {
			if (err) {
				res.redirect('./');
			}
			console.log(result);
			let newData = Object.assign({}, siteData, { list: result });
			res.render('filteredgames.pug',newData);
		})
	});
}
