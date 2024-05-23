import { common } from "./common.js"
import { fileURLToPath } from "url"
import fs from "fs"
import helpers from "yeoman-test"
import nock from "nock"
import path, { dirname } from "path"
import {
	testCases as freestyleTestCases,
	tests as freestyleTests
} from "./freestyle.js"
import {
	testCases as fpmTestCases,
	tests as fpmTests
} from "./fpm.js"

const runProjectGenerator = (name, testCases, tests) => {
	describe(`${name} project generator`, function() {

		const __dirname = dirname(fileURLToPath(import.meta.url))
		const testDir = path.join(__dirname, "../test-output")

		testCases.forEach((testCase) => {
			describe(testCase.platform, function() {

				const projectId = testCase.newDir === false ? "" : "com.myorg.myui5project"
				const uimoduleName = "myui5app"
				const uimodulePath = path.join(projectId, uimoduleName)

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

					await helpers.run(path.join(__dirname, "../generators/project/index.js"))
						.cd(testDir)
						.withAnswers(testCase)
				})

				after(async function() {
					fs.rmSync(testDir, { recursive: true, force: true })
				})

				common(testCase, testDir, projectId, uimoduleName, uimodulePath)
				tests(testCase, uimodulePath)
			})

		})
	})

}

runProjectGenerator("Freestyle", freestyleTestCases, freestyleTests)
runProjectGenerator("FPM", fpmTestCases, fpmTests)


