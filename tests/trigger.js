require('../tester')(async function(test, done) {
	await test(function(test, next) {
		// If message won't come out in 0.5 second, test will fail
		const timeout = setTimeout(function() {
			test.fail('Timeout');
		}, 500);

		test.output = function(msg) {
			clearTimeout(timeout);
			test.ok('Timeout');
			next();
		};

		test.trigger();
	});

	test(function(test) {

		// Random string
		test.configure({ random: true, data: 'NOT_RANDOM' });
		test.output = function(msg) {
			test.fail(msg.data === 'NOT_RANDOM', 'Random string');
		};

		test.trigger();

		// NOT Random string
		setTimeout(function() {
			test.configure({ random: false, data: 'NOT_RANDOM' });

			test.output = function(msg) {
				test.ok(msg.data === 'NOT_RANDOM', 'NOT Random string');

				// End tester
				done();
			};

			test.trigger();
		}, 1000);

	});
});