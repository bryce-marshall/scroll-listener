import { EventThrottle, EventThrottleOptions } from '@brycemarshall/event-throttle';

/**
 * Represents a scroll event source that ScrollListener can subscribe to.
 * @interface IScrollEventTarget
 */
export interface IScrollEventTarget extends EventTarget {
    onscroll(this: Document | Element | Window, event: UIEvent): any;
}

/**
 * Describes the type of an encapsulated DOM object.
 */
export enum DOMType {
    Element,
    Document,
    Window
}

/**
 * A function that can be passed to the static ScrollEventTargetCollection.auto method to determine which scroll event sources will be 
 * included/excluded from the ScrollListener scope.
 * @param domType The DOMType of the object referenced by the eventSource parameter.
 * @param eventSource The event source to include or exclude from the scope.
 */
export type ScrollEventScopeLimiter = (domType: DOMType, eventSource: Element | Document | Window) => boolean;

/**
 * A collection of objects implementing IScrollEventTarget which can be used to create a new ScrollListener instance for tracking a specific
 * target element.
 * Valid IScrollEventTarget instances include any DOM Element (including the global document variable), and a reference to a Window object.
 * Note that although each element must be a parent node (or logical parent node in the case of Window) of the target element
 * to be tracked, it does not matter in what order they are added to the collection.
 * @class ScrollEventTargetCollection
 */
export class ScrollEventTargetCollection {
    private _members: IScrollEventTarget[];

    /**
     * Creates a new ScrollEventTargetCollection instance.
     * @param items The IScrollEventTarget instances to add to the new collection.
     */
    constructor(...items: IScrollEventTarget[]) {
        this._members = new Array<IScrollEventTarget>(items.length);
        for (let i = 0; i < items.length; i++) {
            let e = items[i];
            if (e == null) throw new Error('A null IScrollEventTarget reference was passed to the constructor.')
            this._members[i] = e;
        }
    }
    /**
     * Creates and automatically populates a ScrollEventTargetCollection with IScrollEventTarget parents of target.
     * @param target The HTMLElement that will be tracked by a ScrollListener instance.
     * @param scopeLimiter Optional. When specified, limits the set of IScrollEventTarget containers that will be resolved by this method
     * to all containers of parentElement up to and including scopeLimiter.
     */
    static auto(target: HTMLElement, scopeLimiter?: Element | ScrollEventScopeLimiter): ScrollEventTargetCollection {
        if (target == null) throw new Error('The parameter "target" cannot be null.')

        let result = new ScrollEventTargetCollection();
        let fn: ScrollEventScopeLimiter = null;
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
    }

    /**
     * Returns the default ScrollEventScopeLimiter function used by the static auto method when no other limiter is specified.
     * The function will include all parent elements of the target HTMLElement, and finally the window object.
     * It will exclude the document object.
     */
    static get defaultScopeLimiter(): ScrollEventScopeLimiter {
        return (domType: DOMType, eventSource: Element | Document | Window): boolean => {
            if (domType == DOMType.Document)
                return false;

            if (domType == DOMType.Window)
                return true;

            let e = <Element>eventSource;
            return e.tagName != "BODY" && e.tagName != "HTML";
        };
    }

    /**
     * Returns the number of IScrollEventTarget instances within the collection.
     */
    get count(): number {
        return this._members.length;
    }

    /**
     * Returns the IScrollEventTarget at the specified index.
     * @param index 
     * @throws If index is null, less than 0, or greater than this.count.
     */
    get(index: number): IScrollEventTarget {
        if (index == null) throw new Error('The parameter "index" cannot be null.')
        if (index < 0 || index >= this.count) throw new Error('The value of the parameter "index" must be greater-than-or-equal to 0 and less than count.')

        return this._members[index];
    }

    /**
     * Adds an IScrollEventTarget instance to the collection.
     * @param eventTarget The instance to add.
     */
    add(eventTarget: string | IScrollEventTarget) {
        if (eventTarget == null) throw new Error('The parameter "eventTarget" cannot be null.')
        if (typeof (eventTarget) != "string")
            this._members = this._members.concat(eventTarget);
        else {
            let e = <IScrollEventTarget>document.getElementById(eventTarget);
            if (e == null) throw new Error('No document element could be resolved using the id "' + eventTarget + '" passed in the "eventTarget" parameter.');
            this._members.push(e);
        }
    }

