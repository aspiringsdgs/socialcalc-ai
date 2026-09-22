/* eslint-disable */
// SocialCalc Table Editor Module (TableEditor, mouse, navigation, InputBox, InputEcho, editor actions)
// Part of the SocialCalc core engine - see README.md in this folder for the module map and load order

// UMD wrapper
(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        root.SocialCalcTableEditor = factory();
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


    //
    // SocialCalcTableEditor
    //
    /*
   // The code module of the SocialCalc package that displays a scrolling grid with panes
   // and handles keyboard and mouse I/O.
   //
   // (c) Copyright 2008, 2009, 2010 Socialtext, Inc.
   // All Rights Reserved.
   //
   */

    /*
   
   LEGAL NOTICES REQUIRED BY THE COMMON PUBLIC ATTRIBUTION LICENSE:
   
   EXHIBIT A. Common Public Attribution License Version 1.0.
   
   The contents of this file are subject to the Common Public Attribution License Version 1.0 (the
   "License"); you may not use this file except in compliance with the License. You may obtain a copy
   of the License at http://socialcalc.org. The License is based on the Mozilla Public License Version 1.1 but
   Sections 14 and 15 have been added to cover use of software over a computer network and provide for
   limited attribution for the Original Developer. In addition, Exhibit A has been modified to be
   consistent with Exhibit B.
   
   Software distributed under the License is distributed on an "AS IS" basis, WITHOUT WARRANTY OF ANY
   KIND, either express or implied. See the License for the specific language governing rights and
   limitations under the License.
   
   The Original Code is SocialCalc JavaScript TableEditor.
   
   The Original Developer is the Initial Developer.
   
   The Initial Developer of the Original Code is Socialtext, Inc. All portions of the code written by
   Socialtext, Inc., are Copyright (c) Socialtext, Inc. All Rights Reserved.
   
   Contributor: Dan Bricklin.
   
   
   EXHIBIT B. Attribution Information
   
   When the TableEditor is producing and/or controlling the display the Graphic Image must be
   displayed on the screen visible to the user in a manner comparable to that in the
   Original Code. The Attribution Phrase must be displayed as a "tooltip" or "hover-text" for
   that image. The image must be linked to the Attribution URL so as to access that page
   when clicked. If the user interface includes a prominent "about" display which includes
   factual prominent attribution in a form similar to that in the "about" display included
   with the Original Code, including Socialtext copyright notices and URLs, then the image
   need not be linked to the Attribution URL but the "tool-tip" is still required.
   
   Attribution Copyright Notice:
   
   Copyright (C) 2010 Socialtext, Inc.
   All Rights Reserved.
   
   Attribution Phrase (not exceeding 10 words): SocialCalc
   
   Attribution URL: http://www.socialcalc.org/xoattrib
   
   Graphic Image: The contents of the sc-logo.gif file in the Original Code or
   a suitable replacement from http://www.socialcalc.org/licenses specified as
   being for SocialCalc.
   
   Display of Attribution Information is required in Larger Works which are defined
   in the CPAL as a work which combines Covered Code or portions thereof with code
   not governed by the terms of the CPAL.
   
   */

    //
    // Some of the other files in the SocialCalc package are licensed under
    // different licenses. Please note the licenses of the modules you use.
    //
    // Code History:
    //
    // Initially coded by Dan Bricklin of Software Garden, Inc., for Socialtext, Inc.
    // Based in part on the SocialCalc 1.1.0 code written in Perl.
    // The SocialCalc 1.1.0 code was:
    //    Portions (c) Copyright 2005, 2006, 2007 Software Garden, Inc.
    //    All Rights Reserved.
    //    Portions (c) Copyright 2007 Socialtext, Inc.
    //    All Rights Reserved.
    // The Perl SocialCalc started as modifications to the wikiCalc(R) program, version 1.0.
    // wikiCalc 1.0 was written by Software Garden, Inc.
    // Unless otherwise specified, referring to "SocialCalc" in comments refers to this
    // JavaScript version of the code, not the SocialCalc Perl code.
    //

    /*
   
   See the comments in the main SocialCalc code module file of the SocialCalc package.
   
   */

    var SocialCalc;
    if (!SocialCalc) {
        // created here, too, in case load order is wrong, but main routines are required
        SocialCalc = {};
    }

    // *************************************
    //
    // Table Editor class:
    //
    // *************************************

    // Constructor:

    SocialCalc.TableEditor = function (context) {
        var scc = SocialCalc.Constants;

        // Properties:

        this.context = context; // editing context
        this.toplevel = null; // top level HTML element for this table editor
        this.fullgrid = null; // rendered editing context

        this.noEdit = false; // if true, disable all edit UI and make read-only

        this.width = null;
        this.tablewidth = null;
        this.height = null;
        this.tableheight = null;

        this.inputBox = null;
        this.inputEcho = null;
        this.verticaltablecontrol = null;
        this.horizontaltablecontrol = null;

        this.logo = null;

        this.cellhandles = null;

        // Dynamic properties:

        this.timeout = null; // if non-null, timer id for position calculations
        this.busy = false; // true when executing command, calculating, etc.
        this.ensureecell = false; // if true, ensure ecell is visible after timeout
        this.deferredCommands = []; // commands to execute after busy, in form: {cmdstr: "cmds", saveundo: t/f}

        this.gridposition = null; // screen coords of full grid
        this.headposition = null; // screen coords of upper left of grid within header rows
        this.firstscrollingrow = null; // row number of top row in last (the scrolling) pane
        this.firstscrollingrowtop = null; // position of top row in last (the scrolling) pane
        this.lastnonscrollingrow = null; // row number of last displayed row in last non-scrolling
        // pane, or zero (for thumb position calculations)
        this.lastvisiblerow = null; // used for paging down
        this.firstscrollingcol = null; // column number of top col in last (the scrolling) pane
        this.firstscrollingcolleft = null; // position of top col in last (the scrolling) pane
        this.lastnonscrollingcol = null; // col number of last displayed column in last non-scrolling
        // pane, or zero (for thumb position calculations)
        this.lastvisiblecol = null; // used for paging right

        this.rowpositions = []; // screen positions of the top of some rows
        this.colpositions = []; // screen positions of the left side of some rows
        this.rowheight = []; // size in pixels of each row when last checked, or null/undefined, for page up
        this.colwidth = []; // size in pixels of each column when last checked, or null/undefined, for page left

        this.ecell = null; // either null or {coord: c, row: r, col: c}
        this.state = "start"; // the keyboard states: see EditorProcessKey

        this.workingvalues = {}; // values used during keyboard editing, etc.

        // Constants:

        this.imageprefix = scc.defaultImagePrefix; // URL prefix for images (e.g., "/assets/images/sc")
        this.idPrefix = scc.defaultTableEditorIDPrefix;
        this.pageUpDnAmount = scc.defaultPageUpDnAmount; // number of rows to move cursor on PgUp/PgDn keys (numeric)

        // Callbacks

        // recalcFunction: if present, function(editor) {...}, called to do a recalc
        // Default (sheet.RecalcSheet) does all the right stuff.

        this.recalcFunction = function (editor) {
            if (editor.context.sheetobj.RecalcSheet) {
                editor.context.sheetobj.RecalcSheet(
                    SocialCalc.EditorSheetStatusCallback,
                    editor
                );
            } else return null;
        };

        // ctrlkeyFunction: if present, function(editor, charname) {...}, called to handle ctrl-V, etc., at top level
        // Returns true (pass through for continued processing) or false (stop processing this key).

        this.ctrlkeyFunction = function (editor, charname) {
            var ta, ha, cell, position, cmd, sel, cliptext;

            switch (charname) {
                case "[ctrl-c]":
                case "[ctrl-x]":
                    ta = editor.pasteTextarea;
                    ta.value = "";
                    cell = SocialCalc.GetEditorCellElement(
                        editor,
                        editor.ecell.row,
                        editor.ecell.col
                    );
                    if (cell) {
                        position = SocialCalc.GetElementPosition(cell.element);
                        ta.style.left = position.left - 1 + "px";
                        ta.style.top = position.top - 1 + "px";
                    }
                    if (editor.range.hasrange) {
                        sel =
                            SocialCalc.crToCoord(editor.range.left, editor.range.top) +
                            ":" +
                            SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
                    } else {
                        sel = editor.ecell.coord;
                    }

                    // get what to copy to clipboard
                    cliptext = SocialCalc.ConvertSaveToOtherFormat(
                        SocialCalc.CreateSheetSave(editor.context.sheetobj, sel),
                        "tab"
                    );

                    if (
                        charname == "[ctrl-c]" ||
                        editor.noEdit ||
                        (SocialCalc.Callbacks.IsCellEditable &&
                            !SocialCalc.Callbacks.IsCellEditable(editor))
                    ) {
                        // if copy or cut but in no edit
                        cmd = "copy " + sel + " formulas";
                    } else {
                        // [ctrl-x]
                        cmd = "cut " + sel + " formulas";
                    }
                    editor.EditorScheduleSheetCommands(cmd, true, false); // queue up command to put on SocialCalc clipboard

                    /* Copy as HTML: This fails rather badly as it won't paste into Notepad as tab-delimited text. Oh well.
          
          ha = editor.pasteHTMLarea;
          if (editor.range.hasrange) {
          cell = SocialCalc.GetEditorCellElement(editor, editor.range.top, editor.range.left);
          }
          else {
          cell = SocialCalc.GetEditorCellElement(editor, editor.ecell.row, editor.ecell.col);
          }
          if (cell) position = SocialCalc.GetElementPosition(cell.element);
          
          if (ha) {
          if (position) {
          ha.style.left = (position.left-1)+"px";
          ha.style.top = (position.top-1)+"px";
          }
          ha.style.visibility="visible";
          cliptext = SocialCalc.ConvertSaveToOtherFormat(SocialCalc.CreateSheetSave(editor.context.sheetobj, sel), "html");
          ha.innerHTML = cliptext.replace(/<tr\b[^>]*>[\d\D]*?<\/tr\b[^>]*>/i, '');
          ha.focus();
          
          var range = document.body.createControlRange();
          range.addElement(ha.childNodes[0]);
          range.select();
          }
          */
                    ta.style.display = "block";
                    ta.value = cliptext; // must follow "block" setting for Webkit
                    ta.focus();
                    ta.select();
                    window.setTimeout(function () {
                        if (!SocialCalc.GetSpreadsheetControlObject) return; // in case not loaded
                        var s = SocialCalc.GetSpreadsheetControlObject();
                        if (!s) return;
                        var editor = s.editor;
                        /*
            var ha = editor.pasteHTMLarea;
            if (ha) {
            ha.blur();
            ha.innerHTML = '';
            ha.style.visibility = 'hidden';
            }
            */
                        var ta = editor.pasteTextarea;
                        ta.blur();
                        ta.style.display = "none";
                        SocialCalc.KeyboardFocus();
                    }, 200);

                    return true;

                case "[ctrl-v]":
                    if (editor.noEdit) return true; // not if no edit
                    if (SocialCalc.Callbacks && SocialCalc.Callbacks.IsCellEditable) {
                        if (!SocialCalc.Callbacks.IsCellEditable(editor)) {
                            return true;
                        }
                    }

                    var showPasteTextArea = function () {
                        ta = editor.pasteTextarea;
                        ta.value = "";

                        cell = SocialCalc.GetEditorCellElement(
                            editor,
                            editor.ecell.row,
                            editor.ecell.col
                        );
                        if (cell) {
                            position = SocialCalc.GetElementPosition(cell.element);
                            ta.style.left = position.left - 1 + "px";
                            ta.style.top = position.top - 1 + "px";
                        }
                        ta.style.display = "block";
                        ta.value = ""; // must follow "block" setting for Webkit
                        ta.focus();
                    };

                    ha = editor.pasteHTMLarea;
                    if (ha) {
                        /* Pasting via HTML - Currently IE only */
                        ha.style.visibility = "visible";
                        ha.focus();
                    } else {
                        showPasteTextArea();
                    }
                    window.setTimeout(function () {
                        if (!SocialCalc.GetSpreadsheetControlObject) return;
                        var s = SocialCalc.GetSpreadsheetControlObject();
                        if (!s) return;
                        var editor = s.editor;
                        var value = null;
                        var isPasteSameAsClipboard = false;

                        ha = editor.pasteHTMLarea;
                        if (ha) {
                            /* IE: We append a U+FFFC to every TD that's not the last of its row,
                             *     then we obtain innerText, then turn U+FFFC back to \t,
                             *     thereby preserving the cell separations (which gets discarded
                             *     if we simply paste via textarea.
                             */
                            var _ObjectReplacementCharacter_ = String.fromCharCode(0xfffc);
                            var html = ha.innerHTML;

                            if (html.search(/<(?![Bb][Rr])[A-Za-z]/) >= 0) {
                                /* HTML Paste: Mark TDs with U+FFFC accordingly.. */
                                ha.innerHTML = html.replace(
                                    /(?:<\/[Tt][Dd]>)/g,
                                    _ObjectReplacementCharacter_
                                );
                            } else {
                                /* Text Paste: In IE, \t is transformed into &nbsp;, so replace them with U+FFFC. */
                                ha.innerHTML = html.replace(
                                    /&[Nn][Bb][Ss][Pp];/g,
                                    _ObjectReplacementCharacter_
                                );
                            }

                            value = ha.innerText.replace(
                                new RegExp(_ObjectReplacementCharacter_, "g"),
                                "\t"
                            );

                            ha.innerHTML = "";
                            ha.blur();
                            ha.style.visibility = "hidden";
                        } else {
                            var ta = editor.pasteTextarea;
                            value = ta.value;
                            ta.blur();
                            ta.style.display = "none";
                        }

                        value = value.replace(/\r\n/g, "\n").replace(/\n?$/, "\n");
                        var clipstr = SocialCalc.ConvertSaveToOtherFormat(
                            SocialCalc.Clipboard.clipboard,
                            "tab"
                        );
                        if (
                            value == clipstr ||
                            (value.length - clipstr.length == 1 &&
                                value.substring(0, value.length - 1) == clipstr)
                        ) {
                            isPasteSameAsClipboard = true;
                        }

                        var cmd = "";
                        // pastes SocialCalc clipboard if did a Ctrl-C and contents still the same
                        // Webkit adds an extra blank line, so need to allow for that
                        if (!isPasteSameAsClipboard) {
                            cmd =
                                "loadclipboard " +
                                SocialCalc.encodeForSave(
                                    SocialCalc.ConvertOtherFormatToSave(value, "tab")
                                ) +
                                "\n";
                        }
                        var cr;
                        if (editor.range.hasrange) {
                            cr = SocialCalc.crToCoord(editor.range.left, editor.range.top);
                        } else {
                            cr = editor.ecell.coord;
                        }
                        cmd += "paste " + cr + " formulas";
                        editor.EditorScheduleSheetCommands(cmd, true, false);
                        SocialCalc.KeyboardFocus();
                    }, 200);
                    return true;

                case "[ctrl-z]":
                    editor.EditorScheduleSheetCommands("undo", true, false);
                    return false;

                case "[ctrl-s]": // !!!! temporary hack
                    window.setTimeout(function () {
                        if (!SocialCalc.GetSpreadsheetControlObject) return;
                        var s = SocialCalc.GetSpreadsheetControlObject();
                        if (!s) return;
                        var editor = s.editor;
                        var sheet = editor.context.sheetobj;
                        var cell = sheet.GetAssuredCell(editor.ecell.coord);
                        var ntvf = cell.nontextvalueformat
                            ? sheet.valueformats[cell.nontextvalueformat - 0] || ""
                            : "";
                        var newntvf = window.prompt(
                            "Advanced Feature:\n\nCustom Numeric Format or Command",
                            ntvf
                        );
                        if (newntvf != null) {
                            // not cancelled
                            if (newntvf.match(/^cmd:/)) {
                                cmd = newntvf.substring(4); // execute as command
                            } else if (newntvf.match(/^edit:/)) {
                                cmd = newntvf.substring(5); // execute as command
                                if (SocialCalc.CtrlSEditor) {
                                    SocialCalc.CtrlSEditor(cmd);
                                }
                                return;
                            } else {
                                if (editor.range.hasrange) {
                                    sel =
                                        SocialCalc.crToCoord(editor.range.left, editor.range.top) +
                                        ":" +
                                        SocialCalc.crToCoord(
                                            editor.range.right,
                                            editor.range.bottom
                                        );
                                } else {
                                    sel = editor.ecell.coord;
                                }
                                cmd = "set " + sel + " nontextvalueformat " + newntvf;
                            }
                            editor.EditorScheduleSheetCommands(cmd, true, false);
                        }
                    }, 200);
                    return false;

                default:
                    break;
            }
            return true;
        };

        // Set sheet's status callback:

        context.sheetobj.statuscallback = SocialCalc.EditorSheetStatusCallback;
        context.sheetobj.statuscallbackparams = this; // this object: the table editor object

        // StatusCallback: all values are called at appropriate times, add with unique name, delete when done
        //
        // Each value must be an object in the form of:
        //
        //    func: function(editor, status, arg, params) {...},
        //    params: params value to call func with
        //
        // The values for status and arg are:
        //
        //    all the SocialCalc RecalcSheet statuscallbacks, including:
        //
        //       calccheckdone, calclist length
        //       calcorder, {coord: coord, total: celllist length, count: count}
        //       calcstep, {coord: coord, total: calclist length, count: count}
        //       calcfinished, time in milliseconds
        //
        //    the command callbacks, like cmdstart and cmdend
        //    cmdendnorender
        //
        //    calcstart, null
        //    moveecell, new ecell coord
        //    rangechange, "coord:coord" or "coord" or ""
        //    specialkey, keyname ("[esc]")
        //

        this.StatusCallback = {};

        this.MoveECellCallback = {}; // all values are called with editor as arg; add with unique name, delete when done
        this.RangeChangeCallback = {}; // all values are called with editor as arg; add with unique name, delete when done
        this.SettingsCallbacks = {}; // See SocialCalc.SaveEditorSettings

        // Set initial cursor

        this.ecell = { coord: "A1", row: 1, col: 1 };
        context.highlights[this.ecell.coord] = "cursor";

        // Initialize range data
        // Range has at least hasrange (true/false).
        // It may also have: anchorcoord, anchorrow, anchorcol, top, bottom, left, and right.

        this.range = { hasrange: false };

        // Initialize range2 data (used to show selections, such as for move)
        // Range2 has at least hasrange (true/false).
        // It may also have: top, bottom, left, and right.

        this.range2 = { hasrange: false };
    };

    // Methods:

    SocialCalc.TableEditor.prototype.CreateTableEditor = function (
        width,
        height
    ) {
        return SocialCalc.CreateTableEditor(this, width, height);
    };
    SocialCalc.TableEditor.prototype.ResizeTableEditor = function (
        width,
        height
    ) {
        return SocialCalc.ResizeTableEditor(this, width, height);
    };

    SocialCalc.TableEditor.prototype.SaveEditorSettings = function () {
        return SocialCalc.SaveEditorSettings(this);
    };
    SocialCalc.TableEditor.prototype.LoadEditorSettings = function (str, flags) {
        return SocialCalc.LoadEditorSettings(this, str, flags);
    };

    SocialCalc.TableEditor.prototype.EditorRenderSheet = function () {
        SocialCalc.EditorRenderSheet(this);
    };
    SocialCalc.TableEditor.prototype.EditorScheduleSheetCommands = function (
        cmdstr,
        saveundo,
        ignorebusy
    ) {
        SocialCalc.EditorScheduleSheetCommands(this, cmdstr, saveundo, ignorebusy);
    };
    SocialCalc.TableEditor.prototype.ScheduleSheetCommands = function (
        cmdstr,
        saveundo
    ) {
        this.context.sheetobj.ScheduleSheetCommands(cmdstr, saveundo);
    };
    SocialCalc.TableEditor.prototype.SheetUndo = function () {
        this.context.sheetobj.SheetUndo();
    };
    SocialCalc.TableEditor.prototype.SheetRedo = function () {
        this.context.sheetobj.SheetRedo();
    };
    SocialCalc.TableEditor.prototype.EditorStepSet = function (status, arg) {
        SocialCalc.EditorStepSet(this, status, arg);
    };
    SocialCalc.TableEditor.prototype.GetStatuslineString = function (
        status,
        arg,
        params
    ) {
        return SocialCalc.EditorGetStatuslineString(this, status, arg, params);
    };

    SocialCalc.TableEditor.prototype.EditorMouseRegister = function () {
        return SocialCalc.EditorMouseRegister(this);
    };
    SocialCalc.TableEditor.prototype.EditorMouseUnregister = function () {
        return SocialCalc.EditorMouseUnregister(this);
    };
    SocialCalc.TableEditor.prototype.EditorMouseRange = function (coord) {
        return SocialCalc.EditorMouseRange(this, coord);
    };

    SocialCalc.TableEditor.prototype.EditorProcessKey = function (ch, e) {
        return SocialCalc.EditorProcessKey(this, ch, e);
    };
    SocialCalc.TableEditor.prototype.EditorAddToInput = function (str, prefix) {
        return SocialCalc.EditorAddToInput(this, str, prefix);
    };
    SocialCalc.TableEditor.prototype.DisplayCellContents = function () {
        return SocialCalc.EditorDisplayCellContents(this);
    };
    SocialCalc.TableEditor.prototype.EditorSaveEdit = function (text) {
        return SocialCalc.EditorSaveEdit(this, text);
    };
    SocialCalc.TableEditor.prototype.EditorApplySetCommandsToRange = function (
        cmdline,
        type
    ) {
        return SocialCalc.EditorApplySetCommandsToRange(this, cmdline, type);
    };

    SocialCalc.TableEditor.prototype.MoveECellWithKey = function (ch) {
        return SocialCalc.MoveECellWithKey(this, ch);
    };
    SocialCalc.TableEditor.prototype.MoveECell = function (newcell) {
        return SocialCalc.MoveECell(this, newcell);
    };
    SocialCalc.TableEditor.prototype.ReplaceCell = function (cell, row, col) {
        SocialCalc.ReplaceCell(this, cell, row, col);
    };
    SocialCalc.TableEditor.prototype.UpdateCellCSS = function (cell, row, col) {
        SocialCalc.UpdateCellCSS(this, cell, row, col);
    };
    SocialCalc.TableEditor.prototype.SetECellHeaders = function (selected) {
        SocialCalc.SetECellHeaders(this, selected);
    };
    SocialCalc.TableEditor.prototype.EnsureECellVisible = function () {
        SocialCalc.EnsureECellVisible(this);
    };
    SocialCalc.TableEditor.prototype.RangeAnchor = function (coord) {
        SocialCalc.RangeAnchor(this, coord);
    };
    SocialCalc.TableEditor.prototype.RangeExtend = function (coord) {
        SocialCalc.RangeExtend(this, coord);
    };
    SocialCalc.TableEditor.prototype.RangeRemove = function () {
        SocialCalc.RangeRemove(this);
    };
    SocialCalc.TableEditor.prototype.Range2Remove = function () {
        SocialCalc.Range2Remove(this);
    };

    SocialCalc.TableEditor.prototype.FitToEditTable = function () {
        SocialCalc.FitToEditTable(this);
    };
    SocialCalc.TableEditor.prototype.CalculateEditorPositions = function () {
        SocialCalc.CalculateEditorPositions(this);
    };
    SocialCalc.TableEditor.prototype.ScheduleRender = function () {
        SocialCalc.ScheduleRender(this);
    };
    SocialCalc.TableEditor.prototype.DoRenderStep = function () {
        SocialCalc.DoRenderStep(this);
    };
    SocialCalc.TableEditor.prototype.SchedulePositionCalculations = function () {
        SocialCalc.SchedulePositionCalculations(this);
    };
    SocialCalc.TableEditor.prototype.DoPositionCalculations = function () {
        SocialCalc.DoPositionCalculations(this);
    };
    SocialCalc.TableEditor.prototype.CalculateRowPositions = function (
        panenum,
        positions,
        sizes
    ) {
        return SocialCalc.CalculateRowPositions(this, panenum, positions, sizes);
    };
    SocialCalc.TableEditor.prototype.CalculateColPositions = function (
        panenum,
        positions,
        sizes
    ) {
        return SocialCalc.CalculateColPositions(this, panenum, positions, sizes);
    };

    SocialCalc.TableEditor.prototype.ScrollRelative = function (
        vertical,
        amount
    ) {
        SocialCalc.ScrollRelative(this, vertical, amount);
    };
    SocialCalc.TableEditor.prototype.ScrollRelativeBoth = function (
        vamount,
        hamount
    ) {
        SocialCalc.ScrollRelativeBoth(this, vamount, hamount);
    };
    SocialCalc.TableEditor.prototype.PageRelative = function (
        vertical,
        direction
    ) {
        SocialCalc.PageRelative(this, vertical, direction);
    };
    SocialCalc.TableEditor.prototype.LimitLastPanes = function () {
        SocialCalc.LimitLastPanes(this);
    };

    SocialCalc.TableEditor.prototype.ScrollTableUpOneRow = function () {
        return SocialCalc.ScrollTableUpOneRow(this);
    };
    SocialCalc.TableEditor.prototype.ScrollTableDownOneRow = function () {
        return SocialCalc.ScrollTableDownOneRow(this);
    };
    SocialCalc.TableEditor.prototype.ScrollTableLeftOneCol = function () {
        return SocialCalc.ScrollTableLeftOneCol(this);
    };
    SocialCalc.TableEditor.prototype.ScrollTableRightOneCol = function () {
        return SocialCalc.ScrollTableRightOneCol(this);
    };

    //contact prototype
    SocialCalc.TableEditor.prototype.EditorChangecontact = function (
        text,
        name,
        phone,
        email,
        street,
        city,
        company,
        val
    ) {
        return SocialCalc.EditorChangecontact(
            this,
            text,
            name,
            phone,
            email,
            street,
            city,
            company,
            val
        );
    };
    SocialCalc.TableEditor.prototype.EditorChangecolorFromWidget = function (
        text
    ) {
        return SocialCalc.EditorChangecolorFromWidget(this, text);
    };
    SocialCalc.TableEditor.prototype.EditorChangeSheetcolor = function (text) {
        return SocialCalc.EditorChangeSheetcolor(this, text);
    };

    SocialCalc.TableEditor.prototype.EditorChangefontFromWidget = function (
        text
    ) {
        return SocialCalc.EditorChangefontFromWidget(this, text);
    };
    SocialCalc.TableEditor.prototype.EditorChangeSheetfont = function (text) {
        return SocialCalc.EditorChangeSheetfont(this, text);
    };
    SocialCalc.TableEditor.prototype.EditorCut = function (text, no_of_cells) {
        return SocialCalc.EditorCut(this, text, no_of_cells);
    };
    SocialCalc.TableEditor.prototype.EditorClearSheet = function (
        text,
        cell_to_clear
    ) {
        return SocialCalc.EditorClearSheet(this, text, cell_to_clear);
    };

    // Functions:

    SocialCalc.CreateTableEditor = function (editor, width, height) {
        var scc = SocialCalc.Constants;
        var AssignID = SocialCalc.AssignID;

        editor.toplevel = document.createElement("div");
        editor.width = width;
        editor.height = height;

        editor.griddiv = document.createElement("div");
        editor.tablewidth = Math.max(0, width - scc.defaultTableControlThickness);
        editor.tableheight = Math.max(0, height - scc.defaultTableControlThickness);
        editor.griddiv.style.width = editor.tablewidth + "px";
        editor.griddiv.style.height = editor.tableheight + "px";
        editor.griddiv.style.overflow = "hidden";
        editor.griddiv.style.cursor = "default";
        if (scc.cteGriddivClass) editor.griddiv.className = scc.cteGriddivClass;
        AssignID(editor, editor.griddiv, "griddiv");

        editor.FitToEditTable();

        editor.EditorRenderSheet();

        editor.griddiv.appendChild(editor.fullgrid);

        editor.verticaltablecontrol = new SocialCalc.TableControl(
            editor,
            true,
            editor.tableheight
        );
        editor.verticaltablecontrol.CreateTableControl();
        AssignID(editor, editor.verticaltablecontrol.main, "tablecontrolv");

        editor.horizontaltablecontrol = new SocialCalc.TableControl(
            editor,
            false,
            editor.tablewidth
        );
        editor.horizontaltablecontrol.CreateTableControl();
        AssignID(editor, editor.horizontaltablecontrol.main, "tablecontrolh");

        var table, tbody, tr, td, img, anchor, ta, ha;

        table = document.createElement("table");
        editor.layouttable = table;
        table.cellSpacing = 0;
        table.cellPadding = 0;
        AssignID(editor, table, "layouttable");

        tbody = document.createElement("tbody");
        table.appendChild(tbody);

        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        td.appendChild(editor.griddiv);
        tr.appendChild(td);
        td = document.createElement("td");
        //td.appendChild(editor.verticaltablecontrol.main);
        tr.appendChild(td);

        tr = document.createElement("tr");
        tbody.appendChild(tr);
        td = document.createElement("td");
        //td.appendChild(editor.horizontaltablecontrol.main);
        tr.appendChild(td);

        td = document.createElement("td"); // logo display: Required by CPAL License for this code!
        //td.style.background="url("+editor.imageprefix+"logo.gif) no-repeat center center";
        td.innerHTML =
            "<div style='cursor:pointer;font-size:1px;'><img src='" +
            editor.imageprefix +
            "1x1.gif' border='0' width='18' height='18'></div>";
        tr.appendChild(td);
        editor.logo = td;
        AssignID(editor, editor.logo, "logo");
        SocialCalc.TooltipRegister(td.firstChild.firstChild, "SocialCalc", null);

        editor.toplevel.appendChild(editor.layouttable);

        if (!editor.noEdit) {
            editor.inputEcho = new SocialCalc.InputEcho(editor);
            AssignID(editor, editor.inputEcho.main, "inputecho");
        }

        editor.cellhandles = new SocialCalc.CellHandles(editor);

        ta = document.createElement("textarea"); // used for ctrl-c/ctrl-v where an invisible text area is needed
        SocialCalc.setStyles(
            ta,
            "display:none;position:absolute;height:1px;width:1px;opacity:0;filter:alpha(opacity=0);"
        );
        ta.value = "";
        editor.pasteTextarea = ta;
        AssignID(editor, editor.pasteTextarea, "pastetextarea");

        if (
            navigator.userAgent.match(/Safari\//) &&
            !navigator.userAgent.match(/Chrome\//)
        ) {
            // special code for Safari 5 change
            window.removeEventListener(
                "beforepaste",
                SocialCalc.SafariPasteFunction,
                false
            );
            window.addEventListener(
                "beforepaste",
                SocialCalc.SafariPasteFunction,
                false
            );
            window.removeEventListener(
                "beforecopy",
                SocialCalc.SafariPasteFunction,
                false
            );
            window.addEventListener(
                "beforecopy",
                SocialCalc.SafariPasteFunction,
                false
            );
            window.removeEventListener(
                "beforecut",
                SocialCalc.SafariPasteFunction,
                false
            );
            window.addEventListener(
                "beforecut",
                SocialCalc.SafariPasteFunction,
                false
            );
        }

        editor.toplevel.appendChild(editor.pasteTextarea);

        var div = document.createElement("div");
        div.innerHTML = "    <br/>";
        if (div.firstChild.nodeType == 1) {
            /* We are running in IE -- Using HTML-based area for Ctrl-V */
            ha = document.createElement("div"); // used for ctrl-v where an invisible html area is needed
            editor.pasteHTMLarea = ha;
            editor.toplevel.appendChild(editor.pasteHTMLarea);
            ha.contentEditable = true;
            AssignID(editor, editor.pasteHTMLarea, "pastehtmlarea");
            SocialCalc.setStyles(
                ha,
                "display:block;visibility:hidden;position:absolute;height:1px;width:1px;opacity:0;filter:alpha(opacity=0);overflow:hidden"
            );
        }

        SocialCalc.MouseWheelRegister(editor.toplevel, {
            WheelMove: SocialCalc.EditorProcessMouseWheel,
            editor: editor,
        });

        if (SocialCalc.HasTouch) {
            SocialCalc.TouchRegister(editor.toplevel, {
                Swipe: SocialCalc.EditorProcessSwipe,
                DoubleTap: SocialCalc.EditorProcessDoubleTap,
                SingleTap: SocialCalc.EditorProcessSingleTap,
                editor: editor,
            });
        }

        if (editor.inputBox) {
            // this seems to fix an obscure bug with Firefox 2 Mac where Ctrl-V doesn't get fired right
            if (editor.inputBox.element) {
                editor.inputBox.element.focus();
                editor.inputBox.element.blur();
            }
        }
        SocialCalc.KeyboardSetFocus(editor);

        // do status reporting things

        SocialCalc.EditorSheetStatusCallback(null, "startup", null, editor);

        // done

        return editor.toplevel;
    };

    // Special code needed for change that occurred with Safari 5 that made paste not work for some reason

    SocialCalc.SafariPasteFunction = function (e) {
        e.preventDefault();
    };

    //
    // SocialCalc.ResizeTableEditor(editor, width, height)
    //
    // Move things around as appropriate and resize
    //

    SocialCalc.ResizeTableEditor = function (editor, width, height) {
        var scc = SocialCalc.Constants;

        editor.width = width;
        editor.height = height;

        editor.toplevel.style.width = width + "px";
        editor.toplevel.style.height = height + "px";

        editor.tablewidth = Math.max(0, width - scc.defaultTableControlThickness);
        editor.tableheight = Math.max(0, height - scc.defaultTableControlThickness);
        editor.griddiv.style.width = editor.tablewidth + "px";
        editor.griddiv.style.height = editor.tableheight + "px";

        editor.verticaltablecontrol.main.style.height = editor.tableheight + "px";
        editor.horizontaltablecontrol.main.style.width = editor.tablewidth + "px";

        editor.FitToEditTable();

        editor.ScheduleRender();

        return;
    };

    //
    // str = SaveEditorSettings(editor)
    //
    // Returns a string representation of the pane settings, etc.
    //
    // The format is:
    //
    //    version:1.0
    //    rowpane:panenumber:firstnum:lastnum
    //    colpane:panenumber:firstnum:lastnum
    //    ecell:coord -- if set
    //    range:anchorcoord:top:bottom:left:right -- if set
    //
    // You can add additional values to be saved by using editor.SettingsCallbacks:
    //
    //   editor.SettingsCallbacks["item-name"] = {save: savefunction, load: loadfunction}
    //
    // where savefunction(editor, "item-name") returns a string with the new lines to be added to the saved settings
    // which include the trailing newlines, and loadfunction(editor, "item-name", line, flags) is given the line to process
    // without the trailing newlines.
    //

    SocialCalc.SaveEditorSettings = function (editor) {
        var i, setting;
        var context = editor.context;
        var range = editor.range;
        var result = "";

        result += "version:1.0\n";

        for (i = 0; i < context.rowpanes.length; i++) {
            result +=
                "rowpane:" +
                i +
                ":" +
                context.rowpanes[i].first +
                ":" +
                context.rowpanes[i].last +
                "\n";
        }
        for (i = 0; i < context.colpanes.length; i++) {
            result +=
                "colpane:" +
                i +
                ":" +
                context.colpanes[i].first +
                ":" +
                context.colpanes[i].last +
                "\n";
        }

        if (editor.ecell) {
            result += "ecell:" + editor.ecell.coord + "\n";
        }

        if (range.hasrange) {
            result +=
                "range:" +
                range.anchorcoord +
                ":" +
                range.top +
                ":" +
                range.bottom +
                ":" +
                range.left +
                ":" +
                range.right +
                "\n";
        }

        for (setting in editor.SettingsCallbacks) {
            result += editor.SettingsCallbacks[setting].save(editor, setting);
        }

        return result;
    };

    //
    // LoadEditorSettings(editor, str, flags)
    //
    // Sets the editor settings based on str. See SocialCalc.SaveEditorSettings for more details.
    // Unrecognized lines are ignored.
    //

    SocialCalc.LoadEditorSettings = function (editor, str, flags) {
        var lines = str.split(/\r\n|\n/);
        var parts = [];
        var line, i, cr, row, col, coord, setting;
        var context = editor.context;
        var highlights, range;

        context.rowpanes = [{ first: 1, last: 1 }]; // reset to start
        context.colpanes = [{ first: 1, last: 1 }];
        editor.ecell = null;
        editor.range = { hasrange: false };
        editor.range2 = { hasrange: false };
        range = editor.range;
        context.highlights = {};
        highlights = context.highlights;

        for (i = 0; i < lines.length; i++) {
            line = lines[i];
            parts = line.split(":");
            setting = parts[0];
            switch (setting) {
                case "version":
                    break;

                case "rowpane":
                    context.rowpanes[parts[1] - 0] = {
                        first: parts[2] - 0,
                        last: parts[3] - 0,
                    };
                    break;

                case "colpane":
                    context.colpanes[parts[1] - 0] = {
                        first: parts[2] - 0,
                        last: parts[3] - 0,
                    };
                    break;

                case "ecell":
                    editor.ecell = SocialCalc.coordToCr(parts[1]);
                    editor.ecell.coord = parts[1];
                    highlights[parts[1]] = "cursor";
                    break;

                case "range":
                    range.hasrange = true;
                    range.anchorcoord = parts[1];
                    cr = SocialCalc.coordToCr(range.anchorcoord);
                    range.anchorrow = cr.row;
                    range.anchorcol = cr.col;
                    range.top = parts[2] - 0;
                    range.bottom = parts[3] - 0;
                    range.left = parts[4] - 0;
                    range.right = parts[5] - 0;
                    for (row = range.top; row <= range.bottom; row++) {
                        for (col = range.left; col <= range.right; col++) {
                            coord = SocialCalc.crToCoord(col, row);
                            if (highlights[coord] != "cursor") {
                                highlights[coord] = "range";
                            }
                        }
                    }
                    break;

                default:
                    if (editor.SettingsCallbacks[setting]) {
                        editor.SettingsCallbacks[setting].load(
                            editor,
                            setting,
                            line,
                            flags
                        );
                    }
                    break;
            }
        }

        return;
    };

    //
    // EditorRenderSheet(editor)
    //
    // Renders the sheet and updates editor.fullgrid.
    // Sets event handlers.
    //

    SocialCalc.EditorRenderSheet = function (editor) {
        editor.EditorMouseUnregister();

        editor.fullgrid = editor.context.RenderSheet(editor.fullgrid);

        if (editor.ecell) editor.SetECellHeaders("selected");

        SocialCalc.AssignID(editor, editor.fullgrid, "fullgrid"); // give it an id

        editor.EditorMouseRegister();
    };

    //
    // EditorScheduleSheetCommands(editor, cmdstr, saveundo, ignorebusy)
    //

    SocialCalc.EditorScheduleSheetCommands = function (
        editor,
        cmdstr,
        saveundo,
        ignorebusy
    ) {
        if (editor.state != "start" && !ignorebusy) {
            // ignore commands if editing a cell
            return;
        }

        if (editor.busy && !ignorebusy) {
            // hold off on commands if doing one
            editor.deferredCommands.push({ cmdstr: cmdstr, saveundo: saveundo });
            return;
        }

        switch (cmdstr) {
            case "recalc":
            case "redisplay":
                editor.context.sheetobj.ScheduleSheetCommands(cmdstr, false);
                break;

            case "undo":
                editor.SheetUndo();
                break;

            case "redo":
                editor.SheetRedo();
                break;

            default:
                editor.context.sheetobj.ScheduleSheetCommands(cmdstr, saveundo);
                break;
        }
    };

    //
    // EditorSheetStatusCallback(recalcdata, status, arg, editor)
    //
    // Called during recalc, executing commands, etc.
    //

    SocialCalc.EditorSheetStatusCallback = function (
        recalcdata,
        status,
        arg,
        editor
    ) {
        var f, cell, dcmd;
        if (!editor) {
            editor = (SocialCalc.EditorStepInfo && SocialCalc.EditorStepInfo.editor) || (SocialCalc.GetEditor && SocialCalc.GetEditor());
        }
        if (!editor || !editor.context) {
            return;
        }
        var sheetobj = editor.context.sheetobj;
        var cr;

        var signalstatus = function (s) {
            for (f in editor.StatusCallback) {
                if (editor.StatusCallback[f].func) {
                    editor.StatusCallback[f].func(
                        editor,
                        s,
                        arg,
                        editor.StatusCallback[f].params
                    );
                }
            }
        };

        switch (status) {
            case "startup":
                break;

            case "cmdstart":
                editor.busy = true;
                sheetobj.celldisplayneeded = "";
                break;

            case "cmdextension":
                break;

            case "cmdend":
                signalstatus(status);

                if (sheetobj.changedrendervalues) {
                    editor.context.PrecomputeSheetFontsAndLayouts();
                    editor.context.CalculateCellSkipData();
                    sheetobj.changedrendervalues = false;
                }

                if (sheetobj.celldisplayneeded && !sheetobj.renderneeded) {
                    cr = SocialCalc.coordToCr(sheetobj.celldisplayneeded);
                    cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
                    editor.ReplaceCell(cell, cr.row, cr.col);
                }

                if (editor.deferredCommands.length) {
                    dcmd = editor.deferredCommands.shift();
                    editor.EditorScheduleSheetCommands(dcmd.cmdstr, dcmd.saveundo, true);
                    return;
                }

                if (
                    sheetobj.attribs.needsrecalc &&
                    (sheetobj.attribs.recalc != "off" || sheetobj.recalconce) &&
                    editor.recalcFunction
                ) {
                    editor.FitToEditTable();
                    sheetobj.renderneeded = false; // recalc will force a render
                    if (sheetobj.recalconce) delete sheetobj.recalconce; // only do once
                    editor.recalcFunction(editor);
                } else {
                    if (sheetobj.renderneeded) {
                        editor.FitToEditTable();
                        sheetobj.renderneeded = false;
                        editor.ScheduleRender();
                    } else {
                        editor.SchedulePositionCalculations(); // just in case command changed positions
                        //               editor.busy = false;
                        //               signalstatus("cmdendnorender");
                    }
                }
                return;

            case "calcstart":
                editor.busy = true;
                break;

            case "calccheckdone":
            case "calcorder":
            case "calcstep":
            case "calcloading":
            case "calcserverfunc":
                break;

            case "calcfinished":
                signalstatus(status);
                editor.ScheduleRender();
                return;

            case "schedrender":
                editor.busy = true; // in case got here without cmd or recalc
                break;

            case "renderdone":
                break;

            case "schedposcalc":
                editor.busy = true; // in case got here without cmd or recalc
                break;

            case "doneposcalc":
                if (editor.deferredCommands.length) {
                    signalstatus(status);
                    dcmd = editor.deferredCommands.shift();
                    editor.EditorScheduleSheetCommands(dcmd.cmdstr, dcmd.saveundo, true);
                } else {
                    editor.busy = false;
                    signalstatus(status);
                    if (editor.state == "start") editor.DisplayCellContents(); // make sure up to date
                }
                return;

            default:
                addmsg("Unknown status: " + status);
                break;
        }

        signalstatus(status);

        return;
    };

    // Timer-driven steps for use with SocialCalc.EditorSheetStatusCallback

    SocialCalc.EditorStepInfo = {
        //   status: "", // saved value to pass to callback
        editor: null, // for callback
        //   arg: null, // for callback
        //   timerobj: null
    };

    /*
       SocialCalc.EditorStepSet = function(editor, status, arg) {
       var esi = SocialCalc.EditorStepInfo;
       addmsg("step: "+status);
       if (esi.timerobj) {
       alert("Already waiting. Old/new: "+esi.status+"/"+status);
       }
       esi.editor = editor;
       esi.status = status;
       esi.timerobj = window.setTimeout(SocialCalc.EditorStepDone, 1);
       }
       
       SocialCalc.EditorStepDone = function() {
       var esi = SocialCalc.EditorStepInfo;
       esi.timerobj = null;
       SocialCalc.EditorSheetStatusCallback(null, esi.status, null, esi.editor);
       }
       */

    //
    // str = SocialCalc.EditorGetStatuslineString(editor, status, arg, params)
    //
    // Assumes params is an object where it can use "calculating" and "command"
    // to keep track of state.
    // Returns string for status line.
    //

    SocialCalc.EditorGetStatuslineString = function (
        editor,
        status,
        arg,
        params
    ) {
        var scc = SocialCalc.Constants;

        var sstr, progress, coord, circ, r, c, cell, sum, ele;

        progress = "";

        switch (status) {
            case "moveecell":
            case "rangechange":
            case "startup":
                break;
            case "cmdstart":
                params.command = true;
                document.body.style.cursor = "progress";
                editor.griddiv.style.cursor = "progress";
                progress = scc.s_statusline_executing;
                break;
            case "cmdextension":
                progress = "Command Extension: " + arg;
                break;
            case "cmdend":
                params.command = false;
                break;
            case "schedrender":
                progress = scc.s_statusline_displaying;
                break;
            case "renderdone":
                progress = " ";
                break;
            case "schedposcalc":
                progress = scc.s_statusline_displaying;
                break;
            case "cmdendnorender":
            case "doneposcalc":
                document.body.style.cursor = "default";
                editor.griddiv.style.cursor = "default";
                break;
            case "calcorder":
                progress =
                    scc.s_statusline_ordering +
                    Math.floor((100 * arg.count) / (arg.total || 1)) +
                    "%";
                break;
            case "calcstep":
                progress =
                    scc.s_statusline_calculating +
                    Math.floor((100 * arg.count) / (arg.total || 1)) +
                    "%";
                break;
            case "calcloading":
                progress = scc.s_statusline_calculatingls + ": " + arg.sheetname;
                break;
            case "calcserverfunc":
                progress =
                    scc.s_statusline_calculating +
                    Math.floor((100 * arg.count) / (arg.total || 1)) +
                    "%, " +
                    scc.s_statusline_doingserverfunc +
                    arg.funcname +
                    scc.s_statusline_incell +
                    arg.coord;
                break;
            case "calcstart":
                params.calculating = true;
                document.body.style.cursor = "progress";
                editor.griddiv.style.cursor = "progress"; // griddiv has an explicit cursor style
                progress = scc.s_statusline_calcstart;
                break;
            case "calccheckdone":
                break;
            case "calcfinished":
                params.calculating = false;
                break;
            default:
                progress = status;
                break;
        }

        if (!progress && params.calculating) {
            progress = scc.s_statusline_calculating;
        }

        // if there is a range, calculate sum (not during busy times)
        if (
            !params.calculating &&
            !params.command &&
            !progress &&
            editor.range.hasrange &&
            (editor.range.left != editor.range.right ||
                editor.range.top != editor.range.bottom)
        ) {
            sum = 0;
            for (r = editor.range.top; r <= editor.range.bottom; r++) {
                for (c = editor.range.left; c <= editor.range.right; c++) {
                    cell = editor.context.sheetobj.cells[SocialCalc.crToCoord(c, r)];
                    if (!cell) continue;
                    if (cell.valuetype && cell.valuetype.charAt(0) == "n") {
                        sum += cell.datavalue - 0;
                    }
                }
            }

            sum = SocialCalc.FormatNumber.formatNumberWithFormat(
                sum,
                "[,]General",
                ""
            );

            coord =
                SocialCalc.crToCoord(editor.range.left, editor.range.top) +
                ":" +
                SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
            progress =
                coord +
                " (" +
                (editor.range.right - editor.range.left + 1) +
                "x" +
                (editor.range.bottom - editor.range.top + 1) +
                ") " +
                scc.s_statusline_sum +
                "=" +
                sum +
                " " +
                progress;
        }
        sstr = editor.ecell.coord + " &nbsp; " + progress;

        if (
            !params.calculating &&
            editor.context.sheetobj.attribs.needsrecalc == "yes"
        ) {
            sstr += " &nbsp; " + scc.s_statusline_recalcneeded;
        }

        circ = editor.context.sheetobj.attribs.circularreferencecell;
        if (circ) {
            circ = circ.replace(/\|/, " referenced by ");
            sstr += " &nbsp; " + scc.s_statusline_circref + circ + "</span>";
        }

        return sstr;
    };

    //
    // Mouse stuff
    //

    SocialCalc.EditorMouseInfo = {
        // The registeredElements array is used to identify editor grid in which the mouse is doing things.

        // One item for each active editor, each an object with:
        //    .element, .editor

        registeredElements: [],

        editor: null, // editor being processed (between mousedown and mouseup)
        element: null, // element being processed

        ignore: false, // if true, mousedowns are ignored

        mousedowncoord: "", // coord where mouse went down for drag range
        mouselastcoord: "", // coord where mouse last was during drag
        mouseresizecol: "", // col being resized
        mouseresizeclientx: null, // where resize started
        mouseresizedisplay: null, // element tracking new size
    };

    //
    // EditorMouseRegister(editor)
    //

    SocialCalc.EditorMouseRegister = function (editor) {
        var mouseinfo = SocialCalc.EditorMouseInfo;
        var element = editor.fullgrid;
        var i;

        for (i = 0; i < mouseinfo.registeredElements.length; i++) {
            if (mouseinfo.registeredElements[i].editor == editor) {
                if (mouseinfo.registeredElements[i].element == element) {
                    return; // already set - don't do it again
                }
                break;
            }
        }

        if (i < mouseinfo.registeredElements.length) {
            mouseinfo.registeredElements[i].element = element;
        } else {
            mouseinfo.registeredElements.push({ element: element, editor: editor });
        }

        if (!SocialCalc.ProcessEditorMouseDownHandler) {
            SocialCalc.ProcessEditorMouseDownHandler = function (e) {
                return SocialCalc.ProcessEditorMouseDown(e);
            };
        }
        if (!SocialCalc.ProcessEditorDblClickHandler) {
            SocialCalc.ProcessEditorDblClickHandler = function (e) {
                return SocialCalc.ProcessEditorDblClick(e);
            };
        }

        if (element.addEventListener) {
            // DOM Level 2 -- Firefox, et al
            element.addEventListener(
                "mousedown",
                SocialCalc.ProcessEditorMouseDownHandler,
                false
            );
            element.addEventListener(
                "dblclick",
                SocialCalc.ProcessEditorDblClickHandler,
                false
            );
        } else if (element.attachEvent) {
            // IE 5+
            element.attachEvent("onmousedown", SocialCalc.ProcessEditorMouseDownHandler);
            element.attachEvent("ondblclick", SocialCalc.ProcessEditorDblClickHandler);
        } else {
            // don't handle this
            throw "Browser not supported";
        }

        mouseinfo.ignore = false; // just in case

        return;
    };

    //
    // EditorMouseUnregister(editor)
    //

    SocialCalc.EditorMouseUnregister = function (editor) {
        var mouseinfo = SocialCalc.EditorMouseInfo;
        var element = editor.fullgrid;
        var i, oldelement;

        for (i = 0; i < mouseinfo.registeredElements.length; i++) {
            if (mouseinfo.registeredElements[i].editor == editor) {
                break;
            }
        }

        if (i < mouseinfo.registeredElements.length) {
            oldelement = mouseinfo.registeredElements[i].element; // remove old handlers
            if (oldelement.removeEventListener) {
                // DOM Level 2
                oldelement.removeEventListener(
                    "mousedown",
                    SocialCalc.ProcessEditorMouseDownHandler || SocialCalc.ProcessEditorMouseDown,
                    false
                );
                oldelement.removeEventListener(
                    "dblclick",
                    SocialCalc.ProcessEditorDblClickHandler || SocialCalc.ProcessEditorDblClick,
                    false
                );
            } else if (oldelement.detachEvent) {
                // IE
                oldelement.detachEvent(
                    "onmousedown",
                    SocialCalc.ProcessEditorMouseDownHandler || SocialCalc.ProcessEditorMouseDown
                );
                oldelement.detachEvent("ondblclick", SocialCalc.ProcessEditorDblClickHandler || SocialCalc.ProcessEditorDblClick);
            }
            mouseinfo.registeredElements.splice(i, 1);
        }

        return;
    };

    SocialCalc.ProcessEditorMouseDown = function (e) {
        var editor, result, coord, textarea, wval, range;

        var event = e || window.event;

        var viewport = SocialCalc.GetViewportInfo();
        var clientX = event.clientX + viewport.horizontalScroll;
        var clientY = event.clientY + viewport.verticalScroll;

        var mouseinfo = SocialCalc.EditorMouseInfo;
        var ele = event.target || event.srcElement; // source object is often within what we want
        var mobj;

        if (mouseinfo.ignore) return; // ignore this

        for (mobj = null; !mobj && ele; ele = ele.parentNode) {
            // go up tree looking for one of our elements
            mobj = SocialCalc.LookupElement(ele, mouseinfo.registeredElements);
        }
        if (!mobj) {
            mouseinfo.editor = null;
            return; // not one of our elements
        }

        editor = mobj.editor;
        mouseinfo.element = ele;
        range = editor.range;
        result = SocialCalc.GridMousePosition(editor, clientX, clientY);

        if (!result || result.rowheader) return; // not on a cell or col header
        mouseinfo.editor = editor; // remember for later

        if (result.colheader && result.coltoresize) {
            // col header - do drag resize
            SocialCalc.ProcessEditorColsizeMouseDown(e, ele, result);
            return;
        }

        if (!result.coord) return; // not us

        if (!range.hasrange) {
            if (e.shiftKey) editor.RangeAnchor();
        }

        SocialCalc.Callbacks.ToggleCell(result.coord);
        coord = editor.MoveECell(result.coord);

        if (range.hasrange) {
            if (e.shiftKey) editor.RangeExtend();
            else editor.RangeRemove();
        }

        mouseinfo.mousedowncoord = coord; // remember if starting drag range select
        mouseinfo.mouselastcoord = coord;

        editor.EditorMouseRange(coord);

        SocialCalc.KeyboardSetFocus(editor);
        if (editor.state != "start" && editor.inputBox)
            editor.inputBox.element.focus();

        // Event code from JavaScript, Flanagan, 5th Edition, pg. 422
        if (document.addEventListener) {
            // DOM Level 2 -- Firefox, et al
            document.addEventListener(
                "mousemove",
                SocialCalc.ProcessEditorMouseMove,
                true
            ); // capture everywhere
            document.addEventListener(
                "mouseup",
                SocialCalc.ProcessEditorMouseUp,
                true
            ); // capture everywhere
        } else if (ele.attachEvent) {
            // IE 5+
            ele.setCapture();
            ele.attachEvent("onmousemove", SocialCalc.ProcessEditorMouseMove);
            ele.attachEvent("onmouseup", SocialCalc.ProcessEditorMouseUp);
            ele.attachEvent("onlosecapture", SocialCalc.ProcessEditorMouseUp);
        }
        if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
        else event.cancelBubble = true; // IE 5+
        if (event.preventDefault) event.preventDefault(); // DOM Level 2
        else event.returnValue = false; // IE 5+

        return;
    };

    SocialCalc.EditorMouseRange = function (editor, coord) {
        var inputtext, wval;
        var range = editor.range;

        switch (
        editor.state // editing a cell - shouldn't get here if no inputBox
        ) {
            case "input":
                inputtext = editor.inputBox.GetText();
                wval = editor.workingvalues;
                if (
                    ("(+-*/,:!&<>=^".indexOf(inputtext.slice(-1)) >= 0 &&
                        inputtext.slice(0, 1) == "=") ||
                    inputtext == "="
                ) {
                    wval.partialexpr = inputtext;
                }
                if (wval.partialexpr) {
                    // if in pointing operation
                    if (coord) {
                        if (range.hasrange) {
                            var sheetpref =
                                wval.currentsheet == wval.startsheet
                                    ? ""
                                    : wval.currentsheet + "!";
                            editor.inputBox.SetText(
                                wval.partialexpr +
                                sheetpref +
                                SocialCalc.crToCoord(range.left, range.top) +
                                ":" +
                                sheetpref +
                                SocialCalc.crToCoord(range.right, range.bottom)
                            );
                        } else {
                            var sheetpref =
                                wval.currentsheet == wval.startsheet
                                    ? ""
                                    : wval.currentsheet + "!";
                            editor.inputBox.SetText(wval.partialexpr + sheetpref + coord);
                        }
                    }
                } else {
                    // not in point -- done editing
                    editor.inputBox.Blur();
                    editor.inputBox.ShowInputBox(false);
                    editor.state = "start";
                    editor.cellhandles.ShowCellHandles(true);
                    editor.EditorSaveEdit();
                    editor.inputBox.DisplayCellContents(null);
                }
                break;

            case "inputboxdirect":
                editor.inputBox.Blur();
                editor.inputBox.ShowInputBox(false);
                editor.state = "start";
                editor.cellhandles.ShowCellHandles(true);
                editor.EditorSaveEdit();
                editor.inputBox.DisplayCellContents(null);
                break;
        }
    };

    SocialCalc.ProcessEditorMouseMove = function (e) {
        var editor, element, result, coord, now, textarea, sheetobj, cellobj, wval;

        var event = e || window.event;

        var viewport = SocialCalc.GetViewportInfo();
        var clientX = event.clientX + viewport.horizontalScroll;
        var clientY = event.clientY + viewport.verticalScroll;

        var mouseinfo = SocialCalc.EditorMouseInfo;
        editor = mouseinfo.editor;
        if (!editor) return; // not us, ignore
        if (mouseinfo.ignore) return; // ignore this
        element = mouseinfo.element;

        result = SocialCalc.GridMousePosition(editor, clientX, clientY); // get cell with move

        if (!result) return;

        if (result && !result.coord) {
            SocialCalc.SetDragAutoRepeat(editor, result);
            return;
        }

        SocialCalc.SetDragAutoRepeat(editor, null); // stop repeating if it was

        if (!result.coord) return;

        if (result.coord != mouseinfo.mouselastcoord) {
            if (!e.shiftKey && !editor.range.hasrange) {
                editor.RangeAnchor(mouseinfo.mousedowncoord);
            }
            editor.MoveECell(result.coord);
            editor.RangeExtend();
        }
        mouseinfo.mouselastcoord = result.coord;

        editor.EditorMouseRange(result.coord);

        if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
        else event.cancelBubble = true; // IE 5+
        if (event.preventDefault) event.preventDefault(); // DOM Level 2
        else event.returnValue = false; // IE 5+

        return;
    };

    SocialCalc.ProcessEditorMouseUp = function (e) {
        var editor, element, result, coord, now, textarea, sheetobj, cellobj, wval;

        var event = e || window.event;

        var viewport = SocialCalc.GetViewportInfo();
        var clientX = event.clientX + viewport.horizontalScroll;
        var clientY = event.clientY + viewport.verticalScroll;

        var mouseinfo = SocialCalc.EditorMouseInfo;
        editor = mouseinfo.editor;
        if (!editor) return; // not us, ignore
        if (mouseinfo.ignore) return; // ignore this
        element = mouseinfo.element;

        result = SocialCalc.GridMousePosition(editor, clientX, clientY); // get cell with up

        SocialCalc.SetDragAutoRepeat(editor, null); // stop repeating if it was

        if (!result) return;

        if (!result.coord) result.coord = editor.ecell.coord;

        if (editor.range.hasrange) {
            editor.MoveECell(result.coord);
            editor.RangeExtend();
        } else if (result.coord && result.coord != mouseinfo.mousedowncoord) {
            editor.RangeAnchor(mouseinfo.mousedowncoord);
            editor.MoveECell(result.coord);
            editor.RangeExtend();
        }

        editor.EditorMouseRange(result.coord);

        if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
        else event.cancelBubble = true; // IE 5+
        if (event.preventDefault) event.preventDefault(); // DOM Level 2
        else event.returnValue = false; // IE 5+

        if (document.removeEventListener) {
            // DOM Level 2
            document.removeEventListener(
                "mousemove",
                SocialCalc.ProcessEditorMouseMove,
                true
            );
            document.removeEventListener(
                "mouseup",
                SocialCalc.ProcessEditorMouseUp,
                true
            );
        } else if (element.detachEvent) {
            // IE
            element.detachEvent("onlosecapture", SocialCalc.ProcessEditorMouseUp);
            element.detachEvent("onmouseup", SocialCalc.ProcessEditorMouseUp);
            element.detachEvent("onmousemove", SocialCalc.ProcessEditorMouseMove);
            element.releaseCapture();
        }

        mouseinfo.editor = null;

        return false;
    };

    SocialCalc.ProcessEditorColsizeMouseDown = function (e, ele, result) {
        var event = e || window.event;
        var mouseinfo = SocialCalc.EditorMouseInfo;
        var editor = mouseinfo.editor;
        var viewport = SocialCalc.GetViewportInfo();
        var clientX = event.clientX + viewport.horizontalScroll;

        mouseinfo.mouseresizecolnum = result.coltoresize; // remember col being resized
        mouseinfo.mouseresizecol = SocialCalc.rcColname(result.coltoresize);
        mouseinfo.mousedownclientx = clientX;

        var sizedisplay = document.createElement("div");
        mouseinfo.mouseresizedisplay = sizedisplay;
        sizedisplay.style.width = "auto";
        sizedisplay.style.position = "absolute";
        sizedisplay.style.zIndex = 100;
        sizedisplay.style.top = editor.headposition.top + 0 + "px";
        sizedisplay.style.left = editor.colpositions[result.coltoresize] + "px";
        sizedisplay.innerHTML =
            '<table cellpadding="0" cellspacing="0"><tr><td style="height:100px;' +
            "border:1px dashed black;background-color:white;width:" +
            (editor.context.colwidth[mouseinfo.mouseresizecolnum] - 2) +
            'px;">&nbsp;</td>' +
            '<td><div style="font-size:small;color:white;background-color:gray;padding:4px;">' +
            editor.context.colwidth[mouseinfo.mouseresizecolnum] +
            "</div></td></tr></table>";
        SocialCalc.setStyles(
            sizedisplay.firstChild.lastChild.firstChild.childNodes[0],
            "filter:alpha(opacity=85);opacity:.85;"
        ); // so no warning msg with Firefox about filter

        editor.toplevel.appendChild(sizedisplay);

        // Event code from JavaScript, Flanagan, 5th Edition, pg. 422
        if (document.addEventListener) {
            // DOM Level 2 -- Firefox, et al
            document.addEventListener(
                "mousemove",
                SocialCalc.ProcessEditorColsizeMouseMove,
                true
            ); // capture everywhere
            document.addEventListener(
                "mouseup",
                SocialCalc.ProcessEditorColsizeMouseUp,
                true
            ); // capture everywhere
        } else if (editor.toplevel.attachEvent) {
            // IE 5+
            editor.toplevel.setCapture();
            editor.toplevel.attachEvent(
                "onmousemove",
                SocialCalc.ProcessEditorColsizeMouseMove
            );
            editor.toplevel.attachEvent(
                "onmouseup",
                SocialCalc.ProcessEditorColsizeMouseUp
            );
            editor.toplevel.attachEvent(
                "onlosecapture",
                SocialCalc.ProcessEditorColsizeMouseUp
            );
        }
        if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
        else event.cancelBubble = true; // IE 5+
        if (event.preventDefault) event.preventDefault(); // DOM Level 2
        else event.returnValue = false; // IE 5+

        return;
    };

    SocialCalc.ProcessEditorColsizeMouseMove = function (e) {
        var event = e || window.event;
        var mouseinfo = SocialCalc.EditorMouseInfo;
        var editor = mouseinfo.editor;
        if (!editor) return; // not us, ignore
        var viewport = SocialCalc.GetViewportInfo();
        var clientX = event.clientX + viewport.horizontalScroll;

        var newsize =
            editor.context.colwidth[mouseinfo.mouseresizecolnum] -
            0 +
            (clientX - mouseinfo.mousedownclientx);
        if (newsize < SocialCalc.Constants.defaultMinimumColWidth)
            newsize = SocialCalc.Constants.defaultMinimumColWidth;

        var sizedisplay = mouseinfo.mouseresizedisplay;
        //   sizedisplay.firstChild.lastChild.firstChild.childNodes[1].firstChild.innerHTML = newsize+"";
        //   sizedisplay.firstChild.lastChild.firstChild.childNodes[0].firstChild.style.width = (newsize-2)+"px";
        sizedisplay.innerHTML =
            '<table cellpadding="0" cellspacing="0"><tr><td style="height:100px;' +
            "border:1px dashed black;background-color:white;width:" +
            (newsize - 2) +
            'px;">&nbsp;</td>' +
            '<td><div style="font-size:small;color:white;background-color:gray;padding:4px;">' +
            newsize +
            "</div></td></tr></table>";
        SocialCalc.setStyles(
            sizedisplay.firstChild.lastChild.firstChild.childNodes[0],
            "filter:alpha(opacity=85);opacity:.85;"
        ); // so no warning msg with Firefox about filter

        if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
        else event.cancelBubble = true; // IE 5+
        if (event.preventDefault) event.preventDefault(); // DOM Level 2
        else event.returnValue = false; // IE 5+

        return;
    };

    SocialCalc.ProcessEditorColsizeMouseUp = function (e) {
        var event = e || window.event;
        var mouseinfo = SocialCalc.EditorMouseInfo;
        var editor = mouseinfo.editor;
        if (!editor) return; // not us, ignore
        element = mouseinfo.element;
        var viewport = SocialCalc.GetViewportInfo();
        var clientX = event.clientX + viewport.horizontalScroll;

        if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
        else event.cancelBubble = true; // IE 5+
        if (event.preventDefault) event.preventDefault(); // DOM Level 2
        else event.returnValue = false; // IE 5+

        if (document.removeEventListener) {
            // DOM Level 2
            document.removeEventListener(
                "mousemove",
                SocialCalc.ProcessEditorColsizeMouseMove,
                true
            );
            document.removeEventListener(
                "mouseup",
                SocialCalc.ProcessEditorColsizeMouseUp,
                true
            );
        } else if (editor.toplevel.detachEvent) {
            // IE
            editor.toplevel.detachEvent(
                "onlosecapture",
                SocialCalc.ProcessEditorColsizeMouseUp
            );
            editor.toplevel.detachEvent(
                "onmouseup",
                SocialCalc.ProcessEditorColsizeMouseUp
            );
            editor.toplevel.detachEvent(
                "onmousemove",
                SocialCalc.ProcessEditorColsizeMouseMove
            );
            editor.toplevel.releaseCapture();
        }

        var newsize =
            editor.context.colwidth[mouseinfo.mouseresizecolnum] -
            0 +
            (clientX - mouseinfo.mousedownclientx);
        if (newsize < SocialCalc.Constants.defaultMinimumColWidth)
            newsize = SocialCalc.Constants.defaultMinimumColWidth;

        editor.EditorScheduleSheetCommands(
            "set " + mouseinfo.mouseresizecol + " width " + newsize,
            true,
            false
        );

        if (editor.timeout) window.clearTimeout(editor.timeout);
        editor.timeout = window.setTimeout(SocialCalc.FinishColsize, 1); // wait - Firefox 2 has a bug otherwise with next mousedown

        return false;
    };

    SocialCalc.FinishColsize = function () {
        var mouseinfo = SocialCalc.EditorMouseInfo;
        var editor = mouseinfo.editor;
        if (!editor) return;

        editor.toplevel.removeChild(mouseinfo.mouseresizedisplay);
        mouseinfo.mouseresizedisplay = null;

        //   editor.FitToEditTable();
        //   editor.EditorRenderSheet();
        //   editor.SchedulePositionCalculations();

        mouseinfo.editor = null;

        return;
    };

    //
    // Handle auto-repeat of dragging the cursor into the borders of the sheet
    //

    SocialCalc.AutoRepeatInfo = {
        timer: null, // timer object for repeating
        mouseinfo: null, // result from SocialCalc.GridMousePosition
        repeatinterval: 1000, // milliseconds to wait between repeats
        editor: null, // editor object to use when it repeats
        repeatcallback: null, // used instead of default when repeating (e.g., for cellhandles)
        // called as: repeatcallback(newcoord, direction)
    };

    // Control auto-repeat. If mouseinfo==null, cancel.

    SocialCalc.SetDragAutoRepeat = function (editor, mouseinfo, callback) {
        var repeatinfo = SocialCalc.AutoRepeatInfo;
        var coord, direction;

        repeatinfo.repeatcallback = callback; // null in regular case

        if (!mouseinfo) {
            // cancel
            if (repeatinfo.timer) {
                // If was repeating, stop
                window.clearTimeout(repeatinfo.timer); // cancel timer
                repeatinfo.timer = null;
            }
            repeatinfo.mouseinfo = null;
            return; // done
        }

        repeatinfo.editor = editor;

        if (repeatinfo.mouseinfo) {
            // check for change while repeating
            if (mouseinfo.rowheader || mouseinfo.rowfooter) {
                if (mouseinfo.row != repeatinfo.mouseinfo.row) {
                    // changed row while dragging sidewards
                    coord = SocialCalc.crToCoord(editor.ecell.col, mouseinfo.row); // change to it
                    if (repeatinfo.repeatcallback) {
                        if (mouseinfo.row < repeatinfo.mouseinfo.row) {
                            direction = "left";
                        } else if (mouseinfo.row > repeatinfo.mouseinfo.row) {
                            direction = "right";
                        } else {
                            direction = "";
                        }
                        repeatinfo.repeatcallback(coord, direction);
                    } else {
                        editor.MoveECell(coord);
                        editor.MoveECell(coord);
                        editor.RangeExtend();
                        editor.EditorMouseRange(coord);
                    }
                }
            } else if (mouseinfo.colheader || mouseinfo.colfooter) {
                if (mouseinfo.col != repeatinfo.mouseinfo.col) {
                    // changed col while dragging vertically
                    coord = SocialCalc.crToCoord(mouseinfo.col, editor.ecell.row); // change to it
                    if (repeatinfo.repeatcallback) {
                        if (mouseinfo.row < repeatinfo.mouseinfo.row) {
                            direction = "left";
                        } else if (mouseinfo.row > repeatinfo.mouseinfo.row) {
                            direction = "right";
                        } else {
                            direction = "";
                        }
                        repeatinfo.repeatcallback(coord, direction);
                    } else {
                        editor.MoveECell(coord);
                        editor.RangeExtend();
                        editor.EditorMouseRange(coord);
                    }
                }
            }
        }

        repeatinfo.mouseinfo = mouseinfo;

        if (mouseinfo.distance < 5) repeatinfo.repeatinterval = 333;
        else if (mouseinfo.distance < 10) repeatinfo.repeatinterval = 250;
        else if (mouseinfo.distance < 25) repeatinfo.repeatinterval = 100;
        else if (mouseinfo.distance < 35) repeatinfo.repeatinterval = 75;
        else {
            // too far - stop repeating
            if (repeatinfo.timer) {
                // if repeating, cancel it
                window.clearTimeout(repeatinfo.timer); // cancel timer
                repeatinfo.timer = null;
            }
            return;
        }

        if (!repeatinfo.timer) {
            // start if not already running
            repeatinfo.timer = window.setTimeout(
                SocialCalc.DragAutoRepeat,
                repeatinfo.repeatinterval
            );
        }

        return;
    };

    //
    // DragAutoRepeat()
    //

    SocialCalc.DragAutoRepeat = function () {
        var repeatinfo = SocialCalc.AutoRepeatInfo;
        var mouseinfo = repeatinfo.mouseinfo;

        var direction, coord, cr;

        if (mouseinfo.rowheader) direction = "left";
        else if (mouseinfo.rowfooter) direction = "right";
        else if (mouseinfo.colheader) direction = "up";
        else if (mouseinfo.colfooter) direction = "down";

        if (repeatinfo.repeatcallback) {
            cr = SocialCalc.coordToCr(repeatinfo.editor.ecell.coord);
            if (direction == "left" && cr.col > 1) cr.col--;
            else if (direction == "right") cr.col++;
            else if (direction == "up" && cr.row > 1) cr.row--;
            else if (direction == "down") cr.row++;
            coord = SocialCalc.crToCoord(cr.col, cr.row);
            repeatinfo.repeatcallback(coord, direction);
        } else {
            coord = repeatinfo.editor.MoveECellWithKey("[a" + direction + "]shifted");
            if (coord) repeatinfo.editor.EditorMouseRange(coord);
        }

        repeatinfo.timer = window.setTimeout(
            SocialCalc.DragAutoRepeat,
            repeatinfo.repeatinterval
        );
    };

    //
    // Handling Clicking
    //

    SocialCalc.ProcessEditorDblClick = function (e) {
        var editor, result, coord, textarea, wval, range, sheetobj;

        var event = e || window.event;

        var viewport = SocialCalc.GetViewportInfo();
        var clientX = event.clientX + viewport.horizontalScroll;
        var clientY = event.clientY + viewport.verticalScroll;

        var mouseinfo = SocialCalc.EditorMouseInfo;
        var ele = event.target || event.srcElement; // source object is often within what we want
        var mobj;

        if (mouseinfo.ignore) return; // ignore this

        for (mobj = null; !mobj && ele; ele = ele.parentNode) {
            // go up tree looking for one of our elements
            mobj = SocialCalc.LookupElement(ele, mouseinfo.registeredElements);
        }
        if (!mobj) {
            mouseinfo.editor = null;
            return; // not one of our elements
        }

        editor = mobj.editor;

        result = SocialCalc.GridMousePosition(editor, clientX, clientY);
        if (!result || !result.coord) return; // not within cell area - ignore

        mouseinfo.editor = editor; // remember for later
        mouseinfo.element = ele;
        range = editor.range;

        sheetobj = editor.context.sheetobj;

        switch (editor.state) {
            case "start":
                SocialCalc.EditorOpenCellEdit(editor);
                break;

            case "input":
                break;

            default:
                break;
        }

        if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
        else event.cancelBubble = true; // IE 5+
        if (event.preventDefault) event.preventDefault(); // DOM Level 2
        else event.returnValue = false; // IE 5+

        return;
    };

    SocialCalc.EditorOpenCellEdit = function (editor) {
        var wval;

        if (!editor.ecell) return true; // no ecell
        if (!editor.inputBox) return true; // no input box, so no editing (happens on noEdit)
        if (SocialCalc.Callbacks && SocialCalc.Callbacks.IsCellEditable) {
            if (!SocialCalc.Callbacks.IsCellEditable(editor)) {
                return true;
            }
        }
        if (editor.inputBox.element.disabled) return true; // multi-line: ignore
        if (editor.inputBox.element.style.display == "none") {
            for (f in editor.StatusCallback) {
                editor.StatusCallback[f].func(
                    editor,
                    "editecell",
                    null,
                    editor.StatusCallback[f].params
                );
            }
            return true; // no inputBox display, so no editing
        }
        editor.inputBox.ShowInputBox(true);
        editor.inputBox.Focus();

        editor.state = "inputboxdirect";

        editor.inputBox.SetText("");
        editor.inputBox.DisplayCellContents();
        editor.inputBox.Select("end");
        wval = editor.workingvalues;
        wval.partialexpr = "";
        wval.ecoord = editor.ecell.coord;
        wval.erow = editor.ecell.row;
        wval.ecol = editor.ecell.col;
        wval.startsheet = wval.currentsheet;
        wval.startsheetid = wval.currentsheetid;

        return;
    };

    SocialCalc.EditorProcessKey = function (editor, ch, e) {
        var result, cell, cellobj, valueinfo, fch, coord, inputtext, f;

        var sheetobj = editor.context.sheetobj;
        var wval = editor.workingvalues;
        var range = editor.range;

        if (typeof ch != "string") ch = "";

        switch (editor.state) {
            case "start":
                if (e.shiftKey && ch.substr(0, 2) == "[a") {
                    ch = ch + "shifted";
                }
                if (ch == "[enter]") ch = "[adown]";
                if (ch == "[tab]") ch = e.shiftKey ? "[aleft]" : "[aright]";
                if (
                    ch.substr(0, 2) == "[a" ||
                    ch.substr(0, 3) == "[pg" ||
                    ch == "[home]"
                ) {
                    result = editor.MoveECellWithKey(ch);
                    return !result;
                }
                if (ch == "[del]" || ch == "[backspace]") {
                    if (!editor.noEdit) {
                        editor.EditorApplySetCommandsToRange("empty", "");
                    }
                    if (SocialCalc.Callbacks && SocialCalc.Callbacks.IsCellEditable) {
                        if (!SocialCalc.Callbacks.IsCellEditable(editor)) {
                            return true;
                        }
                    }

                    break;
                }
                if (ch == "[esc]") {
                    if (range.hasrange) {
                        editor.RangeRemove();
                        editor.MoveECell(range.anchorcoord);
                        for (f in editor.StatusCallback) {
                            editor.StatusCallback[f].func(
                                editor,
                                "specialkey",
                                ch,
                                editor.StatusCallback[f].params
                            );
                        }
                    }
                    return false;
                }

                if (ch == "[f2]") {
                    if (editor.noEdit) return true;
                    SocialCalc.EditorOpenCellEdit(editor);
                    return false;
                }

                if ((ch.length > 1 && ch.substr(0, 1) == "[") || ch.length == 0) {
                    // some control key
                    if (editor.ctrlkeyFunction && ch.length > 0) {
                        return editor.ctrlkeyFunction(editor, ch);
                    } else {
                        return true;
                    }
                }
                if (!editor.ecell) return true; // no ecell
                if (!editor.inputBox) return true; // no inputBox so no editing
                if (editor.inputBox.element.style.display == "none") {
                    for (f in editor.StatusCallback) {
                        editor.StatusCallback[f].func(
                            editor,
                            "editecell",
                            ch,
                            editor.StatusCallback[f].params
                        );
                    }
                    return true; // no inputBox display, so no editing
                }
                if (SocialCalc.Callbacks && SocialCalc.Callbacks.IsCellEditable) {
                    if (!SocialCalc.Callbacks.IsCellEditable(editor)) {
                        return true;
                    }
                }

                editor.inputBox.element.disabled = false; // make sure editable
                editor.state = "input";
                editor.inputBox.ShowInputBox(true);
                editor.inputBox.Focus();
                editor.inputBox.SetText(ch);
                editor.inputBox.Select("end");
                wval.partialexpr = "";
                wval.ecoord = editor.ecell.coord;
                wval.erow = editor.ecell.row;
                wval.ecol = editor.ecell.col;
                wval.startsheet = wval.currentsheet;
                wval.startsheetid = wval.currentsheetid;
                editor.RangeRemove();
                break;

            case "input":
                inputtext = editor.inputBox.GetText(); // should not get here if no inputBox
                if (editor.inputBox.skipOne) return false; // ignore a key already handled
                if (
                    ch == "[esc]" ||
                    ch == "[enter]" ||
                    ch == "[tab]" ||
                    (ch && ch.substr(0, 2) == "[a")
                ) {
                    if (
                        ("(+-*/,:!&<>=^".indexOf(inputtext.slice(-1)) >= 0 &&
                            inputtext.slice(0, 1) == "=") ||
                        inputtext == "="
                    ) {
                        wval.partialexpr = inputtext;
                    }
                    if (wval.partialexpr) {
                        // if in pointing operation
                        if (e.shiftKey && ch.substr(0, 2) == "[a") {
                            ch = ch + "shifted";
                        }
                        coord = editor.MoveECellWithKey(ch);
                        if (coord) {
                            if (range.hasrange) {
                                editor.inputBox.SetText(
                                    wval.partialexpr +
                                    SocialCalc.crToCoord(range.left, range.top) +
                                    ":" +
                                    SocialCalc.crToCoord(range.right, range.bottom)
                                );
                            } else {
                                editor.inputBox.SetText(wval.partialexpr + coord);
                            }
                            return false;
                        }
                    }
                    editor.inputBox.Blur();
                    editor.inputBox.ShowInputBox(false);
                    editor.state = "start";
                    editor.cellhandles.ShowCellHandles(true);
                    if (ch != "[esc]") {
                        editor.EditorSaveEdit();
                        if (editor.ecell.coord != wval.ecoord) {
                            editor.MoveECell(wval.ecoord);
                        }
                        if (ch == "[enter]") ch = "[adown]";
                        if (ch == "[tab]") ch = e.shiftKey ? "[aleft]" : "[aright]";
                        if (ch.substr(0, 2) == "[a") {
                            editor.MoveECellWithKey(ch);
                        }
                    } else {
                        editor.inputBox.DisplayCellContents();
                        editor.RangeRemove();
                        editor.MoveECell(wval.ecoord);
                    }
                    break;
                }
                if (wval.partialexpr && ch == "[backspace]") {
                    editor.inputBox.SetText(wval.partialexpr);
                    wval.partialexpr = "";
                    editor.RangeRemove();
                    editor.MoveECell(wval.ecoord);
                    editor.inputBox.ShowInputBox(true); // make sure it's moved back if necessary
                    return false;
                }
                if (ch == "[f2]") return false;
                if (range.hasrange) {
                    editor.RangeRemove();
                }
                editor.MoveECell(wval.ecoord);
                if (wval.partialexpr) {
                    editor.inputBox.ShowInputBox(true); // make sure it's moved back if necessary
                    wval.partialexpr = ""; // not pointing
                }
                return true;

            case "inputboxdirect":
                inputtext = editor.inputBox.GetText(); // should not get here if no inputBox
                if (ch == "[esc]" || ch == "[enter]" || ch == "[tab]") {
                    editor.inputBox.Blur();
                    editor.inputBox.ShowInputBox(false);
                    editor.state = "start";
                    editor.cellhandles.ShowCellHandles(true);
                    if (ch == "[esc]") {
                        editor.inputBox.DisplayCellContents();
                    } else {
                        editor.EditorSaveEdit();
                        if (editor.ecell.coord != wval.ecoord) {
                            editor.MoveECell(wval.ecoord);
                        }
                        if (ch == "[enter]") ch = "[adown]";
                        if (ch == "[tab]") ch = e.shiftKey ? "[aleft]" : "[aright]";
                        if (ch.substr(0, 2) == "[a") {
                            editor.MoveECellWithKey(ch);
                        }
                    }
                    break;
                }
                if (ch == "[f2]") return false;
                return true;

            case "skip-and-start":
                editor.state = "start";
                editor.cellhandles.ShowCellHandles(true);
                return false;

            default:
                return true;
        }

        return false;
    };

    SocialCalc.EditorAddToInput = function (editor, str, prefix) {
        var wval = editor.workingvalues;

        if (editor.noEdit) return;

        if (SocialCalc.Callbacks && SocialCalc.Callbacks.IsCellEditable) {
            if (!SocialCalc.Callbacks.IsCellEditable(editor)) {
                return true;
            }
        }

        switch (editor.state) {
            case "start":
                editor.state = "input";
                editor.inputBox.ShowInputBox(true);
                editor.inputBox.element.disabled = false; // make sure editable and overwrite old
                editor.inputBox.Focus();
                editor.inputBox.SetText((prefix || "") + str);
                editor.inputBox.Select("end");
                wval.partialexpr = "";
                wval.ecoord = editor.ecell.coord;
                wval.erow = editor.ecell.row;
                wval.ecol = editor.ecell.col;
                wval.startsheet = wval.currentsheet;
                wval.startsheetid = wval.currentsheetid;
                editor.RangeRemove();
                break;

            case "input":
            case "inputboxdirect":
                editor.inputBox.element.focus();
                if (wval.partialexpr) {
                    editor.inputBox.SetText(wval.partialexpr);
                    wval.partialexpr = "";
                    editor.RangeRemove();
                    editor.MoveECell(wval.ecoord);
                }
                editor.inputBox.SetText(editor.inputBox.GetText() + str);
                break;

            default:
                break;
        }
    };

    SocialCalc.EditorDisplayCellContents = function (editor) {
        if (editor.inputBox) editor.inputBox.DisplayCellContents();
    };
    var arr = [];
    SocialCalc.EditorSaveEdit = function (editor, text) {
        //console.log("editorSaveEdit");
        var result, cell, valueinfo, fch, type, value, oldvalue, cmdline;

        var sheetobj = editor.context.sheetobj;
        var wval = editor.workingvalues;

        if (SocialCalc.Callbacks && SocialCalc.Callbacks.IsCellEditable) {
            if (!SocialCalc.Callbacks.IsCellEditable(editor)) {
                return true;
            }
        }

        type = "text t";
        //changes for prompt

        value = typeof text == "string" ? text : editor.inputBox.GetText(); // either explicit or from input box

        oldvalue = SocialCalc.GetCellContents(sheetobj, wval.ecoord) + "";
        //console.log("old:"+oldvalue)
        //console.log("new:"+value)
        if (value == oldvalue) {
            // no change
            return;
        }
        if ("'" + value == oldvalue) {
            return;
        }

        fch = value.charAt(0);
        if (fch == "=" && value.indexOf("\n") == -1) {
            type = "formula";
            value = value.substring(1);
        } else if (fch == "'") {
            type = "text t";
            value = value.substring(1);
        } else if (value.length == 0) {
            type = "empty";
        } else {
            valueinfo = SocialCalc.DetermineValueType(value);
            if (valueinfo.type == "n" && value == valueinfo.value + "") {
                // see if don't need "constant"
                type = "value n";
            } else if (valueinfo.type.charAt(0) == "t") {
                type = "text " + valueinfo.type;
            } else if (valueinfo.type == "") {
                type = "text t";
            } else {
                type = "constant " + valueinfo.type + " " + valueinfo.value;
            }
        }

        if (type.charAt(0) == "t") {
            // text
            value = SocialCalc.encodeForSave(value); // newlines, :, and \ are escaped
        }

        // if startsheet different from currentsheet, switch to start sheet
        // for the save to take effect
        if (SocialCalc.WorkBook && wval.currentsheet != wval.startsheet) {
            var control = SocialCalc.GetCurrentWorkBookControl();
            var cmdstr = "activatesheet " + wval.startsheetid;
            control.ExecuteWorkBookControlCommand(
                { cmdtype: "wcmd", id: "0", cmdstr: cmdstr },
                false
            );
        }

        cmdline = "set " + wval.ecoord + " " + type + " " + value;
        editor.EditorScheduleSheetCommands(cmdline, true, false);

        return;
    };

    //
    // SocialCalc.EditorApplySetCommandsToRange(editor, cmd)
    //
    // Takes ecell or range and does a "set" command with cmd.
    //

    SocialCalc.EditorApplySetCommandsToRange = function (editor, cmd) {
        var cell, row, col, line, errortext;

        var sheetobj = editor.context.sheetobj;
        var ecell = editor.ecell;
        var range = editor.range;

        if (range.hasrange) {
            coord =
                SocialCalc.crToCoord(range.left, range.top) +
                ":" +
                SocialCalc.crToCoord(range.right, range.bottom);
            line = "set " + coord + " " + cmd;
            errortext = editor.EditorScheduleSheetCommands(line, true, false);
        } else {
            line = "set " + ecell.coord + " " + cmd;
            errortext = editor.EditorScheduleSheetCommands(line, true, false);
        }

        editor.DisplayCellContents();
    };

    SocialCalc.EditorProcessMouseWheel = function (
        event,
        delta,
        mousewheelinfo,
        wobj
    ) {
        if (wobj.functionobj.editor.busy) return; // ignore if busy

        if (delta > 0) {
            wobj.functionobj.editor.ScrollRelative(true, -1);
        }
        if (delta < 0) {
            wobj.functionobj.editor.ScrollRelative(true, +1);
        }
    };

    //
    // GridMousePosition(editor, clientX, clientY)
    //
    // Returns an object with row and col numbers and coord (spans handled for coords),
    // and rowheader/colheader true if in header (where coord will be undefined).
    // If in colheader, will return coltoresize if on appropriate place in col header.
    // Also, there is rowfooter (on right) and colfooter (on bottom).
    // In row/col header/footer, returns "distance" as pixels over the edge.
    //

    SocialCalc.GridMousePosition = function (editor, clientX, clientY) {
        var row, col, colpane;
        var result = {};

        for (row = 1; row < editor.rowpositions.length; row++) {
            if (!editor.rowheight[row]) continue; // not rendered yet -- may be above or below us
            if (editor.rowpositions[row] + editor.rowheight[row] > clientY) {
                break;
            }
        }
        for (col = 1; col < editor.colpositions.length; col++) {
            if (!editor.colwidth[col]) continue;
            if (editor.colpositions[col] + editor.colwidth[col] > clientX) {
                break;
            }
        }

        result.row = row;
        result.col = col;

        if (editor.headposition) {
            if (
                clientX < editor.headposition.left &&
                clientX >= editor.gridposition.left
            ) {
                result.rowheader = true;
                result.distance = editor.headposition.left - clientX;
                return result;
            } else if (
                clientY < editor.headposition.top &&
                clientY > editor.gridposition.top
            ) {
                // > because of sizing row
                result.colheader = true;
                result.distance = editor.headposition.top - clientY;
                result.coltoresize =
                    col -
                    (editor.colpositions[col] + editor.colwidth[col] / 2 > clientX
                        ? 1
                        : 0) || 1;
                for (colpane = 0; colpane < editor.context.colpanes.length; colpane++) {
                    if (
                        result.coltoresize >= editor.context.colpanes[colpane].first &&
                        result.coltoresize <= editor.context.colpanes[colpane].last
                    ) {
                        // visible column
                        return result;
                    }
                }
                delete result.coltoresize;
                return result;
            } else if (clientX >= editor.verticaltablecontrol.controlborder) {
                result.rowfooter = true;
                result.distance = clientX - editor.verticaltablecontrol.controlborder;
                return result;
            } else if (clientY >= editor.horizontaltablecontrol.controlborder) {
                result.colfooter = true;
                result.distance = clientY - editor.horizontaltablecontrol.controlborder;
                return result;
            } else if (clientX < editor.gridposition.left) {
                result.rowheader = true;
                result.distance = editor.headposition.left - clientX;
                return result;
            } else if (clientY <= editor.gridposition.top) {
                result.colheader = true;
                result.distance = editor.headposition.top - clientY;
                return result;
            } else {
                result.coord = SocialCalc.crToCoord(result.col, result.row);
                if (editor.context.cellskip[result.coord]) {
                    // handle skipped cells
                    result.coord = editor.context.cellskip[result.coord];
                }
                return result;
            }
        }

        return null;
    };

    //
    // GetEditorCellElement(editor, row, col)
    //
    // Returns an object with element, the table cell element in the DOM that corresponds to row and column,
    // as well as rowpane and colpane, the panes with the cell.
    // If no such element, then returns null;
    //

    SocialCalc.GetEditorCellElement = function (editor, row, col) {
        var rowpane, colpane, c, coord;
        var rowindex = 0;
        var colindex = 0;

        for (rowpane = 0; rowpane < editor.context.rowpanes.length; rowpane++) {
            if (
                row >= editor.context.rowpanes[rowpane].first &&
                row <= editor.context.rowpanes[rowpane].last
            ) {
                for (colpane = 0; colpane < editor.context.colpanes.length; colpane++) {
                    if (
                        col >= editor.context.colpanes[colpane].first &&
                        col <= editor.context.colpanes[colpane].last
                    ) {
                        rowindex += row - editor.context.rowpanes[rowpane].first + 2;
                        for (c = editor.context.colpanes[colpane].first; c <= col; c++) {
                            coord = editor.context.cellskip[SocialCalc.crToCoord(c, row)];
                            if (
                                !coord ||
                                !editor.context.CoordInPane(coord, rowpane, colpane)
                            )
                                // don't count col-spanned cells
                                colindex++;
                        }
                        return {
                            element:
                                editor.griddiv.firstChild.lastChild.childNodes[rowindex]
                                    .childNodes[colindex],
                            rowpane: rowpane,
                            colpane: colpane,
                        };
                    }
                    for (
                        c = editor.context.colpanes[colpane].first;
                        c <= editor.context.colpanes[colpane].last;
                        c++
                    ) {
                        coord = editor.context.cellskip[SocialCalc.crToCoord(c, row)];
                        if (!coord || !editor.context.CoordInPane(coord, rowpane, colpane))
                            // don't count col-spanned cells
                            colindex++;
                    }
                    colindex += 1;
                }
            }
            rowindex +=
                editor.context.rowpanes[rowpane].last -
                editor.context.rowpanes[rowpane].first +
                1 +
                1;
        }

        return null;
    };

    //
    // cellcoord = MoveECellWithKey(editor, ch)
    //
    // Processes an arrow key, etc., moving the edit cell.
    // If not a movement key, returns null.
    //

    SocialCalc.MoveECellWithKey = function (editor, ch) {
        var coord, row, col, cell;
        var shifted = false;

        if (!editor.ecell) {
            return null;
        }

        if (ch.slice(-7) == "shifted") {
            ch = ch.slice(0, -7);
            shifted = true;
        }

        row = editor.ecell.row;
        col = editor.ecell.col;
        cell = editor.context.sheetobj.cells[editor.ecell.coord];

        switch (ch) {
            case "[adown]":
                row += (cell && cell.rowspan) || 1;
                break;
            case "[aup]":
                row--;
                break;
            case "[pgdn]":
                row += editor.pageUpDnAmount - 1 + ((cell && cell.rowspan) || 1);
                break;
            case "[pgup]":
                row -= editor.pageUpDnAmount;
                break;
            case "[aright]":
                col += (cell && cell.colspan) || 1;
                break;
            case "[aleft]":
                col--;
                break;
            case "[home]":
                row = 1;
                col = 1;
                break;
            default:
                return null;
        }

        if (!editor.range.hasrange) {
            if (shifted) editor.RangeAnchor();
        }

        coord = editor.MoveECell(SocialCalc.crToCoord(col, row));

        if (editor.range.hasrange) {
            if (shifted) editor.RangeExtend();
            else editor.RangeRemove();
        }

        return coord;
    };

    //
    // cellcoord = MoveECell(editor, newecell)
    //
    // Takes a coordinate and returns the new edit cell coordinate (which may be
    // different if newecell is covered by a span).
    //

    SocialCalc.MoveECell = function (editor, newcell) {
        var cell, f;

        var highlights = editor.context.highlights;

        if (editor.ecell) {
            //changes for prompt
            if (editor.ecell.coord == newcell) return newcell;

            if (SocialCalc.Callbacks.broadcast) {
                SocialCalc.Callbacks.broadcast("ecell", {
                    original: editor.ecell.coord,
                    ecell: newcell,
                });
            }

            cell = SocialCalc.GetEditorCellElement(
                editor,
                editor.ecell.row,
                editor.ecell.col
            );
            delete highlights[editor.ecell.coord];
            if (
                editor.range2.hasrange &&
                editor.ecell.row >= editor.range2.top &&
                editor.ecell.row <= editor.range2.bottom &&
                editor.ecell.col >= editor.range2.left &&
                editor.ecell.col <= editor.range2.right
            ) {
                highlights[editor.ecell.coord] = "range2";
            }
            editor.UpdateCellCSS(cell, editor.ecell.row, editor.ecell.col);
            editor.SetECellHeaders(""); // set to regular col/rowname styles
            editor.cellhandles.ShowCellHandles(false);
        } else if (SocialCalc.Callbacks.broadcast) {
            SocialCalc.Callbacks.broadcast("ecell", { ecell: newcell });
        }
        newcell = editor.context.cellskip[newcell] || newcell;
        editor.ecell = SocialCalc.coordToCr(newcell);
        editor.ecell.coord = newcell;
        cell = SocialCalc.GetEditorCellElement(
            editor,
            editor.ecell.row,
            editor.ecell.col
        );
        highlights[newcell] = "cursor";

        for (f in editor.MoveECellCallback) {
            // let others know
            editor.MoveECellCallback[f](editor);
        }

        editor.UpdateCellCSS(cell, editor.ecell.row, editor.ecell.col);
        editor.SetECellHeaders("selected");

        for (f in editor.StatusCallback) {
            // let status line, etc., know
            editor.StatusCallback[f].func(
                editor,
                "moveecell",
                newcell,
                editor.StatusCallback[f].params
            );
        }

        if (editor.busy) {
            editor.ensureecell = true; // wait for when not busy
        } else {
            editor.ensureecell = false;
            editor.EnsureECellVisible();
        }

        return newcell;
    };

    SocialCalc.EnsureECellVisible = function (editor) {
        var vamount = 0;
        var hamount = 0;

        if (editor.ecell.row > editor.lastnonscrollingrow) {
            if (editor.ecell.row < editor.firstscrollingrow) {
                vamount = editor.ecell.row - editor.firstscrollingrow;
            } else if (editor.ecell.row > editor.lastvisiblerow) {
                vamount = editor.ecell.row - editor.lastvisiblerow;
            }
        }
        if (editor.ecell.col > editor.lastnonscrollingcol) {
            if (editor.ecell.col < editor.firstscrollingcol) {
                hamount = editor.ecell.col - editor.firstscrollingcol;
            } else if (editor.ecell.col > editor.lastvisiblecol) {
                hamount = editor.ecell.col - editor.lastvisiblecol;
            }
        }

        if (vamount != 0 || hamount != 0) {
            editor.ScrollRelativeBoth(vamount, hamount);
        } else {
            editor.cellhandles.ShowCellHandles(true);
        }
    };

    SocialCalc.ReplaceCell = function (editor, cell, row, col) {
        var newelement, a;
        if (!cell) return;
        newelement = editor.context.RenderCell(
            row,
            col,
            cell.rowpane,
            cell.colpane,
            true,
            null
        );
        if (newelement) {
            // Don't use a real element and replaceChild, which seems to have focus issues with IE, Firefox, and speed issues
            cell.element.innerHTML = newelement.innerHTML;
            cell.element.style.cssText = "";
            cell.element.className = newelement.className;
            for (a in newelement.style) {
                if (newelement.style[a] != "cssText")
                    cell.element.style[a] = newelement.style[a];
            }
        }
    };

    SocialCalc.UpdateCellCSS = function (editor, cell, row, col) {
        var newelement, a;
        if (!cell) return;
        newelement = editor.context.RenderCell(
            row,
            col,
            cell.rowpane,
            cell.colpane,
            true,
            null
        );
        if (newelement) {
            cell.element.style.cssText = "";
            cell.element.className = newelement.className;
            for (a in newelement.style) {
                if (newelement.style[a] != "cssText")
                    cell.element.style[a] = newelement.style[a];
            }
        }
    };

    SocialCalc.SetECellHeaders = function (editor, selected) {
        var ecell = editor.ecell;
        var context = editor.context;

        var rowpane, colpane, first, last;
        var rowindex = 0;
        var colindex = 0;
        var headercell;

        if (!ecell) return;

        for (rowpane = 0; rowpane < context.rowpanes.length; rowpane++) {
            first = context.rowpanes[rowpane].first;
            last = context.rowpanes[rowpane].last;
            if (ecell.row >= first && ecell.row <= last) {
                headercell =
                    editor.fullgrid.childNodes[1].childNodes[
                        2 + rowindex + ecell.row - first
                    ].childNodes[0];
                if (headercell) {
                    if (context.classnames)
                        headercell.className = context.classnames[selected + "rowname"];
                    if (context.explicitStyles)
                        headercell.style.cssText =
                            context.explicitStyles[selected + "rowname"];
                    headercell.style.verticalAlign = "top"; // to get around Safari making top of centered row number be
                    // considered top of row (and can't get <row> position in Safari)
                }
            }
            rowindex += last - first + 1 + 1;
        }

        for (colpane = 0; colpane < context.colpanes.length; colpane++) {
            first = context.colpanes[colpane].first;
            last = context.colpanes[colpane].last;
            if (ecell.col >= first && ecell.col <= last) {
                headercell =
                    editor.fullgrid.childNodes[1].childNodes[1].childNodes[
                    1 + colindex + ecell.col - first
                    ];
                if (headercell) {
                    if (context.classnames)
                        headercell.className = context.classnames[selected + "colname"];
                    if (context.explicitStyles)
                        headercell.style.cssText =
                            context.explicitStyles[selected + "colname"];
                }
            }
            colindex += last - first + 1 + 1;
        }
    };

    //
    // RangeAnchor(editor, ecoord)
    //
    // Sets the anchor of a range to ecoord (or ecell if missing).
    //

    SocialCalc.RangeAnchor = function (editor, ecoord) {
        if (editor.range.hasrange) {
            editor.RangeRemove();
        }

        editor.RangeExtend(ecoord);
    };

    //
    // RangeExtend(editor, ecoord)
    //
    // Sets the other corner of the range to ecoord or, if missing, ecell.
    //

    SocialCalc.RangeExtend = function (editor, ecoord) {
        var a, cell, cr, coord, row, col, f;

        var highlights = editor.context.highlights;
        var range = editor.range;
        var range2 = editor.range2;

        var ecell;
        if (ecoord) {
            ecell = SocialCalc.coordToCr(ecoord);
            ecell.coord = ecoord;
        } else ecell = editor.ecell;

        if (!ecell) return; // just in case
        if (SocialCalc.Constants.SCNoRanging) return;

        if (!range.hasrange) {
            // called without RangeAnchor...
            range.anchorcoord = ecell.coord;
            range.anchorrow = ecell.row;
            range.top = ecell.row;
            range.bottom = ecell.row;
            range.anchorcol = ecell.col;
            range.left = ecell.col;
            range.right = ecell.col;
            range.hasrange = true;
        }

        if (range.anchorrow < ecell.row) {
            range.top = range.anchorrow;
            range.bottom = ecell.row;
        } else {
            range.top = ecell.row;
            range.bottom = range.anchorrow;
        }
        if (range.anchorcol < ecell.col) {
            range.left = range.anchorcol;
            range.right = ecell.col;
        } else {
            range.left = ecell.col;
            range.right = range.anchorcol;
        }

        for (coord in highlights) {
            switch (highlights[coord]) {
                case "range":
                    highlights[coord] = "unrange";
                    break;
                case "range2":
                    highlights[coord] = "unrange2";
                    break;
            }
        }

        for (row = range.top; row <= range.bottom; row++) {
            for (col = range.left; col <= range.right; col++) {
                coord = SocialCalc.crToCoord(col, row);
                switch (highlights[coord]) {
                    case "unrange":
                        highlights[coord] = "range";
                        break;
                    case "cursor":
                        break;
                    case "unrange2":
                    default:
                        highlights[coord] = "newrange";
                        break;
                }
            }
        }

        for (row = range2.top; range2.hasrange && row <= range2.bottom; row++) {
            for (col = range2.left; col <= range2.right; col++) {
                coord = SocialCalc.crToCoord(col, row);
                switch (highlights[coord]) {
                    case "unrange2":
                        highlights[coord] = "range2";
                        break;
                    case "range":
                    case "newrange":
                    case "cursor":
                        break;
                    default:
                        highlights[coord] = "newrange2";
                        break;
                }
            }
        }

        for (coord in highlights) {
            switch (highlights[coord]) {
                case "unrange":
                    delete highlights[coord];
                    break;
                case "newrange":
                    highlights[coord] = "range";
                    break;
                case "newrange2":
                    highlights[coord] = "range2";
                    break;
                case "range":
                case "range2":
                case "cursor":
                    continue;
            }

            cr = SocialCalc.coordToCr(coord);
            cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
            editor.UpdateCellCSS(cell, cr.row, cr.col);
        }

        for (f in editor.RangeChangeCallback) {
            // let others know
            editor.RangeChangeCallback[f](editor);
        }

        // create range/coord string and do status callback

        coord = SocialCalc.crToCoord(editor.range.left, editor.range.top);
        if (
            editor.range.left != editor.range.right ||
            editor.range.top != editor.range.bottom
        ) {
            // more than one cell
            coord +=
                ":" + SocialCalc.crToCoord(editor.range.right, editor.range.bottom);
        }
        for (f in editor.StatusCallback) {
            editor.StatusCallback[f].func(
                editor,
                "rangechange",
                coord,
                editor.StatusCallback[f].params
            );
        }

        return;
    };

    //
    // RangeRemove(editor)
    //
    // Turns off the range.
    //

    SocialCalc.RangeRemove = function (editor) {
        var cell, cr, coord, row, col, f;

        var highlights = editor.context.highlights;
        var range = editor.range;
        var range2 = editor.range2;

        if (!range.hasrange && !range2.hasrange) return;

        for (row = range2.top; range2.hasrange && row <= range2.bottom; row++) {
            for (col = range2.left; col <= range2.right; col++) {
                coord = SocialCalc.crToCoord(col, row);
                switch (highlights[coord]) {
                    case "range":
                        highlights[coord] = "newrange2";
                        break;
                    case "range2":
                    case "cursor":
                        break;
                    default:
                        highlights[coord] = "newrange2";
                        break;
                }
            }
        }

        for (coord in highlights) {
            switch (highlights[coord]) {
                case "range":
                    delete highlights[coord];
                    break;
                case "newrange2":
                    highlights[coord] = "range2";
                    break;
                case "cursor":
                    continue;
            }
            cr = SocialCalc.coordToCr(coord);
            cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
            editor.UpdateCellCSS(cell, cr.row, cr.col);
        }

        range.hasrange = false;

        for (f in editor.RangeChangeCallback) {
            // let others know
            editor.RangeChangeCallback[f](editor);
        }

        for (f in editor.StatusCallback) {
            editor.StatusCallback[f].func(
                editor,
                "rangechange",
                "",
                editor.StatusCallback[f].params
            );
        }

        return;
    };

    //
    // Range2Remove(editor)
    //
    // Turns off the range2.
    //

    SocialCalc.Range2Remove = function (editor) {
        var cell, cr, coord, row, col, f;

        var highlights = editor.context.highlights;
        var range2 = editor.range2;

        if (!range2.hasrange) return;

        for (coord in highlights) {
            switch (highlights[coord]) {
                case "range2":
                    delete highlights[coord];
                    break;
                case "range":
                case "cursor":
                    continue;
            }
            cr = SocialCalc.coordToCr(coord);
            cell = SocialCalc.GetEditorCellElement(editor, cr.row, cr.col);
            editor.UpdateCellCSS(cell, cr.row, cr.col);
        }

        range2.hasrange = false;

        return;
    };

    //
    // FitToEditTable(editor)
    //
    // Figure out (through column width declarations and approximation of pixels per row)
    // how many rendered rows and columns you need to be at least a little larger than
    // the editor's editing area.
    //

    SocialCalc.FitToEditTable = function (editor) {
        var colnum, colname, colwidth, totalwidth, totalrows, rowpane, needed;

        var context = editor.context;
        var sheetobj = context.sheetobj;
        var sheetcolattribs = sheetobj.colattribs;

        // Calculate column width data

        totalwidth = context.showRCHeaders ? context.rownamewidth - 0 : 0;
        for (var colpane = 0; colpane < context.colpanes.length - 1; colpane++) {
            // Get width of all but last pane
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
                totalwidth += colwidth && colwidth - 0 > 0 ? colwidth - 0 : 10;
            }
        }

        for (colnum = context.colpanes[colpane].first; colnum <= 10000; colnum++) {
            //!!! max for safety, but makes that col max!!!
            colname = SocialCalc.rcColname(colnum);
            colwidth =
                sheetobj.colattribs.width[colname] ||
                sheetobj.attribs.defaultcolwidth ||
                SocialCalc.Constants.defaultColWidth;
            if (colwidth == "blank" || colwidth == "auto") colwidth = "";
            totalwidth += colwidth && colwidth - 0 > 0 ? colwidth - 0 : 10;
            if (totalwidth > editor.tablewidth) break;
        }

        context.colpanes[colpane].last = colnum;

        // Calculate row height data

        totalrows = context.showRCHeaders ? 1 : 0;
        for (rowpane = 0; rowpane < context.rowpanes.length - 1; rowpane++) {
            // count all panes but last one
            totalrows +=
                context.rowpanes[rowpane].last - context.rowpanes[rowpane].first + 1;
        }

        needed = editor.tableheight - totalrows * context.pixelsPerRow; // estimate amount needed

        context.rowpanes[rowpane].last =
            context.rowpanes[rowpane].first +
            Math.floor(needed / context.pixelsPerRow) +
            1;
    };

    //
    // CalculateEditorPositions(editor)
    //
    // Calculate the screen positions and other values of various editing elements
    // These values change and need to be recomputed when the pane first/last or cell contents change,
    // as well as new column widths, etc.
    //
    // Note: Only call this after the grid has been rendered! You may have to wait for a timeout...
    //

    SocialCalc.CalculateEditorPositions = function (editor) {
        var rowpane, colpane, i;

        editor.gridposition = SocialCalc.GetElementPosition(editor.griddiv);
        editor.headposition = SocialCalc.GetElementPosition(
            editor.griddiv.firstChild.lastChild.childNodes[2].childNodes[1]
        ); // 3rd tr 2nd td

        editor.rowpositions = [];
        for (rowpane = 0; rowpane < editor.context.rowpanes.length; rowpane++) {
            editor.CalculateRowPositions(
                rowpane,
                editor.rowpositions,
                editor.rowheight
            );
        }
        for (i = 0; i < editor.rowpositions.length; i++) {
            if (editor.rowpositions[i] > editor.gridposition.top + editor.tableheight)
                break;
        }
        editor.lastvisiblerow = i - 1;

        editor.colpositions = [];
        for (colpane = 0; colpane < editor.context.colpanes.length; colpane++) {
            editor.CalculateColPositions(
                colpane,
                editor.colpositions,
                editor.colwidth
            );
        }
        for (i = 0; i < editor.colpositions.length; i++) {
            if (editor.colpositions[i] > editor.gridposition.left + editor.tablewidth)
                break;
        }
        editor.lastvisiblecol = i - 1;

        editor.firstscrollingrow =
            editor.context.rowpanes[editor.context.rowpanes.length - 1].first;
        editor.firstscrollingrowtop =
            editor.rowpositions[editor.firstscrollingrow] || editor.headposition.top;
        editor.lastnonscrollingrow =
            editor.context.rowpanes.length - 1 > 0
                ? editor.context.rowpanes[editor.context.rowpanes.length - 2].last
                : 0;
        editor.firstscrollingcol =
            editor.context.colpanes[editor.context.colpanes.length - 1].first;
        editor.firstscrollingcolleft =
            editor.colpositions[editor.firstscrollingcol] || editor.headposition.left;
        editor.lastnonscrollingcol =
            editor.context.colpanes.length - 1 > 0
                ? editor.context.colpanes[editor.context.colpanes.length - 2].last
                : 0;

        // Now do the table controls

        editor.verticaltablecontrol.ComputeTableControlPositions();
        editor.horizontaltablecontrol.ComputeTableControlPositions();
    };

    //
    // ScheduleRender(editor)
    //
    // Do a series of timeouts to render the sheet, wait for background layout and
    // rendering by the browser, and then update editor visuals, sliders, etc.
    //

    SocialCalc.ScheduleRender = function (editor) {
        if (editor.timeout) window.clearTimeout(editor.timeout); // in case called more than once, just use latest

        SocialCalc.EditorSheetStatusCallback(null, "schedrender", null, editor);
        SocialCalc.EditorStepInfo.editor = editor;
        editor.timeout = window.setTimeout(SocialCalc.DoRenderStep, 1);
    };

    // DoRenderStep()
    //

    SocialCalc.DoRenderStep = function () {
        var editor = SocialCalc.EditorStepInfo.editor;

        editor.timeout = null;

        editor.EditorRenderSheet();

        SocialCalc.EditorSheetStatusCallback(null, "renderdone", null, editor);

        SocialCalc.EditorSheetStatusCallback(null, "schedposcalc", null, editor);

        editor.timeout = window.setTimeout(SocialCalc.DoPositionCalculations, 1);
    };

    //
    // SocialCalc.SchedulePositionCalculations(editor)
    //

    SocialCalc.SchedulePositionCalculations = function (editor) {
        SocialCalc.EditorStepInfo.editor = editor;

        SocialCalc.EditorSheetStatusCallback(null, "schedposcalc", null, editor);

        editor.timeout = window.setTimeout(SocialCalc.DoPositionCalculations, 1);
    };

    // DoPositionCalculations(editor)
    //
    // Update editor visuals, sliders, etc.
    //
    // Note: Only call this after the DOM objects have been modified and rendered!
    //

    SocialCalc.DoPositionCalculations = function () {
        var editor = SocialCalc.EditorStepInfo.editor;

        editor.timeout = null;

        var ok = false;
        try {
            editor.CalculateEditorPositions();
            ok = true;
        } catch (e) { }

        if (!ok) {
            if (typeof $ != "undefined") {
                $(window).trigger("resize");
                setTimeout(SocialCalc.DoPositionCalculations, 400);
            }
            return; /* Workaround IE6 partial-initialized-DOM bug */
        }

        editor.verticaltablecontrol.PositionTableControlElements();
        editor.horizontaltablecontrol.PositionTableControlElements();

        SocialCalc.EditorSheetStatusCallback(null, "doneposcalc", null, editor);

        if (editor.ensureecell && editor.ecell && !editor.deferredCommands.length) {
            // don't do if deferred cmd to execute
            editor.ensureecell = false;
            editor.EnsureECellVisible(); // this could cause another redisplay
        }

        editor.cellhandles.ShowCellHandles(true);

        //!!! Need to now check to see if this positioned controls out of the editing area
        //!!! (such as when there is a large wrapped cell and it pushes the pane boundary too far down).

        if (SocialCalc.Callbacks.broadcast)
            SocialCalc.Callbacks.broadcast("ask.ecell");
    };

    SocialCalc.CalculateRowPositions = function (
        editor,
        panenum,
        positions,
        sizes
    ) {
        var toprow, rowpane, rownum, offset, trowobj, cellposition;

        var context = editor.context;
        var sheetobj = context.sheetobj;

        var tbodyobj;

        if (!context.showRCHeaders) throw "Needs showRCHeaders=true";

        tbodyobj = editor.fullgrid.lastChild;

        // Calculate start of this pane as row in this table:

        toprow = 2;
        for (rowpane = 0; rowpane < panenum; rowpane++) {
            toprow +=
                context.rowpanes[rowpane].last - context.rowpanes[rowpane].first + 2; // skip pane and spacing row
        }

        offset = 0;
        for (
            rownum = context.rowpanes[rowpane].first;
            rownum <= context.rowpanes[rowpane].last;
            rownum++
        ) {
            trowobj = tbodyobj.childNodes[toprow + offset];
            offset++;
            cellposition = SocialCalc.GetElementPosition(trowobj.firstChild);

            // Safari has problem: If a cell in the row is high, cell 1 is centered and it returns top of centered part
            // but if you get position of row element, it always returns the same value (not the row's)
            // So we require row number to be vertical aligned to top

            if (!positions[rownum]) {
                positions[rownum] = cellposition.top; // first one takes precedence
                sizes[rownum] = trowobj.firstChild.offsetHeight;
            }
        }

        return;
    };

    SocialCalc.CalculateColPositions = function (
        editor,
        panenum,
        positions,
        sizes
    ) {
        var leftcol, colpane, colnum, offset, trowobj, cellposition;

        var context = editor.context;
        var sheetobj = context.sheetobj;

        var tbodyobj;

        if (!context.showRCHeaders) throw "Needs showRCHeaders=true";

        tbodyobj = editor.fullgrid.lastChild;

        // Calculate start of this pane as column in this table:

        leftcol = 1;
        for (colpane = 0; colpane < panenum; colpane++) {
            leftcol +=
                context.colpanes[colpane].last - context.colpanes[colpane].first + 2; // skip pane and spacing col
        }

        trowobj = tbodyobj.childNodes[1]; // get heading row, which has all columns
        offset = 0;
        for (
            colnum = context.colpanes[colpane].first;
            colnum <= context.colpanes[colpane].last;
            colnum++
        ) {
            cellposition = SocialCalc.GetElementPosition(
                trowobj.childNodes[leftcol + offset]
            );
            if (!positions[colnum]) {
                positions[colnum] = cellposition.left; // first one takes precedence
                if (trowobj.childNodes[leftcol + offset]) {
                    sizes[colnum] = trowobj.childNodes[leftcol + offset].offsetWidth;
                }
            }
            offset++;
        }

        return;
    };

    // ScrollRelative(editor, vertical, amount)
    //
    // If vertical true, scrolls up(-)/down(+), else left(-)/right(+)

    SocialCalc.ScrollRelative = function (editor, vertical, amount) {
        if (vertical) {
            editor.ScrollRelativeBoth(amount, 0);
        } else {
            editor.ScrollRelativeBoth(0, amount);
        }
        return;
    };

    // ScrollRelativeBoth(editor, vamount, hamount)
    //
    // Does both with one render

    SocialCalc.ScrollRelativeBoth = function (editor, vamount, hamount) {
        var context = editor.context;

        var vplen = context.rowpanes.length;
        var vlimit = vplen > 1 ? context.rowpanes[vplen - 2].last + 1 : 1; // don't scroll past here
        if (context.rowpanes[vplen - 1].first + vamount < vlimit) {
            // limit amount
            vamount = -context.rowpanes[vplen - 1].first + vlimit;
        }

        var hplen = context.colpanes.length;
        var hlimit = hplen > 1 ? context.colpanes[hplen - 2].last + 1 : 1; // don't scroll past here

        if (context.colpanes[hplen - 1].first + hamount < hlimit) {
            // limit amount
            hamount = -context.colpanes[hplen - 1].first + hlimit;
        }

        if (
            SocialCalc.IsScrollPossible &&
            !SocialCalc.IsScrollPossible(
                editor.context.sheetobj.attribs.lastrow,
                editor.context.sheetobj.attribs.lastcol,
                context.rowpanes[vplen - 1].first,
                context.colpanes[hplen - 1].first,
                vamount,
                hamount
            )
        ) {
            return;
        }

        // Fast micro-DOM update for 1-4 row vertical scrolls (smooth touch & momentum)
        if (hamount == 0 && Math.abs(vamount) >= 1 && Math.abs(vamount) <= 4) {
            var stepDir = vamount > 0 ? 1 : -1;
            var steps = Math.abs(vamount);
            for (var s = 0; s < steps; s++) {
                if (stepDir > 0) {
                    editor.ScrollTableUpOneRow();
                } else {
                    editor.ScrollTableDownOneRow();
                }
            }
            if (editor.ecell) editor.SetECellHeaders("selected");
            editor.SchedulePositionCalculations();
            return;
        }

        // Do a gross move and render for large jumps or horizontal scrolls
        if (vamount != 0 || hamount != 0) {
            context.rowpanes[vplen - 1].first += vamount;
            context.rowpanes[vplen - 1].last += vamount;
            context.colpanes[hplen - 1].first += hamount;
            context.colpanes[hplen - 1].last += hamount;
            editor.FitToEditTable();
            editor.ScheduleRender();
        }
    };

    // PageRelative(editor, vertical, direction)
    //
    // If vertical true, pages up(direction is -)/down(+), else left(-)/right(+)

    SocialCalc.PageRelative = function (editor, vertical, direction) {
        var context = editor.context;
        var panes = vertical ? "rowpanes" : "colpanes";
        var lastpane = context[panes][context[panes].length - 1];
        var lastvisible = vertical ? "lastvisiblerow" : "lastvisiblecol";
        var sizearray = vertical ? editor.rowheight : editor.colwidth;
        var defaultsize = vertical
            ? SocialCalc.Constants.defaultAssumedRowHeight
            : SocialCalc.Constants.defaultColWidth;
        var size, newfirst, totalsize, current;

        if (direction > 0) {
            // down/right
            newfirst = editor[lastvisible];
            if (newfirst == lastpane.first) newfirst += 1; // move at least one
        } else {
            if (vertical) {
                // calculate amount to scroll
                totalsize =
                    editor.tableheight -
                    (editor.firstscrollingrowtop - editor.gridposition.top);
            } else {
                totalsize =
                    editor.tablewidth -
                    (editor.firstscrollingcolleft - editor.gridposition.left);
            }
            totalsize -=
                sizearray[editor[lastvisible]] > 0
                    ? sizearray[editor[lastvisible]]
                    : defaultsize;

            for (newfirst = lastpane.first - 1; newfirst > 0; newfirst--) {
                size = sizearray[newfirst] > 0 ? sizearray[newfirst] : defaultsize;
                if (totalsize < size) break;
                totalsize -= size;
            }

            current = lastpane.first;
            if (newfirst >= current) newfirst = current - 1; // move at least 1
            if (newfirst < 1) newfirst = 1;
        }

        lastpane.first = newfirst;
        lastpane.last = newfirst + 1;
        editor.LimitLastPanes();
        editor.FitToEditTable();
        editor.ScheduleRender();
    };

    // LimitLastPanes(editor)
    //
    // Makes sure that the "first" of the last panes isn't before the last of the previous pane
    //

    SocialCalc.LimitLastPanes = function (editor) {
        var context = editor.context;
        var plen;

        plen = context.rowpanes.length;
        if (
            plen > 1 &&
            context.rowpanes[plen - 1].first <= context.rowpanes[plen - 2].last
        )
            context.rowpanes[plen - 1].first = context.rowpanes[plen - 2].last + 1;

        plen = context.colpanes.length;
        if (
            plen > 1 &&
            context.colpanes[plen - 1].first <= context.colpanes[plen - 2].last
        )
            context.colpanes[plen - 1].first = context.colpanes[plen - 2].last + 1;
    };

    SocialCalc.ScrollTableUpOneRow = function (editor) {
        var toprow,
            rowpane,
            rownum,
            colnum,
            colpane,
            cell,
            oldrownum,
            maxspan,
            newbottomrow,
            newrow,
            oldchild,
            bottomrownum;
        var rowneedsrefresh = {};

        var context = editor.context;
        var sheetobj = context.sheetobj;
        var tableobj = editor.fullgrid;

        var tbodyobj = tableobj.lastChild;
        if (!tbodyobj || !tbodyobj.childNodes) return editor.fullgrid;

        toprow = context.showRCHeaders ? 2 : 1;
        for (rowpane = 0; rowpane < context.rowpanes.length - 1; rowpane++) {
            toprow +=
                context.rowpanes[rowpane].last - context.rowpanes[rowpane].first + 2; // skip pane and spacing row
        }

        if (toprow >= tbodyobj.childNodes.length) return editor.fullgrid;
        tbodyobj.removeChild(tbodyobj.childNodes[toprow]);

        context.rowpanes[rowpane].first++;
        context.rowpanes[rowpane].last++;
        editor.FitToEditTable();
        context.CalculateColWidthData();

        newbottomrow = context.RenderRow(context.rowpanes[rowpane].last, rowpane);
        if (newbottomrow) {
            tbodyobj.appendChild(newbottomrow);
        }

        // If scrolled off a row with starting rowspans OR continuation spans, refresh rows for largest span
        var maxrowspan = 1;
        oldrownum = context.rowpanes[rowpane].first - 1;

        for (colpane = 0; colpane < context.colpanes.length; colpane++) {
            for (
                colnum = context.colpanes[colpane].first;
                colnum <= context.colpanes[colpane].last;
                colnum++
            ) {
                var coord = SocialCalc.crToCoord(colnum, oldrownum);
                if (context.cellskip && context.cellskip[coord]) {
                    // Cell was covered by a span starting above oldrownum
                    var originCoord = context.cellskip[coord];
                    var originCell = sheetobj.cells[originCoord];
                    var originCR = context.coordToCR ? context.coordToCR[originCoord] : null;
                    if (originCell && originCR) {
                        var remainingSpan = (originCR.row - 0 + originCell.rowspan) - oldrownum;
                        if (remainingSpan > maxrowspan) maxrowspan = remainingSpan;
                    }
                    continue;
                }
                cell = sheetobj.cells[coord];
                if (cell && cell.rowspan > maxrowspan) maxrowspan = cell.rowspan;
            }
        }

        if (maxrowspan > 1) {
            for (rownum = 1; rownum < maxrowspan; rownum++) {
                var targetRow = rownum + oldrownum;
                if (targetRow > context.rowpanes[rowpane].last) break;
                newrow = context.RenderRow(targetRow, rowpane);
                oldchild = tbodyobj.childNodes[toprow + rownum - 1];
                if (oldchild && newrow) {
                    tbodyobj.replaceChild(newrow, oldchild);
                }
            }
        }

        // If added bottom row includes rowspans from above, update the size of those to include new row
        bottomrownum = context.rowpanes[rowpane].last;

        for (colpane = 0; colpane < context.colpanes.length; colpane++) {
            for (
                colnum = context.colpanes[colpane].first;
                colnum <= context.colpanes[colpane].last;
                colnum++
            ) {
                if (!context.cellskip) continue;
                coord = context.cellskip[SocialCalc.crToCoord(colnum, bottomrownum)];
                if (!coord) continue;
                rownum = context.coordToCR ? (context.coordToCR[coord].row - 0) : null;
                if (
                    rownum === null ||
                    rownum == context.rowpanes[rowpane].last ||
                    rownum < context.rowpanes[rowpane].first
                ) {
                    continue;
                }
                cell = sheetobj.cells[coord];
                if (cell && cell.rowspan > 1) rowneedsrefresh[rownum] = true;
            }
        }

        for (rownum in rowneedsrefresh) {
            newrow = context.RenderRow(rownum - 0, rowpane);
            oldchild =
                tbodyobj.childNodes[
                toprow + (rownum - context.rowpanes[rowpane].first)
                ];
            if (oldchild && newrow) {
                tbodyobj.replaceChild(newrow, oldchild);
            }
        }

        return tableobj;
    };

    SocialCalc.ScrollTableDownOneRow = function (editor) {
        var toprow,
            rowpane,
            rownum,
            colnum,
            colpane,
            cell,
            newrownum,
            maxspan,
            newbottomrow,
            newrow,
            oldchild,
            bottomrownum,
            maxrowspan,
            coord;
        var rowneedsrefresh = {};

        var context = editor.context;
        var sheetobj = context.sheetobj;
        var tableobj = editor.fullgrid;

        var tbodyobj = tableobj.lastChild;
        if (!tbodyobj || !tbodyobj.childNodes) return editor.fullgrid;

        toprow = context.showRCHeaders ? 2 : 1;
        for (rowpane = 0; rowpane < context.rowpanes.length - 1; rowpane++) {
            toprow +=
                context.rowpanes[rowpane].last - context.rowpanes[rowpane].first + 2; // skip pane and spacing row
        }

        var removeIdx = toprow + (context.rowpanes[rowpane].last - context.rowpanes[rowpane].first);
        if (removeIdx < tbodyobj.childNodes.length) {
            tbodyobj.removeChild(tbodyobj.childNodes[removeIdx]);
        }

        context.rowpanes[rowpane].first--;
        context.rowpanes[rowpane].last--;
        editor.FitToEditTable();
        context.CalculateColWidthData();

        newrow = context.RenderRow(context.rowpanes[rowpane].first, rowpane);
        if (toprow < tbodyobj.childNodes.length) {
            tbodyobj.insertBefore(newrow, tbodyobj.childNodes[toprow]);
        } else {
            tbodyobj.appendChild(newrow);
        }

        // If inserted a row with starting rowspans or continuation spans, refresh rows for largest span
        maxrowspan = 1;
        newrownum = context.rowpanes[rowpane].first;

        for (colpane = 0; colpane < context.colpanes.length; colpane++) {
            for (
                colnum = context.colpanes[colpane].first;
                colnum <= context.colpanes[colpane].last;
                colnum++
            ) {
                coord = SocialCalc.crToCoord(colnum, newrownum);
                if (context.cellskip && context.cellskip[coord]) {
                    var originCoord = context.cellskip[coord];
                    var originCell = sheetobj.cells[originCoord];
                    var originCR = context.coordToCR ? context.coordToCR[originCoord] : null;
                    if (originCell && originCR) {
                        var remaining = (originCR.row - 0 + originCell.rowspan) - newrownum;
                        if (remaining > maxrowspan) maxrowspan = remaining;
                    }
                    continue;
                }
                cell = sheetobj.cells[coord];
                if (cell && cell.rowspan > maxrowspan) maxrowspan = cell.rowspan;
            }
        }

        if (maxrowspan > 1) {
            for (rownum = 1; rownum < maxrowspan; rownum++) {
                var targetRow = rownum + newrownum;
                if (targetRow > context.rowpanes[rowpane].last) break;
                newrow = context.RenderRow(targetRow, rowpane);
                oldchild = tbodyobj.childNodes[toprow + rownum];
                if (oldchild && newrow) {
                    tbodyobj.replaceChild(newrow, oldchild);
                }
            }
        }

        // If last row now includes rowspans or rowspans from above, update the size of those to remove deleted row
        bottomrownum = context.rowpanes[rowpane].last;

        for (colpane = 0; colpane < context.colpanes.length; colpane++) {
            for (
                colnum = context.colpanes[colpane].first;
                colnum <= context.colpanes[colpane].last;
                colnum++
            ) {
                coord = SocialCalc.crToCoord(colnum, bottomrownum);
                cell = sheetobj.cells[coord];
                if (cell && cell.rowspan > 1) {
                    rowneedsrefresh[bottomrownum] = true;
                    continue;
                }
                if (!context.cellskip) continue;
                coord = context.cellskip[SocialCalc.crToCoord(colnum, bottomrownum)];
                if (!coord) continue;
                rownum = context.coordToCR ? (context.coordToCR[coord].row - 0) : null;
                if (
                    rownum === null ||
                    rownum == bottomrownum ||
                    rownum < context.rowpanes[rowpane].first
                ) {
                    continue;
                }
                cell = sheetobj.cells[coord];
                if (cell && cell.rowspan > 1) rowneedsrefresh[rownum] = true;
            }
        }

        for (rownum in rowneedsrefresh) {
            newrow = context.RenderRow(rownum - 0, rowpane);
            oldchild =
                tbodyobj.childNodes[
                toprow + (rownum - context.rowpanes[rowpane].first)
                ];
            if (oldchild && newrow) {
                tbodyobj.replaceChild(newrow, oldchild);
            }
        }

        return tableobj;
    };

    // *************************************
    //
    // InputBox class:
    //
    // This class deals with the text box for editing cell contents.
    // It mainly controls a user input box for typed content and is used to interact with
    // the keyboard code, etc.
    //
    // You can use this inside a formula bar control of some sort.
    // You create this after you have created a table editor object (but not necessarily
    // done the CreateTableEditor method).
    //
    // When the user starts typing text, or double-clicks on a cell, this object
    // comes into play.
    //
    // The element given when this is first constructed should be an input HTMLElement or
    // something that acts like one. Check the code here to see what is done to it.
    //
    // *************************************

    SocialCalc.InputBox = function (element, editor) {
        if (!element) return; // invoked without enough data to work

        this.element = element; // the input element associated with this InputBox
        this.editor = editor; // the TableEditor this belongs to
        this.inputEcho = null;

        editor.inputBox = this;

        element.onmousedown = SocialCalc.InputBoxOnMouseDown;

        editor.MoveECellCallback.formulabar = function (e) {
            if (e.state != "start") {
                return;
            } // if not in normal keyboard mode don't replace formula bar
            editor.inputBox.DisplayCellContents(e.ecell.coord);
        };
    };

    // Methods:

    SocialCalc.InputBox.prototype.DisplayCellContents = function (coord) {
        SocialCalc.InputBoxDisplayCellContents(this, coord);
    };
    SocialCalc.InputBox.prototype.ShowInputBox = function (show) {
        this.editor.inputEcho.ShowInputEcho(show);
    };
    SocialCalc.InputBox.prototype.GetText = function () {
        return this.element.value;
    };
    SocialCalc.InputBox.prototype.SetText = function (newtext) {
        if (!this.element) return;
        this.element.value = newtext;

        if (!SocialCalc.Constants.SCNoInputEcho) {
            this.editor.inputEcho.SetText(newtext + "_");
        }
    };
    SocialCalc.InputBox.prototype.Focus = function () {
        SocialCalc.InputBoxFocus(this);
    };
    SocialCalc.InputBox.prototype.Blur = function () {
        return this.element.blur();
    };
    SocialCalc.InputBox.prototype.Select = function (t) {
        if (!this.element) return;
        switch (t) {
            case "end":
                if (document.selection && document.selection.createRange) {
                    /* IE 4+ - Safer than setting .selectionEnd as it also works for Textareas. */
                    var range = document.selection.createRange().duplicate();
                    range.moveToElementText(this.element);
                    range.collapse(false);
                    range.select();
                } else if (this.element.selectionStart != undefined) {
                    this.element.selectionStart = this.element.value.length;
                    this.element.selectionEnd = this.element.value.length;
                }
                break;
        }
    };

    // Functions:

    //
    // SocialCalc.InputBoxDisplayCellContents(inputbox, coord)
    //
    // Sets input box to the contents of the specified cell (or ecell if null).
    //
    var CoordForColorChange;
    var editCoord;
    SocialCalc.InputBoxDisplayCellContents = function (inputbox, coord) {
        // inputbox.element.disabled = true;
        // return;
        var scc = SocialCalc.Constants;
        var cell, position;

        if (!inputbox) return;

        if (
            (SocialCalc.isCellEditModalEnabled && SocialCalc.isCellEditModalEnabled()) ||
            (typeof window !== "undefined" && window.SocialCalc && window.SocialCalc.isCellEditModalEnabled && window.SocialCalc.isCellEditModalEnabled())
        ) {
            inputbox.element.disabled = true;
            inputbox.element.style.display = "none";
            var control = SocialCalc.GetCurrentWorkBookControl ? SocialCalc.GetCurrentWorkBookControl() : null;
            if (control && control.workbook && control.workbook.spreadsheet && control.workbook.spreadsheet.formulabarDiv) {
                var ele = document.getElementById(control.workbook.spreadsheet.formulabarDiv.id);
                if (ele && ele.parentNode) {
                    ele.parentNode.removeChild(ele);
                }
            }
            return;
        }

        //changes for prompt
        if (!coord) {
            coord = inputbox.editor.ecell.coord;
        }
        var text = SocialCalc.GetCellContents(
            inputbox.editor.context.sheetobj,
            coord
        );
        if (text.indexOf("\n") != -1) {
            //text = scc.s_inputboxdisplaymultilinetext;
            text = scc.s_inputboxdisplaynoteditable;
            inputbox.element.disabled = true;
            SocialCalc.ToggleInputLineButtons(false);
        } else if (!SocialCalc.Callbacks.IsCellEditable(inputbox.editor)) {
            text = scc.s_inputboxdisplaynoteditable;
            SocialCalc.ToggleInputLineButtons(false);
            inputbox.element.disabled = true;
            inputbox.element.style.display = "none";
        } else {
            CoordForColorChange = coord;
            editCoord = coord;

            //changes for prompt

            var control = SocialCalc.GetCurrentWorkBookControl();
            var spreadsheet = control.workbook.spreadsheet;
            cell = SocialCalc.GetEditorCellElement(
                inputbox.editor,
                inputbox.editor.ecell.row,
                inputbox.editor.ecell.col
            );
            var left = "100px";
            var top = "100px";
            var width = 0;
            var height = 0;
            if (cell) {
                position = SocialCalc.GetElementPosition(cell.element);
                var spreadPos = SocialCalc.GetElementPosition(spreadsheet.spreadsheetDiv);
                left = (position.left - spreadPos.left) + "px";
                top = (position.top - spreadPos.top) + "px";
                width = cell.element.offsetWidth;
                height = cell.element.offsetHeight;
            }
            if (!cell || width == 0) {
                //scrolled off screen
                SocialCalc.ToggleInputLineButtons(false);
                inputbox.element.disabled = true;
                inputbox.element.style.display = "none";
                // do nothing
                return;
            }
            var ele = document.getElementById(spreadsheet.formulabarDiv.id);
            if (ele) {
                spreadsheet.spreadsheetDiv.removeChild(spreadsheet.formulabarDiv);
            }
            spreadsheet.formulabarDiv.style.left = left;
            spreadsheet.formulabarDiv.style.top = top;
            //spreadsheet.formulabarDiv.style.width = "30px";
            //spreadsheet.formulabarDiv.style.fontSize = "10px";
            spreadsheet.formulabarDiv.style.zIndex = 100;
            spreadsheet.formulabarDiv.style.position = "absolute";
            var input = spreadsheet.formulabarDiv.firstChild;
            //changes for prompt

            input.style.fontSize = "100%";
            input.style.backgroundColor = "white";
            input.style.color = "black";

            input.style.borderBottomColor = "#306eff";
            input.style.borderBottomLeftRadius = "3px";
            input.style.borderBottomRightRadius = "3px";
            input.style.borderBottomStyle = "solid";
            input.style.borderBottomWidth = "2px";
            input.style.borderLeftColor = "#306eff";
            input.style.borderLeftStyle = "solid";
            input.style.borderLeftWidth = "2px";
            input.style.borderRightColor = "#306eff";
            input.style.borderRightStyle = "solid";
            input.style.borderRightWidth = "2px";
            input.style.borderTopColor = "#306eff";
            input.style.borderTopLeftRadius = "3px";
            input.style.borderTopRightRadius = "3px";
            input.style.borderTopStyle = "solid";
            input.style.borderTopWidth = "2px";

            //console.log("cell width ="+width)
            //changes for prompt

            input.style.width = width + "px";
            input.style.height = height + "px";
            spreadsheet.spreadsheetDiv.appendChild(spreadsheet.formulabarDiv);

            inputbox.element.disabled = false;
            inputbox.element.style.display = "inline";
            SocialCalc.ToggleInputLineButtons(true);
        }
        if (scc.SCNoQuoteInInputBox && text.substring(0, 1) == "'") {
            text = text.substring(1);
        }
        inputbox.SetText(text);
        // autoSave(selectedFile);
    };

    //
    // SocialCalc.InputBoxFocus(inputbox)
    //
    // Call this to have the input box get the focus and respond to keystrokes
    // but still pass them off to SocialCalc.ProcessKey.
    //

    SocialCalc.InputBoxFocus = function (inputbox) {
        if (!inputbox) return;
        inputbox.element.focus();
        var editor = inputbox.editor;
        editor.state = "input";
        var wval = editor.workingvalues;
        wval.partialexpr = "";
        wval.ecoord = editor.ecell.coord;
        wval.erow = editor.ecell.row;
        wval.ecol = editor.ecell.col;
    };

    //
    // SocialCalc.InputBoxOnMouseDown(e)
    //
    // This is called when the input box gets the focus. It then responds to keystrokes
    // and pass them off to SocialCalc.ProcessKey, but in a different editing state.
    //

    SocialCalc.InputBoxOnMouseDown = function (e) {
        var editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
        if (!editor) return true; // we're not handling it -- let browser do default
        var wval = editor.workingvalues;

        switch (editor.state) {
            case "start":
                editor.state = "inputboxdirect";
                wval.partialexpr = "";
                wval.ecoord = editor.ecell.coord;
                wval.erow = editor.ecell.row;
                wval.ecol = editor.ecell.col;
                editor.inputEcho.ShowInputEcho(true);
                break;

            case "input":
                wval.partialexpr = ""; // make sure not pointing
                editor.MoveECell(wval.ecoord);
                editor.state = "inputboxdirect";
                SocialCalc.KeyboardFocus(); // may have come here from outside of grid
                break;

            case "inputboxdirect":
                break;
        }
    };

    // *************************************
    //
    // InputEcho class:
    //
    // This object creates and controls an element that echos what's in the InputBox during editing
    // It is draggable.
    //
    // *************************************

    SocialCalc.InputEcho = function (editor) {
        var scc = SocialCalc.Constants;

        this.editor = editor; // the TableEditor this belongs to
        this.text = ""; // current value of what is displayed
        this.interval = null; // timer handle

        this.container = null; // element containing main echo as well as prompt line
        this.main = null; // main echo area
        this.prompt = null;

        this.functionbox = null; // function chooser dialog

        this.container = document.createElement("div");
        SocialCalc.setStyles(
            this.container,
            "display:none;position:absolute;zIndex:10;"
        );

        this.topprompt = document.createElement("div");
        if (scc.defaultInputEchoPromptClass)
            this.topprompt.className = scc.defaultInputEchoPromptClass;
        if (scc.defaultInputEchoPromptStyle)
            SocialCalc.setStyles(this.topprompt, scc.defaultInputEchoPromptStyle);
        this.topprompt.innerHTML = "";

        this.container.appendChild(this.topprompt);

        this.main = document.createElement("div");

        if (scc.defaultInputEchoClass)
            this.main.className = scc.defaultInputEchoClass;
        if (scc.defaultInputEchoStyle)
            SocialCalc.setStyles(this.main, scc.defaultInputEchoStyle);

        this.main.innerHTML = "&nbsp;";

        this.container.appendChild(this.main);

        this.prompt = document.createElement("div");
        if (scc.defaultInputEchoPromptClass)
            this.prompt.className = scc.defaultInputEchoPromptClass;
        if (scc.defaultInputEchoPromptStyle)
            SocialCalc.setStyles(this.prompt, scc.defaultInputEchoPromptStyle);
        this.prompt.innerHTML = "";

        this.container.appendChild(this.prompt);

        SocialCalc.DragRegister(this.main, true, true, {
            MouseDown: SocialCalc.DragFunctionStart,
            MouseMove: SocialCalc.DragFunctionPosition,
            MouseUp: SocialCalc.DragFunctionPosition,
            Disabled: null,
            positionobj: this.container,
        });

        editor.toplevel.appendChild(this.container);
    };

    // Methods:

    SocialCalc.InputEcho.prototype.ShowInputEcho = function (show) {
        return SocialCalc.ShowInputEcho(this, show);
    };
    SocialCalc.InputEcho.prototype.SetText = function (str) {
        return SocialCalc.SetInputEchoText(this, str);
    };

    // Functions:

    SocialCalc.ShowInputEcho = function (inputecho, show) {
        var cell, position;
        var editor = inputecho.editor;

        if (!editor) return;
        if (SocialCalc.Constants.SCNoInputEcho) {
            return;
        }

        if (show) {
            editor.cellhandles.ShowCellHandles(false);
            cell = SocialCalc.GetEditorCellElement(
                editor,
                editor.ecell.row,
                editor.ecell.col
            );
            if (cell) {
                position = SocialCalc.GetElementPosition(cell.element);
                inputecho.container.style.left = position.left - 1 + "px";
                inputecho.container.style.top = position.top - 1 + "px";
            }
            inputecho.container.style.display = "block";
            if (inputecho.interval) window.clearInterval(inputecho.interval); // just in case
            inputecho.interval = window.setInterval(
                SocialCalc.InputEchoHeartbeat,
                50
            );
        } else {
            if (inputecho.interval) window.clearInterval(inputecho.interval);
            inputecho.container.style.display = "none";
            inputecho.topprompt.innerHTML = "";
        }
    };

    SocialCalc.SetInputEchoText = function (inputecho, str) {
        if (SocialCalc.Constants.SCNoInputEcho) {
            return;
        }

        var scc = SocialCalc.Constants;
        var fname, fstr;
        var newstr = SocialCalc.special_chars(str);
        newstr = newstr.replace(/\n/g, "<br>");

        if (inputecho.text != newstr) {
            inputecho.main.innerHTML = newstr;
            inputecho.text = newstr;
        }

        var parts = str.match(
            /.*[\+\-\*\/\&\^\<\>\=\,\(]([A-Za-z][A-ZA-z]\w*?)\([^\)]*$/
        );
        if (str.charAt(0) == "=" && parts) {
            fname = parts[1].toUpperCase();
            if (SocialCalc.Formula.FunctionList[fname]) {
                SocialCalc.Formula.FillFunctionInfo(); //  make sure filled
                fstr = SocialCalc.special_chars(
                    fname + "(" + SocialCalc.Formula.FunctionArgString(fname) + ")"
                );
            } else {
                fstr = scc.ietUnknownFunction + fname;
            }
            if (inputecho.prompt.innerHTML != fstr) {
                inputecho.prompt.innerHTML = fstr;
                inputecho.prompt.style.display = "block";
            }
        } else if (inputecho.prompt.style.display != "none") {
            inputecho.prompt.innerHTML = "";
            inputecho.prompt.style.display = "none";
        }

        var editor = inputecho.editor;

        if (editor.workingvalues.currentsheet != editor.workingvalues.startsheet) {
            var promptstr =
                "Editing:" +
                editor.workingvalues.startsheet +
                "!" +
                editor.workingvalues.ecoord;
            if (promptstr != inputecho.topprompt.innerHTML) {
                inputecho.topprompt.innerHTML =
                    "Editing:" +
                    editor.workingvalues.startsheet +
                    "!" +
                    editor.workingvalues.ecoord;
                inputecho.topprompt.style.display = "block";
            }
        } else {
            if (inputecho.topprompt.style.display != "none") {
                inputecho.topprompt.innerHTML = "";
                inputecho.topprompt.style.display = "none";
            }
        }
    };

    SocialCalc.InputEchoHeartbeat = function () {
        var editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
        if (!editor) return true; // we're not handling it -- let browser do default

        if (SocialCalc.Constants.SCNoInputEcho) {
            return;
        }

        if (editor.state == "inputboxdirect") {
            editor.inputEcho.SetText(editor.inputBox.GetText() + "_");
        }
    };

    SocialCalc.InputEchoMouseDown = function (e) {
        var event = e || window.event;

        var editor = SocialCalc.Keyboard.focusTable; // get TableEditor doing keyboard stuff
        if (!editor) return true; // we're not handling it -- let browser do default

        if (SocialCalc.Constants.SCNoInputEcho) {
            return;
        }

        //      if (event.stopPropagation) event.stopPropagation(); // DOM Level 2
        //      else event.cancelBubble = true; // IE 5+
        //      if (event.preventDefault) event.preventDefault(); // DOM Level 2
        //      else event.returnValue = false; // IE 5+

        editor.inputBox.element.focus();

        //      return false;
    };

    // For Contact
    SocialCalc.EditorChangecontact = function (
        editor,
        text,
        name,
        phone,
        email,
        street,
        city,
        company,
        val
    ) {
        // alert('changecontact called');
        //var wval = editor.workingvalues;
        if (name != "") {
            cmdline = "set " + name + " " + "text t" + " " + contactname;
            editor.EditorScheduleSheetCommands(cmdline, true, false);
        }
        cmdline = "set " + phone + " " + "text t" + " " + contactphoneNumber;
        editor.EditorScheduleSheetCommands(cmdline, true, false);
        if (email != "") {
            cmdline = "set " + email + " " + "text t" + " " + contactemail;
            editor.EditorScheduleSheetCommands(cmdline, true, false);
        }
        cmdline = "set " + street + " " + "text t" + " " + contactStreet;
        editor.EditorScheduleSheetCommands(cmdline, true, false);
        cmdline = "set " + city + " " + "text t" + " " + contactcity;
        editor.EditorScheduleSheetCommands(cmdline, true, false);
        if (val == "y") {
            cmdline = "set " + company + " " + "text t" + " " + contactcompany;
            editor.EditorScheduleSheetCommands(cmdline, true, false);
        }

        return;
    };

    //changes by mini for font and color

    SocialCalc.EditorChangeSheetcolor = function (editor, text) {
        var result, cell, valueinfo, fch, type, value, oldvalue, cmdline;

        var sheetobj = editor.context.sheetobj;
        var wval = editor.workingvalues;

        type = "text t";
        //value = typeof text == "string" ? text : editor.inputBox.GetText(); // either explicit or from input box
        value = text;

        oldvalue = SocialCalc.GetCellContents(sheetobj, wval.ecoord) + "";
        if (value == oldvalue) {
            // no change
            return;
        }
        fch = value.charAt(0);
        if (fch == "=" && value.indexOf("\n") == -1) {
            type = "formula";
            value = value.substring(1);
        } else if (fch == "'") {
            type = "text t";
            value = value.substring(1);
        } else if (value.length == 0) {
            type = "empty";
        } else {
            valueinfo = SocialCalc.DetermineValueType(value);
            if (valueinfo.type == "n" && value == valueinfo.value + "") {
                // see if don't need "constant"
                type = "value n";
            } else if (valueinfo.type.charAt(0) == "t") {
                type = "text " + valueinfo.type;
            } else if (valueinfo.type == "") {
                type = "text t";
            } else {
                type = "constant " + valueinfo.type + " " + valueinfo.value;
            }
        }

        if (type.charAt(0) == "t") {
            // text
            value = SocialCalc.encodeForSave(value); // newlines, :, and \ are escaped
        }

        // if startsheet different from currentsheet, switch to start sheet
        // for the save to take effect
        if (SocialCalc.WorkBook && wval.currentsheet != wval.startsheet) {
            var control = SocialCalc.GetCurrentWorkBookControl();
            var cmdstr = "activatesheet " + wval.startsheetid;
            control.ExecuteWorkBookControlCommand(
                { cmdtype: "wcmd", id: "0", cmdstr: cmdstr },
                false
            );
        }

        //cmdline = "set "+wval.ecoord+" "+"font"+" "+value;
        cmdline = "set " + "sheet" + " " + "defaultcolor" + " " + value;
        //cmdline = "set "+"sheet"+" "+"defaultcolor green";
        //var control = SocialCalc.GetCurrentWorkBookControl();
        //alert('u reach sheet' + " "+control.workbook.sheetArr["sheet1"].sheet);
        //cmdline = "set "+sheetobj+" "+"font"+" "+value;
        //cmdline="set "+  control.workbook.sheetArr["sheet1"].sheet+" color blue" ;
        editor.EditorScheduleSheetCommands(cmdline, true, false);

        return;
    };

    SocialCalc.EditorChangecolorFromWidget = function (editor, text) {
        var result, cell, valueinfo, fch, type, value, oldvalue, cmdline;

        var sheetobj = editor.context.sheetobj;
        var wval = editor.workingvalues;
        if (!CoordForColorChange) {
            alert("No active cell");
            return;
        }

        // if startsheet different from currentsheet, switch to start sheet
        // for the save to take effect
        if (SocialCalc.WorkBook && wval.currentsheet != wval.startsheet) {
            var control = SocialCalc.GetCurrentWorkBookControl();
            var cmdstr = "activatesheet " + wval.startsheetid;
            control.ExecuteWorkBookControlCommand(
                { cmdtype: "wcmd", id: "0", cmdstr: cmdstr },
                false
            );
        }

        cmdline = "set " + CoordForColorChange + " " + "color" + " " + text;
        editor.EditorScheduleSheetCommands(cmdline, true, false);

        return;
    };

    SocialCalc.EditorChangefontFromWidget = function (editor, text) {
        var result, cell, valueinfo, fch, type, value, oldvalue, cmdline;

        var sheetobj = editor.context.sheetobj;
        var wval = editor.workingvalues;
        if (!CoordForColorChange) {
            alert("No active cell");
            return;
        }
        //alert(CoordForColorChange);
        // if startsheet different from currentsheet, switch to start sheet
        // for the save to take effect
        if (SocialCalc.WorkBook && wval.currentsheet != wval.startsheet) {
            var control = SocialCalc.GetCurrentWorkBookControl();
            var cmdstr = "activatesheet " + wval.startsheetid;
            control.ExecuteWorkBookControlCommand(
                { cmdtype: "wcmd", id: "0", cmdstr: cmdstr },
                false
            );
        }

        //cmdline = "set "+CoordForColorChange+" "+"font"+" "+text;
        //editor.EditorScheduleSheetCommands(cmdline, true, false);
        var value = text;
        if (value == "a") {
            cmdline = "set " + CoordForColorChange + " font * 12px *";
            editor.EditorScheduleSheetCommands(cmdline, true, false);
        }
        if (value == "b") {
            cmdline = "set " + CoordForColorChange + " font * 14px *";
            editor.EditorScheduleSheetCommands(cmdline, true, false);
        }
        if (value == "c") {
            cmdline = "set " + CoordForColorChange + " font * 16px *";
            editor.EditorScheduleSheetCommands(cmdline, true, false);
        }
        if (value == "d") {
            cmdline = "set " + CoordForColorChange + " font * 18px *";
            editor.EditorScheduleSheetCommands(cmdline, true, false);
        }

        return;
    };

    SocialCalc.EditorChangeSheetfont = function (editor, text) {
        var result, cell, valueinfo, fch, type, value, oldvalue, cmdline;

        var sheetobj = editor.context.sheetobj;
        var wval = editor.workingvalues;

        type = "text t";
        //value = typeof text == "string" ? text : editor.inputBox.GetText(); // either explicit or from input box
        value = text;

        oldvalue = SocialCalc.GetCellContents(sheetobj, wval.ecoord) + "";
        if (value == oldvalue) {
            // no change
            return;
        }
        fch = value.charAt(0);
        if (fch == "=" && value.indexOf("\n") == -1) {
            type = "formula";
            value = value.substring(1);
        } else if (fch == "'") {
            type = "text t";
            value = value.substring(1);
        } else if (value.length == 0) {
            type = "empty";
        } else {
            valueinfo = SocialCalc.DetermineValueType(value);
            if (valueinfo.type == "n" && value == valueinfo.value + "") {
                // see if don't need "constant"
                type = "value n";
            } else if (valueinfo.type.charAt(0) == "t") {
                type = "text " + valueinfo.type;
            } else if (valueinfo.type == "") {
                type = "text t";
            } else {
                type = "constant " + valueinfo.type + " " + valueinfo.value;
            }
        }

        if (type.charAt(0) == "t") {
            // text
            value = SocialCalc.encodeForSave(value); // newlines, :, and \ are escaped
        }

        // if startsheet different from currentsheet, switch to start sheet
        // for the save to take effect
        if (SocialCalc.WorkBook && wval.currentsheet != wval.startsheet) {
            var control = SocialCalc.GetCurrentWorkBookControl();
            var cmdstr = "activatesheet " + wval.startsheetid;
            control.ExecuteWorkBookControlCommand(
                { cmdtype: "wcmd", id: "0", cmdstr: cmdstr },
                false
            );
        }

        //cmdline = "set "+wval.ecoord+" "+"font"+" "+value;
        //cmdline = "set "+"sheet"+" "+"defaultcolor"+" "+ value;

        //cmdline = "set "+"sheet"+" "+"defaultfont"+" * "+value+" *";

        //cmdline = "set sheet defaultfont normal normal "+value +" *";
        //cmdline="set sheet defaultfont";
        // alert(cmdline);
        //editor.EditorScheduleSheetCommands(cmdline, true, false);
        if (value == "a") {
            cmdline = "set sheet defaultfont * 12px *";
            editor.EditorScheduleSheetCommands(cmdline, true, false);
        }
        if (value == "b") {
            cmdline = "set sheet defaultfont * 14px *";
            editor.EditorScheduleSheetCommands(cmdline, true, false);
        }
        if (value == "c") {
            cmdline = "set sheet defaultfont * 16px *";
            editor.EditorScheduleSheetCommands(cmdline, true, false);
        }
        if (value == "d") {
            cmdline = "set sheet defaultfont * 18px *";
            editor.EditorScheduleSheetCommands(cmdline, true, false);
        }

        //cmdline = ""+"set sheet defaultfont * 8pt *";
        //cmdline = "set "+"sheet"+" "+"defaultcolor green";
        //var control = SocialCalc.GetCurrentWorkBookControl();
        //alert('u reach sheet' + " "+control.workbook.sheetArr["sheet1"].sheet);
        //cmdline = "set "+sheetobj+" "+"font"+" "+value;
        //cmdline="set "+  control.workbook.sheetArr["sheet1"].sheet+" color blue" ;

        return;
    };

    SocialCalc.EditorCut = function (editor, value) {
        var result, cell, valueinfo, fch, type, value, oldvalue, cmdline;
        var sheetobj = editor.context.sheetobj;
        var wval = editor.workingvalues;
        if (SocialCalc.Callbacks && SocialCalc.Callbacks.IsCellEditable) {
            if (!SocialCalc.Callbacks.IsCellEditable(editor)) {
                return true;
            }
        }
        if (value == "a") {
            cmdline = "cut " + editCoord + " all";
        } else if (value == "b") {
            cmdline = "copy " + editCoord + " all";
        } else if (value == "c") {
            cmdline = "paste " + editCoord + " all";
        } else if (value == "d") {
            cmdline = "erase " + editCoord + " formulas";
        }
        editor.EditorScheduleSheetCommands(cmdline, true, false);
    };

    SocialCalc.EditorClearSheet = function (editor, cell_to_clear) {
        //alert("clear");
        var cmdline;
        var coord = cell_to_clear;
        cmdline = "erase " + coord + " formulas";
        //console.log(cmdline);
        editor.EditorScheduleSheetCommands(cmdline, true, false);
    };


    // Make sure SocialCalc is available globally
    if (typeof window !== "undefined") {
        window.SocialCalc = SocialCalc;
    } else if (typeof global !== "undefined") {
        global.SocialCalc = SocialCalc;
    }

    return SocialCalc;
});
