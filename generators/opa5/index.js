const Generator = require("yeoman-generator");
const path = require("path");
const glob = require("glob");

module.exports = class extends Generator {
    static displayName = "Add a new OPA5 test suite to an existing project";

    prompting() {
        let aPrompt = [];
        this.options.oneTimeConfig = Object.assign({}, this.config.getAll(), this.options);

        if (this.options.isSubgeneratorCall) {
            this.options.oneTimeConfig.projectname = this.options.projectname;
            this.options.oneTimeConfig.namespaceUI5Input = this.options.namespaceUI5Input;
            this.options.oneTimeConfig.modulename = this.options.modulename;

            var appName =
                !this.options.oneTimeConfig.modulename || this.options.modulename === "uimodule"
                    ? this.options.projectname
                    : this.options.modulename;
            this.options.oneTimeConfig.namespaceURI = this.options.namespaceUI5Input.split(".").join("/");
            this.options.oneTimeConfig.appId = this.options.namespaceUI5Input + "." + appName;
            this.options.oneTimeConfig.appURI = this.options.namespaceURI + "/" + appName;
            this.options.oneTimeConfig.title = appName;

            this.options.oneTimeConfig.addPO = true;
            this.options.oneTimeConfig.addJourney = true;
            return;
        } else {
            if (!this.config.getAll().viewtype) {
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
                    },
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

            const modules = this.config.get("uimodules") || [];
            if (modules.length) {
                aPrompt.push({
                    type: "list",
                    name: "modulename",
                    message: "To which module do you want to add OPA5 tests?",
                    choices: modules,
                    when: modules.length
                });
            }
        }

        aPrompt = aPrompt.concat(
            {
                type: "confirm",
                name: "addPO",
                message: "Do you want to add a page object?",
                default: true
            },
            {
                type: "confirm",
                name: "addJourney",
                message: "Do you want to add a journey?",
                default: true
            }
        );

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
        if (this.options.oneTimeConfig.addPO) {
            this.composeWith(
                require.resolve("../newopa5po"),
                Object.assign({}, this.options.oneTimeConfig, {
                    isSubgeneratorCall: true
                })
            );
        }
        if (this.options.oneTimeConfig.addJourney) {
            this.composeWith(
                require.resolve("../newopa5journey"),
                Object.assign({}, this.options.oneTimeConfig, {
                    isSubgeneratorCall: true
                })
            );
        }
    }

    async writing() {
        // get values from subgeneratos
        const journeys = this.config.get("opa5Journeys") || [];
        this.config.set("opa5Journeys", journeys);
        this.options.oneTimeConfig.opa5Journeys = journeys;

        const pos = this.config.get("opa5pos") || [];
        this.config.set("opa5pos", pos);
        this.options.oneTimeConfig.opa5pos = pos;

        const sModule =
            (this.options.oneTimeConfig.modulename ? this.options.oneTimeConfig.modulename + "/" : "") + "webapp/";
        this.sourceRoot(path.join(__dirname, "templates"));
        glob.sync("**", {
            cwd: this.sourceRoot(),
            nodir: true
        }).forEach((file) => {
            this.fs.copyTpl(this.templatePath(file), this.destinationPath(sModule + file), this.options.oneTimeConfig);
        });
    }
};
