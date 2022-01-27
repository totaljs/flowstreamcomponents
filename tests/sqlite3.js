// FlowStream Tester
// Component: counter.html

require('../tester')(async function(describe, done) {

	await describe('sqlite3', function(test, next) {

		//console.log(test.instance);
		test.instance.outputs = [{ id: 'output', name: 'Output' }, { id: 'error', name: 'Error' }, { id: 'output2', name: 'Output2' }];
		
		test.input('input', { prepare: 'CREATE TABLE test (name TEXT);', fn: 'run' });
		
		// Output messages from component
		test.output = function(msg) {
			if (msg.data.hasOwnProperty('changes')) {
				test.ok('Create table');
				test.input('input', { prepare: 'SELECT * FROM test;', fn: 'all' });
				return;
			}
			console.log(msg);
			test.ok('Select');
			console.log('data', msg.data);
			next();
		};
	});

	// End tester
	done();
});