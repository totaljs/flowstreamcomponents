require('total4');

FUNC.indent = function(count, val) {

	var lines = val.split('\n');
	var str = '';
	var total = Math.abs(count);
	var is = false;

	for (var i = 0; i < total; i++)
		str += '\t';

	for (var i = 0; i < lines.length; i++) {
		if (count > 0 && lines[i])
			lines[i] = str + lines[i];
		else if (lines[i].substring(0, total) === str) {
			lines[i] = lines[i].substring(total);
			is = true;
		} else if (lines[i] && !is)
			break;
	}

	return lines.join('\n');
};

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

		if (data.id === 'example-increment') {
			next();
			return;
		}

		PATH.fs.readFile('components/' + filename, function(err, response) {
			response = response.toString('utf8');

			var version = response.match(/exports\.version.*?;/);
			var author = response.match(/exports\.author.*?;/);
			var color = response.match(/exports\.color.*?;/);
			var icon = response.match(/exports\.icon.*?;/);
			var name = response.match(/exports\.name.*?;/);
			var group = response.match(/exports\.group.*?;/);
			var kind = response.match(/exports\.kind.*?;/);

			data.group = group ? evaluate(group[0]).group : '';
			data.name = name ? evaluate(name[0]).name : '';
			data.url = 'https://cdn.totaljs.com/flowstream/webcomponents/' + filename;
			data.author = author ? evaluate(author[0]).author : '';
			data.icon = icon ? evaluate(icon[0]).icon : '';
			data.color = color ? evaluate(color[0]).color : '';
			data.version = version ? evaluate(version[0]).version : '';
			data.kind = kind ? evaluate(kind[0]).kind : '';

			var index = response.indexOf('<readme>');

			if (index !== -1)
				data.readme = FUNC.indent(-1, response.substring(index + 8, response.indexOf('</readme>', index + 8))).trim();

			arr.push(data);
			next();
		});

	}, function() {
		arr.quicksort('name');
		PATH.fs.writeFile('db.json', JSON.stringify(arr, null, '\t'), NOOP);
	});

});