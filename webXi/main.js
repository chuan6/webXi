var DOC = document;

var Type = (function () {
    var str_t = 0, url_t = 1, epoch_t = 2, count_t = 3, duration_t = 4;
    var url_aggr_t = 10; //aggregation on urls returns url_aggr_t type
    var na_t = 11; // type for value "not available"

    var na = { type: na_t };

    return {
        NA: na,
        str: function(x) { return {type: str_t, value: "" + x}; },
        url: function(x, title) { return { type: url_t, value: [x, title] }; },
        epoch: function(x) { return { type: epoch_t, value: new Date(x) }; },
        count: function(x) { return { type: count_t, value: Number(x) }; },
        duration: function(x) { return { type: duration_t, value: x }; },
        show: function(x) {
            var v = x.value;
            var unit_str, tmp;
            
            switch (x.type) {
            case str_t:
                return v;
            case url_t:
                return "<a href=\"" + v[0] + "\">"
                    + (v[1]? v[1] : v[0])
                    .replace(/&/g, '&amp;')
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
                return "" + v.toFixed(3) + unit_str;
            case na_t:
                return "?";
            default:
                console.log("Type.show: unhandled type - " + x.type);
                return "";
            }
        },
        isNA: function(x) { return x === na; },
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
            
            if (ta !== b.type) {
                console.error("Error: Type.aggregate - arguments of different types.");
                return undefined;
            }

            switch (ta) {
            case url_t:
                return { type: url_aggr_t, value: [a.value, b.value] };
            case url_aggr_t:
                return { type: url_aggr_t, value: a.value.push(b.value) };
            case epoch_t:
                return {
                    type: epoch_t,
                    value: a.value.getTime() < b.value.getTime() ?
                        b.value : a.value
                };
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
    var col_sels = [];

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
            col_sels = [];
        },

        pageNavi: (function () {
            var back_button = DOC.getElementById("navi_back"),
                next_button = DOC.getElementById("navi_next");

            return function (type) {
                var prev_table = DOC.getElementById("table");

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
        })(),

        flipColumnSelection: (function () {
            var cid_prefix = "c"; //html id prefix for COL elements
            var color_on = "#B3D4FC", color_off = "white";

            return function (nth) {
                var is_selected, col, top = peek(stack);

                console.assert(
                    nth >= 0 && top && top.data && nth < top.data.length,
                    "Env.selectColumn: data[" + nth + "] is invalid.");

                //nth is a valid column of current data
                is_selected = col_sels[nth];
                col = DOC.getElementById(cid_prefix + nth);

                col.style.backgroundColor = is_selected ? color_off : color_on;
                col_sels[nth] = is_selected ? false : true;
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

function getHost(url) {
    var n = url.length, i;
    var step = 0; //process is done through steps
    var x, len;

    ITER:
    for (i = 0; i < n; i++) {
        x = url.charAt(i);
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
    return (step === 3 && len > 0) ? url.slice(i - len, i) : false;
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

function tableCellOnClick() {
    var cell = getEnclosingTableCell(this);
    var tag = cell.tagName; // "TH" or "TD"
    
    if (tag === "TH") { //column selected
        Env.flipColumnSelection(Number(cell.id.slice(1)));
    }
}

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

function isNumericCol(nth, rowv) {
    var i, n = rowv.length;
    var x;

    for (i = 0; i < n; i++) {
        x = rowv[i][nth];
        if (Type.isNA(x))
            continue;
        return Type.isSortable(x);
    }
    //if for all rows in rowv, value at nth column is NA, return
    //false; it is meaningless to sort by this column anyway
    return false;
}

function sortIconOnClick() {
    var nth = Number(getEnclosingTableCell(this).id.slice(1));
    var curr = Env.curr();
    var cmpfn, flag;

    if (curr.sorted && curr.sorted.nth === nth) {
        flag = !curr.sorted.reverse;
    } else {
        flag = true;
    }

    cmpfn = getCmpFn(function(row) {
        return row[nth];
    }, flag);

    Env.pushData(
        getCopy(curr.data).sort(cmpfn),
        curr.headv,
        { nth: nth, reverse: flag }
    );
    Env.pageNavi("top");
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
        if (isNumericCol(i, rowv)) {
            //add separator first
            span = DOC.createElement("span");
            span.textContent = "|";
            span.style.color = "gray";
            th.appendChild(span);

            //then add the sorting icon
            sort_icon = DOC.createElement("span");
            sort_icon.textContent = "⇵";
            sort_icon.style.color = "Blue";
            sort_icon.style.fontWeight = "bold";
            sort_icon.style.padding = "0px 4px";
            sort_icon.addEventListener("click", sortIconOnClick);
            th.appendChild(sort_icon);
        }
        tr.appendChild(th);
    }
    table.appendChild(colgroup);
    thead.appendChild(tr);
    table.appendChild(thead);

    // tr's
    for (j = 0; j < n; j++) {
        tbody.appendChild(consTR(rowv[j]));
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
            Env.pushData(data, ["visit time", "url", "visit", "transition", "from", "gap"], {nth: 0, reverse: true});
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
                    var url_obj = Type.url(url, //title? title.trim() :
                                           "");
                    var time;
                    
                    for (i = 0; i < n; i++) {
                        time = vv[i].visitTime;
                        //if (vv[i].transition=="link") {
                        data.push([time? Type.epoch(time) : Type.NA,
                                   url_obj,
                                   Type.count(vv[i].visitId),
                                   Type.str(vv[i].transition),
                                   Type.count(vv[i].referringVisitId)
                                  ]);
                        //}
                    }
                    if (xs.empty) {
                        data.sort(cmpfn);
                        n = data.length;
                        data[0].push(Type.duration(0));
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
