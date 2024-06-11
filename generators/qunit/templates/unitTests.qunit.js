/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/core/Core",
	"<%= uimodule %>/test/unit/AllTests"
], async function (Core) {
	"use strict";
	await Core.ready();
	QUnit.start();
});