    /**
     * Returns an array of the IScrollEventTarget instances in the collection, sorted by their inverse hierarchical position in the document hierarchy 
     * (child elements first preceeding their parent elements, and finally the window object if it is present).
     */
    toArray(): IScrollEventTarget[] {
        let result = new Array<IScrollEventTarget>(this._members.length);
        for (let i = 0; i < this._members.length; i++)
            result[i] = this._members[i];

        if (!Node.prototype.compareDocumentPosition)
            return result;

        result.sort((x: any, y: any) => {
            if (x.compareDocumentPosition)
                if (y.compareDocumentPosition)
                    return x.compareDocumentPosition(y) & 2 ? -1 : 1;
                else
                    return -1;

            return (y.compareDocumentPosition) ? 1 : -1;
        });

        return result;
    }
}

/**
 * Contains information about the intersection of a target element with a container element.
 * @interface IntersectionData
 */
export interface IntersectionData {
    /**
     * The type of the containing scroll event source.
     */
    readonly sourceType: DOMType;
    /**
     * The underlying DOM scroll event source.
     */
    readonly source: Document | Element | Window;
    /**
     * A rectangle representing the intersection of the target element with the underlying scroll event source.
     */
    readonly intRect: ClientRect;
    /**
     * Returns true if the instance describes an intersection, otherwise returns false.
     */
    readonly intersects: boolean;
}

/**
 * Event arguments passed to the ScrollListener callback function following a scroll event.
 * @interface ScrollListenerEventArgs
 */
export interface ScrollListenerEventArgs {
    /**
     * The container that was scrolled to trigger the event.
     */
    readonly source: Document | Element | Window;
    /**
     * A string describing the type of event source (element, document, or window).
     */
    readonly sourceType: DOMType;
    /**
     * The original upstream UIEvent.
     */
    readonly sourceEvent: UIEvent;
    /**
     * Returns a ClientRect instance describing the position of target relative to a specified element, or if no element is specified then relative to the container that fired the event.
     */
    getRelativeRectangle(other?: Element): ClientRect;
    /**
     * A ClientRect instance describing the portion of the target element that is visible within the container that fired the event.
     */
    readonly intersectionalRectangle: ClientRect;
    /**
     * Returns the array of rectangles that were tested following the scroll event to determine the extent to which the target element intersects with its containers that are included in the ScrollListener scope. The first element in the array represents the target DOM element, and the last element in the array will represent the DOM element of either the first container that the target element did not intersect, or the topmost container in the scope hierarchy if the target element intersected all scope elements.
     */
    getScopeRectangles(): ClientRect[];
    /**
     * Returns an array of IntersectionData objects that provide data about how the target element intersects with its parent containers that are defined by the ScrollListener scope.
     */
    getIntersectionData(): IntersectionData[];
    /**
     * True if any portion of the target element is visible within the container that fired the event, otherwise false.
     */
    readonly intersectsSource: boolean;
    /**
     * True if the entire target element is visible within the container that fired the event, otherwise false.
     */
    readonly withinSource: boolean;
    /**
     * True if any portion of the target element is visible within the topmost scroll container that the ScrollListener instance is monitoring, otherwise false.
     */
    readonly intersectsScope: boolean;
    /**
     * True if the target element is still scrolling at time the event is processed, otherwise false.
     */
    readonly withinScope: boolean;
    /**
     * True if the entire target element is visible within the topmost scroll container that the ScrollListener instance is monitoring, otherwise false.
     */
    readonly scrolling: boolean;
    /**
     * Client state referenced by the ScrollListener instance.
     */
    readonly state: any;
    /**
     * A debugging feature that writes information about how the target element intersects with its parent containers that are defined by the ScrollListener scope.
     */
    dumpScope(asText?: boolean);
}

/**
 * The function invoked by ScrollListener instances when forwarding a downstream scroll event.
 * @param sender - the ScrollListener instance that invoked the callback.
 * @param args - The callback arguments as an instance of the ScrollListenerCallbackArgs.
 */
export type ScrollListenerCallbackFunction = (sender: ScrollListener, args: ScrollListenerEventArgs) => void;

/**
 * The function optionally invoked by ScrollListener instances whenever an upstream scroll event occurs.
 * @param sender - the ScrollListener instance that invoked the callback.
 * @param event - the original scroll event.
 */
export type ScrollListenerTraceCallbackFunction = (sender: ScrollListener, event: Event) => void;

