function cons_colgroup(data) {
    var n = data.cols.length,
        colgroup = document.createElement("colgroup"),
        i, col;

    for (i = 0; i < n; i++) {
        col = document.createElement("col");
        col.id = "c" + i;
        colgroup.appendChild(col);
    }
    return colgroup;
}

function cons_thead(data) {
    var v = data.cols,
        n = v.length,
        thead = document.createElement("thead"),
        tr = document.createElement("tr"),
        i, th;

    for (i = 0; i < n; i++) {
        th = document.createElement("th");
        th.id = "h" + i;
        th.textContent = v[i];
        tr.appendChild(th);
    }
    thead.appendChild(tr);
    return thead;
}

function cons_tbody(data) {
    var ncols = data.cols.length,
        nrows = data.rows.length,
        tbody = document.createElement("tbody"),
        i, j, x, tr, td;

    for (i = 0; i < nrows; i++) {
        tr = document.createElement("tr");
        x = data.rows[i];
        for (j = 0; j < ncols; j++) {
            td = document.createElement("td");
            td.textContent = String(x[j]);
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
    }
    return tbody;
}

var sample = {
    cols: ["id", "url", "lastVisitTime", "title", "visitCount", "typedCount"],
    rows: [
        ["1", "https://github.com/chuan6", "chuan6(chuan6)", 123457895, 32, 12],
        ["2", "https://www.google.com", "Google Search", 123457700, 76, 3],
        ["5", "https://www.arstechnica.com", "Ars Technica", 123452345, 20, 18],
        ["3", "https://www.apple.com", "Apple", 12345800, 4, 2],
        ["6", "https://www.baidu.com", "Baidu", 1234514364, 2, 1],
        ["2", "http://www.theverge.com", "The Verge", 123457890, 14, 4]
    ]
};
var table = document.createElement("table");
table.appendChild(cons_colgroup(sample));
table.appendChild(cons_thead(sample));
table.appendChild(cons_tbody(sample));
document.body.appendChild(table);

var do_test_query_urls = function (table) {
    var hitems = do_query(test_query_urls, table);
    var i, n = hitems.length;
    appendDOM(body, "p", n.toString() + " records");
    for (i = 0; i < n; i++) {
        appendDOM(body, "div", JSON.stringify(hitems[i]));
    }
};

var millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
var now = (new Date()).getTime();
var oneWeekAgo = now - millisecondsPerWeek;
var oneMonthAgo = now - millisecondsPerWeek*4;

chrome.app.runtime.onLaunched.addListener(function() {
    chrome.app.window.create('index.html',
        {'bounds': {'width': 400, 'height': 500}});
    chrome.history.search({
        text: "",
        startTime: oneMonthAgo,
        endTime: now,
        maxResults: 1000000},
        do_test_query_urls);
});

// make side-effect over an array
function iterator(func) {
    return (
        function (arr) {
            for (var i=0; i < arr.length; i++) {
                func(arr[i]);
            }
        }
    );
}

// evaluate over an array
function reduce(fn, init, arr) {
    var env = init;
    var i;
    for (i = 0; i < arr.length; i++) {
        env = fn(env, arr[i]);
    }
    return env;
}

// table-to-table query
function do_query(q, table) {
    var do_row = function (env, x) {
        var v = q(x);
        if (v)
            env.push(v);
        return env;
    };
    return reduce(do_row, [], table);
}

// provide SELECT and WHERE
function query(cols, pred) {
    return function (row) {
        var n = cols.length;
        var ret, i;
        if (pred(row) == true) {
            ret = [];
            for (i = 0; i < n; i++) {
                ret.push(row[cols[i]]);
            }
        }
        // else, ret is undefined
        return ret;
    };
}

var body = document.getElementsByTagName("body")[0];

function appendDOM(target, tag, text) {
    target.appendChild(
        document.createElement(tag).appendChild(
            document.createTextNode(text)));
}

function do_visit_item(x) {
    appendDOM(body, "div", JSON.stringify(x));
}

function do_history_item(x) {
    var url = x.url;
    chrome.history.getVisits(
        {url: url}, iterator(do_visit_item));
}

var test_query_urls = query(
    ["url", "visitCount"],
    function (row) {
        return row["visitCount"] > 2;
    }
);

function filter(pred, vec) {
    var r=[], n=vec.length, i, x;

    for (i = 0; i < n; i++) {
        x = vec[i]
        if (pred(x)) r.push(x);
    }
    return r;
}

function map(f, vec) {
    var r=[], n=vec.length, i;

    for (i = 0; i < n; i++) {
        r.push(f(vec[i]));
    }
    return r;
}

function url_isHttp(url_str) {
    
}
