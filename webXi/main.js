var NA = "?"; //denote data that is not available

function getData(obj, property) {
    var x = obj[property];
    return x? x : NA;
}

function consURL(hx) {
    if (!hx.url)
        return false;
    //hx has property "url"

    //convert values of missing properties to NAs
    hx.lastVisitTime = getData(hx, "lastVisitTime");
    hx.visitCount = getData(hx, "visitCount");
    hx.typedCount = getData(hx, "typedCount");

    //attach corresponding html element: tr
    hx.htmlElem = function() {
        var td, tr = document.createElement("tr");
        
        td = document.createElement("td");
        td.textContent = hx.url;
        tr.appendChild(td);

        td = document.createElement("td");
        td.textContent = String(hx.lastVisitTime);
        tr.appendChild(td);
        
        td = document.createElement("td");
        td.textContent = String(hx.visitCount);
        td.style.textAlign = "right";
        tr.appendChild(td);

        td = document.createElement("td");
        td.textContent = String(hx.typedCount);
        td.style.textAlign = "right";
        tr.appendChild(td);

        return tr;
    }();

    return hx;
}

function batchAddEventListener(elems, event, handler) {
    var n = elems.length, i;
    for (i = 0; i < n; i++) {
	elems[i].addEventListener(event, handler);
    }
}

var millisecondsPerDay = 1000 * 60 * 60 * 24;
var now = (new Date()).getTime();
var oneDayAgo = now - millisecondsPerDay;
var oneWeekAgo = now - millisecondsPerDay * 7;
var oneMonthAgo = now - millisecondsPerDay * 28;
chrome.history.search(
    {
	text: "",
	startTime: oneDayAgo,
	endTime: now,
	maxResults: 1000000
    },
    function (hv) {
        var data = [];
        var n = hv.length;
        var i;

        for (i = 0; i < n; i++) {
            data.push(consURL(hv[i]));
        }

        document.body.appendChild(function() {
            var table = document.createElement("table"),
                colgroup = document.createElement("colgroup"),
                thead = document.createElement("thead"),
                tbody = document.createElement("tbody");
            var col, tr, th, td;
            var cs = ["url", "lastVisitTime", "visitCount", "typedCount"],
                m = cs.length;
            var j; //index for rows

            tr = document.createElement("tr");
            for (i = 0; i < m; i++) {
                col = document.createElement("col");
                col.id = "c" + i;
                colgroup.appendChild(col);

                th = document.createElement("th");
                th.id = "h" + i;
                th.textContent = cs[i];
                tr.appendChild(th);
            }
            thead.appendChild(tr);
            table.appendChild(colgroup);
            table.appendChild(thead);

            for (j = 0; j < n; j++) {
                tbody.appendChild(data[j].htmlElem);
            }
            table.appendChild(tbody);

            batchAddEventListener(table.getElementsByTagName("th"), "click", function() {
                var col = document.getElementById("c" + this.id.slice(1));
                var flag = "is-selected", on = "1", off = "0",
                    color_on = "#B3D4FC", color_off = "white";
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

            table.style.borderCollapse = "collapse";

            return table;
        }());
    }
);

// TODO sorting by a chosen column

// TODO add "click" listener to cells that contains URLs, "unfold" the result set of getVisits
