const token = '';
const url = '';
const org = '';

require('../tester')(async function(describe, done) {

	await describe('influxdb', async function(test, next) {

		// Output messages from component
		test.output = function(msg) {
			// msg - Message instance from flowstream
            console.log('test.output', msg);
			test.ok();
			// test.fail();
		};

		test.status = function(newStatus) {
			console.log('Status:', newStatus);
		};

		// Change component's configuration
		test.configure({
            url,
            token,
            org,
            bucket: 'test',
            api: 'query',
            fields: { cpu: 'int', ram: 'float' },
            tags: ['hostname']
        });

		// Catch error from "instance.throw()" function (or onError)
		test.onerror = function(a, b, c, d) {
			console.log('Error -->', a, b, c, d);
		}

        console.log('Test.input : start');
        // QUERY
		test.input('input', {
            query: 'from(bucket: "test") |> range(start: -1h)'
        }, function(msg) {
            console.log('Test.input : end', msg);
			test.ok(typeof msg.data === 'array', 'How knows');

			// Resolve this test and go to next test
			next();
		});
        
        // INSERT
        /*test.input('input', {
            measurement: 'stats',
            fields: {
                cpu: 100,
                ram: 2.9
            },
            tags: {
                hostname: 'localhost'
            }
        }, function(msg) {
            console.log('Test.input : end', msg);
			test.ok(typeof msg.data === 'array', 'How knows');

			// Resolve this test and go to next test
			next();
		});*/

	});

});