"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getMetaContent = (document, name) => {
    const metaTag = document.querySelector(`meta[name="${name}"]`) ||
        document.querySelector(`meta[property="${name}"]`);
    return metaTag ? metaTag.getAttribute("content") : null;
};
exports.default = getMetaContent;
