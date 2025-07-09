import Opa5 from "sap/ui/test/Opa5";
import opaTest from "sap/ui/test/opaQunit";
import <%= viewName %>Page from "./pages/<%= viewName %>";

const onThe<%= viewName %>Page = new <%= viewName %>Page();

Opa5.extendConfig({
	viewNamespace: "<%= uimoduleName %>.view",
	autoWait: true
});

QUnit.module("<%= viewName %>");

opaTest("Should have correct title", function() {
	// Arrangements
	void onThe<%= viewName %>Page.iStartMyUIComponent({
		componentConfig: {
			name: "<%= uimoduleName %>",
			async: true
		}
	});

	// Assertions
	onThe<%= viewName %>Page.theTitleShouldBeCorrect();

	// Cleanup
	void onThe<%= viewName %>Page.iTeardownMyApp();
});
