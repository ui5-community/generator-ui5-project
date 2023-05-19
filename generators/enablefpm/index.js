import Generator from "yeoman-generator";
import fpmWriter from "@sap-ux/fe-fpm-writer";
import utils from "../utils.js";
import { UI5Config } from "@sap-ux/ui5-config";
import path from "path";

/**
 * UI5 task and middleware configurations required for TypeScript projects
 */
const ui5TSSupport = {
    task: {
        name: 'ui5-tooling-transpile-task',
        afterTask: 'replaceVersion',
        configuration: {
            debug: true,
            removeConsoleStatements: true,
            transpileAsync: true,
            transpileTypeScript: true
        }
    },
    middleware: {
        name: 'ui5-tooling-transpile-middleware',
        afterMiddleware: 'compression',
        configuration: {
            debug: true,
            transpileAsync: true,
            transpileTypeScript: true
        }
    }
};

export default class extends Generator {
    static displayName = "Enable the Fiori elements flexible program model";

    async prompting() {
        const modules = this.config.get("uimodules") || [];
        this.answers = await this.prompt([
            {
                type: "list",
                name: "moduleName",
                message: "For which module do you want to enable FPM?",
                choices: modules,
                when: utils.isArrayWithMoreThanOneElement(modules)
            },
            {
                type: "confirm",
                name: "replaceComponent",
                message: "Do you want to replace your App Component?",
                default: false,
                when: !this.options.isSubgeneratorCall
            }]);

        this.config.set(this.answers);
    }

    async writing() {
        const typescript = this.config.get("enableTypescript") || false;
        const target = this.destinationPath(this.options.modulename || this.answers.moduleName || '');
        fpmWriter.enableFPM(target, {
                replaceAppComponent: this.answers.replaceAppComponent, typescript 
            }, this.fs
        );
        if (typescript) {
            const ui5Yaml = await UI5Config.newInstance(this.fs.read(path.join(target, 'ui5.yaml')));
            ui5Yaml.addCustomMiddleware([ui5TSSupport.middleware]);
            ui5Yaml.addCustomTasks([ui5TSSupport.task]);
            this.fs.write(path.join(target, 'ui5.yaml'), ui5Yaml.toString());
        }
    }
}