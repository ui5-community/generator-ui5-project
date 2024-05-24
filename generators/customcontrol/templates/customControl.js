sap.ui.define([
    "<%= superControl.replace(/\./g, '/') %>"
], function(SuperControl) {
    "use strict";

    return SuperControl.extend("<%= uimodule %>.control.<%= controlName %>",{
        metadata: {
            properties: {},
            aggregations: {},
        },

        renderer: {},

        <% if (superControl !== "sap.ui.core.Control") { %>
        onAfterRendering: function() {
            if(<%=superControl%>.prototype.onAfterRendering) {
                 <%=superControl%>.prototype.onAfterRendering.apply(this,arguments) //run the super class's method first
            }

            alert("<%=controlName%> has been rendered!");
        },
        <% } %>
    });
});
