import { ScrollEventTargetCollection, ScrollListener, ScrollListenerEventArgs, ScrollListenerOptions } from './package-src/scroll-listener';

export class TrackingTest {
    private _target: HTMLInputElement;
    private _tracker1: HTMLDivElement;
    private _tracker2: HTMLDivElement;
    private _instruments: HTMLDivElement;
    private _listener: ScrollListener;
    private _scrollSources: any[] = [];

    init() {
        console.log("TrackingTest.init()");
        this._target = <HTMLInputElement>document.getElementById("input-element");
        this._target.value = "Initialised";
        this._tracker1 = <HTMLDivElement>document.getElementById("tracker1");
        this._tracker2 = <HTMLDivElement>document.getElementById("tracker2");
        this._instruments = <HTMLDivElement>document.getElementById("instruments");

        let ts = window.getComputedStyle(this._target);
        this._tracker1.style.width = ts.width;
        this._tracker2.style.width = ts.width;
        
        setTimeout(() => {
            this._target.scrollIntoView();
            this.createListener();
        }, 1000
        )
    }

    createListener(){
        let sources: ScrollEventTargetCollection = ScrollEventTargetCollection.auto(this._target);
        //let sources: ScrollEventTargetCollection = new ScrollEventTargetCollection(this._target.parentElement, window);
        let options: ScrollListenerOptions = { throttleDuration: 500 };
        this._listener = new ScrollListener(this._target, sources, (sender, e) => { this.onScroll(sender, e) }, options);
    }

    onScroll(sender: ScrollListener, args: ScrollListenerEventArgs) {
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
        let r = this._target.getBoundingClientRect();
        //console.log(r);
        this._tracker1.style.top = (window.scrollY + r.top + 30) + "px";
        this._tracker1.style.left = (window.scrollX + r.left) + "px";

        let r2 = args.getRelativeRectangle();

        // this._tracker2.style.top = (r2.top) + "px";
        // this._tracker2.style.left = (r2.left) + "px";
        // console.log("r.top = " + r.top + "; r2.top = " + r2.top);

        this._tracker2.style.top = (window.scrollY + r2.top - 50) + "px";
        this._tracker2.style.left = (window.scrollX + r2.left) + "px";

        this._instruments.style.top = (window.scrollY + 10) + "px";
        this._instruments.style.left = (window.scrollX + 10) + "px";

        this.updateInstrumentation(args);
    }

    private updateInstrumentation(args: ScrollListenerEventArgs){
        document.getElementById("ints-src").innerHTML = args.intersectsSource ? "true" : "false";
        document.getElementById("within-src").innerHTML = args.withinSource ? "true" : "false";
        document.getElementById("ints-scp").innerHTML = args.intersectsScope ? "true" : "false";
        document.getElementById("within-scp").innerHTML = args.withinScope ? "true" : "false";        
        document.getElementById("scrl").innerHTML = args.scrolling ? "true" : "false";        
    }
}