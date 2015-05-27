var NA = "?"; //denote data that is not available

var Env = {
    stack: [],
    selectedCols: []
}; //the global environment built up 

function peek(v) {
    var n = v.length;

    return n === 0? false : v[n-1];
}

function makeDataCopy() {    
    var curr = [], prev = peek(Env.stack).data;
    var i, n = prev.length;

    if (n === 0)
        return curr;

    //assumptions:
    //1. data is a two-dimension array;
    //2. each atomic element in data is either a string or a
    //   number (thus slice() can be used to copy each row);
    for (i = 0; i < n; i++) {
        curr.push(prev[i].slice());
    }
    return curr;
}

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

function getEnclosingTableCell(node) {
    var elem = node.parentNode;
    var tag = elem.tagName.toLowerCase();
    
    if (tag === "th" || tag === "td")
        return elem;
    return false;
}

function tableCellOnClick() {
    var cell = getEnclosingTableCell(this);
    var tag = cell.tagName.toLowerCase(); // "th" or "td"
    
    if (tag === "th") { //column selected
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

var sortIconClickHandler = (function() {
    var state = false;

    return function() {
        console.log(state);
        var nth = Number(getEnclosingTableCell(this).id.slice(1));
        
        updateEnv_sort(nth, state);
        state = !state;
        mountNewTABLE(peek(Env.stack).table);
    };
})();

function consTABLE(headv, rowv) {
    var i, m = headv.length;
    var j, n = rowv.length;
    var table = document.createElement("table"),
        colgroup = document.createElement("colgroup"),
        thead = document.createElement("thead"),
        tbody = document.createElement("tbody"),
        col, tr, th, td, span, sort_icon;

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
            sort_icon.textContent = "↕";
            sort_icon.style.color = "Blue";
            sort_icon.style.fontWeight = "bold";
            sort_icon.style.padding = "0px 4px";
            sort_icon.addEventListener("click", sortIconClickHandler);
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

function mountNewTABLE(table) {
    console.log("mount new table");
    document.body.replaceChild(table, document.body.lastElementChild);
}

//initialize data from the result of chrome.history.search
function initData(src) {
    var data = [];
    var i, n = src.length;
    var h, x, url;

    for (i = 0; i < n; i++) {
        h = src[i];
        url = getData(h, "url");
        if (url && url.slice(0, 4) === "http") {
            data.push([
                url,
                getData(h, "lastVisitTime"),
                getData(h, "visitCount"),
                getData(h, "typedCount")
            ]);
        } else {
            continue;
        }
    }
    return data;
}

//sort data by the nth column
function updateEnv_sort(nth, reverseflag) {
    var cmpfn = getCmpFn(
        function(row) { return row[nth]; },
        reverseflag
    );
    var curr = {}, prev = peek(Env.stack);

    console.assert(prev, "cannot update on empty Env");

    curr.data = makeDataCopy().sort(cmpfn);
    curr.headv = prev.headv;
    curr.table = consTABLE(curr.headv, curr.data);
    Env.stack.push(curr);
    Env.selectedCols = [];
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
    }, function(hv) {
        var curr = {};

        curr.data = initData(hv);
        curr.headv = ["url", "last visit time", "visit count", "typed count"];
        curr.table = consTABLE(curr.headv, curr.data);
        Env.stack.push(curr);

        //show the table
        document.body.appendChild(curr.table);
    }
);


// TODO sorting by a chosen column

// TODO add "click" listener to cells that contains URLs, "unfold" the result set of getVisits
