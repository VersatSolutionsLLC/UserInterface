/**
 * Created by Sowvik on 09-10-2018.
 */
(function($){

    var _lastUpdateTimer;
    var _lastTotal;

    /**
     * @param {$.teoco.Dashboard.Dashboard} dashboard
     * @private
     */
    function _updateDashboard(dashboard) {
    }

    function _updateDashboardTable() {
    }

    $(document).ready(function(){
        $.teoco.Dashboard.Iot = new $.teoco.Dashboard('#iotDashboard > .tile-group',
            [
                {
                    label: "Total Devices",
                    size: $.teoco.Dashboard.Tile.Size.WIDE,
                    update: "total"
                },
                {
                    label: "Out of contact",
                    icon: "mif-unlink",
                    thresholds: [0, 5, 10],/*,
                 sidePanel: ["#sidebarIoTOOC", function () {
                 // $('#oocDonut').data('donut').val(0);
                 var ctx = $("#sidebarIoTOOC > canvas")[0].getContext('2d');
                 var myBarChart = new Chart(ctx, {
                 type: 'bar',
                 data: {
                 labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
                 datasets: [{
                 label: '# of Votes',
                 data: [12, 19, 3, 5, 2, 3],
                 backgroundColor: [
                 'rgba(255, 99, 132, 0.2)',
                 'rgba(54, 162, 235, 0.2)',
                 'rgba(255, 206, 86, 0.2)',
                 'rgba(75, 192, 192, 0.2)',
                 'rgba(153, 102, 255, 0.2)',
                 'rgba(255, 159, 64, 0.2)'
                 ],
                 borderColor: [
                 'rgba(255,99,132,1)',
                 'rgba(54, 162, 235, 1)',
                 'rgba(255, 206, 86, 1)',
                 'rgba(75, 192, 192, 1)',
                 'rgba(153, 102, 255, 1)',
                 'rgba(255, 159, 64, 1)'
                 ],
                 borderWidth: 1
                 }]
                 },
                 options: {
                 responsive: true,
                 title: {
                 display: true,
                 text: 'Out of contact'
                 },
                 legend: {
                 position: 'top'
                 },
                 scales: {
                 yAxes: [{
                 ticks: {
                 beginAtZero: true
                 }
                 }]
                 },
                 onClick: function () {
                 console.log(arguments);
                 }
                 }
                 });
                 }],
                 footerPanel: ["#oocFooterTableContainer", function () {
                 $("#oocFooterTableContainer > table.dataTable")
                 .DataTable(teoco.UIController.Utilities.DataTables.setCommonOptions({
                 destroy: true, // recreate
                 autoWidth: false,
                 dom: "lrtip",
                 pageLength: 3,
                 lengthChange: false,
                 processing: true
                 }));
                 }],*/
                    /**
                     * @param {*} data
                     * @return {string|number}
                     */
                    update: function (data) {
                        return (data.ooc > 0 && data.total > 0 ? Math.round(100 * data.ooc / data.total) : 0) + "%";
                    }
                },
                {
                    label: "SIM Swap Failures",
                    icon: "mif-sync-problem",
                    thresholds: [0, 1, 2],
                    /**
                     * @param {*} data
                     * @return {string|number}
                     */
                    update: function (data) {
                        return (data.simSwapFailures > 0 && data.simSwapTotal > 0 ? Math.round(100 * data.simSwapFailures / data.simSwapTotal) : 0) + "%";
                    }
                },
                {
                    label: "Roamed beyond 5s",
                    icon: "mif-enter,5s",
                    thresholds: [0, 5, 10],
                    /**
                     * @param {*} data
                     * @return {string|number}
                     */
                    update: function (data) {
                        return data.longRoams >= 0 ? data.longRoams + "%" : data.longRoams;
                    }
                },
                {
                    label: "Low coverage",
                    icon: "mif-wifi-full,!",
                    description: "The percentage of connection time when the devices' network was low.",
                    thresholds: [0, 10, 20],
                    /**
                     * @param {*} data
                     * @return {string|number}
                     */
                    update: function (data) {
                        return data.lowCoverage >= 0 ? data.lowCoverage + "%" : data.lowCoverage;
                    }
                },
                {
                    label: "Low battery",
                    icon: "mif-battery-one",
                    description: "All devices which had a battery level below 20%.",
                    thresholds: [0, 10, 20],
                    /**
                     * @param {*} data
                     * @return {string|number}
                     */
                    update: function (data) {
                        return data.lowBattery >= 0 ? data.lowBattery + "%" : data.lowBattery;
                    }
                },
                {
                    label: "Drive tests",
                    icon: "mif-drive-eta",
                    description: "All available drive tests.",
                    /*
                     sidePanel: ["#sidebarIoTDT", function () {
                     // Devices List
                     $("#sidebarIoTDTDevices")
                     .DataTable(teoco.UIController.Utilities.DataTables.setCommonOptions({
                     destroy: true, // recreate
                     autoWidth: false,
                     pageLength: 5,
                     lengthChange: false,
                     searching: true,
                     processing: true,
                     deferRender: true,
                     //formatNumber: function (toFormat) {
                     //    return toFormat.toString();
                     //},
                     ajax: teoco.UIController.Utilities.Ajax.setCommonOptions({
                     url: teoco.config.ds.REST.GET_IOT_SENSORS(),
                     dataSrc: "",
                     error: function (jqXHR, error, thrown) {
                     teoco.UIController.HttpErrorListener(jqXHR.status, jqXHR.responseText, teoco.config.ds.REST.GET_IOT_SENSORS());
                     }
                     }),
                     order: [[1, 'desc']],
                     //id,name
                     columns: [
                     // add a checkbox alongwith the device ids
                     {
                     data: "_id",
                     render: function (devId, type, full, meta) {
                     return "<input type='radio'  name='devices' devId='" + devId + "'/>";
                     },
                     orderable: false
                     },
                     {
                     data: "imei",
                     render: function (imei, type, full, meta) {
                     return full.id != 0 ? imei : "All Devices";
                     }
                     },
                     {
                     data: "imsi",
                     render: function (imsi, type, full, meta) {
                     return full.id != 0 ? imsi : "All Devices";
                     }
                     },
                     {
                     data: "_id",
                     render: function (devId, type, full, meta) {
                     return "<i  class='fa fa-trash' style='cursor: pointer' type='radio' devId='" + devId + "'></i>";
                     }
                     }
                     ]
                     })).on('init.dt', function (e, settings, json) {
                     }).on('draw.dt', function () {
                     // teoco.UIController.Sidebar.refresh();
                     }).on('error.dt', function (e, settings, techNote, message) {
                     teoco.Report.error('An error has been reported by IoT Device List DataTable: ' + message);
                     });

                     // DT List
                     $("#sidebarIoTDTList")
                     .DataTable(teoco.UIController.Utilities.DataTables.setCommonOptions({
                     destroy: true, // recreate
                     autoWidth: false,
                     pageLength: 5,
                     lengthChange: false,
                     searching: true,
                     processing: true,
                     deferRender: true,
                     //formatNumber: function (toFormat) {
                     //    return toFormat.toString();
                     //},
                     ajax: teoco.UIController.Utilities.Ajax.setCommonOptions({
                     url: teoco.config.ds.REST.GET_IOT_DT_LIST(),
                     dataSrc: "",
                     error: function (jqXHR, error, thrown) {
                     teoco.UIController.HttpErrorListener(jqXHR.status, jqXHR.responseText, teoco.config.ds.REST.GET_IOT_DT_LIST());
                     }
                     }),
                     order: [[1, 'desc']],
                     // guid,device_id,start_time_utc,duration_seconds
                     columns: [
                     // add a checkbox alongwith the GUID
                     {
                     data: "_id",
                     render: function (dtId, type, full, meta) {
                     return "<input type='radio' duration='" + full.duration_seconds + "'  name='drive_test' dtId='" + dtId.devSess + "_" + dtId.devId + "'/>";
                     },
                     orderable: false
                     },
                     {
                     data: "_id",
                     render: function (dtId, type, full, meta) {
                     return new Date(dtId.devSess).toLocaleString();
                     }
                     },
                     {
                     data: "duration_seconds",
                     render: function (durationS, type, full, meta) {
                     var ss = Math.round(durationS);
                     var hh = Math.floor(ss / 3600);
                     ss = ss % 3600;
                     if (hh < 10) hh = "0" + hh;
                     var mm = Math.floor(ss / 60);
                     ss = ss % 60;
                     if (mm < 10) mm = "0" + mm;
                     if (ss < 10) ss = "0" + ss;
                     return hh + ":" + mm + ":" + ss;
                     }
                     },
                     {
                     data: "imei",
                     render: function (imei, type, full, meta) {
                     return imei;
                     }
                     },
                     {
                     data: "imsi",
                     render: function (imsi, type, full, meta) {
                     return imsi;
                     }
                     },
                     {
                     data: "_id",
                     render: function (dtId, type, full, meta) {
                     return "<i  class='fa fa-trash' style='cursor: pointer' type='radio' duration='" + full.duration_seconds + "'  name='drive_test' dtId='" + dtId.devSess + "_" + dtId.devId + "'></i>";
                     }
                     }
                     ]
                     })).on('init.dt', function (e, settings, json) {
                     }).on('draw.dt', function () {
                     // teoco.UIController.Sidebar.refresh();
                     }).on('error.dt', function (e, settings, techNote, message) {
                     teoco.Report.error('An error has been reported by IoT DriveTest List DataTable: ' + message);
                     });
                     }],
                     */
                    /*footerPanel: ["#iotDTFooterTableContainer", function () {
                     $("#iotDTFooterTableContainer > table.dataTable")
                     .DataTable(teoco.UIController.Utilities.DataTables.setCommonOptions({
                     destroy: true, // recreate
                     autoWidth: false,
                     dom: "lrtip",
                     pageLength: 3,
                     lengthChange: false,
                     processing: true
                     }));
                     }],*/
                    update: "driveTests"
                }
            ],
            {
                onShow: function (dashboard) {


                    $("#iotDashboard").show();
                    // update now
                    _updateDashboard(dashboard);
                    _updateDashboardTable();
                    // clear any previous timer
                    if (_lastUpdateTimer != undefined) clearInterval(_lastUpdateTimer);
                    // auto update every 30 secs
                    _lastUpdateTimer = setInterval(_updateDashboard, 30000, dashboard);
                },
                onHide: function (dashboard) {
                    $("#iotDashboard").hide();
                    if (_lastUpdateTimer != undefined) {
                        clearInterval(_lastUpdateTimer);
                        _lastUpdateTimer = undefined;
                    }
                },
                /**
                 * @param {$.teoco.Dashboard.Dashboard} dashboard
                 * @param {*} data
                 */
                onUpdate: function (dashboard, data) {
                    if (_lastTotal != data.total) _updateDashboardTable();
                }
            }
        );
    });

})($);