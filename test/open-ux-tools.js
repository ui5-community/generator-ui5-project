const assert = require("yeoman-assert");
const path = require("path");
const helpers = require("yeoman-test");

describe("open-ux-tools", () => {
    describe("create project using fiori-freestyle-writer", () => {
        let context;
        before(async () => {
            context = await helpers.run(path.join(__dirname, "../generators/app")).withPrompts({
                viewtype: 'XML'
            });
        });

        after(() => {
            context.restore();
        });

        it("files that are not relevant for easy-ui5 are removed", () => {
            assert.noFile([
                "uimodule/package.json",
                "uimodule/ui5-local.yaml"
            ]);
        });

        it("all relevant files are generated", () => {
            assert.file([
                "uimodule/ui5.yaml",
                "uimodule/webapp/index.html",
                "uimodule/webapp/manifest.json",
                "uimodule/webapp/view/MainView.view.xml",
                "uimodule/webapp/controller/MainView.controller.js",
                "uimodule/webapp/view/App.view.xml",
                "uimodule/webapp/controller/App.controller.js"
            ]);
        });

        it("MainView contoller is extending the easy-ui5 BaseController", () => {
            assert.fileContent(
                "uimodule/webapp/controller/MainView.controller.js",
                "./BaseController"
            );
        });

        it("the flpSandbox.html is in test/ and bootstraps SAPUI5", () => {
            assert.file("uimodule/webapp/test/flpSandbox.html");
            assert.fileContent("uimodule/webapp/test/flpSandbox.html", "https://sapui5.hana.ondemand.com");
        });
    });
});