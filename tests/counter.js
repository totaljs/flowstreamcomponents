const tester = require('../tester');

tester(builder => {
	builder.test('counter', component => {

		let messages = 0;

		// Send random message to input
		component.inputs.input('Hello World!');
		messages++;

		// Send another message after 1 second
		setTimeout(() => {
			component.inputs.input(true);
			messages++;
		}, 1 * 1000);

		setTimeout(() => {
			// Check if message count is as expected
			component.ok(messages === component.currentStatus, 'Counting');

			// Clear counter
			component.trigger();
			component.ok(component.currentStatus === 0, 'Clearing');

			// End tester
			builder.done();
		}, 2 * 1000);

	});
});