/**
 * Specifies ScrollListener configuration options.
 */
export interface ScrollListenerOptions {
    /**
     * When specified, defines the duration (in milliseconds) of the minimum delay in between processing scroll events (the default is 150 milliseconds).
     */
    throttleDuration?: number;
    /**
     * An optional trace function that, when specified, will be invoked by the ScrollListener instance immediately upon receiving an upstream scroll event, and before the upstream event is subject to any further downstream processing.
     */
    traceFunction?: ScrollListenerTraceCallbackFunction;
    /**
     * When specified, defines optional client state to be passed to the callback function.
     */
    state?: any;
}

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
export class ScrollListener {
    /** @internal */
    private _throttle: EventThrottle;
    /** @internal */
    private _targetElement: Element;
    /** @internal */
    private _state: any;
    /** @internal */
    private _fn: ScrollListenerCallbackFunction = null;
    /** @internal */
    private _traceFn: ScrollListenerTraceCallbackFunction = null;
    /** @internal */
    private _baseEventSrc: ScrollEventSource;

    /**
     * Creates a new ScrollListener instance.
     * @param target The element to track.
     * @param eventSources The scroll-event sources that the ScrollListener instance will intercept the scroll events of.
     * @param callbackFunction The function that the ScrollListener instance will forward downstream (throttled) scroll events to.
     * @param options Additional configuration options.
     */
    constructor(target: Element, eventSources: ScrollEventTargetCollection, callbackFunction: ScrollListenerCallbackFunction, options?: ScrollListenerOptions) {
        if (target == null) throw new Error('The parameter "target" cannot be null.');
        if (eventSources == null) throw new Error('The parameter "eventSources" cannot be null.');
        if (callbackFunction == null) throw new Error('The parameter "callbackFunction" cannot be null.');
        if (eventSources.count == 0) throw new Error('The ScrollEventTargetCollection instance does not contain any event sources.');

        let to: EventThrottleOptions = null;
        if (options) {
            this._state = options.state;
            if (typeof (options.throttleDuration) == "number" && options.throttleDuration >= 0)
                to = { throttleDuration: options.throttleDuration };

            if (typeof (options.traceFunction) == "function")
                this._traceFn = options.traceFunction;
        }

        this._throttle = new EventThrottle((s, e, state) => { this.onDownstreamEvent(s, <UIEvent>e, state); }, to);
        this._targetElement = target;
        this._fn = callbackFunction;
        let handlerRef: ScrollEventHandler = (source, e) => { if (this._traceFn) this._traceFn(this, e); this._throttle.registerEvent(e, source); };

        let es = eventSources.toArray();

        let s: ScrollEventSource = ScrollEventSource.createFrom(handlerRef, es[0], null);
        s.bind();
        this._baseEventSrc = s;

        for (let idx = 1; idx < es.length; idx++) {
            s = ScrollEventSource.createFrom(handlerRef, es[idx], s);
            s.bind();
        }
    }

    /**
     * Returns the element that the ScrollListener instance is tracking.
     */
    public get targetElement(): Element {
        return this._targetElement;
    }

    /**
     * Gets or sets the enabled state of the ScrollListener instance.
     */
    public get enabled(): boolean {
        return this._throttle.enabled;
    }

    public set enabled(value: boolean) {
        this._throttle.enabled = value;
    }

    /**
     * Returns the current number of throttled upstream events.
     * ScrollListener does not guarantee to forward all throttled events to the downstream handler, however it will always 
     * forward the most recent event and guarantees to forward the last event in each sequence.
     */
    public get backlog(): number {
        return this._throttle.throttled;
    }

    /**
     * Returns true if any scroll-event source that the ScrollListener instance has subscribed to is currently scrolling, otherwise returns false.
     */
    public get isScrolling(): boolean {
        return this._throttle.isThrottling;
    }

    /**
     * A debugging feature that writes information about the scope of the current instance to the console.
     */
    public dumpScope(asText?: boolean) {
        let s = this._baseEventSrc;
        while (s != null) {
            Helper.dumpSource(s, asText);
            s = s.parent;
        }
    }

    /**
     * Detaches all event listeners and releases all resources.
     */
    public destroy() {
        if (this._baseEventSrc == null) return;

        this._throttle.enabled = false;
        this._throttle = null;
        this._targetElement = null;
        this._state = null;
        this._fn = null;

        let es = this._baseEventSrc;
        while (es != null) {
            es.release();
            es = es.parent;
        }

        this._baseEventSrc = null;
    }

