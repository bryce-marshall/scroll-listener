(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scroll_listener_demo_1 = require("./scroll-listener-demo");
var tracking_test_1 = require("./tracking-test");
var padding_test_1 = require("./padding-test");
var _test;
window.onload = function () {
    if (_mode == "demo") {
        _test = new scroll_listener_demo_1.ScrollListenerDemo();
        _test.init();
        window.onresize = function () {
            _test.onResize();
        };
    }
    else if (_mode == "tracking-test") {
        _test = new tracking_test_1.TrackingTest();
        _test.init();
    }
    else if (_mode == "padding-test") {
        _test = new padding_test_1.PaddingTest();
        _test.init();
    }
};

},{"./padding-test":3,"./scroll-listener-demo":4,"./tracking-test":5}],2:[function(require,module,exports){
"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var event_throttle_1 = require("@brycemarshall/event-throttle");
/**
 * Describes the type of an encapsulated DOM object.
 */
var DOMType;
(function (DOMType) {
    DOMType[DOMType["Element"] = 0] = "Element";
    DOMType[DOMType["Document"] = 1] = "Document";
    DOMType[DOMType["Window"] = 2] = "Window";
})(DOMType = exports.DOMType || (exports.DOMType = {}));
/**
 * A collection of objects implementing IScrollEventTarget which can be used to create a new ScrollListener instance for tracking a specific
 * target element.
 * Valid IScrollEventTarget instances include any DOM Element (including the global document variable), and a reference to a Window object.
 * Note that although each element must be a parent node (or logical parent node in the case of Window) of the target element
 * to be tracked, it does not matter in what order they are added to the collection.
 * @class ScrollEventTargetCollection
 */
var ScrollEventTargetCollection = (function () {
    /**
     * Creates a new ScrollEventTargetCollection instance.
     * @param items The IScrollEventTarget instances to add to the new collection.
     */
    function ScrollEventTargetCollection() {
        var items = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            items[_i] = arguments[_i];
        }
        this._members = new Array(items.length);
        for (var i = 0; i < items.length; i++) {
            var e = items[i];
            if (e == null)
                throw new Error('A null IScrollEventTarget reference was passed to the constructor.');
            this._members[i] = e;
        }
    }
    /**
     * Creates and automatically populates a ScrollEventTargetCollection with IScrollEventTarget parents of target.
     * @param target The HTMLElement that will be tracked by a ScrollListener instance.
     * @param scopeLimiter Optional. When specified, limits the set of IScrollEventTarget containers that will be resolved by this method
     * to all containers of parentElement up to and including scopeLimiter.
     */
    ScrollEventTargetCollection.auto = function (target, scopeLimiter) {
        if (target == null)
            throw new Error('The parameter "target" cannot be null.');
        var result = new ScrollEventTargetCollection();
        var fn = null;
        if (scopeLimiter == null)
            fn = ScrollEventTargetCollection.defaultScopeLimiter;
        else if (typeof (scopeLimiter) === "function")
            fn = scopeLimiter;
        if (fn != null) {
            target = target.parentElement;
            while (target != null) {
                if (fn(DOMType.Element, target))
                    result.add(target);
                target = target.parentElement;
            }
            if (fn(DOMType.Document, document))
                result.add(document);
            if (fn(DOMType.Window, window))
                result.add(window);
        }
        else {
            target = target !== scopeLimiter ? target.parentElement : null;
            while (target != null) {
                result.add(target);
                target = target !== scopeLimiter ? target.parentElement : null;
            }
        }
        return result;
    };
    Object.defineProperty(ScrollEventTargetCollection, "defaultScopeLimiter", {
        /**
         * Returns the default ScrollEventScopeLimiter function used by the static auto method when no other limiter is specified.
         * The function will include all parent elements of the target HTMLElement, and finally the window object.
         * It will exclude the document object.
         */
        get: function () {
            return function (domType, eventSource) {
                if (domType == DOMType.Document)
                    return false;
                if (domType == DOMType.Window)
                    return true;
                var e = eventSource;
                return e.tagName != "BODY" && e.tagName != "HTML";
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ScrollEventTargetCollection.prototype, "count", {
        /**
         * Returns the number of IScrollEventTarget instances within the collection.
         */
        get: function () {
            return this._members.length;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Returns the IScrollEventTarget at the specified index.
     * @param index
     * @throws If index is null, less than 0, or greater than this.count.
     */
    ScrollEventTargetCollection.prototype.get = function (index) {
        if (index == null)
            throw new Error('The parameter "index" cannot be null.');
        if (index < 0 || index >= this.count)
            throw new Error('The value of the parameter "index" must be greater-than-or-equal to 0 and less than count.');
        return this._members[index];
    };
    /**
     * Adds an IScrollEventTarget instance to the collection.
     * @param eventTarget The instance to add.
     */
    ScrollEventTargetCollection.prototype.add = function (eventTarget) {
        if (eventTarget == null)
            throw new Error('The parameter "eventTarget" cannot be null.');
        if (typeof (eventTarget) != "string")
            this._members = this._members.concat(eventTarget);
        else {
            var e = document.getElementById(eventTarget);
            if (e == null)
                throw new Error('No document element could be resolved using the id "' + eventTarget + '" passed in the "eventTarget" parameter.');
            this._members.push(e);
        }
    };
    /**
     * Returns an array of the IScrollEventTarget instances in the collection, sorted by their inverse hierarchical position in the document hierarchy
     * (child elements first preceeding their parent elements, and finally the window object if it is present).
     */
    ScrollEventTargetCollection.prototype.toArray = function () {
        var result = new Array(this._members.length);
        for (var i = 0; i < this._members.length; i++)
            result[i] = this._members[i];
        if (!Node.prototype.compareDocumentPosition)
            return result;
        result.sort(function (x, y) {
            if (x.compareDocumentPosition)
                if (y.compareDocumentPosition)
                    return x.compareDocumentPosition(y) & 2 ? -1 : 1;
                else
                    return -1;
            return (y.compareDocumentPosition) ? 1 : -1;
        });
        return result;
    };
    return ScrollEventTargetCollection;
}());
exports.ScrollEventTargetCollection = ScrollEventTargetCollection;
/**
 * A helper class that that invokes a callback function when a specified target element is scrolled.
 * ScrollListener enables easy throttling of the upstream scroll events that it subscribes to (to prevent the UI from being overloaded)
 * and also provides client code with useful information about the target element, including its visibility and position relative to the
 * parent elements that contain it.
 * ScrollListener works by subscribing to the scroll event of each event source passed to its constructor via the "eventSources" parameter (as a ScrollEventTargetCollection instance).
 * It is important to understand that the set of event sources defines the scope of the ScrollListener instance. This has two implications:
 * (1) If the target element is scrolled by any container not included in the ScrollEventTargetCollection instance, then ScrollListener will not handle the event; and
 * (2) The target element's visibility (reported by the "intersectsScope" and "withinScope" properties of the ScrollListenerEventArgs class) is relative to the topmost element of the defined scope.
 * This means that ScrollListener will report that the target is visible if it's bounding rectangle is fully contained within the client rectangle of the
 * topmost container in the scope, irrespecitive of whether or not the target it is visible within parent containers (such as the Window object)
 * that may not have been not included in the scope.
 * @class ScrollListener
 */
var ScrollListener = (function () {
    /**
     * Creates a new ScrollListener instance.
     * @param target The element to track.
     * @param eventSources The scroll-event sources that the ScrollListener instance will intercept the scroll events of.
     * @param callbackFunction The function that the ScrollListener instance will forward downstream (throttled) scroll events to.
     * @param options Additional configuration options.
     */
    function ScrollListener(target, eventSources, callbackFunction, options) {
        var _this = this;
        /** @internal */
        this._fn = null;
        /** @internal */
        this._traceFn = null;
        if (target == null)
            throw new Error('The parameter "target" cannot be null.');
        if (eventSources == null)
            throw new Error('The parameter "eventSources" cannot be null.');
        if (callbackFunction == null)
            throw new Error('The parameter "callbackFunction" cannot be null.');
        if (eventSources.count == 0)
            throw new Error('The ScrollEventTargetCollection instance does not contain any event sources.');
        var to = null;
        if (options) {
            this._state = options.state;
            if (typeof (options.throttleDuration) == "number" && options.throttleDuration >= 0)
                to = { throttleDuration: options.throttleDuration };
            if (typeof (options.traceFunction) == "function")
                this._traceFn = options.traceFunction;
        }
        this._throttle = new event_throttle_1.EventThrottle(function (s, e, state) { _this.onDownstreamEvent(s, e, state); }, to);
        this._targetElement = target;
        this._fn = callbackFunction;
        var handlerRef = function (source, e) { if (_this._traceFn)
            _this._traceFn(_this, e); _this._throttle.registerEvent(e, source); };
        var es = eventSources.toArray();
        var s = ScrollEventSource.createFrom(handlerRef, es[0], null);
        s.bind();
        this._baseEventSrc = s;
        for (var idx = 1; idx < es.length; idx++) {
            s = ScrollEventSource.createFrom(handlerRef, es[idx], s);
            s.bind();
        }
    }
    Object.defineProperty(ScrollListener.prototype, "targetElement", {
        /**
         * Returns the element that the ScrollListener instance is tracking.
         */
        get: function () {
            return this._targetElement;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ScrollListener.prototype, "enabled", {
        /**
         * Gets or sets the enabled state of the ScrollListener instance.
         */
        get: function () {
            return this._throttle.enabled;
        },
        set: function (value) {
            this._throttle.enabled = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ScrollListener.prototype, "backlog", {
        /**
         * Returns the current number of throttled upstream events.
         * ScrollListener does not guarantee to forward all throttled events to the downstream handler, however it will always
         * forward the most recent event and guarantees to forward the last event in each sequence.
         */
        get: function () {
            return this._throttle.throttled;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ScrollListener.prototype, "isScrolling", {
        /**
         * Returns true if any scroll-event source that the ScrollListener instance has subscribed to is currently scrolling, otherwise returns false.
         */
        get: function () {
            return this._throttle.isThrottling;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * A debugging feature that writes information about the scope of the current instance to the console.
     */
    ScrollListener.prototype.dumpScope = function (asText) {
        var s = this._baseEventSrc;
        while (s != null) {
            Helper.dumpSource(s, asText);
            s = s.parent;
        }
    };
    /**
     * Detaches all event listeners and releases all resources.
     */
    ScrollListener.prototype.destroy = function () {
        if (this._baseEventSrc == null)
            return;
        this._throttle.enabled = false;
        this._throttle = null;
        this._targetElement = null;
        this._state = null;
        this._fn = null;
        var es = this._baseEventSrc;
        while (es != null) {
            es.release();
            es = es.parent;
        }
        this._baseEventSrc = null;
    };
    /**
     * Returns true if the element exposes a getBoundingClientRect method an onscroll property, and addEventListener and removeEventListener methods,
     * otherwise false.
     * @param element The element to test.
     */
    ScrollListener.isScrollableContainer = function (element) {
        return element != null && element.getBoundingClientRect != undefined && element.onscroll != undefined && element.addEventListener != undefined && element.removeEventListener != undefined;
    };
    /** @internal */
    ScrollListener.prototype.onDownstreamEvent = function (sender, e, source) {
        // _topEventSource will be null in the event that destroy() was invoked prior to timeout.
        if (this._baseEventSrc == null)
            return;
        this._fn(this, this.getEventArgs(e, source));
    };
    /** @internal */
    ScrollListener.prototype.getEventArgs = function (event, source) {
        var that = this;
        var _bRect = Helper.createScrollOffsetRect(this.targetElement.getBoundingClientRect());
        var _rel = null;
        var _intRect = null;
        var _data = new ArgData();
        var _intsSrc = null;
        var _intsScope = null;
        var _scrolling = this._throttle.isThrottling;
        return {
            get source() {
                return source.source;
            },
            get sourceType() {
                return source.sourceType;
            },
            get sourceEvent() {
                return event;
            },
            get intersectionalRectangle() {
                if (_intRect == null)
                    _intRect = that.getIntersectionalRectangle(_bRect, source);
                return _intRect;
            },
            getScopeRectangles: function () {
                if (_data.scopeRects == null) {
                    that.getScopedIntersectionalRectangles(_bRect, _data);
                }
                return _data.scopeRects;
            },
            getIntersectionData: function () {
                return that.createIntersectionData(this.getScopeRectangles());
            },
            getRelativeRectangle: function (other) {
                if (other == null || other === source.source) {
                    if (_rel == null)
                        _rel = that.getRelativeRectangle(_bRect, source.getBoundingClientRect());
                    return _rel;
                }
                return that.getRelativeRectangle(_bRect, other.getBoundingClientRect());
            },
            get intersectsSource() {
                if (_intsSrc == null) {
                    _intsSrc = Helper.deriveIntRes(_bRect, this.intersectionalRectangle);
                }
                return _intsSrc.intersects;
            },
            get withinSource() {
                if (_intsSrc == null) {
                    this.intersectsSource;
                }
                return _intsSrc.contains;
            },
            get intersectsScope() {
                if (_intsScope == null) {
                    if (that._baseEventSrc.parent == null) {
                        this.intersectsSource;
                        _intsScope = _intsSrc;
                    }
                    else {
                        _intsScope = Helper.deriveIntResArray(_bRect, this.getScopeRectangles());
                    }
                }
                return _intsScope.intersects;
            },
            get withinScope() {
                if (_intsScope == null) {
                    this.intersectsScope;
                }
                return _intsScope.contains;
            },
            get scrolling() {
                return _scrolling;
            },
            get state() {
                return that._state;
            },
            dumpScope: function (asText) {
                if (asText)
                    Helper.dumpIntData(that._baseEventSrc, this.getScopeRectangles());
                else {
                    for (var _i = 0, _a = this.getIntersectionData(); _i < _a.length; _i++) {
                        var d = _a[_i];
                        console.log(d);
                    }
                }
            }
        };
    };
    /** @internal */
    ScrollListener.prototype.getScopedIntersectionalRectangles = function (r, d) {
        var a = d.scopeRects = [r];
        var s = this._baseEventSrc;
        while (s != null && r.width > 0) {
            d.lastSource = s;
            r = this.getIntersectionalRectangle(r, s);
            a.push(r);
            s = s.parent;
        }
    };
    /** @internal */
    ScrollListener.prototype.getIntersectionalRectangle = function (child, container) {
        var cr = container.getClientRect();
        if (child.bottom <= cr.top || child.top >= cr.bottom || child.right <= cr.left || child.left >= cr.right)
            return EnclosedTypeFactory.createRect(0, 0, 0, 0);
        return EnclosedTypeFactory.createRect(Math.max(child.top, cr.top), Math.min(child.bottom, cr.bottom), Math.max(child.left, cr.left), Math.min(child.right, cr.right));
    };
    /** @internal */
    ScrollListener.prototype.getRelativeRectangle = function (rect, crect) {
        var t = rect.top - crect.top;
        var l = rect.left - crect.left;
        return EnclosedTypeFactory.createRect(t, t + rect.height, l, l + rect.width);
    };
    ScrollListener.prototype.createIntersectionData = function (rects) {
        var res = [EnclosedTypeFactory.createIntData(rects[0], DOMType.Element, this._targetElement)];
        var s = this._baseEventSrc;
        for (var i = 1; i < rects.length; i++) {
            res.push(EnclosedTypeFactory.createIntData(rects[i], s.sourceType, s.source));
            s = s.parent;
        }
        return res;
    };
    return ScrollListener;
}());
exports.ScrollListener = ScrollListener;
var ScrollEventSource = (function () {
    function ScrollEventSource(eventHandler, child) {
        var _this = this;
        this._parent = null;
        this._eventHandler = eventHandler;
        if (child) {
            child._parent = this;
        }
        this._localHandlerRef = function (e) { _this._eventHandler(_this, e); };
    }
    ScrollEventSource.prototype.getClientRect = function () {
        return Helper.createOffsetRect(this);
    };
    Object.defineProperty(ScrollEventSource.prototype, "parent", {
        get: function () {
            return this._parent;
        },
        enumerable: true,
        configurable: true
    });
    ScrollEventSource.prototype.bind = function () {
        this.source.addEventListener("scroll", this._localHandlerRef);
    };
    ScrollEventSource.prototype.release = function () {
        this.source.removeEventListener("scroll", this._localHandlerRef);
    };
    ScrollEventSource.createFrom = function (eventHandler, source, child) {
        if (eventHandler == null)
            throw new Error('The parameter "eventHandler" cannot be null.');
        if (source == null)
            throw new Error('The parameter "source" cannot be null.');
        if (source.nodeType != undefined) {
            var node = source;
            switch (node.nodeType) {
                case 1:
                    return new ElementEventSource(eventHandler, node, child);
                case 9:
                    return new DocumentEventSource(eventHandler, node, child);
            }
        }
        else if (source === window)
            return new WindowEventSource(eventHandler, source, child);
        throw new Error("Only objects of type Document, Element, and Window are supported as scroll event sources.");
    };
    return ScrollEventSource;
}());
var ElementEventSource = (function (_super) {
    __extends(ElementEventSource, _super);
    function ElementEventSource(eventHandler, source, child) {
        var _this = _super.call(this, eventHandler, child) || this;
        _this.source = source;
        return _this;
    }
    Object.defineProperty(ElementEventSource.prototype, "sourceType", {
        get: function () {
            return DOMType.Element;
        },
        enumerable: true,
        configurable: true
    });
    ElementEventSource.prototype.getBoundingClientRect = function () {
        return this.source.getBoundingClientRect();
    };
    Object.defineProperty(ElementEventSource.prototype, "clientWidth", {
        get: function () {
            return this.source.clientWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ElementEventSource.prototype, "clientHeight", {
        get: function () {
            return this.source.clientHeight;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ElementEventSource.prototype, "scrollTop", {
        get: function () {
            return this.source.scrollTop;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ElementEventSource.prototype, "scrollLeft", {
        get: function () {
            return this.source.scrollLeft;
        },
        enumerable: true,
        configurable: true
    });
    return ElementEventSource;
}(ScrollEventSource));
var DocumentEventSource = (function (_super) {
    __extends(DocumentEventSource, _super);
    function DocumentEventSource(eventHandler, source, child) {
        var _this = _super.call(this, eventHandler, child) || this;
        _this.source = source;
        _this._el = source.documentElement;
        return _this;
    }
    Object.defineProperty(DocumentEventSource.prototype, "sourceType", {
        get: function () {
            return DOMType.Document;
            ;
        },
        enumerable: true,
        configurable: true
    });
    DocumentEventSource.prototype.getBoundingClientRect = function () {
        return this._el.getBoundingClientRect();
    };
    Object.defineProperty(DocumentEventSource.prototype, "clientWidth", {
        get: function () {
            return this._el.clientWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocumentEventSource.prototype, "clientHeight", {
        get: function () {
            return this._el.clientHeight;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocumentEventSource.prototype, "scrollTop", {
        get: function () {
            return this._el.scrollTop;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DocumentEventSource.prototype, "scrollLeft", {
        get: function () {
            return this._el.scrollLeft;
        },
        enumerable: true,
        configurable: true
    });
    return DocumentEventSource;
}(ScrollEventSource));
var WindowEventSource = (function (_super) {
    __extends(WindowEventSource, _super);
    function WindowEventSource(eventHandler, source, child) {
        var _this = _super.call(this, eventHandler, child) || this;
        _this.source = source;
        return _this;
    }
    Object.defineProperty(WindowEventSource.prototype, "sourceType", {
        get: function () {
            return DOMType.Window;
        },
        enumerable: true,
        configurable: true
    });
    WindowEventSource.prototype.getBoundingClientRect = function () {
        return EnclosedTypeFactory.createRect(0, this.source.innerHeight, 0, this.source.innerWidth);
    };
    Object.defineProperty(WindowEventSource.prototype, "clientWidth", {
        get: function () {
            return this.source.innerWidth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WindowEventSource.prototype, "clientHeight", {
        get: function () {
            return this.source.innerHeight;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WindowEventSource.prototype, "scrollTop", {
        get: function () {
            return this.source.scrollY;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(WindowEventSource.prototype, "scrollLeft", {
        get: function () {
            return this.source.scrollX;
        },
        enumerable: true,
        configurable: true
    });
    return WindowEventSource;
}(ScrollEventSource));
var ArgData = (function () {
    function ArgData() {
    }
    return ArgData;
}());
var EnclosedTypeFactory = (function () {
    function EnclosedTypeFactory() {
    }
    EnclosedTypeFactory.createIntData = function (r, domType, source) {
        return {
            get intRect() {
                return r;
            },
            get source() {
                return source;
            },
            get sourceType() {
                return domType;
            },
            get intersects() {
                return r.width > 0;
            }
        };
    };
    EnclosedTypeFactory.createRect = function (t, b, l, r) {
        return {
            get top() {
                return t;
            },
            get bottom() {
                return b;
            },
            get left() {
                return l;
            },
            get right() {
                return r;
            },
            get width() {
                return r - l;
            },
            get height() {
                return b - t;
            }
        };
    };
    ;
    EnclosedTypeFactory.createIntRes = function (i, c) {
        return {
            get intersects() { return i; },
            get contains() { return c; }
        };
    };
    return EnclosedTypeFactory;
}());
var Helper = (function () {
    function Helper() {
    }
    Helper.deriveIntResArray = function (target, intrs) {
        if (intrs == null || intrs.length == 0)
            return EnclosedTypeFactory.createIntRes(false, false);
        return Helper.deriveIntRes(target, intrs[intrs.length - 1]);
    };
    Helper.deriveIntRes = function (target, intrs) {
        var i = intrs.width > 0;
        var c = intrs.width == target.width && intrs.height == target.height;
        return {
            get intersects() { return i; },
            get contains() { return c; }
        };
    };
    // static createOffsetRect(s: ScrollEventSource): ClientRect {
    //     let r = s.getBoundingClientRect();
    //     let bLeft: number;
    //     let bTop: number;
    //     if (s.sourceType != DOMType.Window) {
    //         let style = window.getComputedStyle(<Element>s.source);
    //         bLeft = parseInt(style.borderLeft);
    //         bTop = parseInt(style.borderTop);
    //     }
    //     else {
    //         bLeft = 0;
    //         bTop = 0;
    //     }
    //     bLeft += window.scrollX;
    //     bTop += window.scrollY;
    //     return EnclosedTypeFactory.createRect(
    //         r.top + bTop,
    //         r.top + s.clientHeight + bTop,
    //         r.left + bLeft,
    //         r.left + s.clientWidth + bLeft
    //     );
    // }    
    Helper.createOffsetRect = function (s) {
        var r = s.getBoundingClientRect();
        var left = r.left + window.scrollX;
        var top = r.top + window.scrollY;
        if (s.sourceType != DOMType.Window) {
            var style = window.getComputedStyle(s.source);
            left += parseInt(style.borderLeft);
            top += parseInt(style.borderTop);
        }
        return EnclosedTypeFactory.createRect(top, top + s.clientHeight, left, left + s.clientWidth);
    };
    Helper.createScrollOffsetRect = function (r) {
        var t = r.top + window.scrollY;
        var l = r.left + window.scrollX;
        return EnclosedTypeFactory.createRect(t, t + r.height, l, l + r.width);
    };
    Helper.dumpIntData = function (root, rects) {
        console.log("TARGET " + Helper.getRectString(rects[0]));
        for (var i = 1; i < rects.length; i++) {
            var r = rects[i];
            if (r.width <= 0)
                break;
            console.log(Helper.getSourceString(root) + " " + Helper.getRectString(r));
            root = root.parent;
        }
        while (root != null) {
            console.log(Helper.getSourceString(root) + " Intersects=false " + Helper.getRectString(root.getClientRect()));
            root = root.parent;
        }
    };
    Helper.dumpSource = function (s, asText) {
        if (asText) {
            console.log(Helper.getSourceString(s));
        }
        else {
            console.log(s.source);
        }
    };
    Helper.getSourceString = function (s) {
        switch (s.sourceType) {
            case DOMType.Element:
                return "ELEMENT <" + s.source.tagName + " id=" + s.source.id + " ...>";
            case DOMType.Document:
                return "DOCUMENT <" + s.source.tagName + " ...>";
            default:
                return "WINDOW";
        }
    };
    Helper.getRectString = function (r) {
        return "{top: " + r.top + ", right: " + r.right + ", bottom: " + r.bottom + ", left: " + r.left + ", width: " + r.width + ", height: " + r.height + "}";
    };
    return Helper;
}());

},{"@brycemarshall/event-throttle":7}],3:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scroll_listener_1 = require("./package-src/scroll-listener");
var PaddingTest = (function () {
    function PaddingTest() {
    }
    PaddingTest.prototype.init = function () {
        var _this = this;
        console.log("TrackingTest.init()");
        this._target = document.getElementById("target");
        this._target.value = "Initialised";
        setTimeout(function () {
            _this._target.scrollIntoView();
            _this.createListener();
        }, 1000);
    };
    PaddingTest.prototype.createListener = function () {
        var _this = this;
        var sources = scroll_listener_1.ScrollEventTargetCollection.auto(this._target);
        //let sources: ScrollEventTargetCollection = new ScrollEventTargetCollection(this._target.parentElement, window);
        var options = { throttleDuration: 500 };
        this._listener = new scroll_listener_1.ScrollListener(this._target, sources, function (sender, e) { _this.onScroll(sender, e); }, options);
        this._listener.dumpScope(true);
    };
    PaddingTest.prototype.onScroll = function (sender, args) {
        args.dumpScope(true);
    };
    return PaddingTest;
}());
exports.PaddingTest = PaddingTest;

},{"./package-src/scroll-listener":2}],4:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scroll_listener_1 = require("./package-src/scroll-listener");
var ScrollListenerDemo = (function () {
    function ScrollListenerDemo() {
        var _this = this;
        this.sequence = 0;
        this.target = document.getElementById("target");
        this.viewPort = document.getElementById("viewport-container");
        this.map = document.getElementById("map");
        this.mapViewport = document.getElementById("map-viewport");
        this.mapTarget = document.getElementById("map-target");
        var el = document.getElementById("cb-scope");
        el.attributes["checked"] = null;
        el.addEventListener("click", function () { _this.onConfigChanged(); });
        el = document.getElementById("cb-trace");
        el.attributes["checked"] = null;
        el.addEventListener("click", function () { _this.onConfigChanged(); });
        this.addEventListener("click", function (e) { _this.onNudge(e); }, "ngu", "ngd", "ngl", "ngr");
        this.addEventListener("change", function () { _this.onConfigChanged(); }, "sel-throttle");
        this.addEventListener("change", function (e) { _this.onBorderChanged(e); }, "sel-border");
        this.createListener();
    }
    ScrollListenerDemo.prototype.addEventListener = function (eventName, handler) {
        var elementIds = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            elementIds[_i - 2] = arguments[_i];
        }
        for (var _a = 0, elementIds_1 = elementIds; _a < elementIds_1.length; _a++) {
            var id = elementIds_1[_a];
            var el = document.getElementById(id);
            el.addEventListener(eventName, handler);
        }
    };
    ScrollListenerDemo.prototype.createListener = function () {
        var _this = this;
        document.getElementById("t-trace").innerHTML = "";
        this.sequence = 0;
        if (this.listener != null)
            this.listener.destroy();
        var sources;
        var options = { throttleDuration: parseInt(document.getElementById("sel-throttle").value) };
        if (document.getElementById("cb-scope").checked)
            sources = new scroll_listener_1.ScrollEventTargetCollection(this.viewPort);
        else
            sources = scroll_listener_1.ScrollEventTargetCollection.auto(this.target);
        if (document.getElementById("cb-trace").checked)
            options.traceFunction = function (sender, e) { _this.onTrace(sender, e); };
        this.listener = new scroll_listener_1.ScrollListener(this.target, sources, function (sender, e) { _this.onScroll(sender, e); }, options);
    };
    ScrollListenerDemo.prototype.init = function () {
        var _this = this;
        this.applyScale();
        this.target.scrollIntoView();
        //this.positionViewportOverlay();
        setTimeout(function () {
            _this.mapViewport.style.display = "block";
            _this.mapTarget.style.display = "block";
        }, 250);
    };
    ScrollListenerDemo.prototype.onNudge = function (e) {
        switch (e.target.value) {
            case "u":
                this.viewPort.scrollTop += 1;
                break;
            case "d":
                this.viewPort.scrollTop -= 1;
                break;
            case "l":
                this.viewPort.scrollLeft += 1;
                break;
            case "r":
                this.viewPort.scrollLeft -= 1;
                break;
        }
    };
    ScrollListenerDemo.prototype.onBorderChanged = function (e) {
        this.viewPort.style.borderWidth = e.target.value;
        this.target.scrollIntoView();
    };
    ScrollListenerDemo.prototype.onConfigChanged = function () {
        this.createListener();
    };
    ScrollListenerDemo.prototype.onTrace = function (sender, e) {
        document.getElementById("t-trace").innerHTML = (++this.sequence).toString();
    };
    ScrollListenerDemo.prototype.onScroll = function (sender, args) {
        this.updateInstrumentation(args);
        if (args.source !== this.viewPort)
            return;
        this.positionViewportOverlay(args);
        if (args.withinSource) {
            this.mapViewport.removeAttribute("inview");
            this.mapViewport.setAttribute("inviewport", null);
        }
        else if (args.intersectsSource) {
            this.mapViewport.removeAttribute("inviewport");
            this.mapViewport.setAttribute("inview", null);
        }
        else {
            this.mapViewport.removeAttribute("inview");
            this.mapViewport.removeAttribute("inviewport");
        }
        if (!args.scrolling)
            this.sequence = 0;
    };
    ScrollListenerDemo.prototype.onResize = function () {
        this.positionViewportOverlay();
    };
    ScrollListenerDemo.prototype.positionViewportOverlay = function (args) {
        var r = this.map.getBoundingClientRect();
        var o = this.getOffsets(this.viewPort);
        var top = (this.viewPort.scrollTop + o.y);
        var left = (this.viewPort.scrollLeft + o.x);
        this.mapViewport.style.top = this.stylePx(window.scrollY + r.top + top * this.scaleY);
        this.mapViewport.style.left = this.stylePx(window.scrollX + r.left + left * this.scaleX);
        if (args) {
            var rel = args.getRelativeRectangle();
            this.mapTarget.style.top = this.stylePx(window.scrollY + r.top + (top + rel.top - o.y) * this.scaleY);
            this.mapTarget.style.left = this.stylePx(window.scrollX + r.left + (left + rel.left - o.x) * this.scaleX);
        }
        else {
            this.mapTarget.style.top = this.stylePx(window.scrollY + r.top + (this.target.offsetTop - this.viewPort.offsetTop) * this.scaleY);
            this.mapTarget.style.left = this.stylePx(window.scrollX + r.left + (this.target.offsetLeft - this.viewPort.offsetLeft) * this.scaleX);
        }
    };
    ScrollListenerDemo.prototype.updateInstrumentation = function (args) {
        var rel = args.getRelativeRectangle();
        document.getElementById("t-top").innerHTML = Math.round(rel.top) + "px";
        document.getElementById("t-left").innerHTML = Math.round(rel.left) + "px";
        document.getElementById("t-bottom").innerHTML = Math.round(rel.bottom) + "px";
        document.getElementById("t-right").innerHTML = Math.round(rel.right) + "px";
        document.getElementById("t-ints-src").innerHTML = args.intersectsSource ? "true" : "false";
        document.getElementById("t-within-src").innerHTML = args.withinSource ? "true" : "false";
        document.getElementById("t-ints-scope").innerHTML = args.intersectsScope ? "true" : "false";
        document.getElementById("t-within-scope").innerHTML = args.withinScope ? "true" : "false";
        document.getElementById("t-scrolling").innerHTML = args.scrolling ? "true" : "false";
    };
    ScrollListenerDemo.prototype.applyScale = function () {
        // Scale is based upon the size of the entire scrollable region relative to the size of the map
        var sx = this.map.clientWidth / this.viewPort.scrollWidth;
        var sy = this.map.clientHeight / this.viewPort.scrollHeight;
        this.mapViewport.style.width = this.stylePx(Math.round(this.viewPort.clientWidth * sx));
        this.mapViewport.style.height = this.stylePx(Math.round(this.viewPort.clientHeight * sy));
        this.mapTarget.style.width = this.stylePx(Math.round(this.target.clientWidth * sx));
        this.mapTarget.style.height = this.stylePx(Math.round(this.target.clientHeight * sy));
        this.scaleX = sx;
        this.scaleY = sy;
    };
    ScrollListenerDemo.prototype.stylePx = function (value) {
        return Math.round(value) + "px";
    };
    ScrollListenerDemo.prototype.getOffsets = function (el) {
        var style = window.getComputedStyle(el);
        var l = parseInt(style.borderLeft);
        var t = parseInt(style.borderTop);
        var res = {
            x: isNaN(l) ? 0 : l,
            y: isNaN(t) ? 0 : t
        };
        return res;
    };
    return ScrollListenerDemo;
}());
exports.ScrollListenerDemo = ScrollListenerDemo;

},{"./package-src/scroll-listener":2}],5:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scroll_listener_1 = require("./package-src/scroll-listener");
var TrackingTest = (function () {
    function TrackingTest() {
        this._scrollSources = [];
    }
    TrackingTest.prototype.init = function () {
        var _this = this;
        console.log("TrackingTest.init()");
        this._target = document.getElementById("input-element");
        this._target.value = "Initialised";
        this._tracker1 = document.getElementById("tracker1");
        this._tracker2 = document.getElementById("tracker2");
        this._instruments = document.getElementById("instruments");
        var ts = window.getComputedStyle(this._target);
        this._tracker1.style.width = ts.width;
        this._tracker2.style.width = ts.width;
        setTimeout(function () {
            _this._target.scrollIntoView();
            _this.createListener();
        }, 1000);
    };
    TrackingTest.prototype.createListener = function () {
        var _this = this;
        var sources = scroll_listener_1.ScrollEventTargetCollection.auto(this._target);
        //let sources: ScrollEventTargetCollection = new ScrollEventTargetCollection(this._target.parentElement, window);
        var options = { throttleDuration: 500 };
        this._listener = new scroll_listener_1.ScrollListener(this._target, sources, function (sender, e) { _this.onScroll(sender, e); }, options);
        this._listener.dumpScope(true);
    };
    TrackingTest.prototype.onScroll = function (sender, args) {
        // let i = 0;
        // for(; i < this._scrollSources.length; i++)
        // {
        //     if (this._scrollSources[i] == args.source)
        //     break;
        // }
        // if (i == this._scrollSources.length)
        // this._scrollSources.push(args.source);
        // console.log("Scrolling - source " + i);
        //console.log("Scrolling");
        //let ts = window.getComputedStyle(this._target);
        var r = this._target.getBoundingClientRect();
        //console.log(r);
        this._tracker1.style.top = (window.scrollY + r.top + 30) + "px";
        this._tracker1.style.left = (window.scrollX + r.left) + "px";
        var r2 = args.getRelativeRectangle();
        // this._tracker2.style.top = (r2.top) + "px";
        // this._tracker2.style.left = (r2.left) + "px";
        // console.log("r.top = " + r.top + "; r2.top = " + r2.top);
        // console.log(r2);
        this._tracker2.style.top = (window.scrollY + r2.top - 50) + "px";
        this._tracker2.style.left = (window.scrollX + r2.left) + "px";
        this._instruments.style.top = (window.scrollY + 10) + "px";
        this._instruments.style.left = (window.scrollX + 10) + "px";
        this.updateInstrumentation(args);
        args.dumpScope(true);
    };
    TrackingTest.prototype.updateInstrumentation = function (args) {
        document.getElementById("ints-src").innerHTML = args.intersectsSource ? "true" : "false";
        document.getElementById("within-src").innerHTML = args.withinSource ? "true" : "false";
        document.getElementById("ints-scp").innerHTML = args.intersectsScope ? "true" : "false";
        document.getElementById("within-scp").innerHTML = args.withinScope ? "true" : "false";
        document.getElementById("scrl").innerHTML = args.scrolling ? "true" : "false";
    };
    return TrackingTest;
}());
exports.TrackingTest = TrackingTest;

},{"./package-src/scroll-listener":2}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventThrottle = (function () {
    /**
     * @constructor - Creates a new instance of the @type {EventThrottle} class.
     * @param callbackFunction - the function for handling throttled downstream events.
     * @param options - Optional configuration values in the form of an object implementing @type {EventThrottleOptions}.
     */
    function EventThrottle(callbackFunction, options) {
        /** @internal */
        this._throtDur = 150;
        /** @internal */
        this._suppressActive = false;
        /** @internal */
        this._backlog = 0;
        /** @internal */
        this._enabled = true;
        /** @internal */
        this._last = null;
        /** @internal */
        this._lastState = null;
        if (!callbackFunction)
            throw new Error("EventThrottle: callbackFunction cannot be null.");
        if (options) {
            if (typeof (options.throttleDuration) == "number" && options.throttleDuration >= 0)
                this._throtDur = options.throttleDuration;
            this._suppressActive = options.suppressActive;
        }
        this._fn = callbackFunction;
    }
    Object.defineProperty(EventThrottle.prototype, "throttled", {
        /**
         * @property throttled - Gets the number of source events that have been suppressed since the last downstream event was dispatched by this instance.
         */
        get: function () {
            return this._backlog;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EventThrottle.prototype, "isThrottling", {
        /**
         * @property enabled - Returns true if 1 or more source events have been suppressed since the last downstream event was dispatched by this instance.
         */
        get: function () {
            return this._backlog > 0;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(EventThrottle.prototype, "enabled", {
        /**
         * @property enabled - Gets or sets the enabled state of the @type {EventThrottle} instance.
         * Setting enabled to 'false' will automatically flush the @type {EventThrottle} instance.
         */
        get: function () {
            return this._enabled;
        },
        set: function (value) {
            this._enabled = value;
            if (!value)
                this.flush();
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @function flush - Flushes any suppressed source events that have not yet been processed.
     */
    EventThrottle.prototype.flush = function () {
        this._backlog = 0;
        this._last = null;
    };
    /**
     * @function registerEvent - Registers an upstream source event to be potentially queued for downstream processing.
     * @param sourceEvent - The source Event.
     * @param state - Optional state to be passed to the downstream event handler.
     */
    EventThrottle.prototype.registerEvent = function (e, state) {
        if (this._fn === null || !this._enabled)
            return;
        if (this._throtDur == 0) {
            this._backlog = 1;
            this.processEvent(1, e, state);
            this._backlog = 0;
        }
        else {
            this._last = e;
            this._lastState = state;
            if (++this._backlog == 1)
                this.queueEvent(e, state);
        }
    };
    /** @internal */
    EventThrottle.prototype.queueEvent = function (e, state) {
        var _this = this;
        setTimeout(function (backlog) {
            _this.processEvent(backlog, e, state);
        }, this._throtDur, this._backlog);
    };
    /** @internal */
    EventThrottle.prototype.processEvent = function (backlog, e, state) {
        // Return if disabled or if the backlog has otherwise been cleared by an invocation of flush() since the timeout was queued.
        if (this._backlog == 0)
            return;
        this._backlog -= backlog;
        if (!this._suppressActive || this._backlog == 0)
            this._fn(this, e, state);
        // If there have been events since the timeout was queued, queue another to ensure a downstream event always fires on the final source event.
        if (this._backlog > 0) {
            this.queueEvent(this._last, this._lastState);
            this._last = null;
            this._lastState = null;
        }
    };
    return EventThrottle;
}());
exports.EventThrottle = EventThrottle;

},{}],7:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var event_throttle_1 = require("./event-throttle");
exports.EventThrottle = event_throttle_1.EventThrottle;

},{"./event-throttle":6}]},{},[1]);
