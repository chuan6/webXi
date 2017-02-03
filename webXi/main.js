var DOC = document; // singleton; updated, but never replaced
var Type = (function () {
    var na = { type: 6 /* na */ };
    return {
        NA: na,
        str: function (x) {
            return { type: 0 /* str */, value: "" + x };
        },
        url: {
            cons: function (x, title) {
                return { type: 1 /* url */, value: [x, title] };
            },
            getHost: function (v) {
                console.assert(v.type === 1 /* url */, "Type mismatch.");
                var urlstr = v.value[0];
                var i, n = urlstr.length;
                var step = 0; //process is done through steps
                var x, len;
                ITER: for (i = 0; i < n; i++) {
                    x = urlstr[i];
                    switch (step) {
                        case 0:
                            if (x === ':')
                                step++;
                            break;
                        case 1:
                            if (x === '/') {
                                step++;
                                break;
                            }
                            else {
                                break ITER;
                            }
                        case 2:
                            if (x === '/') {
                                len = 0;
                                step++;
                                break;
                            }
                            else {
                                break ITER;
                            }
                        case 3:
                            if (x === '/' || x === ':')
                                break ITER;
                            len++; //count a char of the host
                    }
                }
                return (step === 3 && len > 0 ? urlstr.slice(i - len, i) : "");
            }
        },
        isUrl: function (x) { return x.type === 1 /* url */; },
        epoch: function (x) {
            return { type: 2 /* epoch */, value: new Date(x) };
        },
        count: function (x) {
            return { type: 3 /* count */, value: Number(x) };
        },
        duration: function (x) {
            return { type: 4 /* duration */, value: x };
        },
        show: function (x) {
            var v = x.value;
            var time_value, time_unit;
            switch (x.type) {
                case 0 /* str */:
                    return v;
                case 1 /* url */:
                    return "<a href=\"" + v[0] + "\""
                        + " title=\"" + v[1] + "\">"
                        + v[0].replace(/[&"<>]/g, function (c) {
                            return { '&': '&amp;',
                                '"': '&quot;',
                                '<': '&lt',
                                '>': '&gt' }[c];
                        })
                        + "</a>";
                case 2 /* epoch */:
                    return v.toLocaleString();
                case 3 /* count */:
                    return String(v);
                case 4 /* duration */:
                    _a = function (n_ms) {
                        var units = [[60, 's'],
                            [60, 'm'],
                            [24, 'h'],
                            [1, 'd']];
                        var tmp = n_ms / 1000;
                        var i, n, s;
                        for (i = 0; i < units.length; i++) {
                            _a = units[i], n = _a[0], s = _a[1];
                            if (tmp < n)
                                break;
                            tmp /= n;
                        }
                        return [tmp, s];
                        var _a;
                    }(v), time_value = _a[0], time_unit = _a[1];
                    return "" + time_value.toFixed(2) + " " + time_unit;
                case 6 /* na */:
                    return "?";
                default:
                    console.log("Type.show: unhandled type - " + x.type);
                    return "";
            }
            var _a;
        },
        isNA: function (x) {
            return x === na;
        },
        isEqual: function (a, b) {
            var ta = a.type;
            if (ta !== b.type)
                return false;
            switch (ta) {
                case 0 /* str */:
                    return a.value === b.value;
                case 1 /* url */:
                    return a.value === b.value;
                case 2 /* epoch */:
                    return a.value.getTime() === b.value.getTime;
                case 3 /* count */:
                    return a.value === b.value;
                case 4 /* duration */:
                    return a.value === b.value;
                default:
                    console.error("Error: Type.isEqual - invalid type.");
                    return false;
            }
        },
        isSortable: function (x) {
            var t = x.type;
            return t === 0 /* str */ || t === 2 /* epoch */ || t === 3 /* count */ || t === 4 /* duration */;
        },
        cmp: function (a, b) {
            var ta, tb;
            if (a !== na && b !== na) {
                ta = a.type;
                tb = b.type;
                console.assert(ta === tb, "Type.less: expect arguments of the same type.");
                switch (ta) {
                    case 0 /* str */:
                        return a.value < b.value ? -1 : (a.value === b.value ? 0 : 1);
                    case 2 /* epoch */:
                        return a.value.getTime() - b.value.getTime();
                    case 3 /* count */:
                        return a.value - b.value;
                    case 4 /* duration */:
                        return a.value - b.value;
                    default:
                        return 0;
                }
            } //a===na || b===na
            if (a === b)
                return 0;
            if (a === na)
                return -1;
            return 1; //b equals na, while a doesn't
        },
        aggregate: function (a, b) {
            var ta = a.type;
            switch (ta) {
                case 1 /* url */:
                    return { type: 5 /* url_aggr */, value: [a.value, b.value] };
                case 5 /* url_aggr */:
                    return { type: 5 /* url_aggr */, value: a.value.push(b.value) };
                case 0 /* str */:
                    return { type: 0 /* str */, value: a.value + ", " + b.value };
                case 2 /* epoch */:
                    return {
                        type: 2 /* epoch */,
                        value: a.value.getTime() < b.value.getTime() ?
                            b.value : a.value
                    };
                case 4 /* duration */:
                    return { type: 4 /* duration */, value: a.value + b.value };
                case 3 /* count */:
                    return { type: 3 /* count */, value: a.value + b.value };
                default:
                    console.error("Error: Type.aggregate - invalid type.");
                    return undefined;
            }
        }
    };
})();
function peek(v) {
    var n = v.length;
    return n === 0 ? undefined : v[n - 1];
}
var Env = (function () {
    var stack = [], len = 0;
    var curr_page = -1;
    return {
        curr: function () {
            return stack[curr_page];
        },
        pushData: function (data, headv, sort_conf) {
            var t;
            console.assert(curr_page < len, "Env.pushData: curr_page: " + curr_page);
            t = {
                data: data,
                headv: headv,
                sorted: sort_conf,
                table: consTABLE(headv, data)
            };
            if (curr_page === len - 1) {
                stack.push(t);
            }
            else {
                stack.splice(curr_page + 1, len - curr_page, t);
            }
            curr_page++;
            len = curr_page + 1;
        },
        pageNavi: (function () {
            var back_button = DOC.getElementById("navi_back"), next_button = DOC.getElementById("navi_next");
            return function (type) {
                var prev_table = DOC.getElementById("table");
                //prepare
                selection.reset();
                ctrlPanel.reset();
                switch (type) {
                    case "top":
                        curr_page = len - 1;
                        break;
                    case "back":
                        --curr_page;
                        break;
                    case "next":
                        ++curr_page;
                        break;
                    case "bottom":
                        curr_page = 0;
                        break;
                }
                console.assert(curr_page < len && curr_page >= 0, "Env.pageNavi: curr_page: " + curr_page);
                back_button.disabled = (curr_page === 0 ? true : false);
                next_button.disabled = (curr_page === len - 1 ? true : false);
                if (prev_table) {
                    DOC.body.replaceChild(stack[curr_page].table, prev_table);
                }
                else {
                    DOC.body.appendChild(stack[curr_page].table);
                }
            };
        })()
    };
})();
function getCopy(data) {
    //assumptions:
    //1. data is a two-dimension array;
    //2. each atomic element in data is either a string or a
    //   number (thus slice() can be used to copy each row);
    var i, n = data.length;
    var copy = [];
    if (n === 0)
        return copy;
    for (i = 0; i < n; i++) {
        copy.push(data[i].slice());
    }
    return copy;
}
function getCmpFn(f, reverseflag) {
    var x = reverseflag ? -1 : 1;
    var cmp = Type.cmp;
    return function (a, b) {
        return x * cmp(f(a), f(b));
    };
}
function consHtmlButton(id, label, actionfn) {
    var button = DOC.createElement("button");
    button.id = id;
    button.textContent = label;
    button.addEventListener("click", actionfn);
    return button;
}
function getEnclosingTableCell(node) {
    var name;
    if (node === null)
        return false;
    name = node.nodeName;
    if (name === "TH" || name === "TD")
        return node;
    return getEnclosingTableCell(node.parentNode);
}
var rows = (function () {
    var v = [];
    var color_on = "#B3D4FC", color_off = "white";
    return {
        ceiling: function (nth, state) {
            console.assert(nth >= 0, "rows.ceiling: nth underflow");
            for (--nth; nth > -1; nth--)
                if (!!v[nth] === state)
                    break;
            return nth; //>= -1
        },
        floor: function (nth, state) {
            var m = v.length, n = Env.curr().data.length; //m <= n
            console.assert(nth < n, "rows.floor: nth overflow");
            for (++nth; nth < m; nth++)
                if (!!v[nth] === state)
                    break;
            return nth === m && state === true ? n : nth; //=== n or <= m
        },
        flip: function (nth) {
            //flip selection status of the i-th row of the current table,
            //and return the resulting status of the row
            var selected = v[nth];
            var elt = DOC.getElementById("r" + nth);
            console.log("flip");
            elt.style.backgroundColor = selected ? color_off : color_on;
            return v[nth] = !selected;
        },
        flipRangeEx: function (from, to) {
            //flip rows in a range, EXCLUSIVE
            var begin, end, i, n = Math.abs(from - to) - 1;
            var selected, elt;
            console.assert(n >= 0, "selection.flipRange: invalid input");
            if (n === 0)
                return;
            //n > 0
            begin = Math.min(from, to) + 1;
            end = begin + n;
            console.log("begin: " + begin + "; end: " + end);
            for (i = begin, elt = DOC.getElementById("r" + begin); i < end; i++, elt = elt.nextSibling) {
                console.log("flipRangeEx");
                selected = v[i];
                elt.style.backgroundColor = selected ? color_off : color_on;
                v[i] = !selected;
            }
        },
        reset: function () {
            //reset both style and internal states
            var k, kv = Object.keys(v);
            var i, n = kv.length;
            var elt;
            //reset style for all rows that are "selected"
            for (i = 0; i < n; i++) {
                k = kv[i];
                if (k) {
                    elt = DOC.getElementById("r" + k);
                    elt.style.backgroundColor = color_off;
                    v[k] = false;
                }
            }
            //and reset internal states
            v = [];
        },
        flipAll: function () {
            //flip status of all rows of the current table;
            //a redundant method for efficiency purpose
            var i, selected, elt;
            for (i = 0, elt = DOC.getElementById("r1"); elt !== null; i++, elt = elt.nextSibling) {
                selected = v[i];
                elt.style.backgroundColor = selected ? color_off : color_on;
                v[i] = !selected;
            }
        }
    };
})();
var selection = (function () {
    var cv = [], //column selection vector
    rv = []; //row selection vector
    var ri, rj, rk; //i, j, k for continuous row selection
    var color_on = "#B3D4FC", color_off = "white";
    return {
        flipCol: function (nth) {
            //keep two states: "selected"(true), "unselected"(false)
            var state = cv[nth];
            var element = DOC.getElementById("c" + nth);
            console.log(element);
            console.log(cv);
            element.style.backgroundColor = (state ? color_off : color_on);
            return cv[nth] = (state ? false : true); //flip state
        },
        reset: function () {
            var k, kv;
            var i, n;
            var element;
            //clear col selections
            if (cv.length > 0) {
                kv = Object.keys(cv);
                n = kv.length;
                for (i = 0; i < n; i++) {
                    k = kv[i];
                    if (cv[k]) {
                        element = DOC.getElementById("c" + k);
                        element.style.backgroundColor = color_off;
                        cv[k] = false;
                    }
                } //all col selections cleared
            }
            //clear row selectons
            if (rv.length > 0) {
                kv = Object.keys(rv);
                n = kv.length;
                for (i = 0; i < n; i++) {
                    k = kv[i];
                    if (rv[k]) {
                        element = DOC.getElementById("r" + k);
                        element.style.backgroundColor = color_off;
                        rv[k] = false;
                    }
                } //all row selections cleared
            }
            //reset cv and rv
            cv = [];
            rv = [];
            ri = rj = rk = undefined;
        }
    };
})();
var ctrlPanel = (function () {
    var panel;
    var elemPos = function (elem) {
        var x = 0, y = 0;
        do {
            x += elem.offsetLeft - elem.scrollLeft + elem.clientLeft;
            y += elem.offsetTop - elem.scrollTop + elem.clientTop;
            elem = elem.offsetParent;
        } while (elem);
        console.assert(!!elem === false, "elemPos: loop-inv broken.");
        return [x, y];
    };
    var reset = function () {
        if (panel)
            panel.parentNode.removeChild(panel);
        panel = false;
    };
    return {
        showAtHere: function (elem) {
            var pos = elemPos(elem);
            reset();
            panel = DOC.createElement("div");
            panel.style.position = "absolute";
            panel.style.left = pos[0];
            panel.style.top = pos[1];
            panel.style.backgroundColor = "aliceblue";
            return function (pitemv, leadtext) {
                var i, n = pitemv.length;
                if (leadtext)
                    panel.textContent = leadtext;
                for (i = 0; i < n; i++) {
                    panel.appendChild(pitemv[i]);
                }
                elem.appendChild(panel); //attach panel to target element
            };
        },
        reset: reset
    };
})();
var tableCellOnClick = (function () {
    var sortByColumn = function (nth) {
        return function () {
            var curr = Env.curr();
            var cmpfn, flag;
            if (curr.sorted && curr.sorted.nth === nth) {
                flag = !curr.sorted.reverse;
            }
            else {
                flag = true;
            }
            cmpfn = getCmpFn(function (row) {
                return row[nth];
            }, flag);
            Env.pushData(getCopy(curr.data).sort(cmpfn), curr.headv, { nth: nth, reverse: flag });
            Env.pageNavi("top");
        };
    };
    var groupByHosts = function (nth) {
        var aggr = function (r, rx) {
            var newr = [];
            var i, n = r.length;
            for (i = 0; i < n; i++) {
                if (i === nth) {
                    newr.push(r[i]);
                }
                else {
                    newr.push(Type.aggregate(r[i], rx[i]));
                }
            }
            return newr;
        };
        return function () {
            var rows = Env.curr().data;
            var i, n = rows.length;
            var tmp = {};
            var row, host, sofar;
            console.log("groupbyhost: n " + n);
            for (i = 0; i < n; i++) {
                row = rows[i];
                host = Type.url.getHost(row[nth]);
                sofar = tmp[host];
                if (sofar === undefined) {
                    row[nth] = Type.str(host);
                    row.push(Type.count(1)); //add "group count" column
                    tmp[host] = row; //set initial aggregated row
                }
                else {
                    row.push(Type.count(1));
                    tmp[host] = aggr(sofar, row);
                }
            } //tmp is ready
            (function () {
                var v = Object.keys(tmp);
                var i, n = v.length;
                var data = [], headv;
                for (i = 0; i < n; i++) {
                    data.push(tmp[v[i]]);
                } //console.log(data);
                //data is ready
                headv = Env.curr().headv;
                headv[nth] = "host";
                headv.push("group count");
                //headv is ready
                Env.pushData(data, headv, null);
                //data is pushed onto top of Env stack
                Env.pageNavi("top");
            })();
        };
    };
    var handleClickInTH = function (nth, element) {
        var ix = nth, iy;
        var data = Env.curr().data, ny = data.length;
        var pitem, pitemv = [];
        if (selection.flipCol(ix)) {
            //skip leading NAs
            for (iy = 0; iy < ny; iy++) {
                if (Type.isNA(data[iy][ix]))
                    continue;
                else
                    break;
            }
            if (iy === ny)
                return;
            //add event listeners according to column properties
            if (Type.isSortable(data[iy][ix])) {
                pitem = DOC.createElement("button");
                pitem.textContent = "sort by";
                pitem.addEventListener("click", sortByColumn(ix));
                pitemv.push(pitem);
            }
            if (Type.isUrl(data[iy][ix])) {
                pitem = DOC.createElement("button");
                pitem.textContent = "group by hosts";
                pitem.addEventListener("click", groupByHosts(ix));
                pitemv.push(pitem);
            }
            ctrlPanel.showAtHere(element)(pitemv);
        }
        else {
            ctrlPanel.reset();
        }
    };
    var handleClickInTD = function (nth, element) {
        //When a row is clicked, its state is flipped to x.
        //Try finding from above the nearest row that is in state x.
        //If there is one, add button A - "flip rows from above" to ctrl_panel.
        //Also try finding from below the nearest row that is in state x.
        //If there is one, add button B - "flip rows from below" to ctrl_panel.
        //Add button C - "flip rows from both above and below" to ctrl_panel
        //iff both button A and B have been added.
        var pitemv = [], pitem;
        var s = rows.flip(nth);
        var c = rows.ceiling(nth, s), f = rows.floor(nth, s);
        console.log("f: " + f + "; c: " + c);
        c = c === nth - 1 || c < 0 ?
            false : c;
        if (c !== false) {
            pitem = DOC.createElement("button");
            pitem.textContent = "above";
            pitem.addEventListener("click", function (event) {
                event.stopPropagation();
                rows.flipRangeEx(c, nth);
                ctrlPanel.reset();
            });
            pitemv.push(pitem);
        }
        f = f === nth + 1 || f >= Env.curr().data.length ?
            false : f;
        if (f !== false) {
            pitem = DOC.createElement("button");
            pitem.textContent = "below";
            pitem.addEventListener("click", function (event) {
                event.stopPropagation();
                rows.flipRangeEx(nth, f);
                ctrlPanel.reset();
            });
            pitemv.push(pitem);
        }
        if (c !== false && f !== false) {
            pitem = DOC.createElement("button");
            pitem.textContent = "both";
            pitem.addEventListener("click", function (event) {
                event.stopPropagation();
                rows.flipRangeEx(c, nth);
                rows.flipRangeEx(nth, f);
                ctrlPanel.reset();
            });
            pitemv.push(pitem);
        }
        if (pitemv.length === 0) {
            ctrlPanel.reset();
            return;
        }
        ctrlPanel.showAtHere(element)(pitemv, "flip rows from ");
    };
    return function () {
        var cell = getEnclosingTableCell(this);
        var tag = cell.tagName;
        switch (tag) {
            case "TH":
                handleClickInTH(Number(cell.id.slice(1)), cell);
                break;
            case "TD":
                handleClickInTD(Number(cell.parentNode.id.slice(1)), cell);
                break;
            default:
                console.error("Found " + tag + " instead of TH or TD.");
        }
    };
})();
function consTR(row) {
    var i, n = row.length;
    var td, tr = DOC.createElement("tr");
    var x;
    for (i = 0; i < n; i++) {
        x = row[i];
        td = DOC.createElement("td");
        if (Type.isNA(x)) {
            td.style.textAlign = "center";
        }
        else if (x.value + 0 === x.value) {
            td.style.textAlign = "right";
        }
        td.innerHTML = Type.show(x);
        td.addEventListener("click", tableCellOnClick);
        tr.appendChild(td);
    }
    return tr;
}
function consTABLE(headv, rowv) {
    var i, m = headv.length;
    var j, n = rowv.length;
    var table = DOC.createElement("table"), colgroup = DOC.createElement("colgroup"), thead = DOC.createElement("thead"), tbody = DOC.createElement("tbody"), col, tr, th, td, span, sort_icon;
    console.log("m: " + m + "; n: " + n);
    // col's and th's
    tr = DOC.createElement("tr"); //row in thead
    for (i = 0; i < m; i++) {
        col = DOC.createElement("col");
        col.id = "c" + i;
        colgroup.appendChild(col);
        th = DOC.createElement("th");
        th.id = "h" + i;
        span = DOC.createElement("span");
        span.textContent = headv[i];
        span.style.padding = "0px 4px";
        span.addEventListener("click", tableCellOnClick);
        th.appendChild(span);
        tr.appendChild(th);
    }
    table.appendChild(colgroup);
    thead.appendChild(tr);
    table.appendChild(thead);
    // tr's
    for (j = 0; j < n; j++) {
        tr = consTR(rowv[j]);
        tr.id = "r" + j;
        tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    table.style.borderCollapse = "collapse";
    table.id = "table";
    return table;
}
function getVisitsFn(since) {
    return function (vv) {
        var r = [];
        var i, n = vv.length;
        var x, time; //visit time
        for (i = n - 1; i > -1; i--) {
            x = vv[i];
            time = x.visitTime;
            if (time && time >= since) {
                r.push(x);
            }
            else {
                return r;
            }
        }
        return r;
    };
}
var millisecondsPerDay = 1000 * 60 * 60 * 24;
var now = (new Date()).getTime();
var oneDayAgo = now - millisecondsPerDay;
var oneWeekAgo = now - millisecondsPerDay * 7;
var oneMonthAgo = now - millisecondsPerDay * 28;
function htail(arr, begin, isShallow) {
    var v, n, i;
    if (isShallow === true) {
        v = arr;
    }
    else {
        v = arr.slice(0);
    }
    n = v.length;
    i = begin;
    console.assert(i >= 0 && i <= n, "makeSlice inv breaks");
    return {
        empty: i === n,
        head: i === n ? null : v[i],
        tail: i === n ? this : htail(v, i + 1, true)
    };
}
chrome.history.search({
    text: "",
    startTime: oneWeekAgo,
    endTime: now,
    maxResults: 1000000
}, function (hv) {
    /*
     * The original data is an epoch based table, which records all url
     * requests by the time each request is made. The HistoryItems from
     * url table lists all the requested urls from a period of time,
     * instead of epochs for every requests made. So url table alone
     * doesn't suffice. We retrieve from visit table in addition. A
     * VisitItem from visit table tells an epoch for a url request. And
     * a query to visit table using a url returns all VisitItems related
     * to the url, and thus all the epochs for the url. By querying visit
     * table for each url from url table, and we get all the data we need.
     * Sort all the data by epoch. The original data is established.
     */
    var execAfterDataIsReady = function () {
        Env.pushData(data, ["visit time", "url", "transition", "gap"], { nth: 0, reverse: true });
        Env.pageNavi("top");
        DOC.getElementById("navi_back").onclick = function () {
            Env.pageNavi("back");
        };
        DOC.getElementById("navi_next").onclick = function () {
            Env.pageNavi("next");
        };
    };
    var data = [];
    var getVisits = getVisitsFn(oneWeekAgo);
    var cmpfn = getCmpFn(function (row) { return row[0]; }, true);
    var readSrc = function iter_urls(v, i) {
        var x, xs, url, next;
        if (v.empty)
            return;
        x = v.head;
        xs = v.tail;
        url = x.url;
        if (!url || url.slice(0, 4) !== "http") {
            next = i;
        }
        else {
            chrome.history.getVisits({ url: url }, function (vv) {
                var vv = getVisits(vv);
                var i, n = vv.length;
                var title = x.title;
                var url_obj = Type.url.cons(url, title ? title.trim() : "");
                var time;
                for (i = 0; i < n; i++) {
                    time = vv[i].visitTime;
                    //if (vv[i].transition=="link") {
                    data.push([time ? Type.epoch(time) : Type.NA,
                        url_obj,
                        //Type.count(vv[i].visitId),
                        Type.str(vv[i].transition),
                    ]);
                }
                if (xs.empty) {
                    data.sort(cmpfn);
                    n = data.length;
                    data[0].push(Type.duration(now - data[0][0].value.getTime()));
                    for (i = 1; i < n; i++) {
                        data[i].push(Type.duration(data[i - 1][0].value.getTime() - data[i][0].value.getTime()));
                    }
                    //data is ready
                    execAfterDataIsReady();
                }
            });
            next = i + 1;
        }
        iter_urls(xs, next);
    };
    readSrc(htail(hv, 0), 0);
});
// TODO add "click" listener to cells that contains URLs, "unfold" the result set of getVisits
