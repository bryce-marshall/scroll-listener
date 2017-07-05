import { EventThrottle, EventThrottleOptions } from '@brycemarshall/event-throttle';

// TODO: Border offsets for ltr language browsers
// TODO: Do right and bottom border offsets need to be applied under circumstances other than rtl languages?

export interface IScrollEventTarget extends EventTarget {
    onscroll(this: Document | Element | Window, event: UIEvent): any;
}

export class ScrollEventTargetCollection {
    private _members: IScrollEventTarget[];

    constructor(...items: IScrollEventTarget[]) {
        this._members = new Array<IScrollEventTarget>(items.length);
        for (let i = 0; i < items.length; i++) {
            let e = items[i];
            if (e == null) throw new Error('A null IScrollEventTarget reference was passed to the constructor.')
            this._members[i] = e;
        }
    }

    static auto(target: HTMLElement, scopeLimiter?: HTMLElement): ScrollEventTargetCollection {
        if (target == null) throw new Error('The parameter "target" cannot be null.')
        let result = new ScrollEventTargetCollection();

        target = target !== scopeLimiter ? target.parentElement : null;
        while (target != null) {
            result.append(target);
            target = target !== scopeLimiter ? target.parentElement : null;
        }

        if (scopeLimiter == null)
            result.append(window);

        return result;
    }

    get count(): number {
        return this._members.length;
    }

    get(index: number): IScrollEventTarget {
        if (index == null) throw new Error('The parameter "index" cannot be null.')
        if (index < 0 || index >= this.count) throw new Error('The value of the parameter "index" must be greater-than-or-equal to 0 and less than count.')

        return this._members[index];
    }

    append(eventTarget: string | IScrollEventTarget) {
        if (eventTarget == null) throw new Error('The parameter "eventTarget" cannot be null.')
        if (typeof (eventTarget) != "string")
            this._members = this._members.concat(eventTarget);
        else {
            let e = <IScrollEventTarget>document.getElementById(eventTarget);
            if (e == null) throw new Error('No document element could be resolved using the id "' + eventTarget + '" passed in the "eventTarget" parameter.');
            this._members.push(e);
        }
    }

    toArray(): IScrollEventTarget[] {
        let result = new Array<IScrollEventTarget>(this._members.length);
        for (let i = 0; i < this._members.length; i++)
            result[i] = this._members[i];

        return result;
    }
}

/**
 * Event arguments passed to the ScrollListener callback function following a scroll event.
 * @interface ScrollListenerCallbackArgs
 * @property {Element} container - The container that was scrolled to trigger the event.
 * @property {Element} target - The target element being tracked.
 * @property {ClientRect} relativeRectangle - A rectangle describing the position of the target element relative to the top left position of 
 * the bounding client rectangle of 'container' (container.getBoundingClientRect().
 * @property {boolean} inView - True if any portion of the target element is visible within the viewport, otherwise false.
 * @property {boolean} inViewport - True if the entire target element is visible within the viewport, otherwise false.
 * @property {boolean} scrolling - True if the target element is still scrolling at time the event is processed, otherwise false.
 * @property {any} state - Client state referenced by the ScrollListener instance.
 */
