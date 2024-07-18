import assert from "assert"
import { execSync } from "child_process"
import path from "path"

export const allProjects = (testCase, testDir, projectId, uimoduleName, uimodulePath) => {

	console.log()

	it("should generate package.json files correctly", async function() {
		const files = [
			path.join(projectId, "package.json"),
			path.join(uimodulePath, "package.json")
		]
		assert.file(files)
	})

	if (testCase.platform !== "SAP NetWeaver") {
		it("should create the xs-app.json in the correct location", async function() {
			const files = []
			if (testCase.platform === "Application Router") {
				files.push(path.join(projectId, "approuter/xs-app.json"))
			} else if (testCase.platform !== "Static webserver") {
				files.push(path.join(uimodulePath, "webapp/xs-app.json"))
			}
			assert.file(files)
		})
	}

	if (testCase.platform === "SAP Build Work Zone, standard edition") {
		it("should add tile name to manifest for SAP Build Work Zone, standard edition", async function() {
			assert.fileContent(
				path.join(uimodulePath, "webapp/manifest.json"),
				`"title": "${uimoduleName}"`
			)
		})

		it("should use the preview-middleware for the flpSandbox.html", async function() {
			assert.fileContent(
				path.join(uimodulePath, "ui5.yaml"),
				"preview-middleware"
			)
			assert.fileContent(
				path.join(uimodulePath, "ui5.yaml"),
				"/test/flpSandbox.html"
			)
		})
	}

	it("should have correct deployment config in mta.yaml or ui5.yaml", async function() {
		const mtaYamlPath = path.join(projectId, "mta.yaml")
		const ui5DeployYamlPath = path.join(uimodulePath, "ui5-deploy.yaml")
		switch (testCase.platform) {
			case "Static webserver":
				assert.fileContent(mtaYamlPath, "type: staticfile")
				assert.noFileContent(
					path.join(uimodulePath, "ui5.yaml"),
					"ui5-task-zipper"
				)
				break
			case "Application Router":
				assert.fileContent(mtaYamlPath, `${projectId}-approuter`)
				assert.noFileContent(
					path.join(uimodulePath, "ui5.yaml"),
					"ui5-task-zipper"
				)
				break
			case "SAP HTML5 Application Repository Service" || "SAP Build Work Zone, standard edition":
				assert.fileContent(mtaYamlPath, `${projectId}-destination-content`)
				assert.fileContent(
					path.join(uimodulePath, "ui5.yaml"),
					"ui5-task-zipper"
				)
				break
			case "SAP NetWeaver":
				assert.fileContent(ui5DeployYamlPath, "deploy-to-abap")
				assert.noFileContent(
					path.join(uimodulePath, "ui5.yaml"),
					"ui5-task-zipper"
				)
				break
		}
	})

	it("should use eslint", async function() {
		assert.fileContent(
			path.join(uimodulePath, "package.json"),
			"\"lint\": \"eslint ./\""
		)
		assert.file(path.join(uimodulePath, ".eslintrc"))
	})

	it("should use @ui5/linter", async function() {
		assert.fileContent(
			path.join(uimodulePath, "package.json"),
			"\"ui5lint\": \"ui5lint\""
		)
		assert.fileContent(
			path.join(uimodulePath, "package.json"),
			"@ui5/linter"
		)
	})

	it("should have basic qunit configuration", async function() {
		assert.fileContent(
			path.join(uimodulePath, "ui5.yaml"),
			"preview-middleware"
		)
		assert.fileContent(
			path.join(uimodulePath, "ui5.yaml"),
			"- framework: Qunit"
		)
	})

	it("should have qunit test", async function() {
		assert.fileContent(
			path.join(uimodulePath, "webapp/test/unit/FirstTest.js"),
			"QUnit"
		)
	})

	if (!testCase.enableFPM) {
		it("should have basic opa5 configuration", async function() {
			assert.fileContent(
				path.join(uimodulePath, "ui5.yaml"),
				"preview-middleware"
			)
			assert.fileContent(
				path.join(uimodulePath, "ui5.yaml"),
				"- framework: OPA5"
			)
		})

		it("should have opa5 journey and page object", async function() {
			assert.fileContent(
				path.join(uimodulePath, "webapp/test/integration/FirstJourney.js"),
				"Opa5"
			)
			assert.file(path.join(uimodulePath, "webapp/test/integration/pages"))
		})
	}

	it("should generate an installable project", async function() {
		return execSync("npm install --loglevel=error", { cwd: path.join(testDir, projectId) })
	})

	if (testCase.platform !== "SAP NetWeaver") {
		it("should generate a buildable project", async function() {
			return execSync("npm run build", { cwd: path.join(testDir, projectId) })
		})
	}

}

