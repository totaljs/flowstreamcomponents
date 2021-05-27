require('total4');

PATH.fs.readdir('components', function(err, response) {

	var arr = [];
	var evaluate = function(code) {
		var obj = {};
		new Function('exports', code)(obj);
		return obj;
	};

	response.wait(function(filename, next) {

		var data = {};
		data.name = filename.substring(0, filename.length - 5);

		PATH.fs.readFile('components/' + filename, function(err, response) {
			response = response.toString('utf8');

			var version = response.match(/exports\.version.*?;/);
			var author = response.match(/exports\.author.*?;/);
			var color = response.match(/exports\.color.*?;/);
			var icon = response.match(/exports\.icon.*?;/);

			data.author = author ? evaluate(author[0]).author : '';
			data.icon = icon ? evaluate(icon[0]).icon : '';
			data.color = color ? evaluate(color[0]).color : '';
			data.version = version ? evaluate(version[0]).version : '';

			arr.push(data);
			next();
		});

	}, function() {
		PATH.fs.writeFile('db.json', JSON.stringify(arr), NOOP);
	});

});