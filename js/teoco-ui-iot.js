/**
 * Created by  dpietrocarlo 2017-07-12
   Time 04:01PM
 */
teoco.UIController.iot = (new function(){

    var sensorsJSON;

    function helperFunction() {

    }

    /**
     * Fill the prompt dropdown with the sensor information
     * @return {Void}
     */
    function fillDropDownWithSensorInfo()
    {
        // assumes sensorsJSON is filled and a JSON array object that follows this pattern
        // "[{\"id\":0,\"name\":\"All\"},{\"id\":3,\"name\":\"355986084167544\"}]";
        for (var key in sensorsJSON) {
               if (sensorsJSON.hasOwnProperty(key)) {

                     $('#iotc-dropdown > select')
                             .append($("<option></option>")
                                        .attr("value",sensorsJSON[key].id)
                                        .text(sensorsJSON[key].name));
              }
         }
    }

    /**
     * Run Ajax to get the sensor information and then fill the dropdown
     * @return {Void}
     */
    function getSensorArray (){
        // http://localhost:5757/webservice_cluster/rest/clustermanager/sensors

        var uuu =  teoco.config.ds.REST.GET_IOT_SENSORS();
        // alert (uuu);
        sensorsJSON = null;

        // if you have no data, here's the insert statements for the sensors REST service to get you data.
        // INSERT INTO AGENTS ( agent_id, ip_address, host_name, agent_status_id ) VALUES ( '0', NULL, 'All', '3' );
        // INSERT INTO AGENTS ( agent_id, ip_address, host_name, agent_status_id ) VALUES ( '1', NULL, '355986084167544', '3' );

         // Performance was too slow and got timeouts, stubbed it out for now...
         // should be able to comment out 4 lines below and execute real code.
      //   var stubbed_out_str = "[{\"id\":0,\"name\":\"All\"},{\"id\":3,\"name\":\"355986084167544\"}]";
       //  sensorsJSON = JSON.parse(stubbed_out_str);
     //    fillDropDownWithSensorInfo();
     //    return;

        $.ajax(teoco.UIController.Utilities.Ajax.setCommonOptions(
            {
                url:  uuu
            }))
            .done(
              function (jsonArray, textStatus, jqXHR) {
                sensorsJSON = jsonArray;
                fillDropDownWithSensorInfo();
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                teoco.UIController.HttpErrorListener(jqXHR.status, jqXHR.responseText, uuu);
            });

    }



    /**
    * Generate report on server, return remote file and path as a string on success and download it locally
    * @param {String} selectedDeviceId
    * @param {String} reportName
    * @return {Void}
    */
   function GenAndDownloadReport (selectedDeviceId, reportName){

             // mongos> db.rf_info.distinct("devId");
        //   [ 1 ]

        // WOW WOW WOW - watch capitalization on the jasper report, jasper generate (deep down) is CASE SENSITIVE!!! RFInfo vs RfInfo killed me!  There
        // was no indication from the error that the report wasn't found or the name was wrong, todo : Look into why error reporting is so uninformative
        // !!!!!!!!!!!!!!!!!!!!!!!! HARD CODING selectedDeviceId right now because we only have 1 in the database !!!!!!!!!!! *
        // !!!!!!!!!!!!!!!!!!!!!!!! HARD CODING report as well as right now because we only have one  !!!!!!!!!!! *

          var uuu =  teoco.config.ds.REST.GET_IOT_GEN_REPORT() + "?reportName=" + reportName + "&devId=" + selectedDeviceId;

          // generate the report via AJAX because we need to call rest service and have user id and session within that call, then when done
          // call the straight up download method.

          teoco.UIController.Utilities.Cursor.setProgress(true);
          teoco.UIController.StatusBar.info.show("Generating report, your download will start soon.");


          $.ajax(teoco.UIController.Utilities.Ajax.setCommonOptions(
           {
               url:  uuu
           }))
           .done(
             function (remoteReportFilename, textStatus, jqXHR) {
                // use the utilty function to download it to the browser
                teoco.UIController.DownloadFile(reportName, teoco.config.ds.REST.GET_IOT_DOWNLOAD_REPORT() + "?remotePathAndFile=" + remoteReportFilename, "GET");
           })
           .fail(function (jqXHR, textStatus, errorThrown) {

               teoco.UIController.HttpErrorListener(jqXHR.status, jqXHR.responseText, uuu);
           })
           .always(function () {
                 teoco.UIController.Utilities.Cursor.setProgress(false);
                 teoco.UIController.StatusBar.info.hide();
            });

    }


    var reportToRun = "nobody";

   /**
    * Just a quickie to use when you need to test something.
    * @return {Void}
    */
    this.helloWorld = function () {
         alert("Hello World from teoco.UIController.iot : http://localhost:5757/webservice/rest/iot/sensors");
     };


    var reportToRun = "nobody";
    var kpiNameSelected = "nobody";
    /**
     * Called by Sigma Startup code to get the ball rolling for IoT
       see teoco-window.js
     * @return {Void}
     */
    this.iotInit = function () {
        //  metro window-overlay iot-criteria-window
            //Close button   iot-criteria-window-close

           // test should return false for 512 :  console.log ("whats FUTURE512?" + teoco.isFeatureOff(teoco.config.FeatureEnum.FUTURE512));

            if (teoco.isFeatureOff(teoco.config.FeatureEnum.IOT_SENSORS,"IOT_SENSORS")) // DPPORANGE
                 return;


            getSensorArray();  // get the list of sensors and fill the dropdown.

            teoco.UIController.Debug.log("calling teoco.UIController.iot.iotInit()",2 );
            $("#iot-criteria-window-close").click(function () {
                 teoco.UIController.iot.hideCriteriaWindow();
            });

            // Fire when either the OK or Cancel button is hit...

            $(".iotc-button").click(function (event) {
                   teoco.UIController.Debug.log("iotc-button clicked.",2 );

                   var elementIdThatWasClicked = event.target.id;
                   // only if the OK button was clicked go and run the reports
                   if (elementIdThatWasClicked == "iotc-ok-button")
                   {
                       // todo : get the selected device

                       var selectedDeviceId =  $('#iotc-dropdown :selected').text();
                       var selectedDeviceIdVal = $('#iotc-dropdown :selected').val(); // we probably want to pass this one in when it is time.

                       if (reportToRun == 'SIM') // SIM Report
                       {

                            GenAndDownloadReport(selectedDeviceIdVal,"SIMSwapReport");

                       }
                       else  // Detailed RF Report
                       {
                            GenAndDownloadReport(selectedDeviceIdVal,"RfInfoReport");
                       }

                   }
                   teoco.UIController.iot.hideCriteriaWindow();  // hide the window either way
            });

    };


    this.showCriteriaWindow = function(report) {
        //$(".teoco-screen .iot-criteria-window").show();
        // window.debug_elem = $('#iot-criteria-window-close');
        // console.log(window.debug_elem);
        reportToRun = report;
        $(".iot-criteria-window").show();
    };

    this.showKpi = function(kpiName) {
        //$(".teoco-screen .iot-criteria-window").show();
        // window.debug_elem = $('#iot-criteria-window-close');
        // console.log(window.debug_elem);
        kpiNameSelected = kpiName;

        if (kpiName == 'RSRP') {
            var notify = teoco.UIController.Notifications.info("Rendering RSRP for device id " + 1, true);
            //hard code  plot raw(0) , kpi rsrp (0),device id = 1
            teoco.ds.DataStore.fetchIotKpi("1","0","1","","")
                .done(
                    function (jsonResponseFromService) {
                        teoco.map.Map.addIotMetricLayer("IoT-RSRP", jsonResponseFromService.plotId);
                        teoco.map.Map.zoomIntoLocation(jsonResponseFromService.longitude, jsonResponseFromService.latitude, 15);

                    })
                .fail(teoco.UIController.HttpErrorListener)
                .always(function () {
                    notify.close();
                });


        }
    };

    this.hideCriteriaWindow = function () {
            //$(".teoco-screen .iot-criteria-window").show();
            $(".iot-criteria-window").hide();
    };
});