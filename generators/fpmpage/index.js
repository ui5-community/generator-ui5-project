import chalk from "chalk"
import { enableFPM, generateObjectPage, generateListReport, generateCustomPage } from "@sap-ux/fe-fpm-writer"
import fs from "fs"
import Generator from "yeoman-generator"
import prompts from "./prompts.js"
import { generate as serviceWriterGenerate, OdataVersion } from "@sap-ux/odata-service-writer"
import { lookForParentUI5ProjectAndPrompt } from "../helpers.js"

import PlatformGenerator from "../uimodule/platform.js"
import UI5LibsGenerator from "../uimodule/ui5Libs.js"
import LintGenerator from "../uimodule/lint.js"
import QunitGenerator from "../qunit/index.js"
import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

export default class extends Generator {
	static displayName = "Add a page to a Fiori elements FPM application."

	async prompting() {
		this.isComposedCall = this.options.config
		await lookForParentUI5ProjectAndPrompt.call(this, prompts)
	}

	async writing() {
		this.log(chalk.green(`✨ adding a ${this.options.config.pageType} page to ${this.options.config.uimoduleName}`))

		// enable fpm
		const target = this.destinationPath(this.options.config.uimoduleName)
		await enableFPM(target, {
			replaceAppComponent: this.options.config.replaceComponent,
			typescript: this.options.config.enableTypescript || false
		}, this.fs)

		// commit enableFPM mem-fs changes so manifest can be read via real fs
		await this.fs.commit()

		const manifestPath = `${this.options.config.uimoduleName}/webapp/manifest.json`
		const manifestJSON = JSON.parse(fs.readFileSync(this.destinationPath(manifestPath)))
		const targets = manifestJSON["sap.ui5"]?.["routing"]?.["targets"]
		let navigation
		// navigation to new page only relevant if at least one target already exist
		if (Object.keys(targets).length > 0) {
			navigation = {
				sourcePage: this.options.config.navigationSourcePage,
				navEntity: this.options.config.mainEntity,
				navKey: true
			}
		}

		const uimodulePath = this.destinationPath(this.options.config.uimoduleName)

		if (this.options.config.serviceUrl) {
			await serviceWriterGenerate(uimodulePath, {
				url: this.options.config.host,
				client: this.options.config.client,
				path: this.options.config.path,
				version: OdataVersion.v4,
				metadata: this.options.config.metadata,
				localAnnotationsName: "annotation"
			}, this.fs)
		}

		switch (this.options.config.pageType) {
			case "object":
				generateObjectPage(uimodulePath, {
					entity: this.options.config.mainEntity,
					navigation: navigation
				}, this.fs)
				break
			case "list report":
				generateListReport(uimodulePath, {
					entity: this.options.config.mainEntity
				}, this.fs)
				break
			default:
				generateCustomPage(uimodulePath, {
					name: this.options.config.viewName,
					entity: this.options.config.mainEntity,
					navigation: navigation,
					typescript: this.options.config.enableTypescript
				}, this.fs)
				break
		}

		// flush mem-fs to disk so subsequent generators (platform, ui5Libs, lint) read FPM-written files
		if (this.isComposedCall) {
			await this.fs.commit()
		}

	}

}
