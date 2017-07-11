import { ScrollEventTargetCollection, ScrollListener, ScrollListenerEventArgs, ScrollListenerOptions } from './package-src/scroll-listener';

export class PaddingTest {
    private _target: HTMLInputElement;
    private _listener: ScrollListener;

    init() {
        console.log("TrackingTest.init()");
        this._target = <HTMLInputElement>document.getElementById("target");
        this._target.value = "Initialised";

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
        this._listener.dumpScope(true);
    }

    onScroll(sender: ScrollListener, args: ScrollListenerEventArgs) {
        args.dumpScope(true);
    }
}