import assert from "assert"
import { execSync } from "child_process"
import path from "path"

export const allProjects = (testCase, testDir, projectId, uimoduleName, uimodulePath) => {
	it("should generate package.json files correctly", async function() {
		const files = [
			path.join(projectId, "package.json"),
			path.join(uimodulePath, "package.json")
		]
		assert.file(files)
	})

	it("should create the xs-app.json in the correct location", async function() {
		const files = []
		if (testCase.platform === "Application Router") {
			files.push(path.join(projectId, "approuter/xs-app.json"))
		} else if (testCase.platform !== "Static webserver") {
			files.push(path.join(uimodulePath, "webapp/xs-app.json"))
		}
		assert.file(files)
	})

	if (testCase.platform === "SAP Build Work Zone, standard edition") {
		it("should add tile name to manifest for SAP Build Work Zone, standard edition", async function() {
			assert.fileContent(
				path.join(uimodulePath, "webapp/manifest.json"),
				`"title": "${uimoduleName}"`
			)
		})
	}

	it("should have correct deployment config in mta.yaml", async function() {
		const mtaYamlPath = path.join(projectId, "mta.yaml")
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
		}
	})

	// it("should generate an installable project", async function() {
	// 	return execSync("npm install --loglevel=error", { cwd: path.join(testDir, projectId) })
	// })

	// it("should generate a buildable project", async function() {
	// 	return execSync("npm run build", { cwd: path.join(testDir, projectId) })
	// })

}

