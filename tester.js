require('total4');

const Path = require('path');
const Fs = require('fs');

// Loggers
const logSuccess = function(test) {
	const tester = test.tester || test.__tester__;
	tester.stats.total++;
	tester.stats.ok++;

	const name = test.__description__;
	const duration = '(' + (new Date() - test.startAt) + ' ms)';
	console.log('[DONE] -', test.__name__, (name ? '- ' + name : ''), duration);

	delete test.__tester__;
	delete test.__name__;
};

const logFailed = function(test) {
	const tester = test.tester || test.__tester__;
	tester.stats.total++;
	tester.stats.failed++;

	const name = test.__description__;
	const duration = '(' + (new Date() - test.startAt) + ' ms)';
	console.log('[FAIL] -', test.__name__, (name ? '- ' + name : ''), duration);

	delete test.__tester__;
	delete test.__name__;
};

// Tester
const tester = {};
tester.path = './components';
tester.autoClose = true;
tester.autoCloseDuration = 5 * 1000;
tester.inputTests = {};
tester.tests = {};
tester.stats = { total: 0, ok: 0, failed: 0 };

tester.output = function(msg) {
	const test = this.tests[msg.fromid];
	const inputTest = tester.inputTests[msg.fromid + '_' + msg.__input__];

	// Global message catch
	test.output && test.output(msg);
	test.message && test.message(msg);

	// Input with callback
	if (inputTest) {
		inputTest.output && inputTest.output(msg);
		inputTest.message && inputTest.message(msg);

		inputTest.resolve(msg);
		inputTest.handler && inputTest.handler(msg);
	}
};

tester.finish = tester.done = function(message) {
	setTimeout(() => {
		const duration = new Date() - tester.startAt;
		const result = tester.stats.failed > 0 ? 'FAILED' : 'SUCCESSFUL';

		console.log('[FINISHED] - {0} in {1} ms'.format(result, duration));

		message && console.log(' ' + message);

		console.log(' - Total:', tester.stats.total);
		console.log(' - Success:', tester.stats.ok);
		console.log(' - Failed:', tester.stats.failed);

		tester.stop();
	}, 5);
};

tester.end = tester.throw = tester.fail = function(message) {
	console.log('[FAIL]' + (message ? ' - ' + message : ''));

	this.stop();
};

tester.stop = function() {
	clearTimeout(this.autoCloseTimeout);

	this.flowstream.destroy();
	this.flowstream = null;
	this.timeoutTimer = null;

	process.exit(this.stats.failed > 0);
};

tester.test = function(name, callback) {

	let testName = name;

	// Optional name parameter
	if (typeof (name) === 'function') {
		testName = U.getName(process.mainModule.filename).replace(/\.js$/, '');
		callback = name;
	}

	const componentPath = Path.join(__dirname, tester.path, testName + '.html');

	let testPromiseResolver;
	const testPromise = new Promise(resolve => testPromiseResolver = resolve);

	Fs.readFile(componentPath, 'utf8', (err, data) => {
		if (err) {
			console.error(err);
			return;
		}

		const flow = tester.flowstream;

		// Connection Ids
		const componentConnectionId = 'com_' + testName + '_' + UID();
		const testConnectionId = 'com_TEST_' + UID();

		// Register TEST component
		flow.register('TEST', instance => {
			instance.inputs = [{ id: 'input', name: 'Input' }];

			instance.message = function(msg) {
				msg.__tester__ = tester;
				msg.__input__ = instance.__input__;
				tester.output(msg);
			};
		});

		// Add TEST component to flowstream
		flow.use(`{
			"${testConnectionId}": {
				"component": "TEST",
				"connections": {}
			}
		}`, function() {
			// Add component to flowstream
			flow.add(testName, data);

			const componentConnection = { [componentConnectionId]: { component: testName, connections: { output: [{ id: testConnectionId, index: 'input' }] } } };

			// Connect component to TEST component
			flow.insert(componentConnection, function() {

				if (callback) {
					const id = componentConnectionId;
					const instance = flow.meta.flow[id];
					const testInstance = flow.meta.flow[testConnectionId];
					const test = {};

					test.input = function(inputIndex, data, handler) {

						// Optional input index
						if (typeof (inputIndex) !== 'string') {
							inputIndex = data;
							data = handler;
						}

						// Tell TEST component, that next incoming message is from "inputIndex"
						testInstance.__input__ = inputIndex;

						const inputTest = {};
						inputTest.handler = handler;

						const promise = new Promise(resolve => {
							inputTest.resolve = resolve;
						});

						tester.inputTests[id + '_' + inputIndex] = inputTest;

						// Send data to component
						flow.trigger(id + '__' + inputIndex, data);

						return promise;
					};

					// Handlers
					test.ok = function(value, description) {

						if (typeof value === 'string')
							description = value;

						this.__name__ = instance.module.name;
						this.__description__ = description;

						if (typeof (value) === 'undefined') {
							logSuccess(this);
							return;
						}

						if (value)
							logSuccess(this);
						else
							logFailed(this);

						delete this.__description__;
					};

					test.fail = function(value, description) {

						if (typeof value === 'string')
							description = value;

						this.__name__ = instance.module.name;
						this.__description__ = description;

						if (typeof (value) === 'undefined') {
							logFailed(this);
							return;
						}

						if (value)
							logFailed(this);
						else
							logSuccess(this);

						delete this.__description__;
					};

					test.tester = tester; // Reference to main tester instance
					test.defaultConfig = instance.config;
					test.config = instance.config;
					test.instance = instance;
					test.startAt = new Date();

					// Change config of component
					test.configure = test.reconfigure = function(properties, withoutConfigure) {
						instance.config = test.defaultConfig;

						for (let key in properties)
							instance.config[key] = properties[key];

						!withoutConfigure && instance.configure && instance.configure();
					};

					// Trigger
					test.trigger = function(data) {
						instance.trigger(data);
					};

					tester.tests[id] = test;

					callback(test, testPromiseResolver);

					instance.onerror = test.onerror;
					instance.onError = test.onError;
				}
			});
		});
	});

	return testPromise;
};

module.exports = function(callback) {

	const flow = tester.flowstream = FLOWSTREAM('Test');

	flow.onstatus = function(status) {
		const test = tester.tests[this.id];
		test.status && test.status(status);
		test.currentStatus = status;
	};

	flow.ondashboard = function(status) {
		const test = tester.tests[this.id];
		test.dashboard && test.dashboard(status);
		test.currentDashboard = status;
	};

	flow.onerror = function(a, b, c, d) {
		this.onError && this.onError(a, b, c, d);
		this.onerror && this.onerror(a, b, c, d);
	};

	tester.startAt = new Date();

	// Start "Timeout" timer
	tester.autoCloseTimeout = setTimeout(() => {
		tester.done();
	}, tester.autoCloseDuration);

	callback(tester.test, tester.done);
};