    /**
     * Returns true if the element exposes a getBoundingClientRect method an onscroll property, and addEventListener and removeEventListener methods,
     * otherwise false.
     * @param element The element to test.
     */
    public static isScrollableContainer(element: any): boolean {
        return element != null && element.getBoundingClientRect != undefined && element.onscroll != undefined && element.addEventListener != undefined && element.removeEventListener != undefined;
    }

    /** @internal */
    private onDownstreamEvent(sender: EventThrottle, e: UIEvent, source: ScrollEventSource) {
        // _topEventSource will be null in the event that destroy() was invoked prior to timeout.
        if (this._baseEventSrc == null)
            return;

        this._fn(this, this.getEventArgs(e, source));
    }

    /** @internal */
    private getEventArgs(event: UIEvent, source: ScrollEventSource): ScrollListenerEventArgs {
        let that = this;
        let _bRect: ClientRect = Helper.createScrollOffsetRect(this.targetElement.getBoundingClientRect());
        let _rel: ClientRect = null;
        let _intRect: ClientRect = null;
        let _data: ArgData = new ArgData();
        let _intsSrc: IntersectionState = null;
        let _intsScope: IntersectionState = null;
        let _scrolling: boolean = this._throttle.isThrottling;

        return {
            get source(): Document | Element | Window {
                return source.source;
            },
            get sourceType(): DOMType {
                return source.sourceType;
            },
            get sourceEvent(): UIEvent {
                return event;
            },
            get intersectionalRectangle(): ClientRect {
                if (_intRect == null)
                    _intRect = that.getIntersectionalRectangle(_bRect, source);
                return _intRect;
            },
            getScopeRectangles(): ClientRect[] {
                if (_data.scopeRects == null) {
                    that.getScopedIntersectionalRectangles(_bRect, _data);
                }

                return _data.scopeRects;
            },
            getIntersectionData(): IntersectionData[] {
                return that.createIntersectionData(this.getScopeRectangles());
            },
            getRelativeRectangle(other?: Element): ClientRect {
                if (other == null || other === source.source) {
                    if (_rel == null)
                        _rel = that.getRelativeRectangle(_bRect, source.getBoundingClientRect());
                    return _rel;
                }
                return that.getRelativeRectangle(_bRect, other.getBoundingClientRect());
            },
            get intersectsSource(): boolean {
                if (_intsSrc == null) {
                    _intsSrc = Helper.deriveIntRes(_bRect, this.intersectionalRectangle);
                }
                return _intsSrc.intersects;
            },
            get withinSource(): boolean {
                if (_intsSrc == null) {
                    this.intersectsSource;
                }
                return _intsSrc.contains;

            },
            get intersectsScope(): boolean {
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
            get withinScope(): boolean {
                if (_intsScope == null) {
                    this.intersectsScope;
                }
                return _intsScope.contains;
            },
            get scrolling(): boolean {
                return _scrolling;
            },
            get state(): any {
                return that._state;
            },
            dumpScope(asText?: boolean) {
                if (asText)
                    Helper.dumpIntData(that._baseEventSrc, this.getScopeRectangles());
                else {
                    for (let d of this.getIntersectionData()) {
                        console.log(d);
                    }
                }
            }
        }
    }

    /** @internal */
    private getScopedIntersectionalRectangles(r: ClientRect, d: ArgData) {
        let a: ClientRect[] = d.scopeRects = [r];
        let s = this._baseEventSrc;
        while (s != null && r.width > 0) {
            d.lastSource = s;
            r = this.getIntersectionalRectangle(r, s);
            a.push(r);
            s = s.parent;
        }
    }

    /** @internal */
    private getIntersectionalRectangle(child: ClientRect, container: ScrollEventSource): ClientRect {
        let cr = container.getClientRect();
        if (child.bottom <= cr.top || child.top >= cr.bottom || child.right <= cr.left || child.left >= cr.right)
            return EnclosedTypeFactory.createRect(0, 0, 0, 0);

        return EnclosedTypeFactory.createRect(
            Math.max(child.top, cr.top),
            Math.min(child.bottom, cr.bottom),
            Math.max(child.left, cr.left),
            Math.min(child.right, cr.right)
        );
    }

    /** @internal */
    private getRelativeRectangle(rect: ClientRect, crect: ClientRect): ClientRect {
        let t = rect.top - crect.top;
        let l = rect.left - crect.left;
        return EnclosedTypeFactory.createRect(
            t,
            t + rect.height,
            l,
            l + rect.width
        );
    }

    private createIntersectionData(rects: ClientRect[]) {

        let res: IntersectionData[] = [EnclosedTypeFactory.createIntData(rects[0], DOMType.Element, this._targetElement)];
        let s = this._baseEventSrc;

        for (let i = 1; i < rects.length; i++) {
            res.push(EnclosedTypeFactory.createIntData(rects[i], s.sourceType, s.source));
            s = s.parent;
        }

        return res;
    }
}

type ScrollEventHandler = (sender: ScrollEventSource, e: UIEvent) => void;

abstract class ScrollEventSource {
    private _eventHandler: ScrollEventHandler;
    private _parent: ScrollEventSource = null;
    private _localHandlerRef: any;

