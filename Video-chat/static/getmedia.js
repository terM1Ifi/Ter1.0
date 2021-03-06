function getMediaElement(n, t) {
    function y() {
        e.style.marginLeft = i.clientWidth - e.clientWidth - 2 + "px";
        l ? (l.style.width = i.clientWidth / 3 + "px", f.style.marginLeft = i.clientWidth / 3 - 30 + "px", r && (r.style["border-top-right-radius"] = "5px")) : f.style.marginLeft = i.clientWidth - f.clientWidth - 2 + "px";
        f.style.marginTop = i.clientHeight - f.clientHeight - 2 + "px";
        k < 10 ? (k++, setTimeout(y, 1e3)) : k = 0
    }
    var p, u, i, e, h, c, w, v, f, o, s, b, l, r, a, k;
    if (t = t || {}, !n.nodeName || n.nodeName.toLowerCase() != "audio" && n.nodeName.toLowerCase() != "video") {
        if (!n.getVideoTracks().length) return getAudioElement(n, t);
        p = n;
        n = document.createElement(p.getVideoTracks().length ? "video" : "audio");
        n[!navigator.mozGetUserMedia ? "src" : "mozSrcObject"] = !navigator.mozGetUserMedia ? window.webkitURL.createObjectURL(p) : p
    }
    if (n.nodeName && n.nodeName.toLowerCase() == "audio") return getAudioElement(n, t);
    if (n.controls = !1, u = t.buttons || ["mute-audio", "mute-video", "full-screen", "volume-slider", "stop"], u.has = function (n) {
        return u.indexOf(n) !== -1
    }, t.toggle = t.toggle || [], t.toggle.has = function (n) {
        return t.toggle.indexOf(n) !== -1
    }, i = document.createElement("div"), i.className = "media-container", e = document.createElement("div"), e.className = "media-controls", i.appendChild(e), u.has("mute-audio") && (h = document.createElement("div"), h.className = "control " + (t.toggle.has("mute-audio") ? "unmute-audio selected" : "mute-audio"), e.appendChild(h), h.onclick = function () {
        if (h.className.indexOf("unmute-audio") != -1) {
            if (h.className = h.className.replace("unmute-audio selected", "mute-audio"), n.muted = !1, n.volume = 1, t.onUnMuted) t.onUnMuted("audio")
        } else if (h.className = h.className.replace("mute-audio", "unmute-audio selected"), n.muted = !0, n.volume = 0, t.onMuted) t.onMuted("audio")
    }), u.has("mute-video") && (c = document.createElement("div"), c.className = "control " + (t.toggle.has("mute-video") ? "unmute-video selected" : "mute-video"), e.appendChild(c), c.onclick = function () {
        if (c.className.indexOf("unmute-video") != -1) {
            if (c.className = c.className.replace("unmute-video selected", "mute-video"), n.muted = !1, n.volume = 1, n.play(), t.onUnMuted) t.onUnMuted("video")
        } else if (c.className = c.className.replace("mute-video", "unmute-video selected"), n.muted = !0, n.volume = 0, n.pause(), t.onMuted) t.onMuted("video")
    }), u.has("take-snapshot") && (w = document.createElement("div"), w.className = "control take-snapshot", e.appendChild(w), w.onclick = function () {
        t.onTakeSnapshot && t.onTakeSnapshot()
    }), u.has("stop") && (v = document.createElement("div"), v.className = "control stop", e.appendChild(v), v.onclick = function () {
        i.style.opacity = 0;
        setTimeout(function () {
            i.parentNode && i.parentNode.removeChild(i)
        }, 800);
        t.onStopped && t.onStopped()
    }), f = document.createElement("div"), f.className = "volume-control", u.has("record-audio") && (o = document.createElement("div"), o.className = "control " + (t.toggle.has("record-audio") ? "stop-recording-audio selected" : "record-audio"), f.appendChild(o), o.onclick = function () {
        if (o.className.indexOf("stop-recording-audio") != -1) {
            if (o.className = o.className.replace("stop-recording-audio selected", "record-audio"), t.onRecordingStopped) t.onRecordingStopped("audio")
        } else if (o.className = o.className.replace("record-audio", "stop-recording-audio selected"), t.onRecordingStarted) t.onRecordingStarted("audio")
    }), u.has("record-video") && (s = document.createElement("div"), s.className = "control " + (t.toggle.has("record-video") ? "stop-recording-video selected" : "record-video"), f.appendChild(s), s.onclick = function () {
        if (s.className.indexOf("stop-recording-video") != -1) {
            if (s.className = s.className.replace("stop-recording-video selected", "record-video"), t.onRecordingStopped) t.onRecordingStopped("video")
        } else if (s.className = s.className.replace("record-video", "stop-recording-video selected"), t.onRecordingStarted) t.onRecordingStarted("video")
    }), u.has("volume-slider") && (b = document.createElement("div"), b.className = "control volume-slider", f.appendChild(b), l = document.createElement("input"), l.type = "range", l.min = 0, l.max = 100, l.value = 100, l.onchange = function () {
        n.volume = "." + l.value.toString().substr(0, 1)
    }, b.appendChild(l)), u.has("full-screen")) {
        r = document.createElement("div");
        r.className = "control " + (t.toggle.has("zoom-in") ? "zoom-out selected" : "zoom-in");
        l || o || s || !r ? f.appendChild(r) : e.insertBefore(r, e.firstChild);
        r.onclick = function () {
            r.className.indexOf("zoom-out") != -1 ? (r.className = r.className.replace("zoom-out selected", "zoom-in"), nt()) : (r.className = r.className.replace("zoom-in", "zoom-out selected"), g(i))
        };

        function g(n) {
            n.requestFullscreen ? n.requestFullscreen() : n.mozRequestFullScreen ? n.mozRequestFullScreen() : n.webkitRequestFullscreen && n.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
        }

        function nt() {
            document.fullscreen && document.cancelFullScreen();
            document.mozFullScreen && document.mozCancelFullScreen();
            document.webkitIsFullScreen && document.webkitCancelFullScreen()
        }

        function d(n) {
            if (n.srcElement == i) {
                var u = document.webkitIsFullScreen || document.mozFullScreen || document.fullscreen;
                i.style.width = (u ? window.innerWidth - 20 : t.width) + "px";
                i.style.display = u ? "block" : "inline-block";
                t.height && (a.style.height = (u ? window.innerHeight - 20 : t.height) + "px");
                !u && t.onZoomout && t.onZoomout();
                u && t.onZoomin && t.onZoomin();
                u || r.className.indexOf("zoom-out") == -1 || (r.className = r.className.replace("zoom-out selected", "zoom-in"), t.onZoomout && t.onZoomout());
                setTimeout(y, 1e3)
            }
        }
        document.addEventListener("fullscreenchange", d, !1);
        document.addEventListener("mozfullscreenchange", d, !1);
        document.addEventListener("webkitfullscreenchange", d, !1)
    }
    return (u.has("volume-slider") || u.has("full-screen") || u.has("record-audio") || u.has("record-video")) && i.appendChild(f), a = document.createElement("div"), a.className = "media-box", i.appendChild(a), a.appendChild(n), t.width || (t.width = innerWidth / 2 - 50), i.style.width = t.width + "px", t.height && (a.style.height = t.height + "px"), a.querySelector("video").style.maxHeight = innerHeight + "px", k = 0, t.showOnMouseEnter || typeof t.showOnMouseEnter == "undefined" ? (i.onmouseenter = i.onmousedown = function () {
        y();
        e.style.opacity = 1;
        f.style.opacity = 1
    }, i.onmouseleave = function () {
        e.style.opacity = 0;
        f.style.opacity = 0
    }) : setTimeout(function () {
        y();
        setTimeout(function () {
            e.style.opacity = 1;
            f.style.opacity = 1
        }, 300)
    }, 700), y(), i.toggle = function (n) {
        if (typeof n != "string") {
            for (var t = 0; t < n.length; t++) i.toggle(n[t]);
            return
        }
        return n == "mute-audio" && h && h.onclick(), n == "mute-video" && c && c.onclick(), n == "record-audio" && o && o.onclick(), n == "record-video" && s && s.onclick(), n == "stop" && v && v.onclick(), this
    }, i.media = n, i
}

