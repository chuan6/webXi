var body = document.getElementsByTagName("body")[0];

function appendDOM(target, tag, text) {
    target.appendChild(
        document.createElement(tag).appendChild(
            document.createTextNode(text)));
}

function iterator(func) {
    return (
        function (arr) {
            for (var i=0; i < arr.length; i++) {
                func(arr[i]);
            }
        }
    );
}

function do_visit_item(x) {
    appendDOM(body, "div", JSON.stringify(x));
}

function do_history_item(x) {
    var url = x.url;
    chrome.history.getVisits(
        {url: url}, iterator(do_visit_item));
}

chrome.history.search(
    {text: "", maxResults: 1000000}, iterator(do_history_item));