    protected constructor(eventHandler: ScrollEventHandler, child: ScrollEventSource) {
        this._eventHandler = eventHandler;
        if (child) {
            child._parent = this;
        }

        this._localHandlerRef = (e) => { this._eventHandler(this, e); };
    }

    abstract get sourceType(): DOMType;
    abstract get source(): Document | Element | Window;
    abstract getBoundingClientRect(): ClientRect;
    abstract get clientWidth(): number;
    abstract get clientHeight(): number;
    abstract get scrollTop(): number;
    abstract get scrollLeft(): number;

    getClientRect(): ClientRect {
        return Helper.createOffsetRect(this);
    }

    get parent(): ScrollEventSource {
        return this._parent;
    }

    bind() {
        this.source.addEventListener("scroll", this._localHandlerRef);
    }

    release() {
        this.source.removeEventListener("scroll", this._localHandlerRef);
    }

    static createFrom(eventHandler: ScrollEventHandler, source: IScrollEventTarget, child: ScrollEventSource): ScrollEventSource {
        if (eventHandler == null) throw new Error('The parameter "eventHandler" cannot be null.');
        if (source == null) throw new Error('The parameter "source" cannot be null.');

        if ((<any>source).nodeType != undefined) {
            let node = <Node><any>source;
            switch (node.nodeType) {
                case 1:
                    return new ElementEventSource(eventHandler, <Element>node, child);
                case 9:
                    return new DocumentEventSource(eventHandler, <Document>node, child);
            }
        }
        else if (<any>source === window)
            return new WindowEventSource(eventHandler, <Window><any>source, child);

        throw new Error("Only objects of type Document, Element, and Window are supported as scroll event sources.");
    }
}

class ElementEventSource extends ScrollEventSource {
    readonly source: Element;

    constructor(eventHandler: ScrollEventHandler, source: Element, child: ScrollEventSource) {
        super(eventHandler, child);
        this.source = source;
    }

    get sourceType(): DOMType {
        return DOMType.Element;
    }

    getBoundingClientRect(): ClientRect {
        return this.source.getBoundingClientRect();
    }

    get clientWidth(): number {
        return this.source.clientWidth;
    }

    get clientHeight(): number {
        return this.source.clientHeight;
    }

    get scrollTop(): number {
        return this.source.scrollTop;
    }

    get scrollLeft(): number {
        return this.source.scrollLeft;
    }
}

class DocumentEventSource extends ScrollEventSource {
    readonly source: Document;
    private readonly _el;

    constructor(eventHandler: ScrollEventHandler, source: Document, child: ScrollEventSource) {
        super(eventHandler, child);
        this.source = source;
        this._el = source.documentElement;
    }

    get sourceType(): DOMType {
        return DOMType.Document;;
    }

    getBoundingClientRect(): ClientRect {
        return this._el.getBoundingClientRect();
    }

    get clientWidth(): number {
        return this._el.clientWidth;
    }

    get clientHeight(): number {
        return this._el.clientHeight;
    }

    get scrollTop(): number {
        return this._el.scrollTop;
    }

    get scrollLeft(): number {
        return this._el.scrollLeft;
    }
}

class WindowEventSource extends ScrollEventSource {
    readonly source: Window;

    constructor(eventHandler: ScrollEventHandler, source: Window, child: ScrollEventSource) {
        super(eventHandler, child);
        this.source = source;
    }

