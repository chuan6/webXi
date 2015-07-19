var DOC = document; //singleton; updated, but never replaced

var Type = (function () {
    var str_t = 0, url_t = 1, epoch_t = 2, count_t = 3, duration_t = 4;
    var url_aggr_t = 10; //aggregation on urls returns url_aggr_t type
    var na_t = 11; // type for value "not available"

    var na = { type: na_t };

    return {
        NA: na,
        str: function(x) {//bind value with type str_t
            return {type: str_t, value: "" + x};
        },
        url: {
            cons: function(x, title) {
                return { type: url_t, value: [x, title] };
            },
            getHost: function(v) {
                console.assert(v.type === url_t, "Type mismatch.");
                var urlstr = v.value[0];
                var i, n = urlstr.length;
                var step = 0; //process is done through steps
                var x, len;

                ITER:
                for (i = 0; i < n; i++) {
                    x = urlstr[i];
                    switch (step) {
                    case 0: //move towards the first colon;
                        if (x === ':') step++;
                        break;
                    case 1: //consume the following '/';
                        if (x === '/') {
                            step++; break;
                        } else {
                            break ITER;
                        }
                    case 2: //consume the following '/', and set begin
                        if (x === '/') {
                            len = 0; step++; break;
                        } else {
                            break ITER;
                        }
                    case 3: //move towards the next '/' or ':', or the end
                        if (x === '/' || x === ':')
                            break ITER;
                        len++; //count a char of the host
                    }
                }
                return (step===3 && len>0 ? urlstr.slice(i-len, i) : "");
            }
        },
        isUrl: function(x) { return x.type === url_t; },
        epoch: function(x) {//bind value with type epoch_t
            return { type: epoch_t, value: new Date(x) };
        },
        count: function(x) {//bind value with type count_t
            return { type: count_t, value: Number(x) };
        },
        duration: function(x) {//bind value with type duration_t
            return { type: duration_t, value: x };
        },
        show: function(x) {//return a readable string
            var v = x.value;
            var unit_str, tmp;
            
            switch (x.type) {
            case str_t:
                return v;
            case url_t:
                return "<a href=\"" + v[0] + "\""
                    + " title=\"" + v[1] + "\">"
                    + v[0].replace(/&/g, '&amp;')
                    .replace(/"/g, '&quot;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    + "</a>";
            case epoch_t:
                return v.toLocaleString();
            case count_t:
                return String(v);
            case duration_t:
                tmp = v/1000; //ms -> s
                if (tmp / 60 < 1) {
                    unit_str = " s";
                    v = tmp;
                } else {
                    tmp /= 60;
                    if (tmp / 60 < 1) {
                        unit_str = " m";
                        v = tmp;
                    } else {
                        tmp /= 60;
                        if (tmp / 24 < 1) {
                            unit_str = " h";
                            v = tmp;
                        } else {
                            unit_str = " d";
                            v = tmp / 24;
                        }
                    }
                }
                return "" + v.toFixed(2) + unit_str;
            case na_t:
                return "?";
            default:
                console.log("Type.show: unhandled type - " + x.type);
                return "";
            }
        },
        isNA: function(x) {
            return x === na;
        },
        isEqual: function(a, b) {
            var ta = a.type;

            if (ta !== b.type)
                return false;

            switch (ta) {
            case str_t:
                return a.value === b.value;
            case url_t:
                return a.value === b.value;
            case epoch_t:
                return a.value.getTime() === b.value.getTime;
            case count_t:
                return a.value === b.value;
            case duration_t:
                return a.value === b.value;
            default:
                console.error("Error: Type.isEqual - invalid type.");
                return false;
            }
        },
        isSortable: function(x) {
            var t = x.type;
            return t===str_t || t===epoch_t || t===count_t || t===duration_t;
        },
        cmp: function(a, b) {
            var ta, tb;
            if (a !== na && b !== na) {
                ta = a.type;
                tb = b.type;
                console.assert(ta===tb,
                               "Type.less: expect arguments of the same type.");
                switch (ta) {
                case str_t:
                    return a.value < b.value? -1 : (a.value===b.value? 0 : 1);
                case epoch_t:
                    return a.value.getTime() - b.value.getTime();
                case count_t:
                    return a.value - b.value;
                case duration_t:
                    return a.value - b.value;
                default:
                    return 0;
                }
            } //a===na || b===na

            if (a === b) //both a and b equal na
                return 0;
            if (a === na) //a equals na, while b doesn't
                return -1;
            return 1; //b equals na, while a doesn't
        },
        aggregate: function(a, b) {
            var ta = a.type;
            
            switch (ta) {
            case url_t:
                return { type: url_aggr_t, value: [a.value, b.value] };
            case url_aggr_t:
                return { type: url_aggr_t, value: a.value.push(b.value) };
            case str_t:
                return { type: str_t, value: a.value + ", " + b.value };
            case epoch_t:
                return {
                    type: epoch_t,
                    value: a.value.getTime() < b.value.getTime() ?
                        b.value : a.value
                };
            case duration_t:
                return { type: duration_t, value: a.value + b.value };
            case count_t:
                return { type: count_t, value: a.value + b.value };
            default:
                console.error("Error: Type.aggregate - invalid type.");
                return undefined;
            }
        }
    };
})();

function peek(v) { //peek array as a stack
    var n = v.length;
    return n === 0 ? undefined : v[n - 1];
}

var Env = (function () {
    var stack = [], len = 0;
    var curr_page = -1;

    return {
        curr: function() {
            return stack[curr_page];
        },
        
        pushData: function (data, headv, sort_conf) {
            var t = {};

            console.assert(curr_page < len,
                           "Env.pushData: curr_page: " + curr_page);

            t.data = data;
            t.headv = headv;
            t.sorted = sort_conf;
            t.table = consTABLE(t.headv, t.data);

            if (curr_page === len - 1) {
                stack.push(t);
            } else {
                stack.splice(curr_page + 1, len - curr_page, t);
            }
            curr_page++;
            len = curr_page + 1;
        },

        pageNavi: (function () {
            var back_button = DOC.getElementById("navi_back"),
                next_button = DOC.getElementById("navi_next");

            return function (type) {
                var prev_table = DOC.getElementById("table");

                //prepare
                selection.reset();
                ctrlPanel.reset();

                switch (type) {
                case "top":
                    curr_page = len - 1; break;
                case "back":
                    --curr_page; break;
                case "next":
                    ++curr_page; break;
                case "bottom":
                    curr_page = 0; break;
                }
                console.assert(curr_page < len && curr_page >= 0,
                               "Env.pageNavi: curr_page: " + curr_page);

                back_button.disabled = (curr_page === 0 ? true : false);
                next_button.disabled = (curr_page === len - 1 ? true : false);

                if (prev_table) {
                    DOC.body.replaceChild(stack[curr_page].table, prev_table);
                } else {
                    DOC.body.appendChild(stack[curr_page].table);
                }
            };
        })()
    };
})();

function getCopy(data) { //make a "deep" copy of data
    //assumptions:
    //1. data is a two-dimension array;
    //2. each atomic element in data is either a string or a
    //   number (thus slice() can be used to copy each row);
    var i, n = data.length;
    var copy = [];

    if (n === 0)
        return copy;
    for (i = 0; i < n; i++) { //copy by rows
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

function getEnclosingTableCell(node) { //get enclosing table cell recursively
    var name;

    if (node === null)
        return false;
    name = node.nodeName;
    if (name === "TH" || name === "TD")
        return node;
    return getEnclosingTableCell(node.parentNode);
}

var rows = (function() {
    var v = [];
    var color_on = "#B3D4FC", color_off = "white";

    return {
        ceiling: function(nth, state) {
            console.assert(nth >= 0, "rows.ceiling: nth underflow");
            for (--nth; nth > -1; nth--)
                if (!!v[nth] === state) break;
            return nth; //>= -1
        },
        floor: function(nth, state) {
            var m = v.length,
                n = Env.curr().data.length; //m <= n
            console.assert(nth < n, "rows.floor: nth overflow");
            for (++nth; nth < m; nth++)
                if (!!v[nth] === state) break;
            return nth===m && state===true? n : nth; //=== n or <= m
        },
        flip: function(nth) {
            //flip selection status of the i-th row of the current table,
            //and return the resulting status of the row
            var selected = v[nth];
            var elt = DOC.getElementById("r" + nth);
            console.log("flip");

            elt.style.backgroundColor = selected? color_off : color_on;

            return v[nth] = !selected;
        },
        flipRangeEx: function(from, to) {
            //flip rows in a range, EXCLUSIVE
            var begin, end, i, n = Math.abs(from-to) - 1;
            var selected, elt;

            console.assert(n >= 0, "selection.flipRange: invalid input");

            if (n === 0) //empty range; no flip is needed
                return;
            //n > 0

            begin = Math.min(from, to) + 1;
            end = begin + n;
            console.log("begin: " + begin + "; end: " + end);

            for (i = begin, elt = DOC.getElementById("r" + begin);
                 i < end;
                 i++, elt = elt.nextSibling)
            {
                console.log("flipRangeEx");
                selected = v[i];
                elt.style.backgroundColor = selected? color_off : color_on;
                v[i] = !selected;
            }
        },
        reset: function() {
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
        flipAll: function() {
            //flip status of all rows of the current table;
            //a redundant method for efficiency purpose
            var i, selected, elt;

            for (i = 0, elt = DOC.getElementById("r1");
                 elt !== null;
                 i++, elt = elt.nextSibling)
            {
                selected = v[i];
                elt.style.backgroundColor = selected? color_off : color_on;
                v[i] = !selected;
            }
        }
    };
})();

var selection = (function() {
    var cv = [], //column selection vector
        rv = []; //row selection vector
    var ri, rj, rk; //i, j, k for continuous row selection
    var color_on = "#B3D4FC", color_off = "white";

    return {
        flipCol: function(nth) {
            //keep two states: "selected"(true), "unselected"(false)
            var state = cv[nth];
            var element = DOC.getElementById("c" + nth);

            console.log(element);
            console.log(cv);

            element.style.backgroundColor = (state? color_off : color_on);

            return cv[nth] = (state? false : true); //flip state
        },
        reset: function() {
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
            cv = []; rv = [];
            ri = rj = rk = undefined;
        }
    };
})();

var ctrlPanel = (function() {//TODO maybe add timeout display
    var panel;

    var elemPos = function(elem) {//return global position as [x, y]
        var x = 0, y = 0;

        do {
            x += elem.offsetLeft - elem.scrollLeft + elem.clientLeft;
            y += elem.offsetTop - elem.scrollTop + elem.clientTop;
            elem = elem.offsetParent;
        } while (elem);
        console.assert(!!elem === false, "elemPos: loop-inv broken.");
        return [x, y];
    };

    var reset = function() {
        if (panel) panel.parentNode.removeChild(panel);
        panel = false;
    };

    return {
        showAtHere: function(elem) {
            var pos = elemPos(elem);

            reset();
            panel = DOC.createElement("div");

            panel.style.position = "absolute";
            panel.style.left = pos[0];
            panel.style.top = pos[1];
            panel.style.backgroundColor = "aliceblue";

            return function(pitemv, leadtext) {//add buttons to the panel
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

var tableCellOnClick = (function() {
    var sortByColumn = function(nth) {
        return function() {
            var curr = Env.curr();
            var cmpfn, flag;

            if (curr.sorted && curr.sorted.nth === nth) {
                flag = !curr.sorted.reverse;
            } else {
                flag = true;
            }

            cmpfn = getCmpFn(function (row) {
                return row[nth];
            }, flag);

            Env.pushData(
                getCopy(curr.data).sort(cmpfn),
                curr.headv,
                {nth: nth, reverse: flag}
            );
            Env.pageNavi("top");
        };
    };

    var groupByHosts = function(nth) {
        var aggr = function(r, rx) {//DON'T change r or rx
            var newr = [];
            var i, n = r.length;

            for (i = 0; i < n; i++) {
                if (i === nth) {
                    newr.push(r[i]);
                } else {
                    newr.push(Type.aggregate(r[i], rx[i]));
                }
            }
            return newr;
        };

        return function() {
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
                } else {
                    row.push(Type.count(1));
                    tmp[host] = aggr(sofar, row);
                }
            } //tmp is ready

            (function() { //form data, update Env, and go to new page
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

    var handleClickInTH = function(nth, element) {
        var ix = nth, iy;
        var data = Env.curr().data, ny = data.length;
        var pitem, pitemv = [];

        if (selection.flipCol(ix)) { //selected
            //skip leading NAs
            for (iy = 0; iy < ny; iy++) {
                if (Type.isNA(data[iy][ix])) continue;
                else break;
            }
            if (iy === ny) return;

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
        } else { //unselected
            ctrlPanel.reset();
        }
    };

    var handleClickInTD = function(nth, element) {
        //When a row is clicked, its state is flipped to x.
        
        //Try finding from above the nearest row that is in state x.
        //If there is one, add button A - "flip rows from above" to ctrl_panel.

        //Also try finding from below the nearest row that is in state x.
        //If there is one, add button B - "flip rows from below" to ctrl_panel.

        //Add button C - "flip rows from both above and below" to ctrl_panel
        //iff both button A and B have been added.

        var pitemv = [], pitem;
        var s = rows.flip(nth);
        var c = rows.ceiling(nth, s),
            f = rows.floor(nth, s);

        console.log("f: " + f + "; c: " + c);

        c = c === nth-1 || c < 0 ? //neighbor or underflow
            false : c;
        if (c !== false) {
            pitem = DOC.createElement("button");
            pitem.textContent = "above";
            pitem.addEventListener("click", function(event) {
                event.stopPropagation();
                rows.flipRangeEx(c, nth);
                ctrlPanel.reset();
            });
            pitemv.push(pitem)
        }
        
        f = f === nth+1 || f >= Env.curr().data.length ? //neighbor or overflow
            false : f;
        if (f !== false) {
            pitem = DOC.createElement("button");
            pitem.textContent = "below";
            pitem.addEventListener("click", function(event) {
                event.stopPropagation();
                rows.flipRangeEx(nth, f);
                ctrlPanel.reset();
            });
            pitemv.push(pitem);
        }
        
        if (c !== false && f !== false) {
            pitem = DOC.createElement("button");
            pitem.textContent = "both";
            pitem.addEventListener("click", function(event) {
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

    return function() { //handle a click on a table cell
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
        } else if (x.value + 0 === x.value) {
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
    var table = DOC.createElement("table"),
        colgroup = DOC.createElement("colgroup"),
        thead = DOC.createElement("thead"),
        tbody = DOC.createElement("tbody"),
        col, tr, th, td, span, sort_icon;

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
            } else {
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
    } else {
        v = arr.slice(0);
    }
    n = v.length;
    i = begin;

    console.assert(i >= 0 && i <= n, "makeSlice inv breaks");

    return {//i and n 
        empty: i === n,
        head: i === n ? null : v[i],
        tail: i === n ? this : htail(v, i + 1, true)
    };
}

chrome.history.search(
    {
        text: "",
        startTime: oneWeekAgo,
        endTime: now,
        maxResults: 1000000
    }, function(hv) { //establish the original data
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
            Env.pushData(data, ["visit time", "url", "transition", "gap"], {nth: 0, reverse: true});
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
        var cmpfn = getCmpFn(function(row) { return row[0]; },
                             true);
        var readSrc = function iter_urls(v, i) { //v:items to be read; i:# rows built
            var x, xs, url, next;

            if (v.empty)
                return;

            x = v.head;
            xs = v.tail;

            url = x.url;
            if (!url || url.slice(0, 4)!=="http") { //skip unimportant urls
                next = i;
            } else {
                chrome.history.getVisits({url: url}, function(vv) {
                    var vv = getVisits(vv);
                    var i, n = vv.length;
                    var title = x.title;
                    var url_obj = Type.url.cons(url, title? title.trim() : "");
                    var time;
                    
                    for (i = 0; i < n; i++) {
                        time = vv[i].visitTime;
                        //if (vv[i].transition=="link") {
                        data.push([time? Type.epoch(time) : Type.NA,
                                   url_obj,
                                   //Type.count(vv[i].visitId),
                                   Type.str(vv[i].transition),
                                   //Type.count(vv[i].referringVisitId)
                                  ]);
                        //}
                    }
                    if (xs.empty) {
                        data.sort(cmpfn);
                        n = data.length;
                        data[0].push(Type.duration(now - data[0][0].value.getTime()));
                        for (i = 1; i < n; i++) {
                            data[i].push(Type.duration(data[i-1][0].value.getTime() - data[i][0].value.getTime()));
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
    }
);


// TODO add "click" listener to cells that contains URLs, "unfold" the result set of getVisits
