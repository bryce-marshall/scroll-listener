export class ConsoleHelper {
    static logRect(r: ClientRect) {
        if (r == null) console.log(null);
        console.log("top: " + r.top + ", right: " + r.right + ", bottom: " + r.bottom + ", left: " + r.left + ", width: " + r.width + ", height: " + r.height);
    }    
}

export class TypeHelper {
    static getAbsoluteRectangle(rect: ClientRect): ClientRect {
        let t = rect.top + window.scrollY;
        let l = rect.left + window.scrollX;
        return TypeHelper.createRect(
            t,
            t + rect.height,
            l,
            l + rect.width
        );
    }

    static createRect(t: number, b: number, l: number, r: number) {
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
    }  
}