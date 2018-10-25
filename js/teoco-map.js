(function ($) {



    /**
     *
     * @constructor
     */
    $.teoco.Map = function () {
        var _map, _draggedInteraction, _SCALE;
        var _measurementLayer, _kpiHeatmaps = {};
        var PROJECTION_LAT_LONG = "EPSG:4326",
            PROJECTION_XY_METERS = "EPSG:900913",
            ANIMATION_DURATION = 1000;
        var _ROADS_BASEMAP_LAYER, _SAT_BASEMAP_LAYER, _SCALE_LINE_CONTROL;
        var _mapLoadEventHandlers = [];
        var _STYLE_DISTANCE_MEASUREMENT_STYLE = new ol.style.Style({
            fill: new ol.style.Fill({
                color: 'rgba(255, 255, 255, 0.2)'
            }),
            stroke: new ol.style.Stroke({
                color: 'rgba(0, 0, 0, 0.5)',
                lineDash: [10, 10],
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 5,
                stroke: new ol.style.Stroke({
                    color: 'rgba(0, 0, 0, 0.7)'
                }),
                fill: new ol.style.Fill({
                    color: 'rgba(255, 255, 255, 0.2)'
                })
            })
        });
        var _STYLE_DISTANCE_MEASUREMENT_LINESTYLE = new ol.style.Style({
            stroke: new ol.style.Stroke({color: 'blue', width: 2})
        });

        /**
         * @param {ol.Coordinate} location
         * @returns {ol.geom.Point}
         */
        function _createPoint(location) {
            return new ol.geom.Point(location);
        }


        /**
         * Check whether lat, lon and value of a kpi is valid or invalid
         * @param value
         * @param longitude
         * @param latitude
         * @return {boolean}
         * @private
         */
        function _isNotValidKPI(value, longitude, latitude) {
            var ignoreKpiMsg = "Ignoring KPI lon: " + longitude + ", lat: " + latitude + ", value: " + value + " with non-numeric ";
            var isNotValid = false;
            if (!$.isNumeric(value)) {
                ignoreKpiMsg += "value:" + value;
                isNotValid = true;
            }
            else if (!$.isNumeric(longitude)) {
                ignoreKpiMsg += "lon:" + longitude;
                isNotValid = true;
            }
            else if (!$.isNumeric(latitude)) {
                ignoreKpiMsg += "lat:" + latitude;
                isNotValid = true;
            }

            if (isNotValid) {
                console.warn(ignoreKpiMsg);
            }
            return isNotValid;
        }

        /**
         *
         * @param layer
         * @param callback
         * @private
         */
        function _showLayer(layer, callback) {
            if (!layer) {
                return;
            }

            if (layer.getVisible()) {
                // no need to do anything more. just call the callback.
                if (callback) callback(true);
                return;
            }

            // if layer is in visible range, and has features to draw in the current extent
            // then wait for 'render', else wait for 'change:visible'
            if (callback) {
                var mapResolution = _map.getView().getResolution();
                if (layer.getVisible()
                    && layer.getMinResolution() <= mapResolution && mapResolution <= layer.getMaxResolution()
                    && layer.getSource().getFeaturesInExtent(layer.getExtent()).length > 0) {
                    layer.once("render", function () {
                        callback(true);
                    });
                }
                else {
                    layer.once("change:visible", function () {
                        callback(true);
                    });
                }
            }
            setTimeout(function () {
                layer.setVisible(true);
            }, 100);
        }

        /**
         *
         * @param layer
         * @returns {boolean}
         * @private
         */
        function _hideLayer(layer) {
            if (!layer) return false;

            var layers = _map.getLayers().getArray();
            for (var i in layers) {
                if (layer == layers[i]) return true;
            }
            return false;

        }

        function _fitToBounds(bounds) {
            if (bounds) {
                _animateOnNextChange(_map, true, true);
                _map.getView().fit(bounds, _map.getSize());
            }
        }

        /**
         * this function is used to show or hide
         * the layer from the map
         *
         * @param {ol.layer.Vector} layer
         * @param {boolean} visibility
         * @param {function} [callback]
         */
        function _showLayerVisibility(layer, visibility, callback) {
            if (visibility) {
                _showLayer(layer, callback);
            } else {
                _hideLayer(layer);
            }
        }

        function _getScale(unit) {
            var scale;
            switch (unit) {
                case 'us':
                    scale = "meter";
                    break;
                case 'meter':
                    scale = "mile";
                    break;
            }
            return scale;
        }

        var BIN_STYLE_CACHE = {};

        function _getResolutionDependentLength(length, resolution) {
            return length / resolution;
        }


        function _getBinStyle(color, resolution) {
            var radius = 5;
            var key = color + radius;
            if (!BIN_STYLE_CACHE[key]) {
                var rgba = _colorStringToRgba(color);
                BIN_STYLE_CACHE[key] = new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({color: rgba}),
                        stroke: new ol.style.Stroke({color: rgba, width: 1}),
                        radius: radius
                    })
                });
            }
            return BIN_STYLE_CACHE[key];
        }

        function _BIN_STYLE_FUNCTION(feature, resolution) {
            var color = feature.rgba;
            return _getBinStyle(color, resolution);
        }

        function _colorStringToRgba(colorString) {
            return "rgba("
                + Number("0x" + colorString.substring(1, 3))
                + ","
                + Number("0x" + colorString.substring(3, 5))
                + ","
                + Number("0x" + colorString.substring(5, 7))
                + ","
                + Number("0x" + colorString.substr(7)) / 255
                + ")";
        }

        /**
         *
         * @returns {*}
         * @private
         */
        function _getUnit() {
            return _SCALE_LINE_CONTROL.getUnits();
        }

        /**
         *
         * @returns {*}
         * @private
         */
        function _getVisibleBaseLayer() {
            var layers = _getVisibleLayer();
            for (var i = 0; i < layers.length; ++i) {
                var properties = layers[i].getProperties();
                if (properties.type == $.teoco.Map.BASE_LAYERS.ROAD ||
                    properties.type == $.teoco.Map.BASE_LAYERS.SATELLITE) {
                    return properties.type
                }
            }
            return null;
        }

        /**
         *
         * @param bounds
         * @param location
         * @returns {*}
         * @private
         */
        function _extendBounds(bounds, location) {
            if (bounds) bounds = ol.extent.extend(bounds, new ol.extent.boundingExtent([location]));
            else bounds = new ol.extent.boundingExtent([location]);
            return bounds;
        }

        /**
         *
         * @param X
         * @param Y
         * @returns {*}
         * @private
         */
        function _createLocationFromXYMeters(X, Y) {
            return ol.proj.transform([X, Y], PROJECTION_XY_METERS, PROJECTION_LAT_LONG);
        }

        /**
         *
         * @param longitude
         * @param latitude
         * @returns {*}
         * @private
         */
        function _createLocationFromLongLat(longitude, latitude) {
            return ol.proj.transform([longitude, latitude], PROJECTION_LAT_LONG, PROJECTION_XY_METERS);
        }

        /**
         *
         * @param {ol.geom.LineString} line
         * @return {{text: string, number: number}}
         * @private
         */
        function _formatLength(line) {

            var length;

            var coordinates = line.getCoordinates();
            length = 0;
            for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
                var c1 = _createLocationFromXYMeters(coordinates[i][0], coordinates[i][1]);
                var c2 = _createLocationFromXYMeters(coordinates[i + 1][0], coordinates[i + 1][1]);
                length += ol.sphere.getDistance(c1, c2);
                //length += _WGS_84_Sphere.haversineDistance(c1, c2);
            }

            return {text: _getDistanceByUnit(length, _SCALE), number: length};
        }


        /**
         * Returns length measured by unit
         * @param {number} length
         * @param {string} unit
         * @returns {string}
         * @private
         */
        function _getDistanceByUnit(length, unit) {
            if (!$.isNumeric(length)) {
                return "ERROR";
            }
            switch (unit) {
                case "meter":
                    return length >= 1000 ? (length / 1000).toFixed(1) + " km" : (length).toFixed(1) + " m";
                case "mile":
                    return (length * 0.00062137).toFixed(1) + " miles";
            }
        }


        /**
         *
         * @param layer
         * @returns {boolean}
         * @private
         */
        function _hasLayer(layer) {
            if (!layer) return false;

            var layers = _map.getLayers().getArray();
            for (var i in layers) {
                if (layer == layers[i]) return true;
            }
            return false;
        }

        /**
         *
         * @param layer
         * @private
         */
        function _deleteLayer(layer) {
            if (_hasLayer(layer)) {
                _map.removeLayer(layer);
                layer = null;
            }
        }

        /**
         *
         * @param layer
         * @returns {*}
         * @private
         */
        function _isLayerVisible(layer) {
            return layer.getVisible();
        }

        /**
         *
         * @param layer
         * @param visibility
         * @private
         */
        function _addLayer(layer, visibility) {
            // insert just above the first "tile" layer
            if (visibility == false) layer.setVisible(false);
            _map.addLayer(layer);
        }

        /**
         *
         * @param {string} name
         * @param {ol.style.Style} style
         * @returns {{ol.layer.Vector}}
         * @private
         */
        function _createLayer(name, style) {

            name = name || "layer";
            var layer = new ol.layer.Vector({
                name: name,
                source: new ol.source.Vector({features: []})
            });

            if (style) {
                layer.setStyle(style);
            }

            return layer;

        }

        /**
         *
         * @param {ol.layer.Vector} measurementLayer
         * @param {boolean} isSingleSegment
         */
        function measurement(measurementLayer, isSingleSegment) {
            var interaction = measurementLayer.pointDrawInteraction;

            var _listener;
            var sketch;
            var output;
            interaction.on('drawstart',
                function (evt) {
                    //Reset tooltip css
                    measurementLayer.measureTooltipElement.className = '';
                    measurementLayer.measureTooltipElement.className = 'tooltip tooltip-measure';
                    //Clear layer for drawing
                    measurementLayer.getSource().clear();
                    /** @type {ol.Coordinate|undefined} */
                    var tooltipCoord = evt.coordinate;
                    sketch = evt.feature;
                    measurementLayer.deferredService.notify("continue");
                    _listener = sketch.getGeometry().on('change', function (evt) {
                        var geom = evt.target;
                        if (geom.getCoordinates().length > 2 && isSingleSegment) {
                            interaction.finishDrawing();
                        }

                        output = _formatLength(/** @type {ol.geom.LineString} */ geom);
                        tooltipCoord = geom.getLastCoordinate();
                        measurementLayer.measureTooltipElement.innerHTML = output.text;
                        measurementLayer.measureTooltip.setPosition(tooltipCoord);
                    });
                }, this);

            interaction.on('drawend',
                function (evt) {
                    measurementLayer.measureTooltipElement.className = 'tooltip tooltip-static';
                    measurementLayer.measureTooltip.setOffset([0, -7]);
                    measurementLayer.deferredService.notify(output.number);

                    sketch = null;

                    ol.Observable.unByKey(_listener);
                }, this);
        }

        /**
         *
         * @param usePan
         * @param useZoom
         * @private
         */
        function _animateOnNextChange(usePan, useZoom) {
            var animations = {duration: ANIMATION_DURATION};
            var view = _map.getView();
            if (usePan) animations.center = _map.getView().getCenter();
            if (useZoom) animations.resolution = _map.getView().getResolution();
            view.animate(animations);

        }


        /**
         *
         * @param isZoomIn
         * @param delta
         * @private
         */
        function _toggleZoom(isZoomIn, delta) {
            if (!(typeof (delta) == "number"))
                delta = 1;
            var view = _map.getView();
            _animateOnNextChange(_map, false, true);
            var currentResolution = view.getResolution();
            var newResolution;
            if (isZoomIn) newResolution = view.constrainResolution(currentResolution, delta);
            else newResolution = view.constrainResolution(currentResolution, -delta);
            view.setResolution(newResolution);
        }

        function _getVisibleLayer() {
            var layers = [].concat(_map.getLayers().getArray());
            for (var i = 0; i < layers.length; ++i) {
                if (!_isLayerVisible(layers[i])) {
                    layers.splice(i, 1);
                }
            }
            return layers;
        }

        /**
         *
         * @param {$.teoco.Map.BASE_LAYERS}visibleBaseLayer
         * @param {string} scale
         * @private
         */
        function _dispatchMapLoadEvent(visibleBaseLayer, scale) {
            for (var i = 0; i < _mapLoadEventHandlers.length; ++i) {
                _mapLoadEventHandlers[i].call(this, visibleBaseLayer, scale);
            }
        }

        /**
         * Adds a "binmapStops" Array of {min, style} to the layer
         * min: fraction between 0 to 1,
         * rgba: ol.style.Style with appropriate fill color
         */
        function _createBinLayer(name, stops) {
            var layer = new ol.layer.Vector({
                name: name,
                source: new ol.source.Vector({features: []}),
                // maxResolution: 9,
                opacity: 0.7
            });

            var binmapStops = [];
            for (var i = 0; i < stops.length; ++i) {
                var stop = stops[i].stop;
                var color = stops[i].rgba;
                var icon = stops[i].icon;
                var rgba = "rgba("
                    + Number("0x" + color.substring(1, 3))
                    + ","
                    + Number("0x" + color.substring(3, 5))
                    + ","
                    + Number("0x" + color.substring(5, 7))
                    + ","
                    + Number("0x" + color.substr(7)) / 255
                    + ")";

                binmapStops.push({
                    min: stop,
                    rgba: color
                });

            }

            layer.set("binmapStops", binmapStops);
            layer.setStyle(_BIN_STYLE_FUNCTION);
            return layer;
        }


        function _addBinLayerValue(baseLayer, location, fractionValue, kpiBin) {
            // find stop for the value
            var heatmapStops = baseLayer.get("binmapStops");
            var stop = heatmapStops[0];
            for (var i = heatmapStops.length - 1; i >= 0; i--) {
                if (fractionValue >= heatmapStops[i].min) {
                    stop = heatmapStops[i];
                    break;
                }
            }
            // add bin
            var binFeature = new ol.Feature({
                geometry: _createPoint(location)
            });
            // set fill color using stop
            //binFeature.setStyle(stop.fillStyle);
            binFeature.kpiBin = kpiBin;
            binFeature.rgba = stop.rgba;
            baseLayer.getSource().addFeature(binFeature);
            return stop.rgba;
        }


        $(window).resize($.teoco.Map.updateSize);


        /**
         * Zoom out
         * @param delta
         */
        this.zoomIn = function (delta) {
            _toggleZoom(true, delta);
        };


        /**
         * Zoom in
         * @param delta
         */
        this.zoomOut = function (delta) {
            _toggleZoom(false, delta);
        };


        /**
         * Update map, Required if map container resized.
         */
        this.updateSize = function () {
            if (!_map) {
                console.error("Map is not created yet!");
                return;
            }
            _map.updateSize();
        };

        /**
         * Convert longitude and latitude to Projection XY
         * @param {number}longitude
         * @param {number}latitude
         * @returns {*}
         */
        this.createLocationFromLongLat = function (longitude, latitude) {
            return _createLocationFromLongLat(longitude, latitude);
        };


        this.addMapLoadEventHandler = function (handler) {
            _mapLoadEventHandlers.push(handler);
        };

        /**
         *
         * @param divId
         */
        this.create = function (divId) {
            if (_map) return;

            var OL_3D, DEFAULT_VIEW_ANGLE = 20;
            var _BINGMAP_KEY = "Z34ysqDzSDVTwuqlqW2z~3NNE22ykhXWAjA9kv3kPcw~AoBMNFZGavJM75LeF-dSmHIDkMCUioBt2jG3z9eYNF2aI62SgfLaorAuB5MYZikJ";
            $("#" + divId).resize(this.updateSize);
            //.parent(".stack-child, .stack-child-fit-to-parent").resize(this.updateSize);
            _ROADS_BASEMAP_LAYER = new ol.layer.Tile({
                source: new ol.source.OSM(),
                name: "Road Layer",
                type: $.teoco.Map.BASE_LAYERS.ROAD,
                zIndex: 0
            });
            _SAT_BASEMAP_LAYER = new ol.layer.Tile({
                source: new ol.source.BingMaps({
                    imagerySet: 'Aerial',
                    key: _BINGMAP_KEY
                }),
                name: "Satelite Layer",
                type: $.teoco.Map.BASE_LAYERS.SATELLITE,
                zIndex: 0
            });
            _SAT_BASEMAP_LAYER.setVisible(false);

            _SCALE_LINE_CONTROL = new ol.control.ScaleLine();
            _SCALE_LINE_CONTROL.setUnits('us');
            _map = new ol.Map({
                target: divId,
                view: new ol.View({
                    center: this.createLocationFromLongLat(0, 0),
                    zoom: 2,
                    maxZoom: 19 // we do not want to allow zooming closer than this
                }),
                layers: [_SAT_BASEMAP_LAYER, _ROADS_BASEMAP_LAYER],
                controls: ol.control.defaults({attribution: false, zoom: false, rotate: false}).extend([
                    _SCALE_LINE_CONTROL
                ]),
                interactions: ol.interaction.defaults({shiftDragZoom: false})
            });
            _SCALE = _getScale(_getUnit());
            _dispatchMapLoadEvent(_getVisibleBaseLayer(), _SCALE);
            /* if (!OL_3D) {
             OL_3D = new olcs.OLCesium({map: map});
             OL_3D.getCesiumScene().terrainProvider = new Cesium.CesiumTerrainProvider({
             url: 'https://assets.agi.com/stk-terrain/world'
             });

             //Disabled 3D Default
             OL_3D.setEnabled(false);
             }*/
        };


        /**
         * Toggle between Satellite view and Road view
         * @param {boolean} showRoads Show Road view.
         * @param {boolean} showSatellite Show satellite view.
         */
        this.refreshBasemap = function (showRoads, showSatellite) {
            _ROADS_BASEMAP_LAYER.setVisible(showRoads);
            _SAT_BASEMAP_LAYER.setVisible(!showRoads && showSatellite);
        };

        /**
         * Enable/Disable dragged zoom on map
         * @param {boolean} enable
         */
        this.draggedZoom = function (enable) {

            if (!_draggedInteraction)
                _draggedInteraction = new ol.interaction.DragZoom({
                    condition: ol.events.condition.always
                });
            if (enable == true) {
                _map.addInteraction(_draggedInteraction);
            }
            else {
                _map.removeInteraction(_draggedInteraction);
                _draggedInteraction = null;
            }
        };

        this.changeDistanceUnit = function (distance, unit) {
            if (!_map) {
                console.error("Map is not created yet!");
                return;
            }
            if (_measurementLayer) {
                _measurementLayer.measureTooltipElement.innerHTML = getDistanceByUnit(distance, unit);
            } else {
                console.error("No Measurement Layer!");
            }
        };

        this.distanceMeasurement = function (enable, isSingleSegment) {

            if (!_measurementLayer) {
                _measurementLayer = _createLayer("MEASUREMENT", _STYLE_DISTANCE_MEASUREMENT_LINESTYLE);
                _addLayer(_measurementLayer, true);
            }

            if (!_measurementLayer.pointDrawInteraction) {
                _measurementLayer.deferredService = $.Deferred();
                _measurementLayer.pointDrawInteraction = new ol.interaction.Draw({
                    source: _measurementLayer.getSource(),
                    type: /** @type {ol.geom.GeometryType} */ ('LineString'),
                    style: _STYLE_DISTANCE_MEASUREMENT_STYLE,
                    minPoints: 2
                });

                if (_measurementLayer.measureTooltipElement) {
                    _measurementLayer.measureTooltipElement.parentNode.removeChild(_measurementLayer.measureTooltipElement);
                }
                _measurementLayer.measureTooltipElement = document.createElement('div');
                _measurementLayer.measureTooltipElement.className = 'tooltip tooltip-measure';
                _measurementLayer.measureTooltip = new ol.Overlay({
                    element: _measurementLayer.measureTooltipElement,
                    offset: [0, -15],
                    positioning: 'bottom-center'
                });
                measurement(_measurementLayer, isSingleSegment)
            }
            if (enable) {
                _map.addInteraction(_measurementLayer.pointDrawInteraction);
                _map.addOverlay(_measurementLayer.measureTooltip);
                _measurementLayer.deferredService.notify("start");
            }
            else {
                _map.removeInteraction(_measurementLayer.pointDrawInteraction);
                _map.removeOverlay(_measurementLayer.measureTooltip);
                delete _measurementLayer.measureTooltip;
                delete  _measurementLayer.pointDrawInteraction;
                _measurementLayer.deferredService.resolve();

                _deleteLayer(_measurementLayer);
            }
            return _measurementLayer.deferredService.promise();
        };

        /**
         *
         * @param unit
         */
        this.setMapScaleLine = function (unit) {
            var scaleUnit = 'us';
            switch (unit) {
                case 'mile':
                    _SCALE = "mile";
                    scaleUnit = 'us';
                    break;
                case 'meter':
                    _SCALE = "meter";
                    scaleUnit = 'metric';
                    break;
            }
            _SCALE_LINE_CONTROL.setUnits(scaleUnit);
        };
        /**
         *
         * @param {KpiType}kpiType
         * @param {Array.<{lat:number, lon:number, value:number}>}kpiValues
         */
        this.createBinMap = function (kpiType, kpiValues) {
            var layerName = kpiType.title + "-" + "BIN";

            if (!_kpiHeatmaps[layerName]) {
                _kpiHeatmaps[layerName] = {
                    name: layerName,
                    type: "BIN",
                    kpiType: kpiType
                }
            }
            var kpiHeatmap = _kpiHeatmaps[layerName];

            if (!kpiHeatmap.layer) {
                kpiType.stops.sort(function (a, b) {
                    return a.min - b.min
                });

                var min = kpiType.stops[0].min;
                var range = kpiType.max - min;

                var stops = [];
                for (var i = 0; i < kpiType.stops.length; ++i) {
                    var fraction = (kpiType.stops[i].min - min) / range;
                    var icon;
                    stops.push({stop: fraction, rgba: kpiType.stops[i].rgba});

                }

                kpiHeatmap.layer = _createBinLayer(layerName, stops);
                _addLayer(kpiHeatmap.layer, false, false);
            }

            for (var i = 0; i < kpiValues.length; ++i) {
                var value = kpiValues[i].value;
                var longitude = kpiValues[i].lon;
                var latitude = kpiValues[i].lat;

                if (_isNotValidKPI(value, longitude, latitude)) return;

                var valueFraction = (value - min) / range;
                var location = _createLocationFromLongLat(longitude, latitude);
                var kpiBin = {type: kpiType, longitude: longitude, latitude: latitude, value: value};
                var key = _addBinLayerValue(kpiHeatmap.layer, location, valueFraction, kpiBin);
                kpiHeatmap.bounds = _extendBounds(kpiHeatmap.bounds, location);
            }

        };
        this.showKpiLayer = function (kpiType, fitToBounds) {
            var layerName = kpiType.title + "-" + "BIN";
            var heatmap = _kpiHeatmaps[layerName];
            if (!heatmap) return null;

            this.hideKpiLayer(kpiType);
            if (heatmap.layer) {
                _showLayerVisibility(heatmap.layer, true);
            }
            if (fitToBounds) _fitToBounds(heatmap.bounds);
        };


        this.hideKpiLayer = function (kpiType) {
            var layerName = kpiType.title + "-" + "BIN";
            var heatmap = _kpiHeatmaps[layerName];
            if (heatmap) {
                _showLayerVisibility(heatmap.layer, false);
            }
        };

        this.clearKpiLayer = function(kpiType){
            var layerName = kpiType.title + "-" + "BIN";
            var heatmap = _kpiHeatmaps[layerName];
            if (heatmap) {
                heatmap.layer.getSource().clear();
            }
        };

        this.removeKpiLayers = function(kpiType){
            var layerName = kpiType.title + "-" + "BIN";
            var heatmap = _kpiHeatmaps[layerName];
            if (heatmap) {
                _deleteLayer(heatmap.layer)
            }
        };

        this.getLayers = function () {
            return _getVisibleLayer();
        };

    };

    //TEST

    $.teoco.Map.TestKpiBinMap = function () {

        var opacity = "B0";

        var kpiType = {
            title: "RSRP",
            unit: "dBm",
            stops: [
                {min: -140, rgba: "#FF0000" + opacity, count: null},
                {min: -110, rgba: "#FF5500" + opacity, count: null},
                {min: -100, rgba: "#FFAA00" + opacity, count: null},
                {min: -90, rgba: "#FFFF00" + opacity, count: null},
                {min: -80, rgba: "#AAFF00" + opacity, count: null},
                {min: -70, rgba: "#55FF00" + opacity, count: null},
                {min: -60, rgba: "#00FF00" + opacity, count: null}
            ],
            max: -30,
            clusterDistance: 40

        };

        var points = [];
        var lat = 21.91, lon = 82.780000;

        for (var i = 0; i < kpiType.stops.length; ++i) {

            points.push({lat: lat, lon: lon, value: kpiType.stops[i].min});
            lat += 0.01;

        }
        for (var i = 0; i < kpiType.stops.length; ++i) {
            points.push({lat: lat, lon: lon, value: kpiType.stops[i].min});
            lon += 0.01;
        }


        $.teoco.Map.getInstance().createBinMap(kpiType, points);
        $.teoco.Map.getInstance().showKpiLayer(kpiType, true);

    };

    var _mapInstance;
    $.teoco.Map.BASE_LAYERS = Object.freeze({
        SATELLITE: 0,
        ROAD: 1
    });

    $.teoco.Map.getInstance = function () {
        if (_mapInstance) return _mapInstance;
        _mapInstance = new $.teoco.Map();
        _mapInstance.create("map");
        return _mapInstance;
    };
})
($);