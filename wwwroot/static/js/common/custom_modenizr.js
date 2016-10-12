/*! modernizr 3.3.1 (Custom Build) | MIT *
 * https://modernizr.com/download/?-canvas-websockets-setclasses !*/
! function(e, n, t) {
    function s(e, n) {
        return typeof e === n
    }

    function a() {
        var e, n, t, a, o, i, l;
        for (var f in c)
            if (c.hasOwnProperty(f)) {
                if (e = [], n = c[f], n.name && (e.push(n.name.toLowerCase()), n.options && n.options.aliases && n.options.aliases.length))
                    for (t = 0; t < n.options.aliases.length; t++) e.push(n.options.aliases[t].toLowerCase());
                for (a = s(n.fn, "function") ? n.fn() : n.fn, o = 0; o < e.length; o++) i = e[o], l = i.split("."), 1 === l.length ? Modernizr[l[0]] = a : (!Modernizr[l[0]] || Modernizr[l[0]] instanceof Boolean || (Modernizr[l[0]] = new Boolean(Modernizr[l[0]])), Modernizr[l[0]][l[1]] = a), r.push((a ? "" : "no-") + l.join("-"))
            }
    }

    function o(e) {
        var n = f.className,
            t = Modernizr._config.classPrefix || "";
        if (u && (n = n.baseVal), Modernizr._config.enableJSClass) {
            var s = new RegExp("(^|\\s)" + t + "no-js(\\s|$)");
            n = n.replace(s, "$1" + t + "js$2")
        }
        Modernizr._config.enableClasses && (n += " " + t + e.join(" " + t), u ? f.className.baseVal = n : f.className = n)
    }

    function i() {
        return "function" != typeof n.createElement ? n.createElement(arguments[0]) : u ? n.createElementNS.call(n, "http://www.w3.org/2000/svg", arguments[0]) : n.createElement.apply(n, arguments)
    }
    var r = [],
        c = [],
        l = {
            _version: "3.3.1",
            _config: {
                classPrefix: "",
                enableClasses: !0,
                enableJSClass: !0,
                usePrefixes: !0
            },
            _q: [],
            on: function(e, n) {
                var t = this;
                setTimeout(function() {
                    n(t[e])
                }, 0)
            },
            addTest: function(e, n, t) {
                c.push({
                    name: e,
                    fn: n,
                    options: t
                })
            },
            addAsyncTest: function(e) {
                c.push({
                    name: null,
                    fn: e
                })
            }
        },
        Modernizr = function() {};
    Modernizr.prototype = l, Modernizr = new Modernizr;
    var f = n.documentElement,
        u = "svg" === f.nodeName.toLowerCase();
    Modernizr.addTest("canvas", function() {
        var e = i("canvas");
        return !(!e.getContext || !e.getContext("2d"))
    });
    var d = !1;
    try {
        d = "WebSocket" in e && 2 === e.WebSocket.CLOSING
    } catch (p) {}
    Modernizr.addTest("websockets", d), a(), o(r), delete l.addTest, delete l.addAsyncTest;
    for (var m = 0; m < Modernizr._q.length; m++) Modernizr._q[m]();
    e.Modernizr = Modernizr
}(window, document);
