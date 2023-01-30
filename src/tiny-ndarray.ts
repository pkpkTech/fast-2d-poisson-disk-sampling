import { Rect } from "./fast-poisson-disk-sampling";

export class TinyNDArrayOfInteger {
    strideX: number;
    data: Uint32Array;
    constructor(gridShape: Rect) {
        this.strideX = gridShape.height;
        this.data = new Uint32Array(gridShape.width * gridShape.height);
    }
}
