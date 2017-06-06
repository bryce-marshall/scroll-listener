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
    relativeRectangle: ClientRect,
    inView: boolean;
    inViewport: boolean;
    scrolling: boolean;
    state: any;
}

/**
 * @function ScrollListenerCallbackFunction
 * @param args - The callback arguments as an instance of the @type {ScrollListenerCallbackArgs}.
 */
export type ScrollListenerCallbackFunction = (args: ScrollListenerCallbackArgs) => void;

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
    processing scroll events (the default is 150 milliseconds).
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
export class ScrollListener {
    /** @internal */
    //private static _supportedContainers: string[] = ["DIV", "BODY", "FORM", "TBODY", "TFOOT", "THEAD", "HTML"];
    /** @internal */
    private _targetElement: HTMLElement;
    /** @internal */
    private _state: any;
    /** @internal */
    private _fn: ScrollListenerCallbackFunction;
    /** @internal */
    private _throtDur: number = 150;
    /** @internal */
    private _evtSrc: any[] = [];
    /** @internal */
    private _handlerRef: any;
    /** @internal */
    private _backlog: number = 0;
    /** @internal */
    private _enabled: boolean = true;

    /** 
     * @constructor 
     * @param targetElement - The element being watched.
     * @param callbackFunction - The @type {ScrollListenerCallbackFunction} function to invoke in response to a scroll event.
     * @param options - An object implementing @type {ScrollListenerOptions} that specifies additional configuration options. 
    */
    constructor(targetElement: HTMLElement, callbackFunction: ScrollListenerCallbackFunction, options?: ScrollListenerOptions) {
        if (!targetElement) throw new Error("ScrollListener: targetElement cannot be null.");
        if (!callbackFunction) throw new Error("ScrollListener: callbackFunction cannot be null.");

        this._targetElement = targetElement;
        this._fn = callbackFunction;
        this._handlerRef = (e) => { this.onScroll(e); };

        if (!options)
            this.walkTree(targetElement);
        else {
            this._state = options.state;
            if (typeof(options.throttleDuration) == "number" && options.throttleDuration >= 0) this._throtDur = options.throttleDuration;

            if (ScrollListener.isScrollableContainer(options.container))
                this._evtSrc.push(options.container);
            else if (options.containers && Array.isArray(options.containers)) {
                for (let c of options.containers)
                    if (ScrollListener.isScrollableContainer(c)) this._evtSrc.push(c);
            }
            else
                this.walkTree(targetElement, options.scope)
        }

        for (let c of this._evtSrc)
            c.addEventListener("scroll", this._handlerRef);
    }

    /**
     * @property targetElement - Returns the element that the @type {ScrollListener} instance is tracking.
     */
    public get targetElement(): HTMLElement {
        return this._targetElement;
    }

    /**
     * @property enabled - Gets or sets the enabled state of the @type {ScrollListener} instance.
     */
    public get enabled(): boolean {
        return this._enabled;
    }

    public set enabled(value: boolean) {
        this._enabled = value;
    }

    /**
     * @method destroy - Detaches all event listeners and releases all resources
     */
    public destroy() {
        if (this._evtSrc === null) return;
        this._targetElement = null;
        this._state = null;
        this._fn = null;

        for (let el of this._evtSrc) {
            el.removeEventListener("scroll", this._handlerRef);
        }

        this._handlerRef = null;
        this._evtSrc = null;
    }

    /**
     * @function destroy - Returns true if the element is an HTMLElement that exposes an onscroll property, otherwise false.
     * @param element -  The element to test.
     */
    public static isScrollableContainer(element: any): boolean {
        return element != null && element.tagName != null && typeof (element.onscroll) !== "undefined";
    }

    /** @internal */
    private walkTree(targetElement: HTMLElement, scopeBoundary?: HTMLElement) {
        // Navigate up the DOM and register any scrollable elements
        let parent: Node = targetElement.parentElement;
        while (parent != null) {
            if (ScrollListener.isScrollableContainer(parent)) {
                this._evtSrc.push(parent);
            }

            parent = parent != scopeBoundary ? parent.parentNode : null;
        }
    }

    /** @internal */
    private onScroll(e: Event) {
        if (this._fn === null || !this._enabled) return;

        if (this._throtDur == 0)
        {
            this._backlog = 2;
            this.processEvent(e, 1)
            this._backlog = 0;
        }
        else if (++this._backlog == 1)
            this.queueEvent(e);
    }

    /** @internal */
    private queueEvent(e: Event) {
        setTimeout((backlog: number) => {
            this.processEvent(e, backlog);
        }, this._throtDur, this._backlog);
    }

    /** @internal */
    private processEvent(e: Event, backlog: number) {
        // _targetElement will be null in the event that destroy() was invoked prior to timeout.
        if (this._targetElement === null || !this._enabled || typeof (e.srcElement.getBoundingClientRect) === "undefined") {
            this._backlog = 0;
            return;
        }

        let t = this._targetElement;
        let s: HTMLElement = <HTMLElement>e.srcElement;
        this._backlog -= backlog;
        let rect = this._targetElement.getBoundingClientRect();
        let crect = e.srcElement.getBoundingClientRect();
        let offsets = this.getOffsets(e.srcElement);

        let rel = {
            top: rect.top - crect.top,
            bottom: 0,
            left: rect.left - crect.left,
            right: 0,
            width: 0,
            height: 0
        };
        rel.bottom = rel.top + rect.height;
        rel.right = rel.left + rect.width;
        rel.width = rel.right - rel.left;
        rel.height = rel.bottom - rel.top;

        let args = {
            container: s,
            target: t,
            inView: (
                rel.bottom > offsets.y &&
                rel.top < (e.srcElement.clientHeight + offsets.y) &&
                rel.right > offsets.x &&
                rel.left < (e.srcElement.clientWidth + offsets.x)
            ),
            inViewport: (
                rel.top >= offsets.y &&
                rel.bottom <= (e.srcElement.clientHeight + offsets.y) &&
                rel.left >= offsets.x &&
                rel.right <= (e.srcElement.clientWidth + offsets.x)
            ),
            relativeRectangle: rel,
            scrolling: this._backlog > 0,
            state: this._state
        }

        this._fn(args);

        // If there have been events since the timeout was queued, queue another to ensure the event always fires on the final scroll position.
        if (this._backlog > 0)
            this.queueEvent(e);
    }

    /** @internal */
    private getOffsets(el: any) {
        let style = window.getComputedStyle(el);

        const l = parseInt(style.borderLeft);
        const t = parseInt(style.borderTop);

        let res = {
            x: isNaN(l) ? 0 : l,
            y: isNaN(t) ? 0 : t
        }

        return res;
    }
}
