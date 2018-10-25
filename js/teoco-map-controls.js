/**
 * Created by Sowvik on 04-10-2018.
 */
(function ($) {
    $.teoco.Map.Controls = {};
    var _distance, _mapInstance;
    var _$zoomIn, _$zoomOut, _$draggedZoom, _$distance, _$layer, _$distanceMeasurement;

    function _onLayerSwitch(event) {
        var layer = $(event.target).data("type");
        if (layer == "sat") {
            _mapInstance.refreshBasemap(false, true);
        } else if (layer == "str") {
            _mapInstance.refreshBasemap(true, false);
        }
    }

    function _onDistanceUnitChange(event) {
        var unit = $(event.target).data("type");
        _mapInstance.setMapScaleLine(unit);

    }

    function _onDistanceMeasurement() {
        _$distanceMeasurement.toggleClass("selected");
        _mapInstance.distanceMeasurement(!!_$distanceMeasurement.hasClass("selected"), true);
    }


    function _draggedZoom() {
        _$draggedZoom.toggleClass("selected");
        _mapInstance.draggedZoom(!!_$draggedZoom.hasClass("selected"));
    }



    $(document).ready(function () {
        _mapInstance = $.teoco.Map.getInstance();
        _mapInstance.addMapLoadEventHandler(
            /**
             *
             * @param {$.teoco.Map.BASE_LAYERS} visibleLayer
             * @param {string}scale
             */
            function (visibleLayer, scale) {
                if (visibleLayer == $.teoco.Map.BASE_LAYERS.SATELLITE) {
                    _$layer.find("input[data-type=sat]").not(':checked').prop("checked", true);
                }
                else if (visibleLayer == $.teoco.Map.BASE_LAYERS.ROAD) {
                    _$layer.find("input[data-type=str]").not(':checked').prop("checked", true);
                }
                if (scale == "metric")
                    _$distance.find("input[data-type=meter]").not(':checked').prop("checked", true);
                else if (scale == "us")
                    _$distance.find("input[data-type=mile]").not(':checked').prop("checked", true);

            });

        _$zoomIn = $("#zoomIn");
        _$zoomOut = $("#zoomOut");
        _$draggedZoom = $("#draggedZoom");
        _$distance = $("#distance");
        _$distanceMeasurement = $("#distanceMeasurement");
        _$layer = $("#layer");

        _$zoomIn.click(_mapInstance.zoomIn);
        _$zoomOut.click(_mapInstance.zoomOut);
        _$draggedZoom.click(_draggedZoom);
        _$layer.find("input").change(_onLayerSwitch);
        _$distance.find("input").change(_onDistanceUnitChange);
        _$distanceMeasurement.click(_onDistanceMeasurement);
    });
})($);