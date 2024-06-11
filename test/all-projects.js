import assert from "assert"
import { execSync } from "child_process"
import fs from "fs"
import path from "path"

export const allProjects = (testCase, testDir, projectId, uimoduleName, uimodulePath) => {
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
	}

	it("should have correct deployment config in mta.yaml or ui5.yaml", async function() {
		const mtaYamlPath = path.join(projectId, "mta.yaml")
		const ui5YamlPath = path.join(uimodulePath, "ui5.yaml")
		switch (testCase.platform) {
			case "Static webserver":
				assert.fileContent(mtaYamlPath, "type: staticfile")
				break
			case "Application Router":
				assert.fileContent(mtaYamlPath, `${projectId}-approuter`)
				break
			case "SAP HTML5 Application Repository Service" || "SAP Build Work Zone, standard edition":
				assert.fileContent(mtaYamlPath, `${projectId}-destination-content`)
				break
			case "SAP NetWeaver":
				assert.fileContent(ui5YamlPath, "ui5-task-nwabap-deployer")
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
		const files = []
		files.push(path.join(uimodulePath, "webapp/test/unit/unitTests.qunit.html"))
		files.push(path.join(uimodulePath, "webapp/test/unit/unitTests.qunit.js"))
		files.push(path.join(uimodulePath, "webapp/test/unit/allTests.js"))
		assert.file(files)
	})

	it("should have actual qunit tests only if implementation exists as well", async function() {
		const implementationExists = fs.existsSync(path.join(uimodulePath, "webapp/model/models.js"))
		if (implementationExists) {
			assert.file(path.join(uimodulePath, "webapp/test/unit/model/models.js"))
			assert.fileContent(
				path.join(uimodulePath, "webapp/test/unit/allTests.js"),
				"./model/models"
			)
		} else {
			assert.noFile(path.join(uimodulePath, "webapp/test/unit/model/models.js"))
			assert.noFileContent(
				path.join(uimodulePath, "webapp/test/unit/allTests.js"),
				"./model/models"
			)
		}
	})

	// it("should generate an installable project", async function() {
	// 	return execSync("npm install --loglevel=error", { cwd: path.join(testDir, projectId) })
	// })

	// if (testCase.platform !== "SAP NetWeaver") {
	// 	it("should generate a buildable project", async function() {
	// 		return execSync("npm run build", { cwd: path.join(testDir, projectId) })
	// 	})
	// }

}

