import assert from "yeoman-assert"
import path from "path"

export const testCases = [
	{
		platform: "Static webserver",
		enableFPM: true,
		serviceUrl: "http://localhost:4004/travel",
		mainEntity: "BookedFlights",
		enableTypescript: false
	},
	{
		platform: "Application Router",
		enableFPM: true,
		serviceUrl: "http://localhost:4004/travel",
		mainEntity: "BookedFlights",
		enableTypescript: true
	},
	{
		platform: "SAP HTML5 Application Repository Service",
		enableFPM: true,
		serviceUrl: "http://localhost:4004/travel",
		mainEntity: "BookedFlights",
		enableTypescript: true
	},
	{
		platform: "SAP Build Work Zone, standard edition",
		enableFPM: true,
		serviceUrl: "http://localhost:4004/travel",
		mainEntity: "BookedFlights",
		enableTypescript: true
	}
]

export const tests = (testCase, uimodulePath) => {
	it("should generate neccessary ui5 files", async function() {
		const files = [
			path.join(uimodulePath, "ui5.yaml"),
			path.join(uimodulePath, "webapp/manifest.json"),
			path.join(uimodulePath, "webapp/index.html"),
			path.join(uimodulePath, "webapp/ext/main/Main.view.xml")
		]
		if (testCase.enableTypescript) {
			files.push(path.join(uimodulePath, "webapp/ext/main/Main.controller.ts"))
		} else {
			files.push(path.join(uimodulePath, "webapp/ext/main/Main.controller.js"))
		}
		assert.file(files)
	})

	it("should alway consume SAPUI5 from local resources", async function() {
		assert.noFileContent(
			path.join(uimodulePath, "webapp/index.html"),
			"https://ui5.sap.com/"
		)
		assert.fileContent(
			path.join(uimodulePath, "ui5.yaml"),
			"SAPUI5"
		)
	})

	it("should set up a proxy to service url", async function() {
		assert.fileContent(
			path.join(uimodulePath, "ui5.yaml"),
			"fiori-tools-proxy"
		)
		assert.fileContent(
			path.join(uimodulePath, "ui5.yaml"),
			new URL(testCase.serviceUrl).origin
		)
	})

	it("should generate annotation file", async function() {
		assert.file(path.join(uimodulePath, "webapp/annotations/annotation.xml"))
	})

	it("should use Fiori elements components", async function() {
		assert.fileContent(
			path.join(uimodulePath, "webapp/manifest.json"),
			"sap.fe.core.fpm"
		)
		if (testCase.enableTypescript) {
			assert.fileContent(
				path.join(uimodulePath, "webapp/Component.ts"),
				"sap/fe/core/"
			)
		} else {
			assert.fileContent(
				path.join(uimodulePath, "webapp/Component.js"),
				"sap/fe/core/"
			)
		}
	})

	it("should have Fiori tools enabled", async function() {
		assert.fileContent(
			path.join(uimodulePath, "package.json"),
			"sapux"
		)
		assert.fileContent(
			path.join(uimodulePath, "package.json"),
			"@sap/ux-specification"
		)
	})

	if (testCase.enableTypescript) {
		it("should have typescript configured correctly", async function() {
			assert.file(path.join(uimodulePath, "tsconfig.json"))
			assert.file(path.join(uimodulePath, ".babelrc.json"))
			assert.fileContent(
				path.join(uimodulePath, "tsconfig.json"),
				"../node_modules/@types"
			)
			assert.fileContent(
				path.join(uimodulePath, "tsconfig.json"),
				"../node_modules/@sapui5/ts-types-esm"
			)
			assert.fileContent(
				path.join(uimodulePath, "package.json"),
				"ui5-tooling-transpile"
			)
			assert.fileContent(
				path.join(uimodulePath, "package.json"),
				"ts-typecheck"
			)
		})
	}

}
