require('total4');

const path = require('path');
const fs = require('fs');

// Handlers
const okHandler = (value, instance) => {
	if (typeof value === 'undefined') {
		logSuccess(instance);
		return;
	}

	if (value)
		logSuccess(instance);
	else
		logFailed(instance);
};

const failHandler = (value, instance) => {
	if (typeof value === 'undefined') {
		logFailed(instance);
		return;
	}

	if (value)
		logFailed(instance);
	else
		logSuccess(instance);
};

const handlerBuilder = (instance) => {
	return {
		name: (name) => {
			instance.testName = name;
		}
	};
};

// Loggers
const logSuccess = function(instance) {
	instance.tester.stats.total++;
	instance.tester.stats.ok++;

	const name = instance.testDescription;
	console.log('[OK] -', instance.module.name + (name ? ' - ' + name : ''));
};

const logFailed = function(instance) {
	instance.tester.stats.total++;
	instance.tester.stats.failed++;

	const name = instance.testDescription;
	console.log('[FAILED] -', instance.module.name + (name ? ' - ' + name : ''));
};

// Tester
const tester = {};
tester.path = './components';
tester.autoClose = true;
tester.autoCloseDuration = 5 * 1000;
tester.tests = {};
tester.stats = { total: 0, ok: 0, failed: 0 };

tester.output = function(message) {
	const test = tester.tests[message.from.component + '_' + message.fromid];

	if (test) {
		// Output based on input
		test.component.output && test.component.output(message);
		test.handler(message);
		test.resolve(message);
	} else {
		// Regular output
		message.from.output && message.from.output(message);
	}
};

tester.finish = tester.done = function(message) {
	setTimeout(() => {
		this.stop();

		const duration = (new Date() - tester.startAt) / 1000;

		console.log('[DONE] in {0}s'.format(duration));

		message && console.log(' ' + message);

		console.log(' - Total:', tester.stats.total);
		console.log(' - Success:', tester.stats.ok);
		console.log(' - Failed:', tester.stats.failed);
	}, 5);
};

tester.throw = tester.fail = function(message) {
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

	const componenetPath = path.join(this.path, name + '.html');

	let testPromiseResolver;
	const testPromise = new Promise(resolve => testPromiseResolver = resolve);

	fs.readFile(componenetPath, 'utf8', (err, data) => {
		if (err) {
			console.error(err);
			return;
		}

		const flow = this.flowstream;

		// Add component to flowstream
		flow.add(name, data);

		const newConnectionId = 'com' + '_' + name + '_' + UID();
		const newConnection = { [newConnectionId]: { component: name, connections: { output: [{ id: 'com_TEST', index: 'input' }] } } };

		// Connect component to TEST component
		flow.insert(newConnection, () => {

			if (callback) {
				const id = newConnectionId;
				const component = flow.meta.components[name];
				const instance = flow.meta.flow[id];
				const inputs = {};

				component.inputs && component.inputs.forEach(input => {
					inputs[input.id] = (data, handler) => {
						const test = {};
						const promise = new Promise(resolve => {
							test.resolve = resolve;
						});

						if (!handler)
							handler = () => instance.ok();

						test.on = {};
						test.component = instance;
						test.handler = handler;
						tester.tests[name + '_' + id] = test;

						flow.trigger(id + '__' + input.id, data);

						return promise;
					};
				});

				// Handlers
				instance.ok = (value, description) => {
					instance.testDescription = description;
					okHandler(value, instance);
					return handlerBuilder(instance);
				};

				instance.fail = (value, description) => {
					instance.testDescription = description;
					failHandler(value, instance);
					return handlerBuilder(instance);
				};

				instance.tester = tester;
				instance.inputs = inputs;
				instance.defaultConfig = instance.config;

				// Change config of component
				instance.set = (properties, withoutConfigure) => {
					instance.config = instance.defaultConfig;

					for (let key in properties)
						instance.config[key] = properties[key];

					!withoutConfigure && instance.configure && instance.configure();
				};

				callback(instance, testPromiseResolver);
			}
		});
	});

	return testPromise;
};

module.exports = callback => {

	const flow = tester.flowstream = FLOWSTREAM('Test');

	flow.onstatus = function(status) {
		this.onStatus && this.onStatus(status);
		this.currentStatus = status;
	};

	flow.ondashboard = function(status) {
		this.onDashboard && this.onDashboard(status);
	};

	flow.onerror = function(err, source, instanceId) {
		const instance = flow.meta.flow[instanceId] || this;
		instance && instance.onError && instance.onError(err);
	};

	// Register TEST component
	flow.register('TEST', instance => {
		instance.inputs = [{ id: 'input', name: 'Input' }];
		instance.message = (msg) => {
			const from = msg.from;

			if (!from.msg)
				from.msg = {};

			from.msg[from.id] = msg;

			// Handlers for message instance
			msg.ok = (value, description) => {
				from.testDescription = description;
				okHandler(value, from);
				return handlerBuilder(from);
			};

			msg.fail = (value, description) => {
				from.testDescription = description;
				failHandler(value, from);
				return handlerBuilder(from);
			};

			tester.output(msg);
		};
	});

	tester.startAt = new Date();

	// Start "Timeout" timer
	tester.autoCloseTimeout = setTimeout(() => {
		tester.done();
	}, tester.autoCloseDuration);

	// Place "TEST" component
	flow.use(`{
		"com_TEST": {
			"component": "TEST",
			"connections": {}
		}
	}`, () => {
		callback && callback(tester);
	});

};