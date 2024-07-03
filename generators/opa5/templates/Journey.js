sap.ui.define([
	"sap/ui/test/Opa5",
	"sap/ui/test/opaQunit",
	"./pages/<%= viewName %>"
], function(Opa5, opaTest) {
	"use strict";

	Opa5.extendConfig({
		viewNamespace: "<%= uimoduleName %>.view",
		autoWait: true
	});

	QUnit.module("<%= viewName %>");

	opaTest("Should have correct title", function(Given, When, Then) {
		// Arrangements
		Given.iStartMyUIComponent({
			componentConfig: {
				name: "<%= uimoduleName %>",
				async: true
			},
			hash: "<%= route %>"
		});

		// Assertions
		Then.onThe<%= viewName %>Page.theTitleShouldBeCorrect();

		// Cleanup
		Then.iTeardownMyApp();
	});

});
