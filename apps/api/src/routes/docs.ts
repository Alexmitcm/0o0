import { Status } from "@hey/data/enums";
import type { Context } from "hono";

export const apiDocs = async (c: Context) => {
  const docs = {
    components: {
      schemas: {
        Error: {
          properties: {
            error: {
              properties: {
                code: { type: "string" },
                details: { type: "object" },
                message: { type: "string" },
                status: { type: "number" },
                timestamp: { format: "date-time", type: "string" }
              },
              type: "object"
            },
            status: { example: "Error", type: "string" },
            success: { example: false, type: "boolean" }
          },
          type: "object"
        }
      },
      securitySchemes: {
        BearerAuth: {
          bearerFormat: "JWT",
          scheme: "bearer",
          type: "http"
        }
      }
    },
    info: {
      contact: {
        email: "support@hey.com",
        name: "Hey Team"
      },
      description:
        "Social media platform API with gaming, tournaments, and premium features",
      title: "Hey API",
      version: "1.0.0"
    },
    openapi: "3.0.0",
    paths: {
      "/auth/login": {
        post: {
          description: "Authenticate user with wallet address and profile ID",
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  properties: {
                    selectedProfileId: {
                      description: "Lens profile ID to link",
                      type: "string"
                    },
                    walletAddress: {
                      description: "User's wallet address",
                      pattern: "^0x[a-fA-F0-9]{40}$",
                      type: "string"
                    }
                  },
                  required: ["walletAddress", "selectedProfileId"],
                  type: "object"
                }
              }
            },
            required: true
          },
          responses: {
            "200": {
              content: {
                "application/json": {
                  schema: {
                    properties: {
                      isNewUser: { type: "boolean" },
                      message: { type: "string" },
                      success: { type: "boolean" },
                      token: { type: "string" },
                      user: {
                        properties: {
                          avatarUrl: { type: "string" },
                          displayName: { type: "string" },
                          email: { type: "string" },
                          lastActiveAt: { format: "date-time", type: "string" },
                          linkedProfileId: { type: "string" },
                          registrationDate: {
                            format: "date-time",
                            type: "string"
                          },
                          status: {
                            enum: ["Standard", "Premium"],
                            type: "string"
                          },
                          totalLogins: { type: "number" },
                          username: { type: "string" },
                          walletAddress: { type: "string" }
                        },
                        type: "object"
                      }
                    },
                    type: "object"
                  }
                }
              },
              description: "Login successful"
            },
            "400": {
              description: "Invalid request data"
            },
            "401": {
              description: "Authentication failed"
            }
          },
          summary: "User login"
        }
      },
      "/games": {
        get: {
          description: "Retrieve list of games with pagination and filtering",
          parameters: [
            {
              description: "Page number",
              in: "query",
              name: "page",
              schema: { default: 1, minimum: 1, type: "integer" }
            },
            {
              description: "Number of games per page",
              in: "query",
              name: "limit",
              schema: { default: 20, maximum: 100, minimum: 1, type: "integer" }
            },
            {
              description: "Filter by category",
              in: "query",
              name: "category",
              schema: { type: "string" }
            },
            {
              description: "Filter by status",
              in: "query",
              name: "status",
              schema: { enum: ["Draft", "Published"], type: "string" }
            },
            {
              description: "Search term",
              in: "query",
              name: "search",
              schema: { type: "string" }
            }
          ],
          responses: {
            "200": {
              content: {
                "application/json": {
                  schema: {
                    properties: {
                      data: {
                        properties: {
                          games: {
                            items: {
                              properties: {
                                coverImageUrl: { type: "string" },
                                createdAt: {
                                  format: "date-time",
                                  type: "string"
                                },
                                description: { type: "string" },
                                iconUrl: { type: "string" },
                                id: { type: "string" },
                                likeCount: { type: "number" },
                                playCount: { type: "number" },
                                rating: { type: "number" },
                                status: { type: "string" },
                                title: { type: "string" }
                              },
                              type: "object"
                            },
                            type: "array"
                          },
                          pagination: {
                            properties: {
                              limit: { type: "number" },
                              page: { type: "number" },
                              pages: { type: "number" },
                              total: { type: "number" }
                            },
                            type: "object"
                          }
                        },
                        type: "object"
                      },
                      success: { type: "boolean" }
                    },
                    type: "object"
                  }
                }
              },
              description: "Games retrieved successfully"
            }
          },
          summary: "Get games"
        }
      },
      "/health": {
        get: {
          description:
            "Comprehensive health check including database, Redis, and system metrics",
          responses: {
            "200": {
              content: {
                "application/json": {
                  schema: {
                    properties: {
                      data: {
                        properties: {
                          checks: {
                            properties: {
                              database: {
                                properties: {
                                  duration: { type: "number" },
                                  error: { type: "string" },
                                  status: {
                                    enum: ["healthy", "unhealthy"],
                                    type: "string"
                                  }
                                },
                                type: "object"
                              },
                              redis: {
                                properties: {
                                  duration: { type: "number" },
                                  error: { type: "string" },
                                  status: {
                                    enum: ["healthy", "unhealthy"],
                                    type: "string"
                                  }
                                },
                                type: "object"
                              }
                            },
                            type: "object"
                          },
                          duration: { type: "number" },
                          metrics: {
                            properties: {
                              cache: { type: "object" },
                              database: { type: "object" },
                              requests: { type: "object" },
                              system: { type: "object" }
                            },
                            type: "object"
                          },
                          status: {
                            enum: ["healthy", "unhealthy"],
                            type: "string"
                          },
                          timestamp: { format: "date-time", type: "string" }
                        },
                        type: "object"
                      },
                      status: { type: "string" },
                      success: { type: "boolean" }
                    },
                    type: "object"
                  }
                }
              },
              description: "System is healthy"
            },
            "503": {
              description: "System is unhealthy"
            }
          },
          summary: "Detailed health check"
        }
      },
      "/ping": {
        get: {
          description: "Simple ping endpoint to check if the API is running",
          responses: {
            "200": {
              content: {
                "application/json": {
                  schema: {
                    properties: {
                      data: {
                        properties: {
                          message: { type: "string" },
                          timestamp: { format: "date-time", type: "string" }
                        },
                        type: "object"
                      },
                      status: { type: "string" },
                      success: { type: "boolean" }
                    },
                    type: "object"
                  }
                }
              },
              description: "API is running"
            }
          },
          summary: "Health check endpoint"
        }
      },
      "/tournaments": {
        get: {
          description: "Retrieve list of tournaments",
          responses: {
            "200": {
              content: {
                "application/json": {
                  schema: {
                    properties: {
                      data: {
                        items: {
                          properties: {
                            endDate: { format: "date-time", type: "string" },
                            id: { type: "string" },
                            name: { type: "string" },
                            participantCount: { type: "number" },
                            prizePool: { type: "string" },
                            startDate: { format: "date-time", type: "string" },
                            status: {
                              enum: ["Upcoming", "Active", "Ended", "Settled"],
                              type: "string"
                            },
                            type: {
                              enum: ["Balanced", "Unbalanced"],
                              type: "string"
                            }
                          },
                          type: "object"
                        },
                        type: "array"
                      },
                      success: { type: "boolean" }
                    },
                    type: "object"
                  }
                }
              },
              description: "Tournaments retrieved successfully"
            }
          },
          summary: "Get tournaments"
        }
      }
    },
    security: [
      {
        BearerAuth: []
      }
    ],
    servers: [
      {
        description: "API Server",
        url: process.env.API_URL || "http://localhost:8080"
      }
    ]
  };

  return c.json({
    data: docs,
    status: Status.Success,
    success: true
  });
};
