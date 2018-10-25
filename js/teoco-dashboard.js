/**
 * Created by Sowvik on 09-10-2018.
 */
(function ($) {
    /**
     * @typedef {{}} TileOptions
     * @property {string} [label]
     * @property {string} [icon]
     * @property {Array.<number>} [thresholds] [ok,warn,error] where
     * ok < warn < error or  ok > warn > error, with at least 2 of the 3
     * provided. Otherwise, no levels are set. All the thresholds are inclusive,
     * i.e. WARN level is set even when equal to the warn threshold.
     * @property {string} [description] An optional tile description. Should
     * be small enough to fit in the tile size.
     * @property {string|number} [value] Initial value.
     * @property {$.teoco.Dashboard.Tile.Size} [size=$.teoco.Dashboard.Tile.Size.DEFAULT]
     * @property {function()} [onSelect] Handler to be called when this tile
     * is selected.
     * @property {[]} [sidePanel] [selector:string, onShowCallback:function()]
     * @property {[]} [footerPanel] [selector:string, onShowCallback:function()]
     * @property {string|function(data):string} [update] To update the tile's value.
     * If string, it denotes the name of the property of the data set in the parent
     * dashboard. If function, the data is passed as an argument and value returned
     * is set in the tile.
     */

    /**
     *
     * @param {string} tileGrpSelector The selector for the dashboard ".tile-group".
     * that will be populated by the tiles.
     * @param {Array.<TileOptions>} tiles
     * @param {{}} [options]
     * @param {string} [options.groupSidePanel]
     * @param {string} [options.groupFooterPanel]
     * @param {function($.teoco.Dashboard.Dashboard)} [options.onReady]
     * @param {function($.teoco.Dashboard.Dashboard)} [options.onShow]
     * @param {function($.teoco.Dashboard.Dashboard)} [options.onHide]
     * @param {function($.teoco.Dashboard.Dashboard, {})} [options.onUpdate]
     * @constructor
     */
    $.teoco.Dashboard = function (tileGrpSelector, tiles, options) {
        function _isValidStr(str) {
            return str && (typeof str === "string" || str instanceof String) && str.trim() && str.trim().length;
        }

        function _isFunction(fn) {
            return fn && (typeof fn === "function" || fn instanceof Function);
        }

        function _selectorExists(s) {
            return _isValidStr(s) && $(s).length;
        }

        if (!_selectorExists(tileGrpSelector) || !$(tileGrpSelector).is(".tile-group")) {
            throw "Invalid Dashboard element: " + tileGrpSelector;
        }

        if (!tiles || !tiles.length) {
            throw "No tiles defined!";
        }

        var _instance = this;
        options = options || {};

        /**
         * @type {$.teoco.Dashboard.TilesGroup}
         */
        var _tilesGroup;

        var _allTileSidePanels, _allTileFooterPanels;

        function _showDashboard() {
            $(tileGrpSelector).show();
            //teoco.UIController.Sidebar.setVisibility($(options.groupSidePanel).show().length);
            //teoco.UIController.Footer.setVisibility($(options.groupFooterPanel).show().length);
            if (options.onShow) options.onShow(_instance);
        }

        function _hideDashboard(nextFn) {
            $(tileGrpSelector).hide();
            var i = 2;

            function _next(panels) {
                return function () {
                    $(panels).hide();
                    if (--i == 0) {
                        if (nextFn) nextFn();
                        if (options.onHide) options.onHide(_instance);
                    }
                }
            }

            //teoco.UIController.Sidebar.close(_next(_allTileSidePanels));
            //teoco.UIController.Footer.close(_next(_allTileFooterPanels));
        }

        _tilesGroup = new $.teoco.Dashboard.TilesGroup(tileGrpSelector);
        _tilesGroup.clear();

        /**
         * @type {Array.<string>}
         */
        var allSidePanelSelectors = [], allFooterPanelSelectors = [];

        /**
         * @param {TileOptions} tileOptions
         * @private
         */
        function _addTile(tileOptions) {
            var sidePanelSelector, footerPanelSelector;
            var sidePanelShowCallback, footerPanelShowCallback;
            if (Array.isArray(tileOptions.sidePanel) && _selectorExists(sidePanelSelector = tileOptions.sidePanel[0])) {
                allSidePanelSelectors.push(sidePanelSelector);
                sidePanelShowCallback = tileOptions.sidePanel[1];
            }
            if (Array.isArray(tileOptions.footerPanel) && _selectorExists(footerPanelSelector = tileOptions.footerPanel[0])) {
                allFooterPanelSelectors.push(footerPanelSelector);
                footerPanelShowCallback = tileOptions.footerPanel[1];
            }
            if (sidePanelShowCallback || footerPanelShowCallback) {
                var existingOnSelect = tileOptions.onSelect;
                tileOptions.onSelect = (function (existingOnSelect, sidePanelSelector, sidePanelCallback, footerPanelSelector, footerPanelCallback) {
                    return function () {
                        _tilesGroup.hide(function () {
                            _hideDashboard(function () {
                                var remaining = 2;

                                function _next(nextFn) {
                                    if (nextFn) nextFn();
                                    return function () {
                                        if (--remaining == 0) {
                                            if (existingOnSelect) existingOnSelect();
                                        }
                                    }
                                }

                                var panel$;
                                if (sidePanelSelector && (panel$ = $(sidePanelSelector)).length) {
                                    panel$.show();
                                    //teoco.UIController.Sidebar.show({onComplete: _next(sidePanelCallback)});
                                }
                                if (footerPanelSelector && (panel$ = $(footerPanelSelector)).length) {
                                    panel$.show();
                                    //teoco.UIController.Footer.show({onComplete: _next(footerPanelCallback)});
                                }
                            })
                        });
                    }
                })(existingOnSelect, sidePanelSelector, sidePanelShowCallback, footerPanelSelector, footerPanelShowCallback);
            }
            _tilesGroup.add(new $.teoco.Dashboard.Tile(tileOptions));
        }

        for (var i = 0; i < tiles.length; ++i) _addTile(tiles[i]);
        _allTileSidePanels = allSidePanelSelectors.join(",");
        _allTileFooterPanels = allFooterPanelSelectors.join(",");

        /**
         * @return {$.teoco.Dashboard.TilesGroup}
         */
        this.getTilesGroup = function () {
            return _tilesGroup;
        };

        /**
         * Called from the fluent menu.
         * @param {boolean} show
         */
        this.setVisibility = function (show) {
            if (show) _showDashboard();
            else _hideDashboard();

            if (!_tilesGroup) return;
            if (show) _tilesGroup.show();
            else _tilesGroup.hide();
        };

        /**
         * @type {{}}
         */
        var _data;

        /**
         * @param {{}} data
         * @param {boolean} [animate=false]
         */
        this.update = function (data, animate) {
            _data = data;
            /**
             * @type {TileOptions}
             */
            var tileOptions;
            /**
             * @type {$.teoco.Dashboard.Tile}
             */
            var tile;
            for (var i = 0; i < _tilesGroup.getTiles().length; ++i) {
                tile = _tilesGroup.getTiles()[i];
                tileOptions = tiles[i];
                if (_isValidStr(tileOptions.update)) {
                    tile.setValue(data[tileOptions.update.trim()]);
                }
                else if (_isFunction(tileOptions.update)) {
                    tile.setValue(tileOptions.update(data));
                }
            }
            if (animate) _tilesGroup.hide(_tilesGroup.show);
            if (options.onUpdate) options.onUpdate(_instance, data);
        };

        if (options.onReady) options.onReady(_instance);

    };
    /**
     * @enum {string}
     */
    $.teoco.Dashboard.Level = {
        NONE: "bg-cyan fg-white",
        OK: "bg-green fg-white",
        WARN: "bg-amber fg-white",
        ERROR: "bg-red fg-white"
    };

    /**
     * @param {{}} options
     * @param {string} [options.label]
     * @param {string} [options.icon]
     * @param {Array.<number>} [options.thresholds] [ok,warn,error] where
     * ok < warn < error or  ok > warn > error, with at least 2 of the 3
     * provided. Otherwise, no levels are set. All the thresholds are inclusive,
     * i.e. WARN level is set even when equal to the warn threshold.
     * @param {string} [options.description] An optional tile description. Should
     * be small enough to fit in the tile size.
     * @param {string|number} [options.value] Initial value.
     * @param {$.teoco.Dashboard.Tile.Size} [options.size=$.teoco.Dashboard.Tile.Size.DEFAULT]
     * @param {function($.teoco.Dashboard.Tile)} [options.onSelect] Handler to be called when this tile
     * is selected.
     * @constructor
     */
    $.teoco.Dashboard.Tile = function (options) {

        var _instance = this;
        options = options || {};

        /**
         * @type {jQuery}
         */
        var _elem$;

        /**
         * @type {$.teoco.Dashboard.Level}
         */
        var _level = $.teoco.Dashboard.Level.NONE;

        /**
         * @type {string}
         */
        var _label = options.label || "";

        /**
         * @type {string}
         */
        var _description = options.description;

        /**
         * @type {string}
         */
        var _icon;

        /**
         * @type {string}
         */
        var _iconTxt;

        var m = options.icon ? options.icon.match(/^\s*([^,]+)\s*,\s*(.*)/) : undefined;
        if (m) {
            _icon = m[1];
            _iconTxt = m[2];
        } else {
            _icon = options.icon;
        }

        /**
         * @type {string|number}
         */
        var _val;

        var _thresholdDirectionASC;
        var _thresholds = {};

        if (Array.isArray(options.thresholds) && options.thresholds.length > 1) {
            var threshold = parseFloat(options.thresholds[0]);
            if (!isNaN(threshold) && isFinite(threshold)) {
                _thresholds[$.teoco.Dashboard.Level.OK] = Math.round(threshold);
            }
            threshold = parseFloat(options.thresholds[1]);
            if (!isNaN(threshold) && isFinite(threshold)) {
                _thresholds[$.teoco.Dashboard.Level.WARN] = Math.round(threshold);

                if (!isNaN(_thresholds[$.teoco.Dashboard.Level.OK])) {
                    if (_thresholds[$.teoco.Dashboard.Level.OK] == _thresholds[$.teoco.Dashboard.Level.WARN]) {
                        throw "Invalid thresholds with same values: " + JSON.stringify(options.thresholds);
                    }

                    _thresholdDirectionASC = _thresholds[$.teoco.Dashboard.Level.OK] < _thresholds[$.teoco.Dashboard.Level.WARN];
                }
            }
            else if (!isNaN(_thresholds[$.teoco.Dashboard.Level.OK])) {
                throw "Invalid thresholds, should have at least 2 thresholds: " + JSON.stringify(options.thresholds);
            }
            threshold = parseFloat(options.thresholds[2]);
            if (!isNaN(threshold) && isFinite(threshold)) {
                _thresholds[$.teoco.Dashboard.Level.ERROR] = Math.round(threshold);

                if (_thresholdDirectionASC == undefined) {
                    if (_thresholds[$.teoco.Dashboard.Level.OK] == _thresholds[$.teoco.Dashboard.Level.ERROR] || _thresholds[$.teoco.Dashboard.Level.WARN] == _thresholds[$.teoco.Dashboard.Level.ERROR]) {
                        throw "Invalid thresholds with same values: " + JSON.stringify(options.thresholds);
                    }

                    if (!isNaN(_thresholds[$.teoco.Dashboard.Level.OK])) {
                        _thresholdDirectionASC = _thresholds[$.teoco.Dashboard.Level.OK] < _thresholds[$.teoco.Dashboard.Level.ERROR];
                    }
                    else if (!isNaN(_thresholds[$.teoco.Dashboard.Level.WARN])) {
                        _thresholdDirectionASC = _thresholds[$.teoco.Dashboard.Level.WARN] < _thresholds[$.teoco.Dashboard.Level.ERROR];
                    }

                }

                else if (!isNaN(_thresholds[$.teoco.Dashboard.Level.OK])) {
                    if (_thresholds[$.teoco.Dashboard.Level.OK] == _thresholds[$.teoco.Dashboard.Level.ERROR]) {
                        throw "Invalid thresholds, same OK & ERROR: " + JSON.stringify(options.thresholds);
                    }
                    if (_thresholdDirectionASC != _thresholds[$.teoco.Dashboard.Level.OK] < _thresholds[$.teoco.Dashboard.Level.ERROR]) {
                        throw "Invalid thresholds with no specific numeric order: " + JSON.stringify(options.thresholds);
                    }
                }

                else if (!isNaN(_thresholds[$.teoco.Dashboard.Level.WARN])) {
                    if (_thresholds[$.teoco.Dashboard.Level.WARN] == _thresholds[$.teoco.Dashboard.Level.ERROR]) {
                        throw "Invalid thresholds, same WARN & ERROR: " + JSON.stringify(options.thresholds);
                    }
                    if (_thresholdDirectionASC != _thresholds[$.teoco.Dashboard.Level.WARN] < _thresholds[$.teoco.Dashboard.Level.ERROR]) {
                        throw "Invalid thresholds with no specific numeric order: " + JSON.stringify(options.thresholds);
                    }
                }
            }
            else if (!isNaN(_thresholds[$.teoco.Dashboard.Level.OK]) || !isNaN(_thresholds[$.teoco.Dashboard.Level.WARN])) {
                throw "Invalid thresholds, should have at least 2 thresholds: " + JSON.stringify(options.thresholds);
            }
        }

        /**
         * @param {number} value
         * @param {$.teoco.Dashboard.Level} level
         * @private
         */
        function _hasCrossedLevel(value, level) {
            var t = _thresholds[level];
            return t != undefined && ((_thresholdDirectionASC && value >= t) || (!_thresholdDirectionASC && value <= t));
        }

        /**
         * @return {$.teoco.Dashboard.Level}
         */
        this.getLevel = function () {
            return _level;
        };

        /**
         * @param {$.teoco.Dashboard.Level} level
         * @private
         */
        this.setLevel = function (level) {
            if (_elem$ && _level) _elem$.removeClass(_level);
            _level = level || $.teoco.Dashboard.Level.NONE;
            if (_elem$) _elem$.switchClass("", _level, 1000, "easeInOutQuad");
        };

        /**
         * @return {string|number}
         */
        this.getValue = function () {
            return _val;
        };

        /**
         *
         * @param {string|number} value
         */
        this.setValue = function (value) {
            _val = value;
            if (_val == undefined) _val = "...";
            if (!_elem$) return;

            if (!_icon || !_icon.length) _elem$.find("span.icon").html(_val);
            else _elem$.find("span.tile-badge").html(_val).show();

            var v = Math.round(parseFloat(_val));

            if (isNaN(v) || !isFinite(v)) {
                this.setLevel($.teoco.Dashboard.Level.NONE);
            }

            else if (_hasCrossedLevel(v, $.teoco.Dashboard.Level.ERROR)) {
                this.setLevel($.teoco.Dashboard.Level.ERROR);
            }
            else if (_hasCrossedLevel(v, $.teoco.Dashboard.Level.WARN)) {
                this.setLevel($.teoco.Dashboard.Level.WARN);
            }
            else if (_hasCrossedLevel(v, $.teoco.Dashboard.Level.OK)) {
                this.setLevel($.teoco.Dashboard.Level.OK);
            }
            else {
                this.setLevel($.teoco.Dashboard.Level.NONE);
            }
        };

        /**
         * @return {string}
         */
        this.getDescription = function () {
            return _description;
        };

        /**
         * @param {string} description
         */
        this.setDescription = function (description) {
            _description = description;
        };

        /**
         * @private
         */
        this._get$ = function () {
            if (_elem$) _elem$.remove();

            var html =
                '<div class="tile-' + (options.size || $.teoco.Dashboard.Tile.Size.DEFAULT) + ' ' + _level + '" data-role="tile" style="opacity: 0; -webkit-transform: scale(.8); transform: scale(.8);">' +
                ' <div class="tile-content slide-up iconic">' +
                '     <span class="icon ' + (_icon || "") + '">';
            if (_iconTxt && _iconTxt.length) html +=
                '<span class="text-small">' + (_iconTxt || "") + '</span>';
            html +=
                '     </span>';
            if (_icon && _icon.length) html +=
                '     <span class="tile-badge bg-darkBrown fg-white">' + _val + '</span>';
            html +=
                '     <span class="tile-label text-shadow">' + _label + '</span>';

            if (Object.keys(_thresholds).length) {
                var levels = "";
                var sign = _thresholdDirectionASC ? " >= " : " <= ";
                if (!isNaN(_thresholds[$.teoco.Dashboard.Level.OK])) levels +=
                    '<span style=\'padding-left: 3px; padding-right: 3px;\' class=\'' + $.teoco.Dashboard.Level.OK + '\'>OK if' + sign + _thresholds[$.teoco.Dashboard.Level.OK] + '</span><br/><br/>';
                if (!isNaN(_thresholds[$.teoco.Dashboard.Level.WARN])) levels +=
                    '<span style=\'padding-left: 3px; padding-right: 3px;\' class=\'' + $.teoco.Dashboard.Level.WARN + '\'>WARN if' + sign + _thresholds[$.teoco.Dashboard.Level.WARN] + '</span><br/><br/>';
                if (!isNaN(_thresholds[$.teoco.Dashboard.Level.ERROR])) levels +=
                    '<span style=\'padding-left: 3px; padding-right: 3px;\' class=\'' + $.teoco.Dashboard.Level.ERROR + '\'>ERROR if' + sign + _thresholds[$.teoco.Dashboard.Level.ERROR] + '</span>';
                html +=
                    '<span class="tile-hint mif-question" data-role="hint" data-hint-position="bottom" data-hint-background="bg-gray" data-hint-color="fg-white"' +
                    ' data-hint="' + levels + '"></span>'
            }

            if (_description && _description.length) {
                html +=
                    '<div class="slide-over op-cyan text-small padding10">' + _description + '</div>';
            }

            html +=
                ' </div>' +
                '</div>';

            _elem$ = $(html);
            this.setValue(_val);
            if (options.onSelect) _elem$.mouseup(function () {
                options.onSelect(_instance);
            });
            return _elem$;
        };

        // set initial value
        if (options.value != undefined) {
            this.setValue(options.value);
        }
    };

    /**
     * @enum {string}
     */
    $.teoco.Dashboard.Tile.Size = {
        /**
         * 150x150 px
         */
        DEFAULT: "square",
        /**
         * 70x70 px
         */
        SMALL: "small",
        /**
         * 310x150 px
         */
        WIDE: "wide",
        /**
         * 310x310 px
         */
        LARGE: "large",
        /**
         * 470x470 px
         */
        BIG: "big",
        /**
         * 630x630 px
         */
        SUPER: "super"
    };

    /**
     * @param {string} selector HTML div selector
     * @constructor
     */
    $.teoco.Dashboard.TilesGroup = function (selector) {

        /**
         * @type {Array.<$.teoco.Dashboard.Tile>}
         * @private
         */
        var _tiles = [];

        /**
         * @return {Array.<$.teoco.Dashboard.Tile>}
         */
        this.getTiles = function () {
            return _tiles;
        };

        this.clear = function () {
            _tiles = [];
            $(selector).html("");
        };

        /**
         * @param {function()} [onComplete]
         */
        this.show = function (onComplete) {
            var this$ = $(selector);

            var numTiles = 0;

            // entry animation for all tiles
            this$.find(".tile, .tile-small, .tile-square, .tile-wide, .tile-large, .tile-big, .tile-super")
                .each(function () {
                    ++numTiles;
                })
                .each(function () {
                    var tile = $(this);
                    setTimeout(function () {
                        tile.css({
                            opacity: 1,
                            "-webkit-transform": "scale(1)",
                            "transform": "scale(1)",
                            "-webkit-transition": ".3s",
                            "transition": ".3s"
                        });
                    }, Math.floor(Math.random() * 500));
                    if (!--numTiles && onComplete) onComplete();
                });

            // entry animation for tile groups
            this$.find(".tile-group").animate({
                left: 0
            });
        };

        /**
         * @param {function()} [onComplete]
         */
        this.hide = function (onComplete) {
            var this$ = $(selector);

            var numTiles = 0;

            // entry animation for all tiles
            this$.find(".tile, .tile-small, .tile-square, .tile-wide, .tile-large, .tile-big, .tile-super")
                .each(function () {
                    ++numTiles;
                })
                .each(function () {
                    var tile = $(this);
                    setTimeout(function () {
                        tile.css({
                            opacity: 0,
                            "-webkit-transform": "scale(.8)",
                            "transform": "scale(.8)",
                            "-webkit-transition": ".3s",
                            "transition": ".3s"
                        });
                        if (!--numTiles && onComplete) onComplete();
                    }, Math.floor(Math.random() * 500));
                });

            // entry animation for tile groups
            /*this$.find(".tile-group").animate({
             left: 0
             });*/
        };

        /**
         * @param {$.teoco.Dashboard.Tile} tile
         * @private
         */
        function _addTile(tile) {
            _tiles.push(tile);
            $(selector).append(tile._get$());
        }

        /**
         * @param {$.teoco.Dashboard.Tile... | Array.<$.teoco.Dashboard.Tile>} tiles
         */
        this.add = function (tiles) {
            for (var i = 0; i < arguments.length; ++i) {
                var t = arguments[i];
                if (t instanceof $.teoco.Dashboard.Tile) {
                    _addTile(t);
                }
                else if (Array.isArray(t)) {
                    for (var j = 0; j < t.length; ++j) {
                        if (t[j] instanceof $.teoco.Dashboard.Tile) {
                            _addTile(t[j]);
                        }
                    }
                }
            }
        };

    };


})($);