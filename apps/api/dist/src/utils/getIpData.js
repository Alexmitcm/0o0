"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const getIpData = (ctx) => {
    const h = (name) => ctx.req.header(name) ?? "";
    return {
        city: h("cf-ipcity"),
        countryCode: h("cf-ipcountry"),
        region: h("cf-region")
    };
};
exports.default = getIpData;
