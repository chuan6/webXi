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
            if (x[j] + 0 === x[j]) { //x[j] is a number
                td.textContent = String(x[j]);
                td.style.textAlign = "right"; //left-align a number
            } else {
                td.textContent = String(x[j]);
            }
            tr.appendChild(td);
        }
        tbody.appendChild(tr);
        data.rows[i].html = tr;
    }
    return tbody;
}

function batchAddEventListener(elems, event, handler) {
    var n = elems.length, i;
    for (i = 0; i < n; i++) {
        elems[i].addEventListener(event, handler);
    }
}

var millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
var now = (new Date()).getTime();
var oneWeekAgo = now - millisecondsPerWeek;
var oneMonthAgo = now - millisecondsPerWeek*4;
chrome.history.search(
    {
        text: "",
        startTime: oneWeekAgo,
        endTime: now,
        maxResults: 1000000
    },
    function (v) {
        var cs = ["id", "url", "title", "lastVisitTime", "visitCount", "typedCount"],
            rs = [],
            m = v.length, n = cs.length,
            i, j, x, y, r, data,
            table, theads, tbody;

        for (i = 0; i < m; i++) {
            r = [];
            x = v[i];
            for (j = 0; j < n; j++) {
                y = x[cs[j]];
                if (y) {
                    r.push(y);
                } else {
                    r.push("?"); // use ? to fill empty slots
                }
            } // r is ready
            rs.push(r);
        } // rs is ready
        data = {cols: cs, rows: rs};

        table = document.createElement("table");
        //table.style.border = "1px solid grey";
        table.style.borderCollapse = "collapse";
        table.appendChild(cons_colgroup(data));
        table.appendChild(cons_thead(data));
        table.appendChild(cons_tbody(data));
        var theads = table.getElementsByTagName("thead")[0].getElementsByTagName("tr")[0].children;
        batchAddEventListener(theads, "click", function() {
            var col = document.getElementById("c" + this.id.slice(1)),
                color_off = "white",
                color_on = "#B3D4FC",
                flag = "is-selected", on = "1", off = "0";
            console.log(col.getAttribute(flag));
            switch (col.getAttribute(flag)) {
                case off:
                    col.setAttribute(flag, on);
                    col.style.backgroundColor = color_on;
                    break;
                case on:
                    col.setAttribute(flag, off);
                    col.style.backgroundColor = color_off;
                    break;
                default:
                    col.setAttribute(flag, on);
                    col.style.backgroundColor = color_on;
            }
        });
        document.body.appendChild(table);

        data.rows = data.rows.sort(function(a, b) {
            var x = a[4], y = b[4];
            if (x === y) return 0;
            if (x === "?") {
                //console.log("x === ?");
                return 1;
            }
            if (y === "?") {
                //console.log("y === ?");
                return -1;
            }
            return y - x;
        });
        console.log("#rows: " + data.rows.length);
        tbody = document.createElement("tbody");
        for (i = 0; i < m; i++) {
            //console.log(data.rows[i]);
            tbody.appendChild(data.rows[i].html);
        }
        table.removeChild(table.childNodes[2]);
        table.appendChild(tbody);
    });

// TODO sorting by a chosen column

// TODO add "click" listener to cells that contains URLs, "unfold" the result set of getVisits