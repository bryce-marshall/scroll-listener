import { ScrollListener, ScrollListenerCallbackArgs, ScrollListenerOptions } from './package-src/scroll-listener';

export class ScrollListenerTest {
    private viewPort: HTMLElement;
    private target: HTMLElement;
    private map: HTMLElement;
    private mapViewport: HTMLElement;
    private mapTarget: HTMLElement;
    private listener: ScrollListener;
    private scaleX: number;
    private scaleY: number;

    constructor() {
        this.target = document.getElementById("target");
        this.viewPort = document.getElementById("viewport-container");
        this.map = document.getElementById("map");
        this.mapViewport = document.getElementById("map-viewport");
        this.mapTarget = document.getElementById("map-target");
        let el = document.getElementById("cb-scope");
        el.attributes["checked"] = null;
        el.addEventListener("click", () => { this.onConfigChanged() });
        this.addEventListener("click", (e) => { this.onNudge(e) }, "ngu", "ngd", "ngl", "ngr");
        this.addEventListener("change", () => { this.onConfigChanged() }, "sel-throttle");
        this.addEventListener("change", (e) => { this.onBorderChanged(e) }, "sel-border");

        this.createListener();
    }

    private addEventListener(eventName: string, handler: EventListener, ...elementIds: string[]) {
        for (let id of elementIds) {
            let el = document.getElementById(id);
            el.addEventListener(eventName, handler);
        }
    }

    private createListener() {
        if (this.listener != null)
            this.listener.destroy();

        let el: any = document.getElementById("cb-scope");
        let scoped = el.checked;
        el = document.getElementById("sel-throttle");
        let throttle: number = parseInt(el.value);

        let options: ScrollListenerOptions = scoped ? { container: this.viewPort, throttleDuration: throttle } : { throttleDuration: throttle };
        this.listener = new ScrollListener(this.target, (args) => { this.onScroll(args) }, options);
    }

    init() {
        this.applyScale();
        this.target.scrollIntoView();
        //this.positionViewportOverlay();

        setTimeout(() => {
            this.mapViewport.style.display = "block";
            this.mapTarget.style.display = "block";
        }, 250);
    }

    onNudge(e) {
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
    }

    onBorderChanged(e){
        this.viewPort.style.borderWidth = e.target.value;
        this.target.scrollIntoView();
    }

    onConfigChanged() {
        this.createListener();
    }

    onScroll(args: ScrollListenerCallbackArgs) {
        this.updateInstrumentation(args);
        if (args.container !== this.viewPort) return;
        this.positionViewportOverlay(args);

        if (args.inViewport) {
            this.mapViewport.removeAttribute("inview");
            this.mapViewport.setAttribute("inviewport", null);
        }
        else if (args.inView) {
            this.mapViewport.removeAttribute("inviewport");
            this.mapViewport.setAttribute("inview", null);
        }
        else {
            this.mapViewport.removeAttribute("inview");
            this.mapViewport.removeAttribute("inviewport");
        }
    }

    onResize() {
        this.positionViewportOverlay();
    }

    private positionViewportOverlay(args?: ScrollListenerCallbackArgs) {
        let r = this.map.getBoundingClientRect();
        let o = this.getOffsets(this.viewPort);

        let top = (this.viewPort.scrollTop + o.y);
        let left = (this.viewPort.scrollLeft + o.x);

        this.mapViewport.style.top = this.stylePx(r.top + top * this.scaleY);
        this.mapViewport.style.left = this.stylePx(r.left + left * this.scaleX);

        if (args) {
            this.mapTarget.style.top = this.stylePx(r.top + (top + args.relativeRectangle.top - o.y) * this.scaleY);
            this.mapTarget.style.left = this.stylePx(r.left + (left + args.relativeRectangle.left - o.x) * this.scaleX);
        }
        else {
            this.mapTarget.style.top = this.stylePx(r.top + (this.target.offsetTop - this.viewPort.offsetTop) * this.scaleY);
            this.mapTarget.style.left = this.stylePx(r.left + (this.target.offsetLeft - this.viewPort.offsetLeft) * this.scaleX);
        }
    }

    updateInstrumentation(args: ScrollListenerCallbackArgs) {
        document.getElementById("t-top").innerHTML = Math.round(args.relativeRectangle.top) + "px";
        document.getElementById("t-left").innerHTML = Math.round(args.relativeRectangle.left) + "px";
        document.getElementById("t-bottom").innerHTML = Math.round(args.relativeRectangle.bottom) + "px";
        document.getElementById("t-right").innerHTML = Math.round(args.relativeRectangle.right) + "px";
        document.getElementById("t-inview").innerHTML = args.inView ? "true" : "false";
        document.getElementById("t-inviewport").innerHTML = args.inViewport ? "true" : "false";
        document.getElementById("t-scrolling").innerHTML = args.scrolling ? "true" : "false";
    }

    private applyScale() {
        // Scale is based upon the size of the entire scrollable region relative to the size of the map
        let sx = this.map.clientWidth / this.viewPort.scrollWidth;
        let sy = this.map.clientHeight / this.viewPort.scrollHeight;

        this.mapViewport.style.width = this.stylePx(Math.round(this.viewPort.clientWidth * sx));
        this.mapViewport.style.height = this.stylePx(Math.round(this.viewPort.clientHeight * sy));

        this.mapTarget.style.width = this.stylePx(Math.round(this.target.clientWidth * sx));
        this.mapTarget.style.height = this.stylePx(Math.round(this.target.clientHeight * sy));

        this.scaleX = sx;
        this.scaleY = sy;
    }

    private stylePx(value: number) {
        return Math.round(value) + "px";
    }

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

var _test;
window.onload = function () {
    _test = new ScrollListenerTest();
    _test.init();

    window.onresize = function () {
        _test.onResize();
    }
}

