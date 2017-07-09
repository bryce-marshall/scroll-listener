# @brycemarshall\scroll-listener
A helper class that listens for scroll events affecting a specific element.

# Demo

http://plnkr.co/2RvsM8BmD5bzSbUqr7pw

## Installation

`npm install @brycemarshall\scroll-listener`

#The module exports the following:

```ts

/**
 * Represents a scroll event source that ScrollListener can subscribe to.
 * @interface IScrollEventTarget
 */
export interface IScrollEventTarget extends EventTarget {
    onscroll(this: Document | Element | Window, event: UIEvent): any;
}
/**
 * Describes the type of an IScrollEventTarget instance.
 * @enum ScrollEventTargetType
 */
export declare enum ScrollEventTargetType {
    Element = 0,
    Document = 1,
    Window = 2,
}
/**
 * A function that can be passed to the static ScrollEventTargetCollection.auto method to determine which scroll event sources will be
 * included/excluded from the ScrollListener scope.
 * @function ScrollEventScopeLimiter
 */
export declare type ScrollEventScopeLimiter = (targetType: ScrollEventTargetType, target: Element | Document | Window) => boolean;
/**
 * A collection of objects implementing IScrollEventTarget which can be used to create a new ScrollListener instance for tracking a specific
 * target element.
 * Valid IScrollEventTarget instances include any DOM Element (including the global document variable), and a reference to a Window object.
 * Note that although each element must be a parent node (or logical parent node in the case of Window) of the target element
 * to be tracked, it does not matter in what order they are added to the collection.
 * @class ScrollEventTargetCollection
 */
export declare class ScrollEventTargetCollection {
    private _members;
    /**
     * Creates a new ScrollEventTargetCollection instance.
     * @param items The IScrollEventTarget instances to add to the new collection.
     */
    constructor(...items: IScrollEventTarget[]);
    /**
     * Creates and automatically populates a ScrollEventTargetCollection with IScrollEventTarget parents of target.
     * @method auto
     * @param target The HTMLElement that will be tracked by a ScrollListener instance.
     * @param scopeLimiter Optional. When specified, limits the set of IScrollEventTarget containers that will be resolved by this method
     * to all containers of parentElement up to and including scopeLimiter.
     */
    static auto(target: HTMLElement, scopeLimiter?: Element | ScrollEventScopeLimiter): ScrollEventTargetCollection;
    /**
     * Returns the default ScrollEventScopeLimiter function used by the static auto method when no other limiter is specified.
     * The function will include all parent elements of the target HTMLElement, and finally the window object.
     * It will exclude the document object.
     * @property defaultScopeLimiter
     */
    static readonly defaultScopeLimiter: ScrollEventScopeLimiter;
    /**
     * Returns the number of IScrollEventTarget instances within the collection.
     * @property count
     */
    readonly count: number;
    /**
     * Returns the IScrollEventTarget at the specified index.
     * @function get
     * @param index
     * @throws If index is null, less than 0, or greater than this.count.
     */
    get(index: number): IScrollEventTarget;
    /**
     * Adds an IScrollEventTarget instance to the collection.
     * @method add
     * @param eventTarget The instance to add.
     */
    add(eventTarget: string | IScrollEventTarget): void;
    /**
     * Returns an array of the IScrollEventTarget instances in the collection, sorted by their inverse hierarchical position in the document hierarchy
     * (child elements first preceeding their parent elements, and finally the window object if it is present).
     * @function toArray
     */
    toArray(): IScrollEventTarget[];
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
    readonly sourceType: ScrollEventTargetType;
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
export declare type ScrollListenerCallbackFunction = (sender: ScrollListener, args: ScrollListenerEventArgs) => void;
/**
 * The function optionally invoked by ScrollListener instances whenever an upstream scroll event occurs.
 * @function ScrollListenerTraceCallbackFunction
 * @param sender - the ScrollListener instance that invoked the callback.
 * @param event - the original scroll event.
 */
export declare type ScrollListenerTraceCallbackFunction = (sender: ScrollListener, event: Event) => void;
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
export declare class ScrollListener {
    /** @internal */
    private _throttle;
    /** @internal */
    private _targetElement;
    /** @internal */
    private _state;
    /** @internal */
    private _fn;
    /** @internal */
    private _traceFn;
    /** @internal */
    private _baseEventSrc;
    /** @internal */
    private _enabled;
    /**
     * Creates a new ScrollListener instance.
     * @param target The element to track.
     * @param eventSources The scroll-event sources that the ScrollListener instance will intercept the scroll events of.
     * @param callbackFunction The function that the ScrollListener instance will forward downstream (throttled) scroll events to.
     * @param options Additional configuration options.
     */
    constructor(target: Element, eventSources: ScrollEventTargetCollection, callbackFunction: ScrollListenerCallbackFunction, options?: ScrollListenerOptions);
    /**
     * Returns the element that the ScrollListener instance is tracking.
     * @property targetElement
     */
    readonly targetElement: Element;
    /**
     * Gets or sets the enabled state of the ScrollListener instance.
     * @property enabled
     */
    enabled: boolean;
    /**
     * Returns the current number of throttled upstream events.
     * ScrollListener does not guarantee to forward all throttled events to the downstream handler, however it will always
     * forward the most recent event and guarantees to forward the last event in each sequence.
     * @property backlog
     */
    readonly backlog: number;
    /**
     * Returns true if any scroll-event source that the ScrollListener instance has subscribed to is currently scrolling, otherwise returns false.
     * @property isScrolling.
     */
    readonly isScrolling: boolean;
    /**
     * Detaches all event listeners and releases all resources.
     * @method destroy
     */
    destroy(): void;
    /**
     * Returns true if the element exposes a getBoundingClientRect method an onscroll property, and addEventListener and removeEventListener methods,
     * otherwise false.
     * @function isScrollableContainer
     * @param element The element to test.
     */
    static isScrollableContainer(element: any): boolean;
    /** @internal */
    private onDownstreamEvent(sender, e, source);
    /** @internal */
    private getEventArgs(event, source);
    /** @internal */
    private getScopedIntersectionalRectangle();
    /** @internal */
    private getIntersectionalRectangle(child, container);
    /** @internal */
    private getRelativeRectangle(rect, crect);
}

```
# Usage - General

