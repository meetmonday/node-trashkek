// node_modules/preact/dist/preact.module.js
var n;
var l;
var u;
var t;
var i;
var r;
var o;
var e;
var f;
var c;
var a;
var s;
var h;
var p;
var v;
var y;
var d = {};
var w = [];
var _ = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
var g = Array.isArray;
function m(n2, l2) {
  for (var u2 in l2)
    n2[u2] = l2[u2];
  return n2;
}
function b(n2) {
  n2 && n2.parentNode && n2.parentNode.removeChild(n2);
}
function k(l2, u2, t2) {
  var i2, r2, o2, e2 = {};
  for (o2 in u2)
    o2 == "key" ? i2 = u2[o2] : o2 == "ref" ? r2 = u2[o2] : e2[o2] = u2[o2];
  if (arguments.length > 2 && (e2.children = arguments.length > 3 ? n.call(arguments, 2) : t2), typeof l2 == "function" && l2.defaultProps != null)
    for (o2 in l2.defaultProps)
      e2[o2] === undefined && (e2[o2] = l2.defaultProps[o2]);
  return x(l2, e2, i2, r2, null);
}
function x(n2, t2, i2, r2, o2) {
  var e2 = { type: n2, props: t2, key: i2, ref: r2, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: undefined, __v: o2 == null ? ++u : o2, __i: -1, __u: 0 };
  return o2 == null && l.vnode != null && l.vnode(e2), e2;
}
function S(n2) {
  return n2.children;
}
function C(n2, l2) {
  this.props = n2, this.context = l2;
}
function $(n2, l2) {
  if (l2 == null)
    return n2.__ ? $(n2.__, n2.__i + 1) : null;
  for (var u2;l2 < n2.__k.length; l2++)
    if ((u2 = n2.__k[l2]) != null && u2.__e != null)
      return u2.__e;
  return typeof n2.type == "function" ? $(n2) : null;
}
function I(n2) {
  if (n2.__P && n2.__d) {
    var u2 = n2.__v, t2 = u2.__e, i2 = [], r2 = [], o2 = m({}, u2);
    o2.__v = u2.__v + 1, l.vnode && l.vnode(o2), q(n2.__P, o2, u2, n2.__n, n2.__P.namespaceURI, 32 & u2.__u ? [t2] : null, i2, t2 == null ? $(u2) : t2, !!(32 & u2.__u), r2), o2.__v = u2.__v, o2.__.__k[o2.__i] = o2, D(i2, o2, r2), u2.__e = u2.__ = null, o2.__e != t2 && P(o2);
  }
}
function P(n2) {
  if ((n2 = n2.__) != null && n2.__c != null)
    return n2.__e = n2.__c.base = null, n2.__k.some(function(l2) {
      if (l2 != null && l2.__e != null)
        return n2.__e = n2.__c.base = l2.__e;
    }), P(n2);
}
function A(n2) {
  (!n2.__d && (n2.__d = true) && i.push(n2) && !H.__r++ || r != l.debounceRendering) && ((r = l.debounceRendering) || o)(H);
}
function H() {
  try {
    for (var n2, l2 = 1;i.length; )
      i.length > l2 && i.sort(e), n2 = i.shift(), l2 = i.length, I(n2);
  } finally {
    i.length = H.__r = 0;
  }
}
function L(n2, l2, u2, t2, i2, r2, o2, e2, f2, c2, a2) {
  var s2, h2, p2, v2, y2, _2, g2, m2 = t2 && t2.__k || w, b2 = l2.length;
  for (f2 = T(u2, l2, m2, f2, b2), s2 = 0;s2 < b2; s2++)
    (p2 = u2.__k[s2]) != null && (h2 = p2.__i != -1 && m2[p2.__i] || d, p2.__i = s2, _2 = q(n2, p2, h2, i2, r2, o2, e2, f2, c2, a2), v2 = p2.__e, p2.ref && h2.ref != p2.ref && (h2.ref && J(h2.ref, null, p2), a2.push(p2.ref, p2.__c || v2, p2)), y2 == null && v2 != null && (y2 = v2), (g2 = !!(4 & p2.__u)) || h2.__k === p2.__k ? (f2 = j(p2, f2, n2, g2), g2 && h2.__e && (h2.__e = null)) : typeof p2.type == "function" && _2 !== undefined ? f2 = _2 : v2 && (f2 = v2.nextSibling), p2.__u &= -7);
  return u2.__e = y2, f2;
}
function T(n2, l2, u2, t2, i2) {
  var r2, o2, e2, f2, c2, a2 = u2.length, s2 = a2, h2 = 0;
  for (n2.__k = new Array(i2), r2 = 0;r2 < i2; r2++)
    (o2 = l2[r2]) != null && typeof o2 != "boolean" && typeof o2 != "function" ? (typeof o2 == "string" || typeof o2 == "number" || typeof o2 == "bigint" || o2.constructor == String ? o2 = n2.__k[r2] = x(null, o2, null, null, null) : g(o2) ? o2 = n2.__k[r2] = x(S, { children: o2 }, null, null, null) : o2.constructor === undefined && o2.__b > 0 ? o2 = n2.__k[r2] = x(o2.type, o2.props, o2.key, o2.ref ? o2.ref : null, o2.__v) : n2.__k[r2] = o2, f2 = r2 + h2, o2.__ = n2, o2.__b = n2.__b + 1, e2 = null, (c2 = o2.__i = O(o2, u2, f2, s2)) != -1 && (s2--, (e2 = u2[c2]) && (e2.__u |= 2)), e2 == null || e2.__v == null ? (c2 == -1 && (i2 > a2 ? h2-- : i2 < a2 && h2++), typeof o2.type != "function" && (o2.__u |= 4)) : c2 != f2 && (c2 == f2 - 1 ? h2-- : c2 == f2 + 1 ? h2++ : (c2 > f2 ? h2-- : h2++, o2.__u |= 4))) : n2.__k[r2] = null;
  if (s2)
    for (r2 = 0;r2 < a2; r2++)
      (e2 = u2[r2]) != null && (2 & e2.__u) == 0 && (e2.__e == t2 && (t2 = $(e2)), K(e2, e2));
  return t2;
}
function j(n2, l2, u2, t2) {
  var i2, r2;
  if (typeof n2.type == "function") {
    for (i2 = n2.__k, r2 = 0;i2 && r2 < i2.length; r2++)
      i2[r2] && (i2[r2].__ = n2, l2 = j(i2[r2], l2, u2, t2));
    return l2;
  }
  n2.__e != l2 && (t2 && (l2 && n2.type && !l2.parentNode && (l2 = $(n2)), u2.insertBefore(n2.__e, l2 || null)), l2 = n2.__e);
  do {
    l2 = l2 && l2.nextSibling;
  } while (l2 != null && l2.nodeType == 8);
  return l2;
}
function O(n2, l2, u2, t2) {
  var i2, r2, o2, e2 = n2.key, f2 = n2.type, c2 = l2[u2], a2 = c2 != null && (2 & c2.__u) == 0;
  if (c2 === null && e2 == null || a2 && e2 == c2.key && f2 == c2.type)
    return u2;
  if (t2 > (a2 ? 1 : 0)) {
    for (i2 = u2 - 1, r2 = u2 + 1;i2 >= 0 || r2 < l2.length; )
      if ((c2 = l2[o2 = i2 >= 0 ? i2-- : r2++]) != null && (2 & c2.__u) == 0 && e2 == c2.key && f2 == c2.type)
        return o2;
  }
  return -1;
}
function z(n2, l2, u2) {
  l2[0] == "-" ? n2.setProperty(l2, u2 == null ? "" : u2) : n2[l2] = u2 == null ? "" : typeof u2 != "number" || _.test(l2) ? u2 : u2 + "px";
}
function N(n2, l2, u2, t2, i2) {
  var r2, o2;
  n:
    if (l2 == "style")
      if (typeof u2 == "string")
        n2.style.cssText = u2;
      else {
        if (typeof t2 == "string" && (n2.style.cssText = t2 = ""), t2)
          for (l2 in t2)
            u2 && l2 in u2 || z(n2.style, l2, "");
        if (u2)
          for (l2 in u2)
            t2 && u2[l2] == t2[l2] || z(n2.style, l2, u2[l2]);
      }
    else if (l2[0] == "o" && l2[1] == "n")
      r2 = l2 != (l2 = l2.replace(s, "$1")), o2 = l2.toLowerCase(), l2 = o2 in n2 || l2 == "onFocusOut" || l2 == "onFocusIn" ? o2.slice(2) : l2.slice(2), n2.l || (n2.l = {}), n2.l[l2 + r2] = u2, u2 ? t2 ? u2[a] = t2[a] : (u2[a] = h, n2.addEventListener(l2, r2 ? v : p, r2)) : n2.removeEventListener(l2, r2 ? v : p, r2);
    else {
      if (i2 == "http://www.w3.org/2000/svg")
        l2 = l2.replace(/xlink(H|:h)/, "h").replace(/sName$/, "s");
      else if (l2 != "width" && l2 != "height" && l2 != "href" && l2 != "list" && l2 != "form" && l2 != "tabIndex" && l2 != "download" && l2 != "rowSpan" && l2 != "colSpan" && l2 != "role" && l2 != "popover" && l2 in n2)
        try {
          n2[l2] = u2 == null ? "" : u2;
          break n;
        } catch (n3) {}
      typeof u2 == "function" || (u2 == null || u2 === false && l2[4] != "-" ? n2.removeAttribute(l2) : n2.setAttribute(l2, l2 == "popover" && u2 == 1 ? "" : u2));
    }
}
function V(n2) {
  return function(u2) {
    if (this.l) {
      var t2 = this.l[u2.type + n2];
      if (u2[c] == null)
        u2[c] = h++;
      else if (u2[c] < t2[a])
        return;
      return t2(l.event ? l.event(u2) : u2);
    }
  };
}
function q(n2, u2, t2, i2, r2, o2, e2, f2, c2, a2) {
  var s2, h2, p2, v2, y2, d2, _2, k2, x2, M, $2, I2, P2, A2, H2, T2 = u2.type;
  if (u2.constructor !== undefined)
    return null;
  128 & t2.__u && (c2 = !!(32 & t2.__u), o2 = [f2 = u2.__e = t2.__e]), (s2 = l.__b) && s2(u2);
  n:
    if (typeof T2 == "function")
      try {
        if (k2 = u2.props, x2 = T2.prototype && T2.prototype.render, M = (s2 = T2.contextType) && i2[s2.__c], $2 = s2 ? M ? M.props.value : s2.__ : i2, t2.__c ? _2 = (h2 = u2.__c = t2.__c).__ = h2.__E : (x2 ? u2.__c = h2 = new T2(k2, $2) : (u2.__c = h2 = new C(k2, $2), h2.constructor = T2, h2.render = Q), M && M.sub(h2), h2.state || (h2.state = {}), h2.__n = i2, p2 = h2.__d = true, h2.__h = [], h2._sb = []), x2 && h2.__s == null && (h2.__s = h2.state), x2 && T2.getDerivedStateFromProps != null && (h2.__s == h2.state && (h2.__s = m({}, h2.__s)), m(h2.__s, T2.getDerivedStateFromProps(k2, h2.__s))), v2 = h2.props, y2 = h2.state, h2.__v = u2, p2)
          x2 && T2.getDerivedStateFromProps == null && h2.componentWillMount != null && h2.componentWillMount(), x2 && h2.componentDidMount != null && h2.__h.push(h2.componentDidMount);
        else {
          if (x2 && T2.getDerivedStateFromProps == null && k2 !== v2 && h2.componentWillReceiveProps != null && h2.componentWillReceiveProps(k2, $2), u2.__v == t2.__v || !h2.__e && h2.shouldComponentUpdate != null && h2.shouldComponentUpdate(k2, h2.__s, $2) === false) {
            u2.__v != t2.__v && (h2.props = k2, h2.state = h2.__s, h2.__d = false), u2.__e = t2.__e, u2.__k = t2.__k, u2.__k.some(function(n3) {
              n3 && (n3.__ = u2);
            }), w.push.apply(h2.__h, h2._sb), h2._sb = [], h2.__h.length && e2.push(h2);
            break n;
          }
          h2.componentWillUpdate != null && h2.componentWillUpdate(k2, h2.__s, $2), x2 && h2.componentDidUpdate != null && h2.__h.push(function() {
            h2.componentDidUpdate(v2, y2, d2);
          });
        }
        if (h2.context = $2, h2.props = k2, h2.__P = n2, h2.__e = false, I2 = l.__r, P2 = 0, x2)
          h2.state = h2.__s, h2.__d = false, I2 && I2(u2), s2 = h2.render(h2.props, h2.state, h2.context), w.push.apply(h2.__h, h2._sb), h2._sb = [];
        else
          do {
            h2.__d = false, I2 && I2(u2), s2 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s;
          } while (h2.__d && ++P2 < 25);
        h2.state = h2.__s, h2.getChildContext != null && (i2 = m(m({}, i2), h2.getChildContext())), x2 && !p2 && h2.getSnapshotBeforeUpdate != null && (d2 = h2.getSnapshotBeforeUpdate(v2, y2)), A2 = s2 != null && s2.type === S && s2.key == null ? E(s2.props.children) : s2, f2 = L(n2, g(A2) ? A2 : [A2], u2, t2, i2, r2, o2, e2, f2, c2, a2), h2.base = u2.__e, u2.__u &= -161, h2.__h.length && e2.push(h2), _2 && (h2.__E = h2.__ = null);
      } catch (n3) {
        if (u2.__v = null, c2 || o2 != null)
          if (n3.then) {
            for (u2.__u |= c2 ? 160 : 128;f2 && f2.nodeType == 8 && f2.nextSibling; )
              f2 = f2.nextSibling;
            o2[o2.indexOf(f2)] = null, u2.__e = f2;
          } else {
            for (H2 = o2.length;H2--; )
              b(o2[H2]);
            B(u2);
          }
        else
          u2.__e = t2.__e, u2.__k = t2.__k, n3.then || B(u2);
        l.__e(n3, u2, t2);
      }
    else
      o2 == null && u2.__v == t2.__v ? (u2.__k = t2.__k, u2.__e = t2.__e) : f2 = u2.__e = G(t2.__e, u2, t2, i2, r2, o2, e2, c2, a2);
  return (s2 = l.diffed) && s2(u2), 128 & u2.__u ? undefined : f2;
}
function B(n2) {
  n2 && (n2.__c && (n2.__c.__e = true), n2.__k && n2.__k.some(B));
}
function D(n2, u2, t2) {
  for (var i2 = 0;i2 < t2.length; i2++)
    J(t2[i2], t2[++i2], t2[++i2]);
  l.__c && l.__c(u2, n2), n2.some(function(u3) {
    try {
      n2 = u3.__h, u3.__h = [], n2.some(function(n3) {
        n3.call(u3);
      });
    } catch (n3) {
      l.__e(n3, u3.__v);
    }
  });
}
function E(n2) {
  return typeof n2 != "object" || n2 == null || n2.__b > 0 ? n2 : g(n2) ? n2.map(E) : n2.constructor !== undefined ? null : m({}, n2);
}
function G(u2, t2, i2, r2, o2, e2, f2, c2, a2) {
  var s2, h2, p2, v2, y2, w2, _2, m2 = i2.props || d, k2 = t2.props, x2 = t2.type;
  if (x2 == "svg" ? o2 = "http://www.w3.org/2000/svg" : x2 == "math" ? o2 = "http://www.w3.org/1998/Math/MathML" : o2 || (o2 = "http://www.w3.org/1999/xhtml"), e2 != null) {
    for (s2 = 0;s2 < e2.length; s2++)
      if ((y2 = e2[s2]) && "setAttribute" in y2 == !!x2 && (x2 ? y2.localName == x2 : y2.nodeType == 3)) {
        u2 = y2, e2[s2] = null;
        break;
      }
  }
  if (u2 == null) {
    if (x2 == null)
      return document.createTextNode(k2);
    u2 = document.createElementNS(o2, x2, k2.is && k2), c2 && (l.__m && l.__m(t2, e2), c2 = false), e2 = null;
  }
  if (x2 == null)
    m2 === k2 || c2 && u2.data == k2 || (u2.data = k2);
  else {
    if (e2 = x2 == "textarea" && k2.defaultValue != null ? null : e2 && n.call(u2.childNodes), !c2 && e2 != null)
      for (m2 = {}, s2 = 0;s2 < u2.attributes.length; s2++)
        m2[(y2 = u2.attributes[s2]).name] = y2.value;
    for (s2 in m2)
      y2 = m2[s2], s2 == "dangerouslySetInnerHTML" ? p2 = y2 : s2 == "children" || (s2 in k2) || s2 == "value" && ("defaultValue" in k2) || s2 == "checked" && ("defaultChecked" in k2) || N(u2, s2, null, y2, o2);
    for (s2 in k2)
      y2 = k2[s2], s2 == "children" ? v2 = y2 : s2 == "dangerouslySetInnerHTML" ? h2 = y2 : s2 == "value" ? w2 = y2 : s2 == "checked" ? _2 = y2 : c2 && typeof y2 != "function" || m2[s2] === y2 || N(u2, s2, y2, m2[s2], o2);
    if (h2)
      c2 || p2 && (h2.__html == p2.__html || h2.__html == u2.innerHTML) || (u2.innerHTML = h2.__html), t2.__k = [];
    else if (p2 && (u2.innerHTML = ""), L(t2.type == "template" ? u2.content : u2, g(v2) ? v2 : [v2], t2, i2, r2, x2 == "foreignObject" ? "http://www.w3.org/1999/xhtml" : o2, e2, f2, e2 ? e2[0] : i2.__k && $(i2, 0), c2, a2), e2 != null)
      for (s2 = e2.length;s2--; )
        b(e2[s2]);
    c2 && x2 != "textarea" || (s2 = "value", x2 == "progress" && w2 == null ? u2.removeAttribute("value") : w2 != null && (w2 !== u2[s2] || x2 == "progress" && !w2 || x2 == "option" && w2 != m2[s2]) && N(u2, s2, w2, m2[s2], o2), s2 = "checked", _2 != null && _2 != u2[s2] && N(u2, s2, _2, m2[s2], o2));
  }
  return u2;
}
function J(n2, u2, t2) {
  try {
    if (typeof n2 == "function") {
      var i2 = typeof n2.__u == "function";
      i2 && n2.__u(), i2 && u2 == null || (n2.__u = n2(u2));
    } else
      n2.current = u2;
  } catch (n3) {
    l.__e(n3, t2);
  }
}
function K(n2, u2, t2) {
  var i2, r2;
  if (l.unmount && l.unmount(n2), (i2 = n2.ref) && (i2.current && i2.current != n2.__e || J(i2, null, u2)), (i2 = n2.__c) != null) {
    if (i2.componentWillUnmount)
      try {
        i2.componentWillUnmount();
      } catch (n3) {
        l.__e(n3, u2);
      }
    i2.base = i2.__P = null;
  }
  if (i2 = n2.__k)
    for (r2 = 0;r2 < i2.length; r2++)
      i2[r2] && K(i2[r2], u2, t2 || typeof n2.type != "function");
  t2 || b(n2.__e), n2.__c = n2.__ = n2.__e = undefined;
}
function Q(n2, l2, u2) {
  return this.constructor(n2, u2);
}
function R(u2, t2, i2) {
  var r2, o2, e2, f2;
  t2 == document && (t2 = document.documentElement), l.__ && l.__(u2, t2), o2 = (r2 = typeof i2 == "function") ? null : i2 && i2.__k || t2.__k, e2 = [], f2 = [], q(t2, u2 = (!r2 && i2 || t2).__k = k(S, null, [u2]), o2 || d, d, t2.namespaceURI, !r2 && i2 ? [i2] : o2 ? null : t2.firstChild ? n.call(t2.childNodes) : null, e2, !r2 && i2 ? i2 : o2 ? o2.__e : t2.firstChild, r2, f2), D(e2, u2, f2);
}
n = w.slice, l = { __e: function(n2, l2, u2, t2) {
  for (var i2, r2, o2;l2 = l2.__; )
    if ((i2 = l2.__c) && !i2.__)
      try {
        if ((r2 = i2.constructor) && r2.getDerivedStateFromError != null && (i2.setState(r2.getDerivedStateFromError(n2)), o2 = i2.__d), i2.componentDidCatch != null && (i2.componentDidCatch(n2, t2 || {}), o2 = i2.__d), o2)
          return i2.__E = i2;
      } catch (l3) {
        n2 = l3;
      }
  throw n2;
} }, u = 0, t = function(n2) {
  return n2 != null && n2.constructor === undefined;
}, C.prototype.setState = function(n2, l2) {
  var u2;
  u2 = this.__s != null && this.__s != this.state ? this.__s : this.__s = m({}, this.state), typeof n2 == "function" && (n2 = n2(m({}, u2), this.props)), n2 && m(u2, n2), n2 != null && this.__v && (l2 && this._sb.push(l2), A(this));
}, C.prototype.forceUpdate = function(n2) {
  this.__v && (this.__e = true, n2 && this.__h.push(n2), A(this));
}, C.prototype.render = S, i = [], o = typeof Promise == "function" ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, e = function(n2, l2) {
  return n2.__v.__b - l2.__v.__b;
}, H.__r = 0, f = Math.random().toString(8), c = "__d" + f, a = "__a" + f, s = /(PointerCapture)$|Capture$/i, h = 0, p = V(false), v = V(true), y = 0;

