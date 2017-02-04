function getHost(s: string): string {
  var c, cs = Array.from(s);
  var i, n = cs.length;
  var host_nchars;
  var step = 0; //process is done through steps

  ITER:
  for (i = 0; i < n; i++) {
    c = cs[i];
    switch (step) {
    case 0: //move towards the first colon;
      if (c === ':') step++;
      break;
    case 1: //consume the following '/';
      if (c === '/') {
        step++; break;
      } else {
        break ITER;
      }
    case 2: //consume the following '/', and set begin
      if (c === '/') {
        host_nchars = 0; step++; break;
      } else {
        break ITER;
      }
    case 3: //move towards the next '/' or ':', or the end
      if (c === '/' || c === ':')
        break ITER;
      host_nchars++; //count a char of the host
    }
  }
  return (step===3 && host_nchars>0 ?
          cs.slice(i-host_nchars, i).join("") :
          "");
}

function htmlstr_a(url, title): string {
  var safe = url.replace(/[&"<>]/g, function (c) {
    return { '&': '&amp;',
             '"': '&quot;',
             '<': '&lt',
             '>': '&gt'     }[c];
  })
  return `<a href=${url} title=${title}>${safe}</a>`;
}

function timestr_dura(ms): [number, string] {
  var units = [[60, 's'],
               [60, 'm'],
               [24, 'h'],
               [1, 'd']];
  var tmp = ms/1000;
  var n, s;

  for (let i = 0; i < units.length; i++) {
    [n, s] = units[i];
    if (tmp < n)
      break;
    tmp /= n;
  }
  return [tmp, s];
}

const enum _t {
  str,
  url,
  epoch,
  count,
  duration,
  url_aggr, // aggregation on urls returns url_aggr type
  not_avail // type for value "not available"
}

interface str       { kind: _t.str,      value: string }
interface url       { kind: _t.url,      value: [string, string] }
interface epoch     { kind: _t.epoch,    value: Date }
interface count     { kind: _t.count,    value: number }
interface duration  { kind: _t.duration, value: number }
interface url_aggr  { kind: _t.url_aggr, value: [string, string][] }
interface not_avail { kind: _t.not_avail }

export type cell = str | url | epoch | count | duration | url_aggr | not_avail;

var na = { kind: _t.not_avail };

export const NA = na;

export function str(x): str {
  return { kind: _t.str, value: "" + x};
}

export function url(x, title): url {
  return { kind: _t.url, value: [x, title] }
}

export function epoch(x): epoch {
  return { kind: _t.epoch, value: new Date(x) };
}

export function count(x): count {
  return { kind: _t.count, value: Number(x) };
}

export function duration(x): duration {
  return { kind: _t.duration, value: x };
}

export function urlGetHost(u: url): string {
  return getHost(u.value[0]);
}

export function isUrl(x: cell): boolean {
  return x.kind === _t.url;
}

export function show(x: cell): string {//return a readable string
  var v;
  var time_value: number, time_unit: string;
  
  switch (x.kind) {
  case _t.str:
    return x.value;

  case _t.url:
    v = x.value;
    return htmlstr_a(v[0], v[1])

  case _t.epoch:
    return x.value.toLocaleString();

  case _t.count:
    return String(x.value);

  case _t.duration:
    [time_value, time_unit] = timestr_dura(x.value)
    return time_value.toFixed(2) + " " + time_unit;

  case _t.not_avail:
    return "?";

  default:
    console.log("Type.show: unhandled type - " + x.kind);
    return "";
  }
}

export function isNA(x): boolean {
  return x === na;
}

export function isSortable(x: cell): boolean {
  switch (x.kind) {
  case _t.str: case _t.epoch: case _t.count: case _t.duration:
    return true;
  default:
    return false;
  }
}

export function cmp(a: cell, b: cell): number {
  var bv;
  if (a !== na && b !== na) {
    console.assert(
      a.kind===b.kind,
      "Type.less: expect arguments of the same type.");
    switch (a.kind) {
    case _t.str:
      return a.value.localeCompare((b as str).value);
    case _t.epoch:
      return a.value.getTime() - (b as epoch).value.getTime();
    case _t.count:
      return a.value - (b as count).value;
    case _t.duration:
      return a.value - (b as duration).value;
    default:
      return 0;
    }
  } //a===na || b===na

  if (a === b) //both a and b equal na
    return 0;
  if (a === na) //a equals na, while b doesn't
    return -1;
  return 1; //b equals na, while a doesn't
}

export function aggregate(a: cell, b: cell): cell {
  // note: always try create new value "from strach"
  var tmp;
  switch (a.kind) {
  case _t.url:
    return {
      kind: _t.url_aggr,
      value: [a.value, (b as url).value]
    };
  case _t.url_aggr:
    // note: shallow copy of a.value, might cause problems
    return {
      kind: _t.url_aggr,
      value: [...a.value, (b as url).value]
    };
  case _t.str:
    return {
      kind: _t.str,
      value: a.value + ", " + (b as str).value
    };
  case _t.epoch:
    tmp = (b as epoch).value
    return {
      kind: _t.epoch,
      value: a.value.getTime() < tmp.getTime() ?
        tmp : a.value
    };
  case _t.duration:
    return {
      kind: _t.duration,
      value: a.value + (b as duration).value
    };
  case _t.count:
    return {
      kind: _t.count,
      value: a.value + (b as count).value
    };
  default:
    console.error("Error: Type.aggregate - invalid type.");
    return undefined;
  }
}
