const tester = require('../tester');

tester(builder => {
	builder.test('trigger', component => {

		// Random string
		component.set({ random: true, data: 'NOT_RANDOM' });
		component.output = msg => {
			msg.fail(msg.data === 'NOT_RANDOM', 'Random string');
		};
		component.trigger();

		// NOT Random string
		setTimeout(() => {
			component.set({ random: false, data: 'NOT_RANDOM' });
			component.output = msg => {
				msg.ok(msg.data === 'NOT_RANDOM', 'NOT Random string');

				// End
				builder.done();
			};
			component.trigger();
		}, 1000);

	});
});