// src/mini-apps/frontend/garden/api.ts
var initData = "";
var urlAuth = "";
function setupAuth(data, auth = "") {
  initData = data;
  urlAuth = auth;
}
async function api(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  if (initData)
    headers["X-Telegram-Init-Data"] = initData;
  if (urlAuth)
    headers["X-Auth-Token"] = urlAuth;
  try {
    const res = await fetch(`/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });
    return await res.json();
  } catch (e2) {
    return { ok: false, error: e2.message };
  }
}

// node_modules/preact/hooks/dist/hooks.module.js
var t2;
var r2;
var u2;
var i2;
var o2 = 0;
var f2 = [];
var c2 = l;
var e2 = c2.__b;
var a2 = c2.__r;
var v2 = c2.diffed;
var l2 = c2.__c;
var m2 = c2.unmount;
var s2 = c2.__;
function p2(n2, t3) {
  c2.__h && c2.__h(r2, n2, o2 || t3), o2 = 0;
  var u3 = r2.__H || (r2.__H = { __: [], __h: [] });
  return n2 >= u3.__.length && u3.__.push({}), u3.__[n2];
}
function T2(n2, r3) {
  var u3 = p2(t2++, 7);
  return C2(u3.__H, r3) && (u3.__ = n2(), u3.__H = r3, u3.__h = n2), u3.__;
}
function j2() {
  for (var n2;n2 = f2.shift(); ) {
    var t3 = n2.__H;
    if (n2.__P && t3)
      try {
        t3.__h.some(z2), t3.__h.some(B2), t3.__h = [];
      } catch (r3) {
        t3.__h = [], c2.__e(r3, n2.__v);
      }
  }
}
c2.__b = function(n2) {
  r2 = null, e2 && e2(n2);
}, c2.__ = function(n2, t3) {
  n2 && t3.__k && t3.__k.__m && (n2.__m = t3.__k.__m), s2 && s2(n2, t3);
}, c2.__r = function(n2) {
  a2 && a2(n2), t2 = 0;
  var i3 = (r2 = n2.__c).__H;
  i3 && (u2 === r2 ? (i3.__h = [], r2.__h = [], i3.__.some(function(n3) {
    n3.__N && (n3.__ = n3.__N), n3.u = n3.__N = undefined;
  })) : (i3.__h.some(z2), i3.__h.some(B2), i3.__h = [], t2 = 0)), u2 = r2;
}, c2.diffed = function(n2) {
  v2 && v2(n2);
  var t3 = n2.__c;
  t3 && t3.__H && (t3.__H.__h.length && (f2.push(t3) !== 1 && i2 === c2.requestAnimationFrame || ((i2 = c2.requestAnimationFrame) || w2)(j2)), t3.__H.__.some(function(n3) {
    n3.u && (n3.__H = n3.u), n3.u = undefined;
  })), u2 = r2 = null;
}, c2.__c = function(n2, t3) {
  t3.some(function(n3) {
    try {
      n3.__h.some(z2), n3.__h = n3.__h.filter(function(n4) {
        return !n4.__ || B2(n4);
      });
    } catch (r3) {
      t3.some(function(n4) {
        n4.__h && (n4.__h = []);
      }), t3 = [], c2.__e(r3, n3.__v);
    }
  }), l2 && l2(n2, t3);
}, c2.unmount = function(n2) {
  m2 && m2(n2);
  var t3, r3 = n2.__c;
  r3 && r3.__H && (r3.__H.__.some(function(n3) {
    try {
      z2(n3);
    } catch (n4) {
      t3 = n4;
    }
  }), r3.__H = undefined, t3 && c2.__e(t3, r3.__v));
};
var k2 = typeof requestAnimationFrame == "function";
function w2(n2) {
  var t3, r3 = function() {
    clearTimeout(u3), k2 && cancelAnimationFrame(t3), setTimeout(n2);
  }, u3 = setTimeout(r3, 35);
  k2 && (t3 = requestAnimationFrame(r3));
}
function z2(n2) {
  var t3 = r2, u3 = n2.__c;
  typeof u3 == "function" && (n2.__c = undefined, u3()), r2 = t3;
}
function B2(n2) {
  var t3 = r2;
  n2.__c = n2.__(), r2 = t3;
}
function C2(n2, t3) {
  return !n2 || n2.length !== t3.length || t3.some(function(t4, r3) {
    return t4 !== n2[r3];
  });
}

// node_modules/@preact/signals-core/dist/signals-core.module.js
var i3 = Symbol.for("preact-signals");
function t3() {
  if (!(s3 > 1)) {
    var i4, t4 = false;
    (function() {
      var i5 = c3;
      c3 = undefined;
      while (i5 !== undefined) {
        if (i5.S.v === i5.v)
          i5.S.i = i5.i;
        i5 = i5.o;
      }
    })();
    while (h2 !== undefined) {
      var n2 = h2;
      h2 = undefined;
      v3++;
      while (n2 !== undefined) {
        var r3 = n2.u;
        n2.u = undefined;
        n2.f &= -3;
        if (!(8 & n2.f) && w3(n2))
          try {
            n2.c();
          } catch (n3) {
            if (!t4) {
              i4 = n3;
              t4 = true;
            }
          }
        n2 = r3;
      }
    }
    v3 = 0;
    s3--;
    if (t4)
      throw i4;
  } else
    s3--;
}
function n2(i4) {
  if (s3 > 0)
    return i4();
  e3 = ++u3;
  s3++;
  try {
    return i4();
  } finally {
    t3();
  }
}
var r3 = undefined;
function o3(i4) {
  var t4 = r3;
  r3 = undefined;
  try {
    return i4();
  } finally {
    r3 = t4;
  }
}
var f3;
var h2 = undefined;
var s3 = 0;
var v3 = 0;
var u3 = 0;
var e3 = 0;
var c3 = undefined;
var d2 = 0;
function a3(i4) {
  if (r3 !== undefined) {
    var t4 = i4.n;
    if (t4 === undefined || t4.t !== r3) {
      t4 = { i: 0, S: i4, p: r3.s, n: undefined, t: r3, e: undefined, x: undefined, r: t4 };
      if (r3.s !== undefined)
        r3.s.n = t4;
      r3.s = t4;
      i4.n = t4;
      if (32 & r3.f)
        i4.S(t4);
      return t4;
    } else if (t4.i === -1) {
      t4.i = 0;
      if (t4.n !== undefined) {
        t4.n.p = t4.p;
        if (t4.p !== undefined)
          t4.p.n = t4.n;
        t4.p = r3.s;
        t4.n = undefined;
        r3.s.n = t4;
        r3.s = t4;
      }
      return t4;
    }
  }
}
function l3(i4, t4) {
  this.v = i4;
  this.i = 0;
  this.n = undefined;
  this.t = undefined;
  this.l = 0;
  this.W = t4 == null ? undefined : t4.watched;
  this.Z = t4 == null ? undefined : t4.unwatched;
  this.name = t4 == null ? undefined : t4.name;
}
l3.prototype.brand = i3;
l3.prototype.h = function() {
  return true;
};
l3.prototype.S = function(i4) {
  var t4 = this, n3 = this.t;
  if (n3 !== i4 && i4.e === undefined) {
    i4.x = n3;
    this.t = i4;
    if (n3 !== undefined)
      n3.e = i4;
    else
      o3(function() {
        var i5;
        (i5 = t4.W) == null || i5.call(t4);
      });
  }
};
l3.prototype.U = function(i4) {
  var t4 = this;
  if (this.t !== undefined) {
    var { e: n3, x: r4 } = i4;
    if (n3 !== undefined) {
      n3.x = r4;
      i4.e = undefined;
    }
    if (r4 !== undefined) {
      r4.e = n3;
      i4.x = undefined;
    }
    if (i4 === this.t) {
      this.t = r4;
      if (r4 === undefined)
        o3(function() {
          var i5;
          (i5 = t4.Z) == null || i5.call(t4);
        });
    }
  }
};
l3.prototype.subscribe = function(i4) {
  var t4 = this;
  return j3(function() {
    var n3 = t4.value, o4 = r3;
    r3 = undefined;
    try {
      i4(n3);
    } finally {
      r3 = o4;
    }
  }, { name: "sub" });
};
l3.prototype.valueOf = function() {
  return this.value;
};
l3.prototype.toString = function() {
  return this.value + "";
};
l3.prototype.toJSON = function() {
  return this.value;
};
l3.prototype.peek = function() {
  var i4 = this;
  return o3(function() {
    return i4.value;
  });
};
Object.defineProperty(l3.prototype, "value", { get: function() {
  var i4 = a3(this);
  if (i4 !== undefined)
    i4.i = this.i;
  return this.v;
}, set: function(i4) {
  if (i4 !== this.v) {
    if (v3 > 100)
      throw new Error("Cycle detected");
    (function(i5) {
      if (s3 !== 0 && v3 === 0) {
        if (i5.l !== e3) {
          i5.l = e3;
          c3 = { S: i5, v: i5.v, i: i5.i, o: c3 };
        }
      }
    })(this);
    this.v = i4;
    this.i++;
    d2++;
    s3++;
    try {
      for (var n3 = this.t;n3 !== undefined; n3 = n3.x)
        n3.t.N();
    } finally {
      t3();
    }
  }
} });
function y2(i4, t4) {
  return new l3(i4, t4);
}
function w3(i4) {
  for (var t4 = i4.s;t4 !== undefined; t4 = t4.n)
    if (t4.S.i !== t4.i || !t4.S.h() || t4.S.i !== t4.i)
      return true;
  return false;
}
function _2(i4) {
  for (var t4 = i4.s;t4 !== undefined; t4 = t4.n) {
    var n3 = t4.S.n;
    if (n3 !== undefined)
      t4.r = n3;
    t4.S.n = t4;
    t4.i = -1;
    if (t4.n === undefined) {
      i4.s = t4;
      break;
    }
  }
}
function b2(i4) {
  var t4 = i4.s, n3 = undefined;
  while (t4 !== undefined) {
    var r4 = t4.p;
    if (t4.i === -1) {
      t4.S.U(t4);
      if (r4 !== undefined)
        r4.n = t4.n;
      if (t4.n !== undefined)
        t4.n.p = r4;
    } else
      n3 = t4;
    t4.S.n = t4.r;
    if (t4.r !== undefined)
      t4.r = undefined;
    t4 = r4;
  }
  i4.s = n3;
}
function p3(i4, t4) {
  l3.call(this, undefined);
  this.x = i4;
  this.s = undefined;
  this.g = d2 - 1;
  this.f = 4;
  this.W = t4 == null ? undefined : t4.watched;
  this.Z = t4 == null ? undefined : t4.unwatched;
  this.name = t4 == null ? undefined : t4.name;
}
p3.prototype = new l3;
p3.prototype.h = function() {
  this.f &= -3;
  if (1 & this.f)
    return false;
  if ((36 & this.f) == 32)
    return true;
  this.f &= -5;
  if (this.g === d2)
    return true;
  this.g = d2;
  this.f |= 1;
  if (this.i > 0 && !w3(this)) {
    this.f &= -2;
    return true;
  }
  var i4 = r3;
  try {
    _2(this);
    r3 = this;
    var t4 = this.x();
    if (16 & this.f || this.v !== t4 || this.i === 0) {
      this.v = t4;
      this.f &= -17;
      this.i++;
    }
  } catch (i5) {
    this.v = i5;
    this.f |= 16;
    this.i++;
  }
  r3 = i4;
  b2(this);
  this.f &= -2;
  return true;
};
p3.prototype.S = function(i4) {
  if (this.t === undefined) {
    this.f |= 36;
    for (var t4 = this.s;t4 !== undefined; t4 = t4.n)
      t4.S.S(t4);
  }
  l3.prototype.S.call(this, i4);
};
p3.prototype.U = function(i4) {
  if (this.t !== undefined) {
    l3.prototype.U.call(this, i4);
    if (this.t === undefined) {
      this.f &= -33;
      for (var t4 = this.s;t4 !== undefined; t4 = t4.n)
        t4.S.U(t4);
    }
  }
};
p3.prototype.N = function() {
  if (!(2 & this.f)) {
    this.f |= 6;
    for (var i4 = this.t;i4 !== undefined; i4 = i4.x)
      i4.t.N();
  }
};
Object.defineProperty(p3.prototype, "value", { get: function() {
  if (1 & this.f)
    throw new Error("Cycle detected");
  var i4 = a3(this);
  this.h();
  if (i4 !== undefined)
    i4.i = this.i;
  if (16 & this.f)
    throw this.v;
  return this.v;
} });
function g2(i4, t4) {
  return new p3(i4, t4);
}
function S2(i4) {
  var n3 = i4.m;
  i4.m = undefined;
  if (typeof n3 == "function") {
    s3++;
    var o4 = r3;
    r3 = undefined;
    try {
      n3();
    } catch (t4) {
      i4.f &= -2;
      i4.f |= 8;
      m3(i4);
      throw t4;
    } finally {
      r3 = o4;
      t3();
    }
  }
}
function m3(i4) {
  for (var t4 = i4.s;t4 !== undefined; t4 = t4.n)
    t4.S.U(t4);
  i4.x = undefined;
  i4.s = undefined;
  S2(i4);
}
function x2(i4) {
  if (r3 !== this)
    throw new Error("Out-of-order effect");
  b2(this);
  r3 = i4;
  this.f &= -2;
  if (8 & this.f)
    m3(this);
  t3();
}
function E2(i4, t4) {
  this.x = i4;
  this.m = undefined;
  this.s = undefined;
  this.u = undefined;
  this.f = 32;
  this.name = t4 == null ? undefined : t4.name;
  if (f3)
    f3.push(this);
}
E2.prototype.c = function() {
  var i4 = this.S();
  try {
    if (8 & this.f)
      return;
    if (this.x === undefined)
      return;
    var t4 = this.x();
    if (typeof t4 == "function")
      this.m = t4;
  } finally {
    i4();
  }
};
E2.prototype.S = function() {
  if (1 & this.f)
    throw new Error("Cycle detected");
  this.f |= 1;
  this.f &= -9;
  S2(this);
  _2(this);
  s3++;
  var i4 = r3;
  r3 = this;
  return x2.bind(this, i4);
};
E2.prototype.N = function() {
  if (!(2 & this.f)) {
    this.f |= 2;
    this.u = h2;
    h2 = this;
  }
};
E2.prototype.d = function() {
  this.f |= 8;
  if (!(1 & this.f))
    m3(this);
};
E2.prototype.dispose = function() {
  this.d();
};
function j3(i4, t4) {
  var n3 = new E2(i4, t4);
  try {
    n3.c();
  } catch (i5) {
    n3.d();
    throw i5;
  }
  var r4 = n3.d.bind(n3);
  r4[Symbol.dispose] = r4;
  return r4;
}

// node_modules/@preact/signals/dist/signals.module.js
var l4;
var d3;
var h3;
var p4 = typeof window != "undefined" && !!window.__PREACT_SIGNALS_DEVTOOLS__;
var _3 = [];
j3(function() {
  l4 = this.N;
})();
function g3(i4, r4) {
  l[i4] = r4.bind(null, l[i4] || function() {});
}
function b3(i4) {
  if (h3) {
    var n3 = h3;
    h3 = undefined;
    n3();
  }
  h3 = i4 && i4.S();
}
function y4(i4) {
  var n3 = this, t4 = i4.data, e4 = useSignal(t4);
  e4.value = t4;
  var f4 = T2(function() {
    var i5 = n3, t5 = n3.__v;
    while (t5 = t5.__)
      if (t5.__c) {
        t5.__c.__$f |= 4;
        break;
      }
    var o4 = g2(function() {
      var i6 = e4.value.value;
      return i6 === 0 ? 0 : i6 === true ? "" : i6 || "";
    }), f5 = g2(function() {
      return !Array.isArray(o4.value) && !t(o4.value);
    }), a5 = j3(function() {
      this.N = F;
      if (f5.value) {
        var n4 = o4.value;
        if (i5.__v && i5.__v.__e && i5.__v.__e.nodeType === 3)
          i5.__v.__e.data = n4;
      }
    }), v5 = n3.__$u.d;
    n3.__$u.d = function() {
      a5();
      v5.call(this);
    };
    return [f5, o4];
  }, []), a4 = f4[0], v4 = f4[1];
  return a4.value ? v4.peek() : v4.value;
}
y4.displayName = "ReactiveTextNode";
Object.defineProperties(l3.prototype, { constructor: { configurable: true, value: undefined }, type: { configurable: true, value: y4 }, props: { configurable: true, get: function() {
  var i4 = this;
  return { data: { get value() {
    return i4.value;
  } } };
} }, __b: { configurable: true, value: 1 } });
g3("__b", function(i4, n3) {
  if (typeof n3.type == "string") {
    var r4, t4 = n3.props;
    for (var o4 in t4)
      if (o4 !== "children") {
        var e4 = t4[o4];
        if (e4 instanceof l3) {
          if (!r4)
            n3.__np = r4 = {};
          r4[o4] = e4;
          t4[o4] = e4.peek();
        }
      }
  }
  i4(n3);
});
g3("__r", function(i4, n3) {
  i4(n3);
  if (n3.type !== S) {
    b3();
    var r4, o4 = n3.__c;
    if (o4) {
      o4.__$f &= -2;
      if ((r4 = o4.__$u) === undefined)
        o4.__$u = r4 = function(i5, n4) {
          var r5;
          j3(function() {
            r5 = this;
          }, { name: n4 });
          r5.c = i5;
          return r5;
        }(function() {
          var i5;
          if (p4)
            (i5 = r4.y) == null || i5.call(r4);
          o4.__$f |= 1;
          o4.setState({});
        }, typeof n3.type == "function" ? n3.type.displayName || n3.type.name : "");
    }
    d3 = o4;
    b3(r4);
  }
});
g3("__e", function(i4, n3, r4, t4) {
  b3();
  d3 = undefined;
  i4(n3, r4, t4);
});
g3("diffed", function(i4, n3) {
  b3();
  d3 = undefined;
  var r4;
  if (typeof n3.type == "string" && (r4 = n3.__e)) {
    var { __np: t4, props: o4 } = n3;
    if (t4) {
      var e4 = r4.U;
      if (e4)
        for (var f4 in e4) {
          var u4 = e4[f4];
          if (u4 !== undefined && !(f4 in t4)) {
            u4.d();
            e4[f4] = undefined;
          }
        }
      else {
        e4 = {};
        r4.U = e4;
      }
      for (var a4 in t4) {
        var c4 = e4[a4], v4 = t4[a4];
        if (c4 === undefined) {
          c4 = w4(r4, a4, v4);
          e4[a4] = c4;
        } else
          c4.o(v4, o4);
      }
    }
  }
  i4(n3);
});
function w4(i4, n3, r4, t4) {
  var o4 = n3 in i4 && i4.ownerSVGElement === undefined, e4 = y2(r4), f4 = r4.peek();
  return { o: function(i5, n4) {
    e4.value = i5;
    f4 = i5.peek();
  }, d: j3(function() {
    this.N = F;
    var r5 = e4.value.value;
    if (f4 !== r5) {
      f4 = undefined;
      if (o4)
        i4[n3] = r5;
      else if (r5 != null && (r5 !== false || n3[4] === "-"))
        i4.setAttribute(n3, r5);
      else
        i4.removeAttribute(n3);
    } else
      f4 = undefined;
  }) };
}
g3("unmount", function(i4, n3) {
  if (typeof n3.type == "string") {
    var r4 = n3.__e;
    if (r4) {
      var t4 = r4.U;
      if (t4) {
        r4.U = undefined;
        for (var o4 in t4) {
          var e4 = t4[o4];
          if (e4)
            e4.d();
        }
      }
    }
    var f4 = n3.__np;
    if (f4) {
      var u4 = n3.props;
      for (var a4 in f4)
        u4[a4] = f4[a4];
    }
    n3.__np = undefined;
  } else {
    var c4 = n3.__c;
    if (c4) {
      var v4 = c4.__$u;
      if (v4) {
        c4.__$u = undefined;
        v4.d();
      }
    }
  }
  i4(n3);
});
g3("__h", function(i4, n3, r4, t4) {
  if (t4 < 3 || t4 === 9)
    n3.__$f |= 2;
  i4(n3, r4, t4);
});
C.prototype.shouldComponentUpdate = function(i4, n3) {
  if (this.__R)
    return true;
  var r4 = this.__$u, t4 = r4 && r4.s !== undefined;
  for (var o4 in n3)
    return true;
  if (this.__f || typeof this.u == "boolean" && this.u === true) {
    var e4 = 2 & this.__$f;
    if (!(t4 || e4 || 4 & this.__$f))
      return true;
    if (1 & this.__$f)
      return true;
  } else {
    if (!(t4 || 4 & this.__$f))
      return true;
    if (3 & this.__$f)
      return true;
  }
  for (var f4 in i4)
    if (f4 !== "__source" && i4[f4] !== this.props[f4])
      return true;
  for (var u4 in this.props)
    if (!(u4 in i4))
      return true;
  return false;
};
function useSignal(i4, n3) {
  return T2(function() {
    return y2(i4, n3);
  }, []);
}
var q2 = function(i4) {
  queueMicrotask(function() {
    queueMicrotask(i4);
  });
};
function x3() {
  n2(function() {
    var i4;
    while (i4 = _3.shift())
      l4.call(i4);
  });
}
function F() {
  if (_3.push(this) === 1)
    (l.requestAnimationFrame || q2)(x3);
}

// src/mini-apps/frontend/garden/state.ts
var userBalance = y2({ bipki: 0, megabipki: 0 });
var plots = y2([]);
var catalog = y2([]);
var inventory = y2([]);
var trades = y2([]);
var shardQuantity = y2(0);
var activeView = y2("garden");
var toastMessage = y2(null);
var modalVisible = y2(false);
var modalContent = y2(null);
var plotInfoPlot = y2(null);
var timerTick = y2(Date.now());
var toastTimer = null;
function showToast(text, type = "") {
  toastMessage.value = { text, type };
  if (toastTimer)
    clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastMessage.value = null;
  }, 2000);
}
function showModal(content) {
  modalContent.value = content;
  plotInfoPlot.value = null;
  modalVisible.value = true;
}
function hideModal() {
  modalVisible.value = false;
  plotInfoPlot.value = null;
}
function formatTime(sec) {
  if (sec >= 60) {
    const m4 = Math.floor(sec / 60);
    const s4 = Math.floor(sec % 60);
    return `${m4}:${String(s4).padStart(2, "0")}`;
  }
  return `${Math.floor(sec)}с`;
}
function getPlotProgress(plot) {
  if (!plot.planted_at || !plot.growth_sec)
    return 0;
  const planted = new Date(plot.planted_at + "Z").getTime();
  const elapsed = (timerTick.value - planted) / 1000;
  return Math.min(100, Math.max(0, elapsed / plot.growth_sec * 100));
}
function getTimerDisplay(plot) {
  if (plot.state === "withered") {
    if (!plot.withered_at)
      return "\uD83E\uDD40";
    const withered = new Date(plot.withered_at + "Z").getTime();
    const elapsed2 = (timerTick.value - withered) / 1000;
    const remaining2 = Math.max(0, 15 - elapsed2);
    if (remaining2 <= 0)
      return "...";
    return `${Math.ceil(remaining2)}с`;
  }
  if (!plot.planted_at || !plot.growth_sec)
    return "...";
  const planted = new Date(plot.planted_at + "Z").getTime();
  const elapsed = (timerTick.value - planted) / 1000;
  const remaining = Math.max(0, plot.growth_sec - elapsed);
  if (remaining <= 0)
    return "✨ Готово!";
  return formatTime(remaining);
}
function isPlotReady(plot) {
  if (!plot.planted_at || !plot.growth_sec)
    return false;
  const planted = new Date(plot.planted_at + "Z").getTime();
  return (timerTick.value - planted) / 1000 >= plot.growth_sec;
}
function getStageEmoji(plot) {
  if (plot.subspecies_emoji)
    return plot.subspecies_emoji;
  if (plot.state === "ready")
    return "\uD83C\uDF3B";
  return "\uD83C\uDF31";
}
function getItemEmoji(item) {
  if (item.type === "seed")
    return item.subspecies_emoji || "\uD83C\uDF31";
  if (item.type === "harvest")
    return item.subspecies_emoji || "\uD83C\uDF81";
  if (item.type === "shard")
    return "\uD83E\uDEA8";
  return "\uD83D\uDCE6";
}
async function loadAll() {
  const [balanceRes, plotsRes, shopRes, invRes, marketRes, shardRes] = await Promise.all([
    api("GET", "/user/balance"),
    api("GET", "/garden/plots"),
    api("GET", "/garden/shop"),
    api("GET", "/garden/inventory"),
    api("GET", "/garden/market"),
    api("GET", "/garden/shard-quantity")
  ]);
  if (balanceRes.ok) {
    userBalance.value = { bipki: balanceRes.bipki, megabipki: balanceRes.megabipki };
  }
  if (plotsRes.ok) {
    plots.value = plotsRes.plots;
  }
  if (shopRes.ok) {
    catalog.value = shopRes.catalog;
    if (shopRes.balance) {
      const b4 = shopRes.balance;
      userBalance.value = { bipki: b4.bipki, megabipki: b4.megabipki };
    }
  }
  if (invRes.ok) {
    inventory.value = invRes.items;
  }
  if (marketRes.ok) {
    trades.value = marketRes.trades;
  }
  if (shardRes.ok) {
    shardQuantity.value = shardRes.quantity;
  }
}
async function loadShard() {
  const res = await api("GET", "/garden/shard-quantity");
  if (res.ok)
    shardQuantity.value = res.quantity;
}
async function plantSeed(idx, itemId) {
  hideModal();
  const prevPlots = plots.value;
  const prevInv = inventory.value;
  const seed = inventory.value.find((i4) => i4.id === itemId);
  const plantInfo = catalog.value.find((c4) => c4.id === seed?.plant_id);
  if (plantInfo) {
    plots.value = plots.value.map((p5) => p5.idx === idx ? {
      ...p5,
      state: "growing",
      plant_id: plantInfo.id,
      subspecies_id: seed?.subspecies_id ?? null,
      subspecies_name: seed?.subspecies_name,
      subspecies_emoji: seed?.subspecies_emoji,
      plant_name: plantInfo.name,
      growth_sec: plantInfo.growth_sec,
      rarity: seed?.rarity,
      planted_at: new Date().toISOString().slice(0, 19).replace("T", " "),
      stage: 1,
      withered_at: null
    } : p5);
  }
  inventory.value = inventory.value.map((i4) => i4.id === itemId ? { ...i4, quantity: i4.quantity - 1 } : i4).filter((i4) => i4.quantity > 0);
  const res = await api("POST", "/garden/plant", { idx, item_id: itemId });
  if (res.ok) {
    plots.value = res.plots;
    inventory.value = res.inventory;
    const germinated = res.germinated;
    if (germinated) {
      showToast("\uD83C\uDF31 Посажено!", "success");
    } else {
      showToast("\uD83E\uDD40 Семя не взошло!", "error");
      await loadShard();
    }
  } else {
    plots.value = prevPlots;
    inventory.value = prevInv;
    showToast(res.error || "Ошибка", "error");
  }
}
async function onHarvest(idx) {
  hideModal();
  const prevPlots = plots.value;
  const prevInv = inventory.value;
  plots.value = plots.value.map((p5) => p5.idx === idx ? { ...p5, state: "empty", plant_id: null, planted_at: null, stage: 0, plant_name: undefined, growth_sec: undefined } : p5);
  const res = await api("POST", "/garden/harvest", { idx });
  if (res.ok) {
    plots.value = res.plots;
    inventory.value = res.inventory;
    showToast("\uD83C\uDF89 Собрано!", "success");
  } else {
    plots.value = prevPlots;
    inventory.value = prevInv;
    showToast(res.error || "Ошибка", "error");
  }
}
async function buyPlant(plantId) {
  const prevBalance = userBalance.value;
  const prevInv = inventory.value;
  const plant = catalog.value.find((c4) => c4.id === plantId);
  if (plant) {
    userBalance.value = { ...userBalance.value, bipki: userBalance.value.bipki - plant.seed_price };
  }
  const res = await api("POST", "/garden/buy", { plant_id: plantId, quantity: 1 });
  if (res.ok) {
    inventory.value = res.inventory;
    if (res.balance) {
      const b4 = res.balance;
      userBalance.value = { bipki: b4.bipki, megabipki: b4.megabipki };
    }
    showToast("✅ Куплено!", "success");
  } else {
    userBalance.value = prevBalance;
    inventory.value = prevInv;
    showToast(res.error || "Ошибка", "error");
  }
}
async function sellItem(itemId, price) {
  if (price <= 0) {
    showToast("Цена должна быть > 0", "error");
    return;
  }
  if (price < 10) {
    showToast("Минимальная цена: 10\uD83E\uDE99", "error");
    return;
  }
  hideModal();
  const prevTrades = trades.value;
  const prevInv = inventory.value;
  inventory.value = inventory.value.filter((i4) => i4.id !== itemId);
  const res = await api("POST", "/garden/market/sell", { item_id: itemId, price });
  if (res.ok) {
    trades.value = res.trades;
    inventory.value = res.inventory;
    showToast("✅ Выставлено на продажу", "success");
  } else {
    trades.value = prevTrades;
    inventory.value = prevInv;
    showToast(res.error || "Ошибка", "error");
  }
}
async function upgradeItem(itemId) {
  const prevInv = inventory.value;
  const prevBalance = userBalance.value;
  const item = inventory.value.find((i4) => i4.id === itemId);
  const meta = item?.meta ? JSON.parse(item.meta) : {};
  const newLevel = (meta.level ?? 0) + 1;
  inventory.value = inventory.value.map((i4) => i4.id === itemId ? { ...i4, meta: JSON.stringify({ ...meta, level: newLevel }) } : i4);
  userBalance.value = { ...userBalance.value, megabipki: userBalance.value.megabipki - 100 * newLevel };
  const res = await api("POST", "/garden/upgrade", { item_id: itemId });
  if (res.ok) {
    inventory.value = res.inventory;
    if (res.balance) {
      const b4 = res.balance;
      userBalance.value = { bipki: b4.bipki, megabipki: b4.megabipki };
    }
    const discovered = res.discovered;
    const subspeciesName = res.subspecies_name;
    if (discovered && subspeciesName) {
      showToast(`\uD83C\uDF89 Открыт новый подвид: ${subspeciesName}!`, "success");
    } else {
      showToast(`⬆ Улучшено до уровня ${res.level}!`, "success");
    }
  } else {
    inventory.value = prevInv;
    userBalance.value = prevBalance;
    showToast(res.error || "Ошибка", "error");
  }
}
async function buyTrade(tradeId) {
  const prevTrades = trades.value;
  const prevInv = inventory.value;
  const prevBalance = userBalance.value;
  trades.value = trades.value.filter((t4) => t4.id !== tradeId);
  const res = await api("POST", "/garden/market/buy", { trade_id: tradeId });
  if (res.ok) {
    trades.value = res.trades;
    inventory.value = res.inventory;
    if (res.balance) {
      const b4 = res.balance;
      userBalance.value = { bipki: b4.bipki, megabipki: b4.megabipki };
    }
    showToast("✅ Куплено!", "success");
  } else {
    trades.value = prevTrades;
    inventory.value = prevInv;
    userBalance.value = prevBalance;
    showToast(res.error || "Ошибка", "error");
  }
}
async function cancelTrade(tradeId) {
  const prevTrades = trades.value;
  const prevInv = inventory.value;
  trades.value = trades.value.filter((t4) => t4.id !== tradeId);
  const res = await api("POST", "/garden/market/cancel", { trade_id: tradeId });
  if (res.ok) {
    trades.value = res.trades;
    inventory.value = res.inventory;
    showToast("✅ Лот снят", "success");
  } else {
    trades.value = prevTrades;
    inventory.value = prevInv;
    showToast(res.error || "Ошибка", "error");
  }
}
async function autoSell(idx) {
  hideModal();
  const prevPlots = plots.value;
  const prevBalance = userBalance.value;
  const plot = plots.value.find((p5) => p5.idx === idx);
  plots.value = plots.value.map((p5) => p5.idx === idx ? { ...p5, state: "empty", plant_id: null, planted_at: null, stage: 0, plant_name: undefined, growth_sec: undefined } : p5);
  const res = await api("POST", "/garden/auto-sell", { idx });
  if (res.ok) {
    plots.value = res.plots;
    if (res.balance) {
      const b4 = res.balance;
      userBalance.value = { bipki: b4.bipki, megabipki: b4.megabipki };
    }
    showToast(`\uD83D\uDCB0 Продано за \uD83E\uDE99 ${res.price}!`, "success");
  } else {
    plots.value = prevPlots;
    userBalance.value = prevBalance;
    showToast(res.error || "Ошибка", "error");
  }
}
async function autoSellItem(itemId) {
  hideModal();
  const prevInv = inventory.value;
  const prevBalance = userBalance.value;
  inventory.value = inventory.value.filter((i4) => i4.id !== itemId);
  const res = await api("POST", "/garden/auto-sell-item", { item_id: itemId });
  if (res.ok) {
    inventory.value = res.inventory;
    if (res.balance) {
      const b4 = res.balance;
      userBalance.value = { bipki: b4.bipki, megabipki: b4.megabipki };
    }
    showToast(`\uD83D\uDCB0 Продано за \uD83E\uDE99 ${res.price}!`, "success");
  } else {
    inventory.value = prevInv;
    userBalance.value = prevBalance;
    showToast(res.error || "Ошибка", "error");
  }
}
async function craftShards(plantId) {
  hideModal();
  const prevInv = inventory.value;
  const res = await api("POST", "/garden/craft", { plant_id: plantId });
  if (res.ok) {
    inventory.value = res.inventory;
    showToast("\uD83D\uDD28 Скрафчено!", "success");
    await loadShard();
  } else {
    inventory.value = prevInv;
    showToast(res.error || "Ошибка", "error");
  }
}
// node_modules/preact/jsx-runtime/dist/jsxRuntime.module.js
var f4 = 0;
function u4(e4, t4, n3, o4, i4, u5) {
  t4 || (t4 = {});
  var a4, c4, p5 = t4;
  if ("ref" in p5)
    for (c4 in p5 = {}, t4)
      c4 == "ref" ? a4 = t4[c4] : p5[c4] = t4[c4];
  var l5 = { type: e4, props: p5, key: n3, ref: a4, __k: null, __: null, __b: 0, __e: null, __c: null, constructor: undefined, __v: --f4, __i: -1, __u: 0, __source: i4, __self: u5 };
  if (typeof e4 == "function" && (a4 = e4.defaultProps))
    for (c4 in a4)
      p5[c4] === undefined && (p5[c4] = a4[c4]);
  return l.vnode && l.vnode(l5), l5;
}

// src/mini-apps/frontend/garden/components/Garden.tsx
function showSeedPicker(plotIdx) {
  const seeds = inventory.value.filter((i4) => i4.type === "seed" && i4.quantity > 0);
  if (!seeds.length) {
    showModal(/* @__PURE__ */ u4("div", {
      children: [
        /* @__PURE__ */ u4("div", {
          className: "title",
          children: "\uD83C\uDF31 Нет семян"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ u4("div", {
          className: "desc",
          children: "У тебя нет семян. Купи их в магазине."
        }, undefined, false, undefined, this),
        /* @__PURE__ */ u4("button", {
          className: "btn btn-primary",
          onClick: () => {
            hideModal();
            activeView.value = "shop";
          },
          children: "\uD83D\uDED2 В магазин"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this));
    return;
  }
  showModal(/* @__PURE__ */ u4("div", {
    children: [
      /* @__PURE__ */ u4("div", {
        className: "title",
        children: "\uD83C\uDF31 Выбери семена"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "seed-picker-grid",
        children: seeds.map((s4) => /* @__PURE__ */ u4("div", {
          className: "seed-card",
          onClick: () => plantSeed(plotIdx, s4.id),
          children: [
            /* @__PURE__ */ u4("div", {
              className: "seed-emoji",
              children: s4.subspecies_emoji || "\uD83C\uDF31"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u4("div", {
              className: "seed-name",
              children: [
                s4.plant_name || "Растение",
                s4.subspecies_name ? ` (${s4.subspecies_name})` : ""
              ]
            }, undefined, true, undefined, this),
            s4.rarity ? /* @__PURE__ */ u4("div", {
              className: `rarity-badge ${s4.rarity} seed-badge`,
              children: s4.rarity
            }, undefined, false, undefined, this) : null,
            /* @__PURE__ */ u4("div", {
              className: "seed-qty",
              children: [
                "×",
                s4.quantity
              ]
            }, undefined, true, undefined, this)
          ]
        }, s4.id, true, undefined, this))
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this));
}
function showHarvestOptions(idx, plot) {
  showModal(/* @__PURE__ */ u4("div", {
    children: [
      /* @__PURE__ */ u4("div", {
        className: "text-center",
        style: { marginBottom: 4 },
        children: [
          /* @__PURE__ */ u4("div", {
            style: { fontSize: 48, lineHeight: 1.2 },
            children: getStageEmoji(plot)
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u4("div", {
            className: "title",
            children: plot.plant_name || "Растение"
          }, undefined, false, undefined, this),
          plot.rarity ? /* @__PURE__ */ u4("span", {
            className: `rarity-badge ${plot.rarity}`,
            children: plot.rarity
          }, undefined, false, undefined, this) : null,
          plot.subspecies_name && plot.rarity !== "common" ? /* @__PURE__ */ u4("div", {
            className: "desc text-center",
            children: plot.subspecies_name
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc text-center text-dim",
        children: "Урожай готов! Что делаем?"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        style: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 },
        children: [
          /* @__PURE__ */ u4("button", {
            className: "btn btn-success",
            onClick: () => onHarvest(idx),
            style: { width: "100%" },
            children: "\uD83C\uDF81 В инвентарь"
          }, undefined, false, undefined, this),
          plot.plant_id === 1 ? /* @__PURE__ */ u4("button", {
            className: "btn btn-gold",
            onClick: () => autoSell(idx),
            style: { width: "100%" },
            children: "\uD83D\uDCB0 Продать за \uD83E\uDE99"
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this));
}
function Plot({ plot }) {
  const ready = plot.state === "ready" || plot.state === "growing" && isPlotReady(plot);
  const handleClick = () => {
    if (plot.state === "empty") {
      showSeedPicker(plot.idx);
    } else if (plot.state === "withered") {
      plotInfoPlot.value = plot;
      modalVisible.value = true;
    } else if (ready) {
      showHarvestOptions(plot.idx, plot);
    } else {
      plotInfoPlot.value = plot;
      modalVisible.value = true;
    }
  };
  if (plot.state === "empty") {
    return /* @__PURE__ */ u4("div", {
      className: "plot empty",
      onClick: handleClick,
      children: [
        /* @__PURE__ */ u4("div", {
          className: "plot-plus",
          children: "+"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ u4("div", {
          className: "plot-label",
          children: "Посадить"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  if (plot.state === "withered") {
    return /* @__PURE__ */ u4("div", {
      className: "plot withered",
      onClick: handleClick,
      children: [
        /* @__PURE__ */ u4("div", {
          className: "plot-emoji",
          children: "\uD83E\uDD40"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ u4("div", {
          className: "plot-timer",
          "data-plot-idx": plot.idx,
          children: getTimerDisplay(plot)
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  const displayState = ready ? "ready" : "growing";
  const classes = ["plot", displayState];
  if (plot.rarity)
    classes.push(`rarity-${plot.rarity}`);
  if (ready) {
    return /* @__PURE__ */ u4("div", {
      className: classes.join(" "),
      onClick: handleClick,
      children: [
        /* @__PURE__ */ u4("div", {
          className: "plot-sparkle"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ u4("div", {
          className: "plot-emoji",
          children: getStageEmoji(plot)
        }, undefined, false, undefined, this),
        /* @__PURE__ */ u4("div", {
          className: "plot-harvest-label",
          children: "✨ Собрать!"
        }, undefined, false, undefined, this),
        plot.plant_name ? /* @__PURE__ */ u4("div", {
          className: "plot-name",
          children: plot.plant_name
        }, undefined, false, undefined, this) : null,
        plot.subspecies_name && plot.rarity !== "common" ? /* @__PURE__ */ u4("div", {
          className: "plot-sub-name",
          children: plot.subspecies_name
        }, undefined, false, undefined, this) : null
      ]
    }, undefined, true, undefined, this);
  }
  const progress = getPlotProgress(plot);
  return /* @__PURE__ */ u4("div", {
    className: classes.join(" "),
    onClick: handleClick,
    children: [
      /* @__PURE__ */ u4("div", {
        className: "plot-emoji",
        children: getStageEmoji(plot)
      }, undefined, false, undefined, this),
      plot.plant_name ? /* @__PURE__ */ u4("div", {
        className: "plot-name",
        children: plot.plant_name
      }, undefined, false, undefined, this) : null,
      /* @__PURE__ */ u4("div", {
        className: "plot-timer",
        "data-plot-idx": plot.idx,
        children: getTimerDisplay(plot)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "progress-track",
        children: /* @__PURE__ */ u4("div", {
          className: "progress-bar",
          style: { width: `${progress}%` }
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function Garden() {
  const p5 = plots.value;
  if (!p5.length) {
    return /* @__PURE__ */ u4("div", {
      className: "loading",
      children: "Загрузка..."
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ u4("div", {
    className: "garden-grid",
    children: p5.map((plot) => /* @__PURE__ */ u4(Plot, {
      plot
    }, plot.idx, false, undefined, this))
  }, undefined, false, undefined, this);
}

// src/mini-apps/frontend/garden/components/Shop.tsx
function formatTime2(sec) {
  if (sec >= 3600) {
    const h4 = Math.floor(sec / 3600);
    const m4 = Math.floor(sec % 3600 / 60);
    return `${h4}ч ${m4}м`;
  }
  if (sec >= 60) {
    const m4 = Math.floor(sec / 60);
    const s4 = Math.floor(sec % 60);
    return `${m4}:${String(s4).padStart(2, "0")}`;
  }
  return `${Math.floor(sec)}с`;
}
function Shop() {
  const items = catalog.value;
  if (!items.length) {
    return /* @__PURE__ */ u4("div", {
      className: "loading",
      children: "Загрузка..."
    }, undefined, false, undefined, this);
  }
  return /* @__PURE__ */ u4("div", {
    children: /* @__PURE__ */ u4("div", {
      className: "shop-list",
      children: items.map((plant) => {
        const canAfford = userBalance.value.bipki >= plant.seed_price;
        return /* @__PURE__ */ u4("div", {
          className: "shop-card",
          children: [
            /* @__PURE__ */ u4("div", {
              className: "shop-icon",
              children: plant.name.split(" ")[0] || "\uD83C\uDF31"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u4("div", {
              className: "shop-info",
              children: [
                /* @__PURE__ */ u4("div", {
                  className: "shop-name",
                  children: plant.name
                }, undefined, false, undefined, this),
                plant.description ? /* @__PURE__ */ u4("div", {
                  className: "shop-desc",
                  children: plant.description
                }, undefined, false, undefined, this) : null,
                /* @__PURE__ */ u4("div", {
                  className: "shop-tags",
                  children: [
                    /* @__PURE__ */ u4("span", {
                      className: "shop-tag",
                      children: [
                        "⏱ ",
                        formatTime2(plant.growth_sec)
                      ]
                    }, undefined, true, undefined, this),
                    /* @__PURE__ */ u4("span", {
                      className: "shop-tag",
                      children: [
                        "\uD83D\uDCC8 Ур. ",
                        plant.max_level
                      ]
                    }, undefined, true, undefined, this),
                    plant.subspecies_count > 1 ? /* @__PURE__ */ u4("span", {
                      className: "shop-tag",
                      children: [
                        "\uD83C\uDF3F ",
                        plant.subspecies_count,
                        " подвида"
                      ]
                    }, undefined, true, undefined, this) : null
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ u4("div", {
              className: "shop-action",
              children: [
                /* @__PURE__ */ u4("div", {
                  className: "shop-price bipki",
                  children: [
                    "\uD83E\uDE99 ",
                    plant.seed_price
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ u4("button", {
                  className: `btn ${canAfford ? "btn-primary" : "disabled"}`,
                  disabled: !canAfford,
                  onClick: () => buyPlant(plant.id),
                  children: "Купить"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, plant.id, true, undefined, this);
      })
    }, undefined, false, undefined, this)
  }, undefined, false, undefined, this);
}

// src/mini-apps/frontend/garden/components/Inventory.tsx
function isOnMarket(item) {
  return item.tradeable === 0;
}
function findTradeId(item) {
  for (const t4 of trades.value) {
    if (t4.item_id === item.id)
      return t4.id;
  }
  return null;
}
function getItemLevel(item) {
  if (!item.meta)
    return 0;
  try {
    const meta = JSON.parse(item.meta);
    return typeof meta.level === "number" ? meta.level : 0;
  } catch {
    return 0;
  }
}
function getUpgradeCost(currentLevel) {
  return 100 * (currentLevel + 1);
}
function showShardCraft() {
  const plants = catalog.value;
  showModal(/* @__PURE__ */ u4("div", {
    children: [
      /* @__PURE__ */ u4("div", {
        className: "title",
        children: "\uD83D\uDD28 Крафт обломков"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc",
        children: "Выбери растение, чьё базовое семя хочешь получить (5 \uD83E\uDEA8 = 1 семя):"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        style: { display: "flex", flexDirection: "column", gap: 8, marginTop: 8 },
        children: plants.map((p5) => /* @__PURE__ */ u4("button", {
          className: "btn btn-ghost",
          onClick: () => craftShards(p5.id),
          style: { width: "100%", textAlign: "left" },
          children: p5.name
        }, p5.id, false, undefined, this))
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("button", {
        className: "btn btn-ghost",
        onClick: hideModal,
        children: "Отмена"
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this));
}
function showUpgradeConfirm(item) {
  const level = getItemLevel(item);
  const cost = getUpgradeCost(level);
  const canAfford = userBalance.value.megabipki >= cost;
  const name = item.subspecies_name || item.plant_name || "Предмет";
  showModal(/* @__PURE__ */ u4("div", {
    children: [
      /* @__PURE__ */ u4("div", {
        className: "title",
        children: "⬆ Улучшить"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc",
        children: [
          name,
          ": ",
          level > 0 ? `+${level}` : "без уровня",
          " → ",
          /* @__PURE__ */ u4("strong", {
            children: [
              "+",
              level + 1
            ]
          }, undefined, true, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc mt-4",
        children: [
          "Стоимость: \uD83D\uDC8E ",
          cost
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc mt-4 text-dim",
        children: "Шанс открыть подвид: рассчитывается на сервере"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc",
        style: { display: "flex", gap: 8, marginTop: 12 },
        children: [
          /* @__PURE__ */ u4("button", {
            className: "btn btn-ghost",
            onClick: hideModal,
            style: { flex: 1 },
            children: "Отмена"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u4("button", {
            className: `btn ${canAfford ? "btn-primary" : "disabled"}`,
            disabled: !canAfford,
            onClick: () => upgradeItem(item.id),
            style: { flex: 1 },
            children: canAfford ? "⬆ Улучшить" : "\uD83D\uDC8E Не хватает"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this));
}
function showCancelConfirm(tradeId) {
  showModal(/* @__PURE__ */ u4("div", {
    children: [
      /* @__PURE__ */ u4("div", {
        className: "title",
        children: "\uD83D\uDCE2 Снять лот"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc",
        children: "Точно снять предмет с продажи? Он вернётся в инвентарь."
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        style: { display: "flex", gap: 8, marginTop: 4 },
        children: [
          /* @__PURE__ */ u4("button", {
            className: "btn btn-ghost",
            onClick: hideModal,
            style: { flex: 1 },
            children: "Назад"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u4("button", {
            className: "btn btn-danger",
            onClick: () => cancelTrade(tradeId),
            style: { flex: 1 },
            children: "Снять"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this));
}
function showSellModal(item) {
  const itemId = item.id;
  const plantName = item.subspecies_name || item.plant_name || "Предмет";
  let marketPrice = 100;
  const showMarketInput = () => {
    hideModal();
    showModal(/* @__PURE__ */ u4("div", {
      children: [
        /* @__PURE__ */ u4("div", {
          className: "title",
          children: "\uD83D\uDCE2 Рынок"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ u4("div", {
          className: "desc",
          children: [
            "Выставить «",
            plantName,
            "» на рынок. Укажи цену в \uD83E\uDE99 (комиссия 5% с продавца):"
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ u4("input", {
          type: "number",
          className: "price-input",
          min: 10,
          value: marketPrice,
          onInput: (e4) => {
            marketPrice = parseInt(e4.target.value, 10) || 0;
          }
        }, undefined, false, undefined, this),
        /* @__PURE__ */ u4("div", {
          className: "desc text-dim mt-4",
          children: [
            "Вы получите: \uD83E\uDE99 ",
            Math.floor(marketPrice - Math.ceil(marketPrice * 0.05))
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ u4("button", {
          className: "btn btn-gold",
          onClick: () => sellItem(itemId, marketPrice),
          style: { width: "100%", marginTop: 8 },
          children: "Выставить на рынок"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this));
  };
  showModal(/* @__PURE__ */ u4("div", {
    children: [
      /* @__PURE__ */ u4("div", {
        className: "title",
        children: "\uD83D\uDCB0 Продажа"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc",
        style: { fontSize: 14, textAlign: "center", lineHeight: 1.4 },
        children: [
          getItemEmoji(item),
          " ",
          /* @__PURE__ */ u4("strong", {
            children: plantName
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        style: { display: "flex", flexDirection: "column", gap: 8, marginTop: 4 },
        children: [
          item.plant_id === 1 ? /* @__PURE__ */ u4("button", {
            className: "btn btn-gold",
            onClick: () => autoSellItem(itemId),
            style: { width: "100%" },
            children: "⚡ Продать за \uD83E\uDE99"
          }, undefined, false, undefined, this) : null,
          /* @__PURE__ */ u4("button", {
            className: "btn btn-primary",
            onClick: showMarketInput,
            style: { width: "100%" },
            children: "\uD83D\uDCE2 Выставить на рынок"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this));
}
function Inventory() {
  const filter = useSignal("all");
  const items = inventory.value.filter((i4) => i4.quantity > 0);
  const filtered = items.filter((i4) => {
    if (filter.value === "all")
      return true;
    if (filter.value === "seed")
      return i4.type === "seed";
    if (filter.value === "harvest")
      return i4.type === "harvest";
    if (filter.value === "shard")
      return i4.type === "shard";
    if (filter.value === "market")
      return isOnMarket(i4);
    return true;
  });
  const allCount = items.length;
  const seedCount = items.filter((i4) => i4.type === "seed").length;
  const harvestCount = items.filter((i4) => i4.type === "harvest").length;
  const shardCount = items.filter((i4) => i4.type === "shard").length;
  const marketCount = items.filter((i4) => isOnMarket(i4)).length;
  return /* @__PURE__ */ u4("div", {
    children: [
      /* @__PURE__ */ u4("div", {
        className: "inv-filters",
        children: [
          /* @__PURE__ */ u4("button", {
            className: `filter-pill ${filter.value === "all" ? "active" : ""}`,
            onClick: () => {
              filter.value = "all";
            },
            children: [
              "Всё (",
              allCount,
              ")"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u4("button", {
            className: `filter-pill ${filter.value === "seed" ? "active" : ""}`,
            onClick: () => {
              filter.value = "seed";
            },
            children: [
              "\uD83C\uDF31 Семена (",
              seedCount,
              ")"
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u4("button", {
            className: `filter-pill ${filter.value === "harvest" ? "active" : ""}`,
            onClick: () => {
              filter.value = "harvest";
            },
            children: [
              "\uD83C\uDF81 Урожай (",
              harvestCount,
              ")"
            ]
          }, undefined, true, undefined, this),
          shardCount > 0 ? /* @__PURE__ */ u4("button", {
            className: `filter-pill ${filter.value === "shard" ? "active" : ""}`,
            onClick: () => {
              filter.value = "shard";
            },
            children: [
              "\uD83E\uDEA8 Обломки (",
              shardCount,
              ")"
            ]
          }, undefined, true, undefined, this) : null,
          marketCount > 0 ? /* @__PURE__ */ u4("button", {
            className: `filter-pill ${filter.value === "market" ? "active" : ""}`,
            onClick: () => {
              filter.value = "market";
            },
            children: [
              "\uD83D\uDCE2 В продаже (",
              marketCount,
              ")"
            ]
          }, undefined, true, undefined, this) : null
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "inv-grid",
        children: [
          !filtered.length ? /* @__PURE__ */ u4("div", {
            className: "empty-state",
            style: { gridColumn: "1/-1" },
            children: [
              /* @__PURE__ */ u4("div", {
                className: "empty-text",
                children: "Пусто"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u4("div", {
                className: "empty-hint",
                children: "Купи семена в магазине"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this) : null,
          filtered.map((item) => /* @__PURE__ */ u4(InventoryCard, {
            item
          }, item.id, false, undefined, this))
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function InventoryCard({ item }) {
  const emoji = getItemEmoji(item);
  const onMarket = isOnMarket(item);
  const tradeId = onMarket ? findTradeId(item) : null;
  const typeLabel = item.type === "seed" ? "семян" : item.type === "shard" ? "шт" : "шт";
  const level = item.type !== "shard" ? getItemLevel(item) : 0;
  const rarity = item.rarity;
  const displayName = item.subspecies_name || item.plant_name || "Предмет";
  const classes = ["inv-card"];
  if (onMarket)
    classes.push("on-market");
  return /* @__PURE__ */ u4("div", {
    className: classes.join(" "),
    children: [
      onMarket ? /* @__PURE__ */ u4("div", {
        className: "market-badge",
        children: "\uD83D\uDCE2 На рынке"
      }, undefined, false, undefined, this) : null,
      /* @__PURE__ */ u4("div", {
        className: "inv-icon",
        children: emoji
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "inv-name",
        children: [
          displayName,
          rarity ? /* @__PURE__ */ u4("span", {
            className: `rarity-badge ${rarity}`,
            style: { marginLeft: 4 },
            children: rarity
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "inv-qty",
        children: [
          "×",
          item.quantity,
          " ",
          typeLabel,
          level > 0 ? /* @__PURE__ */ u4("span", {
            style: { color: "var(--gold)", marginLeft: 4 },
            children: [
              "+",
              level
            ]
          }, undefined, true, undefined, this) : null
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "inv-actions",
        children: item.type === "shard" ? /* @__PURE__ */ u4("button", {
          className: "btn btn-primary btn-xs",
          onClick: showShardCraft,
          style: { width: "100%" },
          disabled: shardQuantity.value < 5,
          children: [
            "\uD83D\uDD28 Крафт (",
            shardQuantity.value,
            "/5)"
          ]
        }, undefined, true, undefined, this) : onMarket && tradeId ? /* @__PURE__ */ u4("button", {
          className: "btn btn-danger btn-xs",
          onClick: () => showCancelConfirm(tradeId),
          style: { width: "100%" },
          children: "Снять"
        }, undefined, false, undefined, this) : /* @__PURE__ */ u4(S, {
          children: item.type === "harvest" ? /* @__PURE__ */ u4(S, {
            children: [
              /* @__PURE__ */ u4("button", {
                className: "btn btn-gold btn-xs",
                onClick: () => showSellModal(item),
                children: "\uD83D\uDCB0 Продать"
              }, undefined, false, undefined, this),
              /* @__PURE__ */ u4("button", {
                className: "btn btn-xs",
                style: { background: "var(--accent2)", color: "#fff" },
                onClick: () => showUpgradeConfirm(item),
                children: "⬆ Улучшить"
              }, undefined, false, undefined, this)
            ]
          }, undefined, true, undefined, this) : null
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/mini-apps/frontend/garden/components/Market.tsx
function getTradeEmoji(trade) {
  if (trade.subspecies_emoji)
    return trade.subspecies_emoji;
  if (trade.item_type === "seed")
    return "\uD83C\uDF31";
  if (trade.rarity === "legendary")
    return "\uD83C\uDF1F";
  if (trade.rarity === "epic")
    return "\uD83D\uDC9C";
  if (trade.rarity === "rare")
    return "\uD83D\uDD2E";
  return "\uD83D\uDCE6";
}
function showBuyConfirm(trade) {
  const fee = Math.ceil(trade.price * 0.05);
  const sellerPayout = trade.price - fee;
  showModal(/* @__PURE__ */ u4("div", {
    children: [
      /* @__PURE__ */ u4("div", {
        className: "title",
        children: "\uD83C\uDFEA Подтверждение"
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc",
        style: { textAlign: "center", fontSize: 40, lineHeight: 1.4 },
        children: getTradeEmoji(trade)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc",
        style: { textAlign: "center", fontWeight: 600 },
        children: [
          trade.plant_name || "Предмет",
          trade.subspecies_name ? /* @__PURE__ */ u4("div", {
            className: "text-dim",
            children: trade.subspecies_name
          }, undefined, false, undefined, this) : null,
          trade.rarity ? /* @__PURE__ */ u4("span", {
            className: `rarity-badge ${trade.rarity}`,
            style: { marginLeft: 6 },
            children: trade.rarity
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc text-center mt-4",
        children: [
          "Цена: \uD83E\uDE99 ",
          trade.price
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc text-center text-dim",
        children: [
          "Продавец получает: \uD83E\uDE99 ",
          sellerPayout,
          " (комиссия 5%)"
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc text-center text-dim",
        children: [
          "Продавец: user",
          trade.seller_id
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        style: { display: "flex", gap: 8, marginTop: 8 },
        children: [
          /* @__PURE__ */ u4("button", {
            className: "btn btn-ghost",
            onClick: hideModal,
            style: { flex: 1 },
            children: "Назад"
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u4("button", {
            className: "btn btn-primary",
            onClick: () => buyTrade(trade.id),
            style: { flex: 1 },
            children: "Купить"
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this)
    ]
  }, undefined, true, undefined, this));
}
function MarketCard({ trade }) {
  return /* @__PURE__ */ u4("div", {
    className: "market-card",
    children: [
      /* @__PURE__ */ u4("div", {
        className: "market-icon",
        children: getTradeEmoji(trade)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "market-info",
        children: [
          /* @__PURE__ */ u4("div", {
            className: "market-name",
            children: [
              trade.plant_name || "Предмет",
              trade.subspecies_name ? /* @__PURE__ */ u4("span", {
                className: "text-dim",
                style: { marginLeft: 4, fontSize: 11 },
                children: trade.subspecies_name
              }, undefined, false, undefined, this) : null,
              trade.rarity ? /* @__PURE__ */ u4("span", {
                className: `rarity-badge ${trade.rarity}`,
                children: trade.rarity
              }, undefined, false, undefined, this) : null
            ]
          }, undefined, true, undefined, this),
          /* @__PURE__ */ u4("div", {
            className: "market-seller",
            children: trade.is_own ? "Ваш лот" : `Продавец: user${trade.seller_id}`
          }, undefined, false, undefined, this)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "market-price",
        children: [
          "\uD83E\uDE99 ",
          trade.price
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "market-action",
        children: trade.is_own ? /* @__PURE__ */ u4("button", {
          className: "btn btn-danger btn-sm",
          onClick: () => cancelTrade(trade.id),
          children: "Отменить"
        }, undefined, false, undefined, this) : /* @__PURE__ */ u4("button", {
          className: "btn btn-primary btn-sm",
          onClick: () => showBuyConfirm(trade),
          children: "Купить"
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function Market() {
  const items = trades.value;
  if (!items.length) {
    return /* @__PURE__ */ u4("div", {
      className: "empty-state",
      children: [
        /* @__PURE__ */ u4("div", {
          className: "empty-icon",
          children: "\uD83C\uDFEA"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ u4("div", {
          className: "empty-text",
          children: "Объявлений нет"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ u4("div", {
          className: "empty-hint",
          children: "Продай свой урожай первым!"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  return /* @__PURE__ */ u4("div", {
    className: "market-list",
    children: items.map((trade) => /* @__PURE__ */ u4(MarketCard, {
      trade
    }, trade.id, false, undefined, this))
  }, undefined, false, undefined, this);
}

// src/mini-apps/frontend/garden/components/Modal.tsx
function PlotInfo({ plot }) {
  const progress = getPlotProgress(plot);
  const emoji = getStageEmoji(plot);
  if (plot.state === "withered") {
    return /* @__PURE__ */ u4("div", {
      children: [
        /* @__PURE__ */ u4("div", {
          className: "text-center",
          style: { marginBottom: 8 },
          children: [
            /* @__PURE__ */ u4("div", {
              style: { fontSize: 48, lineHeight: 1.2 },
              children: "\uD83E\uDD40"
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u4("div", {
              className: "title",
              children: plot.plant_name || "Растение"
            }, undefined, false, undefined, this)
          ]
        }, undefined, true, undefined, this),
        /* @__PURE__ */ u4("div", {
          className: "desc text-center",
          children: [
            "\uD83C\uDF31 Семя не взошло... Грядка восстановится через ",
            getTimerDisplay(plot)
          ]
        }, undefined, true, undefined, this)
      ]
    }, undefined, true, undefined, this);
  }
  return /* @__PURE__ */ u4("div", {
    children: [
      /* @__PURE__ */ u4("div", {
        className: "text-center",
        style: { marginBottom: 8 },
        children: [
          /* @__PURE__ */ u4("div", {
            style: { fontSize: 48, lineHeight: 1.2 },
            children: emoji
          }, undefined, false, undefined, this),
          /* @__PURE__ */ u4("div", {
            className: "title",
            children: plot.plant_name || "Растение"
          }, undefined, false, undefined, this),
          plot.rarity ? /* @__PURE__ */ u4("span", {
            className: `rarity-badge ${plot.rarity}`,
            children: plot.rarity
          }, undefined, false, undefined, this) : null,
          plot.subspecies_name && plot.rarity !== "common" ? /* @__PURE__ */ u4("div", {
            className: "desc text-center mt-4",
            children: plot.subspecies_name
          }, undefined, false, undefined, this) : null
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "desc",
        style: { textAlign: "center" },
        children: [
          "⏱ ",
          getTimerDisplay(plot)
        ]
      }, undefined, true, undefined, this),
      /* @__PURE__ */ u4("div", {
        className: "mt-4",
        style: { height: 8, borderRadius: 4, background: "rgba(255,255,255,0.08)", overflow: "hidden" },
        children: /* @__PURE__ */ u4("div", {
          style: { width: `${progress}%`, height: 8, borderRadius: 4, background: "linear-gradient(90deg, var(--success), var(--gold))", transition: "width 1s linear" }
        }, undefined, false, undefined, this)
      }, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}
function Modal() {
  if (!modalVisible.value)
    return null;
  return /* @__PURE__ */ u4("div", {
    className: "modal-overlay",
    onClick: hideModal,
    children: /* @__PURE__ */ u4("div", {
      className: "modal-content",
      onClick: (e4) => e4.stopPropagation(),
      children: [
        plotInfoPlot.value ? /* @__PURE__ */ u4(PlotInfo, {
          plot: plotInfoPlot.value
        }, undefined, false, undefined, this) : modalContent.value,
        /* @__PURE__ */ u4("button", {
          className: "btn btn-ghost",
          onClick: hideModal,
          children: "Закрыть"
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}

// src/mini-apps/frontend/garden/components/Toast.tsx
var ICONS = {
  success: "✅",
  error: "❌"
};
function Toast() {
  const msg = toastMessage.value;
  if (!msg)
    return null;
  return /* @__PURE__ */ u4("div", {
    className: "toast-container",
    children: /* @__PURE__ */ u4("div", {
      className: `toast ${msg.type}`,
      children: [
        /* @__PURE__ */ u4("span", {
          className: "toast-icon",
          children: ICONS[msg.type] || "ℹ️"
        }, undefined, false, undefined, this),
        /* @__PURE__ */ u4("span", {
          className: "toast-text",
          children: msg.text
        }, undefined, false, undefined, this)
      ]
    }, undefined, true, undefined, this)
  }, undefined, false, undefined, this);
}

// src/mini-apps/frontend/garden/components/App.tsx
var TABS = [
  { id: "garden", label: "Огород", icon: "\uD83C\uDF3B" },
  { id: "shop", label: "Магазин", icon: "\uD83D\uDED2" },
  { id: "inventory", label: "Инвентарь", icon: "\uD83D\uDCE6" },
  { id: "market", label: "Рынок", icon: "\uD83C\uDFEA" }
];
function CurrentView() {
  switch (activeView.value) {
    case "garden":
      return /* @__PURE__ */ u4(Garden, {}, undefined, false, undefined, this);
    case "shop":
      return /* @__PURE__ */ u4(Shop, {}, undefined, false, undefined, this);
    case "inventory":
      return /* @__PURE__ */ u4(Inventory, {}, undefined, false, undefined, this);
    case "market":
      return /* @__PURE__ */ u4(Market, {}, undefined, false, undefined, this);
    default:
      return /* @__PURE__ */ u4(Garden, {}, undefined, false, undefined, this);
  }
}
function App() {
  return /* @__PURE__ */ u4("div", {
    id: "app",
    children: [
      /* @__PURE__ */ u4("header", {
        id: "header",
        children: /* @__PURE__ */ u4("div", {
          className: "header-top",
          children: [
            /* @__PURE__ */ u4("div", {
              className: "header-title",
              children: [
                "\uD83C\uDF3B ",
                /* @__PURE__ */ u4("span", {
                  children: "Огород"
                }, undefined, false, undefined, this)
              ]
            }, undefined, true, undefined, this),
            /* @__PURE__ */ u4("div", {
              className: "balance-bar",
              children: [
                /* @__PURE__ */ u4("div", {
                  className: "balance-item bipki",
                  children: [
                    "\uD83E\uDE99 ",
                    userBalance.value.bipki ?? 0
                  ]
                }, undefined, true, undefined, this),
                /* @__PURE__ */ u4("div", {
                  className: "balance-item mega",
                  children: [
                    "\uD83D\uDC8E ",
                    userBalance.value.megabipki ?? 0
                  ]
                }, undefined, true, undefined, this)
              ]
            }, undefined, true, undefined, this)
          ]
        }, undefined, true, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("main", {
        id: "content",
        children: /* @__PURE__ */ u4(CurrentView, {}, undefined, false, undefined, this)
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4("nav", {
        id: "bottom-nav",
        children: TABS.map((tab) => /* @__PURE__ */ u4("button", {
          className: `nav-btn ${activeView.value === tab.id ? "active" : ""}`,
          onClick: () => {
            activeView.value = tab.id;
          },
          children: [
            /* @__PURE__ */ u4("div", {
              className: "nav-icon",
              children: tab.icon
            }, undefined, false, undefined, this),
            /* @__PURE__ */ u4("div", {
              className: "nav-label",
              children: tab.label
            }, undefined, false, undefined, this)
          ]
        }, tab.id, true, undefined, this))
      }, undefined, false, undefined, this),
      /* @__PURE__ */ u4(Modal, {}, undefined, false, undefined, this),
      /* @__PURE__ */ u4(Toast, {}, undefined, false, undefined, this)
    ]
  }, undefined, true, undefined, this);
}

// src/mini-apps/frontend/garden/app.tsx
var tg = window.Telegram?.WebApp;
var initData2 = "";
if (tg) {
  tg.ready();
  tg.expand();
  initData2 = tg.initData || "";
}
if (!initData2) {
  const match = window.location.hash.match(/[#&]tgWebAppData=([^&]+)/);
  if (match) {
    initData2 = decodeURIComponent(match[1]);
  }
}
var params = new URLSearchParams(window.location.search);
var urlAuth2 = params.get("auth") || "";
setupAuth(initData2, urlAuth2);
setInterval(() => {
  timerTick.value = Date.now();
}, 1000);
loadAll();
R(/* @__PURE__ */ u4(App, {}, undefined, false, undefined, this), document.getElementById("root"));
