# @brycemarshall\scroll-listener
A helper class that listens for scroll events affecting a specific element.

# Demo

http://plnkr.co/2RvsM8BmD5bzSbUqr7pw

## Installation

`npm install @brycemarshall\scroll-listener`

#The module exports the following:

```ts

/**
 * Event arguments passed to the ScrollListener callback function following a scroll event.
 * @interface ScrollListenerCallbackArgs
 * @property {HTMLElement} container - The container element that was scrolled to trigger the event.
 * @property {HTMLElement} target - The target element being tracked.
 * @property {ClientRect} relativeRectangle - A rectangle describing the position of the target element relative to the top left position of
 * the bounding client rectangle of 'container' (container.getBoundingClientRect().
 * @property {boolean} inView - True if any portion of the target element is visible within the viewport, otherwise false.
 * @property {boolean} inViewport - True if the entire target element is visible within the viewport, otherwise false.
 * @property {boolean} scrolling - True if the target element is still scrolling at time the event is processed, otherwise false.
 * @property {any} state - Client state referenced by the ScrollListener instance.
 */
export interface ScrollListenerCallbackArgs {
    container: HTMLElement;
    target: HTMLElement;
    relativeRectangle: ClientRect;
    inView: boolean;
    inViewport: boolean;
    scrolling: boolean;
    state: any;
}
/**
 * @function ScrollListenerCallbackFunction
 * @param args - The callback arguments as an instance of the @type {ScrollListenerCallbackArgs}.
 */
export declare type ScrollListenerCallbackFunction = (args: ScrollListenerCallbackArgs) => void;
/**
 * Specifies ScrollListener configuration options.
 * @interface ScrollListenerOptions
 * @property {HTMLElement} container - When specified, ScrollListener will listen for 'onscroll' events on 'container' only.
 * The 'container' property takes priority over 'containers' and 'scope'.
 * @property {HTMLElement[]} containers - When specified, ScrollListener will listen for 'onscroll' events on all elements in the 'containers' array.
 * The 'containers' property takes priority over 'scope' but defers to 'container'.
 * @property {HTMLElement} scope - When specified, ScrollListener will listen for 'onscroll' events on all parent container elements in the DOM tree
 * above its specified target element up to and including 'scope'.
 * The 'scope' property defers to 'container' and 'containers'.
 * @property {number} throttleDuration - When specified, defines the duration (in milliseconds) of the minimum delay in between
    processing scroll events (the default is 150 milliseconds). Specifying a throttle duration of zero (0) will disable throttling, resulting in
    every scroll event being processed.
 * @property {any} state - When specified, defines optional client state to be passed to the callback function.
 */
export interface ScrollListenerOptions {
    container?: HTMLElement;
    containers?: HTMLElement[];
    scope?: HTMLElement;
    throttleDuration?: number;
    state?: any;
}
/**
 * @class ScrollListener
 * A helper class that that invokes a callback function when a specified target element is scrolled.
 * ScrollListener works by attaching to the scroll event of either specific container elements, one or more of the target element's parent container elements.
 */
export declare class ScrollListener {
    /**
     * @constructor
     * @param targetElement - The element being watched.
     * @param callbackFunction - The @type {ScrollListenerCallbackFunction} function to invoke in response to a scroll event.
     * @param options - An object implementing @type {ScrollListenerOptions} that specifies additional configuration options.
    */
    constructor(targetElement: HTMLElement, callbackFunction: ScrollListenerCallbackFunction, options?: ScrollListenerOptions);
    /**
     * @property targetElement - Returns the element that the @type {ScrollListener} instance is tracking.
     */
    readonly targetElement: HTMLElement;
    /**
     * @property enabled - Gets or sets the enabled state of the @type {ScrollListener} instance.
     */
    enabled: boolean;
    /**
     * @method destroy - Detaches all event listeners and releases all resources
     */
    destroy(): void;
    /**
     * @function destroy - Returns true if the element is an HTMLElement that exposes an onscroll property, otherwise false.
     * @param element -  The element to test.
     */
    static isScrollableContainer(element: any): boolean;
}


```
# Usage - General

ScrollListener instances are created by invoking the ScrollListener constructor and passing (at a minimum) the target element to be tracked, and a callback 
function to be invoked in response to scroll events. Further configuration is possible by passing an object implementing ScrollListenerOptions.

ScrollListener can attach to a specified scroll container(s), but if none are specified it will walk the DOM tree and attach to parent scroll containers of the
target element. This is useful in scenarios where the target's scroll container cannot be known definitively/reliably at design-time 
(as may be the case when developing within frameworks such as Ionic).

ScrollListener implements event throttling by enforcing a minimum delay between sequential scroll events (the default throttle duration is 150 milliseconds). Throttling scroll events can help make a busy UI feel more responsive by avoiding unnecessarily processing every source scroll event that is raised by the DOM.
ScrollListener will ALWAYS raise an event in response to the final scroll position of the target element.

If specified, client state will be attached to every scroll event raised by ScrollListener.

# Usage - Unconstrained Scope

An example of binding to scroll event when the scroll container is not known at design-time.

```ts
class ScrollListenerUnknownScope
{
    private listener: ScrollListener;

    constructor(){
        let target = document.getElementById("elementToTrack");
        this.listener = new ScrollListener.Create(target, (args) => { this.onScroll(args) });
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
        this.listener = new ScrollListener(target, (args) => { this.onScroll(args) }, { scope: boundingElement });
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
        this.listener = new ScrollListener(target, (args) => { this.onScroll(args) }, { container: scrollContainer });
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
        this.listener = new ScrollListener(target, (args) => { this.onScroll(args) }, { containers: [ container1, container2 ] });
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
        this.listener = new ScrollListener(target, (args) => { this.onScroll(args) }, { container: scrollContainer, throttleDuration: 300 });
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
        this.listener = new ScrollListener(target, (args) => { this.onScroll(args) }, { container: scrollContainer, state: myState });
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

## Contributors

 - Bryce Marshall

## MIT Licenced
