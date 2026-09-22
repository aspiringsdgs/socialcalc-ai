/* eslint-disable */
// SocialCalc Render Module (RenderContext, coordinate/DOM helpers, value display, format conversion)
// Part of the SocialCalc core engine - see README.md in this folder for the module map and load order

// UMD wrapper
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.SocialCalcRender = factory();
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
    // RenderContext class:
    //
    // *************************************

    SocialCalc.RenderContext = function (sheetobj) {
        var parts, num, s;
        var attribs = sheetobj.attribs;
        var scc = SocialCalc.Constants;

        // properties:

        this.sheetobj = sheetobj;
        this.hideRowsCols = false; // Rendering with panes only works with "false"
        // !!!! Note: not implemented yet in rendering, just saved as an attribute
        this.showGrid = false;
        this.showRCHeaders = false;
        this.rownamewidth = scc.defaultRowNameWidth;
        this.pixelsPerRow = scc.defaultAssumedRowHeight;

        this.cellskip = {}; // if present, coord of cell covering this cell
        this.coordToCR = {}; // for cells starting spans, coordToCR[coord]={row:row, col:col}
        this.colwidth = []; // precomputed column widths, taking into account defaults
        this.totalwidth = 0; // precomputed total table width

        this.rowpanes = []; // for each pane, {first: firstrow, last: lastrow}
        this.colpanes = []; // for each pane, {first: firstrow, last: lastrow}
        this.maxcol = 0; // max col and row to display, adding long spans, etc.
        this.maxrow = 0;

        this.highlights = {}; // for each cell with special display: coord:highlightType (see this.highlightTypes)
        this.cursorsuffix = ""; // added to highlights[cr]=="cursor" to get type to lookup

        this.highlightTypes =
        // attributes to change when highlit
        {
            cursor: {
                style: scc.defaultHighlightTypeCursorStyle,
                className: scc.defaultHighlightTypeCursorClass,
            },
            range: {
                style: scc.defaultHighlightTypeRangeStyle,
                className: scc.defaultHighlightTypeRangeClass,
            },
            cursorinsertup: {
                style:
                    "color:#FFF;backgroundColor:#A6A6A6;backgroundRepeat:repeat-x;backgroundPosition:top left;backgroundImage:url(" +
                    scc.defaultImagePrefix +
                    "cursorinsertup.gif);",
                className: scc.defaultHighlightTypeCursorClass,
            },
            cursorinsertleft: {
                style:
                    "color:#FFF;backgroundColor:#A6A6A6;backgroundRepeat:repeat-y;backgroundPosition:top left;backgroundImage:url(" +
                    scc.defaultImagePrefix +
                    "cursorinsertleft.gif);",
                className: scc.defaultHighlightTypeCursorClass,
            },
            range2: {
                style:
                    "color:#000;backgroundColor:#FFF;backgroundImage:url(" +
                    scc.defaultImagePrefix +
                    "range2.gif);",
                className: "",
            },
        };

        this.cellIDprefix = scc.defaultCellIDPrefix; // if non-null, each cell will render with an ID

        this.defaultlinkstyle = null; // default linkstyle object (allows you to pass values to link renderer)
        this.defaultHTMLlinkstyle = { type: "html" }; // default linkstyle for standalone HTML

        // constants:

        this.defaultfontstyle = scc.defaultCellFontStyle;
        this.defaultfontsize = scc.defaultCellFontSize;
        this.defaultfontfamily = scc.defaultCellFontFamily;

        this.defaultlayout = scc.defaultCellLayout;

        this.defaultpanedividerwidth = scc.defaultPaneDividerWidth;
        this.defaultpanedividerheight = scc.defaultPaneDividerHeight;

        this.gridCSS = scc.defaultGridCSS;

        this.commentClassName = scc.defaultCommentClass; // for cells with non-blank comments when this.showGrid is true
        this.commentCSS = scc.defaultCommentStyle; // any combination of classnames and styles may be used
        this.commentNoGridClassName = scc.defaultCommentNoGridClass; // for cells when this.showGrid is false
        this.commentNoGridCSS = scc.defaultCommentNoGridStyle; // any combination of classnames and styles may be used

        this.classnames =
        // any combination of classnames and explicitStyles can be used
        {
            colname: scc.defaultColnameClass,
            rowname: scc.defaultRownameClass,
            selectedcolname: scc.defaultSelectedColnameClass,
            selectedrowname: scc.defaultSelectedRownameClass,
            upperleft: scc.defaultUpperLeftClass,
            skippedcell: scc.defaultSkippedCellClass,
            panedivider: scc.defaultPaneDividerClass,
        };

        this.explicitStyles =
        // these may be used so you won't need a stylesheet with the classnames
        {
            colname: scc.defaultColnameStyle,
            rowname: scc.defaultRownameStyle,
            selectedcolname: scc.defaultSelectedColnameStyle,
            selectedrowname: scc.defaultSelectedRownameStyle,
            upperleft: scc.defaultUpperLeftStyle,
            skippedcell: scc.defaultSkippedCellStyle,
            panedivider: scc.defaultPaneDividerStyle,
        };

        // processed info about cell skipping

        this.cellskip = null;
        this.needcellskip = true;

        // precomputed values, filling in defaults indicated by "*"

        this.fonts = []; // for each fontnum, {style: fs, weight: fw, size: fs, family: ff}
        this.layouts = []; // for each layout, "padding:Tpx Rpx Bpx Lpx;vertical-align:va;"

        this.needprecompute = true; // need to call PrecomputeSheetFontsAndLayouts

        // if have a sheet object, initialize constants and precomputed values

        if (sheetobj) {
            this.rowpanes[0] = { first: 1, last: attribs.lastrow };
            this.colpanes[0] = { first: 1, last: attribs.lastcol };
        } else throw scc.s_rcMissingSheet;
    };

    // Methods:

    SocialCalc.RenderContext.prototype.PrecomputeSheetFontsAndLayouts =
        function () {
            SocialCalc.PrecomputeSheetFontsAndLayouts(this);
        };
    SocialCalc.RenderContext.prototype.CalculateCellSkipData = function () {
        SocialCalc.CalculateCellSkipData(this);
    };
    SocialCalc.RenderContext.prototype.CalculateColWidthData = function () {
        SocialCalc.CalculateColWidthData(this);
    };
    SocialCalc.RenderContext.prototype.SetRowPaneFirstLast = function (
        panenum,
        first,
        last
    ) {
        this.rowpanes[panenum] = { first: first, last: last };
    };
    SocialCalc.RenderContext.prototype.SetColPaneFirstLast = function (
        panenum,
        first,
        last
    ) {
        this.colpanes[panenum] = { first: first, last: last };
    };
    SocialCalc.RenderContext.prototype.CoordInPane = function (
        coord,
        rowpane,
        colpane
    ) {
        return SocialCalc.CoordInPane(this, coord, rowpane, colpane);
    };
    SocialCalc.RenderContext.prototype.CellInPane = function (
        row,
        col,
        rowpane,
        colpane
    ) {
        return SocialCalc.CellInPane(this, row, col, rowpane, colpane);
    };
    SocialCalc.RenderContext.prototype.InitializeTable = function (tableobj) {
        SocialCalc.InitializeTable(this, tableobj);
    };
    SocialCalc.RenderContext.prototype.RenderSheet = function (
        oldtable,
        linkstyle
    ) {
        return SocialCalc.RenderSheet(this, oldtable, linkstyle);
    };
    SocialCalc.RenderContext.prototype.RenderColGroup = function () {
        return SocialCalc.RenderColGroup(this);
    };
    SocialCalc.RenderContext.prototype.RenderColHeaders = function () {
        return SocialCalc.RenderColHeaders(this);
    };
    SocialCalc.RenderContext.prototype.RenderSizingRow = function () {
        return SocialCalc.RenderSizingRow(this);
    };
    SocialCalc.RenderContext.prototype.RenderRow = function (
        rownum,
        rowpane,
        linkstyle
    ) {
        return SocialCalc.RenderRow(this, rownum, rowpane, linkstyle);
    };
    SocialCalc.RenderContext.prototype.RenderSpacingRow = function () {
        return SocialCalc.RenderSpacingRow(this);
    };
    SocialCalc.RenderContext.prototype.RenderCell = function (
        rownum,
        colnum,
        rowpane,
        colpane,
        noElement,
        linkstyle
    ) {
        return SocialCalc.RenderCell(
            this,
            rownum,
            colnum,
            rowpane,
            colpane,
            noElement,
            linkstyle
        );
    };

    // Functions:

    SocialCalc.PrecomputeSheetFontsAndLayouts = function (context) {
        var defaultfont, parts, layoutre, dparts, sparts, num, s, i;
        var sheetobj = context.sheetobj;
        var attribs = sheetobj.attribs;

        if (attribs.defaultfont) {
            defaultfont = sheetobj.fonts[attribs.defaultfont];
            defaultfont = defaultfont.replace(
                /^\*/,
                SocialCalc.Constants.defaultCellFontStyle
            );
            defaultfont = defaultfont.replace(
                /(.+)\*(.+)/,
                "$1" + SocialCalc.Constants.defaultCellFontSize + "$2"
            );
            defaultfont = defaultfont.replace(
                /\*$/,
                SocialCalc.Constants.defaultCellFontFamily
            );
            parts = defaultfont.match(/^(\S+? \S+?) (\S+?) (\S.*)$/);
            context.defaultfontstyle = parts[1];
            context.defaultfontsize = parts[2];
            context.defaultfontfamily = parts[3];
        }

        for (num = 1; num < sheetobj.fonts.length; num++) {
            // precompute fonts by filling in the *'s
            s = sheetobj.fonts[num];
            s = s.replace(/^\*/, context.defaultfontstyle);
            s = s.replace(/(.+)\*(.+)/, "$1" + context.defaultfontsize + "$2");
            s = s.replace(/\*$/, context.defaultfontfamily);
            parts = s.match(/^(\S+?) (\S+?) (\S+?) (\S.*)$/);
            context.fonts[num] = {
                style: parts[1],
                weight: parts[2],
                size: parts[3],
                family: parts[4],
            };
        }

        layoutre =
            /^padding:\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+);vertical-align:\s*(\S+);/;
        dparts = SocialCalc.Constants.defaultCellLayout.match(layoutre); // get built-in defaults

        if (attribs.defaultlayout) {
            sparts = sheetobj.layouts[attribs.defaultlayout].match(layoutre); // get sheet defaults, if set
        } else {
            sparts = ["", "*", "*", "*", "*", "*"];
        }

        for (num = 1; num < sheetobj.layouts.length; num++) {
            // precompute layouts by filling in the *'s
            s = sheetobj.layouts[num];
            parts = s.match(layoutre);
            for (i = 1; i <= 5; i++) {
                if (parts[i] == "*") {
                    parts[i] = sparts[i] != "*" ? sparts[i] : dparts[i]; // if *, sheet default or built-in
                }
            }
            context.layouts[num] =
                "padding:" +
                parts[1] +
                " " +
                parts[2] +
                " " +
                parts[3] +
                " " +
                parts[4] +
                ";vertical-align:" +
                parts[5] +
                ";";
        }

        context.needprecompute = false;
    };

    SocialCalc.CalculateCellSkipData = function (context) {
        var row,
            col,
            coord,
            cell,
            contextcell,
            colspan,
            rowspan,
            skiprow,
            skipcol,
            skipcoord;

        var sheetobj = context.sheetobj;
        var sheetrowattribs = sheetobj.rowattribs;
        var sheetcolattribs = sheetobj.colattribs;
        context.maxrow = 0;
        context.maxcol = 0;
        context.cellskip = {}; // reset

        // Calculate cellskip data
        var maxrow, maxcol;

        for (row = 1; row <= sheetobj.attribs.lastrow; row++) {
            for (col = 1; col <= sheetobj.attribs.lastcol; col++) {
                // look for spans and set cellskip for skipped cells
                coord = SocialCalc.crToCoord(col, row);
                cell = sheetobj.cells[coord];
                // don't look at undefined cells (they have no spans) or skipped cells
                if (cell === undefined || context.cellskip[coord]) continue;
                colspan = cell.colspan || 1;
                rowspan = cell.rowspan || 1;
                if (colspan > 1 || rowspan > 1) {
                    for (skiprow = row; skiprow < row + rowspan; skiprow++) {
                        for (skipcol = col; skipcol < col + colspan; skipcol++) {
                            // do the setting on individual cells
                            skipcoord = SocialCalc.crToCoord(skipcol, skiprow);
                            if (skipcoord == coord) {
                                // for coord, remember row and col
                                context.coordToCR[coord] = { row: row, col: col };
                            } else {
                                // for other cells, flag with coord of here
                                context.cellskip[skipcoord] = coord;
                            }
                            if (skiprow > context.maxrow) maxrow = skiprow;
                            if (skipcol > context.maxcol) maxcol = skipcol;
                        }
                    }
                }
            }
        }

        context.needcellskip = false;
    };

    SocialCalc.CalculateColWidthData = function (context) {
        var colnum, colname, colwidth, totalwidth;

        var sheetobj = context.sheetobj;
        var sheetcolattribs = sheetobj.colattribs;

        // Calculate column width data

        totalwidth = context.showRCHeaders ? context.rownamewidth - 0 : 0;
        for (var colpane = 0; colpane < context.colpanes.length; colpane++) {
            for (
                colnum = context.colpanes[colpane].first;
                colnum <= context.colpanes[colpane].last;
                colnum++
            ) {
                colname = SocialCalc.rcColname(colnum);
                colwidth =
                    sheetobj.colattribs.width[colname] ||
                    sheetobj.attribs.defaultcolwidth ||
                    SocialCalc.Constants.defaultColWidth;
                if (colwidth == "blank" || colwidth == "auto") colwidth = "";
                context.colwidth[colnum] = colwidth + "";
                totalwidth += colwidth && colwidth - 0 > 0 ? colwidth - 0 : 10;
            }
        }
        context.totalwidth = totalwidth;
    };

    SocialCalc.InitializeTable = function (context, tableobj) {
        /*
    
    Uses border-collapse so corners don't have holes
    Note: IE and Firefox handle <col> differently (IE adds borders and padding)
    under border-collapse and Safari has problems with <col> and wide text
    Tablelayout "fixed" also leads to problems
    
    */

        /*
    
    *** Discussion ***
    
    The rendering assumes fixed column widths, even though SocialCalc allows "auto".
    There may be issues with "auto" and it is hard to make it work cross-browser
    with border-collapse, etc.
    
    This and the RenderSheet routine are where in the code the specifics of
    table attributes and column size definitions are set. As the browsers settle down
    and when we decide if we don't need auto width, we may want to revisit the way the
    code does this (e.g., use table-layout:fixed).
    
    */
        tableobj.style.borderCollapse = "collapse";
        tableobj.style.tableLayout = "fixed";
        tableobj.cellSpacing = "0";
        tableobj.cellPadding = "0";

        tableobj.style.width = context.totalwidth + "px";
    };

    //
    // tableobj = SocialCalc.RenderSheet(context, oldtable, linkstyle)
    //
    // Renders a render context returning a DOM table object.
    // If there is an oldtable object, it replaces it in the parent node.
    // If oldtable is null, it just returns the new one.
    // The linkstyle is "" or null for editing rendering
    // and optionally an object passed on to formatting code.
    //

    SocialCalc.RenderSheet = function (context, oldtable, linkstyle) {
        var newrow, rowpane;
        var tableobj, colgroupobj, tbodyobj, parentnode;

        // do precompute stuff if necessary

        if (context.sheetobj.changedrendervalues) {
            context.needcellskip = true;
            context.needprecompute = true;
            context.sheetobj.changedrendervalues = false;
        }
        if (context.needcellskip) {
            context.CalculateCellSkipData();
        }
        if (context.needprecompute) {
            context.PrecomputeSheetFontsAndLayouts();
        }

        context.CalculateColWidthData(); // always make sure col width values are up to date

        // make the table element and fill it in

        tableobj = document.createElement("table");
        context.InitializeTable(tableobj);

        colgroupobj = context.RenderColGroup();
        tableobj.appendChild(colgroupobj);

        tbodyobj = document.createElement("tbody");

        tbodyobj.appendChild(context.RenderSizingRow());

        if (context.showRCHeaders) {
            newrow = context.RenderColHeaders();
            if (newrow) tbodyobj.appendChild(newrow);
        }

        for (rowpane = 0; rowpane < context.rowpanes.length; rowpane++) {
            for (
                var rownum = context.rowpanes[rowpane].first;
                rownum <= context.rowpanes[rowpane].last;
                rownum++
            ) {
                newrow = context.RenderRow(rownum, rowpane, linkstyle);
                tbodyobj.appendChild(newrow);
            }
            if (rowpane < context.rowpanes.length - 1) {
                newrow = context.RenderSpacingRow();
                tbodyobj.appendChild(newrow);
            }
        }

        tableobj.appendChild(tbodyobj);

        if (oldtable) {
            parentnode = oldtable.parentNode;
            if (parentnode) parentnode.replaceChild(tableobj, oldtable);
        }

        SocialCalc.EvalUserScripts();

        return tableobj;
    };

    SocialCalc.RenderRow = function (context, rownum, rowpane, linkstyle) {
        var sheetobj = context.sheetobj;

        var result = document.createElement("tr");
        var colnum, newcol, colpane, newdiv;

        if (context.showRCHeaders) {
            newcol = document.createElement("td");
            if (context.classnames) newcol.className = context.classnames.rowname;
            if (context.explicitStyles)
                newcol.style.cssText = context.explicitStyles.rowname;
            newcol.width = context.rownamewidth;
            newcol.style.verticalAlign = "top"; // to get around Safari making top of centered row number be
            // considered top of row (and can't get <row> position in Safari)
            if (!SocialCalc.Constants.SCNoRowName) {
                newcol.innerHTML = rownum + "";
            }
            result.appendChild(newcol);
        }

        for (colpane = 0; colpane < context.colpanes.length; colpane++) {
            for (
                colnum = context.colpanes[colpane].first;
                colnum <= context.colpanes[colpane].last;
                colnum++
            ) {
                newcol = context.RenderCell(
                    rownum,
                    colnum,
                    rowpane,
                    colpane,
                    null,
                    linkstyle
                );
                if (newcol) result.appendChild(newcol);
            }
            if (colpane < context.colpanes.length - 1) {
                newcol = document.createElement("td");
                newcol.width = context.defaultpanedividerwidth;
                if (context.classnames.panedivider)
                    newcol.className = context.classnames.panedivider;
                if (context.explicitStyles.panedivider)
                    newcol.style.cssText = context.explicitStyles.panedivider;
                newdiv = document.createElement("div"); // for Firefox to avoid squishing
                newdiv.style.width = context.defaultpanedividerwidth + "px";
                newdiv.style.overflow = "hidden";
                newcol.appendChild(newdiv);
                result.appendChild(newcol);
            }
        }
        return result;
    };

    SocialCalc.RenderSpacingRow = function (context) {
        var colnum, newcol, colpane, w;

        var sheetobj = context.sheetobj;

        var result = document.createElement("tr");

        if (context.showRCHeaders) {
            newcol = document.createElement("td");
            newcol.width = context.rownamewidth;
            newcol.height = context.defaultpanedividerheight;
            if (context.classnames.panedivider)
                newcol.className = context.classnames.panedivider;
            if (context.explicitStyles.panedivider)
                newcol.style.cssText = context.explicitStyles.panedivider;
            result.appendChild(newcol);
        }

        for (colpane = 0; colpane < context.colpanes.length; colpane++) {
            for (
                colnum = context.colpanes[colpane].first;
                colnum <= context.colpanes[colpane].last;
                colnum++
            ) {
                newcol = document.createElement("td");
                w = context.colwidth[colnum];
                if (w) newcol.width = w;
                newcol.height = context.defaultpanedividerheight;
                if (context.classnames.panedivider)
                    newcol.className = context.classnames.panedivider;
                if (context.explicitStyles.panedivider)
                    newcol.style.cssText = context.explicitStyles.panedivider;
                if (newcol) result.appendChild(newcol);
            }
            if (colpane < context.colpanes.length - 1) {
                newcol = document.createElement("td");
                newcol.width = context.defaultpanedividerwidth;
                newcol.height = context.defaultpanedividerheight;
                if (context.classnames.panedivider)
                    newcol.className = context.classnames.panedivider;
                if (context.explicitStyles.panedivider)
                    newcol.style.cssText = context.explicitStyles.panedivider;
                result.appendChild(newcol);
            }
        }
        return result;
    };

    SocialCalc.RenderColHeaders = function (context) {
        var sheetobj = context.sheetobj;

        var result = document.createElement("tr");
        var colnum, newcol;

        if (!context.showRCHeaders) return null;

        newcol = document.createElement("td");
        if (context.classnames) newcol.className = context.classnames.upperleft;
        if (context.explicitStyles)
            newcol.style.cssText = context.explicitStyles.upperleft;
        newcol.width = context.rownamewidth;
        result.appendChild(newcol);

        for (var colpane = 0; colpane < context.colpanes.length; colpane++) {
            for (
                colnum = context.colpanes[colpane].first;
                colnum <= context.colpanes[colpane].last;
                colnum++
            ) {
                newcol = document.createElement("td");
                if (context.classnames) newcol.className = context.classnames.colname;
                if (context.explicitStyles)
                    newcol.style.cssText = context.explicitStyles.colname;
                if (SocialCalc.Constants.SCNoColNames) {
                    // newcol.innerHTML="&nbsp;";
                    // newcol.innerHTML="";
                } else {
                    newcol.innerHTML = SocialCalc.rcColname(colnum);
                }
                result.appendChild(newcol);
            }
            if (colpane < context.colpanes.length - 1) {
                newcol = document.createElement("td");
                newcol.width = context.defaultpanedividerwidth;
                if (context.classnames.panedivider)
                    newcol.className = context.classnames.panedivider;
                if (context.explicitStyles.panedivider)
                    newcol.style.cssText = context.explicitStyles.panedivider;
                result.appendChild(newcol);
            }
        }
        return result;
    };

    SocialCalc.RenderColGroup = function (context) {
        var colpane, colnum, newcol, t;
        var sheetobj = context.sheetobj;

        var result = document.createElement("colgroup");

        if (context.showRCHeaders) {
            newcol = document.createElement("col");
            newcol.width = context.rownamewidth;
            newcol.style.width = context.rownamewidth + "px";
            result.appendChild(newcol);
        }

        for (colpane = 0; colpane < context.colpanes.length; colpane++) {
            for (
                colnum = context.colpanes[colpane].first;
                colnum <= context.colpanes[colpane].last;
                colnum++
            ) {
                newcol = document.createElement("col");
                t = context.colwidth[colnum];
                if (t) {
                    newcol.width = t;
                    newcol.style.width = t + "px";
                }
                result.appendChild(newcol);
            }
            if (colpane < context.colpanes.length - 1) {
                newcol = document.createElement("col");
                newcol.width = context.defaultpanedividerwidth;
                newcol.style.width = context.defaultpanedividerwidth + "px";
                result.appendChild(newcol);
            }
        }
        return result;
    };

    SocialCalc.RenderSizingRow = function (context) {
        var colpane, colnum, newcell, t;
        var sheetobj = context.sheetobj;

        var result = document.createElement("tr");

        if (context.showRCHeaders) {
            newcell = document.createElement("td");
            newcell.style.width = context.rownamewidth + "px";
            newcell.style.minWidth = context.rownamewidth + "px";
            newcell.style.maxWidth = context.rownamewidth + "px";
            newcell.height = "1";
            result.appendChild(newcell);
        }

        for (colpane = 0; colpane < context.colpanes.length; colpane++) {
            for (
                colnum = context.colpanes[colpane].first;
                colnum <= context.colpanes[colpane].last;
                colnum++
            ) {
                newcell = document.createElement("td");
                t = context.colwidth[colnum];
                if (t) {
                    newcell.width = t;
                    newcell.style.width = t + "px";
                    newcell.style.minWidth = t + "px";
                    newcell.style.maxWidth = t + "px";
                }
                newcell.height = "1";
                result.appendChild(newcell);
            }
            if (colpane < context.colpanes.length - 1) {
                newcell = document.createElement("td");
                newcell.width = context.defaultpanedividerwidth;
                newcell.style.width = context.defaultpanedividerwidth + "px";
                newcell.style.minWidth = context.defaultpanedividerwidth + "px";
                newcell.style.maxWidth = context.defaultpanedividerwidth + "px";
                newcell.height = "1";
                result.appendChild(newcell);
            }
        }
        return result;
    };

    SocialCalc.RenderCell = function (
        context,
        rownum,
        colnum,
        rowpane,
        colpane,
        noElement,
        linkstyle
    ) {
        var sheetobj = context.sheetobj;

        var num, t, result, span, stylename, cell, sheetattribs, scdefaults;
        var stylestr = "";

        rownum = rownum - 0; // make sure a number
        colnum = colnum - 0;

        var coord = SocialCalc.crToCoord(colnum, rownum);
        var isSpanContinuation = false;
        var spanColSpan = 1;
        var spanRowSpan = 1;
        var originCoord = null;
        var originCR = null;
        var originCell = null;
        var spanEndCol = null;
        var spanEndRow = null;

        if (context.cellskip[coord]) {
            originCoord = context.cellskip[coord];
            originCR = context.coordToCR[originCoord] || (SocialCalc.coordToCr ? SocialCalc.coordToCr(originCoord) : null);
            originCell = sheetobj.cells[originCoord];

            if (originCR && originCell) {
                spanEndCol = originCR.col + (originCell.colspan || 1) - 1;
                spanEndRow = originCR.row + (originCell.rowspan || 1) - 1;

                var panecollimits = context.colpanes[colpane];
                var panerowlimits = context.rowpanes[rowpane];

                var firstVisibleCol = Math.max(originCR.col, panecollimits ? panecollimits.first : 1);
                var firstVisibleRow = Math.max(originCR.row, panerowlimits ? panerowlimits.first : 1);

                if (rownum === firstVisibleRow && colnum === firstVisibleCol) {
                    // This is the visible start of the scrolled spanned cell in this pane!
                    isSpanContinuation = true;
                    spanColSpan = Math.max(1, Math.min(spanEndCol, panecollimits ? panecollimits.last : spanEndCol) - firstVisibleCol + 1);
                    spanRowSpan = Math.max(1, Math.min(spanEndRow, panerowlimits ? panerowlimits.last : spanEndRow) - firstVisibleRow + 1);
                    cell = originCell;
                } else {
                    // Covered by the visible span in this pane -- skip
                    return null;
                }
            } else {
                return null;
            }
        } else {
            cell = sheetobj.cells[coord];
            if (!cell) {
                cell = new SocialCalc.Cell(coord);
            }
        }

        result = noElement
            ? SocialCalc.CreatePseudoElement()
            : document.createElement("td");

        if (context.cellIDprefix) {
            result.id = context.cellIDprefix + coord;
        }

        sheetattribs = sheetobj.attribs;
        var scc = SocialCalc.Constants;

        if (isSpanContinuation) {
            if (spanColSpan > 1) result.colSpan = spanColSpan;
            if (spanRowSpan > 1) result.rowSpan = spanRowSpan;
        } else {
            if (cell.colspan > 1) {
                span = 1;
                for (num = 1; num < cell.colspan; num++) {
                    if (
                        sheetobj.colattribs.hide[SocialCalc.rcColname(colnum + num)] !=
                        "yes" &&
                        context.CellInPane(rownum, colnum + num, rowpane, colpane)
                    ) {
                        span++;
                    }
                }
                result.colSpan = span;
            }

            if (cell.rowspan > 1) {
                span = 1;
                for (num = 1; num < cell.rowspan; num++) {
                    if (
                        sheetobj.rowattribs.hide[rownum + num + ""] != "yes" &&
                        context.CellInPane(rownum + num, colnum, rowpane, colpane)
                    )
                        span++;
                }
                result.rowSpan = span;
            }
        }

        if (cell.displaystring == undefined) {
            // cache the display value
            cell.displaystring = SocialCalc.FormatValueForDisplay(
                sheetobj,
                cell.datavalue,
                coord,
                linkstyle || context.defaultlinkstyle
            );
        } else {
            // callout to execute scripts if needed
            SocialCalc.CallOutOnRenderCell(sheetobj, cell.datavalue, coord);
        }
        result.innerHTML = cell.displaystring;

        num = cell.layout || sheetattribs.defaultlayout;
        if (num) {
            stylestr += context.layouts[num]; // use precomputed layout with "*"'s filled in
        } else {
            stylestr += scc.defaultCellLayout;
        }

        num = cell.font || sheetattribs.defaultfont;
        if (num) {
            // get expanded font strings in context
            t = context.fonts[num]; // do each - plain "font:" style sets all sorts of other values, too (Safari font-stretch problem on cssText)
            stylestr +=
                "font-style:" +
                t.style +
                ";font-weight:" +
                t.weight +
                ";font-size:" +
                t.size +
                ";font-family:" +
                t.family +
                ";";
        } else {
            if (scc.defaultCellFontSize) {
                stylestr += "font-size:" + scc.defaultCellFontSize + ";";
            }
            if (scc.defaultCellFontFamily) {
                stylestr += "font-family:" + scc.defaultCellFontFamily + ";";
            }
        }

        num = cell.color || sheetattribs.defaultcolor;
        if (num) stylestr += "color:" + sheetobj.colors[num] + ";";

        num = cell.bgcolor || sheetattribs.defaultbgcolor;
        if (num) stylestr += "background-color:" + sheetobj.colors[num] + ";";

        num = cell.cellformat;
        if (num) {
            stylestr += "text-align:" + sheetobj.cellformats[num] + ";";
        } else {
            t = cell.valuetype.charAt(0);
            if (t == "t") {
                num = sheetattribs.defaulttextformat;
                if (num) stylestr += "text-align:" + sheetobj.cellformats[num] + ";";
            } else if ((t = "n")) {
                num = sheetattribs.defaultnontextformat;
                if (num) {
                    stylestr += "text-align:" + sheetobj.cellformats[num] + ";";
                } else {
                    stylestr += "text-align:right;";
                }
            } else stylestr += "text-align:left;";
        }

        var activeColSpan = isSpanContinuation ? spanColSpan : (result.colSpan || cell.colspan || 1);
        var activeRowSpan = isSpanContinuation ? spanRowSpan : (result.rowSpan || cell.rowspan || 1);

        num = cell.bt;
        if (num && (!isSpanContinuation || (originCR && rownum === originCR.row))) {
            stylestr += "border-top:" + sheetobj.borderstyles[num] + ";";
        }

        num = cell.br;
        if (num && (!isSpanContinuation || (spanEndCol !== null && (colnum + spanColSpan - 1) === spanEndCol))) {
            stylestr += "border-right:" + sheetobj.borderstyles[num] + ";";
        } else if (context.showGrid) {
            if (
                context.CellInPane(
                    rownum,
                    colnum + activeColSpan,
                    rowpane,
                    colpane
                )
            )
                t = SocialCalc.crToCoord(colnum + activeColSpan, rownum);
            else t = "nomatch";
            if (context.cellskip[t]) t = context.cellskip[t];
            if (!sheetobj.cells[t] || !sheetobj.cells[t].bl)
                stylestr += "border-right:" + context.gridCSS;
        }

        num = cell.bb;
        if (num && (!isSpanContinuation || (spanEndRow !== null && (rownum + spanRowSpan - 1) === spanEndRow))) {
            stylestr += "border-bottom:" + sheetobj.borderstyles[num] + ";";
        } else if (context.showGrid) {
            if (
                context.CellInPane(
                    rownum + activeRowSpan,
                    colnum,
                    rowpane,
                    colpane
                )
            )
                t = SocialCalc.crToCoord(colnum, rownum + activeRowSpan);
            else t = "nomatch";
            if (context.cellskip[t]) t = context.cellskip[t];
            if (!sheetobj.cells[t] || !sheetobj.cells[t].bt)
                stylestr += "border-bottom:" + context.gridCSS;
        }

        num = cell.bl;
        if (num && (!isSpanContinuation || (originCR && colnum === originCR.col))) {
            stylestr += "border-left:" + sheetobj.borderstyles[num] + ";";
        }

        if (cell.comment) {
            if (context.showGrid) {
                if (context.commentClassName) {
                    result.className =
                        (result.className ? result.className + " " : "") +
                        context.commentClassName;
                }
                stylestr += context.commentCSS;
            } else {
                if (context.commentNoGridClassName) {
                    result.className =
                        (result.className ? result.className + " " : "") +
                        context.commentNoGridClassName;
                }
                stylestr += context.commentNoGridCSS;
            }
        }

        result.style.cssText = stylestr;
        result.style.boxSizing = "border-box";
        result.style.overflow = "hidden";

        //!!!!!!!!!
        // NOTE: csss and cssc are not supported yet.
        // csss needs to be parsed into pieces to override just the attributes specified, not all with assignment to cssText.
        // cssc just needs to set the className.

        t = context.highlights[coord];
        if (t) {
            // this is a highlit cell: Override style appropriately
            if (t == "cursor") t += context.cursorsuffix; // cursor can take alternative forms
            if (context.highlightTypes[t].className) {
                result.className =
                    (result.className ? result.className + " " : "") +
                    context.highlightTypes[t].className;
            }
            // only if cell is editable, set the cursor class
            if (
                t == "cursor" &&
                SocialCalc.Callbacks.IsCoordEditable &&
                !SocialCalc.Callbacks.IsCoordEditable(
                    context.sheetobj.sheetname + "!" + coord
                )
            ) {
                SocialCalc.setStyles(result, "");
            } else {
                SocialCalc.setStyles(result, context.highlightTypes[t].style);
            }
        }

        return result;
    };

    SocialCalc.CoordInPane = function (context, coord, rowpane, colpane) {
        var coordToCR = context.coordToCR[coord];
        if (!coordToCR || !coordToCR.row || !coordToCR.col)
            throw "Bad coordToCR for " + coord;
        return context.CellInPane(coordToCR.row, coordToCR.col, rowpane, colpane);
    };

    SocialCalc.CellInPane = function (context, row, col, rowpane, colpane) {
        var panerowlimits = context.rowpanes[rowpane];
        var panecollimits = context.colpanes[colpane];
        if (!panerowlimits || !panecollimits)
            throw "CellInPane called with unknown panes " + rowpane + "/" + colpane;
        if (row < panerowlimits.first || row > panerowlimits.last) return false;
        if (col < panecollimits.first || col > panecollimits.last) return false;
        return true;
    };

    SocialCalc.CreatePseudoElement = function () {
        return { style: { cssText: "" }, innerHTML: "", className: "" };
    };

    // *************************************
    //
    // Misc. functions:
    //
    // *************************************

    SocialCalc.rcColname = function (c) {
        if (c > 702) c = 702; // maximum number of columns - ZZ
        if (c < 1) c = 1;
        var collow = ((c - 1) % 26) + 65;
        var colhigh = Math.floor((c - 1) / 26);
        if (colhigh)
            return String.fromCharCode(colhigh + 64) + String.fromCharCode(collow);
        else return String.fromCharCode(collow);
    };

    SocialCalc.letters = [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
    ];

    SocialCalc.crToCoord = function (c, r) {
        var result;
        if (c < 1) c = 1;
        if (c > 702) c = 702; // maximum number of columns - ZZ
        if (r < 1) r = 1;
        var collow = (c - 1) % 26;
        var colhigh = Math.floor((c - 1) / 26);
        if (colhigh)
            result = SocialCalc.letters[colhigh - 1] + SocialCalc.letters[collow] + r;
        else result = SocialCalc.letters[collow] + r;
        return result;
    };

    SocialCalc.coordToCol = {}; // too expensive to set in crToCoord since that is called so many times
    SocialCalc.coordToRow = {};

    SocialCalc.coordToCr = function (cr) {
        var c, i, ch;
        var r = SocialCalc.coordToRow[cr];
        if (r) return { row: r, col: SocialCalc.coordToCol[cr] };
        c = 0;
        r = 0;
        for (i = 0; i < cr.length; i++) {
            // this was faster than using regexes; assumes well-formed
            ch = cr.charCodeAt(i);
            if (ch == 36);
            else if (ch <= 57)
                // skip $'s
                r = 10 * r + ch - 48;
            else if (ch >= 97) c = 26 * c + ch - 96;
            else if (ch >= 65) c = 26 * c + ch - 64;
        }
        SocialCalc.coordToCol[cr] = c;
        SocialCalc.coordToRow[cr] = r;
        return { row: r, col: c };
    };

    SocialCalc.ParseRange = function (range) {
        var pos, cr, cr1, cr2;
        if (!range) range = "A1:A1"; // error return, hopefully benign
        range = range.toUpperCase();
        pos = range.indexOf(":");
        if (pos >= 0) {
            cr = range.substring(0, pos);
            cr1 = SocialCalc.coordToCr(cr);
            cr1.coord = cr;
            cr = range.substring(pos + 1);
            cr2 = SocialCalc.coordToCr(cr);
            cr2.coord = cr;
        } else {
            cr1 = SocialCalc.coordToCr(range);
            cr1.coord = range;
            cr2 = SocialCalc.coordToCr(range);
            cr2.coord = range;
        }
        return { cr1: cr1, cr2: cr2 };
    };

    SocialCalc.decodeFromSave = function (s) {
        if (typeof s != "string") return s;
        if (s.indexOf("\\") == -1) return s; // for performace reasons: replace nothing takes up time
        var r = s.replace(/\\c/g, ":");
        r = r.replace(/\\n/g, "\n");
        return r.replace(/\\b/g, "\\");
    };

    SocialCalc.decodeFromAjax = function (s) {
        if (typeof s != "string") return s;
        if (s.indexOf("\\") == -1) return s; // for performace reasons: replace nothing takes up time
        var r = s.replace(/\\c/g, ":");
        r = r.replace(/\\n/g, "\n");
        r = r.replace(/\\e/g, "]]");
        return r.replace(/\\b/g, "\\");
    };

    SocialCalc.encodeForSave = function (s) {
        if (typeof s != "string") return s;
        if (s.indexOf("\\") != -1)
            // for performace reasons: replace nothing takes up time
            s = s.replace(/\\/g, "\\b");
        if (s.indexOf(":") != -1) s = s.replace(/:/g, "\\c");
        if (s.indexOf("\n") != -1) s = s.replace(/\n/g, "\\n");
        return s;
    };

    //
    // Returns estring where &, <, >, " are HTML escaped
    //
    SocialCalc.special_chars = function (string) {
        if (/[&<>"]/.test(string)) {
            // only do "slow" replaces if something to replace
            string = string.replace(/&/g, "&amp;");
            string = string.replace(/</g, "&lt;");
            string = string.replace(/>/g, "&gt;");
            string = string.replace(/"/g, "&quot;");
        }
        return string;
    };

    SocialCalc.Lookup = function (value, list) {
        for (i = 0; i < list.length; i++) {
            if (list[i] > value) {
                if (i > 0) return i - 1;
                else return null;
            }
        }
        return list.length - 1; // if all smaller, matches last
    };

    //
    // setStyles(element, cssText)
    //
    // Takes a pseudo style string (e.g., text-align must be textAlign) and sets
    // the element's style value for each style name listed (leaving others unchanged).
    // OK to call with null cssText.
    //

    SocialCalc.setStyles = function (element, cssText) {
        var parts, part, pos, name, value;

        if (!cssText) return;

        parts = cssText.split(";");
        for (part = 0; part < parts.length; part++) {
            pos = parts[part].indexOf(":"); // find first colon (could be one in url)
            if (pos != -1) {
                name = parts[part].substring(0, pos);
                value = parts[part].substring(pos + 1);
                if (name && value) {
                    // if non-null name and value, set style
                    element.style[name] = value;
                }
            }
            //      namevalue = parts[part].split(":");
            //      if (namevalue[0]) element.style[namevalue[0]] = namevalue[1];
        }
    };

    //
    // GetViewportInfo() - returns object with viewport width and height, and scroll offsets
    //
    // Flanagan, JavaScript, 5th Edition, page 276
    //

    SocialCalc.GetViewportInfo = function () {
        var result = {};

        if (window.innerWidth) {
            // all but IE
            result.width = window.innerWidth;
            result.height = window.innerHeight;
            result.horizontalScroll = window.pageXOffset;
            result.verticalScroll = window.pageYOffset;
        } else {
            if (document.documentElement && document.documentElement.clientWidth) {
                result.width = document.documentElement.clientWidth;
                result.height = document.documentElement.clientHeight;
                result.horizontalScroll = document.documentElement.scrollLeft;
                result.verticalScroll = document.documentElement.scrollTop;
            } else if (document.body.clientWidth) {
                result.width = document.body.clientWidth;
                result.height = document.body.clientHeight;
                result.horizontalScroll = document.body.scrollLeft;
                result.verticalScroll = document.body.scrollTop;
            }
        }

        return result;
    };

    //
    // GetElementPosition(element) - returns object with left and top position of the element in the document
    //
    // Goodman's JavaScript & DHTML Cookbook, 2nd Edition, page 415
    //

    SocialCalc.GetElementPosition = function (element) {
        var offsetLeft = 0;
        var offsetTop = 0;
        while (element) {
            offsetLeft += element.offsetLeft;
            offsetTop += element.offsetTop;
            element = element.offsetParent;
        }
        return { left: offsetLeft, top: offsetTop };
    };

    //
    // GetElementPositionWithScroll(element) - returns object with left and top position of the element in the document
    //
    // Takes into account scroll offsets by going through entire tree
    //

    SocialCalc.GetElementPositionWithScroll = function (element) {
        var offsetLeft = 0;
        var offsetTop = 0;
        var offsetElement = element;
        while (element) {
            if (element.tagName == "HTML") break;
            if (element == offsetElement) {
                offsetLeft += element.offsetLeft;
                offsetTop += element.offsetTop;
                offsetElement = element.offsetParent;
            }
            if (element.scrollLeft) {
                offsetLeft -= element.scrollLeft;
            }
            if (element.scrollTop) {
                offsetTop -= element.scrollTop;
            }
            element = element.parentNode;
        }
        return { left: offsetLeft, top: offsetTop };
    };

    //
    // LookupElement(element, array) - returns array element which is an object with "element" of element
    //

    SocialCalc.LookupElement = function (element, array) {
        var i;
        for (i = 0; i < array.length; i++) {
            if (array[i].element == element) return array[i];
        }
        return null;
    };

    //
    // AssignID(obj, element, id) - Optionally assigns an ID with a prefix to the element
    //

    SocialCalc.AssignID = function (obj, element, id) {
        if (obj.idPrefix) {
            // Object must have a non-empty idPrefix attribute
            element.id = obj.idPrefix + id;
        }
    };

    //
    // SocialCalc.GetCellContents(sheetobj, coord)
    //
    // Returns the contents (value, formula, constant, etc.) of a cell
    // with appropriate prefix ("'", "=", etc.)
    //

    SocialCalc.GetCellContents = function (sheetobj, coord) {
        var result = "";
        var cellobj = sheetobj.cells[coord];
        if (cellobj) {
            switch (cellobj.datatype) {
                case "v":
                    result = cellobj.datavalue + "";
                    break;
                case "t":
                    result = "'" + cellobj.datavalue;
                    break;
                case "f":
                    result = "=" + cellobj.formula;
                    break;
                case "c":
                    result = cellobj.formula;
                    break;
                default:
                    break;
            }
        }

        return result;
    };

    //
    // Routines translated from the SocialCalc 1.1.0 Perl code:
    //
    // (Makes use of the FormatNumber JavaScript code translated from the Perl.)
    //

    //
    // displayvalue = FormatValueForDisplay(sheetobj, value, cr, linkstyle)
    //
    // Returns a string, in HTML, for the contents of a cell.
    //
    // The value is a either numeric or text, the cr is the coord of the cell
    // (its cell properties are used to determine formatting), and linkstyle
    // is a value passed to wiki-text expansion routines specifying the
    // purpose of the rendering so, for example, links can be rendered differently
    // during edit than with plain HTML.
    //

    SocialCalc.FormatValueForDisplay = function (sheetobj, value, cr, linkstyle) {
        var valueformat, has_parens, has_commas, valuetype, valuesubtype;
        var displayvalue;

        var sheetattribs = sheetobj.attribs;
        var scc = SocialCalc.Constants;

        var cell = sheetobj.cells[cr];

        if (!cell) {
            // get an empty cell if not there
            cell = new SocialCalc.Cell(cr);
        }

        displayvalue = value;

        valuetype = cell.valuetype || ""; // get type of value to determine formatting
        valuesubtype = valuetype.substring(1);
        valuetype = valuetype.charAt(0);

        if (cell.errors || valuetype == "e") {
            displayvalue = cell.errors || valuesubtype || "Error in cell";
            return displayvalue;
        }

        if (valuetype == "t") {
            valueformat =
                sheetobj.valueformats[cell.textvalueformat - 0] ||
                sheetobj.valueformats[sheetattribs.defaulttextvalueformat - 0] ||
                "";
            if (valueformat == "formula") {
                if (cell.datatype == "f") {
                    displayvalue =
                        SocialCalc.special_chars("=" + cell.formula) || "&nbsp;";
                } else if (cell.datatype == "c") {
                    displayvalue =
                        SocialCalc.special_chars("'" + cell.formula) || "&nbsp;";
                } else {
                    displayvalue =
                        SocialCalc.special_chars("'" + displayvalue) || "&nbsp;";
                }
                return displayvalue;
            }
            displayvalue = SocialCalc.format_text_for_display(
                displayvalue,
                cell.valuetype,
                valueformat,
                sheetobj,
                linkstyle
            );
            if (valueformat == "text-html")
                SocialCalc.ScriptCheck(sheetobj.sheetid, cr, value);
        } else if (valuetype == "n") {
            valueformat = cell.nontextvalueformat;
            if (valueformat == null || valueformat == "") {
                //
                valueformat = sheetattribs.defaultnontextvalueformat;
            }
            valueformat = sheetobj.valueformats[valueformat - 0];
            if (valueformat == null || valueformat == "none") {
                valueformat = "";
            }
            if (valueformat == "formula") {
                if (cell.datatype == "f") {
                    displayvalue =
                        SocialCalc.special_chars("=" + cell.formula) || "&nbsp;";
                } else if (cell.datatype == "c") {
                    displayvalue =
                        SocialCalc.special_chars("'" + cell.formula) || "&nbsp;";
                } else {
                    displayvalue =
                        SocialCalc.special_chars("'" + displayvalue) || "&nbsp;";
                }
                return displayvalue;
            } else if (valueformat == "forcetext") {
                if (cell.datatype == "f") {
                    displayvalue =
                        SocialCalc.special_chars("=" + cell.formula) || "&nbsp;";
                } else if (cell.datatype == "c") {
                    displayvalue = SocialCalc.special_chars(cell.formula) || "&nbsp;";
                } else {
                    displayvalue = SocialCalc.special_chars(displayvalue) || "&nbsp;";
                }
                return displayvalue;
            }

            displayvalue = SocialCalc.format_number_for_display(
                displayvalue,
                cell.valuetype,
                valueformat
            );
        } else {
            // unknown type - probably blank
            displayvalue = "&nbsp;";
        }

        return displayvalue;
    };

    //
    // displayvalue = format_text_for_display(rawvalue, valuetype, valueformat, sheetobj, linkstyle)
    //

    SocialCalc.format_text_for_display = function (
        rawvalue,
        valuetype,
        valueformat,
        sheetobj,
        linkstyle
    ) {
        var valueformat, valuesubtype, dvsc, dvue, textval;
        var displayvalue;

        valuesubtype = valuetype.substring(1);

        displayvalue = rawvalue;

        if (valueformat == "none" || valueformat == null) valueformat = "";
        if (!/^(text-|custom|hidden)/.test(valueformat)) valueformat = "";
        if (valueformat == "" || valueformat == "General") {
            // determine format from type
            if (valuesubtype == "h") valueformat = "text-html";
            if (valuesubtype == "w" || valuesubtype == "r") valueformat = "text-wiki";
            if (valuesubtype == "l") valueformat = "text-link";
            if (!valuesubtype) valueformat = "text-plain";
        }
        if (valueformat == "text-html") {
            // HTML - output as it as is
        } else if (
            SocialCalc.Callbacks.expand_wiki &&
            /^text-wiki/.test(valueformat)
        ) {
            // do general wiki markup
            displayvalue = SocialCalc.Callbacks.expand_wiki(
                displayvalue,
                sheetobj,
                linkstyle,
                valueformat
            );
        } else if (valueformat == "text-wiki") {
            // Wiki-text - encode then output
            displayvalue = SocialCalc.special_chars(displayvalue);
        } else if (valueformat == "text-wiki") {
            // wiki text
            displayvalue =
                (SocialCalc.Callbacks.expand_markup &&
                    SocialCalc.Callbacks.expand_markup(
                        displayvalue,
                        sheetobj,
                        linkstyle
                    )) || // do old wiki markup
                SocialCalc.special_chars(displayvalue);
        } else if (valueformat == "text-url") {
            // text is a URL for a link
            dvsc = SocialCalc.special_chars(displayvalue);
            dvue = encodeURI(displayvalue);
            displayvalue = '<a href="' + dvue + '">' + dvsc + "</a>";
        } else if (valueformat == "text-link") {
            // more extensive link capabilities for regular web links
            displayvalue = SocialCalc.expand_text_link(
                displayvalue,
                sheetobj,
                linkstyle,
                valueformat
            );
        } else if (valueformat == "text-image") {
            // text is a URL for an image
            dvue = encodeURI(displayvalue);
            displayvalue = '<img src="' + dvue + '">';
        } else if (valueformat.substring(0, 12) == "text-custom:") {
            // construct a custom text format: @r = text raw, @s = special chars, @u = url encoded
            dvsc = SocialCalc.special_chars(displayvalue); // do special chars
            dvsc = dvsc.replace(/  /g, "&nbsp; "); // keep multiple spaces
            dvsc = dvsc.replace(/\n/g, "<br>"); // keep line breaks
            dvue = encodeURI(displayvalue);
            textval = {};
            textval.r = displayvalue;
            textval.s = dvsc;
            textval.u = dvue;
            displayvalue = valueformat.substring(12); // remove "text-custom:"
            displayvalue = displayvalue.replace(/@(r|s|u)/g, function (a, c) {
                return textval[c];
            }); // replace placeholders
        } else if (valueformat.substring(0, 6) == "custom") {
            // custom
            displayvalue = SocialCalc.special_chars(displayvalue); // do special chars
            displayvalue = displayvalue.replace(/  /g, "&nbsp; "); // keep multiple spaces
            displayvalue = displayvalue.replace(/\n/g, "<br>"); // keep line breaks
            displayvalue += " (custom format)";
        } else if (valueformat == "hidden") {
            displayvalue = "&nbsp;";
        } else {
            // plain text
            displayvalue = SocialCalc.special_chars(displayvalue); // do special chars
            displayvalue = displayvalue.replace(/  /g, "&nbsp; "); // keep multiple spaces
            displayvalue = displayvalue.replace(/\n/g, "<br>"); // keep line breaks
        }

        return displayvalue;
    };

    //
    // displayvalue = format_number_for_display(rawvalue, valuetype, valueformat)
    //

    SocialCalc.format_number_for_display = function (
        rawvalue,
        valuetype,
        valueformat
    ) {
        var value, valuesubtype;
        var scc = SocialCalc.Constants;

        value = rawvalue - 0;

        valuesubtype = valuetype.substring(1);

        if (valueformat == "Auto" || valueformat == "") {
            // cases with default format
            if (valuesubtype == "%") {
                // will display a % character
                valueformat = "#,##0.0%";
            } else if (valuesubtype == "$") {
                valueformat = "[$]#,##0.00";
            } else if (valuesubtype == "dt") {
                valueformat = scc.defaultFormatdt;
            } else if (valuesubtype == "d") {
                valueformat = scc.defaultFormatd;
            } else if (valuesubtype == "t") {
                valueformat = scc.defaultFormatt;
            } else if (valuesubtype == "l") {
                valueformat = "logical";
            } else {
                valueformat = "General";
            }
        }

        if (valueformat == "logical") {
            // do logical format
            return value ? scc.defaultDisplayTRUE : scc.defaultDisplayFALSE;
        }

        if (valueformat == "hidden") {
            // do hidden format
            return "&nbsp;";
        }

        // Use format

        return SocialCalc.FormatNumber.formatNumberWithFormat(
            rawvalue,
            valueformat,
            ""
        );
    };

    //
    // valueinfo = DetermineValueType(rawvalue)
    //
    // Takes a value and looks for special formatting like $, %, numbers, etc.
    // Returns the value as a number or string and the type as {value: value, type: type}.
    // Tries to follow the spec for spreadsheet function VALUE(v).
    //

    SocialCalc.DetermineValueType = function (rawvalue) {
        var value = rawvalue + "";
        var type = "t";
        var tvalue, matches, year, hour, minute, second, denom, num, intgr, constr;

        tvalue = value.replace(/^\s+/, ""); // remove leading and trailing blanks
        tvalue = tvalue.replace(/\s+$/, "");

        if (value.length == 0) {
            type = "";
        } else if (value.match(/^\s+$/)) {
            // just blanks
            // leave type "t"
        } else if (tvalue.match(/^[-+]?\d*(?:\.)?\d*(?:[eE][-+]?\d+)?$/)) {
            // general number, including E
            value = tvalue - 0; // try converting to number
            if (isNaN(value)) {
                // leave alone - catches things like plain "-"
                value = rawvalue + "";
            } else {
                type = "n";
            }
        } else if (tvalue.match(/^[-+]?\d*(?:\.)?\d*\s*%$/)) {
            // percent form: 15.1%
            value = (tvalue.slice(0, -1) - 0) / 100; // convert and scale
            type = "n%";
        } else if (
            tvalue.match(/^[-+]?\$\s*\d*(?:\.)?\d*\s*$/) &&
            tvalue.match(/\d/)
        ) {
            // $ format: $1.49
            value = tvalue.replace(/\$/, "") - 0;
            type = "n$";
        } else if (tvalue.match(/^[-+]?(\d*,\d*)+(?:\.)?\d*$/)) {
            // number format ignoring commas: 1,234.49
            value = tvalue.replace(/,/g, "") - 0;
            type = "n";
        } else if (tvalue.match(/^[-+]?(\d*,\d*)+(?:\.)?\d*\s*%$/)) {
            // % with commas: 1,234.49%
            value = (tvalue.replace(/[%,]/g, "") - 0) / 100;
            type = "n%";
        } else if (
            tvalue.match(/^[-+]?\$\s*(\d*,\d*)+(?:\.)?\d*$/) &&
            tvalue.match(/\d/)
        ) {
            // $ and commas: $1,234.49
            value = tvalue.replace(/[\$,]/g, "") - 0;
            type = "n$";
        } else if (
            (matches = value.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{1,4})\s*$/))
        ) {
            // MM/DD/YYYY, MM/DD/YYYY
            year = matches[3] - 0;
            year = year < 1000 ? year + 2000 : year;
            value =
                SocialCalc.FormatNumber.convert_date_gregorian_to_julian(
                    year,
                    matches[1] - 0,
                    matches[2] - 0
                ) - 2415019;
            type = "nd";
        } else if (
            (matches = value.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\s*$/))
        ) {
            // YYYY-MM-DD, YYYY/MM/DD
            year = matches[1] - 0;
            year = year < 1000 ? year + 2000 : year;
            value =
                SocialCalc.FormatNumber.convert_date_gregorian_to_julian(
                    year,
                    matches[2] - 0,
                    matches[3] - 0
                ) - 2415019;
            type = "nd";
        } else if ((matches = value.match(/^(\d{1,2}):(\d{1,2})\s*$/))) {
            // HH:MM
            hour = matches[1] - 0;
            minute = matches[2] - 0;
            if (hour < 24 && minute < 60) {
                value = hour / 24 + minute / (24 * 60);
                type = "nt";
            }
        } else if ((matches = value.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})\s*$/))) {
            // HH:MM:SS
            hour = matches[1] - 0;
            minute = matches[2] - 0;
            second = matches[3] - 0;
            if (hour < 24 && minute < 60 && second < 60) {
                value = hour / 24 + minute / (24 * 60) + second / (24 * 60 * 60);
                type = "nt";
            }
        } else if ((matches = value.match(/^\s*([-+]?\d+) (\d+)\/(\d+)\s*$/))) {
            // 1 1/2
            intgr = matches[1] - 0;
            num = matches[2] - 0;
            denom = matches[3] - 0;
            if (denom && denom > 0) {
                value = intgr + (intgr < 0 ? -num / denom : num / denom);
                type = "n";
            }
        } else if ((constr = SocialCalc.InputConstants[value.toUpperCase()])) {
            // special constants, like "false" and #N/A
            num = constr.indexOf(",");
            value = constr.substring(0, num) - 0;
            type = constr.substring(num + 1);
        } else if (
            tvalue.length > 7 &&
            tvalue.substring(0, 7).toLowerCase() == "http://"
        ) {
            // URL
            value = tvalue;
            type = "tl";
        }

        return { value: value, type: type };
    };

    SocialCalc.InputConstants = {
        // strings that turn into constants for SocialCalc.DetermineValueType
        TRUE: "1,nl",
        FALSE: "0,nl",
        "#N/A": "0,e#N/A",
        "#NULL!": "0,e#NULL!",
        "#NUM!": "0,e#NUM!",
        "#DIV/0!": "0,e#DIV/0!",
        "#VALUE!": "0,e#VALUE!",
        "#REF!": "0,e#REF!",
        "#NAME?": "0,e#NAME?",
    };

    //
    // result = default_expand_markup(displayvalue, sheetobj, linkstyle)
    //
    // Processes wiki-text -- this is a placeholder.
    // Reference to here in SocialCalc.expand_markup should be replaced by application-specific routine.
    //

    SocialCalc.default_expand_markup = function (
        displayvalue,
        sheetobj,
        linkstyle
    ) {
        var result = displayvalue;

        result = SocialCalc.special_chars(result); // do special chars
        result = result.replace(/  /g, "&nbsp; "); // keep multiple spaces
        result = result.replace(/\n/g, "<br>"); // keep line breaks

        return result; // do very little by default

        result = result.replace(/('*)'''(.*?)'''/g, "$1<b>$2</b>"); // Wiki-style bold/italics
        result = result.replace(/''(.*?)''/g, "<i>$1</i>");

        return result;
    };

    //
    // result = SocialCalc.expand_text_link(displayvalue, sheetobj, linkstyle, valueformat)
    //
    // Parses link text (URL, descriptions, pagenames, workspace names) and returns HTML
    //

    SocialCalc.expand_text_link = function (
        displayvalue,
        sheetobj,
        linkstyle,
        valueformat
    ) {
        var desc, tb, str;

        var scc = SocialCalc.Constants;

        var url = "";
        var parts = SocialCalc.ParseCellLinkText(displayvalue + "");

        if (parts.desc) {
            desc = SocialCalc.special_chars(parts.desc);
        } else {
            desc = parts.pagename
                ? scc.defaultPageLinkFormatString
                : scc.defaultLinkFormatString;
        }

        if (
            displayvalue.length > 7 &&
            displayvalue.substring(0, 7).toLowerCase() == "http://" &&
            displayvalue.charAt(displayvalue.length - 1) != ">"
        ) {
            desc = desc.substring(7); // remove http:// unless explicit
        }

        tb = parts.newwin || !linkstyle ? ' target="_blank"' : "";

        if (parts.pagename) {
            if (SocialCalc.Callbacks.MakePageLink) {
                url = SocialCalc.Callbacks.MakePageLink(
                    parts.pagename,
                    parts.workspacename,
                    linkstyle,
                    valueformat
                );
            }
            //      else if (parts.workspace) {
            //         url = "/" + encodeURI(parts.workspace) + "/" + encodeURI(parts.pagename);
            //         }
            //      else {
            //         url = parts.pagename;
            //         }
        } else {
            url = encodeURI(parts.url);
        }
        str = '<a href="' + url + '"' + tb + ">" + desc + "</a>";

        return str;
    };

    //
    // result = SocialCalc.ParseCellLinkText(str)
    //
    // Given: url = http://www.someurl.com/more, desc = Some descriptive text
    //
    // Takes the following:
    //
    //    url
    //    <url>
    //    desc<url>
    //    "desc"<url>
    //    <<>> instead of <> => target="_blank" (new window)
    //
    //    [page name]
    //    "desc"[page name]
    //    desc[page name]
    //    {workspace name [page name]}
    //    "desc"{workspace name [page name]}
    //    [[]] instead of [] => target="_blank" (new window)
    //
    //
    // Returns: {url: url, desc: desc, newwin: t/f, pagename: pagename, workspace: workspace}
    //

    SocialCalc.ParseCellLinkText = function (str) {
        var result = {
            url: "",
            desc: "",
            newwin: false,
            pagename: "",
            workspace: "",
        };

        var pageform = false;
        var urlend = str.length - 1;
        var descstart = 0;
        var lastlt = str.lastIndexOf("<");
        var lastbrkt = str.lastIndexOf("[");
        var lastbrace = str.lastIndexOf("{");
        var descend = -1;

        if (
            (str.charAt(urlend) != ">" || lastlt == -1) &&
            (str.charAt(urlend) != "]" || lastbrkt == -1) &&
            (str.charAt(urlend) != "}" ||
                str.charAt(urlend - 1) != "]" ||
                lastbrace == -1 ||
                lastbrkt == -1 ||
                lastbrkt < lastbrace)
        ) {
            // plain url
            urlend++;
            descend = urlend;
        } else {
            // some markup
            if (str.charAt(urlend) == ">") {
                // url form
                descend = lastlt - 1;
                if (
                    lastlt > 0 &&
                    str.charAt(descend) == "<" &&
                    str.charAt(urlend - 1) == ">"
                ) {
                    descend--;
                    urlend--;
                    result.newwin = true;
                }
            } else if (str.charAt(urlend) == "]") {
                // plain page form
                descend = lastbrkt - 1;
                pageform = true;
                if (
                    lastbrkt > 0 &&
                    str.charAt(descend) == "[" &&
                    str.charAt(urlend - 1) == "]"
                ) {
                    descend--;
                    urlend--;
                    result.newwin = true;
                }
            } else if (str.charAt(urlend) == "}") {
                // page and workspace form
                descend = lastbrace - 1;
                pageform = true;
                wsend = lastbrkt;
                urlend--;
                if (
                    lastbrkt > 0 &&
                    str.charAt(lastbrkt - 1) == "[" &&
                    str.charAt(urlend - 1) == "]"
                ) {
                    wsend = lastbrkt - 1;
                    urlend--;
                    result.newwin = true;
                }
                if (str.charAt(wsend - 1) == " ") {
                    // trim trailing space in workspace name
                    wsend--;
                }
                result.workspace = str.substring(lastbrace + 1, wsend) || "";
            }

            if (str.charAt(descend) == " ") {
                // trim trailing space on desc
                descend--;
            }

            if (str.charAt(descstart) == '"' && str.charAt(descend) == '"') {
                descstart++;
                descend--;
            }
        }

        if (pageform) {
            result.pagename = str.substring(lastbrkt + 1, urlend) || "";
        } else {
            result.url = str.substring(lastlt + 1, urlend) || "";
        }

        if (descend >= descstart) {
            result.desc = str.substring(descstart, descend + 1);
        }

        return result;
    };

    //
    // result = SocialCalc.ConvertSaveToOtherFormat(savestr, outputformat, dorecalc)
    //
    // Returns a string in the specificed format: "scsave", "html", "csv", "tab" (tab delimited)
    // If dorecalc is true, performs a recalc after loading (NO: obsolete!).
    //

    SocialCalc.ConvertSaveToOtherFormat = function (
        savestr,
        outputformat,
        dorecalc
    ) {
        var sheet, context, clipextents, div, ele, row, col, cr, cell, str;

        var result = "";

        if (outputformat == "scsave") {
            return savestr;
        }

        if (savestr == "") {
            return "";
        }

        sheet = new SocialCalc.Sheet();
        sheet.ParseSheetSave(savestr);

        if (dorecalc) {
            // no longer supported as of 9/10/08
            // Recalc is now async, so can't do it this way
            throw "SocialCalc.ConvertSaveToOtherFormat: Not doing recalc.";
        }

        if (sheet.copiedfrom) {
            clipextents = SocialCalc.ParseRange(sheet.copiedfrom);
        } else {
            clipextents = {
                cr1: { row: 1, col: 1 },
                cr2: { row: sheet.attribs.lastrow, col: sheet.attribs.lastcol },
            };
        }

        if (outputformat == "html") {
            context = new SocialCalc.RenderContext(sheet);
            if (sheet.copiedfrom) {
                context.rowpanes[0] = {
                    first: clipextents.cr1.row,
                    last: clipextents.cr2.row,
                };
                context.colpanes[0] = {
                    first: clipextents.cr1.col,
                    last: clipextents.cr2.col,
                };
            }
            div = document.createElement("div");
            ele = context.RenderSheet(null, context.defaultHTMLlinkstyle);
            div.appendChild(ele);
            context = undefined;
            sheet = undefined;
            result = div.innerHTML;
            ele = undefined;
            div = undefined;
            return result;
        }

        for (row = clipextents.cr1.row; row <= clipextents.cr2.row; row++) {
            for (col = clipextents.cr1.col; col <= clipextents.cr2.col; col++) {
                cr = SocialCalc.crToCoord(col, row);
                cell = sheet.GetAssuredCell(cr);

                if (cell.errors) {
                    str = cell.errors;
                } else {
                    str = cell.datavalue + ""; // get value as text
                }

                if (outputformat == "csv") {
                    if (str.indexOf('"') != -1) {
                        str = str.replace(/"/g, '""'); // double quotes
                    }
                    if (/[, \n"]/.test(str)) {
                        str = '"' + str + '"'; // add quotes
                    }
                    if (col > clipextents.cr1.col) {
                        str = "," + str; // add commas
                    }
                } else if (outputformat == "tab") {
                    if (str.indexOf("\n") != -1) {
                        // if multiple lines
                        if (str.indexOf('"') != -1) {
                            str = str.replace(/"/g, '""'); // double quotes
                        }
                        str = '"' + str + '"'; // add quotes
                    }
                    if (col > clipextents.cr1.col) {
                        str = "\t" + str; // add tabs
                    }
                }
                result += str;
            }
            result += "\n";
        }

        return result;
    };

    //
    // result = SocialCalc.ConvertOtherFormatToSave(inputstr, inputformat)
    //
    // Returns a string converted from the specified format: "scsave", "csv", "tab" (tab delimited)
    //

    SocialCalc.ConvertOtherFormatToSave = function (inputstr, inputformat) {
        var sheet,
            context,
            lines,
            i,
            line,
            value,
            inquote,
            j,
            ch,
            values,
            row,
            col,
            cr,
            maxc;

        var result = "";

        var AddCell = function () {
            col++;
            if (col > maxc) maxc = col;
            cr = SocialCalc.crToCoord(col, row);
            SocialCalc.SetConvertedCell(sheet, cr, value);
            value = "";
        };

        if (inputformat == "scsave") {
            return inputstr;
        }

        sheet = new SocialCalc.Sheet();

        lines = inputstr.split(/\r\n|\n/);

        maxc = 0;
        if (inputformat == "csv") {
            row = 0;
            inquote = false;
            for (i = 0; i < lines.length; i++) {
                if (i == lines.length - 1 && lines[i] == "") {
                    // extra null line - ignore
                    break;
                }
                if (inquote) {
                    // if inquote, just continue from where left off
                    value += "\n";
                } else {
                    // otherwise next row
                    value = "";
                    row++;
                    col = 0;
                }
                line = lines[i];
                for (j = 0; j < line.length; j++) {
                    ch = line.charAt(j);
                    if (ch == '"') {
                        if (inquote) {
                            if (j < line.length - 1 && line.charAt(j + 1) == '"') {
                                // double quotes
                                j++; // skip the second one
                                value += '"'; // add one quote
                            } else {
                                inquote = false;
                                if (j == line.length - 1) {
                                    // at end of line
                                    AddCell();
                                }
                            }
                        } else {
                            inquote = true;
                        }
                        continue;
                    }
                    if (ch == "," && !inquote) {
                        AddCell();
                    } else {
                        value += ch;
                    }
                    if (j == line.length - 1 && !inquote) {
                        AddCell();
                    }
                }
            }
            if (maxc > 0) {
                sheet.attribs.lastrow = row;
                sheet.attribs.lastcol = maxc;
                result = sheet.CreateSheetSave("A1:" + SocialCalc.crToCoord(maxc, row));
            }
        }

        if (inputformat == "tab") {
            row = 0;
            inquote = false;
            for (i = 0; i < lines.length; i++) {
                if (i == lines.length - 1 && lines[i] == "") {
                    // extra null line - ignore
                    break;
                }
                if (inquote) {
                    // if inquote, just continue from where left off
                    value += "\n";
                } else {
                    // otherwise next row
                    value = "";
                    row++;
                    col = 0;
                }
                line = lines[i];
                for (j = 0; j < line.length; j++) {
                    ch = line.charAt(j);
                    if (ch == '"') {
                        if (inquote) {
                            if (j < line.length - 1) {
                                if (line.charAt(j + 1) == '"') {
                                    // double quotes
                                    j++; // skip the second one
                                    value += '"'; // add one quote
                                } else if (line.charAt(j + 1) == "\t") {
                                    // end of quoted item
                                    j++;
                                    inquote = false;
                                    AddCell();
                                }
                            } else {
                                // at end of line
                                inquote = false;
                                AddCell();
                            }
                            continue;
                        }
                        if (value == "") {
                            // quote at start of item
                            inquote = true;
                            continue;
                        }
                    }
                    if (ch == "\t" && !inquote) {
                        AddCell();
                    } else {
                        value += ch;
                    }
                    if (j == line.length - 1 && !inquote) {
                        AddCell();
                    }
                }
            }
            if (maxc > 0) {
                sheet.attribs.lastrow = row;
                sheet.attribs.lastcol = maxc;
                result = sheet.CreateSheetSave("A1:" + SocialCalc.crToCoord(maxc, row));
            }
        }

        return result;
    };

    //
    // SocialCalc.SetConvertedCell(sheet, cr, rawvalue)
    //
    // Sets the cell cr with a value and type determined from rawvalue
    //

    SocialCalc.SetConvertedCell = function (sheet, cr, rawvalue) {
        var cell, value;

        cell = sheet.GetAssuredCell(cr);

        value = SocialCalc.DetermineValueType(rawvalue);

        if (value.type == "n" && value.value == rawvalue) {
            // check that we don't need "constant" to remember original value
            cell.datatype = "v";
            cell.valuetype = "n";
            cell.datavalue = value.value;
        } else if (value.type.charAt(0) == "t") {
            // text of some sort but left unchanged
            cell.datatype = "t";
            cell.valuetype = value.type;
            cell.datavalue = value.value;
        } else {
            // special number types
            cell.datatype = "c";
            cell.valuetype = value.type;
            cell.datavalue = value.value;
            cell.formula = rawvalue;
        }
    };

    // Make sure SocialCalc is available globally
    if (typeof window !== "undefined") {
        window.SocialCalc = SocialCalc;
    } else if (typeof global !== "undefined") {
        global.SocialCalc = SocialCalc;
    }

    return SocialCalc;
});
