import { EventThrottle, EventThrottleOptions } from '@brycemarshall/event-throttle';

// TODO: Border offsets for ltr language browsers
// TODO: Do right and bottom border offsets need to be applied under circumstances other than rtl languages?

/**
 * Represents a scroll event source that ScrollListener can subscribe to.
 * @interface IScrollEventTarget
 */
export interface IScrollEventTarget extends EventTarget {
    onscroll(this: Document | Element | Window, event: UIEvent): any;
}

/**
 * A collection of objects implementing IScrollEventTarget which can be used to create a new ScrollListener instance.
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
     * @method auto
     * @param target The HTMLElement that will be tracked by a ScrollListener instance.
     * @param scopeLimiter Optional. When specified, limits the set of IScrollEventTarget containers that will be resolved by this method
     * to all containers of parentElement up to and including scopeLimiter.
     */
    static auto(target: HTMLElement, scopeLimiter?: HTMLElement): ScrollEventTargetCollection {
        if (target == null) throw new Error('The parameter "target" cannot be null.')
        let result = new ScrollEventTargetCollection();

        target = target !== scopeLimiter ? target.parentElement : null;
        while (target != null) {
            result.add(target);
            target = target !== scopeLimiter ? target.parentElement : null;
        }

        if (scopeLimiter == null)
            result.add(window);

        return result;
    }

    /**
     * Returns the number of IScrollEventTarget instances within the collection.
     * @property count
     */
    get count(): number {
        return this._members.length;
    }

    /**
     * Returns the IScrollEventTarget at the specified index.
     * @function get
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
     * @method add
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
     * Returns an array of the IScrollEventTarget instances in the collection.
     * @function toArray
     */
    toArray(): IScrollEventTarget[] {
        let result = new Array<IScrollEventTarget>(this._members.length);
        for (let i = 0; i < this._members.length; i++)
            result[i] = this._members[i];

        return result;
    }
}

/**
 * Event arguments passed to the ScrollListener callback function following a scroll event.
 * @interface ScrollListenerEventArgs
 * @property {Element} source The container that was scrolled to trigger the event.
 * @property {string} sourceType A string describing the type of event source (element, document, or window).
 * @property {UIEvent} sourceEvent The original upstream UIEvent.
 * @function getRelativeRectangle Returns a ClientRect instance describing the position of target relative to a specified element, or if no element is specified then relative to the container that fired the event.
 * @property {ClientRect} intersectionalRectangle A ClientRect instance describing the portion of the target element that is visible within the container that fired the event.
 * @property {boolean} intersectsSource True if any portion of the target element is visible within the container that fired the event, otherwise false.
 * @property {boolean} withinSource - True if the entire target element is visible within the container that fired the event, otherwise false.
 * @property {boolean} intersectsScope True if any portion of the target element is visible within the topmost scroll container that the ScrollListener instance is monitoring, otherwise false.
 * @property {boolean} withinScope - True if the entire target element is visible within the topmost scroll container that the ScrollListener instance is monitoring, otherwise false.
 * @property {boolean} scrolling - True if the target element is still scrolling at time the event is processed, otherwise false.
 * @property {any} state - Client state referenced by the ScrollListener instance.
 */
export interface ScrollListenerEventArgs {
    readonly source: Document | Element | Window;
    readonly sourceType: string;
    readonly sourceEvent: UIEvent;
    getRelativeRectangle(other?: Element): ClientRect;
    readonly intersectionalRectangle: ClientRect;
    readonly intersectsSource: boolean;
    readonly withinSource: boolean;
    readonly intersectsScope: boolean;
    readonly withinScope: boolean;
    readonly scrolling: boolean;
    readonly state: any;
}

/**
 * The function invoked by ScrollListener instances when forwarding a downstream scroll event.
 * @function ScrollListenerCallbackFunction
 * @param sender - the ScrollListener instance that invoked the callback.
 * @param args - The callback arguments as an instance of the ScrollListenerCallbackArgs.
 */
export type ScrollListenerCallbackFunction = (sender: ScrollListener, args: ScrollListenerEventArgs) => void;