ScrollListener instances are created by invoking the ScrollListener constructor and passing (at a minimum) the target element to be tracked, a
ScrollEventTargetCollection containing a set of one or more scroll event sources, and a callback function to be invoked in response to scroll events.
Further configuration is possible by passing an object implementing ScrollListenerOptions.

ScrollEventTargetCollection instances can be populated with specific scroll containers, however invoking its static 'auto' function will
automatically populate a new ScrollEventTargetCollection instance with all scroll containers that are parents of the specified target element.
This can be useful in scenarios where the target's scroll container cannot be known definitively/reliably at design-time 
(as may be the case when developing within frameworks such as Ionic).

ScrollListener implements event throttling by enforcing a minimum delay between sequential scroll events (the default throttle duration is 150 milliseconds. Throttling scroll events can help make a busy UI feel more responsive by avoiding unnecessarily processing every source scroll event that is raised by the DOM.

ScrollListener will ALWAYS raise an event in response to the final scroll position of the target element.

In addition to event throttling and the automatic resolution of parent scroll containers, ScrollListener event arguments expose useful information
such as the position of the target element relative to its scroll containers, whether or not the target element is currently visible within the
scrolling viewport, and optional client state.

# IMPORTANT NOTE

HTML Table objects will by default overflow the bounding rectangle of any parent DIV (and other) elements, and in such cases ScrollListener may 
innacutately report whether or not a target element intersects or is contained within the scope or the scroll source element.
The preferred solution to this problem is to avoid the use of HTML tables (which do not play nicely with CSS), however parent elements may be
configured to expand to accommodate tables by using one of the following methods:

    style.width = "fit-content"; style.height = "fit-content"; / style = "width: fit-content;height: fit-content;"
OR  style.overflow = "auto"; OR "overflow: auto;"
OR  style.overflow = "scroll"; OR "overflow: scroll;"

# Usage - Unconstrained Scope

An example of binding to scroll event when the scroll container is not known at design-time.

```ts
class ScrollListenerUnknownScope
{
    private listener: ScrollListener;

    constructor(){
        let target = document.getElementById("elementToTrack");
        this.listener = new ScrollListener(target, ScrollEventTargetCollection.auto(target), (sender, args) => { this.onScroll(sender, args) });
    }

    onScroll(args: ScrollListenerCallbackArgs) {
        console.log("Scroll event fired.");
    }

    close(){
        this.listener.destroy();
        this.listener = null;
    }
}

```

# Usage - Specific Scope

An example of binding to a scroll event when the scroll container is known to exist at or below a specific bounding element.

```ts
class ScrollListenerScoped
{
    private listener: ScrollListener;

    constructor(){
        let target = document.getElementById("elementToTrack");
        let boundingElement = document.getElementById("boundingElement");
        this.listener = new ScrollListener(target, ScrollEventTargetCollection.auto(target, boundingElement), (sender, args) => { this.onScroll(sender, args) });
    }

    onScroll(args: ScrollListenerCallbackArgs) {
        console.log("Scroll event fired.");
    }

    close() {
        this.listener.destroy();
        this.listener = null;
    }
}

```

# Usage - Known Container

An example of binding to a scroll event when the scroll container is known at design-time.

```ts
class ScrollListenerKnownContainer
{
    private listener: ScrollListener;

    constructor(){
        let target = document.getElementById("elementToTrack");
        let scrollContainer = document.getElementById("scroll-container");
        this.listener = new ScrollListener(target, new ScrollEventTargetCollection(scrollContainer), (sender, args) => { this.onScroll(sender, args) });
    }

    onScroll(args: ScrollListenerCallbackArgs) {
        console.log("Scroll event fired.");
    }

    close() {
        this.listener.destroy();
        this.listener = null;
    }
}

```

# Usage - Multiple Known Containers

An example of binding to a scroll event when multiple scroll containers are known at design-time.

```ts
class ScrollListenerMultipleContainers
{
    private listener: ScrollListener;

    constructor(){
        let target = document.getElementById("elementToTrack");
        let container1 = document.getElementById("scroll-container1");
        let container2 = document.getElementById("scroll-container2");
        this.listener = new ScrollListener(target, new ScrollEventTargetCollection(container1, container2), (sender, args) => { this.onScroll(sender, args) });
    }

    onScroll(args: ScrollListenerCallbackArgs) {
        console.log("Scroll event fired.");
    }

    close() {
        this.listener.destroy();
        this.listener = null;
    }
}

```

# Usage - Custom Throttle Duration

An example of configuring a custom throttle duration.

```ts
class ScrollListenerThrottleDuration
{
    private listener: ScrollListener;

    constructor(){
        let target = document.getElementById("elementToTrack");
        let scrollContainer = document.getElementById("scroll-container");
        this.listener = new ScrollListener(target,  new ScrollEventTargetCollection(scrollContainer), (sender, args) => { this.onScroll(sender, args) }, { throttleDuration: 300 });
    }

    onScroll(args: ScrollListenerCallbackArgs) {
        console.log("Scroll event fired.");
    }

    close() {
        this.listener.destroy();
        this.listener = null;
    }
}

```

# Usage - Passing State

An example of passing state to scroll event handlers.

```ts
class ScrollListenerPassingState
{
    private listener: ScrollListener;

    constructor(myState: any){
        let target = document.getElementById("elementToTrack");
        let scrollContainer = document.getElementById("scroll-container");
        this.listener = new ScrollListener(target,   new ScrollEventTargetCollection(scrollContainer), (sender, args) => { this.onScroll(sender, args) }, { state: myState });
    }

    onScroll(args: ScrollListenerCallbackArgs) {
        let state = args.state;
        console.log("Scroll event fired.");
    }

    close() {
        this.listener.destroy();
        this.listener = null;
    }
}

```

# Usage - Trace Function

An example of using a trace function to enable processing of all raw upstream source events irrespective of downstream throttling.

```ts
class ScrollListenerTraceFunction
{
    private listener: ScrollListener;

    constructor(myState: any){
        let target = document.getElementById("elementToTrack");
        let scrollContainer = document.getElementById("scroll-container");
        this.listener = new ScrollListener(target, new ScrollEventTargetCollection(scrollContainer), (sender, args) => { this.onScroll(sender, args) }, { 
        traceFunction: (sender, event) => { this.onTrace(sender, event) } });
    }

    onScroll(args: ScrollListenerCallbackArgs) {
        let state = args.state;
        console.log("Scroll event fired.");
    }

    onTrace(sender: ScrollListener, event: Event) {
        console.log("Trace callback invoked.");
    }

    close() {
        this.listener.destroy();
        this.listener = null;
    }
}

```

## Contributors

 - Bryce Marshall

## MIT Licenced
