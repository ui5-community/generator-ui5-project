const Generator = require("yeoman-generator"),
    fileaccess = require("../../helpers/fileaccess"),
    fs = require("fs").promises,
    path = require("path"),
    chalk = require("chalk");

const { generate: generateFreestyleTemplate, TemplateType, FreestyleApp } = require("@sap-ux/fiori-freestyle-writer");
const dirTree = require("directory-tree");

module.exports = class extends Generator {
    static displayName = "Add a new web app to an existing project";

    prompting() {
        if (this.options.isSubgeneratorCall) {
            return this.prompt([
                {
                    type: "input",
                    name: "tilename",
                    message: "What name should be displayed on the Fiori Launchpad tile?",
                    default: "Fiori App",
                    when: this.options.platform === "SAP Launchpad service"
                }
            ]).then((answers) => {
                this.destinationRoot(this.options.cwd);
                this.options.oneTimeConfig = Object.assign({}, this.config.getAll(), this.options);
                this.options.oneTimeConfig.modulename = this.options.modulename;
                this.options.oneTimeConfig.tilename = answers.tilename;
                this.options.oneTimeConfig.viewname = "MainView";

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

                this.composeWith(
                    require.resolve("../opa5"),
                    Object.assign({}, this.options.oneTimeConfig, {
                        isSubgeneratorCall: true,
                        namespaceUI5Input: this.options.oneTimeConfig.namespaceUI5
                    })
                );
            });
        }

        // everything below runs in standalone generator mode only
        // (aka in easy-ui5 < 3 or when explicitly called from command line in easy-ui5 >= 3)
        var aPrompt = [
            {
                type: "input",
                name: "modulename",
                message: "What is the name of the module?",
                validate: (s) => {
                    if (/^\d*[a-zA-Z][a-zA-Z0-9]*$/g.test(s)) {
                        return true;
                    }
                    return "Please use alpha numeric characters only for the module name.";
                }
            },
            {
                type: "input",
                name: "tilename",
                message: "What name should be displayed on the Fiori Launchpad tile?",
                default: "Fiori App",
                when: this.config.get("platform") === "SAP Launchpad service"
            }
        ];

        if (!this.config.getAll().viewtype) {
            aPrompt = aPrompt.concat([
                {
                    type: "input",
                    name: "projectname",
                    message:
                        "Seems like this project has not been generated with Easy-UI5. Please enter the name your project.",
                    validate: (s) => {
                        if (/^\d*[a-zA-Z][a-zA-Z0-9]*$/g.test(s)) {
                            return true;
                        }
                        return "Please use alpha numeric characters only for the project name.";
                    },
                    default: "myUI5App"
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
                    choices: ["XML", "JSON", "JS", "HTML"],
                    default: "XML"
                }
            ]);
        }

        return this.prompt(aPrompt).then((answers) => {
            this.options.oneTimeConfig = this.config.getAll();
            this.options.oneTimeConfig.viewname = "MainView";
            this.options.oneTimeConfig.modulename = answers.modulename;
            this.options.oneTimeConfig.tilename = answers.tilename;

            if (answers.projectname) {
                this.options.oneTimeConfig.projectname = answers.projectname;
                this.options.oneTimeConfig.namespaceUI5 = answers.namespaceUI5;
                this.options.oneTimeConfig.namespaceURI = answers.namespaceUI5.split(".").join("/");
                this.options.oneTimeConfig.viewtype = answers.viewtype;
            }

            this.options.oneTimeConfig.appId =
                this.options.oneTimeConfig.namespaceUI5 +
                "." +
                (answers.modulename === "uimodule" ? this.options.oneTimeConfig.projectname : answers.modulename);
            this.options.oneTimeConfig.appURI =
                this.options.oneTimeConfig.namespaceURI +
                "/" +
                (answers.modulename === "uimodule" ? this.options.oneTimeConfig.projectname : answers.modulename);

            this.composeWith(
                require.resolve("../opa5"),
                Object.assign({}, this.options.oneTimeConfig, {
                    isSubgeneratorCall: true,
                    namespaceUI5Input: this.options.oneTimeConfig.namespaceUI5
                })
            );
        });
    }

    async writing() {
        const sModuleName = this.options.oneTimeConfig.modulename;
        const localResources =
            this.options.oneTimeConfig.ui5libs === "Local resources (OpenUI5)" ||
            this.options.oneTimeConfig.ui5libs === "Local resources (SAPUI5)";
        const platformIsAppRouter = this.options.oneTimeConfig.platform.includes("Application Router");
        const netweaver = this.options.oneTimeConfig.platform.includes("SAP NetWeaver");

        // Write files in new module folder
        /**
         * @type import("@sap/open-ux-tools-types").FreestyleApp
         */
        const FreestyleApp = {
            app: {
                id: this.options.oneTimeConfig.appId
            },
            // TODO:
            // - relay chosen ui5 lib bootstrap location -> index.html
            // ui5: {
            //     bootstrapSrc: this.options.oneTimeConfig.ui5libs
            // },
            package: {
                name: this.options.oneTimeConfig.appId
            },
            template: {
                type: TemplateType.Basic,
                settings: {
                    viewName: this.options.oneTimeConfig.viewname
                }
            }
        };

        // integrate @sap-ux/fiori-freestyle-writer scaffolding package
        try {
            const _fs = await generateFreestyleTemplate(this.destinationPath(sModuleName), FreestyleApp);
            await _fs.commit();

            // clean up @sap-ux/fiori-freestyle-writer artefacts not needed in easy-ui5
            [
                "ui5-local.yaml",
                "ui5.yaml" /* easy-ui5 specific ui5* yamls */,
                "package.json" /* irrelevant */,
                ".npmignore" /* irrelevant */
            ].map(async (file) => {
                await fs.unlink(this.destinationPath(sModuleName, file));
            });
            await fs.rm(this.destinationPath(sModuleName, "webapp/utils"), { force: true, recursive: true }); // "webapp/utils" only holds a single file

            this.log(`used ${chalk.blueBright("@sap-ux/fiori-freestyle-writer")} to genrate freestyle app skeleton :)`);
            dirTree(this.destinationPath(sModuleName), null, (item) => {
                const relativeFilePath = item.path.replace(
                    `${this.destinationPath(sModuleName)}${path.sep}`,
                    `${sModuleName}${path.sep}`
                );
                this.log(`  ${chalk.blueBright("created")} ${relativeFilePath}`);
            });
        } catch (error) {
            this.log("Urgh. Something went wrong. Lookie:");
            this.log(chalk.red(error.message || JSON.stringify(error)));
        }

        // handle easy-ui5 specific ui5.yaml
        const ui5YamlSrc = this.templatePath("uimodule", "ui5.yaml");
        const ui5YamlDest = this.destinationPath(sModuleName, "ui5.yaml");
        this.fs.copyTpl(ui5YamlSrc, ui5YamlDest, this.options.oneTimeConfig);

        // special handling of files specific to deployment scenarios
        this.sourceRoot(path.join(__dirname, "templates"));
        if (this.options.oneTimeConfig.platform !== "SAP Launchpad service") {
            const flpSandboxSrc = this.templatePath("uimodule", "webapp", "flpSandbox.html");
            const flpSandboxDest = this.destinationPath(sModuleName, "webapp", "flpSandbox.html");
            this.fs.copyTpl(flpSandboxSrc, flpSandboxDest, this.options.oneTimeConfig);
        }
        if (
            this.options.oneTimeConfig.platform === "SAP Launchpad service" ||
            this.options.oneTimeConfig.platform === "SAP HTML5 Application Repository service for SAP BTP"
        ) {
            const xsAppSrc = this.templatePath("uimodule", "webapp", "xs-app.json");
            const xsAppDest = this.destinationPath(sModuleName, "webapp", "xs-app.json");
            this.fs.copyTpl(xsAppSrc, xsAppDest, this.options.oneTimeConfig);
        }

        if (this.options.oneTimeConfig.platform.includes("Application Router")) {
            this.log("configuring app router settings...");
            await fileaccess.manipulateJSON.call(this, "/approuter/xs-app.json", {
                routes: [
                    {
                        source: "^/" + sModuleName + "/(.*)$",
                        target: "$1",
                        authenticationType: "none",
                        localDir: sModuleName + "/webapp"
                    }
                ]
            });
        }

        if (
            this.options.oneTimeConfig.platform === "SAP HTML5 Application Repository service for SAP BTP" ||
            this.options.oneTimeConfig.platform === "SAP Launchpad service"
        ) {
            if (this.options.oneTimeConfig.platform === "SAP Launchpad service") {
                this.log("configuring Launchpad integration...");
                await fileaccess.manipulateJSON.call(this, "/" + sModuleName + "/webapp/manifest.json", {
                    ["sap.cloud"]: {
                        service: this.options.oneTimeConfig.projectname + ".service"
                    },
                    ["sap.app"]: {
                        crossNavigation: {
                            inbounds: {
                                intent1: {
                                    signature: {
                                        parameters: {},
                                        additionalParameters: "allowed"
                                    },
                                    semanticObject: sModuleName,
                                    action: "display",
                                    title: this.options.oneTimeConfig.tilename,
                                    icon: "sap-icon://add"
                                }
                            }
                        }
                    }
                });
            }
        }

        // Append to Main package.json
        await fileaccess.manipulateJSON.call(this, "/package.json", function (packge) {
            packge.scripts["serve:" + sModuleName] = "ui5 serve --config=" + sModuleName + "/ui5.yaml";
            packge.scripts["build:ui"] += " build:" + sModuleName;
            let buildCommand = "ui5 build --config=" + sModuleName + "/ui5.yaml --clean-dest";
            if (localResources) {
                buildCommand += " --a";
            }
            if (platformIsAppRouter) {
                buildCommand += ` --dest approuter/${sModuleName}/webapp`;
            } else if (!netweaver) {
                buildCommand += ` --dest ${sModuleName}/dist`;
                buildCommand += " --include-task=generateManifestBundle";
            } else {
                buildCommand += " --dest dist/" + sModuleName;
            }
            packge.scripts["build:" + sModuleName] = buildCommand;
            return packge;
        });

        if (
            this.options.oneTimeConfig.platform === "SAP HTML5 Application Repository service for SAP BTP" ||
            this.options.oneTimeConfig.platform === "SAP Launchpad service"
        ) {
            this.log("configuring deployment options...");
            await fileaccess.writeYAML.call(this, "/mta.yaml", (mta) => {
                const deployer = mta.modules.find((module) => module.name === "webapp_deployer");

                deployer["build-parameters"]["requires"].push({
                    name: sModuleName,
                    artifacts: [`dist/${sModuleName}.zip`],
                    ["target-path"]: "resources/"
                });

                mta.modules.push({
                    name: sModuleName,
                    type: "html5",
                    path: sModuleName,
                    "build-parameters": {
                        builder: "custom",
                        commands: [`npm run build:${sModuleName} --prefix ..`],
                        "supported-platforms": []
                    }
                });
                return mta;
            });
        }

        const modules = this.config.get("uimodules") || [];
        modules.push(this.options.oneTimeConfig.modulename);
        this.config.set("uimodules", modules);
    }
};
