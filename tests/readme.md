# FlowStream Component Tester

Simple tool for testing FlowStream components.

## Usage

First, you need to initialize testing FlowStream instance by calling imported `tester` function. In callback you will get `test` function that is used to initialize components. To initialize component use `test` with filename as first argument of component inside `components` directory (path can be changed with `tester.path`). After successfull component initialization, `test` instance is returned in callback of second argument where you can start testing your component.

If your test is longer than 5 seconds, consider extending `tester.timeout` value or disabling auto-close feature and manually existing using tester with `done()` method (second argument in callback of `tester()` function).

You can also test multiple components in one file. Example is in `tests/example-multiple.js` file.

```js
require('./tester')(function (describe, done) {

    // this.timeout = 10000; // 10 seconds timeout

    describe('counter', function (test) {

        // Test was successful
        test.ok();

        // End tester and show results
        done();
    });
});
```

## Test

**Testing**:

First argument of callback in `test` function is `test` that is used to create tests for your component.

**Configuration**:

To dynamically change configuration of component use `configure` method. After using `set` method, tester will reset configuration to default value from component's file (`exports.config`) and replace ONLY provided properties from first argument. You can also tell tester to NOT trigger `configure` method of component with second `true` argument (`test.configure({ ready: true }, true)`).

```js
describe('test', function (test) {
    // { mode: 'debug', ready: false }
    test.configure({ ready: true });
    // { mode: 'debug', ready: true }
});
```

**Input**:

All inputs of component are wrapped in `test.input` method. With this you can simulate sending data to your component and catch output message of components in callback or `test.message` and `test.output` delegated (Component must have outputs).

First optional argument is index of input (default input index is `input`). Second is data you want to send to your component and last is optional callback of received output.

Also keep in mind that tester can't tell which output message is from requested input so you can receive output messages from other inputs also. In that case, consider using global message catching via `test.message` or `test.output` with your own handling logic.

```js
describe('increment', function(test) {
    const data = [1, 2];

    test.input(data, msg => {
        // Test is flagged as Successful when message data is equal to 3
        test.ok(msg.data === 3);

        // Same result
        test.fail(msg.data !== 3);
    };
});
```

**Output**:

All outcoming messages from component can be catched with `test.message` or `test.output` delegate. In callback you get [FlowStream message](https://docs.totaljs.com/total4/40844001ni51c/) but it's extended with test handlers (more in **Handlers**)

```js
describe('test', function (test) {
    test.output = function (msg) {

        // Check if message is from 'output1' index and data of message is 'total.js'
        if (msg.output === 'output1' && msg.data === 'total.js')
            test.ok();
        else
            test.fail();

        // Shorthand - If condition inside 'msg.ok()' is not true, 'msg.fail' is called automatically
        test.ok(msg.output === 'output1' && msg.data === 'total.js');
    };
});
```

**Trigger**:

You can manually trigger component's `trigger` method simply with `test.trigger(data)` method.

**Status**:

When status is changed (from test but also from component method) delegate `test.status` with new status is triggered. Current status of component is stored in `test.currentStatus` (Don't mutate this property directly).

## Handlers

Handlers are used to tell tester if your testing script was successful or invalid. It doesn't exit your testing flow it just print in console your test was successful. If one test fails, other tests will not stop.

```js
describe('test', function (test) {

    test.ok(); // Mark test as successful
    test.ok(false); // Mark test as failed

    test.fail(); // Mark test as failed
    test.fail(false); // Mark test as successful

});
```

Handlers can be also used in any received message.

```js
describe('marco-polo', function (test) {

    test.input('Marco', function (msg) {
        test.ok(msg.data === 'Polo');
    });

    // Or
    test.output = function (msg) {
        test.ok(msg.data === 'Polo');
    };

    test.input('Marco');
});
```

## Errors

To capture error from a single component, use `test.onerror()` function.

```js
// Component
exports.make = function(instance, config) {
		instance.message = function($) {
      instance.throw('a', 'b', 'c', 'd');
    });
}

// Test
describe('test', function (test) {
  test.onerror = function (a, b, c, d) {
    console.log(a, b, c, d);
  };
});
```
## Examples

All example files are stored in `tests` directory with prefix `example`.
