const {
  PCC_CODE,
  DCC_CODE,
  FULFILLMENT_TAGS_LIST_CODE,
  FULFILLMENT_TAGS_LIST_VALUE,
} = require("../../../utils/constants");
const constants = require("../../../utils/constants");

module.exports = {
  $id: "http://example.com/schema/updateSchema",
  title: "ONDC Logistics Update Fulfillment Schema",
  type: "object",
  required: ["context", "message"],
  properties: {
    context: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          enum: ["ONDC:LOG10", "ONDC:LOG11"],
          const: { $data: "/on_confirm/0/context/domain" },
        },
        country: {
          type: "string",
        },
        city: {
          type: "string",
          const: {
            $data: "/on_search/0/context/properties/city",
          },
        },
        action: {
          type: "string",
          const: "update",
        },
        core_version: {
          type: "string",
          const: "1.2.5",
        },
        bap_id: {
          type: "string",
          const: { $data: "/on_search/0/context/bap_id" },
          errorMessage:
            "bap_id must match the value from on_search: ${/on_search/0/context/bap_id}",
        },
        bap_uri: {
          type: "string",
          const: { $data: "/on_search/0/context/bap_uri" },
          errorMessage:
            "bap_uri must match the value from on_search: ${/on_search/0/context/bap_uri}",
        },
        bpp_id: {
          type: "string",
          const: { $data: "/on_search/0/context/bpp_id" },
          errorMessage:
            "bpp_id must match the value from on_search: ${/on_search/0/context/bpp_id}",
        },
        bpp_uri: {
          type: "string",
          const: { $data: "/on_search/0/context/bpp_uri" },
          errorMessage:
            "bpp_uri must match the value from on_search: ${/on_search/0/context/bpp_uri}",
        },
        transaction_id: {
          type: "string",
          const: {
            $data: "/search/0/context/transaction_id",
          },
          errorMessage:
            "Transaction ID should be same across the transaction: ${/search/0/context/transaction_id}",
        },
        message_id: {
          type: "string",
          allOf: [
            {
              not: {
                const: { $data: "1/transaction_id" },
              },
              errorMessage:
                "Message ID should not be equal to transaction_id: ${1/transaction_id}",
            },
          ],
        },
        timestamp: {
          type: "string",
          format: "date-time",
        },
        ttl: {
          type: "string",
          const: "PT30S",
        },
      },
      required: [
        "domain",
        "country",
        "city",
        "action",
        "core_version",
        "bap_id",
        "bap_uri",
        "bpp_uri",
        "bpp_id",
        "transaction_id",
        "message_id",
        "timestamp",
        "ttl",
      ],
    },
    message: {
      type: "object",
      required: ["update_target", "order"],
      properties: {
        update_target: { type: "string", const: "fulfillment" },
        order: {
          type: "object",
          required: ["id", "items", "fulfillments", "updated_at"],
          properties: {
            id: {
              type: "string",
              const: {
                $data: "/confirm/0/message/order/id",
              },
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    const: {
                      $data: "/confirm/0/message/order/items/0/id",
                    },
                  },
                  category_id: {
                    type: "string",
                    const: {
                      $data: "/confirm/0/message/order/items/0/category_id",
                    },
                  },
                  descriptor: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        const: {
                          $data:
                            "/confirm/0/message/order/items/0/descriptor/code",
                        },
                      },
                    },
                    required: ["code"],
                  },
                },
                required: ["id", "category_id"],
              },
            },
            fulfillments: {
              type: "array",
              items: {
                type: "object",
                required: ["id", "type", "start", "end"],
                properties: {
                  id: {
                    type: "string",
                    const: {
                      $data: "/init/0/message/order/items/0/fulfillment_id",
                    },
                  },
                  type: {
                    type: "string",
                  },
                  "@ondc/org/awb_no": {
                    type: "string",
                  },
                  start: {
                    type: "object",
                    properties: {
                      instructions: {
                        type: "object",
                        properties: {
                          code: {
                            type: "string",
                            enum: PCC_CODE,
                            const: {
                              $data:
                                "/confirm/0/message/order/fulfillments/0/start/instructions/code",
                            },
                          },
                          name: {
                            type: "string",
                          },
                          short_desc: {
                            type: "string",
                            const: {
                              $data:
                                "/confirm/0/message/order/fulfillments/0/start/instructions/short_desc",
                            },
                          },
                          long_desc: {
                            type: "string",
                          },
                        },

                        required: ["code", "short_desc"],
                        allOf: [
                          {
                            if: { properties: { code: { const: "1" } } },
                            then: {
                              properties: {
                                short_desc: {
                                  minLength: 10,
                                  maxLength: 10,
                                  pattern: "^[0-9]{10}$",
                                  errorMessage: "should be a 10 digit number",
                                },
                              },
                            },
                          },
                          {
                            if: {
                              properties: { code: { enum: ["2", "3", "4"] } },
                            },
                            then: {
                              properties: {
                                short_desc: {
                                  maxLength: 6,
                                  pattern: "^[a-zA-Z0-9]{1,6}$",
                                  errorMessage:
                                    "should not be an empty string or have more than 6 digits",
                                },
                              },
                            },
                          },
                        ],
                      },
                    },
                    // required: ["instructions"],
                  },
                  end: {
                    type: "object",
                    properties: {
                      instructions: {
                        type: "object",
                        properties: {
                          code: {
                            type: "string",
                            enum: DCC_CODE,
                            const: {
                              $data:
                                "/confirm/0/message/order/fulfillments/0/end/instructions/code",
                            },
                          },
                          name: {
                            type: "string",
                          },
                          short_desc: {
                            type: "string",
                            not: {
                              const: {
                                $data: "3/start/instructions/short_desc",
                              },
                            },
                            errorMessage:
                              "cannot be same as PCC - ${3/start/instructions/short_desc}",
                          },
                          long_desc: {
                            type: "string",
                          },
                        },
                        required: ["code"],
                        allOf: [
                          {
                            if: { properties: { code: { const: "3" } } },
                            then: {
                              properties: {
                                short_desc: {
                                  maxLength: 0,
                                  errorMessage: "is not required",
                                },
                              },
                            },
                          },
                          {
                            if: {
                              properties: { code: { enum: ["1", "2"] } },
                            },
                            then: {
                              properties: {
                                short_desc: {
                                  maxLength: 6,
                                  pattern: "^[a-zA-Z0-9]{1,6}$",
                                  errorMessage:
                                    "should not be an empty string or have more than 6 digits",
                                },
                              },
                              required: ["short_desc"],
                            },
                          },
                        ],
                      },
                    }, // required: ["instructions"],
                  },
                  tags: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string",
                          enum: [
                            "state",
                            "linked_provider",
                            "linked_order",
                            "linked_order_item",
                          ],
                        },
                        list: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              code: {
                                type: "string",
                              },
                              value: {
                                type: "string",
                              },
                            },
                            required: ["code", "value"],
                          },
                        },
                      },
                      required: ["code", "list"],
                    },
                    minItems: 2,
                    errorMessage: "at least two tags are required",
                  },
                },
              },
            },
            "@ondc/org/linked_order": {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category_id: {
                        type: "string",
                        enum: constants.CATEGORIES,
                      },
                      descriptor: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },
                        },
                        required: ["name"],
                      },
                      quantity: {
                        type: "object",
                        properties: {
                          count: {
                            type: "integer",
                          },
                          measure: {
                            type: "object",
                            properties: {
                              unit: {
                                type: "string",
                                enum: constants.UNITS_WEIGHT,
                              },
                              value: {
                                type: "number",
                              },
                            },
                            required: ["unit", "value"],
                          },
                        },
                        required: ["count", "measure"],
                      },
                      price: {
                        type: "object",
                        properties: {
                          currency: {
                            type: "string",
                          },
                          value: {
                            type: "string",
                          },
                        },
                        required: ["currency", "value"],
                      },
                    },
                    required: [
                      "category_id",
                      "descriptor",
                      "quantity",
                      "price",
                    ],
                  },
                },
                order: {
                  type: "object",
                  properties: {
                    id: {
                      type: "string",
                    },
                    weight: {
                      type: "object",
                      properties: {
                        unit: {
                          type: "string",
                          enum: constants.DEAD_wEIGHT,
                        },
                        value: {
                          type: "number",
                        },
                      },
                      required: ["unit", "value"],
                    },
                    dimensions: {
                      type: "object",
                      properties: {
                        length: {
                          type: "object",
                          properties: {
                            unit: {
                              type: "string",
                              enum: constants.UNITS_DIMENSIONS,
                            },
                            value: {
                              type: "number",
                            },
                          },
                          required: ["unit", "value"],
                        },
                        breadth: {
                          type: "object",
                          properties: {
                            unit: {
                              type: "string",
                              enum: constants.UNITS_DIMENSIONS,
                            },
                            value: {
                              type: "number",
                            },
                          },
                          required: ["unit", "value"],
                        },
                        height: {
                          type: "object",
                          properties: {
                            unit: {
                              type: "string",
                              enum: constants.UNITS_DIMENSIONS,
                            },
                            value: {
                              type: "number",
                            },
                          },
                          required: ["unit", "value"],
                        },
                      },
                      required: ["length", "breadth", "height"],
                    },
                  },
                  additionalProperties: false,
                  required: ["id", "weight"],
                },
              },
              additionalProperties: false,
              required: ["items", "order"],
            },
            updated_at: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
};
