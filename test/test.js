import { common } from "./common.js"
import { fileURLToPath } from "url"
import fs from "fs"
import helpers, { result } from "yeoman-test"
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
import {
	testCases as standaloneTestCases,
	tests as standaloneTests
} from "./standalone.js"

const runProjectGenerator = (name, testCases, tests) => {
	describe(name, function() {

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

					await helpers.create(path.join(__dirname, "../generators/project/index.js"))
						.cd(testDir)
						.withAnswers(testCase)
						.run()

					if (testCase.runModelSubgenerator) {
						await result.create(path.join(__dirname, "../generators/model/index.js"))
							.withAnswers(testCase)
							.run()
					}

					if (testCase.runViewSubgenerator) {
						await result.create(path.join(__dirname, "../generators/view/index.js"))
							.withAnswers(testCase)
							.run()
					}

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

runProjectGenerator("Freestyle project generator", freestyleTestCases, freestyleTests)
runProjectGenerator("FPM project generator", fpmTestCases, fpmTests)
runProjectGenerator("Standalone generators", standaloneTestCases, standaloneTests)


