import { allProjects } from "./all-projects.js"
import { fileURLToPath } from "url"
import fs from "fs"
import helpers, { result } from "yeoman-test"
import nock from "nock"
import path, { dirname } from "path"
import {
	testCases as freestyleTestCases,
	tests as freestyleTests
} from "./freestyle-projects.js"
import {
	testCases as fpmTestCases,
	tests as fpmTests
} from "./fpm-projects.js"
import {
	testCases as afterProjectGenerationTestCases,
	tests as afterProjectGenerationTests
} from "./after-project-generation.js"

const runProjectGenerator = (name, testCases, tests) => {
	describe(name, function() {

		const __dirname = dirname(fileURLToPath(import.meta.url))
		const testDir = path.join(__dirname, "../test-output")

		testCases.forEach((testCase) => {
			describe(testCase.platform, function() {

				const projectId = testCase.newDir === false ? "" : "com.myorg.myui5project"
				const uimoduleName = "myui5app"
				const uimodulePath = path.join(projectId, uimoduleName)
				const uimoduleName2 = "myui5app2"
				const uimodulePath2 = path.join(projectId, uimoduleName2)

				this.timeout(200000)

				if (testCase.serviceUrl) {
					const serviceUrl = new URL(testCase.serviceUrl)
					nock(serviceUrl.origin)
						.get(`${serviceUrl.pathname}/$metadata`)
						.replyWithFile(200, path.join(__dirname, "metadata.xml"))
						.persist(true)
				}

				before(async function() {
					if (fs.existsSync(testDir)) {
						fs.rmSync(testDir, { recursive: true, force: true })
					}
					fs.mkdirSync(testDir)

					await helpers.create(path.join(__dirname, "../generators/project/index.js"))
						.cd(testDir)
						.withAnswers(testCase)
						.run()

					if (testCase.additionalSubgenerators) {
						for (const subgenerator of testCase.additionalSubgenerators) {
							await result.create(path.join(__dirname, `../generators/${subgenerator}/index.js`))
								.withAnswers(testCase)
								.run()
						}
					}
				})

				after(async function() {
					fs.rmSync(testDir, { recursive: true, force: true })
				})

				allProjects(testCase, testDir, projectId, uimoduleName, uimodulePath)
				tests(testCase, uimodulePath, uimodulePath2)
			})

		})
	})

}

runProjectGenerator("Freestyle project generator", freestyleTestCases, freestyleTests)
runProjectGenerator("FPM project generator", fpmTestCases, fpmTests)
runProjectGenerator("Subgenerators after project generation", afterProjectGenerationTestCases, afterProjectGenerationTests)


