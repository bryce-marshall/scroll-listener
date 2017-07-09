import { ScrollListenerDemo } from './scroll-listener-demo';
import { TrackingTest } from './tracking-test';

declare var _mode: string;
var _test;

window.onload = function () {
    if (_mode == "demo") {
        _test = new ScrollListenerDemo();
        _test.init();

        window.onresize = function () {
            _test.onResize();
        }
    } else if (_mode == "tracking-test") {
        _test = new TrackingTest();
        _test.init();
    }
}

