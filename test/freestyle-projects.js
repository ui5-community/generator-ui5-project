import assert from "assert"
import path from "path"

export const testCases = [
	{
		platform: "Static webserver"
	},
	{
		platform: "Static webserver",
		newDir: false
	},
	{
		platform: "Static webserver",
		ui5Libs: "Local resources (OpenUI5)"
	},
	{
		platform: "Static webserver",
		ui5Libs: "Content delivery network (SAPUI5)"
	},
	{
		platform: "Static webserver",
		ui5Libs: "Content delivery network (OpenUI5)"
	},
	{
		platform: "Application Router"
	},
	{
		platform: "SAP HTML5 Application Repository Service"
	},
	{
		platform: "SAP Build Work Zone, standard edition"
	},
	{
		platform: "SAP NetWeaver"
	}
]

export const tests = (testCase, uimodulePath) => {
	it("should generate neccessary ui5 files", async function() {
		const files = [
			path.join(uimodulePath, "ui5.yaml"),
			path.join(uimodulePath, "webapp/manifest.json"),
			path.join(uimodulePath, "webapp/index.html"),
			path.join(uimodulePath, "webapp/view/MainView.view.xml"),
			path.join(uimodulePath, "webapp/controller/MainView.controller.js")
		]
		assert.file(files)
	})

	it("should consume the correct ui5 library", async function() {
		switch (testCase.ui5Libs) {
			case "Content delivery network (OpenUI5)":
				assert.fileContent(
					path.join(uimodulePath, "webapp/index.html"),
					"https://sdk.openui5.org"
				)
				assert.fileContent(
					path.join(uimodulePath, "ui5.yaml"),
					"https://sdk.openui5.org"
				)
				break
			case "Content delivery network (SAPUI5)":
				assert.fileContent(
					path.join(uimodulePath, "webapp/index.html"),
					"https://ui5.sap.com"
				)
				assert.fileContent(
					path.join(uimodulePath, "ui5.yaml"),
					"https://ui5.sap.com"
				)
				break
			case "Local resources (OpenUI5)":
				assert.noFileContent(
					path.join(uimodulePath, "webapp/index.html"),
					"https://sdk.openui5.org"
				)
				assert.fileContent(
					path.join(uimodulePath, "ui5.yaml"),
					"OpenUI5"
				)
				break
			case "Local resources (SAPUI5)":
				assert.noFileContent(
					path.join(uimodulePath, "webapp/index.html"),
					"https://ui5.sap.com"
				)
				assert.fileContent(
					path.join(uimodulePath, "ui5.yaml"),
					"SAPUI5"
				)
		}
	})

	it("should use eslint", async function() {
		assert.file(path.join(uimodulePath, ".eslintrc"))
	})
}

