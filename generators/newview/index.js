import Generator from "yeoman-generator";
import fileaccess from "../../helpers/fileaccess.js";
import utils from "../utils.js";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class extends Generator {
    static displayName = "Add a new view to an existing project";

    prompting() {
        if (this.options.isSubgeneratorCall) {
            this.destinationRoot(this.options.cwd);
            this.options.oneTimeConfig = Object.assign({}, this.config.getAll(), this.options);
            this.options.oneTimeConfig.modulename = this.options.modulename;
            this.options.oneTimeConfig.viewname = this.options.viewname;

            this.options.oneTimeConfig.appId =
                this.options.oneTimeConfig.namespaceUI5 +
                "." +
                (this.options.modulename === "uimodule"
                    ? this.options.oneTimeConfig.projectname
                    : this.options.modulename);
            this.options.oneTimeConfig.appURI =
                this.options.oneTimeConfig.namespaceURI +
                "/" +
                (this.options.modulename === "uimodule"
                    ? this.options.oneTimeConfig.projectname
                    : this.options.modulename);
            return [];
        }

        const modules = this.config.get("uimodules");
        var aPrompt = [
            {
                type: "list",
                name: "modulename",
                message: "To which module do you want to add a view?",
                choices: modules,
                when: utils.isArrayWithMoreThanOneElement(modules)
            },
            {
                type: "input",
                name: "viewname",
                message: "What is the name of the new view?",
                validate: utils.validateAlhpaNumericStartingWithLetter
            },
            {
                type: "confirm",
                name: "createcontroller",
                message: "Would you like to create a corresponding controller as well?"
            },
            {
                type: "confirm",
                name: "addPO",
                message: "Do you want to add an OPA5 page object?",
                default: false
            }
        ];

        if (!this.config.getAll().viewtype) {
            aPrompt = aPrompt.concat([
                {
                    type: "input",
                    name: "projectname",
                    message:
                        "Seems like this project has not been generated with Easy-UI5. Please enter the name your project.",
                    validate: utils.validateAlhpaNumericStartingWithLetter,
                    default: "myui5app"
                },
                {
                    type: "input",
                    name: "namespaceUI5",
                    message: "Please enter the namespace you use currently",
                    validate: (s) => {
                        if (/^[a-zA-Z0-9_\.]*$/g.test(s)) {
                            return true;
                        }
                        return "Please use alpha numeric characters and dots only for the namespace.";
                    },
                    default: "com.myorg"
                },
                {
                    type: "list",
                    name: "viewtype",
                    message: "Which view type do you use?",
                    choices: ["XML", "JS"],
                    default: "XML"
                }
            ]);
        }
        aPrompt = aPrompt.concat([
            {
                type: "confirm",
                name: "addToRoute",
                message: "Would you like to create a route in the manifest?"
            }
        ]);
        return this.prompt(aPrompt).then((answers) => {
            this.options.oneTimeConfig = this.config.getAll();
            this.options.oneTimeConfig.viewname = answers.viewname;
            this.options.oneTimeConfig.createcontroller = answers.createcontroller;
            this.options.oneTimeConfig.addToRoute = answers.addToRoute;
            this.options.oneTimeConfig.modulename = answers.modulename || (!!modules ? modules[0] : "");

            if (answers.projectname) {
                this.options.oneTimeConfig.projectname = answers.projectname;
                this.options.oneTimeConfig.namespaceUI5 = answers.namespaceUI5;
                this.options.oneTimeConfig.viewtype = answers.viewtype;
            }

            this.options.oneTimeConfig.appId =
                this.options.oneTimeConfig.namespaceUI5 +
                "." +
                (this.options.oneTimeConfig.modulename === "uimodule" || !this.options.oneTimeConfig.modulename
                    ? this.options.oneTimeConfig.projectname
                    : answers.modulename);
            this.options.oneTimeConfig.appURI =
                this.options.oneTimeConfig.namespaceURI +
                "/" +
                (this.options.oneTimeConfig.modulename === "uimodule" || !this.options.oneTimeConfig.modulename
                    ? this.options.oneTimeConfig.projectname
                    : answers.modulename);

            if (this.options.oneTimeConfig.addPO) {
                this.composeWith(
                    path.join(__dirname, "../newopa5po"),
                    Object.assign({}, this.options.oneTimeConfig, {
                        isSubgeneratorCall: true
                    })
                );
            }
        });
    }

    async writing() {
        const sViewFileName = "webapp/view/$ViewName.view.$ViewEnding";
        const sControllerFileName = "webapp/controller/$ViewName.controller.js";
        const sViewType = this.options.oneTimeConfig.viewtype;
        const sViewName = this.options.oneTimeConfig.viewname;
        const sModuleName = this.options.oneTimeConfig.modulename;
        this.options.oneTimeConfig.isSubgeneratorCall = this.options.isSubgeneratorCall;

        const bBaseControllerExists = this.fs.exists(sModuleName + "/webapp/controller/BaseController.js");
        var sControllerToExtend = "sap/ui/core/mvc/Controller";
        if (bBaseControllerExists) {
            sControllerToExtend = this.options.oneTimeConfig.appURI + "/controller/BaseController";
        }
        this.options.oneTimeConfig.controllerToExtend = sControllerToExtend;

        var sOrigin = this.templatePath(sViewFileName);
        var sTarget = this.destinationPath(
            (sModuleName ? `${sModuleName}/` : "") +
                sViewFileName.replace(/\$ViewEnding/, sViewType.toLowerCase()).replace(/\$ViewName/, sViewName)
        );
        this.fs.copyTpl(sOrigin, sTarget, this.options.oneTimeConfig);

        if (this.options.oneTimeConfig.createcontroller || this.options.isSubgeneratorCall) {
            sOrigin = this.templatePath(sControllerFileName);
            sTarget = this.destinationPath(
                (sModuleName ? `${sModuleName}/` : "") +
                    sControllerFileName
                        .replace(/\$ViewEnding/, sViewType.toLowerCase())
                        .replace(/\$ViewName/, sViewName)
            );
            this.fs.copyTpl(sOrigin, sTarget, this.options.oneTimeConfig);
        }

        if (this.options.isSubgeneratorCall) {
            return;
        }

        if (this.options.oneTimeConfig.addToRoute) {
            await fileaccess.manipulateJSON.call(this, sModuleName + "/webapp/manifest.json", function (json) {
                const ui5Config = json["sap.ui5"];
                const targetName = "Target" + sViewName;

                ui5Config.routing = ui5Config.routing || {};
                ui5Config.routing.routes = ui5Config.routing.routes || [];
                ui5Config.routing.targets = ui5Config.routing.targets || {};

                ui5Config.routing.routes.push({
                    name: sViewName,
                    pattern: "Route" + sViewName,
                    target: [targetName]
                });
                ui5Config.routing.targets[targetName] = {
                    viewType: sViewType,
                    viewId: sViewName,
                    viewName: sViewName
                };
                return json;
            });
        }

        this.log("Created a new view.");
    }
};
