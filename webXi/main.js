var NA = "?"; //denote data that is not available

function getProperty(obj, property) {
    var v = obj[property];
    return v? v : NA;
}

var Env = { //the global environment built up
    stack: [],
    selectedCols: [],
    currentPage: -1
};

function peek(v) { //peek array as a stack
    var n = v.length;

    return n === 0? false : v[n-1];
}

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
    return (step === 3 && len > 0)? url.slice(i-len, i) : false;
}

function getCmpFn(f, reverseflag) {
    var x = reverseflag? -1 : 1;
    
    return function(a, b) {
        var va = f(a), vb = f(b);
        var r;

        if (va === vb) return 0;

        if (va === NA) {//vb !== NA
            r = -1;
        } else if (vb === NA) {
            r = 1;
        } else {//neither va nor vb equals NA
            r = va < vb? -1 : 1;
        }
        return x * r;
    };
}

function consBUTTON(id, label, actionfn) {
    var button = document.createElement("button");

    button.id = id;
    button.textContent = label;
    button.addEventListener("click", actionfn);
    return button;
}

function consCtrlPanel(ctrlv) {
    var ctrlpanel = document.createElement("p");
    var i, n = ctrlv.length;

    for (i = 0; i < n; i++) {
        ctrlpanel.appendChild(ctrlv[i]);
    }
    return ctrlpanel;
}

//flip the state of a column, also with change in style
function selectCol(nth) {
    var col = document.getElementById("c" + nth);
    var color_on = "#B3D4FC", color_off = "white";
    var ctrlpanel;

    if (Env.selectedCols[nth] === true) {
        col.style.backgroundColor = color_off;
        Env.selectedCols[nth] = false;
    } else {
        col.style.backgroundColor = color_on;
        Env.selectedCols[nth] = true;
    }

    //TODO add operation handles to the selected columns
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
        selectCol(Number(cell.id.slice(1)));
    }
}

function consTR(row) {
    var i, n = row.length;
    var td, tr = document.createElement("tr");
    var x;
    
    for (i = 0; i < n; i++) {
        x = row[i];
        
        td = document.createElement("td");
        if (x === NA) {
            td.style.textAlign = "center";
            td.textContent = "?";
        } else if (x + 0 === x) {
            td.style.textAlign = "right";
            td.textContent = String(x);
        } else {
            td.textContent = String(x);
        }
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
        if (x === NA)
            continue;
        return (x + 0 === x);
    }
    //if for all rows in rowv, value at nth column is NA, return
    //false; it is meaningless to sort by this column anyway
    return false;
}

function sortIconOnClick() {
    var nth = Number(getEnclosingTableCell(this).id.slice(1));
    
    updateEnv_sort(nth);
    pageNavi("top");
}

