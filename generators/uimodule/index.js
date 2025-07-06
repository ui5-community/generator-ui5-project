import chalk from "chalk"
import dependencies from "../dependencies.js"
import fs from "fs"
import { generate as writeFPMApp } from "@sap-ux/ui5-application-writer"
import { generate as writeFreestyleApp, TemplateType } from "@sap-ux/fiori-freestyle-writer"
import Generator from "yeoman-generator"
import { lookForParentUI5ProjectAndPrompt, addModuleToNPMWorkspaces } from "../helpers.js"
import prompts from "./prompts.js"

import FPMPageGenerator from "../fpmpage/index.js"
import PlatformGenerator from "./platform.js"
import UI5LibsGenerator from "./ui5Libs.js"
import LintGenerator from "./lint.js"
import QunitGenerator from "../qunit/index.js"
import OPA5Generator from "../opa5/index.js"
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

export default class extends Generator {
	static displayName = "Create a new uimodule within an existing OpenUI5/SAPUI5 project"
	static nestedGenerators = ["wdi5"]

	async prompting() {
		// standalone call, this.options.config gets passed from ../project generator
		if (!this.options.config) {
			await lookForParentUI5ProjectAndPrompt.call(this, prompts, false)
		}
	}

	async writing() {
		this.log(chalk.green(`✨ creating new uimodule ${this.options.config.uimoduleName}`))

		addModuleToNPMWorkspaces.call(this, this.options.config.uimoduleName)

		this.destinationRoot(this.destinationPath(this.options.config.uimoduleName))

		const appConfig = {
			app: {
				id: this.options.config.uimoduleName,
				title: this.options.config.tileName || this.options.config.uimoduleName,
				description: `${this.options.config.uimoduleName} description`
			},
			appOptions: {
				loadReuseLibs: true
			},
			package: {
				name: this.options.config.uimoduleName
			},
			ui5: {
				ui5Theme: "sap_horizon",
				version: this.options.config.ui5Libs.includes("OpenUI5") ? dependencies["OpenUI5"] : dependencies["SAPUI5"]
				// TO-DO: think about passing more parameters here to be able to remove some logic from ./ui5Libs
			}
		}

		// pass appConfig to @sap-ux writers
		if (this.options.config.enableFPM) {
			appConfig.appOptions.sapux = this.options.config.enableFioriTools
			appConfig.app.baseComponent = "sap/fe/core/AppComponent"
			if (this.options.config.enableTypescript) {
				appConfig.appOptions.typescript = true
			}
			await writeFPMApp(this.destinationPath(), appConfig, this.fs)
			this.composeWith(
				{
					Generator: FPMPageGenerator,
					path: require.resolve("../fpmpage")
				},
				{ config: this.options.config }
			)
		} else {
			appConfig.template = {
				type: TemplateType.Basic,
				settings: {
					viewName: "MainView"
				}
			}
			await writeFreestyleApp(this.destinationPath(), appConfig, this.fs)

			// compose with these subgenerators from here only for freestyle apps
			// for fpm apps these subgenerators have to be called from within ../fpmpage to ensure they run after the fe-fpm-writer doesn't overwrite them
			this.composeWith(
				{
					Generator: PlatformGenerator,
					path: require.resolve("./platform")
				},
				{
					config: this.options.config
				}
			)
			this.composeWith(
				{
					Generator: UI5LibsGenerator,
					path: require.resolve("./ui5Libs")
				},
				{
					config: this.options.config
				}
			)
			this.composeWith(
				{
					Generator: LintGenerator,
					path: require.resolve("./lint")
				},
				{
					config: this.options.config
				}
			)
			this.composeWith(
				{
					Generator: QunitGenerator,
					path: require.resolve("../qunit")
				},
				{
					config: this.options.config,
					uimoduleName: this.options.config.uimoduleName
				}
			)
			this.composeWith(
				{
					Generator: OPA5Generator,
					path: require.resolve("../opa5")
				},
				{
					config: this.options.config,
					uimoduleName: this.options.config.uimoduleName
				}
			)
		}
	}

	install() {
		// account for use of npm workspaces (node_modules at root of project, not uimodule level)
		if (this.options.config.enableFPM && this.options.config.enableTypescript) {
			const tsconfigJson = JSON.parse(fs.readFileSync(this.destinationPath("tsconfig.json")))
			delete tsconfigJson.compilerOptions.typeRoots
			tsconfigJson.compilerOptions.types = [ "@sapui5/types", "@types/qunit" ]
			// wdi5 generator will add its own tsconfig
			tsconfigJson.exclude = [ "./webapp/test/e2e/**/*" ]
			fs.writeFileSync(this.destinationPath("tsconfig.json"), JSON.stringify(tsconfigJson, null, 4))
		}
	}

	end() {

		// add new uimodule to .yo-rc.json
		this.destinationRoot(this.destinationPath("../"))
		if (!this.config.get("uimodules")) {
			this.config.set("uimodules", [this.options.config.uimoduleName])
		} else {
			this.config.set("uimodules", this.config.get("uimodules").concat(this.options.config.uimoduleName))
		}
		// this.config.delete("uimoduleName")
		this.config.delete("tileName")

		const inProjectDirOrDeeper = process.cwd().includes(this.options.config.projectId) || fs.existsSync(".yo-rc.json")
		const newPath = inProjectDirOrDeeper ? "" : `cd ${this.options.config.projectId} && `
		this.log(`${chalk.green(`You can start your new uimodule by running`)} ${chalk.blue(`${newPath}npm run start:${this.options.config.uimoduleName}`)}${chalk.green(`${inProjectDirOrDeeper ? " from the project root." : "."}`)}`)

	}

}
