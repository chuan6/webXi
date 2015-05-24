var NA = "?"; //denote data that is not available

function getData(obj, property) {
    var x = obj[property];
    return x? x : NA;
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

    return (step === 3 && len > 0)? url.slice(i-len, i) : false;
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

function groupByHost(data) {
    var i, n = data.length;
    var x, host;
    var item, container = {}, vec = [];
    for (i = 0; i < n; i++) {
        x = data[i];
        host = getHost(x.url);
        if (!host)
            continue;

        item = getData(container, host);
        if (item === NA) {
            container[host] = {
                host: host,
                lastVisitTime: x.lastVisitTime,
                visitCount: x.visitCount,
                typedCount: x.typedCount
            };
        } else {
            if (x.lastVisitTime > item.lastVisitTime)
                item.lastVisitTime = x.lastVisitTime;
            if (item.visitCount === NA && x.visitCount !== NA)
                item.visitCount = x.visitCount;
            if (item.visitCount !== NA && x.visitCount !== NA)
                item.visitCount += x.visitCount;
            if (item.typedCount === NA && x.typedCount !== NA)
                item.typedCount = x.typedCount;
            if (item.typedCount !== NA && x.typedCount !== NA)
                item.typedCount += x.typedCount;
        }
    }

    for (host in container) {
        item = container[host];
        item.htmlElem = function() {
            var td, tr = document.createElement("tr");
            
            td = document.createElement("td");
            td.textContent = item.host;
            tr.appendChild(td);

            td = document.createElement("td");
            td.textContent = String(item.lastVisitTime);
            tr.appendChild(td);
            
            td = document.createElement("td");
            td.textContent = String(item.visitCount);
            td.style.textAlign = "right";
            tr.appendChild(td);

            td = document.createElement("td");
            td.textContent = String(item.typedCount);
            td.style.textAlign = "right";
            tr.appendChild(td);

            return tr;
        }();
        vec.push(item);
    }
    vec.sort(function (a, b) {
        return b.lastVisitTime - a.lastVisitTime;
    });
    return vec;
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
        data.sort(function (a, b) {
            return b.lastVisitTime - a.lastVisitTime;
        });

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

        // group by hosts
        data = groupByHost(data);
        n = data.length;
        document.body.replaceChild(function() {
            var table = document.createElement("table"),
                colgroup = document.createElement("colgroup"),
                thead = document.createElement("thead"),
                tbody = document.createElement("tbody");
            var col, tr, th, td;
            var cs = ["host", "lastVisitTime", "visitCount", "typedCount"],
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
        }(), document.body.lastElementChild);
    }
);

// TODO sorting by a chosen column

// TODO add "click" listener to cells that contains URLs, "unfold" the result set of getVisits
