import assert from "assert"
import path from "path"

export const testCases = [
	{
		additionalSubgenerators: ["model", "view", "customcontrol", "qunit", "opa5", "cap", "uimodule"], // run uimodule last to avoid prompts to select between uimodules
		platform: "Static webserver",
		newDir: false, // requirement for testing subgenerators after project generation
		modelName: "myModel",
		modelType: "OData v4",
		modelUrl: "http://localhost:4004/travel",
		setupProxy: true,
		viewName: "NewView",
		setupController: true,
		setupRouteTarget: true,
		controlName: "CustomControl",
		testName: "Second",
		capName: "server",
		capCapabilities: ["postgres", "mta", "xsuaa", "data", "tiny-sample"]
	},
	{
		additionalSubgenerators: ["model", "view", "customcontrol", "qunit", "opa5", "cap", "uimodule"], // run uimodule last to avoid prompts to select between uimodules
		platform: "Application Router",
		newDir: false, // requirement for testing subgenerators after project generation
		modelName: "myModel",
		modelType: "OData v2",
		modelUrl: "http://localhost:4004/travel",
		setupProxy: false,
		viewName: "NewView",
		setupController: true,
		setupRouteTarget: false,
		controlName: "CustomControl",
		testName: "Second",
		capName: "server",
		capCapabilities: ["postgres", "mta", "xsuaa", "data", "tiny-sample"]
	},
	{
		additionalSubgenerators: ["model", "view", "customcontrol", "qunit", "opa5", "cap", "uimodule"], // run uimodule last to avoid prompts to select between uimodules
		platform: "SAP HTML5 Application Repository Service",
		newDir: false, // requirement for testing subgenerators after project generation
		modelName: "myModel",
		modelType: "JSON",
		setupProxy: false,
		viewName: "NewView",
		setupController: false,
		setupRouteTarget: false,
		controlName: "CustomControl",
		testName: "Second",
		capName: "server",
		capCapabilities: ["postgres", "mta", "xsuaa", "data", "tiny-sample"]
	},
	{
		additionalSubgenerators: ["model", "view", "customcontrol", "qunit", "opa5", "cap", "uimodule"], // run uimodule last to avoid prompts to select between uimodules
		platform: "SAP NetWeaver",
		newDir: false, // requirement for testing subgenerators after project generation
		modelName: "myModel",
		modelType: "JSON",
		setupProxy: false,
		viewName: "NewView",
		setupController: false,
		setupRouteTarget: false,
		controlName: "CustomControl",
		testName: "Second",
		capName: "server" // include it and make sure it doesn't execute with SAP NetWeaver	
	}
]

export const tests = (testCase, uimodulePath, uimodulePath2) => {
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

	it("should or shouldn't proxy to service correctly", async function() {
		if (testCase.setupProxy || (testCase.capName && testCase.platform !== "SAP NetWeaver")) {
			assert.fileContent(
				path.join(uimodulePath, "ui5.yaml"),
				"http://localhost:4004"
			)
		} else {
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

	it("should have new custom control", async function() {
		assert.file(path.join(uimodulePath, `webapp/control/${testCase.controlName}.js`))
	})

	it("should have new qunit test", async function() {
		const fileEnding = testCase.enableTypescript ? "ts" : "js"
		assert.file(path.join(uimodulePath, `webapp/test/unit/${testCase.testName}Test.${fileEnding}`))
	})

	it("should have new opa5 journey and page object", async function() {
		const fileEnding = testCase.enableTypescript ? "ts" : "js"
		assert.file(path.join(uimodulePath, `webapp/test/integration/${testCase.testName}Journey.${fileEnding}`))
		assert.file(path.join(uimodulePath, `webapp/test/integration/pages/${testCase.viewName}.page.${fileEnding}`))
	})


	// no cap module for SAP NetWeaver
	if (testCase.platform !== "SAP NetWeaver") {
		it("should have new cap module", async function() {
			assert.file(path.join(uimodulePath, `../${testCase.capName}`))
		})

		it("should have cap artifacts in mta.yaml", async function() {
			assert.fileContent(
				path.join(uimodulePath, "../mta.yaml"),
				"server-postgres"
			)
			assert.fileContent(
				path.join(uimodulePath, "../mta.yaml"),
				"server-postgres-deployer"
			)
			assert.fileContent(
				path.join(uimodulePath, "../mta.yaml"),
				"server-srv"
			)
		})

		// route and destination onyl if approuter (standalone or managed) in place
		if (!["Static webserver", "SAP NetWeaver"].includes(testCase.platform)) {
			it("should have the destination in mta.yaml", async function() {
				assert.fileContent(
					path.join(uimodulePath, "../mta.yaml"),
					`- Name: ${testCase.capName}`
				)
				assert.fileContent(
					path.join(uimodulePath, "../mta.yaml"),
					"URL: ~{srv-api/srv-url}"
				)
			})

			it("should have the route set up in xs-app.json", async function() {
				let xsappJsonPath
				switch (testCase.platform) {
					case "Application Router":
						xsappJsonPath = path.join(uimodulePath, "../approuter/xs-app.json")
						break

					case "SAP HTML5 Application Repository Service":
					case "SAP Build Work Zone, standard edition":
						xsappJsonPath = path.join(uimodulePath, "/webapp/xs-app.json")
						break
				}
				assert.fileContent(
					xsappJsonPath,
					`"destination": "${testCase.capName}"`
				)
			})
		}
	}


	it("should have new uimodule", async function() {
		assert.file(uimodulePath2)
	})
}

