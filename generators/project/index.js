import chalk from "chalk"
import dependencies from "../dependencies.js"
import Generator from "yeoman-generator"
import prompts from "./prompts.js"

import PlatformGenerator from "./platform.js"
import UimoduleGenerator from "../uimodule/index.js"

import { createRequire } from "node:module"
const require = createRequire(import.meta.url)

export default class extends Generator {
	static displayName = "Create a new OpenUI5/SAPUI5 project containing one ore more uimodules"
	static nestedGenerators = ["wdi5"]

	async prompting() {
		this.answers = {}
		await prompts.call(this)
	}

	async writing() {
		this.answers.projectId = `${this.answers.namespaceUI5}.${this.answers.projectName}` // e.g. com.myorg.myui5project
		this.log(chalk.green(`✨ creating new project ${this.answers.projectId}`))

		if (this.answers.newDir) {
			this.destinationRoot(this.destinationPath(this.answers.projectId))

			// required so that yeoman detects changes to package.json
			// and runs install automatically if newDir === true
			// see https://github.com/yeoman/environment/issues/309
			// this.env.cwd = this.destinationPath()
			// this.env.options.nodePackageManager = "npm"
		} else {
			this.destinationRoot(this.destinationPath())
		}
		this.config.set(this.answers) // do this after changing the directory so that .yo-rc.json is created in the correct place

		this.fs.copyTpl(
			this.templatePath("package.json"),
			this.destinationPath("package.json"),
			{
				title: this.config.get("projectId"),
				mbtVersion: dependencies["mbt"]
			}
		)

		this.fs.copyTpl(
			this.templatePath("README.md"),
			this.destinationPath("README.md"),
			{ title: this.config.get("projectId") }
		)

		if (this.config.get("initRepo")) {
			this.fs.copyTpl(
				this.templatePath(".gitignore"),
				this.destinationPath(".gitignore")
			)
		}

		this.composeWith(
			{
				Generator: UimoduleGenerator,
				path: require.resolve("../uimodule")
			},
			{
				config: this.config.getAll()
			}
		)
		this.composeWith(
			{
				Generator: PlatformGenerator,
				path: require.resolve("./platform.js")
			},
			{}
		)
	}

	async end() {
		if (this.config.get("initRepo")) {
			this.spawnSync("git", ["init", "--quiet", "-b", "main"], {
				cwd: this.destinationPath()
			})
			this.spawnSync("git", ["add", "."], {
				cwd: this.destinationPath()
			})
			this.spawnSync(
				"git",
				["commit", "--quiet", "--allow-empty", "-m", "Initialize repository with easy-ui5"],
				{
					cwd: this.destinationPath()
				}
			)
		}
	}

}
