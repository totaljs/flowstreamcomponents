const tester = require('../tester');

// Recommended
tester(async builder => {
	await builder.test('com_1', (component, next) => {
		console.log('Test - 1');
		setTimeout(next, 1000);
	});

	await builder.test('com_2', (component, next) => {
		console.log('Test - 2');
		setTimeout(next, 1000);
	});

	builder.test('com_3', component => {
		console.log('Test - 3');
		builder.done();
	});
});

// NOT recommended
// There is big change that tests won't have same order as defined so "Test - 3" will end Tester too early
tester(builder => {
	builder.test('com_1', component => {
		console.log('Test - 1');
	});

	builder.test('com_2', component => {
		console.log('Test - 2');
	});

	builder.test('com_3', component => {
		console.log('Test - 3');
		builder.done();
	});
});