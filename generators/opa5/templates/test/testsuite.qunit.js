window.suite = function () {
    "use strict";

    // eslint-disable-next-line
    var oSuite = new parent.jsUnitTestSuite(),
        sContextPath = location.pathname.substring(0, location.pathname.lastIndexOf("/") + 1);

    // eslint-disable-next-line
    oSuite.addTestPage(sContextPath + "integration/opaTests.qunit.html");

    // eslint-disable-next-line
    return oSuite;
};
