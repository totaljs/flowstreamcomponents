// FlowStream Tester
// Component: counter.html

require('../tester')(async function(describe, done) {

	await describe('test', function(test, next) {

		test.configure({ outputs: [{ id: 'output', name: 'Output' }, { id: 'dynamic', name: 'Dynamic' }] });

		test.input('input', 'Hello world');

		let i = 0;
		test.output = function(msg) {
			console.log(msg.data);
			i++;
			if (i == 1)
				return;
			test.ok();
			next();
		};
	});

	// End tester
	done();
});