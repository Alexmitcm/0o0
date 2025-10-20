"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const linkedom_1 = require("linkedom");
const constants_1 = require("../../../utils/constants");
const getDescription_1 = __importDefault(require("./meta/getDescription"));
const getTitle_1 = __importDefault(require("./meta/getTitle"));
const fetchData = async (url) => {
    const response = await fetch(url, {
        headers: { "User-Agent": constants_1.HEY_USER_AGENT }
    });
    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.text();
};
const extractMetadata = (document, url) => {
    return {
        description: (0, getDescription_1.default)(document),
        title: (0, getTitle_1.default)(document),
        url
    };
};
const getMetadata = async (url) => {
    try {
        const data = await fetchData(url);
        const { document } = (0, linkedom_1.parseHTML)(data);
        return extractMetadata(document, url);
    }
    catch {
        return { description: null, title: null, url };
    }
};
exports.default = getMetadata;
