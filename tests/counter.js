// FlowStream Tester
// Component: counter.html

require('../tester')(async function(describe, done) {

	await describe(function(test, next) {

		let messages = 0;
		let status = 0;

		// Capture component status
		test.status = function(data) {
			status = data;
		};

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
			test.ok(status === messages, 'Counting');

			// Clear counter
			test.trigger();
			test.ok(status === 0, 'Clearing');

			next();

		}, 2 * 1000);

	});

	// End tester
	done();

});