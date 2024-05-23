import assert from "assert"
import { platform } from "os"
import path from "path"

export const testCases = [
	{
		platform: "Static webserver",
		newDir: false, // requirement for testing subgeneators after project creation ("standalone")
		runModelSubgenerator: true,
		modelName: "myModel",
		modelType: "OData v4",
		modelUrl: "http://localhost:4004/travel",
		setupProxy: true,
		runViewSubgenerator: true,
		viewName: "NewView",
		setupController: true,
		setupRouteTarget: true

	},
	{
		platform: "Application Router",
		newDir: false, // requirement for testing subgeneators after project creation ("standalone")
		runModelSubgenerator: true,
		modelName: "myModel",
		modelType: "OData v2",
		modelUrl: "http://localhost:4004/travel",
		setupProxy: false,
		runViewSubgenerator: true,
		viewName: "NewView",
		setupController: true,
		setupRouteTarget: false

	},
	{
		platform: "SAP HTML5 Application Repository Service",
		newDir: false, // requirement for testing subgeneators after project creation ("standalone")
		runModelSubgenerator: true,
		modelName: "myModel",
		modelType: "JSON",
		setupProxy: false,
		runViewSubgenerator: true,
		viewName: "NewView",
		setupController: false,
		setupRouteTarget: false
	}

]

export const tests = (testCase, uimodulePath) => {
	it("should have new model in manifest.json", async function() {
		let versionString
		switch (testCase.modelType) {
			case "OData v4":
				versionString = `"odataVersion": "4.0"`
				break
			case "OData v2":
				versionString = `"odataVersion": "2.0"`
				break
			case "JSON":
				versionString = `"type": "JSON"`
				break
		}
		assert.fileContent(
			path.join(uimodulePath, "webapp/manifest.json"),
			versionString
		)
		assert.fileContent(
			path.join(uimodulePath, "webapp/manifest.json"),
			testCase.modelName
		)
	})

	it("should use or not use fiori-tools-proxy correctly", async function() {
		if (testCase.setupProxy) {
			assert.fileContent(
				path.join(uimodulePath, "ui5.yaml"),
				"fiori-tools-proxy"
			)
			assert.fileContent(
				path.join(uimodulePath, "ui5.yaml"),
				"http://localhost:4004"
			)
		} else {
			assert.noFileContent(
				path.join(uimodulePath, "ui5.yaml"),
				"fiori-tools-proxy"
			)
			assert.noFileContent(
				path.join(uimodulePath, "ui5.yaml"),
				"http://localhost:4004"
			)
		}
	})

	it("should have new view", async function() {
		assert.file(path.join(uimodulePath, `webapp/view/${testCase.viewName}.view.xml`))
	})

	it("should or shouldn't have new controller", async function() {
		if (testCase.setupController) {
			assert.file(path.join(uimodulePath, `webapp/controller/${testCase.viewName}.controller.js`))
		} else {
			assert.noFile(path.join(uimodulePath, `webapp/controller/${testCase.viewName}.controller.js`))
		}
	})

	it("should or shouldn't have new route and target in manifest.json", async function() {
		if (testCase.setupRouteTarget) {
			assert.fileContent(
				path.join(uimodulePath, "webapp/manifest.json"),
				`Route${testCase.viewName}`
			)
			assert.fileContent(
				path.join(uimodulePath, "webapp/manifest.json"),
				`Target${testCase.viewName}`
			)
		} else {
			assert.noFileContent(
				path.join(uimodulePath, "webapp/manifest.json"),
				`Route${testCase.viewName}`
			)
			assert.noFileContent(
				path.join(uimodulePath, "webapp/manifest.json"),
				`Target${testCase.viewName}`
			)

		}
	})
}

