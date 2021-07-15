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
		data.id = filename.substring(0, filename.length - 5);

		PATH.fs.readFile('components/' + filename, function(err, response) {
			response = response.toString('utf8');

			var version = response.match(/exports\.version.*?;/);
			var author = response.match(/exports\.author.*?;/);
			var color = response.match(/exports\.color.*?;/);
			var icon = response.match(/exports\.icon.*?;/);
			var name = response.match(/exports\.name.*?;/);
			var group = response.match(/exports\.group.*?;/);

			data.group = group ? evaluate(group[0]).group : '';
			data.name = name ? evaluate(name[0]).name : '';
			data.url = 'https://cdn.totaljs.com/flowstream/components/' + filename;
			data.author = author ? evaluate(author[0]).author : '';
			data.icon = icon ? evaluate(icon[0]).icon : '';
			data.color = color ? evaluate(color[0]).color : '';
			data.version = version ? evaluate(version[0]).version : '';

			arr.push(data);
			next();
		});

	}, function() {
		arr.quicksort('name');
		PATH.fs.writeFile('db.json', JSON.stringify(arr, null, '\t'), NOOP);
	});

});