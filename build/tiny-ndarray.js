"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TinyNDArrayOfInteger = void 0;
class TinyNDArrayOfInteger {
    constructor(gridShape) {
        this.strideX = gridShape.height;
        this.data = new Uint32Array(gridShape.width * gridShape.height);
    }
}
exports.TinyNDArrayOfInteger = TinyNDArrayOfInteger;