function consTABLE(headv, rowv) {
    var i, m = headv.length;
    var j, n = rowv.length;
    var table = document.createElement("table"),
        colgroup = document.createElement("colgroup"),
        thead = document.createElement("thead"),
        tbody = document.createElement("tbody"),
        col, tr, th, td, span, sort_icon;

    console.log("m: " + m + "; n: " + n);
    
    // col's and th's
    tr = document.createElement("tr"); //row in thead
    for (i = 0; i < m; i++) {
        col = document.createElement("col");
        col.id = "c" + i;
        colgroup.appendChild(col);
        
        th = document.createElement("th");
        th.id = "h" + i;
        span = document.createElement("span");
        span.textContent = headv[i];
        span.style.padding = "0px 4px";
        span.addEventListener("click", tableCellOnClick);
        th.appendChild(span);
        if (isNumericCol(i, rowv)) {
            //add separator first
            span = document.createElement("span");
            span.textContent = "|";
            span.style.color = "gray";
            th.appendChild(span);

            //then add the sorting icon
            sort_icon = document.createElement("span");
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
    return table;
}

function pageNavi(type) {
    var back_button = document.getElementById("navi_back"),
        next_button = document.getElementById("navi_next");
    var n = Env.stack.length,
        i = Env.currentPage;

    console.assert(i < n && i >= 0, "pageNavi: inv is broken");
    switch (type) {
    case "top":
        console.assert(n > 0, "pageNavi: empty Env.stack");
        i = n - 1;
        back_button.disabled = (i===0)? true : false;
        next_button.disabled = true;
        break;
    case "back":
        console.assert(i > 0, "pageNavi: no previous page");
        --i;
        back_button.disabled = (i===0)? true : false;
        next_button.disabled = false;
        break;
    case "next":
        console.assert(i < n-1, "pageNavi: no next page");
        ++i;
        back_button.disabled = false;
        next_button.disabled = (i===n-1)? true : false;
        break;
    case "bottom":
        console.assert(n > 0, "pageNavi: empty Env.stack");
        i = 0;
        back_button.disabled = true;
        next_button.disabled = (i===n-1)? true : false;
        break;
    }
    console.assert(i < n && i >= 0, "pageNavi: breaks inv");
    back_button.disabled = (i === 0? true : false);
    next_button.disabled = (i === n-1? true : false);
    
    Env.currentPage = i;
    document.body.replaceChild(Env.stack[Env.currentPage].table,
                               document.body.lastElementChild);
}

function getVisitsCounter(since) {
    return function(vv) {
        var c = 0;
        var i, n = vv.length;
        var x, time; //visit time

        for (i = n-1; i > -1; i--) {
            x = vv[i];
            time = x.visitTime;
            if (time && time >= since) {
                c++;
            } else {
                return c;
            }
        }
        return c;
    };
}

//sort data by the nth column
function updateEnv_sort(nth) {
    var flag, cmpfn;
    var curr = {}, prev = peek(Env.stack);

    if (prev.sorted && prev.sorted.nth===nth) {
        flag = !prev.sorted.reverse;
    } else {
        flag = true;
    }
    cmpfn = getCmpFn(function(row) { return row[nth]; }, flag);

    console.assert(prev, "cannot update on empty Env");

    curr.data = getCopy(prev.data).sort(cmpfn);
    curr.headv = prev.headv;
    curr.table = consTABLE(curr.headv, curr.data);
    curr.sorted = {nth: nth, reverse: flag};
    Env.stack.push(curr);
    Env.selectedCols = [];
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
        head: i === n? null : v[i],
        tail: i === n? this : htail(v, i + 1, true)
    };
}

chrome.history.search(
    {
        text: "",
        startTime: oneDayAgo,
        endTime: now,
        maxResults: 1000000
    }, function readsrc(hv) {
        var execAfterDataIsReady = function() {
            var curr = {};

            curr.data = data;
            curr.headv = ["url", "last visit time", "visit count"];
            curr.table = consTABLE(curr.headv, curr.data);
            curr.sorted = null;
            Env.stack.push(curr);
            Env.currentPage = 0;

            //show the table
            document.body.appendChild(curr.table);
            document.getElementById("navi_back").onclick
                = function() { pageNavi("back"); };
            document.getElementById("navi_next").onclick
                = function() { pageNavi("next"); };
        };
        var data = [];
        var countVisits = getVisitsCounter(oneDayAgo);

        (function recur(v, i) {
            var x, xs, url, next;

            if (v.empty)
                return;

            x = v.head;
            xs = v.tail;
            url = getProperty(x, "url");
            
            if (url === NA || url.slice(0, 4) !== "http") {
                next = i;
            } else {
                chrome.history.getVisits({url: url}, function(vv) {
                    data[i] = [
                        url,
                        getProperty(x, "lastVisitTime"),
                        countVisits(vv)
                    ];
                    if (xs.empty) //finished
                        execAfterDataIsReady();
                });
                next = i + 1;
            }
            recur(xs, next);
        })(htail(hv, 0), 0);
    }
);


// TODO sorting by a chosen column

// TODO add "click" listener to cells that contains URLs, "unfold" the result set of getVisits
