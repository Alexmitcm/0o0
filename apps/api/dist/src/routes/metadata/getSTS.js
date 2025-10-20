"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_sts_1 = require("@aws-sdk/client-sts");
const constants_1 = require("@hey/data/constants");
const handleApiError_1 = __importDefault(require("../../utils/handleApiError"));
const stsClient_1 = __importDefault(require("../../utils/stsClient"));
const params = {
    DurationSeconds: 900,
    Policy: `{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:AbortMultipartUpload"
        ],
        "Resource": [
          "arn:aws:s3:::${constants_1.EVER_BUCKET}/*"
        ]
      }
    ]
  }`
};
const getSTS = async (ctx) => {
    try {
        const command = new client_sts_1.AssumeRoleCommand({
            ...params,
            RoleArn: undefined,
            RoleSessionName: undefined
        });
        const { Credentials: credentials } = await stsClient_1.default.send(command);
        return ctx.json({
            data: {
                accessKeyId: credentials?.AccessKeyId,
                secretAccessKey: credentials?.SecretAccessKey,
                sessionToken: credentials?.SessionToken
            },
            success: true
        });
    }
    catch (error) {
        return (0, handleApiError_1.default)(ctx, error);
    }
};
exports.default = getSTS;