/**
 * The function optionally invoked by ScrollListener instances whenever an upstream scroll event occurs.
 * @function ScrollListenerTraceCallbackFunction
 * @param sender - the ScrollListener instance that invoked the callback.
 * @param event - the original scroll event.
 */
export type ScrollListenerTraceCallbackFunction = (sender: ScrollListener, event: Event) => void;

/**
 * Specifies ScrollListener configuration options.
 * @property {number} throttleDuration - When specified, defines the duration (in milliseconds) of the minimum delay in between 
    processing scroll events (the default is 150 milliseconds).
 * @property {ScrollListenerTraceCallbackFunction} traceFunction - An optional trace function that, when specified, will be invoked by the ScrollListener
 * instance immediately upon receiving an upstream scroll event, and before the upstream event is subject to any further downstream processing.
 * @property {any} state - When specified, defines optional client state to be passed to the callback function.
 */
export interface ScrollListenerOptions {
    throttleDuration?: number;
    traceFunction?: ScrollListenerTraceCallbackFunction;
    state?: any;
}

/**
 * A helper class that that invokes a callback function when a specified target element is scrolled.
 * ScrollListener works by subscribing to the scroll event of one or more of the target element's parent containers.
 * ScrollListener enables easy throttling of the upstream scroll events that it subscribes to (to prevent the UI from being overloaded)
 * and also provides client code with useful information about the target element, including its visibility and position relative to 
 * its container elements.
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
    /** @internal */
    private _enabled: boolean = true;

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

        let s: ScrollEventSource = ScrollEventSource.createFrom(handlerRef, eventSources.get(0), null);
        this._baseEventSrc = s;
        s.bind();

        for (let idx = 1; idx < eventSources.count; idx++) {
            s = ScrollEventSource.createFrom(handlerRef, eventSources.get(idx), s);
            s.bind();
        }
    }

    /**
     * Returns the element that the ScrollListener instance is tracking.
     * @property targetElement
     */
    public get targetElement(): Element {
        return this._targetElement;
    }

    /**
     * Gets or sets the enabled state of the ScrollListener instance.
     * @property enabled
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
     * @property backlog
     */
    public get backlog(): number {
        return this._throttle.throttled;
    }

    /**
     * Returns true if any scroll-event source that the ScrollListener instance has subscribed to is currently scrolling, otherwise returns false.
     * @property isScrolling.
     */
    public get isScrolling(): boolean {
        return this._throttle.isThrottling;
    }

    /**
     * Detaches all event listeners and releases all resources.
     * @method destroy
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
     * @function isScrollableContainer
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
        let bRect: ClientRect = this.targetElement.getBoundingClientRect();
        let rel: ClientRect = null;
        let intsSrc: IntersectionState = null;
        let intsScope: IntersectionState = null;

        let scrolling: boolean = this._throttle.isThrottling;
        let intRect: ClientRect = null;

        return {
            get source(): Document | Element | Window {
                return source.source;
            },
            get sourceType(): string {
                return source.sourceType;
            },
            get sourceEvent(): UIEvent {
                return event;
            },
            get intersectionalRectangle(): ClientRect {
                if (intRect == null)
                    intRect = that.getIntersectionalRectangle(bRect, source);
                return intRect;
            },
            getRelativeRectangle(other?: Element): ClientRect {
                if (other == null || other === source.source) {
                    if (rel == null)
                        rel = that.getRelativeRectangle(bRect, source.getBoundingClientRect());
                    return rel;
                }
                return that.getRelativeRectangle(bRect, other.getBoundingClientRect());
            },
            get intersectsSource(): boolean {
                if (intsSrc == null) {
                    intsSrc = EnclosedTypeFactory.deriveIntersectionResult(bRect, this.intersectionalRectangle);
                }
                return intsSrc.intersects;
            },
            get withinSource(): boolean {
                if (intsSrc == null) {
                    intsSrc = EnclosedTypeFactory.deriveIntersectionResult(bRect, this.intersectionalRectangle);
                }
                return intsSrc.contains;

            },
            get intersectsScope(): boolean {
                if (intsScope == null) {
                    if (that._baseEventSrc.parent == null)
                        intsScope = intsSrc;
                    else {
                        intsScope = EnclosedTypeFactory.deriveIntersectionResult(bRect, that.getScopedIntersectionalRectangle());
                    }
                }
                return intsScope.intersects;
            },
            get withinScope(): boolean {
                if (intsScope == null) {
                    if (that._baseEventSrc.parent == null)
                        intsScope = intsScope;
                    else {
                        intsScope = EnclosedTypeFactory.deriveIntersectionResult(bRect, that.getScopedIntersectionalRectangle());
                    }
                }
                return intsScope.contains;
            },
            get scrolling(): boolean {
                return scrolling;
            },
            get state(): any {
                return that._state;
            }
        }
    }

    /** @internal */
    private getScopedIntersectionalRectangle() {
        let r = this.targetElement.getBoundingClientRect();
        let s = this._baseEventSrc;
        while (s != null) {
            r = this.getIntersectionalRectangle(r, s);
            s = s.parent;
        }

        return r;
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
}

