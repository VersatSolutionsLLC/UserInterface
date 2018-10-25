/**
 * Created by Sowvik on 12-10-2018.
 */
(function ($) {


    var _type, _mapInstance;
    var _url = $.teoco.baseUrl + "/rest/data/metrics";
    $.teoco.Kpis = {};
    $.teoco.Kpis.TYPE = {
        "RSRP": "RSRP",
        "RSRQ": "RSRQ",
        "SINR": "SNR",
        "BLER": "BLER"
    };


    /**
     *
     * @type {Array.<{teoco.config.KpiType}>}
     * @private
     */
    var _legends = [];

    /**
     *
     * @param {} kpiType
     * @return {string}
     * @private
     */
    function _getPanel$(kpiType) {
        if (_legends.length > 1) {
            $(".legends .accordion .frame").removeClass("active");
            $(".legends .accordion .frame .content").hide();
        }
        return '<div class="frame active" data-kpi="' + kpiType.title + '">' +
            '   <div class="heading">' + kpiType.title +
            '   </div>' +
            '   <div class="content">' + _getKPILegendElement(kpiType) +
            '   </div>' +
            '</div>';
    }

    /**
     * Add/ Remove legends from GUI component
     * @param {}kpiType
     * @param {boolean} add
     * @private
     */
    function _refresh(kpiType, add) {

        if (add) {
            _appendElement(_getPanel$(kpiType));
        }
        else {
            _removeElement(kpiType);
        }
    }

    /**
     *
     * @param element
     * @private
     */
    function _appendElement(element) {
        var legends$ = $(".legends");
        legends$.show();
        legends$.find(".accordion").append(element);
    }

    function _removeElement(kpiType) {
        $(".legends .accordion .frame[data-kpi='" + kpiType.title + "']").remove();
    }

    /**
     * Add to legends
     * @param {*} kpiType
     */
    function _addLegend(kpiType) {
        if (_legends.indexOf(kpiType) >= 0) return;
        _legends.push(kpiType);
        _refresh(kpiType, true);
    }

    /**
     * Remove from legends
     * @param {*} kpiType
     */
    function _removeLegend(kpiType) {
        var index = _legends.indexOf(kpiType);
        if (index >= 0) {
            _legends.splice(index, 1);
            _refresh(kpiType, false);
        }
        if (!_legends.length) $(".legends").hide();
        else {

        }
    }

    /**
     * Remove all from legends
     */
    function _removeAllLegends() {
        for (var i = 0; i < _legends.length; ++i) {
            _refresh(_legends[i], false);
        }
        $(".legends").hide();
    }


    /**
     *
     * @param {$.teoco.KpiType.RSRP|$.teoco.KpiType.RSRQ|$.teoco.KpiType.SINR|$.teoco.KpiType.BLER} kpiType
     * @private
     */
    function _getKPILegendElement(kpiType) {
        var content = "";
        var stops = kpiType.stops;
        var percent, stop, color;
        for (var i = 0; i < stops.length; ++i) {
            stop = stops[i];
            color = stop.rgba.substring(0, 7); // remove alpha
            percent = stop.count != 0 && $.isNumeric(kpiType.totalCount) && kpiType.totalCount != 0 ? ((stop.count / kpiType.totalCount) * 100).toFixed(0) : 0;
            var min = kpiType.stops[i].min;
            var max = i == kpiType.stops.length - 1 ? kpiType.max : kpiType.stops[i + 1].min;
            if (kpiType.factor) {
                min = Math.round(min / kpiType.factor);
                max = Math.round(max / kpiType.factor);
            }
            var countTableRow = "";
            //todo: Make same changes for other types of legends (Icon or selectable)
            if (stop.count != null)
                countTableRow =
                    "   <td class='text' style='text-align: right' title='" + stop.count + " geobins'>" + stop.count + "</td>" +
                    "   <td class='text' title='" + percent + "% of total geobins'>" + "(" + percent + "%)</td>"
            content +=
                "<tr>" +
                "   <td class='color' style='background-color:" + color + "'></td>" +
                "   <td class='text'>" + min + " " + kpiType.unit + "</td>" +
                "   <td class='text'>" + (min != max ? "to " : "And ") + "</td>" +
                "   <td class='text'>" + (min != max ? max : "Above ") + " " + kpiType.unit + "</td>" +
                countTableRow +
                "</tr>";
        }

        content = "<table class='table'>" + content;
        content += "</table>";
        return content;
    }


    /**
     *
     * @param type
     * @param {Array<RadioInfo>}dataArray
     * @returns {Array}
     * @private
     */
    function _getMetricData(type, dataArray) {
        var __metricData = [];
        for (var i = 0; i < dataArray.length; ++i) {
            var data = dataArray[i];

            for(var j=0;j<data.Cells.length;++j){
                var cell = data.Cells[j];
                __metricData.push({lat: data.Gps.Lat, lon: data.Gps.Long, value: cell[type.toUpperCase()]})

            }
        }

        return __metricData;
    }

    /**
     *
     * @param {$.teoco.Kpis.TYPE} type
     */
    $.teoco.Kpis.onKpiSelect = function (type) {
        _type = type;

        var __deviceId = $.teoco.Layer.getSelectedDeviceId();
        _mapInstance = $.teoco.Map.getInstance();
        var __metricType = $.teoco.KpiType[type];

        //Remove all legends
        _removeAllLegends();

        //Remove all Kpis
        for (var kpiType in $.teoco.KpiType) {
            _mapInstance.removeKpiLayers(kpiType);
        }
        $.teoco.Utils.toast("Fetching " + type + " data..");
        if (!__deviceId) return;
        $.ajax(
            {
                url: _url,
                method: "POST",
                data: JSON.stringify({imei: __deviceId})
            }
            )
            .done(
                /**
                 *
                 * @param {Array.<RadioInfo>} dataArray
                 */
                function (dataArray) {

                ////TEMPORARY WILL CHANGE FOR ACTUAL DATA
                //var radioData = [];
                //for (var i = 0; i < dataArray.length; ++i) {
                //    var data = dataArray[i];
                //    data.LTE.imei = data.imei;
                //    data.LTE.imsi = data.imsi;
                //    data.LTE.temp = data.temp;
                //    data.LTE.timestamp = data.timestamp;
                //    data.LTE.lat = data.loc.lat;
                //    data.LTE.lon = data.loc.lon;
                //    radioData.push(data.LTE);
                //}


                $.teoco.Footer.addData(dataArray);
                _mapInstance.createBinMap(__metricType, _getMetricData(type.toUpperCase(), dataArray));
                _mapInstance.showKpiLayer(__metricType, true);
                _addLegend(__metricType);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                //failed to log out
            });
    };

    $(document).ready(function () {

        var __dataTable = $.teoco.Footer.getTable();
        __dataTable.on('search.dt', function () {
            _mapInstance.clearKpiLayer($.teoco.KpiType[_type]);
            _mapInstance.createBinMap($.teoco.KpiType[_type], _getMetricData(_type.toUpperCase(), __dataTable.rows({filter: 'applied'}).data()));
        });

    })
})($);