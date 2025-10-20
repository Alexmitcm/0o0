"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const getMetaContent_1 = __importDefault(require("./getMetaContent"));
const getDescription = (document) => {
    const description = (0, getMetaContent_1.default)(document, "og:description") ||
        (0, getMetaContent_1.default)(document, "twitter:description") ||
        null;
    return description;
};
exports.default = getDescription;
