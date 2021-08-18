sap.ui.define(["<%= appURI %><%=codeUnderTest%>"<% if (useSinonJS) { %>, "sap/ui/thirdparty/sinon-4"<% } %>
], function () {
	"use strict";

	<% if (useSinonJS) { %>var sandbox;

	<% } -%>QUnit.module("<%= suiteName %>", function (<% if (useSinonJS) { %>hooks<% } %>) {<% if (!useSinonJS) { %>

		QUnit.test("<%= testName %>", function (assert) {
			//assert.equal(<actual result>, <expected result>, <optional message>);
			//assert.ok(<actual result>, <optional message>);
			assert.ok(false, "Implement me");
		});<% } -%><% if (useSinonJS) { %>

		hooks.before(function () {
			// Runs before all tests.
			sandbox = sinon.sandbox.create();
		});

		hooks.afterEach(function () {
			// Runs after each test.
			sandbox.restore();
		});

		QUnit.test("<%= testName %>", function (assert) {
			//let spy = sandbox.spy("<placeholder>", "<placeholder>");
			//let stub = sandbox.stub("<placeholder>", "<placeholder>").returns(...);
			//let var mock = sandbox.mock(<placeholder);
			//https://sinonjs.org/
			//assert.equal(<actual result>, <expected result>, <optional message>);
			//assert.ok(<actual result>, <optional message>);
			assert.ok(false, "Implement me");
		});<% } -%><% if (asynchronousOp) { %>

		QUnit.test("Test an asynchrounous operation", function (assert) {
			//https://api.qunitjs.com/assert/async/
			var done = assert.async();
			// trigger asynchrous operation
			setTimeout(() => {
				assert.ok(false, "Implement me");
				done();
			});
		});<% } -%><% if (errorThrows) { %>

		QUnit.test("Test if a callback throws an exception", function (assert) {
			//https://api.qunitjs.com/assert/throws/
			assert.throws(() => {
				"text".reverse();
			}, TypeError, "function should have thrown TypeError");
		});
<% } %>
	});
});