require('total4');

const Path = require('path');
const Fs = require('fs');

// Loggers
const logSuccess = function(test) {
	const tester = test.tester || test.__tester__;
	tester.stats.total++;
	tester.stats.ok++;

	const name = test.__description__;
	console.log('[OK] -', test.__name__ + (name ? ' - ' + name : ''));

	delete test.__tester__;
	delete test.__name__;
};

const logFailed = function(test) {
	const tester = test.tester || test.__tester__;
	tester.stats.total++;
	tester.stats.failed++;

	const name = test.__description__;
	console.log('[FAILED] -', test.__name__ + (name ? ' - ' + name : ''));

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

	msg.ok = test.ok;
	msg.fail = test.fail;

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
		this.stop();

		const duration = (new Date() - this.startAt) / 1000;

		console.log('[DONE] in {0}s'.format(duration));

		message && console.log(' ' + message);

		console.log(' - Total:', this.stats.total);
		console.log(' - Success:', this.stats.ok);
		console.log(' - Failed:', this.stats.failed);
	}, 5);
};

tester.end = tester.throw = tester.fail = function(message) {
	this.stop();

	console.log('[FAILED]' + (message ? ' - ' + message : ''));
};

tester.stop = function() {
	clearTimeout(this.autoCloseTimeout);

	this.flowstream.destroy();
	this.flowstream = null;
	this.timeoutTimer = null;
};

tester.test = function(name, callback) {

	let testName = name;

	// Optional name parameter
	if (typeof (name) === 'function') {
		testName = U.getName(process.mainModule.filename).replace(/\.js$/, '');
		callback = name;
	}

	const componentPath = Path.join(__dirname, this.path, testName + '.html');

	let testPromiseResolver;
	const testPromise = new Promise(resolve => testPromiseResolver = resolve);

	Fs.readFile(componentPath, 'utf8', (err, data) => {
		if (err) {
			console.error(err);
			return;
		}

		const flow = this.flowstream;

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

					// Status
					test.status = function(newStatus) {
						instance.status(newStatus);
					};

					tester.tests[id] = test;

					callback(test, testPromiseResolver);
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

		test.onstatus && test.onstatus(status);
		test.onStatus && test.onStatus(status);

		test.currentStatus = status;
	};

	flow.ondashboard = function(status) {
		const test = tester.tests[this.id];

		test.ondashboard && test.ondashboard(status);
		test.onDashboard && test.onDashboard(status);

		test.currentDashboard = status;
	};

	flow.onerror = function(err, source, instanceId) {
		const instance = flow.meta.flow[instanceId] || this;
		if (instance) {
			instance.onError && instance.onError(err);
			instance.onerror && instance.onerror(err);
		}
	};

	tester.startAt = new Date();

	// Start "Timeout" timer
	tester.autoCloseTimeout = setTimeout(() => {
		tester.done();
	}, tester.autoCloseDuration);

	callback(tester);
};