    get sourceType(): DOMType {
        return DOMType.Window;
    }

    getBoundingClientRect(): ClientRect {
        return EnclosedTypeFactory.createRect(0, this.source.innerHeight, 0, this.source.innerWidth);
    }

    get clientWidth(): number {
        return this.source.innerWidth;
    }

    get clientHeight(): number {
        return this.source.innerHeight;
    }

    get scrollTop(): number {
        return this.source.scrollY;
    }

    get scrollLeft(): number {
        return this.source.scrollX;
    }
}

class ArgData {
    scopeRects: ClientRect[];
    lastSource: ScrollEventSource;
}

interface IntersectionState {
    readonly intersects: boolean;
    readonly contains: boolean;
}

class EnclosedTypeFactory {

    public static createIntData(r: ClientRect, domType: DOMType, source: Document | Element | Window): IntersectionData {
        return {
            get intRect(): ClientRect {
                return r;
            },
            get source(): Document | Element | Window {
                return source;
            },
            get sourceType(): DOMType {
                return domType;
            },
            get intersects(): boolean {
                return r.width > 0;
            }
        };
    }

    public static createRect(t: number, b: number, l: number, r: number): ClientRect {
        return {
            get top(): number {
                return t;
            },
            get bottom(): number {
                return b;
            },
            get left(): number {
                return l;
            },
            get right(): number {
                return r;
            },
            get width(): number {
                return r - l;
            },
            get height(): number {
                return b - t;
            }
        };
    };

    public static createIntRes(i: boolean, c: boolean) {
        return {
            get intersects() { return i; },
            get contains() { return c; }
        };
    }
}

class Helper {
    public static deriveIntResArray(target: ClientRect, intrs: ClientRect[]): IntersectionState {
        if (intrs == null || intrs.length == 0)
            return EnclosedTypeFactory.createIntRes(false, false);

        return Helper.deriveIntRes(target, intrs[intrs.length - 1]);
    }

    public static deriveIntRes(target: ClientRect, intrs: ClientRect): IntersectionState {
        let i = intrs.width > 0;
        let c = intrs.width == target.width && intrs.height == target.height;

        return {
            get intersects() { return i; },
            get contains() { return c; }
        };
    }

    static createOffsetRect(s: ScrollEventSource): ClientRect {
        let r = s.getBoundingClientRect();
        let left: number = r.left + window.scrollX;
        let top: number = r.top + window.scrollY;

        if (s.sourceType != DOMType.Window) {
            let style = window.getComputedStyle(<Element>s.source);
            left += parseInt(style.borderLeft);
            top += parseInt(style.borderTop);
        }

        return EnclosedTypeFactory.createRect(
            top,
            top + s.clientHeight,
            left,
            left + s.clientWidth
        );
    }

    static createScrollOffsetRect(r: ClientRect) {
        let t = r.top + window.scrollY;
        let l = r.left + window.scrollX;
        return EnclosedTypeFactory.createRect(
            t, t + r.height, l, l + r.width
        );
    }

    static dumpIntData(root: ScrollEventSource, rects: ClientRect[]) {
        console.log("TARGET " + Helper.getRectString(rects[0]));

        for (let i = 1; i < rects.length; i++) {
            let r = rects[i];
            if (r.width <= 0)
                break;
            console.log(Helper.getSourceString(root) + " " + Helper.getRectString(r));
            root = root.parent;
        }

        while (root != null) {
            console.log(Helper.getSourceString(root) + " Intersects=false " + Helper.getRectString(root.getClientRect()));
            root = root.parent;
        }
    }

    static dumpSource(s: ScrollEventSource, asText: boolean) {
        if (asText) {
            console.log(Helper.getSourceString(s));
        }
        else {
            console.log(s.source);
        }
    }

    private static getSourceString(s: ScrollEventSource) {
        switch (s.sourceType) {
            case DOMType.Element:
                return "ELEMENT <" + (<Element>s.source).tagName + " id=" + (<Element>s.source).id + " ...>";

            case DOMType.Document:
                return "DOCUMENT <" + (<Element>s.source).tagName + " ...>";

            default:
                return "WINDOW";
        }
    }

    private static getRectString(r: ClientRect): string {
        return "{top: " + r.top + ", right: " + r.right + ", bottom: " + r.bottom + ", left: " + r.left + ", width: " + r.width + ", height: " + r.height + "}";
    }
}