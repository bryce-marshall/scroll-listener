import { stringFormat } from '@brycemarshall/string-format';

export class DebugHelper {
    public static getRectString(r: ClientRect): string {
        return "{top: " + r.top + ", right: " + r.right + ", bottom: " + r.bottom + ", left: " + r.left + ", width: " + r.width + ", height: " + r.height + "}";
    }

    public static logRectString(r: ClientRect) {
        console.log(DebugHelper.getRectString(r));
    }

    public static logWindowRect(w: Window) {
        DebugHelper.logRectString(DebugHelper.createRect(0, w.innerHeight, 0, w.innerWidth));
    }

    public static logWindowScrollData(w: Window) {
        console.log(stringFormat("window: scrollX={0}, scrollY={1}", w.scrollX, w.scrollY));
    }    

    public static createRect(t: number, b: number, l: number, r: number): ClientRect {
        return {
            get top(): number {
                return t;
            },
            get bottom(): number {
                return b;
            },
            get left(): number {
                return l;
            },
            get right(): number {
                return r;
            },
            get width(): number {
                return r - l;
            },
            get height(): number {
                return b - t;
            }
        };
    };    
}