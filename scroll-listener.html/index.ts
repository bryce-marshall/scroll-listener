import { ScrollListenerDemo } from './scroll-listener-demo';
import { TrackingTest } from './tracking-test';
import { PaddingTest } from './padding-test';

declare var _mode: string;
var _test;

window.onload = function () {
    if (_mode == "demo") {
        _test = new ScrollListenerDemo();
        _test.init();

        window.onresize = function () {
            _test.onResize();
        }
    } 
    else if (_mode == "tracking-test") {
        _test = new TrackingTest();
        _test.init();
    }
    else if (_mode == "padding-test") {
        _test = new PaddingTest();
        _test.init();
    }    
}

