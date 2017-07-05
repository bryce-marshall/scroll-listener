import { ScrollListenerTest } from './scroll-listener-test';

var _test;
window.onload = function () {
    _test = new ScrollListenerTest();
    _test.init();

    window.onresize = function () {
        _test.onResize();
    }
}

