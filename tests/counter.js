const tester = require('../tester');

tester(function(builder) {
	builder.test(function(test) {

		let messages = 0;

		// Send random message to input
		test.input('Hello World!');
		messages++;

		// Send another message after 1 second
		setTimeout(function() {
			test.input('Hello Again!');
			messages++;
		}, 1 * 1000);

		setTimeout(function() {
			// Check if message count is as expected
			test.ok(test.currentStatus === messages, 'Counting');

			// Clear counter
			test.trigger();
			test.ok(test.currentStatus === 0, 'Clearing');

			// End tester
			builder.done();
		}, 2 * 1000);

	});
});