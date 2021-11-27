const tester = require('../tester');

// tester.autoClose = false; // "builder.done()" to manually finish tester
// tester.autoCloseDuration = 5 * 1000; // 5 seconds

// tester.directory = './components';

tester(async function(builder) {
	// Pass filename as first argument otherwise filename of this file will be automatically assigned
	await builder.test('example-increment', async function(component, next) {

		// Output messages from component
		component.output = function(msg) {
			// msg - Message instance
			// component.ok();
			// component.fail();
		};

		// Changing component status
		component.onstatus = function(newStatus) {
			console.log('[LOG] Component is ' + newStatus.mood);
		};
		component.status({ mood: 'happy' });

		// Trigger component's trigger event
		component.trigger(1);

		// Change component's configuration
		component.configure({ increment: 5 });

		// Change component's configuration without triggering configure function
		component.configure({ increment: 5 }, true);

		// Any output based on input "number" will be flagged as success
		// Use "await" so test bellow wont interupt or modify configuration of this test
		await component.input('number');

		// Set config.increment to -10 and sends 10 into input "number". Output 0 is expected
		component.configure({ increment: -10 });

		component.input('number', 10, function(msg) {
			msg.ok(msg.data === 0, '"-10 + 10 = 0"');

			// Resolve this test and go to next "builder.test"
			next();
		});

	});

	builder.test('counter', function(component) {
		setTimeout(() => {
			// Test was successful
			component.ok();

			// End tester and show results in console
			builder.done();
		}, 1000);
	});

});