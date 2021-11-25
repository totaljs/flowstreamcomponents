# Flowstream Component Tester

Simple tool for testing Flowstream components.

## Usage

First, you need to initialize testing Flowstream instance by calling imported `tester` function. In callback you will get `builder` that is used to initialize components. First argument of builder is filename of component inside `components` directory (can be changed with `tester.path`). After successfull component initialization, `component` instance is returned in callback of second argument where you can start testing your component.

If your test is longer than 5 seconds, consider extending `tester.autoCloseDuration` value or disabling auto-close feature and manually existing using tester with `builder.done()` method.
You can also test multiple components in one file with `builder.test`. Example is `tests/example-multiple.js` file.

```js
const tester = require("./tester");

tester((builder) => {
  builder.test("counter", (component) => {
    // Test was successful
    component.ok();

    // Show tester results
    builder.done();
  });
});
```

## Test

**Configuration**:

To dynamically change configuration of component use `set` method. After using `set` method, tester will reset configuration to default value from component's file (`exports.config`) and replace ONLY provided properties from first argument. You can also tell tester to NOT trigger `configure` method of component with second argument (`component.set({ ready: true }, true)`).

```js
builder.test("test", (component) => {
  // { mode: 'debug', ready: false }
  component.set({ ready: true });
  // { mode: 'debug', ready: true }
});
```

**Output**:

All outcoming messages from component can be catched with `component.output` delegate. In callback you get [Flowstream message](https://docs.totaljs.com/total4/40844001ni51c/) but it's extended with test handlers (more in **Handlers**)

```js
builder.test("test", (component) => {
  component.output = (msg) => {
    // Check if message is from "output1" index and content of message is "total.js"
    if (msg.index === "output1" && msg.data === "total.js") msg.ok();
    else msg.fail();

    // Shorthand
    msg.ok(msg.index === "output1" && msg.data === "total.js");
  };
});
```

**Inputs**:

All inputs of component are wrapped in `component.inputs` object. With this you can simulate sending data to your component and catch output message of components (Component must have outputs).

```js
builder.test("increment", (component) => {
  const data = { num1: 1, num2: 2 };

  component.inputs.input(data, msg => {
    msg.ok(msg.data === 3);
  };

  // Test is evaluated as successful when ANY message is sent to output
  component.inputs.input(data);
});
```

**Trigger**:

You can manually trigger component's `trigger` method simply with `component.trigger(data)` method.

**Status**:

To change component's status use `component.status(status)`. Current status of component is stored in `component.currentStatus` (Don't mutate this property directly, use `status` method instead). When status is changed (from test but also from component method) delegate `component.onStatus` with new status is triggered.

## Handlers

Handlers are used to tell tester if your testing script was successful or invalid.

```js
builder.test("test", (component) => {
  component.ok(); // Mark test as successful
  component.ok(false); // Mark test as failed

  component.fail(); // Mark test as failed
  component.fail(false); // Mark test as successful
});
```

Handlers can be also used in any received message.

```js
builder.test("test", (component) => {
  component.inputs.input("Marco", (msg) => {
    msg.ok(msg.data === "Polo");
  });

  component.output = (msg) => {
    msg.ok("Polo");
  };
});
```

## Examples

All example files are stored in `tests` directory and has prefix `example`.
