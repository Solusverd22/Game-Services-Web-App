module.exports = function (app, siteData) {  
	// Handle our routes
	app.get('/', function (req, res) {
	  res.render('index.pug', siteData)
	});
  }
  