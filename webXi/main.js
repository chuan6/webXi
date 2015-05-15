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
        return row["visitCount"] > 1;
    }
);

var do_test_query_urls = function (table) {
    var hitems = do_query(test_query_urls, table);
    var i, n = hitems.length;
    for (i = 0; i < n; i++) {
        appendDOM(body, "div", JSON.stringify(hitems[i]));
    }
};

chrome.history.search(
    {text: "", maxResults: 1000000}, do_test_query_urls);