type ScrollEventHandler = (sender: ScrollEventSource, e: UIEvent) => void;
interface BorderOffsets {
    readonly left: number;
    //readonly right: number;
    readonly top: number;
    //readonly bottom: number;
}

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

    abstract get sourceType(): string;
    abstract get source(): Document | Element | Window;
    abstract getBoundingClientRect(): ClientRect;
    abstract get clientWidth(): number;
    abstract get clientHeight(): number;
    abstract getBorderOffsets(): BorderOffsets;

    getClientRect(): ClientRect {
        let r = this.getBoundingClientRect();
        let b = this.getBorderOffsets();
        let that = this;

        return EnclosedTypeFactory.createRect(
            r.top + b.top,
            r.top + this.clientHeight + b.top,
            r.left + b.left,
            r.left + this.clientWidth + b.left
        );
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

    protected getOffsetsImp(el: Element): BorderOffsets {
        let style = window.getComputedStyle(el);

        const l = parseInt(style.borderLeft);
        //const r = parseInt(style.borderRight);
        const t = parseInt(style.borderTop);
        //const b = parseInt(style.borderBottom);

        let res = {
            left: isNaN(l) ? 0 : l,
            //right: isNaN(r) ? 0 : r,
            top: isNaN(t) ? 0 : t,
            //bottom: isNaN(b) ? 0 : b
        }

        return res;
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

        //console.log("Node type of rogue source = " + )
        throw new Error("Only objects of type Document, Element, and Window are supported as scroll event sources.");
    }
}

class ElementEventSource extends ScrollEventSource {
    readonly source: Element;

    constructor(eventHandler: ScrollEventHandler, source: Element, child: ScrollEventSource) {
        super(eventHandler, child);
        this.source = source;
    }

    get sourceType(): string {
        return "element";
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

    getBorderOffsets(): BorderOffsets {
        return this.getOffsetsImp(this.source);
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

    get sourceType(): string {
        return "document";
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

    getBorderOffsets(): BorderOffsets {
        return this.getOffsetsImp(this._el);
    }
}

class WindowEventSource extends ScrollEventSource {
    readonly source: Window;

    constructor(eventHandler: ScrollEventHandler, source: Window, child: ScrollEventSource) {
        super(eventHandler, child);
        this.source = source;
    }

    get sourceType(): string {
        return "window";
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

    getBorderOffsets(): BorderOffsets {
        return { left: 0, top: 0 };
    }
}

interface IntersectionState {
    readonly intersects: boolean;
    readonly contains: boolean;
}

class EnclosedTypeFactory {
    public static createRect(t: number, b: number, l: number, r: number) {
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
    public static deriveIntersectionResult(target: ClientRect, intrs: ClientRect): IntersectionState {
        let i = intrs.width > 0;
        let c = intrs.width == target.width && intrs.height == target.height;

        return {
            get intersects() { return i; },
            get contains() { return c; }
        };
    }
}