export interface ScrollListenerCallbackArgs {
    readonly source: Document | Element | Window;
    // readonly target: Element;
    readonly sourceType: string;
    readonly sourceEvent: UIEvent;
    // // Relative to other, or if other not specified then relative to this.container
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
 * @function ScrollListenerCallbackFunction
 * @param args - The callback arguments as an instance of the @type {ScrollListenerCallbackArgs}.
 */
export type ScrollListenerCallbackFunction = (sender: ScrollListener, args: ScrollListenerCallbackArgs) => void;

/**
 * @function ScrollListenerTraceCallbackFunction
 * @param sender - the @type {ScrollListener} instance that invoked the callback.
 * @param event - the original scroll event.
 */
export type ScrollListenerTraceCallbackFunction = (sender: ScrollListener, event: Event) => void;

/**
 * Specifies ScrollListener configuration options.
 * @interface ScrollListenerOptions
 * @property {EventTarget} container - When specified, ScrollListener will listen for 'onscroll' events on 'container' only. 
 * The 'container' property takes priority over 'containers' and 'scope'.
 * @property {EventTarget[]} containers - When specified, ScrollListener will listen for 'onscroll' events on all elements in the 'containers' array.
 * The 'containers' property takes priority over 'scope' but defers to 'container'.
 * @property {Element} scope - When specified, ScrollListener will listen for 'onscroll' events on all parent container elements in the DOM tree 
 * above its specified target element up to and including 'scope'.
 * The 'scope' property defers to 'container' and 'containers'.
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
 * @class ScrollListener
 * A helper class that that invokes a callback function when a specified target element is scrolled.
 * ScrollListener works by attaching to the scroll event of either specific container elements, one or more of the target element's parent container elements.
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

    private _baseEventSrc: ScrollEventSource;
    private _enabled: boolean = true;
    static _nonce: number = 1;

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

        let nonce = ScrollListener._nonce++;
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
     * @property targetElement - Returns the element that the @type {ScrollListener} instance is tracking.
     */
    public get targetElement(): Element {
        return this._targetElement;
    }

    /**
     * @property enabled - Gets or sets the enabled state of the @type {ScrollListener} instance.
     */
    public get enabled(): boolean {
        return this._throttle.enabled;
    }

    public set enabled(value: boolean) {
        this._throttle.enabled = value;
    }

    public get backlog(): number {
        return this._throttle.throttled;
    }

    public get isScrolling(): boolean {
        return this._throttle.isThrottling;
    }

    /**
     * @method destroy - Detaches all event listeners and releases all resources
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
     * @function isScrollableContainer - Returns true if the element is an Element that exposes a getBoundingClientRect method and an onscroll property, otherwise false.
     * @param element -  The element to test.
     */
    public static isScrollableContainer(element: any): boolean {
        return element != null && element.getBoundingClientRect != undefined && element.onscroll != undefined;
    }

    private onDownstreamEvent(sender: EventThrottle, e: UIEvent, source: ScrollEventSource) {
        // _topEventSource will be null in the event that destroy() was invoked prior to timeout.
        if (this._baseEventSrc == null)
            return;

        this._fn(this, this.getEventArgs(e, source));
    }

    private getEventArgs(event: UIEvent, source: ScrollEventSource): ScrollListenerCallbackArgs {
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
                        intsScope = EnclosedTypeFactory.deriveIntersectionResult(bRect, that.getScopeIntRect());
                    }
                }
                return intsScope.intersects;
            },
            get withinScope(): boolean {
                if (intsScope == null) {
                    if (that._baseEventSrc.parent == null)
                        intsScope = intsScope;
                    else {
                        intsScope = EnclosedTypeFactory.deriveIntersectionResult(bRect, that.getScopeIntRect());
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

    private getScopeIntRect() {
        let r = this.targetElement.getBoundingClientRect();
        let s = this._baseEventSrc;
        while (s != null) {
            r = this.getIntersectionalRectangle(r, s);
            s = s.parent;
        }

        return r;
    }

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
    readonly right: number;
    readonly top: number;
    readonly bottom: number;
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

    /** @internal */
    protected getOffsetsImp(el: Element): BorderOffsets {
        let style = window.getComputedStyle(el);

        const l = parseInt(style.borderLeft);
        const r = parseInt(style.borderRight);
        const t = parseInt(style.borderTop);
        const b = parseInt(style.borderBottom);

        let res = {
            left: isNaN(l) ? 0 : l,
            right: isNaN(r) ? 0 : r,
            top: isNaN(t) ? 0 : t,
            bottom: isNaN(b) ? 0 : b
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
        return { left: 0, right: 0, top: 0, bottom: 0 };
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