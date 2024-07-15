import Opa5 from "sap/ui/test/Opa5";
import I18NText from "sap/ui/test/matchers/I18NText";

const viewName = "<%= viewName %>";

export default class <%= viewName %>Page extends Opa5 {
	//Actions

	//Assertions
	theTitleShouldBeCorrect(this: Opa5) {
		this.waitFor({
			id: "page",
			viewName,
			matchers: new I18NText({
				key: '<%- route === "" ? "title" : route %>',
				propertyName: 'title',
				parameters: '<%- route === "" ? uimoduleName : viewName %>'
			}),
			success: function() {
				Opa5.assert.ok(true, "The page has the correct title");
			},
			errorMessage: "The page does not have the correct title"
		});
	}
}
