describe("VisualQueryBuilderController", function () {
    // Include dependencies
    beforeEach(module("app"));

    // Setup tests
    beforeEach(inject(function ($injector) {
        var $scope = $injector.get("$rootScope").$new(false);
        this.controller = $injector.get("$controller")("VisualQueryBuilderController",
                {$scope: $scope});

        this.$http = $injector.get("$httpBackend");
    }));

    /** List of selected tickit.event columns */
    var EVENT_COLUMNS = [
        {column: "eventname", alias: "tbl12", tableName: "tickit.event", tableColumn: "eventname",
            dataType: "string"}
    ];

    /** A node for the tickit.event table */
    var EVENT_NODE = {
        id: 12,
        name: "tickit.event",
        nodeAttributes: {
            attributes: [
                {name: "eventid", dataType: "int", selected: false},
                {name: "eventname", dataType: "string", selected: true}
            ],
            sql: "`tickit`.`event`"
        },
        connectors: {bottom: {}, left: {}, right: {}, top: {}},
        inputConnectors: [{name: ""}],
        outputConnectors: [{name: ""}]
    };

    /** List of selected tickit.sales columns */
    var SALES_COLUMNS = [
        {column: "qtysold", alias: "tbl11", tableName: "tickit.sales", tableColumn: "qtysold",
            dataType: "string"},
        {column: "pricepaid", alias: "tbl11", tableName: "tickit.sales", tableColumn: "pricepaid",
            dataType: "double"},
        {column: "commission", alias: "tbl11", tableName: "tickit.sales", tableColumn: "commission",
            dataType: "double"}
    ];

    /** A node for the tickit.sales table */
    var SALES_NODE = {
        id: 11,
        name: "tickit.sales",
        nodeAttributes: {
            attributes: [
                {name: "salesid", dataType: "int", selected: false},
                {name: "buyerid", dataType: "int", selected: false},
                {name: "eventid", dataType: "int", selected: false},
                {name: "qtysold", dataType: "string", selected: true},
                {name: "pricepaid", dataType: "double", selected: true},
                {name: "commission", dataType: "double", selected: true}
            ],
            sql: "`tickit`.`sales`"
        },
        connectors: {bottom: {}, left: {}, right: {}, top: {}},
        inputConnectors: [{name: ""}],
        outputConnectors: [{name: ""}]
    };

    /** List of selected tickit.users columns */
    var USERS_COLUMNS = [
        {column: "username", alias: "tbl10", tableName: "tickit.users", tableColumn: "username",
            dataType: "string"},
        {column: "firstname", alias: "tbl10", tableName: "tickit.users", tableColumn: "firstname",
            dataType: "string"},
        {column: "lastname", alias: "tbl10", tableName: "tickit.users", tableColumn: "lastname",
            dataType: "string"}
    ];

    /** A node for the tickit.users table */
    var USERS_NODE = {
        id: 10,
        name: "tickit.users",
        nodeAttributes: {
            attributes: [
                {name: "userid", dataType: "int", selected: false},
                {name: "username", dataType: "string", selected: true},
                {name: "firstname", dataType: "string", selected: true},
                {name: "lastname", dataType: "string", selected: true}
            ],
            sql: "`tickit`.`users`"
        },
        connectors: {bottom: {}, left: {}, right: {}, top: {}},
        inputConnectors: [{name: ""}],
        outputConnectors: [{name: ""}]
    };

    /** List of selected tickit.venue columns */
    var VENUE_COLUMNS = [
        {column: "venuename", alias: "tbl13", tableName: "tickit.venue", tableColumn: "venuename",
            dataType: "string"}
    ];

    /** A node for the tickit.venue table */
    var VENUE_NODE = {
        id: 13,
        name: "tickit.venue",
        nodeAttributes: {
            attributes: [
                {name: "venueid", dataType: "int", selected: false},
                {name: "venuename", dataType: "string", selected: true}
            ],
            sql: "`tickit`.`venue`"
        },
        connectors: {bottom: {}, left: {}, right: {}, top: {}},
        inputConnectors: [{name: ""}],
        outputConnectors: [{name: ""}]
    };

    /**
     * Connects the specified tables.
     *
     * <p>Note that the source and destination are switched by the
     * {@link flowchart.ChartViewModel#createNewConnection()} call.</p>
     *
     * @param {flowchart.ChartViewModel} chartViewModel the flow chart view model
     * @param {number} srcNodeId the source node id
     * @param {string|null} srcJoinKey the source join column, or null if not defined
     * @param {number} dstNodeId the destination node id
     * @param {string|null} dstJoinKey the destination join column, or null if not defined
     */
    function connectTables (chartViewModel, srcNodeId, srcJoinKey, dstNodeId, dstJoinKey)
    {
        // Add connection
        var dstConnector = chartViewModel.findConnector(dstNodeId, 0);
        var srcConnector = chartViewModel.findConnector(srcNodeId, 0);

        chartViewModel.createNewConnection(srcConnector, dstConnector);

        // Set join info
        var connection = chartViewModel.connections[chartViewModel.connections.length - 1];
        connection.data.joinKeys = {};

        if (srcJoinKey !== null) {
            connection.data.joinKeys.sourceKey = dstJoinKey;
        }
        if (dstJoinKey !== null) {
            connection.data.joinKeys.destKey = srcJoinKey;
        }

        if (srcJoinKey !== null || dstJoinKey !== null) {
            connection.data.joinType = "INNER JOIN";
        }
    }

    // getSQLModel
    it("should produce SQL for one table", function () {
        this.$http.whenGET("js/feeds/feeds-table.html").respond(200, "");

        // Test SQL
        this.controller.chartViewModel.addNode(SALES_NODE);

        var expected = "SELECT tbl11.`qtysold`, tbl11.`pricepaid`, tbl11.`commission` FROM "
                + "`tickit`.`sales` tbl11";
        expect(this.controller.getSQLModel()).toBe(expected);

        // Test selected columns
        expect(this.controller.selectedColumnsAndTables).toEqual(SALES_COLUMNS);
    });

    it("should produce SQL for joined tables", function () {
        this.$http.whenGET("js/feeds/feeds-table.html").respond(200, "");
        this.$http.whenGET("js/visual-query/visual-query-builder-connection-dialog.html").respond(
                200, "");

        // Add tables
        var chartViewModel = this.controller.chartViewModel;

        chartViewModel.addNode(USERS_NODE);
        chartViewModel.addNode(SALES_NODE);
        chartViewModel.addNode(EVENT_NODE);
        chartViewModel.addNode(VENUE_NODE);

        connectTables(chartViewModel, 10, "userid", 11, "buyerid");
        connectTables(chartViewModel, 11, "eventid", 12, "eventid");
        connectTables(chartViewModel, 12, "venueid", 13, "venueid");

        // Test SQL
        var expected = "SELECT tbl10.`username`, tbl10.`firstname`, tbl10.`lastname`, "
                + "tbl11.`qtysold`, tbl11.`pricepaid`, tbl11.`commission`, tbl12.`eventname`, "
                + "tbl13.`venuename` FROM `tickit`.`users` tbl10 INNER JOIN `tickit`.`sales` tbl11 "
                + "ON tbl11.`buyerid` = tbl10.`userid` INNER JOIN `tickit`.`event` tbl12 ON "
                + "tbl12.`eventid` = tbl11.`eventid` INNER JOIN `tickit`.`venue` tbl13 ON "
                + "tbl13.`venueid` = tbl12.`venueid`";
        expect(this.controller.getSQLModel()).toBe(expected);

        // Test selected columns
        expected = _.flatten([USERS_COLUMNS, SALES_COLUMNS, EVENT_COLUMNS, VENUE_COLUMNS], true);
        expect(this.controller.selectedColumnsAndTables).toEqual(expected);
    });

    it("should produce SQL for multiple tables", function () {
        this.$http.whenGET("js/feeds/feeds-table.html").respond(200, "");

        // Add tables
        this.controller.chartViewModel.addNode(USERS_NODE);
        this.controller.chartViewModel.addNode(SALES_NODE);

        // Test SQL
        var expected = "SELECT tbl10.`username`, tbl10.`firstname`, tbl10.`lastname`, "
                + "tbl11.`qtysold`, tbl11.`pricepaid`, tbl11.`commission` FROM `tickit`.`users` "
                + "tbl10, `tickit`.`sales` tbl11";
        expect(this.controller.getSQLModel()).toBe(expected);

        // Test selected columns
        expected = _.flatten([USERS_COLUMNS, SALES_COLUMNS], true);
        expect(this.controller.selectedColumnsAndTables).toEqual(expected);
    });

    it("should produce SQL for pre-joined tables", function () {
        this.$http.whenGET("js/feeds/feeds-table.html").respond(200, "");

        // Add tables
        this.controller.chartViewModel.addNode(USERS_NODE);
        this.controller.chartViewModel.addNode(SALES_NODE);

        connectTables(this.controller.chartViewModel, 10, null, 11, null);

        // Test SQL
        var expected = "SELECT tbl10.`username`, tbl10.`firstname`, tbl10.`lastname`, "
                + "tbl11.`qtysold`, tbl11.`pricepaid`, tbl11.`commission` FROM `tickit`.`users` "
                + "tbl10 JOIN `tickit`.`sales` tbl11";
        expect(this.controller.getSQLModel()).toBe(expected);

        // Test selected columns
        expected = _.flatten([USERS_COLUMNS, SALES_COLUMNS], true);
        expect(this.controller.selectedColumnsAndTables).toEqual(expected);
    });
});
