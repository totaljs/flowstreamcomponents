require('../tester')(async function(describe, done) {

	await describe('example-increment', function(test, next) {
		test.ok();
		console.log('Test - 1');
		setTimeout(next, 1000);
	});

	await describe('example-increment', function(test, next) {
		test.ok();
		console.log('Test - 2');
		setTimeout(next, 1000);
	});

	await describe('example-increment', function(test, next) {
		test.ok();
		console.log('Test - 3');
		setTimeout(next, 1000);
	});

	done();
});

// NOT recommended
// There is big change that tests won't have same order as defined so "Test - 3" will end Tester too early
// tester(function(describe, done) {
// 	describe('example-increment', function(test) {
//		test.ok();
// 		console.log('Test - 1');
// 	});

// 	describe('example-increment', function(test) {
//		test.ok();
// 		console.log('Test - 2');
// 	});

// 	describe('example-increment', function(test) {
//		test.ok();
// 		console.log('Test - 3');
// 		done();
// 	});
// });