const tester = require('../tester');

// Recommended
tester(async function(builder) {
	await builder.test('example-increment', function(component, next) {
		component.ok();
		console.log('Test - 1');
		setTimeout(next, 1000);
	});

	await builder.test('example-increment', function(component, next) {
		component.ok();
		console.log('Test - 2');
		setTimeout(next, 1000);
	});

	builder.test('example-increment', function(component) {
		component.ok();
		console.log('Test - 3');
		builder.done();
	});
});

// NOT recommended
// There is big change that tests won't have same order as defined so "Test - 3" will end Tester too early
// tester(function(builder) {
// 	builder.test('example-increment', function(component) {
//		component.ok();
// 		console.log('Test - 1');
// 	});

// 	builder.test('example-increment', function(component) {
//		component.ok();
// 		console.log('Test - 2');
// 	});

// 	builder.test('example-increment', function(component) {
//		component.ok();
// 		console.log('Test - 3');
// 		builder.done();
// 	});
// });