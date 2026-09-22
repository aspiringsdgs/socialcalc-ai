/* eslint-disable */
// SocialCalc Editor Widgets Module (CellHandles, TableControl, drag, tooltip, button, mousewheel, keyboard)
// Part of the SocialCalc core engine - see README.md in this folder for the module map and load order

// UMD wrapper
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.SocialCalcEditorWidgets = factory();
    }
})(typeof globalThis !== "undefined" ? globalThis : (typeof self !== "undefined" ? self : this), function () {

    // Get SocialCalc namespace
    var SocialCalc;
    if (typeof window !== "undefined" && window.SocialCalc) {
        SocialCalc = window.SocialCalc;
    } else if (typeof global !== "undefined" && global.SocialCalc) {
        SocialCalc = global.SocialCalc;
    } else {
        SocialCalc = {};
    }

    // *************************************
    //
    // CellHandles class:
    //
    // This object creates and controls the elements around the cursor cell for dragging, etc.
    //
    // *************************************

    SocialCalc.CellHandles = function (editor) {
        var scc = SocialCalc.Constants;
        var functions;

        if (editor.noEdit) return; // leave us with nothing
        if (scc.SCCellHandlesDisable) return;

        this.editor = editor; // the TableEditor this belongs to

        this.noCursorSuffix = false;

        this.movedmouse = false; // used to detect no-op

        this.draghandle = document.createElement("div");
        SocialCalc.setStyles(
            this.draghandle,
            "display:none;position:absolute;zIndex:8;border:1px solid white;width:4px;height:4px;fontSize:1px;backgroundColor:#0E93D8;cursor:default;"
        );
        this.draghandle.innerHTML = "&nbsp;";
        editor.toplevel.appendChild(this.draghandle);
        SocialCalc.AssignID(editor, this.draghandle, "draghandle");

        var imagetype = "png";
        if (navigator.userAgent.match(/MSIE 6\.0/)) {
            imagetype = "gif";
        }

        this.dragpalette = document.createElement("div");
        SocialCalc.setStyles(
            this.dragpalette,
            "display:none;position:absolute;zIndex:8;width:90px;height:90px;fontSize:1px;textAlign:center;cursor:default;" +
            "backgroundImage:url(" +
            SocialCalc.Constants.defaultImagePrefix +
            "drag-handles." +
            imagetype +
            ");"
        );
        this.dragpalette.innerHTML = "&nbsp;";
        editor.toplevel.appendChild(this.dragpalette);
        SocialCalc.AssignID(editor, this.dragpalette, "dragpalette");

        this.dragtooltip = document.createElement("div");
        SocialCalc.setStyles(
            this.dragtooltip,
            "display:none;position:absolute;zIndex:9;border:1px solid black;width:100px;height:auto;fontSize:10px;backgroundColor:#FFFFFF;"
        );
        this.dragtooltip.innerHTML = "&nbsp;";
        editor.toplevel.appendChild(this.dragtooltip);
        SocialCalc.AssignID(editor, this.dragtooltip, "dragtooltip");

        this.fillinghandle = document.createElement("div");
        SocialCalc.setStyles(
            this.fillinghandle,
            "display:none;position:absolute;zIndex:9;border:1px solid black;width:auto;height:14px;fontSize:10px;backgroundColor:#FFFFFF;"
        );
        this.fillinghandle.innerHTML = "&nbsp;";
        editor.toplevel.appendChild(this.fillinghandle);
        SocialCalc.AssignID(editor, this.fillinghandle, "fillinghandle");

        if (this.draghandle.addEventListener) {
            // DOM Level 2 -- Firefox, et al
            this.draghandle.addEventListener(
                "mousemove",
                SocialCalc.CellHandlesMouseMoveOnHandle,
                false
            );
            this.dragpalette.addEventListener(
                "mousedown",
                SocialCalc.CellHandlesMouseDown,
                false
            );
            this.dragpalette.addEventListener(
                "mousemove",
                SocialCalc.CellHandlesMouseMoveOnHandle,
                false
            );
        } else if (this.draghandle.attachEvent) {
            // IE 5+
            this.draghandle.attachEvent(
                "onmousemove",
                SocialCalc.CellHandlesMouseMoveOnHandle
            );
            this.dragpalette.attachEvent(
                "onmousedown",
                SocialCalc.CellHandlesMouseDown
            );
            this.dragpalette.attachEvent(
                "onmousemove",
                SocialCalc.CellHandlesMouseMoveOnHandle
            );
        } else {
            // don't handle this
            throw "Browser not supported";
        }
    };

    // Methods:

    SocialCalc.CellHandles.prototype.ShowCellHandles = function (show, moveshow) {
        return SocialCalc.ShowCellHandles(this, show, moveshow);
    };

    // Functions:

    SocialCalc.ShowCellHandles = function (cellhandles, show, moveshow) {
        var cell, cell2, position, position2;
        var editor = cellhandles.editor;
        var doshow = false;
        var row, col, viewport;

        if (!editor) return;

        do {
            // a block that can you can "break" out of easily

            if (!show) break;

            row = editor.ecell.row;
            col = editor.ecell.col;

            if (editor.state != "start") break;
            if (row >= editor.lastvisiblerow) break;
            if (col >= editor.lastvisiblecol) break;
            if (row < editor.firstscrollingrow) break;
            if (col < editor.firstscrollingcol) break;

            if (
                editor.rowpositions[row + 1] + 20 >
                editor.horizontaltablecontrol.controlborder
            ) {
                break;
            }
            if (editor.rowpositions[row + 1] - 10 < editor.headposition.top) {
                break;
            }
            if (
                editor.colpositions[col + 1] + 20 >
                editor.verticaltablecontrol.controlborder
            ) {
                break;
            }
            if (editor.colpositions[col + 1] - 30 < editor.headposition.left) {
                break;
            }

            cellhandles.draghandle.style.left =
                editor.colpositions[col + 1] - 1 + "px";
            cellhandles.draghandle.style.top =
                editor.rowpositions[row + 1] - 1 + "px";
            cellhandles.draghandle.style.display = "block";

            if (moveshow) {
                cellhandles.draghandle.style.display = "none";
                cellhandles.dragpalette.style.left =
                    editor.colpositions[col + 1] - 45 + "px";
                cellhandles.dragpalette.style.top =
                    editor.rowpositions[row + 1] - 45 + "px";
                cellhandles.dragpalette.style.display = "block";
                viewport = SocialCalc.GetViewportInfo();
                cellhandles.dragtooltip.style.right =
                    viewport.width - (editor.colpositions[col + 1] - 1) + "px";
                cellhandles.dragtooltip.style.bottom =
                    viewport.height - (editor.rowpositions[row + 1] - 1) + "px";
                cellhandles.dragtooltip.style.display = "none";
            }

            doshow = true;
        } while (false); // only do once

        if (!doshow) {
            cellhandles.draghandle.style.display = "none";
        }
        if (!moveshow) {
            cellhandles.dragpalette.style.display = "none";
            cellhandles.dragtooltip.style.display = "none";
        }
    };

    SocialCalc.CellHandlesMouseMoveOnHandle = function (e) {
        var scc = SocialCalc.Constants;

        var event = e || window.event;
        var target = event.target || event.srcElement;
        var viewport = SocialCalc.GetViewportInfo();
        var clientX = event.clientX + viewport.horizontalScroll;
        var clientY = event.clientY + viewport.verticalScroll;

        editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
        if (!editor) return true; // we're not handling it -- let browser do default
        var cellhandles = editor.cellhandles;
        if (!cellhandles.editor) return true; // no handles

        if (!editor.cellhandles.mouseDown) {
            editor.cellhandles.ShowCellHandles(true, true); // show move handles, too

            if (target == cellhandles.dragpalette) {
                var whichhandle = SocialCalc.SegmentDivHit(
                    [scc.CH_radius1, scc.CH_radius2],
                    editor.cellhandles.dragpalette,
                    clientX,
                    clientY
                );
                if (whichhandle == 0) {
                    // off of active part of palette
                    SocialCalc.CellHandlesHoverTimeout();
                    return;
                }
                if (cellhandles.tooltipstimer) {
                    window.clearTimeout(cellhandles.tooltipstimer);
                    cellhandles.tooltipstimer = null;
                }
                cellhandles.tooltipswhichhandle = whichhandle;
                cellhandles.tooltipstimer = window.setTimeout(
                    SocialCalc.CellHandlesTooltipsTimeout,
                    700
                );
            }

            if (cellhandles.timer) {
                window.clearTimeout(cellhandles.timer);
                cellhandles.timer = null;
            }
            cellhandles.timer = window.setTimeout(
                SocialCalc.CellHandlesHoverTimeout,
                3000
            );
        }

        return;
    };

    //
    // whichsegment = SocialCalc.SegmentDivHit(segtable, divWithMouseHit, x, y)
    //
    // Takes segtable = [upperleft quadrant, upperright, bottomright, bottomleft]
    //  where each quadrant is either:
    //      0 = ignore hits here
    //      number = return this value
    //      array = a new segtable for this subquadrant
    //
    // Alternatively, segtable can be:
    //  [radius 1, radius 2] and it returns 0 if no hit,
    //  -1, -2, -3, -4 for inner quadrants, and +1...+4 for outer quadrants
    //

    SocialCalc.SegmentDivHit = function (segtable, divWithMouseHit, x, y) {
        var width = divWithMouseHit.offsetWidth;
        var height = divWithMouseHit.offsetHeight;
        var left = divWithMouseHit.offsetLeft;
        var top = divWithMouseHit.offsetTop;
        var v = 0;
        var table = segtable;
        var len = Math.sqrt(
            Math.pow(x - left - (width / 2.0 - 0.5), 2) +
            Math.pow(y - top - (height / 2.0 - 0.5), 2)
        );

        if (table.length == 2) {
            // type 2 segtable
            if (
                x >= left &&
                x < left + width / 2 &&
                y >= top &&
                y < top + height / 2
            ) {
                // upper left
                if (len <= segtable[0]) v = -1;
                else if (len <= segtable[1]) v = 1;
            }
            if (
                x >= left + width / 2 &&
                x < left + width &&
                y >= top &&
                y < top + height / 2
            ) {
                // upper right
                if (len <= segtable[0]) v = -2;
                else if (len <= segtable[1]) v = 2;
            }
            if (
                x >= left + width / 2 &&
                x < left + width &&
                y >= top + height / 2 &&
                y < top + height
            ) {
                // bottom right
                if (len <= segtable[0]) v = -3;
                else if (len <= segtable[1]) v = 3;
            }
            if (
                x >= left &&
                x < left + width / 2 &&
                y >= top + height / 2 &&
                y < top + height
            ) {
                // bottom right
                if (len <= segtable[0]) v = -4;
                else if (len <= segtable[1]) v = 4;
            }
            return v;
        }

        while (true) {
            if (
                x >= left &&
                x < left + width / 2 &&
                y >= top &&
                y < top + height / 2
            ) {
                // upper left
                quadrant += "1";
                v = table[0];
                if (typeof v == "number") {
                    break;
                }
                table = v;
                width = width / 2;
                height = height / 2;
                continue;
            }
            if (
                x >= left + width / 2 &&
                x < left + width &&
                y >= top &&
                y < top + height / 2
            ) {
                // upper right
                quadrant += "2";
                v = table[1];
                if (typeof v == "number") {
                    break;
                }
                table = v;
                width = width / 2;
                left = left + width;
                height = height / 2;
                continue;
            }
            if (
                x >= left + width / 2 &&
                x < left + width &&
                y >= top + height / 2 &&
                y < top + height
            ) {
                // bottom right
                quadrant += "3";
                v = table[2];
                if (typeof v == "number") {
                    break;
                }
                table = v;
                width = width / 2;
                left = left + width;
                height = height / 2;
                top = top + height;
                continue;
            }
            if (
                x >= left &&
                x < left + width / 2 &&
                y >= top + height / 2 &&
                y < top + height
            ) {
                // bottom right
                quadrant += "4";
                v = table[3];
                if (typeof v == "number") {
                    break;
                }
                table = v;
                width = width / 2;
                height = height / 2;
                top = top + height;
                continue;
            }
            return 0; // didn't match
        }

        //addmsg((x-divWithMouseHit.offsetLeft)+","+(y-divWithMouseHit.offsetTop)+"="+quadrant+" "+v);
        return v;
    };

    SocialCalc.CellHandlesHoverTimeout = function () {
        editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
        if (!editor) return true; // we're not handling it -- let browser do default
        var cellhandles = editor.cellhandles;
        if (cellhandles.timer) {
            window.clearTimeout(cellhandles.timer);
            cellhandles.timer = null;
        }
        if (cellhandles.tooltipstimer) {
            window.clearTimeout(cellhandles.tooltipstimer);
            cellhandles.tooltipstimer = null;
        }
        editor.cellhandles.ShowCellHandles(true, false); // hide move handles
    };

    SocialCalc.CellHandlesTooltipsTimeout = function () {
        editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
        if (!editor) return true; // we're not handling it -- let browser do default
        var cellhandles = editor.cellhandles;
        if (cellhandles.tooltipstimer) {
            window.clearTimeout(cellhandles.tooltipstimer);
            cellhandles.tooltipstimer = null;
        }

        var whichhandle = cellhandles.tooltipswhichhandle;
        if (whichhandle == 0) {
            // off of active part of palette
            SocialCalc.CellHandlesHoverTimeout();
            return;
        }
        if (whichhandle == -3) {
            cellhandles.dragtooltip.innerHTML = scc.s_CHfillAllTooltip;
        } else if (whichhandle == 3) {
            cellhandles.dragtooltip.innerHTML = scc.s_CHfillContentsTooltip;
        } else if (whichhandle == -2) {
            cellhandles.dragtooltip.innerHTML = scc.s_CHmovePasteAllTooltip;
        } else if (whichhandle == -4) {
            cellhandles.dragtooltip.innerHTML = scc.s_CHmoveInsertAllTooltip;
        } else if (whichhandle == 2) {
            cellhandles.dragtooltip.innerHTML = scc.s_CHmovePasteContentsTooltip;
        } else if (whichhandle == 4) {
            cellhandles.dragtooltip.innerHTML = scc.s_CHmoveInsertContentsTooltip;
        } else {
            cellhandles.dragtooltip.innerHTML = "&nbsp;";
            cellhandles.dragtooltip.style.display = "none";
            return;
        }

        cellhandles.dragtooltip.style.display = "block";
    };

    SocialCalc.CellHandlesMouseDown = function (e) {
        var scc = SocialCalc.Constants;
        var editor, result, coord, textarea, wval, range;

        var event = e || window.event;

        var viewport = SocialCalc.GetViewportInfo();
        var clientX = event.clientX + viewport.horizontalScroll;
        var clientY = event.clientY + viewport.verticalScroll;

        var mouseinfo = SocialCalc.EditorMouseInfo;

        editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
        if (!editor) return true; // we're not handling it -- let browser do default

        if (editor.busy) return; // don't do anything when busy (is this correct?)

        var cellhandles = editor.cellhandles;

        cellhandles.movedmouse = false; // detect no-op

        if (cellhandles.timer) {
            // cancel timer
            window.clearTimeout(cellhandles.timer);
            cellhandles.timer = null;
        }
        if (cellhandles.tooltipstimer) {
            window.clearTimeout(cellhandles.tooltipstimer);
            cellhandles.tooltipstimer = null;
        }
        cellhandles.dragtooltip.innerHTML = "&nbsp;";
        cellhandles.dragtooltip.style.display = "none";

        range = editor.range;

        var whichhandle = SocialCalc.SegmentDivHit(
            [scc.CH_radius1, scc.CH_radius2],
            editor.cellhandles.dragpalette,
            clientX,
            clientY
        );
        if (whichhandle == 1 || whichhandle == -1 || whichhandle == 0) {
            cellhandles.ShowCellHandles(true, false); // hide move handles
            return;
        }

        mouseinfo.ignore = true; // stop other code from looking at the mouse

        if (whichhandle == -3) {
            cellhandles.dragtype = "Fill";
            //      mouseinfo.element = editor.cellhandles.fillhandle;
            cellhandles.noCursorSuffix = false;
        } else if (whichhandle == 3) {
            cellhandles.dragtype = "FillC";
            //      mouseinfo.element = editor.cellhandles.fillhandle;
            cellhandles.noCursorSuffix = false;
        } else if (whichhandle == -2) {
            cellhandles.dragtype = "Move";
            //      mouseinfo.element = editor.cellhandles.movehandle1;
            cellhandles.noCursorSuffix = true;
        } else if (whichhandle == -4) {
            cellhandles.dragtype = "MoveI";
            //      mouseinfo.element = editor.cellhandles.movehandle2;
            cellhandles.noCursorSuffix = false;
        } else if (whichhandle == 2) {
            cellhandles.dragtype = "MoveC";
            //      mouseinfo.element = editor.cellhandles.movehandle1;
            cellhandles.noCursorSuffix = true;
        } else if (whichhandle == 4) {
            cellhandles.dragtype = "MoveIC";
            //      mouseinfo.element = editor.cellhandles.movehandle2;
            cellhandles.noCursorSuffix = false;
        }

        cellhandles.filltype = null;

        switch (cellhandles.dragtype) {
            case "Fill":
            case "FillC":
                if (!range.hasrange) {
                    editor.RangeAnchor();
                }
                break;

            case "Move":
            case "MoveI":
            case "MoveC":
            case "MoveIC":
                if (!range.hasrange) {
                    editor.RangeAnchor();
                }
                editor.range2.top = editor.range.top;
                editor.range2.right = editor.range.right;
                editor.range2.bottom = editor.range.bottom;
                editor.range2.left = editor.range.left;
                editor.range2.hasrange = true;
                editor.RangeRemove();
                break;

            default:
                return; // not for us
        }

        cellhandles.fillinghandle.style.left = clientX + "px";
        cellhandles.fillinghandle.style.top = clientY - 17 + "px";
        cellhandles.fillinghandle.innerHTML =
            scc.s_CHindicatorOperationLookup[cellhandles.dragtype] +
            (scc.s_CHindicatorDirectionLookup[editor.cellhandles.filltype] || "");
        cellhandles.fillinghandle.style.display = "block";

        cellhandles.ShowCellHandles(true, false); // hide move handles
        cellhandles.mouseDown = true;

        mouseinfo.editor = editor; // remember for later

        coord = editor.ecell.coord; // start with cell with handles

        cellhandles.startingcoord = coord;
        cellhandles.startingX = clientX;
        cellhandles.startingY = clientY;

        mouseinfo.mouselastcoord = coord;

        SocialCalc.KeyboardSetFocus(editor);

        if (document.addEventListener) {
            // DOM Level 2 -- Firefox, et al
            document.addEventListener(
                "mousemove",
                SocialCalc.CellHandlesMouseMove,
                true
            ); // capture everywhere
            document.addEventListener("mouseup", SocialCalc.CellHandlesMouseUp, true); // capture everywhere
        } else if (cellhandles.draghandle.attachEvent) {
            // IE 5+
            cellhandles.draghandle.setCapture();
            cellhandles.draghandle.attachEvent(
                "onmousemove",
                SocialCalc.CellHandlesMouseMove
            );
            cellhandles.draghandle.attachEvent(
                "onmouseup",
                SocialCalc.CellHandlesMouseUp
            );
            cellhandles.draghandle.attachEvent(
                "onlosecapture",
                SocialCalc.CellHandlesMouseUp
            );
        }
        if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
        else event.cancelBubble = true; // IE 5+
        if (event.preventDefault) event.preventDefault(); // DOM Level 2
        else event.returnValue = false; // IE 5+

        return;
    };

    SocialCalc.CellHandlesMouseMove = function (e) {
        var scc = SocialCalc.Constants;
        var editor, element, result, coord, now, textarea, sheetobj, cellobj, wval;
        var crstart, crend, cr, c, r;

        var event = e || window.event;

        var viewport = SocialCalc.GetViewportInfo();
        var clientX = event.clientX + viewport.horizontalScroll;
        var clientY = event.clientY + viewport.verticalScroll;

        var mouseinfo = SocialCalc.EditorMouseInfo;
        editor = mouseinfo.editor;
        if (!editor) return; // not us, ignore
        var cellhandles = editor.cellhandles;

        element = mouseinfo.element;

        result = SocialCalc.GridMousePosition(editor, clientX, clientY); // get cell with move

        if (!result) return;

        if (result && !result.coord) {
            SocialCalc.SetDragAutoRepeat(
                editor,
                result,
                SocialCalc.CellHandlesDragAutoRepeat
            );
            return;
        }

        SocialCalc.SetDragAutoRepeat(editor, null); // stop repeating if it was

        if (!result.coord) return;

        crstart = SocialCalc.coordToCr(editor.cellhandles.startingcoord);
        crend = SocialCalc.coordToCr(result.coord);

        cellhandles.movedmouse = true; // did move, so not no-op

        switch (cellhandles.dragtype) {
            case "Fill":
            case "FillC":
                if (result.coord == cellhandles.startingcoord) {
                    // reset when come back
                    cellhandles.filltype = null;
                    cellhandles.startingX = clientX;
                    cellhandles.startingY = clientY;
                } else {
                    if (cellhandles.filltype) {
                        // moving and have already determined filltype
                        if (cellhandles.filltype == "Down") {
                            // coerse to that
                            crend.col = crstart.col;
                            if (crend.row < crstart.row) crend.row = crstart.row;
                        } else {
                            crend.row = crstart.row;
                            if (crend.col < crstart.col) crend.col = crstart.col;
                        }
                    } else {
                        if (Math.abs(clientY - cellhandles.startingY) > 10) {
                            cellhandles.filltype = "Down";
                        } else if (Math.abs(clientX - cellhandles.startingX) > 10) {
                            cellhandles.filltype = "Right";
                        }
                        crend.col = crstart.col; // until decide, leave it at start
                        crend.row = crstart.row;
                    }
                }
                result.coord = SocialCalc.crToCoord(crend.col, crend.row);
                if (result.coord != mouseinfo.mouselastcoord) {
                    editor.MoveECell(result.coord);
                    editor.RangeExtend();
                }
                break;

            case "Move":
            case "MoveC":
                if (result.coord != mouseinfo.mouselastcoord) {
                    editor.MoveECell(result.coord);
                    c = editor.range2.right - editor.range2.left + result.col;
                    r = editor.range2.bottom - editor.range2.top + result.row;
                    editor.RangeAnchor(SocialCalc.crToCoord(c, r));
                    editor.RangeExtend();
                }
                break;

            case "MoveI":
            case "MoveIC":
                if (result.coord == cellhandles.startingcoord) {
                    // reset when come back
                    cellhandles.filltype = null;
                    cellhandles.startingX = clientX;
                    cellhandles.startingY = clientY;
                } else {
                    if (cellhandles.filltype) {
                        // moving and have already determined filltype
                        if (cellhandles.filltype == "Vertical") {
                            // coerse to that
                            crend.col = editor.range2.left;
                            if (
                                crend.row >= editor.range2.top &&
                                crend.row <= editor.range2.bottom + 1
                            )
                                crend.row = editor.range2.bottom + 2;
                        } else {
                            crend.row = editor.range2.top;
                            if (
                                crend.col >= editor.range2.left &&
                                crend.col <= editor.range2.right + 1
                            )
                                crend.col = editor.range2.right + 2;
                        }
                    } else {
                        if (Math.abs(clientY - cellhandles.startingY) > 10) {
                            cellhandles.filltype = "Vertical";
                        } else if (Math.abs(clientX - cellhandles.startingX) > 10) {
                            cellhandles.filltype = "Horizontal";
                        }
                        crend.col = crstart.col; // until decide, leave it at start
                        crend.row = crstart.row;
                    }
                }
                result.coord = SocialCalc.crToCoord(crend.col, crend.row);
                if (result.coord != mouseinfo.mouselastcoord) {
                    editor.MoveECell(result.coord);
                    if (!cellhandles.filltype) {
                        // no fill type
                        editor.RangeRemove();
                    } else {
                        c = editor.range2.right - editor.range2.left + crend.col;
                        r = editor.range2.bottom - editor.range2.top + crend.row;
                        editor.RangeAnchor(SocialCalc.crToCoord(c, r));
                        editor.RangeExtend();
                    }
                }
                break;
        }

        cellhandles.fillinghandle.style.left = clientX + "px";
        cellhandles.fillinghandle.style.top = clientY - 17 + "px";
        cellhandles.fillinghandle.innerHTML =
            scc.s_CHindicatorOperationLookup[cellhandles.dragtype] +
            (scc.s_CHindicatorDirectionLookup[editor.cellhandles.filltype] || "");
        cellhandles.fillinghandle.style.display = "block";

        mouseinfo.mouselastcoord = result.coord;

        if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
        else event.cancelBubble = true; // IE 5+
        if (event.preventDefault) event.preventDefault(); // DOM Level 2
        else event.returnValue = false; // IE 5+

        return;
    };

    SocialCalc.CellHandlesDragAutoRepeat = function (coord, direction) {
        var mouseinfo = SocialCalc.EditorMouseInfo;
        var editor = mouseinfo.editor;
        if (!editor) return; // not us, ignore
        var cellhandles = editor.cellhandles;

        var crstart = SocialCalc.coordToCr(editor.cellhandles.startingcoord);
        var crend = SocialCalc.coordToCr(coord);

        var newcoord, c, r;

        var vscroll = 0;
        var hscroll = 0;

        if (direction == "left") hscroll = -1;
        else if (direction == "right") hscroll = 1;
        else if (direction == "up") vscroll = -1;
        else if (direction == "down") vscroll = 1;
        editor.ScrollRelativeBoth(vscroll, hscroll);

        switch (cellhandles.dragtype) {
            case "Fill":
            case "FillC":
                if (cellhandles.filltype) {
                    // moving and have already determined filltype
                    if (cellhandles.filltype == "Down") {
                        // coerse to that
                        crend.col = crstart.col;
                        if (crend.row < crstart.row) crend.row = crstart.row;
                    } else {
                        crend.row = crstart.row;
                        if (crend.col < crstart.col) crend.col = crstart.col;
                    }
                } else {
                    crend.col = crstart.col; // until decide, leave it at start
                    crend.row = crstart.row;
                }

                newcoord = SocialCalc.crToCoord(crend.col, crend.row);
                if (newcoord != mouseinfo.mouselastcoord) {
                    editor.MoveECell(coord);
                    editor.RangeExtend();
                }
                break;

            case "Move":
            case "MoveC":
                if (coord != mouseinfo.mouselastcoord) {
                    editor.MoveECell(coord);
                    c = editor.range2.right - editor.range2.left + editor.ecell.col;
                    r = editor.range2.bottom - editor.range2.top + editor.ecell.row;
                    editor.RangeAnchor(SocialCalc.crToCoord(c, r));
                    editor.RangeExtend();
                }
                break;

            case "MoveI":
            case "MoveIC":
                if (cellhandles.filltype) {
                    // moving and have already determined filltype
                    if (cellhandles.filltype == "Vertical") {
                        // coerse to that
                        crend.col = editor.range2.left;
                        if (
                            crend.row >= editor.range2.top &&
                            crend.row <= editor.range2.bottom + 1
                        )
                            crend.row = editor.range2.bottom + 2;
                    } else {
                        crend.row = editor.range2.top;
                        if (
                            crend.col >= editor.range2.left &&
                            crend.col <= editor.range2.right + 1
                        )
                            crend.col = editor.range2.right + 2;
                    }
                } else {
                    crend.col = crstart.col; // until decide, leave it at start
                    crend.row = crstart.row;
                }

                newcoord = SocialCalc.crToCoord(crend.col, crend.row);
                if (newcoord != mouseinfo.mouselastcoord) {
                    editor.MoveECell(newcoord);
                    c = editor.range2.right - editor.range2.left + crend.col;
                    r = editor.range2.bottom - editor.range2.top + crend.row;
                    editor.RangeAnchor(SocialCalc.crToCoord(c, r));
                    editor.RangeExtend();
                }
                break;
        }

        mouseinfo.mouselastcoord = newcoord;
    };

    SocialCalc.CellHandlesMouseUp = function (e) {
        var editor,
            element,
            result,
            coord,
            now,
            textarea,
            sheetobj,
            cellobj,
            wval,
            cstr,
            cmdtype,
            cmdtype2;
        var crstart, crend;
        var sizec, sizer, deltac, deltar;

        var event = e || window.event;

        var viewport = SocialCalc.GetViewportInfo();
        var clientX = event.clientX + viewport.horizontalScroll;
        var clientY = event.clientY + viewport.verticalScroll;

        var mouseinfo = SocialCalc.EditorMouseInfo;
        editor = mouseinfo.editor;
        if (!editor) return; // not us, ignore
        var cellhandles = editor.cellhandles;

        element = mouseinfo.element;

        mouseinfo.ignore = false;

        result = SocialCalc.GridMousePosition(editor, clientX, clientY); // get cell with up

        SocialCalc.SetDragAutoRepeat(editor, null); // stop repeating if it was

        cellhandles.mouseDown = false;
        cellhandles.noCursorSuffix = false;

        cellhandles.fillinghandle.style.display = "none";

        if (!result) result = {};
        if (!result.coord) result.coord = editor.ecell.coord;

        switch (cellhandles.dragtype) {
            case "Fill":
            case "Move":
            case "MoveI":
                cmdtype2 = " all";
                break;
            case "FillC":
            case "MoveC":
            case "MoveIC":
                cmdtype2 = " formulas";
                break;
        }

        if (!cellhandles.movedmouse) {
            // didn't move: just leave one cell selected
            cellhandles.dragtype = "Nothing";
        }

        switch (cellhandles.dragtype) {
            case "Nothing":
                editor.Range2Remove();
                editor.RangeRemove();
                break;

            case "Fill":
            case "FillC":
                crstart = SocialCalc.coordToCr(cellhandles.startingcoord);
                crend = SocialCalc.coordToCr(result.coord);
                if (cellhandles.filltype) {
                    if (cellhandles.filltype == "Down") {
                        crend.col = crstart.col;
                    } else {
                        crend.row = crstart.row;
                    }
                }
                result.coord = SocialCalc.crToCoord(crend.col, crend.row);

                editor.MoveECell(result.coord);
                editor.RangeExtend();

                if (editor.cellhandles.filltype == "Right") {
                    cmdtype = "right";
                } else {
                    cmdtype = "down";
                }
                cstr =
                    "fill" +
                    cmdtype +
                    " " +
                    SocialCalc.crToCoord(editor.range.left, editor.range.top) +
                    ":" +
                    SocialCalc.crToCoord(editor.range.right, editor.range.bottom) +
                    cmdtype2;
                editor.EditorScheduleSheetCommands(cstr, true, false);
                break;

            case "Move":
            case "MoveC":
                editor.context.cursorsuffix = "";
                cstr =
                    "movepaste " +
                    SocialCalc.crToCoord(editor.range2.left, editor.range2.top) +
                    ":" +
                    SocialCalc.crToCoord(editor.range2.right, editor.range2.bottom) +
                    " " +
                    editor.ecell.coord +
                    cmdtype2;
                editor.EditorScheduleSheetCommands(cstr, true, false);
                editor.Range2Remove();

                break;

            case "MoveI":
            case "MoveIC":
                editor.context.cursorsuffix = "";
                sizec = editor.range2.right - editor.range2.left;
                sizer = editor.range2.bottom - editor.range2.top;
                deltac = editor.ecell.col - editor.range2.left;
                deltar = editor.ecell.row - editor.range2.top;
                cstr =
                    "moveinsert " +
                    SocialCalc.crToCoord(editor.range2.left, editor.range2.top) +
                    ":" +
                    SocialCalc.crToCoord(editor.range2.right, editor.range2.bottom) +
                    " " +
                    editor.ecell.coord +
                    cmdtype2;
                editor.EditorScheduleSheetCommands(cstr, true, false);
                editor.Range2Remove();
                editor.RangeRemove();
                if (editor.cellhandles.filltype == " Horizontal" && deltac > 0) {
                    editor.MoveECell(
                        SocialCalc.crToCoord(editor.ecell.col - sizec - 1, editor.ecell.row)
                    );
                } else if (editor.cellhandles.filltype == " Vertical" && deltar > 0) {
                    editor.MoveECell(
                        SocialCalc.crToCoord(editor.ecell.col, editor.ecell.row - sizer - 1)
                    );
                }
                editor.RangeAnchor(
                    SocialCalc.crToCoord(
                        editor.ecell.col + sizec,
                        editor.ecell.row + sizer
                    )
                );
                editor.RangeExtend();

                break;
        }

        if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
        else event.cancelBubble = true; // IE 5+
        if (event.preventDefault) event.preventDefault(); // DOM Level 2
        else event.returnValue = false; // IE 5+

        if (document.removeEventListener) {
            // DOM Level 2
            document.removeEventListener(
                "mousemove",
                SocialCalc.CellHandlesMouseMove,
                true
            );
            document.removeEventListener(
                "mouseup",
                SocialCalc.CellHandlesMouseUp,
                true
            );
        } else if (cellhandles.draghandle.detachEvent) {
            // IE
            cellhandles.draghandle.detachEvent(
                "onlosecapture",
                SocialCalc.CellHandlesMouseUp
            );
            cellhandles.draghandle.detachEvent(
                "onmouseup",
                SocialCalc.CellHandlesMouseUp
            );
            cellhandles.draghandle.detachEvent(
                "onmousemove",
                SocialCalc.CellHandlesMouseMove
            );
            cellhandles.draghandle.releaseCapture();
        }

        mouseinfo.editor = null;

        return false;
    };

    // *************************************
    //
    // TableControl class:
    //
    // This class deals with the horizontal and verical scrollbars and pane sliders.
    //
    // +--------------+
    // | Endcap       |
    // +- - - - - - - +
    // |              |
    // +--------------+
    // | Pane Slider  |
    // +--------------+
    // |              |
    // | Less Button  |
    // |              |
    // +--------------+
    // | Scroll Area  |
    // |              |
    // |              |
    // +--------------+
    // | Thumb        |
    // +--------------+
    // |              |
    // +--------------+
    // |              |
    // | More Button  |
    // |              |
    // +--------------+
    //
    // *************************************

    SocialCalc.TableControl = function (editor, vertical, size) {
        var scc = SocialCalc.Constants;

        this.editor = editor; // the TableEditor this belongs to

        this.vertical = vertical; // true if vertical control, false if horizontal
        this.size = size; // length in pixels

        this.main = null; // main element containing all the others
        this.endcap = null; // the area at the top/left between the end and the pane slider
        this.paneslider = null; // the slider to adjust the pane split
        this.lessbutton = null; // the top/left scroll button
        this.morebutton = null; // the bottom/right scroll button
        this.scrollarea = null; // the area between the scroll buttons
        this.thumb = null; // the sliding thing in the scrollarea

        // computed position values:

        this.controlborder = null; // left or top screen position for vertical or horizontal control
        this.endcapstart = null; // top or left screen position for vertical or horizontal control
        this.panesliderstart = null;
        this.lessbuttonstart = null;
        this.morebuttonstart = null;
        this.scrollareastart = null;
        this.scrollareaend = null;
        this.scrollareasize = null;
        this.thumbpos = null;

        // constants:

        this.controlthickness = scc.defaultTableControlThickness; // other dimension of complete control in pixels
        this.sliderthickness = scc.defaultTCSliderThickness;
        this.buttonthickness = scc.defaultTCButtonThickness;
        this.thumbthickness = scc.defaultTCThumbThickness;
        this.minscrollingpanesize =
            this.buttonthickness + this.buttonthickness + this.thumbthickness + 20; // the 20 is to leave a little space
    };

    // Methods:

    SocialCalc.TableControl.prototype.CreateTableControl = function () {
        return SocialCalc.CreateTableControl(this);
    };
    SocialCalc.TableControl.prototype.PositionTableControlElements = function () {
        SocialCalc.PositionTableControlElements(this);
    };
    SocialCalc.TableControl.prototype.ComputeTableControlPositions = function () {
        SocialCalc.ComputeTableControlPositions(this);
    };

    // Functions:

    SocialCalc.CreateTableControl = function (control) {
        var s, functions, params;
        var AssignID = SocialCalc.AssignID;
        var setStyles = SocialCalc.setStyles;
        var scc = SocialCalc.Constants;
        var TooltipRegister = function (element, etype, vh) {
            if (scc["s_" + etype + "Tooltip" + vh]) {
                SocialCalc.TooltipRegister(
                    element,
                    scc["s_" + etype + "Tooltip" + vh],
                    null
                );
            }
        };

        var imageprefix = control.editor.imageprefix;
        var vh = control.vertical ? "v" : "h";

        control.main = document.createElement("div");
        s = control.main.style;
        s.height =
            (control.vertical ? control.size : control.controlthickness) + "px";
        s.width =
            (control.vertical ? control.controlthickness : control.size) + "px";
        s.zIndex = 0;
        setStyles(control.main, scc.TCmainStyle);
        s.backgroundImage = "url(" + imageprefix + "main-" + vh + ".gif)";
        if (scc.TCmainClass) control.main.className = scc.TCmainClass;

        control.main.style.display = "none"; // wait for layout

        control.endcap = document.createElement("div");
        s = control.endcap.style;
        s.height = control.controlthickness + "px";
        s.width = control.controlthickness + "px";
        s.zIndex = 1;
        s.overflow = "hidden"; // IE will make the DIV at least font-size height...so use this
        s.position = "absolute";
        setStyles(control.endcap, scc.TCendcapStyle);
        s.backgroundImage = "url(" + imageprefix + "endcap-" + vh + ".gif)";
        if (scc.TCendcapClass) control.endcap.className = scc.TCendcapClass;
        AssignID(control.editor, control.endcap, "endcap" + vh);

        control.main.appendChild(control.endcap);

        control.paneslider = document.createElement("div");
        s = control.paneslider.style;
        s.height =
            (control.vertical ? control.sliderthickness : control.controlthickness) +
            "px";
        s.overflow = "hidden"; // IE will make the DIV at least font-size height...so use this
        s.width =
            (control.vertical ? control.controlthickness : control.sliderthickness) +
            "px";
        s.position = "absolute";
        s[control.vertical ? "top" : "left"] = "4px";
        s.zIndex = 3;
        setStyles(control.paneslider, scc.TCpanesliderStyle);
        s.backgroundImage = "url(" + imageprefix + "paneslider-" + vh + ".gif)";
        if (scc.TCpanesliderClass)
            control.paneslider.className = scc.TCpanesliderClass;
        AssignID(control.editor, control.paneslider, "paneslider" + vh);
        TooltipRegister(control.paneslider, "paneslider", vh);

        functions = {
            MouseDown: SocialCalc.TCPSDragFunctionStart,
            MouseMove: SocialCalc.TCPSDragFunctionMove,
            MouseUp: SocialCalc.TCPSDragFunctionStop,
            Disabled: function () {
                return control.editor.busy;
            },
        };

        functions.control = control; // make sure this is there

        SocialCalc.DragRegister(
            control.paneslider,
            control.vertical,
            !control.vertical,
            functions
        );

        control.main.appendChild(control.paneslider);

        control.lessbutton = document.createElement("div");
        s = control.lessbutton.style;
        s.height =
            (control.vertical ? control.buttonthickness : control.controlthickness) +
            "px";
        s.width =
            (control.vertical ? control.controlthickness : control.buttonthickness) +
            "px";
        s.zIndex = 2;
        s.overflow = "hidden"; // IE will make the DIV at least font-size height...so use this
        s.position = "absolute";
        setStyles(control.lessbutton, scc.TClessbuttonStyle);
        s.backgroundImage = "url(" + imageprefix + "less-" + vh + "n.gif)";
        if (scc.TClessbuttonClass)
            control.lessbutton.className = scc.TClessbuttonClass;
        AssignID(control.editor, control.lessbutton, "lessbutton" + vh);

        params = {
            repeatwait: scc.TClessbuttonRepeatWait,
            repeatinterval: scc.TClessbuttonRepeatInterval,
            normalstyle:
                "backgroundImage:url(" + imageprefix + "less-" + vh + "n.gif);",
            downstyle:
                "backgroundImage:url(" + imageprefix + "less-" + vh + "d.gif);",
            hoverstyle:
                "backgroundImage:url(" + imageprefix + "less-" + vh + "h.gif);",
        };
        functions = {
            MouseDown: function () {
                if (!control.editor.busy)
                    control.editor.ScrollRelative(control.vertical, -1);
            },
            Repeat: function () {
                if (!control.editor.busy)
                    control.editor.ScrollRelative(control.vertical, -1);
            },
            Disabled: function () {
                return control.editor.busy;
            },
        };

        SocialCalc.ButtonRegister(control.lessbutton, params, functions);

        control.main.appendChild(control.lessbutton);

        control.morebutton = document.createElement("div");
        s = control.morebutton.style;
        s.height =
            (control.vertical ? control.buttonthickness : control.controlthickness) +
            "px";
        s.width =
            (control.vertical ? control.controlthickness : control.buttonthickness) +
            "px";
        s.zIndex = 2;
        s.overflow = "hidden"; // IE will make the DIV at least font-size height...so use this
        s.position = "absolute";
        setStyles(control.morebutton, scc.TCmorebuttonStyle);
        s.backgroundImage = "url(" + imageprefix + "more-" + vh + "n.gif)";
        if (scc.TCmorebuttonClass)
            control.morebutton.className = scc.TCmorebuttonClass;
        AssignID(control.editor, control.morebutton, "morebutton" + vh);

        params = {
            repeatwait: scc.TCmorebuttonRepeatWait,
            repeatinterval: scc.TCmorebuttonRepeatInterval,
            normalstyle:
                "backgroundImage:url(" + imageprefix + "more-" + vh + "n.gif);",
            downstyle:
                "backgroundImage:url(" + imageprefix + "more-" + vh + "d.gif);",
            hoverstyle:
                "backgroundImage:url(" + imageprefix + "more-" + vh + "h.gif);",
        };
        functions = {
            MouseDown: function () {
                if (!control.editor.busy)
                    control.editor.ScrollRelative(control.vertical, +1);
            },
            Repeat: function () {
                if (!control.editor.busy)
                    control.editor.ScrollRelative(control.vertical, +1);
            },
            Disabled: function () {
                return control.editor.busy;
            },
        };

        SocialCalc.ButtonRegister(control.morebutton, params, functions);

        control.main.appendChild(control.morebutton);

        control.scrollarea = document.createElement("div");
        s = control.scrollarea.style;
        s.height = control.controlthickness + "px";
        s.width = control.controlthickness + "px";
        s.zIndex = 1;
        s.overflow = "hidden"; // IE will make the DIV at least font-size height...so use this
        s.position = "absolute";
        setStyles(control.scrollarea, scc.TCscrollareaStyle);
        s.backgroundImage = "url(" + imageprefix + "scrollarea-" + vh + ".gif)";
        if (scc.TCscrollareaClass)
            control.scrollarea.className = scc.TCscrollareaClass;
        AssignID(control.editor, control.scrollarea, "scrollarea" + vh);

        params = {
            repeatwait: scc.TCscrollareaRepeatWait,
            repeatinterval: scc.TCscrollareaRepeatWait,
        };
        functions = {
            MouseDown: SocialCalc.ScrollAreaClick,
            Repeat: SocialCalc.ScrollAreaClick,
            Disabled: function () {
                return control.editor.busy;
            },
        };
        functions.control = control;

        SocialCalc.ButtonRegister(control.scrollarea, params, functions);

        control.main.appendChild(control.scrollarea);

        control.thumb = document.createElement("div");
        s = control.thumb.style;
        s.height =
            (control.vertical ? control.thumbthickness : control.controlthickness) +
            "px";
        s.width =
            (control.vertical ? control.controlthickness : control.thumbthickness) +
            "px";
        s.zIndex = 2;
        s.overflow = "hidden"; // IE will make the DIV at least font-size height...so use this
        s.position = "absolute";
        setStyles(control.thumb, scc.TCthumbStyle);
        control.thumb.style.backgroundImage =
            "url(" + imageprefix + "thumb-" + vh + "n.gif)";
        if (scc.TCthumbClass) control.thumb.className = scc.TCthumbClass;
        AssignID(control.editor, control.thumb, "thumb" + vh);

        functions = {
            MouseDown: SocialCalc.TCTDragFunctionStart,
            MouseMove: SocialCalc.TCTDragFunctionMove,
            MouseUp: SocialCalc.TCTDragFunctionStop,
            Disabled: function () {
                return control.editor.busy;
            },
        };
        functions.control = control; // make sure this is there
        SocialCalc.DragRegister(
            control.thumb,
            control.vertical,
            !control.vertical,
            functions
        );

        params = {
            normalstyle:
                "backgroundImage:url(" + imageprefix + "thumb-" + vh + "n.gif)",
            name: "Thumb",
            downstyle:
                "backgroundImage:url(" + imageprefix + "thumb-" + vh + "d.gif)",
            hoverstyle:
                "backgroundImage:url(" + imageprefix + "thumb-" + vh + "h.gif)",
        };
        SocialCalc.ButtonRegister(control.thumb, params, null); // give it button-like visual behavior

        control.main.appendChild(control.thumb);

        return control.main;
    };

    //
    // ScrollAreaClick - Button function to process pageup/down clicks
    //

    SocialCalc.ScrollAreaClick = function (e, buttoninfo, bobj) {
        var control = bobj.functionobj.control;
        var bposition = SocialCalc.GetElementPosition(bobj.element);
        var clickpos = control.vertical ? buttoninfo.clientY : buttoninfo.clientX;
        if (control.editor.busy) {
            // ignore if busy - wait for next repeat
            return;
        }
        control.editor.PageRelative(
            control.vertical,
            clickpos > control.thumbpos ? 1 : -1
        );

        return;
    };

    //
    // PositionTableControlElements
    //

    SocialCalc.PositionTableControlElements = function (control) {
        var border, realend, thumbpos;

        var editor = control.editor;

        if (control.vertical) {
            border = control.controlborder + "px";
            control.endcap.style.top = control.endcapstart + "px";
            control.endcap.style.left = border;
            control.paneslider.style.top = control.panesliderstart + "px";
            control.paneslider.style.left = border;
            control.lessbutton.style.top = control.lessbuttonstart + "px";
            control.lessbutton.style.left = border;
            control.morebutton.style.top = control.morebuttonstart + "px";
            control.morebutton.style.left = border;
            control.scrollarea.style.top = control.scrollareastart + "px";
            control.scrollarea.style.left = border;
            control.scrollarea.style.height = control.scrollareasize + "px";
            realend = Math.max(
                editor.context.sheetobj.attribs.lastrow,
                editor.firstscrollingrow + 1
            );
            thumbpos =
                ((editor.firstscrollingrow - (editor.lastnonscrollingrow + 1)) *
                    (control.scrollareasize - 3 * control.thumbthickness)) /
                (realend - (editor.lastnonscrollingrow + 1)) +
                control.scrollareastart -
                1;
            thumbpos = Math.floor(thumbpos);
            control.thumb.style.top = thumbpos + "px";
            control.thumb.style.left = border;
        } else {
            border = control.controlborder + "px";
            control.endcap.style.left = control.endcapstart + "px";
            control.endcap.style.top = border;
            control.paneslider.style.left = control.panesliderstart + "px";
            control.paneslider.style.top = border;
            control.lessbutton.style.left = control.lessbuttonstart + "px";
            control.lessbutton.style.top = border;
            control.morebutton.style.left = control.morebuttonstart + "px";
            control.morebutton.style.top = border;
            control.scrollarea.style.left = control.scrollareastart + "px";
            control.scrollarea.style.top = border;
            control.scrollarea.style.width = control.scrollareasize + "px";
            realend = Math.max(
                editor.context.sheetobj.attribs.lastcol,
                editor.firstscrollingcol + 1
            );
            thumbpos =
                ((editor.firstscrollingcol - (editor.lastnonscrollingcol + 1)) *
                    (control.scrollareasize - control.thumbthickness)) /
                (realend - editor.lastnonscrollingcol) +
                control.scrollareastart -
                1;
            thumbpos = Math.floor(thumbpos);
            control.thumb.style.left = thumbpos + "px";
            control.thumb.style.top = border;
        }
        control.thumbpos = thumbpos;
        control.main.style.display = "block";
    };

    //
    // ComputeTableControlPositions
    //
    // This routine computes the screen positions and other values needed for laying out
    // the table control elements.
    //

    SocialCalc.ComputeTableControlPositions = function (control) {
        var editor = control.editor;

        if (!editor.gridposition || !editor.headposition)
            throw "Can't compute table control positions before editor positions";

        if (control.vertical) {
            control.controlborder = editor.gridposition.left + editor.tablewidth; // border=left position
            control.endcapstart = editor.gridposition.top; // start=top position
            control.panesliderstart =
                editor.firstscrollingrowtop - control.sliderthickness;
            control.lessbuttonstart = editor.firstscrollingrowtop - 1;
            control.morebuttonstart =
                editor.gridposition.top + editor.tableheight - control.buttonthickness;
            control.scrollareastart =
                editor.firstscrollingrowtop - 1 + control.buttonthickness;
            control.scrollareaend = control.morebuttonstart - 1;
            control.scrollareasize =
                control.scrollareaend - control.scrollareastart + 1;
        } else {
            control.controlborder = editor.gridposition.top + editor.tableheight; // border=top position
            control.endcapstart = editor.gridposition.left; // start=left position
            control.panesliderstart =
                editor.firstscrollingcolleft - control.sliderthickness;
            control.lessbuttonstart = editor.firstscrollingcolleft - 1;
            control.morebuttonstart =
                editor.gridposition.left + editor.tablewidth - control.buttonthickness;
            control.scrollareastart =
                editor.firstscrollingcolleft - 1 + control.buttonthickness;
            control.scrollareaend = control.morebuttonstart - 1;
            control.scrollareasize =
                control.scrollareaend - control.scrollareastart + 1;
        }
    };

    ////// TCPS - TableControl Pan Slider methods

    //
    // TCPSDragFunctionStart(event, draginfo, dobj)
    //
    // TableControlPaneSlider function for starting drag
    //

    SocialCalc.TCPSDragFunctionStart = function (event, draginfo, dobj) {
        var editor = dobj.functionobj.control.editor;
        var scc = SocialCalc.Constants;

        SocialCalc.DragFunctionStart(event, draginfo, dobj);

        draginfo.trackingline = document.createElement("div");
        draginfo.trackingline.style.height = dobj.vertical
            ? scc.TCPStrackinglineThickness
            : editor.tableheight -
            (editor.headposition.top - editor.gridposition.top) +
            "px";
        draginfo.trackingline.style.width = dobj.vertical
            ? editor.tablewidth -
            (editor.headposition.left - editor.gridposition.left) +
            "px"
            : scc.TCPStrackinglineThickness;
        draginfo.trackingline.style.backgroundImage =
            "url(" +
            editor.imageprefix +
            "trackingline-" +
            (dobj.vertical ? "v" : "h") +
            ".gif)";
        if (scc.TCPStrackinglineClass)
            draginfo.trackingline.className = scc.TCPStrackinglineClass;
        SocialCalc.setStyles(draginfo.trackingline, scc.TCPStrackinglineStyle);

        if (dobj.vertical) {
            row = SocialCalc.Lookup(
                draginfo.clientY + dobj.functionobj.control.sliderthickness,
                editor.rowpositions
            );
            draginfo.trackingline.style.top =
                (editor.rowpositions[row] || editor.headposition.top) + "px";
            draginfo.trackingline.style.left = editor.headposition.left + "px";
            if (editor.context.rowpanes.length - 1) {
                // has 2 already
                editor.context.SetRowPaneFirstLast(
                    1,
                    editor.context.rowpanes[0].last + 1,
                    editor.context.rowpanes[0].last + 1
                );
                editor.FitToEditTable();
                editor.ScheduleRender();
            }
        } else {
            col = SocialCalc.Lookup(
                draginfo.clientX + dobj.functionobj.control.sliderthickness,
                editor.colpositions
            );
            draginfo.trackingline.style.top = editor.headposition.top + "px";
            draginfo.trackingline.style.left =
                (editor.colpositions[col] || editor.headposition.left) + "px";
            if (editor.context.colpanes.length - 1) {
                // has 2 already
                editor.context.SetColPaneFirstLast(
                    1,
                    editor.context.colpanes[0].last + 1,
                    editor.context.colpanes[0].last + 1
                );
                editor.FitToEditTable();
                editor.ScheduleRender();
            }
        }

        editor.griddiv.appendChild(draginfo.trackingline);
    };

    //
    // TCPSDragFunctionMove(event, draginfo, dobj)
    //

    SocialCalc.TCPSDragFunctionMove = function (event, draginfo, dobj) {
        var row, col, max, min;
        var control = dobj.functionobj.control;
        var sliderthickness = control.sliderthickness;
        var editor = control.editor;

        if (dobj.vertical) {
            max =
                control.morebuttonstart -
                control.minscrollingpanesize -
                draginfo.offsetY; // restrict movement
            if (draginfo.clientY > max) draginfo.clientY = max;
            min = editor.headposition.top - sliderthickness - draginfo.offsetY;
            if (draginfo.clientY < min) draginfo.clientY = min;

            row = SocialCalc.Lookup(
                draginfo.clientY + sliderthickness,
                editor.rowpositions
            );
            draginfo.trackingline.style.top =
                (editor.rowpositions[row] || editor.headposition.top) + "px";
        } else {
            max =
                control.morebuttonstart -
                control.minscrollingpanesize -
                draginfo.offsetX;
            if (draginfo.clientX > max) draginfo.clientX = max;
            min = editor.headposition.left - sliderthickness - draginfo.offsetX;
            if (draginfo.clientX < min) draginfo.clientX = min;

            col = SocialCalc.Lookup(
                draginfo.clientX + sliderthickness,
                editor.colpositions
            );
            draginfo.trackingline.style.left =
                (editor.colpositions[col] || editor.headposition.left) + "px";
        }

        SocialCalc.DragFunctionPosition(event, draginfo, dobj);
    };

    //
    // TCPSDragFunctionStop(event, draginfo, dobj)
    //

    SocialCalc.TCPSDragFunctionStop = function (event, draginfo, dobj) {
        var row, col, max, min;
        var control = dobj.functionobj.control;
        var sliderthickness = control.sliderthickness;
        var editor = control.editor;

        if (dobj.vertical) {
            max =
                control.morebuttonstart -
                control.minscrollingpanesize -
                draginfo.offsetY; // restrict movement
            if (draginfo.clientY > max) draginfo.clientY = max;
            min = editor.headposition.top - sliderthickness - draginfo.offsetY;
            if (draginfo.clientY < min) draginfo.clientY = min;

            row = SocialCalc.Lookup(
                draginfo.clientY + sliderthickness,
                editor.rowpositions
            );
            if (row > editor.context.sheetobj.attribs.lastrow)
                row = editor.context.sheetobj.attribs.lastrow; // can't extend sheet here
            if (!row || row <= editor.context.rowpanes[0].first) {
                // set to no panes, leaving first pane settings
                if (editor.context.rowpanes.length > 1)
                    editor.context.rowpanes.length = 1;
            } else if (editor.context.rowpanes.length - 1) {
                // has 2 already
                if (!editor.timeout) {
                    // not waiting for position calc (so positions could be wrong)
                    editor.context.SetRowPaneFirstLast(
                        0,
                        editor.context.rowpanes[0].first,
                        row - 1
                    );
                    editor.context.SetRowPaneFirstLast(1, row, row);
                }
            } else {
                editor.context.SetRowPaneFirstLast(
                    0,
                    editor.context.rowpanes[0].first,
                    row - 1
                );
                editor.context.SetRowPaneFirstLast(1, row, row);
            }
        } else {
            max =
                control.morebuttonstart -
                control.minscrollingpanesize -
                draginfo.offsetX;
            if (draginfo.clientX > max) draginfo.clientX = max;
            min = editor.headposition.left - sliderthickness - draginfo.offsetX;
            if (draginfo.clientX < min) draginfo.clientX = min;

            col = SocialCalc.Lookup(
                draginfo.clientX + sliderthickness,
                editor.colpositions
            );
            if (col > editor.context.sheetobj.attribs.lastcol)
                col = editor.context.sheetobj.attribs.lastcol; // can't extend sheet here
            if (!col || col <= editor.context.colpanes[0].first) {
                // set to no panes, leaving first pane settings
                if (editor.context.colpanes.length > 1)
                    editor.context.colpanes.length = 1;
            } else if (editor.context.colpanes.length - 1) {
                // has 2 already
                if (!editor.timeout) {
                    // not waiting for position calc (so positions could be wrong)
                    editor.context.SetColPaneFirstLast(
                        0,
                        editor.context.colpanes[0].first,
                        col - 1
                    );
                    editor.context.SetColPaneFirstLast(1, col, col);
                }
            } else {
                editor.context.SetColPaneFirstLast(
                    0,
                    editor.context.colpanes[0].first,
                    col - 1
                );
                editor.context.SetColPaneFirstLast(1, col, col);
            }
        }

        editor.FitToEditTable();

        editor.griddiv.removeChild(draginfo.trackingline);

        editor.ScheduleRender();
    };

    ////// TCT - TableControl Thumb methods

    //!!!! Note: Need to make start use same code as move/stop for determining row/col, since stop will set that
    //!!!! Note: Need to make start/move/stop use positioning code that corresponds closer to
    //!!!!       ComputeTableControlPositions calculations.

    //
    // TCTDragFunctionStart(event, draginfo, dobj)
    //
    // TableControlThumb function for starting drag
    //

    SocialCalc.TCTDragFunctionStart = function (event, draginfo, dobj) {
        var rowpane, colpane, row, col;

        var control = dobj.functionobj.control;
        var editor = control.editor;
        var scc = SocialCalc.Constants;

        SocialCalc.DragFunctionStart(event, draginfo, dobj);

        if (draginfo.thumbstatus) {
            // get rid of old one if mouseup was out of window
            if (draginfo.thumbstatus.rowmsgele) draginfo.thumbstatus.rowmsgele = null;
            if (draginfo.thumbstatus.rowpreviewele)
                draginfo.thumbstatus.rowpreviewele = null;
            editor.toplevel.removeChild(draginfo.thumbstatus);
            draginfo.thumbstatus = null;
        }

        draginfo.thumbstatus = document.createElement("div");

        if (dobj.vertical) {
            if (scc.TCTDFSthumbstatusvClass)
                draginfo.thumbstatus.className = scc.TCTDFSthumbstatusvClass;
            SocialCalc.setStyles(draginfo.thumbstatus, scc.TCTDFSthumbstatusvStyle);
            draginfo.thumbstatus.style.top =
                draginfo.clientY + scc.TCTDFStopOffsetv + "px";
            draginfo.thumbstatus.style.left =
                control.controlborder - 10 - editor.tablewidth / 2 + "px";
            draginfo.thumbstatus.style.width = editor.tablewidth / 2 + "px";

            draginfo.thumbcontext = new SocialCalc.RenderContext(
                editor.context.sheetobj
            );
            draginfo.thumbcontext.showGrid = true;
            draginfo.thumbcontext.rowpanes = [{ first: 1, last: 1 }];
            var pane = editor.context.colpanes[editor.context.colpanes.length - 1];
            draginfo.thumbcontext.colpanes = [{ first: pane.first, last: pane.last }];
            draginfo.thumbstatus.innerHTML =
                '<table cellspacing="0" cellpadding="0"><tr><td valign="top" style="' +
                scc.TCTDFSthumbstatusrownumStyle +
                '" class="' +
                scc.TCTDFSthumbstatusrownumClass +
                '"><div>msg</div></td><td valign="top"><div style="overflow:hidden;">preview</div></td></tr></table>';
            draginfo.thumbstatus.rowmsgele =
                draginfo.thumbstatus.firstChild.firstChild.firstChild.firstChild.firstChild;
            draginfo.thumbstatus.rowpreviewele =
                draginfo.thumbstatus.firstChild.firstChild.firstChild.childNodes[1].firstChild;
            editor.toplevel.appendChild(draginfo.thumbstatus);
            SocialCalc.TCTDragFunctionRowSetStatus(
                draginfo,
                editor,
                editor.firstscrollingrow || 1
            );
        } else {
            if (scc.TCTDFSthumbstatushClass)
                draginfo.thumbstatus.className = scc.TCTDFSthumbstatushClass;
            SocialCalc.setStyles(draginfo.thumbstatus, scc.TCTDFSthumbstatushStyle);
            draginfo.thumbstatus.style.top =
                control.controlborder + scc.TCTDFStopOffseth + "px";
            draginfo.thumbstatus.style.left =
                draginfo.clientX + scc.TCTDFSleftOffseth + "px";
            editor.toplevel.appendChild(draginfo.thumbstatus);
            draginfo.thumbstatus.innerHTML =
                scc.s_TCTDFthumbstatusPrefixh +
                SocialCalc.rcColname(editor.firstscrollingcol);
        }
    };

    //
    // SocialCalc.TCTDragFunctionRowSetStatus(draginfo, editor, row)
    //
    // Render partial row
    //

    SocialCalc.TCTDragFunctionRowSetStatus = function (draginfo, editor, row) {
        var scc = SocialCalc.Constants;
        var msg = scc.s_TCTDFthumbstatusPrefixv + row + " ";

        draginfo.thumbstatus.rowmsgele.innerHTML = msg;

        draginfo.thumbcontext.rowpanes = [{ first: row, last: row }];
        draginfo.thumbrowshown = row;

        var ele = draginfo.thumbcontext.RenderSheet(
            draginfo.thumbstatus.rowpreviewele.firstChild,
            { type: "html" }
        );
    };

    //
    // TCTDragFunctionMove(event, draginfo, dobj)
    //

    SocialCalc.TCTDragFunctionMove = function (event, draginfo, dobj) {
        var first, msg;
        var control = dobj.functionobj.control;
        var thumbthickness = control.thumbthickness;
        var editor = control.editor;
        var scc = SocialCalc.Constants;

        if (dobj.vertical) {
            if (
                draginfo.clientY >
                control.scrollareaend - draginfo.offsetY - control.thumbthickness + 2
            )
                draginfo.clientY =
                    control.scrollareaend - draginfo.offsetY - control.thumbthickness + 2;
            if (draginfo.clientY < control.scrollareastart - draginfo.offsetY - 1)
                draginfo.clientY = control.scrollareastart - draginfo.offsetY - 1;
            draginfo.thumbstatus.style.top = draginfo.clientY + "px";

            first =
                ((draginfo.clientY + draginfo.offsetY - control.scrollareastart + 1) /
                    (control.scrollareasize - control.thumbthickness)) *
                (editor.context.sheetobj.attribs.lastrow -
                    editor.lastnonscrollingrow) +
                editor.lastnonscrollingrow +
                1;
            first = Math.floor(first);
            if (first <= editor.lastnonscrollingrow)
                first = editor.lastnonscrollingrow + 1;
            if (first > editor.context.sheetobj.attribs.lastrow)
                first = editor.context.sheetobj.attribs.lastrow;
            //      msg = scc.s_TCTDFthumbstatusPrefixv+first;
            if (first != draginfo.thumbrowshown) {
                SocialCalc.TCTDragFunctionRowSetStatus(draginfo, editor, first);
            }
        } else {
            if (
                draginfo.clientX >
                control.scrollareaend - draginfo.offsetX - control.thumbthickness + 2
            )
                draginfo.clientX =
                    control.scrollareaend - draginfo.offsetX - control.thumbthickness + 2;
            if (draginfo.clientX < control.scrollareastart - draginfo.offsetX - 1)
                draginfo.clientX = control.scrollareastart - draginfo.offsetX - 1;
            draginfo.thumbstatus.style.left = draginfo.clientX + "px";

            first =
                ((draginfo.clientX + draginfo.offsetX - control.scrollareastart + 1) /
                    (control.scrollareasize - control.thumbthickness)) *
                (editor.context.sheetobj.attribs.lastcol -
                    editor.lastnonscrollingcol) +
                editor.lastnonscrollingcol +
                1;
            first = Math.floor(first);
            if (first <= editor.lastnonscrollingcol)
                first = editor.lastnonscrollingcol + 1;
            if (first > editor.context.sheetobj.attribs.lastcol)
                first = editor.context.sheetobj.attribs.lastcol;
            msg = scc.s_TCTDFthumbstatusPrefixh + SocialCalc.rcColname(first);
            draginfo.thumbstatus.innerHTML = msg;
        }

        SocialCalc.DragFunctionPosition(event, draginfo, dobj);
    };

    //
    // TCTDragFunctionStop(event, draginfo, dobj)
    //

    SocialCalc.TCTDragFunctionStop = function (event, draginfo, dobj) {
        var first;
        var control = dobj.functionobj.control;
        var editor = control.editor;

        if (dobj.vertical) {
            first =
                ((draginfo.clientY + draginfo.offsetY - control.scrollareastart + 1) /
                    (control.scrollareasize - control.thumbthickness)) *
                (editor.context.sheetobj.attribs.lastrow -
                    editor.lastnonscrollingrow) +
                editor.lastnonscrollingrow +
                1;
            first = Math.floor(first);
            if (first <= editor.lastnonscrollingrow)
                first = editor.lastnonscrollingrow + 1;
            if (first > editor.context.sheetobj.attribs.lastrow)
                first = editor.context.sheetobj.attribs.lastrow;

            editor.context.SetRowPaneFirstLast(
                editor.context.rowpanes.length - 1,
                first,
                first + 1
            );
        } else {
            first =
                ((draginfo.clientX + draginfo.offsetX - control.scrollareastart + 1) /
                    (control.scrollareasize - control.thumbthickness)) *
                (editor.context.sheetobj.attribs.lastcol -
                    editor.lastnonscrollingcol) +
                editor.lastnonscrollingcol +
                1;
            first = Math.floor(first);
            if (first <= editor.lastnonscrollingcol)
                first = editor.lastnonscrollingcol + 1;
            if (first > editor.context.sheetobj.attribs.lastcol)
                first = editor.context.sheetobj.attribs.lastcol;

            editor.context.SetColPaneFirstLast(
                editor.context.colpanes.length - 1,
                first,
                first + 1
            );
        }

        editor.FitToEditTable();

        if (draginfo.thumbstatus.rowmsgele) draginfo.thumbstatus.rowmsgele = null;
        if (draginfo.thumbstatus.rowpreviewele)
            draginfo.thumbstatus.rowpreviewele = null;
        editor.toplevel.removeChild(draginfo.thumbstatus);
        draginfo.thumbstatus = null;

        editor.ScheduleRender();
    };

    // *************************************
    //
    // Dragging functions:
    //
    // *************************************

    SocialCalc.DragInfo = {
        // There is only one of these -- no "new" is done.
        // Only one dragging operation can be active at a time.
        // The registeredElements array is used to decide which item to drag.

        // One item for each draggable thing, each an object with:
        //    .element, .vertical, .horizontal, .functionobj

        registeredElements: [],

        // Items used during a drag

        draggingElement: null, // item being processed (.element is the actual element)
        startX: 0,
        startY: 0,
        startZ: 0,
        clientX: 0, // modifyable version to restrict movement
        clientY: 0,
        offsetX: 0,
        offsetY: 0,
        horizontalScroll: 0, // retrieved at drag start
        verticalScroll: 0,
    };

    //
    // DragRegister(element, vertical, horizontal, functionobj) - make element draggable
    //
    // The functionobj defaults to moving the element contrained only by vertical and horizontal settings.
    //

    SocialCalc.DragRegister = function (
        element,
        vertical,
        horizontal,
        functionobj
    ) {
        var draginfo = SocialCalc.DragInfo;

        if (!functionobj) {
            functionobj = {
                MouseDown: SocialCalc.DragFunctionStart,
                MouseMove: SocialCalc.DragFunctionPosition,
                MouseUp: SocialCalc.DragFunctionPosition,
                Disabled: null,
            };
        }

        draginfo.registeredElements.push({
            element: element,
            vertical: vertical,
            horizontal: horizontal,
            functionobj: functionobj,
        });

        if (element.addEventListener) {
            // DOM Level 2 -- Firefox, et al
            element.addEventListener("mousedown", SocialCalc.DragMouseDown, false);
        } else if (element.attachEvent) {
            // IE 5+
            element.attachEvent("onmousedown", SocialCalc.DragMouseDown);
        } else {
            // don't handle this
            throw SocialCalc.Constants.s_BrowserNotSupported;
        }
    };

    //
    // DragUnregister(element) - remove object from list
    //

    SocialCalc.DragUnregister = function (element) {
        var draginfo = SocialCalc.DragInfo;

        var i;

        if (!element) return;

        for (i = 0; i < draginfo.registeredElements.length; i++) {
            if (draginfo.registeredElements[i].element == element) {
                draginfo.registeredElements.splice(i, 1);
                if (element.removeEventListener) {
                    // DOM Level 2 -- Firefox, et al
                    element.removeEventListener(
                        "mousedown",
                        SocialCalc.DragMouseDown,
                        false
                    );
                } else {
                    // IE 5+
                    element.detachEvent("onmousedown", SocialCalc.DragMouseDown);
                }
                return;
            }
        }

        return; // ignore if not in list
    };

    //
    // DragMouseDown(event)
    //

    SocialCalc.DragMouseDown = function (event) {
        var e = event || window.event;

        var draginfo = SocialCalc.DragInfo;

        var dobj = SocialCalc.LookupElement(
            e.target || e.srcElement,
            draginfo.registeredElements
        );
        if (!dobj) return;

        if (dobj && dobj.functionobj && dobj.functionobj.Disabled) {
            if (dobj.functionobj.Disabled(e, draginfo, dobj)) {
                return;
            }
        }

        draginfo.draggingElement = dobj;

        var viewportinfo = SocialCalc.GetViewportInfo();
        draginfo.horizontalScroll = viewportinfo.horizontalScroll;
        draginfo.verticalScroll = viewportinfo.verticalScroll;

        draginfo.clientX = e.clientX + draginfo.horizontalScroll; // get document-relative coordinates
        draginfo.clientY = e.clientY + draginfo.verticalScroll;
        draginfo.startX = draginfo.clientX;
        draginfo.startY = draginfo.clientY;
        draginfo.startZ = dobj.element.style.zIndex;
        draginfo.offsetX = 0;
        draginfo.offsetY = 0;

        dobj.element.style.zIndex = "100";

        // Event code from JavaScript, Flanagan, 5th Edition, pg. 422
        if (document.addEventListener) {
            // DOM Level 2 -- Firefox, et al
            document.addEventListener("mousemove", SocialCalc.DragMouseMove, true); // capture everywhere
            document.addEventListener("mouseup", SocialCalc.DragMouseUp, true);
        } else if (dobj.element.attachEvent) {
            // IE 5+
            dobj.element.setCapture();
            dobj.element.attachEvent("onmousemove", SocialCalc.DragMouseMove);
            dobj.element.attachEvent("onmouseup", SocialCalc.DragMouseUp);
            dobj.element.attachEvent("onlosecapture", SocialCalc.DragMouseUp);
        }
        if (e.stopPropagation) e.stopPropagation(); // DOM Level 2
        else e.cancelBubble = true; // IE 5+
        if (e.preventDefault) e.preventDefault(); // DOM Level 2
        else e.returnValue = false; // IE 5+

        if (dobj && dobj.functionobj && dobj.functionobj.MouseDown)
            dobj.functionobj.MouseDown(e, draginfo, dobj);

        return false;
    };

    //
    // DragMouseMove(event)
    //

    SocialCalc.DragMouseMove = function (event) {
        var e = event || window.event;

        var draginfo = SocialCalc.DragInfo;
        draginfo.clientX = e.clientX + draginfo.horizontalScroll;
        draginfo.clientY = e.clientY + draginfo.verticalScroll;

        var dobj = draginfo.draggingElement;

        if (e.stopPropagation) e.stopPropagation(); // DOM Level 2
        else e.cancelBubble = true; // IE 5+

        if (dobj && dobj.functionobj && dobj.functionobj.MouseMove)
            dobj.functionobj.MouseMove(e, draginfo, dobj);

        return false;
    };

    //
    // DragMouseUp(event)
    //

    SocialCalc.DragMouseUp = function (event) {
        var e = event || window.event;

        var draginfo = SocialCalc.DragInfo;
        draginfo.clientX = e.clientX + draginfo.horizontalScroll;
        draginfo.clientY = e.clientY + draginfo.verticalScroll;

        var dobj = draginfo.draggingElement;

        dobj.element.style.zIndex = draginfo.startZ;

        if (dobj && dobj.functionobj && dobj.functionobj.MouseUp)
            dobj.functionobj.MouseUp(e, draginfo, dobj);

        if (e.stopPropagation) e.stopPropagation(); // DOM Level 2
        else e.cancelBubble = true; // IE 5+

        if (document.removeEventListener) {
            // DOM Level 2
            document.removeEventListener("mousemove", SocialCalc.DragMouseMove, true);
            document.removeEventListener("mouseup", SocialCalc.DragMouseUp, true);
            // Note: In old (1.5?) versions of Firefox, this causes the browser to skip the MouseUp for
            // the button code. https://bugzilla.mozilla.org/show_bug.cgi?id=174320
            // Firefox 1.5 is <1% share (http://marketshare.hitslink.com/report.aspx?qprid=7)
        } else if (dobj.element.detachEvent) {
            // IE
            dobj.element.detachEvent("onlosecapture", SocialCalc.DragMouseUp);
            dobj.element.detachEvent("onmouseup", SocialCalc.DragMouseUp);
            dobj.element.detachEvent("onmousemove", SocialCalc.DragMouseMove);
            dobj.element.releaseCapture();
        }

        draginfo.draggingElement = null;

        return false;
    };

    //
    // DragFunctionStart(event, draginfo, dobj)
    //

    SocialCalc.DragFunctionStart = function (event, draginfo, dobj) {
        var val;
        var element = dobj.functionobj.positionobj || dobj.element;

        val = element.style.top.match(/\d*/);
        draginfo.offsetY = (val ? val[0] - 0 : 0) - draginfo.clientY;
        val = element.style.left.match(/\d*/);
        draginfo.offsetX = (val ? val[0] - 0 : 0) - draginfo.clientX;
    };

    //
    // DragFunctionPosition(event, draginfo, dobj)
    //

    SocialCalc.DragFunctionPosition = function (event, draginfo, dobj) {
        var element = dobj.functionobj.positionobj || dobj.element;

        if (dobj.vertical)
            element.style.top = draginfo.clientY + draginfo.offsetY + "px";
        if (dobj.horizontal)
            element.style.left = draginfo.clientX + draginfo.offsetX + "px";
    };

    // *************************************
    //
    // Tooltip functions:
    //
    // *************************************

    SocialCalc.TooltipInfo = {
        // There is only one of these -- no "new" is done.
        // Only one tooltip operation can be active at a time.
        // The registeredElements array is used to identify items.

        // One item for each element with a tooltip, each an object with:
        //    .element, .tiptext, .functionobj
        // Currently .functionobj can only contain .offsetx and .offsety.
        // If present they are used instead of the default ones.

        registeredElements: [],

        registered: false, // if true, an event handler has been registered for this functionality

        // Items used during hover over an element

        tooltipElement: null, // item being processed (.element is the actual element)
        timer: null, // timer object waiting to see if holding over element
        popupElement: null, // tooltip element being displayed
        clientX: 0, // modifyable version to restrict movement
        clientY: 0,
        offsetX: SocialCalc.Constants.TooltipOffsetX, // modifyable version to allow positioning
        offsetY: SocialCalc.Constants.TooltipOffsetY,
    };

    //
    // TooltipRegister(element, tiptext, functionobj) - make element have a tooltip
    //

    SocialCalc.TooltipRegister = function (element, tiptext, functionobj) {
        var tooltipinfo = SocialCalc.TooltipInfo;
        tooltipinfo.registeredElements.push({
            element: element,
            tiptext: tiptext,
            functionobj: functionobj,
        });

        if (tooltipinfo.registered) return; // only need to add event listener once

        if (document.addEventListener) {
            // DOM Level 2 -- Firefox, et al
            document.addEventListener(
                "mousemove",
                SocialCalc.TooltipMouseMove,
                false
            );
        } else if (document.attachEvent) {
            // IE 5+
            document.attachEvent("onmousemove", SocialCalc.TooltipMouseMove);
        } else {
            // don't handle this
            throw SocialCalc.Constants.s_BrowserNotSupported;
        }

        tooltipinfo.registered = true; // remember

        return;
    };

    //
    // TooltipMouseMove(event)
    //

    SocialCalc.TooltipMouseMove = function (event) {
        var e = event || window.event;

        var tooltipinfo = SocialCalc.TooltipInfo;

        tooltipinfo.viewport = SocialCalc.GetViewportInfo();
        tooltipinfo.clientX = e.clientX + tooltipinfo.viewport.horizontalScroll;
        tooltipinfo.clientY = e.clientY + tooltipinfo.viewport.verticalScroll;

        var tobj = SocialCalc.LookupElement(
            e.target || e.srcElement,
            tooltipinfo.registeredElements
        );

        if (tooltipinfo.timer) {
            // waiting to see if holding still: didn't hold still
            window.clearTimeout(tooltipinfo.timer); // cancel timer
            tooltipinfo.timer = null;
        }

        if (tooltipinfo.popupElement) {
            // currently displaying a tip: hide it
            SocialCalc.TooltipHide();
        }

        tooltipinfo.tooltipElement = tobj || null;

        if (!tobj || SocialCalc.ButtonInfo.buttonDown) return; // if not an object with a tip or a "button" is down, ignore

        tooltipinfo.timer = window.setTimeout(SocialCalc.TooltipWaitDone, 700);

        if (tooltipinfo.tooltipElement.element.addEventListener) {
            // Register event for mouse down which cancels tooltip stuff
            tooltipinfo.tooltipElement.element.addEventListener(
                "mousedown",
                SocialCalc.TooltipMouseDown,
                false
            );
        } else if (tooltipinfo.tooltipElement.element.attachEvent) {
            // IE
            tooltipinfo.tooltipElement.element.attachEvent(
                "onmousedown",
                SocialCalc.TooltipMouseDown
            );
        }

        return;
    };

    //
    // TooltipMouseDown(event)
    //

    SocialCalc.TooltipMouseDown = function (event) {
        var e = event || window.event;

        var tooltipinfo = SocialCalc.TooltipInfo;

        if (tooltipinfo.timer) {
            window.clearTimeout(tooltipinfo.timer); // cancel timer
            tooltipinfo.timer = null;
        }

        if (tooltipinfo.popupElement) {
            // currently displaying a tip: hide it
            SocialCalc.TooltipHide();
        }

        if (tooltipinfo.tooltipElement) {
            if (tooltipinfo.tooltipElement.element.removeEventListener) {
                // DOM Level 2 -- Firefox, et al
                tooltipinfo.tooltipElement.element.removeEventListener(
                    "mousedown",
                    SocialCalc.TooltipMouseDown,
                    false
                );
            } else if (tooltipinfo.tooltipElement.element.attachEvent) {
                // IE 5+
                tooltipinfo.tooltipElement.element.detachEvent(
                    "onmousedown",
                    SocialCalc.TooltipMouseDown
                );
            }
            tooltipinfo.tooltipElement = null;
        }

        return;
    };

    //
    // TooltipDisplay(tobj)
    //

    SocialCalc.TooltipDisplay = function (tobj) {
        var tooltipinfo = SocialCalc.TooltipInfo;
        var scc = SocialCalc.Constants;
        var offsetX =
            tobj.functionobj && typeof tobj.functionobj.offsetx == "number"
                ? tobj.functionobj.offsetx
                : tooltipinfo.offsetX;
        var offsetY =
            tobj.functionobj && typeof tobj.functionobj.offsety == "number"
                ? tobj.functionobj.offsety
                : tooltipinfo.offsetY;

        tooltipinfo.popupElement = document.createElement("div");
        if (scc.TDpopupElementClass)
            tooltipinfo.popupElement.className = scc.TDpopupElementClass;
        SocialCalc.setStyles(tooltipinfo.popupElement, scc.TDpopupElementStyle);

        tooltipinfo.popupElement.innerHTML = tobj.tiptext;

        if (tooltipinfo.clientX > tooltipinfo.viewport.width / 2) {
            // on right side of screen
            tooltipinfo.popupElement.style.bottom =
                tooltipinfo.viewport.height - tooltipinfo.clientY + offsetY + "px";
            tooltipinfo.popupElement.style.right =
                tooltipinfo.viewport.width - tooltipinfo.clientX + offsetX + "px";
        } else {
            // on left side of screen
            tooltipinfo.popupElement.style.bottom =
                tooltipinfo.viewport.height - tooltipinfo.clientY + offsetY + "px";
            tooltipinfo.popupElement.style.left =
                tooltipinfo.clientX + offsetX + "px";
        }

        if (tooltipinfo.clientY < 50) {
            // make sure fits on screen if nothing above grid
            tooltipinfo.popupElement.style.bottom =
                tooltipinfo.viewport.height - tooltipinfo.clientY + offsetY - 50 + "px";
        }

        document.body.appendChild(tooltipinfo.popupElement);
    };

    //
    // TooltipHide()
    //

    SocialCalc.TooltipHide = function () {
        var tooltipinfo = SocialCalc.TooltipInfo;

        if (tooltipinfo.popupElement) {
            tooltipinfo.popupElement.parentNode.removeChild(tooltipinfo.popupElement);
            tooltipinfo.popupElement = null;
        }
    };

    //
    // TooltipWaitDone()
    //

    SocialCalc.TooltipWaitDone = function () {
        var tooltipinfo = SocialCalc.TooltipInfo;

        tooltipinfo.timer = null;

        SocialCalc.TooltipDisplay(tooltipinfo.tooltipElement);
    };

    // *************************************
    //
    // Button functions:
    //
    // *************************************

    SocialCalc.ButtonInfo = {
        // There is only one of these -- no "new" is done.
        // Only one button operation can be active at a time.
        // The registeredElements array is used to identify items.

        // One item for each clickable element, each an object with:
        //    .element, .normalstyle, .hoverstyle, .downstyle, .repeatinterval, .functionobj
        //
        // .functionobj is an object with optional function objects for:
        //    mouseover, mouseout, mousedown, repeatinterval, mouseup, disabled

        registeredElements: [],

        // Items used during hover over an element, clicking, repeating, etc.

        buttonElement: null, // item being processed, hover or down (.element is the actual element)
        doingHover: false, // true if mouse is over one of our elements
        buttonDown: false, // true if button down and buttonElement not null
        timer: null, // timer object for repeating

        // Used while processing an event

        horizontalScroll: 0,
        verticalScroll: 0,
        clientX: 0,
        clientY: 0,
    };

    //
    // ButtonRegister(element, paramobj, functionobj) - make element clickable
    //
    // The arguments (other than element) may be null (meaning no change for style and no repeat)
    // The paramobj has the optional normalstyle, hoverstyle, downstyle, repeatwait, repeatinterval settings

    SocialCalc.ButtonRegister = function (element, paramobj, functionobj) {
        var buttoninfo = SocialCalc.ButtonInfo;

        if (!paramobj) paramobj = {};

        buttoninfo.registeredElements.push({
            name: paramobj.name,
            element: element,
            normalstyle: paramobj.normalstyle,
            hoverstyle: paramobj.hoverstyle,
            downstyle: paramobj.downstyle,
            repeatwait: paramobj.repeatwait,
            repeatinterval: paramobj.repeatinterval,
            functionobj: functionobj,
        });

        if (element.addEventListener) {
            // DOM Level 2 -- Firefox, et al
            element.addEventListener("mousedown", SocialCalc.ButtonMouseDown, false);
            element.addEventListener("mouseover", SocialCalc.ButtonMouseOver, false);
            element.addEventListener("mouseout", SocialCalc.ButtonMouseOut, false);
        } else if (element.attachEvent) {
            // IE 5+
            element.attachEvent("onmousedown", SocialCalc.ButtonMouseDown);
            element.attachEvent("onmouseover", SocialCalc.ButtonMouseOver);
            element.attachEvent("onmouseout", SocialCalc.ButtonMouseOut);
        } else {
            // don't handle this
            throw SocialCalc.Constants.s_BrowserNotSupported;
        }

        return;
    };

    //
    // ButtonMouseOver(event)
    //

    SocialCalc.ButtonMouseOver = function (event) {
        var e = event || window.event;

        var buttoninfo = SocialCalc.ButtonInfo;

        var bobj = SocialCalc.LookupElement(
            e.target || e.srcElement,
            buttoninfo.registeredElements
        );

        if (!bobj) return;

        if (buttoninfo.buttonDown) {
            if (buttoninfo.buttonElement == bobj) {
                buttoninfo.doingHover = true; // keep track whether we are on the pressed button or not
            }
            return;
        }

        if (
            buttoninfo.buttonElement &&
            buttoninfo.buttonElement != bobj &&
            buttoninfo.doingHover
        ) {
            // moved to a new one, undo hover there
            SocialCalc.setStyles(
                buttoninfo.buttonElement.element,
                buttoninfo.buttonElement.normalstyle
            );
        }

        buttoninfo.buttonElement = bobj; // remember this one is hovering
        buttoninfo.doingHover = true;

        SocialCalc.setStyles(bobj.element, bobj.hoverstyle); // set style (if provided)

        if (bobj && bobj.functionobj && bobj.functionobj.MouseOver)
            bobj.functionobj.MouseOver(e, buttoninfo, bobj);

        return;
    };

    //
    // ButtonMouseOut(event)
    //

    SocialCalc.ButtonMouseOut = function (event) {
        var e = event || window.event;

        var buttoninfo = SocialCalc.ButtonInfo;

        if (buttoninfo.buttonDown) {
            buttoninfo.doingHover = false; // keep track of overs and outs
            return;
        }

        var bobj = SocialCalc.LookupElement(
            e.target || e.srcElement,
            buttoninfo.registeredElements
        );

        if (buttoninfo.doingHover) {
            // if there was a hover, undo it
            if (buttoninfo.buttonElement)
                SocialCalc.setStyles(
                    buttoninfo.buttonElement.element,
                    buttoninfo.buttonElement.normalstyle
                );
            buttoninfo.buttonElement = null;
            buttoninfo.doingHover = false;
        }

        if (bobj && bobj.functionobj && bobj.functionobj.MouseOut)
            bobj.functionobj.MouseOut(e, buttoninfo, bobj);

        return;
    };

    //
    // ButtonMouseDown(event)
    //

    SocialCalc.ButtonMouseDown = function (event) {
        var e = event || window.event;

        var buttoninfo = SocialCalc.ButtonInfo;

        var viewportinfo = SocialCalc.GetViewportInfo();

        var bobj = SocialCalc.LookupElement(
            e.target || e.srcElement,
            buttoninfo.registeredElements
        );

        if (!bobj) return; // not one of our elements

        if (bobj && bobj.functionobj && bobj.functionobj.Disabled) {
            if (bobj.functionobj.Disabled(e, buttoninfo, bobj)) {
                return;
            }
        }

        buttoninfo.buttonElement = bobj;
        buttoninfo.buttonDown = true;

        SocialCalc.setStyles(bobj.element, buttoninfo.buttonElement.downstyle);

        // Register event handler for mouse up

        // Event code from JavaScript, Flanagan, 5th Edition, pg. 422
        if (document.addEventListener) {
            // DOM Level 2 -- Firefox, et al
            document.addEventListener("mouseup", SocialCalc.ButtonMouseUp, true); // capture everywhere
        } else if (bobj.element.attachEvent) {
            // IE 5+
            bobj.element.setCapture();
            bobj.element.attachEvent("onmouseup", SocialCalc.ButtonMouseUp);
            bobj.element.attachEvent("onlosecapture", SocialCalc.ButtonMouseUp);
        }
        if (e.stopPropagation) e.stopPropagation(); // DOM Level 2
        else e.cancelBubble = true; // IE 5+
        if (e.preventDefault) e.preventDefault(); // DOM Level 2
        else e.returnValue = false; // IE 5+

        buttoninfo.horizontalScroll = viewportinfo.horizontalScroll;
        buttoninfo.verticalScroll = viewportinfo.verticalScroll;
        buttoninfo.clientX = e.clientX + buttoninfo.horizontalScroll; // get document-relative coordinates
        buttoninfo.clientY = e.clientY + buttoninfo.verticalScroll;

        if (bobj && bobj.functionobj && bobj.functionobj.MouseDown)
            bobj.functionobj.MouseDown(e, buttoninfo, bobj);

        if (bobj.repeatwait) {
            // if a repeat wait is set, then starting waiting for first repetition
            buttoninfo.timer = window.setTimeout(
                SocialCalc.ButtonRepeat,
                bobj.repeatwait
            );
        }

        return;
    };

    //
    // ButtonMouseUp(event)
    //

    SocialCalc.ButtonMouseUp = function (event) {
        var e = event || window.event;

        var buttoninfo = SocialCalc.ButtonInfo;
        var bobj = buttoninfo.buttonElement;

        if (buttoninfo.timer) {
            // if repeating, cancel it
            window.clearTimeout(buttoninfo.timer); // cancel timer
            buttoninfo.timer = null;
        }

        if (!buttoninfo.buttonDown) return; // already did this (e.g., in IE, releaseCapture fires losecapture)

        if (e.stopPropagation) e.stopPropagation(); // DOM Level 2
        else e.cancelBubble = true; // IE 5+
        if (e.preventDefault) e.preventDefault(); // DOM Level 2
        else e.returnValue = false; // IE 5+

        if (document.removeEventListener) {
            // DOM Level 2
            document.removeEventListener("mouseup", SocialCalc.ButtonMouseUp, true);
        } else if (document.detachEvent) {
            // IE
            bobj.element.detachEvent("onlosecapture", SocialCalc.ButtonMouseUp);
            bobj.element.detachEvent("onmouseup", SocialCalc.ButtonMouseUp);
            bobj.element.releaseCapture();
        }

        if (buttoninfo.buttonElement.downstyle) {
            if (buttoninfo.doingHover)
                SocialCalc.setStyles(bobj.element, buttoninfo.buttonElement.hoverstyle);
            else
                SocialCalc.setStyles(
                    bobj.element,
                    buttoninfo.buttonElement.normalstyle
                );
        }

        buttoninfo.buttonDown = false;

        if (bobj && bobj.functionobj && bobj.functionobj.MouseUp)
            bobj.functionobj.MouseUp(e, buttoninfo, bobj);
    };

    //
    // ButtonRepeat()
    //

    SocialCalc.ButtonRepeat = function () {
        var buttoninfo = SocialCalc.ButtonInfo;
        var bobj = buttoninfo.buttonElement;

        if (!bobj) return;

        if (bobj && bobj.functionobj && bobj.functionobj.Repeat)
            bobj.functionobj.Repeat(null, buttoninfo, bobj);

        buttoninfo.timer = window.setTimeout(
            SocialCalc.ButtonRepeat,
            bobj.repeatinterval || 100
        );
    };

    // *************************************
    //
    // MouseWheel functions:
    //
    // *************************************

    SocialCalc.MouseWheelInfo = {
        // There is only one of these -- no "new" is done.
        // The mousewheel only affects the one area the mouse pointer is over
        // The registeredElements array is used to identify items.

        // One item for each element to respond to the mousewheel, each an object with:
        //    .element, .functionobj

        registeredElements: [],
    };

    //
    // MouseWheelRegister(element, functionobj) - make element respond to mousewheel
    //

    SocialCalc.MouseWheelRegister = function (element, functionobj) {
        var mousewheelinfo = SocialCalc.MouseWheelInfo;

        mousewheelinfo.registeredElements.push({
            element: element,
            functionobj: functionobj,
        });

        if (element.addEventListener) {
            // DOM Level 2 -- Firefox, et al
            element.addEventListener(
                "DOMMouseScroll",
                SocialCalc.ProcessMouseWheel,
                false
            );
            element.addEventListener(
                "mousewheel",
                SocialCalc.ProcessMouseWheel,
                false
            ); // Opera needs this
        } else if (element.attachEvent) {
            // IE 5+
            element.attachEvent("onmousewheel", SocialCalc.ProcessMouseWheel);
        } else {
            // don't handle this
            throw SocialCalc.Constants.s_BrowserNotSupported;
        }

        return;
    };

    SocialCalc.ProcessMouseWheel = function (e) {
        var event = e || window.event;
        var delta, coord;

        if (SocialCalc.Keyboard.passThru) return; // ignore

        var mousewheelinfo = SocialCalc.MouseWheelInfo;
        var ele = event.target || event.srcElement; // source object is often within what we want
        var wobj;

        for (wobj = null; !wobj && ele; ele = ele.parentNode) {
            // go up tree looking for one of our elements
            wobj = SocialCalc.LookupElement(ele, mousewheelinfo.registeredElements);
        }
        if (!wobj) return; // not one of our elements

        if (event.wheelDelta) {
            delta = event.wheelDelta / 120;
        } else delta = -event.detail / 3;
        if (!delta) delta = 0;

        if (wobj.functionobj && wobj.functionobj.WheelMove)
            wobj.functionobj.WheelMove(event, delta, mousewheelinfo, wobj);

        if (event.preventDefault) event.preventDefault();
        event.returnValue = false;
    };

    // *************************************
    //
    // Keyboard functions:
    //
    // For more information about keyboard handling, see: http://unixpapa.com/js/key.html
    //
    // *************************************

    SocialCalc.keyboardTables = {
        specialKeysCommon: {
            8: "[backspace]",
            9: "[tab]",
            13: "[enter]",
            25: "[tab]",
            27: "[esc]",
            33: "[pgup]",
            34: "[pgdn]",
            35: "[end]",
            36: "[home]",
            37: "[aleft]",
            38: "[aup]",
            39: "[aright]",
            40: "[adown]",
            45: "[ins]",
            46: "[del]",
            113: "[f2]",
        },

        specialKeysIE: {
            8: "[backspace]",
            9: "[tab]",
            13: "[enter]",
            25: "[tab]",
            27: "[esc]",
            33: "[pgup]",
            34: "[pgdn]",
            35: "[end]",
            36: "[home]",
            37: "[aleft]",
            38: "[aup]",
            39: "[aright]",
            40: "[adown]",
            45: "[ins]",
            46: "[del]",
            113: "[f2]",
        },

        controlKeysIE: {
            67: "[ctrl-c]",
            83: "[ctrl-s]",
            86: "[ctrl-v]",
            88: "[ctrl-x]",
            90: "[ctrl-z]",
        },

        specialKeysOpera: {
            8: "[backspace]",
            9: "[tab]",
            13: "[enter]",
            25: "[tab]",
            27: "[esc]",
            33: "[pgup]",
            34: "[pgdn]",
            35: "[end]",
            36: "[home]",
            37: "[aleft]",
            38: "[aup]",
            39: "[aright]",
            40: "[adown]",
            45: "[ins]", // issues with releases before 9.5 - same as "-" ("-" changed in 9.5)
            46: "[del]", // issues with releases before 9.5 - same as "." ("." changed in 9.5)
            113: "[f2]",
        },

        controlKeysOpera: {
            67: "[ctrl-c]",
            83: "[ctrl-s]",
            86: "[ctrl-v]",
            88: "[ctrl-x]",
            90: "[ctrl-z]",
        },

        specialKeysSafari: {
            8: "[backspace]",
            9: "[tab]",
            13: "[enter]",
            25: "[tab]",
            27: "[esc]",
            63232: "[aup]",
            63233: "[adown]",
            63234: "[aleft]",
            63235: "[aright]",
            63272: "[del]",
            63273: "[home]",
            63275: "[end]",
            63276: "[pgup]",
            63277: "[pgdn]",
            63237: "[f2]",
        },

        controlKeysSafari: {
            99: "[ctrl-c]",
            115: "[ctrl-s]",
            118: "[ctrl-v]",
            120: "[ctrl-x]",
            122: "[ctrl-z]",
        },

        ignoreKeysSafari: {
            63236: "[f1]",
            63238: "[f3]",
            63239: "[f4]",
            63240: "[f5]",
            63241: "[f6]",
            63242: "[f7]",
            63243: "[f8]",
            63244: "[f9]",
            63245: "[f10]",
            63246: "[f11]",
            63247: "[f12]",
            63289: "[numlock]",
        },

        specialKeysFirefox: {
            8: "[backspace]",
            9: "[tab]",
            13: "[enter]",
            25: "[tab]",
            27: "[esc]",
            33: "[pgup]",
            34: "[pgdn]",
            35: "[end]",
            36: "[home]",
            37: "[aleft]",
            38: "[aup]",
            39: "[aright]",
            40: "[adown]",
            45: "[ins]",
            46: "[del]",
            113: "[f2]",
        },

        controlKeysFirefox: {
            99: "[ctrl-c]",
            115: "[ctrl-s]",
            118: "[ctrl-v]",
            120: "[ctrl-x]",
            122: "[ctrl-z]",
        },

        ignoreKeysFirefox: {
            16: "[shift]",
            17: "[ctrl]",
            18: "[alt]",
            20: "[capslock]",
            19: "[pause]",
            44: "[printscreen]",
            91: "[windows]",
            92: "[windows]",
            112: "[f1]",
            114: "[f3]",
            115: "[f4]",
            116: "[f5]",
            117: "[f6]",
            118: "[f7]",
            119: "[f8]",
            120: "[f9]",
            121: "[f10]",
            122: "[f11]",
            123: "[f12]",
            144: "[numlock]",
            145: "[scrolllock]",
            224: "[cmd]",
        },
    };

    SocialCalc.Keyboard = {
        areListener: false, // if true, we have been installed as a listener for keyboard events
        focusTable: null, // the table editor object that gets keystrokes or null
        passThru: null, // if not null, control element with focus to pass keyboard events to (has blur method), or "true"
        didProcessKey: false, // did SocialCalc.ProcessKey in keydown
        statusFromProcessKey: false, // the status from the keydown SocialCalc.ProcessKey
        repeatingKeyPress: false, // some browsers (Opera, Gecko Mac) repeat special keys as KeyPress not KeyDown
        chForProcessKey: "", // remember so can do repeat in those cases
    };

    SocialCalc.KeyboardSetFocus = function (editor) {
        SocialCalc.Keyboard.focusTable = editor;

        if (!SocialCalc.Keyboard.areListener) {
            document.onkeydown = SocialCalc.ProcessKeyDown;
            document.onkeypress = SocialCalc.ProcessKeyPress;
            SocialCalc.Keyboard.areListener = true;
        }
        if (SocialCalc.Keyboard.passThru) {
            if (SocialCalc.Keyboard.passThru.blur) {
                SocialCalc.Keyboard.passThru.blur();
            }
            SocialCalc.Keyboard.passThru = null;
        }
        window.focus();
    };

    SocialCalc.KeyboardFocus = function () {
        SocialCalc.Keyboard.passThru = null;
        window.focus();
    };

    SocialCalc.ProcessKeyDown = function (e) {
        var kt = SocialCalc.keyboardTables;
        kt.didProcessKey = false; // always start false
        kt.statusFromProcessKey = false;
        kt.repeatingKeyPress = false;

        var ch = "";
        var status = true;

        if (SocialCalc.Keyboard.passThru) return; // ignore

        e = e || window.event;

        // IE and Safari 3.1+ won't fire keyPress, so check for special keys here.
        if (e.which == undefined || typeof e.keyIdentifier == "string") {
            ch = kt.specialKeysCommon[e.keyCode];
            if (!ch) {
                if (e.ctrlKey) {
                    ch = kt.controlKeysIE[e.keyCode];
                }
                if (!ch) return true;
            }
            status = SocialCalc.ProcessKey(ch, e);

            if (!status) {
                if (e.preventDefault) e.preventDefault();
                e.returnValue = false;
            }
        } else {
            ch = kt.specialKeysCommon[e.keyCode];
            if (!ch) {
                //         return true;
                if (e.ctrlKey || e.metaKey) {
                    ch = kt.controlKeysIE[e.keyCode]; // this works here
                }
                if (!ch) return true;
            }

            status = SocialCalc.ProcessKey(ch, e); // process the key
            kt.didProcessKey = true; // remember what happened
            kt.statusFromProcessKey = status;
            kt.chForProcessKey = ch;
        }

        return status;
    };

    SocialCalc.ProcessKeyPress = function (e) {
        var kt = SocialCalc.keyboardTables;

        var ch = "";

        e = e || window.event;

        if (SocialCalc.Keyboard.passThru) return; // ignore
        if (kt.didProcessKey) {
            // already processed this key
            if (kt.repeatingKeyPress) {
                return SocialCalc.ProcessKey(kt.chForProcessKey, e); // process the same key as on KeyDown
            } else {
                kt.repeatingKeyPress = true; // see if get another KeyPress before KeyDown
                return kt.statusFromProcessKey; // do what it said to do
            }
        }

        if (e.which == undefined) {
            // IE
            // Note: Esc and Enter will come through here, too, if not stopped at KeyDown
            ch = String.fromCharCode(e.keyCode); // convert to a character (special chars handled at ev1)
        } else {
            // not IE
            if (!e.which) return false; // ignore - special key
            if (e.charCode == undefined) {
                // Opera
                if (e.which != 0) {
                    // character
                    if (e.which < 32 || e.which == 144) {
                        // special char (144 is numlock)
                        ch = kt.specialKeysOpera[e.which];
                        if (ch) {
                            return true;
                        }
                    } else {
                        if (e.ctrlKey) {
                            ch = kt.controlKeysOpera[e.keyCode];
                        } else {
                            ch = String.fromCharCode(e.which);
                        }
                    }
                } else {
                    // special char
                    return true;
                }
            } else if (e.keyCode == 0 && e.charCode == 0) {
                // OLPC Fn key or something
                return; // ignore
            } else if (e.keyCode == e.charCode) {
                // Safari
                ch = kt.specialKeysSafari[e.keyCode];
                if (!ch) {
                    if (kt.ignoreKeysSafari[e.keyCode])
                        // pass this through
                        return true;
                    if (e.metaKey) {
                        ch = kt.controlKeysSafari[e.keyCode];
                    } else {
                        ch = String.fromCharCode(e.which);
                    }
                }
            } else {
                // Firefox
                if (kt.specialKeysFirefox[e.keyCode]) {
                    return true;
                }
                ch = String.fromCharCode(e.which);
                if (e.ctrlKey || e.metaKey) {
                    ch = kt.controlKeysFirefox[e.which];
                }
            }
        }

        var status = SocialCalc.ProcessKey(ch, e);

        if (!status) {
            if (e.preventDefault) e.preventDefault();
            e.returnValue = false;
        }

        return status;
    };

    /* 
  *
  * OLD ProcessKeyDown and ProcessKeyPress -- replaced for handling newer browsers, including Safari 3.1 and Opera 9.5
  *
  
  SocialCalc.ProcessKeyDown = function(e) {
  
  var kt = SocialCalc.keyboardTables;
  
  var ch="";
  var status=true;
  
  if (SocialCalc.Keyboard.passThru) return; // ignore
  
  e = e || window.event;
  
  if (e.which==undefined) { // IE
  ch = kt.specialKeysIE[e.keyCode];
  if (!ch) {
  if (e.ctrlKey) {
  ch=kt.controlKeysIE[e.keyCode];
  }
  if (!ch)
  return true;
  }
  
  status = SocialCalc.ProcessKey(ch, e);
  
  if (!status) {
  if (e.preventDefault) e.preventDefault();
  e.returnValue = false;
  }
  }
  
  else { // don't do anything for other browsers - wait for keyPress
  ; // special key repeats are done as keypress in those browsers
  }
  
  return status;
  
  }
  
  SocialCalc.ProcessKeyPress = function(e) {
  
  var kt = SocialCalc.keyboardTables;
  
  var ch="";
  
  if (SocialCalc.Keyboard.passThru) return; // ignore
  
  e = e || window.event;
  
  if (e.which==undefined) { // IE
  // Note: Esc and Enter will come through here, too, if not stopped at KeyDown
  ch=String.fromCharCode(e.keyCode); // convert to a character (special chars handled at ev1)
  }
  
  else { // not IE
  if (e.charCode==undefined) { // Opera
  if (e.which!=0) { // character
  if (e.which<32) { // special char
  ch = kt.specialKeysOpera[e.keyCode];
  if (!ch)
  return true;
  }
  else {
  if (e.ctrlKey) {
  ch=kt.controlKeysOpera[e.keyCode];
  }
  else {
  ch = String.fromCharCode(e.which);
  }
  }
  }
  else { // special char
  ch = kt.specialKeysOpera[e.keyCode];
  if (!ch)
  return true;
  }
  }
  
  else if (e.keyCode==0 && e.charCode==0) { // OLPC Fn key or something
  return; // ignore
  }
  
  else if (e.keyCode==e.charCode) { // Safari
  ch = kt.specialKeysSafari[e.keyCode];
  if (!ch) {
  if (kt.ignoreKeysSafari[e.keyCode]) // pass this through
  return true;
  if (e.metaKey) {
  ch=kt.controlKeysSafari[e.keyCode];
  }
  else {
  ch = String.fromCharCode(e.which);
  }
  }
  }
  
  else { // Firefox
  ch = kt.specialKeysFirefox[e.keyCode];
  if (!ch) {
  if (kt.ignoreKeysFirefox[e.keyCode]) // pass this through
  return true;
  if (e.which) { // normal char
  if (e.ctrlKey || e.metaKey) {
  ch = kt.controlKeysFirefox[e.which];
  }
  else {
  ch = String.fromCharCode(e.which);
  }
  }
  else { // usually a special char
  return true; // old Firefox gives extra, empty keyPress for "/" - ignore
  }
  }
  }
  }
  
  var status = SocialCalc.ProcessKey(ch, e);
  
  if (!status) {
  if (e.preventDefault) e.preventDefault();
  e.returnValue = false;
  }
  
  return status;
  
  }
  */

    //
    // status = SocialCalc.ProcessKey(ch, e)
    //
    // Take a key representation as a character string and dispatch to appropriate routine
    //

    SocialCalc.ProcessKey = function (ch, e) {
        var ft = SocialCalc.Keyboard.focusTable;

        if (!ft) return true; // we're not handling it -- let browser do default

        return ft.EditorProcessKey(ch, e);
    };


    // Make sure SocialCalc is available globally
    if (typeof window !== "undefined") {
        window.SocialCalc = SocialCalc;
    } else if (typeof global !== "undefined") {
        global.SocialCalc = SocialCalc;
    }

    return SocialCalc;
});
