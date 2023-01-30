import { Rect } from "./fast-poisson-disk-sampling";
export declare class TinyNDArrayOfInteger {
    strideX: number;
    data: Uint32Array;
    constructor(gridShape: Rect);
}
