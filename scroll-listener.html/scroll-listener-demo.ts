import { ScrollEventTargetCollection, ScrollListener, ScrollListenerEventArgs, ScrollListenerOptions } from './package-src/scroll-listener';

export class ScrollListenerDemo {
    private viewPort: HTMLElement;
    private target: HTMLElement;
    private map: HTMLElement;
    private mapViewport: HTMLElement;
    private mapTarget: HTMLElement;
    private listener: ScrollListener;
    private scaleX: number;
    private scaleY: number;
    private sequence: number = 0;

    constructor() {
        this.target = document.getElementById("target");
        this.viewPort = document.getElementById("viewport-container");
        this.map = document.getElementById("map");
        this.mapViewport = document.getElementById("map-viewport");
        this.mapTarget = document.getElementById("map-target");
        let el = document.getElementById("cb-scope");
        el.attributes["checked"] = null;
        el.addEventListener("click", () => { this.onConfigChanged() });

        el = document.getElementById("cb-trace");
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
        document.getElementById("t-trace").innerHTML = "";
        this.sequence = 0;

        if (this.listener != null)
            this.listener.destroy();
        
        let sources: ScrollEventTargetCollection;
        let options: ScrollListenerOptions = { throttleDuration: parseInt((<any>document.getElementById("sel-throttle")).value) };
        if ((<any>document.getElementById("cb-scope")).checked)
            sources = new ScrollEventTargetCollection(this.viewPort);
        else
            sources = ScrollEventTargetCollection.auto(this.target)

        if ((<any>document.getElementById("cb-trace")).checked)
            options.traceFunction = (sender, e) => { this.onTrace(sender, e); };

        this.listener = new ScrollListener(this.target, sources, (sender, e) => { this.onScroll(sender, e) }, options);
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

    onBorderChanged(e) {
        this.viewPort.style.borderWidth = e.target.value;
        this.target.scrollIntoView();
    }

    onConfigChanged() {
        this.createListener();
    }

    onTrace(sender: ScrollListener, e: Event) {
        document.getElementById("t-trace").innerHTML = (++this.sequence).toString();
    }

    onScroll(sender: ScrollListener, args: ScrollListenerEventArgs) {
        this.updateInstrumentation(args);
        if (args.source !== this.viewPort) return;

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
    }

    onResize() {
        this.positionViewportOverlay();
    }

    private positionViewportOverlay(args?: ScrollListenerEventArgs) {
        let r = this.map.getBoundingClientRect();
        let o = this.getOffsets(this.viewPort);

        let top = (this.viewPort.scrollTop + o.y);
        let left = (this.viewPort.scrollLeft + o.x);

        this.mapViewport.style.top = this.stylePx(window.scrollY + r.top + top * this.scaleY);
        this.mapViewport.style.left = this.stylePx(window.scrollX + r.left + left * this.scaleX);

        if (args) {
            let rel = args.getRelativeRectangle();
            this.mapTarget.style.top = this.stylePx(window.scrollY + r.top + (top + rel.top - o.y) * this.scaleY);
            this.mapTarget.style.left = this.stylePx(window.scrollX + r.left + (left + rel.left - o.x) * this.scaleX);
        }
        else {
            this.mapTarget.style.top = this.stylePx(window.scrollY + r.top + (this.target.offsetTop - this.viewPort.offsetTop) * this.scaleY);
            this.mapTarget.style.left = this.stylePx(window.scrollX + r.left + (this.target.offsetLeft - this.viewPort.offsetLeft) * this.scaleX);
        }
    }

    updateInstrumentation(args: ScrollListenerEventArgs) {
        let rel = args.getRelativeRectangle();

        document.getElementById("t-top").innerHTML = Math.round(rel.top) + "px";
        document.getElementById("t-left").innerHTML = Math.round(rel.left) + "px";
        document.getElementById("t-bottom").innerHTML = Math.round(rel.bottom) + "px";
        document.getElementById("t-right").innerHTML = Math.round(rel.right) + "px";
        document.getElementById("t-ints-src").innerHTML = args.intersectsSource ? "true" : "false";
        document.getElementById("t-within-src").innerHTML = args.withinSource ? "true" : "false";
        document.getElementById("t-ints-scope").innerHTML = args.intersectsScope ? "true" : "false";
        document.getElementById("t-within-scope").innerHTML = args.withinScope ? "true" : "false";        
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