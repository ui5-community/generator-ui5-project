const Generator = require("yeoman-generator"),
    fileaccess = require("../../helpers/fileaccess"),
    path = require("path"),
    glob = require("glob"),
    chalk = require("chalk"),
    ui5Writer = require("@sap-ux/ui5-application-writer");

// patches the Generator for the install tasks as new custom install
// tasks produce ugly errors! (Related issue: https://github.com/yeoman/environment/issues/309)
// to avoid this error: "TypeError: this.installDependencies is not a function"
require("lodash").extend(Generator.prototype, require("yeoman-generator/lib/actions/install"));

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
        const sProjectName = this.options.oneTimeConfig.projectname;
        const localResources =
            this.options.oneTimeConfig.ui5libs === "Local resources (OpenUI5)" ||
            this.options.oneTimeConfig.ui5libs === "Local resources (SAPUI5)";
        const platformIsAppRouter = this.options.oneTimeConfig.platform.includes("Application Router");
        const platformIsLaunchpad = this.options.oneTimeConfig.platform === "SAP Launchpad service"
        const platformIsHTML5AppRepo = this.options.oneTimeConfig.platform === "SAP HTML5 Application Repository service for SAP BTP"
        const platformIsNetWeaver = this.options.oneTimeConfig.platform.includes("SAP NetWeaver");

        this.sourceRoot(path.join(__dirname, "templates"));

        // view type == "XML"
        // -> utilize @sap-ux/fiori-freestyle-writer scaffolding package
        if (this.options.viewtype === "XML") {
            /**
             * @type FreestyleApp
             */
            const freestyleApp = {
                app: {
                    id: this.options.oneTimeConfig.appId
                },
                package: {
                    name: this.options.oneTimeConfig.appId
                },
                template: {
                    type: TemplateType.Basic,
                    settings: {
                        viewName: this.options.oneTimeConfig.viewname
                    }
                },
                appOptions: {
                    loadReuseLibs: platformIsLaunchpad
                },
                ui5:{
                    minUI5Version: "1.102.0"
                }
            };

            try {
                if (this.options.enableFPM) {
                    if (this.options.enableTypescript) {
                        freestyleApp.appOptions.typescript = true;
                    }
                    await ui5Writer.generate(this.destinationPath(sModuleName), freestyleApp, this.fs);
                    if (this.options.enableTypescript) {
                        // manipulate a few files to work with the easy-ui5 structure
                        const tsconfig = "tsconfig.json";
                        const tsCfgStr = this.fs.read(this.destinationPath(sModuleName, tsconfig));
                        this.fs.delete(this.destinationPath(tsconfig));
                        this.fs.delete(this.destinationPath(sModuleName, tsconfig));
                        this.fs.write(this.destinationPath(tsconfig), tsCfgStr.replaceAll('webapp', `${sModuleName}/webapp`).replace('dist', `${sModuleName}/dist`));
                        const babel = ".babelrc.json";
                        this.fs.move(this.destinationPath(sModuleName, babel), this.destinationPath(babel));
                        const pckg = "package.json";
                        const devDeps = this.fs.readJSON(this.destinationPath(sModuleName, pckg)).devDependencies;
                        this.fs.extendJSON(this.destinationPath(pckg), {
                            scripts: {
                                "start:mock": `ui5 serve --config=${sModuleName}/ui5-mock.yaml  --open index.html?sap-ui-xx-viewCache=false`,
                                "ts:check": "tsc --noEmit"
                            },
                            devDependencies: devDeps,
                            ui5: {
                                dependencies: [
                                    "ui5-middleware-livereload",
                                    "@sap/ux-ui5-tooling",
                                    "@sap-ux/ui5-middleware-fe-mockserver",
                                    "ui5-tooling-modules",
                                    "ui5-tooling-transpile"
                                  ]
                            }
                        })
                    }
                } else {
                    await generateFreestyleTemplate(this.destinationPath(sModuleName), freestyleApp, this.fs);
                    // make @sap-ux/fiori-freestyle-writer's MainView.controller
                    // aware of easy-ui5's base controller
                    const MainViewController = {
                        js: this.destinationPath(sModuleName, "webapp/controller/MainView.controller.js")
                    };
                    this.fs.write(
                        MainViewController.js,
                        this.fs.read(MainViewController.js)
                            .toString()
                            .replace(/sap\/ui\/core\/mvc\/Controller/g, "./BaseController")
                    );
                    this.log(
                        `  ${chalk.blueBright(
                            "\u26A0 \uFE0F patched @sap-ux's"
                        )} MainViewController.js to use ./BaseController`
                    );
                    // fix up @sap-ux/fiori-freestyle-writer's test/flpSandbox.html -
                    // sap.ushell is only available in sapui5
                    // bootstrap only from there, no matter the used framework choice..
                    const flpSandbox = { html: this.destinationPath(sModuleName, "webapp/test/flpSandbox.html") };
                    this.fs.write(
                        flpSandbox.html,
                        this.fs.read(flpSandbox.html)
                            .toString()
                            .replace(/src="(..)\/(test-)?resources/g, (match) => {
                                return match.replace("..", "https://ui5.sap.com");
                            })
                    );
                    this.log(
                        `  ${chalk.blueBright(
                            "\u26A0 \uFE0F patched @sap-ux's"
                        )} flpSandbox.html to boostrap only SAPUI5 (sap.ushell!)`
                    );
                    this.log(
                        `used ${chalk.blueBright("@sap-ux/fiori-freestyle-writer")} to generate freestyle app skeleton :)`
                    );    
                }

                // clean up @sap-ux/fiori-freestyle-writer artefacts not needed in easy-ui5
                [
                    "ui5-local.yaml",
                    "ui5.yaml" /* easy-ui5 specific ui5* yamls */,
                    ".gitignore", /* irrelevant */
                    ".eslintrc", /* irrelevant */
                    "package.json" /* irrelevant */
                ].map(async (file) => {
                    try {
                        this.fs.delete(this.destinationPath(sModuleName, file));
                    } catch (e) {
                        //ignore as this probably means the file doens't exist anyway
                    }
                });

                dirTree(this.destinationPath(sModuleName), null, (item) => {
                    const relativeFilePath = item.path.replace(
                        `${this.destinationPath(sModuleName)}${path.sep}`,
                        `${sModuleName}${path.sep}`
                    );
                    this.log(`  ${chalk.blueBright("created")} ${relativeFilePath}`);
                });

                // relay chosen UI5 lib location -> @sap-ux/fiori-freestyle-writer's index.html
                const index = { html: this.destinationPath(sModuleName, "webapp/index.html") };
                let _ui5libs = "";
                switch (this.options.oneTimeConfig.ui5libs) {
                    case "Content delivery network (OpenUI5)":
                        _ui5libs = "https://openui5.hana.ondemand.com/resources/sap-ui-core.js";
                        break;

                    case "Content delivery network (SAPUI5)":
                        _ui5libs = "https://ui5.sap.com/resources/sap-ui-core.js";
                        break;

                    default:
                        _ui5libs = "resources/sap-ui-core.js";
                        break;
                }
                this.fs.write(
                    index.html,
                    (this.fs.read(index.html)).toString().replace(/src=".*"/g, `src="${_ui5libs}"`)
                );
                this.log(
                    `  ${chalk.blueBright("\u26A0 \uFE0F patched @sap-ux's")} index.html with ${
                        this.options.oneTimeConfig.ui5libs
                    }`
                );
            } catch (error) {
                this.log("Urgh. Something went wrong. Lookie:");
                this.log(chalk.red(error.message || JSON.stringify(error)));
            }

            const additionalFiles = [ ["ui5.yaml"] ];
            if (!this.options.enableFPM) {
                additionalFiles.push(["webapp", "controller", "BaseController.js"]);
                additionalFiles.push(["webapp", "model", "formatter.js"]);
            }
            // handle easy-ui5 specific ui5.yaml, put
            // put base controller in place
            // and provide model/formatter.js
            additionalFiles.forEach(
                (file) => {
                    const src = this.templatePath("uimodule", ...file);
                    const dest = this.destinationPath(sModuleName, ...file);
                    this.fs.copyTpl(src, dest, this.options.oneTimeConfig);
                }
            );

            // special handling of files specific to deployment scenarios
            // > flpSandbox.html is created by @sap-ux/fiori-freestyle-writer in test/
            if (
                platformIsLaunchpad ||
                platformIsHTML5AppRepo
            ) {
                const xsAppSrc = this.templatePath("uimodule", "webapp", "xs-app.json");
                const xsAppDest = this.destinationPath(sModuleName, "webapp", "xs-app.json");
                this.fs.copyTpl(xsAppSrc, xsAppDest, this.options.oneTimeConfig);
            }
        } else {
            // view type != "XML"
            // -> use original generator-ui5-projet scaffolding capabilites
            glob.sync("**", {
                cwd: this.sourceRoot(),
                nodir: true
            }).forEach((file) => {
                const sOrigin = this.templatePath(file);
                const sTarget = this.destinationPath(file.replace("uimodule", sModuleName).replace(/\/_/, "/"));

                const isUnneededFlpSandbox =
                    sTarget.includes("flpSandbox") && !platformIsLaunchpad;
                const isUnneededXsApp =
                    sTarget.includes("xs-app") &&
                    !(
                        platformIsLaunchpad ||
                        platformIsHTML5AppRepo
                    );

                if (isUnneededXsApp || isUnneededFlpSandbox) {
                    return;
                }

                this.fs.copyTpl(sOrigin, sTarget, this.options.oneTimeConfig);
            });
        }

        if (platformIsAppRouter) {
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

        if (platformIsLaunchpad) {
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
            } else if (!platformIsNetWeaver) {
                buildCommand += ` --dest ${sModuleName}/dist`;
                buildCommand += " --include-task=generateManifestBundle";
            } else {
                buildCommand += " --dest dist/" + sModuleName;
            }
            packge.scripts["build:" + sModuleName] = buildCommand;
            return packge;
        });

        if (
            platformIsHTML5AppRepo ||
            platformIsLaunchpad
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

                //add destination content to mta.yaml so it will be displayed under "HTML5 Applications" in SAP BTP Cockpit
                if (platformIsHTML5AppRepo) {
                    mta.modules.push({
                        "name": `${sProjectName}_destination_content`,
                        "type": "com.sap.application.content",
                        "build-parameters": {
                            "no-source": true,
                        },
                        "requires": [{
                            "name": `${sProjectName}_uaa`,
                            "parameters": {
                                "service-key": {
                                    "name": `${sProjectName}_uaa_key`
                                }
                            }
                        },
                        {
                            "name": `${sProjectName}_html5_repo_host`,
                            "parameters": {
                                "service-key": {
                                    "name": `${sProjectName}_html5_repo_host_key`
                                }
                            }
                        },
                        {
                            "name": `${sProjectName}_destination`,
                            "parameters": {
                                "content-target": true
                            }
                        }],
                        "parameters": {
                            "content": {
                                "instance": {
                                    "existing_destinations_policy": "update",
                                    "destinations": [
                                        {
                                            "Name": `${sProjectName}_destination_html5`,
                                            "ServiceInstanceName": `${sProjectName}_html5_repo_host`,
                                            "ServiceKeyName": `${sProjectName}_html5_repo_host_key`,
                                            "sap.cloud.service": this.options.oneTimeConfig.projectname + ".service"
                                        },
                                        {
                                            "Name": `${sProjectName}_destination_uaa`,
                                            "Authentication": "OAuth2UserTokenExchange",
                                            "ServiceInstanceName": `${sProjectName}_uaa`,
                                            "ServiceKeyName": `${sProjectName}_uaa_key`,
                                            "sap.cloud.service": this.options.oneTimeConfig.projectname + ".service"
                                        }
                                    ]
                                }
                            }
                        }
                    });
                }
                
                return mta;
            });
        }

        // we're utilizing @sap-ux/fiori-freestyle-writer scaffolding
        // for XML views
        if (this.options.viewtype !== "XML") {
            const oSubGen = Object.assign({}, this.options.oneTimeConfig);
            oSubGen.isSubgeneratorCall = true;
            oSubGen.cwd = this.destinationRoot();
            this.composeWith(require.resolve("../newview"), oSubGen);
        }

        const modules = this.config.get("uimodules") || [];
        modules.push(this.options.oneTimeConfig.modulename);
        this.config.set("uimodules", modules);

        if (this.config.get("enableFioriTools")) {
            this.fs.extendJSON('package.json', { 
                sapux: modules, 
                devDependencies: {
                    "@sap/ux-specification": "latest"
                }
            });
        }
    }
};