function getAudioElement(n, t) {
    function a() {
        r.style.marginLeft = i.clientWidth - r.clientWidth - 7 + "px";
        r.style.marginTop = i.clientHeight - r.clientHeight - 6 + "px";
        l < 10 ? (l++, setTimeout(a, 1e3)) : l = 0
    }
    var v, i, r, u, f, c, e, o, h, s, l;
    return t = t || {}, n.nodeName && (n.nodeName.toLowerCase() == "audio" || n.nodeName.toLowerCase() == "video") || (v = n, n = document.createElement("audio"), n[!navigator.mozGetUserMedia ? "src" : "mozSrcObject"] = !navigator.mozGetUserMedia ? window.webkitURL.createObjectURL(v) : v), t.toggle = t.toggle || [], t.toggle.has = function (n) {
        return t.toggle.indexOf(n) !== -1
    }, n.controls = !1, n.play(), i = document.createElement("div"), i.className = "media-container", r = document.createElement("div"), r.className = "media-controls", i.appendChild(r), u = document.createElement("div"), u.className = "control " + (t.toggle.has("mute-audio") ? "unmute-audio selected" : "mute-audio"), r.appendChild(u), u.style["border-top-left-radius"] = "5px", u.onclick = function () {
        if (u.className.indexOf("unmute-audio") != -1) {
            if (u.className = u.className.replace("unmute-audio selected", "mute-audio"), n.muted = !1, t.onUnMuted) t.onUnMuted("audio")
        } else if (u.className = u.className.replace("mute-audio", "unmute-audio selected"), n.muted = !0, t.onMuted) t.onMuted("audio")
    }, (!t.buttons || t.buttons && t.buttons.indexOf("record-audio") != -1) && (f = document.createElement("div"), f.className = "control " + (t.toggle.has("record-audio") ? "stop-recording-audio selected" : "record-audio"), r.appendChild(f), f.onclick = function () {
        if (f.className.indexOf("stop-recording-audio") != -1) {
            if (f.className = f.className.replace("stop-recording-audio selected", "record-audio"), t.onRecordingStopped) t.onRecordingStopped("audio")
        } else if (f.className = f.className.replace("record-audio", "stop-recording-audio selected"), t.onRecordingStarted) t.onRecordingStarted("audio")
    }), c = document.createElement("div"), c.className = "control volume-slider", c.style.width = "auto", r.appendChild(c), e = document.createElement("input"), e.style.marginTop = "11px", e.style.width = " 200px", t.buttons && t.buttons.indexOf("record-audio") == -1 && (e.style.width = " 241px"), e.type = "range", e.min = 0, e.max = 100, e.value = 100, e.onchange = function () {
        n.volume = "." + e.value.toString().substr(0, 1)
    }, c.appendChild(e), o = document.createElement("div"), o.className = "control stop", r.appendChild(o), o.onclick = function () {
        i.style.opacity = 0;
        setTimeout(function () {
            i.parentNode && i.parentNode.removeChild(i)
        }, 800);
        t.onStopped && t.onStopped()
    }, o.style["border-top-right-radius"] = "5px", o.style["border-bottom-right-radius"] = "5px", h = document.createElement("div"), h.className = "media-box", i.appendChild(h), s = document.createElement("h2"), s.innerHTML = t.title || "Audio Element", s.setAttribute("style", "position: absolute;color: rgb(160, 160, 160);font-size: 20px;text-shadow: 1px 1px rgb(255, 255, 255);padding:0;margin:0;"), h.appendChild(s), h.appendChild(n), i.style.width = "329px", h.style.height = "90px", s.style.width = i.style.width, s.style.height = "50px", s.style.overflow = "hidden", l = 0, t.showOnMouseEnter || typeof t.showOnMouseEnter == "undefined" ? (i.onmouseenter = i.onmousedown = function () {
        a();
        r.style.opacity = 1
    }, i.onmouseleave = function () {
        r.style.opacity = 0
    }) : setTimeout(function () {
        a();
        setTimeout(function () {
            r.style.opacity = 1
        }, 300)
    }, 700), a(), i.toggle = function (n) {
        if (typeof n != "string") {
            for (var t = 0; t < n.length; t++) i.toggle(n[t]);
            return
        }
        return n == "mute-audio" && u && u.onclick(), n == "record-audio" && f && f.onclick(), n == "stop" && o && o.onclick(), this
    }, i.media = n, i
}
document.write('<link rel="stylesheet" href="getmedia.css">')
