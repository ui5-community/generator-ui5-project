const Generator = require("yeoman-generator");
const jsUtils = require("../../helpers/jsutils");
const path = require("path");
const glob = require("glob");

module.exports = class extends Generator {
    static displayName = "Add a new QUnit test suite to an existing project";

    prompting() {
        let aPrompt = [];
        this.options.oneTimeConfig = Object.assign({}, this.config.getAll(), this.options);

        if (this.options.isSubgeneratorCall) {
            this.options.oneTimeConfig.projectname = this.options.projectname;
            this.options.oneTimeConfig.namespaceUI5Input = this.options.namespaceUI5Input;
            this.options.oneTimeConfig.modulename = this.options.modulename;
            this.options.oneTimeConfig.ui5libs = this.options.ui5libs;

            var appName =
                !this.options.oneTimeConfig.modulename || this.options.modulename === "uimodule"
                    ? this.options.projectname
                    : this.options.modulename;
            this.options.oneTimeConfig.namespaceURI = this.options.namespaceUI5Input.split(".").join("/");
            this.options.oneTimeConfig.appId = this.options.namespaceUI5Input + "." + appName;
            this.options.oneTimeConfig.appURI = this.options.namespaceURI + "/" + appName;
            this.options.oneTimeConfig.title = appName;

            this.options.oneTimeConfig.addModule = true;
            return;
        } else {
            if (!this.config.getAll().viewtype) {
                if (!this.options.oneTimeConfig.projectname) {
                    aPrompt = aPrompt.concat([
                        {
                            type: "input",
                            name: "projectname",
                            message:
                                "Seems like this project has not been generated with Easy-UI5. Please enter the name of your project.",
                            validate: (s) => {
                                if (/^[a-zA-Z][a-zA-Z0-9\.]*$/g.test(s)) {
                                    return true;
                                }
                                return "Please use only alpha numeric characters and dots for the project name.";
                            },
                            default: "myUI5App"
                        }
                    ]);

                    if (!this.options.oneTimeConfig.namespaceUI5Input) {
                        aPrompt = aPrompt.concat([
                            {
                                type: "input",
                                name: "namespaceUI5Input",
                                message: "Please enter the namespace you use currently",
                                validate: (s) => {
                                    if (/^[a-zA-Z0-9_\.]*$/g.test(s)) {
                                        return true;
                                    }
                                    return "Please use only alpha numeric characters, dots and underscores for the namespace.";
                                },
                                default: "com.myorg"
                            }
                        ]);
                    }
                }
            }
            if (!this.options.oneTimeConfig.ui5libs) {
                aPrompt = aPrompt.concat([
                    {
                        type: "list",
                        name: "ui5libs",
                        message: "Where should your UI5 libs be served from?",
                        choices: (props) => {
                            return props.platform !== "SAP Launchpad service"
                                ? [
                                      "Content delivery network (OpenUI5)",
                                      "Content delivery network (SAPUI5)",
                                      "Local resources"
                                  ]
                                : ["Content delivery network (SAPUI5)"];
                        },
                        default: (props) => {
                            return props.platform !== "SAP Launchpad service"
                                ? "Content delivery network (OpenUI5)"
                                : "Content delivery network (SAPUI5)";
                        }
                    }
                ]);
            }

            const modules = this.config.get("uimodules") || [];
            if (modules.length) {
                aPrompt.push({
                    type: "list",
                    name: "modulename",
                    message: "To which module do you want to add QUnit tests?",
                    choices: modules,
                    when: modules.length
                });
            }
        }

        aPrompt = aPrompt.concat({
            type: "confirm",
            name: "addTest",
            message: "Do you want to add a test?",
            default: true
        });

        return this.prompt(aPrompt).then((answers) => {
            for (var key in answers) {
                this.options.oneTimeConfig[key] = answers[key];
            }

            var appName =
                !this.options.oneTimeConfig.modulename || this.options.oneTimeConfig.modulename === "uimodule"
                    ? this.options.oneTimeConfig.projectname
                    : this.options.oneTimeConfig.modulename;
            this.options.oneTimeConfig.namespaceUI5Input =
                this.options.oneTimeConfig.namespaceUI5Input || this.options.oneTimeConfig.namespaceUI5;
            this.options.oneTimeConfig.namespaceURI = this.options.oneTimeConfig.namespaceUI5Input.split(".").join("/");
            this.options.oneTimeConfig.appId = this.options.oneTimeConfig.namespaceUI5Input + "." + appName;
            this.options.oneTimeConfig.appURI = this.options.oneTimeConfig.namespaceURI + "/" + appName;
            this.options.oneTimeConfig.title = appName;
        });
    }

    main() {
        if (this.options.oneTimeConfig.addTest) {
            this.composeWith(
                require.resolve("../newqunittest"),
                Object.assign({}, this.options.oneTimeConfig, {
                    isSubgeneratorCall: true
                })
            );
        }
    }

    async writing() {
        const qunit = {
            projectname: this.options.oneTimeConfig.projectname,
            namespaceUI5Input: this.options.oneTimeConfig.namespaceUI5Input,
            ui5libs: this.options.oneTimeConfig.ui5libs
        };
        this.config.set(qunit);

        // get values from subgeneratos
        const tests = jsUtils.removeDuplicates(this.config.get("qunittests")) || [];
        this.config.set("qunittests", tests);
        this.options.oneTimeConfig.qunittests = tests;

        const sModule =
            (this.options.oneTimeConfig.modulename ? this.options.oneTimeConfig.modulename + "/" : "") + "webapp/";

        let sPrefix;
        switch (this.options.oneTimeConfig.ui5libs) {
            case "Content delivery network (OpenUI5)":
                sPrefix = "https://openui5.hana.ondemand.com/";
                break;
            case "Content delivery network (SAPUI5)":
                sPrefix = "https://sapui5.hana.ondemand.com/";
                break;
            default:
                sPrefix = "../../";
        }
        this.options.oneTimeConfig.ui5libsprefix = sPrefix;
        this.sourceRoot(path.join(__dirname, "templates"));
        glob.sync("**", {
            cwd: this.sourceRoot(),
            nodir: true
        }).forEach((file) => {
            this.fs.copyTpl(this.templatePath(file), this.destinationPath(sModule + file), this.options.oneTimeConfig);
        });
    }
};
