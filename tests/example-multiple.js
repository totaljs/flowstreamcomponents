const tester = require('../tester');

// Recommended
tester(async function(test, done) {
	await test('example-increment', function(component, next) {
		component.ok();
		console.log('Test - 1');
		setTimeout(next, 1000);
	});

	await test('example-increment', function(component, next) {
		component.ok();
		console.log('Test - 2');
		setTimeout(next, 1000);
	});

	test('example-increment', function(component) {
		component.ok();
		console.log('Test - 3');
		done();
	});
});

// NOT recommended
// There is big change that tests won't have same order as defined so "Test - 3" will end Tester too early
// tester(function(test, done) {
// 	test('example-increment', function(component) {
//		component.ok();
// 		console.log('Test - 1');
// 	});

// 	test('example-increment', function(component) {
//		component.ok();
// 		console.log('Test - 2');
// 	});

// 	test('example-increment', function(component) {
//		component.ok();
// 		console.log('Test - 3');
// 		done();
// 	});
// });