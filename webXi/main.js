var NA = "?"; //denote data that is not available

var Env = {
    stack: [],
    selectedCols: []
}; //the global environment built up 

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

function selectCol(nth) {
    var col = document.getElementById("c" + nth);
    var color_on = "#B3D4FC", color_off = "white";

    switch (!!Env.selectedCols[nth]) {
    case false:
        col.style.backgroundColor = color_on;
        Env.selectedCols[nth] = true;
        break;
    case true:
        col.style.backgroundColor = color_off;
        Env.selectedCols[nth] = false;
        break;
    }
}

function tableCellOnClick() {
    var tag = this.tagName.toLowerCase();
    
    if (tag === "th") { //column selected
        selectCol(Number(this.id.slice(1)));
    }
}

function consTR(idxv, row) {
    var i, n = idxv.length;
    var tr = document.createElement("tr"),
        td;
    var x;
    
    for (i = 0; i < n; i++) {
        console.assert(idxv[i] < row.length,
                       "idxv[i] < row.length");
        x = row[idxv[i]];
        
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

function consTABLE(headv, idxv, rowv) {
    console.assert(headv.length===idxv.length,
                   "headv and idxv have different lengthes");
    var i, m = headv.length;
    var j, n = rowv.length;
    var table = document.createElement("table"),
        colgroup = document.createElement("colgroup"),
        thead = document.createElement("thead"),
        tbody = document.createElement("tbody"),
        col, tr, th, td;

    // col's and th's
    tr = document.createElement("tr"); //row in thead
    for (i = 0; i < m; i++) {
        col = document.createElement("col");
        col.id = "c" + i;
        colgroup.appendChild(col);
        
        th = document.createElement("th");
        th.id = "h" + i;
        th.textContent = headv[i];
        th.addEventListener("click", tableCellOnClick);
        tr.appendChild(th);
    }
    table.appendChild(colgroup);
    thead.appendChild(tr);
    table.appendChild(thead);

    // tr's
    for (j = 0; j < n; j++) {
        tbody.appendChild(consTR(idxv, rowv[j]));
    }
    table.appendChild(tbody);
    table.style.borderCollapse = "collapse";
    return table;
}

function consDataFromSrc(src) {
    var data = [];
    var i, n = src.length;
    var h, x, url;

    for (i = 0; i < n; i++) {
        h = src[i];
        url = getData(h, "url");
        if (url && url.slice(0, 4) === "http") {
            data.push([
                getData(h, "id"),
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

        curr.data = consDataFromSrc(hv);
        curr.headv = ["url", "last visit time", "visit count", "typed count"];
        curr.table = consTABLE(curr.headv, [1, 2, 3, 4], curr.data);
        Env.stack.push(curr);

        //show the table
        document.body.appendChild(curr.table);
    }
);


// TODO sorting by a chosen column

// TODO add "click" listener to cells that contains URLs, "unfold" the result set of getVisits
