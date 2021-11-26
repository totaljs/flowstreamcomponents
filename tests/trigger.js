const tester = require('../tester');

tester(async function(builder) {
	await builder.test(function(test, next) {
		// If message won't come out in 0.5 second, test will fail
		const timeout = setTimeout(function() {
			test.fail('Timeout');
		}, 500);

		test.output = function(msg) {
			clearTimeout(timeout);
			msg.ok('Timeout');
			next();
		};

		test.trigger();
	});

	builder.test(function(test) {

		// Random string
		test.configure({ random: true, data: 'NOT_RANDOM' });
		test.output = function(msg) {
			msg.fail(msg.data === 'NOT_RANDOM', 'Random string');
		};

		test.trigger();

		// NOT Random string
		setTimeout(function() {
			test.configure({ random: false, data: 'NOT_RANDOM' });

			test.output = function(msg) {
				msg.ok(msg.data === 'NOT_RANDOM', 'NOT Random string');

				// End
				builder.done();
			};

			test.trigger();
		}, 1000);

	});
});