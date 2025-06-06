const constants = require("../../../utils/constants");
const {
  ORDER_STATE,
  CANCELLATION_CODE,
  TITLE_TYPE,
  FULFILLMENT_STATE,
} = require("../../../utils/constants");

module.exports = {
  $id: "http://example.com/schema/onStatusSchema",
  type: "object",
  properties: {
    context: {
      type: "object",
      properties: {
        domain: {
          type: "string",
          enum: ["ONDC:LOG10", "ONDC:LOG11"],
          const: { $data: "/status/0/context/domain" },
        },
        country: {
          type: "string",
        },
        city: {
          type: "string",
          const: { $data: "/search/0/context/city" },
        },
        action: {
          type: "string",
          const: "on_status",
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
          const: { $data: "/search/0/context/transaction_id" },
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
      ],
    },
    message: {
      type: "object",
      properties: {
        order: {
          type: "object",
          properties: {
            id: {
              type: "string",
              const: { $data: "/confirm/0/message/order/id" },
            },
            state: {
              type: "string",
              enum: ["Completed", "Cancelled", "In-progress", "Pending"],
            },
            cancellation: {
              cancelled_by: { type: "string" },
              reason: {
                type: "object",
                properties: {
                  reason: { type: "string", enum: CANCELLATION_CODE },
                },
              },
            },
            provider: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  const: {
                    $data: "/init/0/message/order/provider/id",
                  },
                  errorMessage: "mismatches between /init and /on_status",
                },
                locations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: {
                        type: "string",
                        const: {
                          $data:
                            "/init/0/message/order/provider/locations/0/id",
                        },
                        errorMessage: "mismatches between /init and /on_status",
                      },
                    },
                  },
                },
              },
              required: ["id"],
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                  },
                  fulfillment_id: {
                    type: "string",
                  },
                  category_id: {
                    type: "string",
                    const: {
                      $data: "/init/0/message/order/items/0/category_id",
                    },
                  },
                  descriptor: {
                    type: "object",
                    properties: {
                      code: {
                        type: "string",
                        const: {
                          $data:
                            "/init/0/message/order/items/0/descriptor/code",
                        },
                      },
                    },
                  },
                  time: {
                    type: "object",
                    properties: {
                      label: {
                        type: "string",
                      },
                      duration: {
                        type: "string",
                      },
                      timestamp: {
                        type: "string",
                      },
                    },
                    required: ["label", "duration"],
                  },
                },
                required: ["id", "category_id", "fulfillment_id"],
              },
            },
            quote: {
              type: "object",
              properties: {
                price: {
                  $ref: "commonSchema#/properties/priceFormat",
                },
                breakup: {
                  type: "array",
                  minItems: 1,
                  items: {
                    type: "object",
                    properties: {
                      "@ondc/org/item_id": {
                        type: "string",
                      },
                      "@ondc/org/title_type": {
                        type: "string",
                        enum: TITLE_TYPE,
                      },
                      price: {
                        $ref: "commonSchema#/properties/priceFormat",
                      },
                    },
                    required: [
                      "@ondc/org/item_id",
                      "@ondc/org/title_type",
                      "price",
                    ],
                  },
                },
              },
              required: ["price", "breakup"],
              isQuoteMatching: true,
            },
            fulfillments: {
              type: "array",
              minItems: 1,
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  type: {
                    type: "string",
                    enum: constants.FULFILLMENT_TYPE,
                  },
                  "@ondc/org/awb_no": {
                    type: "string",
                  },
                  state: {
                    type: "object",
                    properties: {
                      descriptor: {
                        type: "object",
                        properties: {
                          code: {
                            type: "string",
                            enum: FULFILLMENT_STATE,
                          },
                        },
                        required: ["code"],
                      },
                    },
                    required: ["descriptor"],
                  },
                  tracking: {
                    type: "boolean",
                  },
                  start: {
                    type: "object",
                    properties: {
                      time: {
                        type: "object",
                        properties: {
                          range: {
                            type: "object",
                            properties: {
                              start: {
                                type: "string",
                                pattern:
                                  "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
                                errorMessage:
                                  "should be in RFC 3339 (YYYY-MM-DDTHH:MN:SS.MSSZ) Format",
                              },
                              end: {
                                type: "string",
                                pattern:
                                  "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
                                errorMessage:
                                  "should be in RFC 3339 (YYYY-MM-DDTHH:MN:SS.MSSZ) Format",
                              },
                            },
                            required: ["start", "end"],
                          },
                          timestamp: {
                            type: "string",
                            pattern:
                              "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
                            errorMessage:
                              "should be in RFC 3339 (YYYY-MM-DDTHH:MN:SS.MSSZ) Format",
                          },
                        },
                      },
                      instructions: {
                        code: { type: "string" },
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },
                          short_desc: {
                            type: "string",
                          },
                          long_desc: {
                            type: "string",
                          },
                          images: {
                            type: "array",
                            items: {
                              type: "string",
                            },
                          },
                        },
                      },
                      person: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },
                        },
                      },
                      location: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                          },
                          gps: {
                            type: "string",
                            pattern:
                              "^(-?[0-9]{1,3}(?:.[0-9]{6,15})?),( )*?(-?[0-9]{1,3}(?:.[0-9]{6,15})?)$",
                            errorMessage:
                              "Incorrect gps value (min 6 decimal digits required)",
                          },
                          address: {
                            type: "object",
                            properties: {
                              name: {
                                type: "string",
                                minLength: 3,
                                not: { const: { $data: "1/locality" } },
                                errorMessage: "cannot be equal to locality",
                              },
                              building: {
                                type: "string",
                                minLength: 3,
                                not: { const: { $data: "1/locality" } },
                                errorMessage: "cannot be equal to locality",
                              },
                              locality: {
                                type: "string",
                                minLength: 3,
                              },
                              city: {
                                type: "string",
                              },
                              state: {
                                type: "string",
                              },
                              country: {
                                type: "string",
                              },
                              area_code: {
                                type: "string",
                              },
                            },
                            isLengthValid: true,
                          },
                        },
                        required: ["gps", "address"],
                      },
                      contact: {
                        type: "object",
                        properties: {
                          phone: {
                            type: "string",
                          },
                          email: {
                            type: "string",
                            format: "email",
                          },
                        },
                        required: ["phone"],
                      },
                    },
                  },
                  end: {
                    type: "object",
                    properties: {
                      time: {
                        type: "object",
                        properties: {
                          range: {
                            type: "object",
                            properties: {
                              start: {
                                type: "string",
                                pattern:
                                  "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
                                errorMessage:
                                  "should be in RFC 3339 (YYYY-MM-DDTHH:MN:SS.MSSZ) Format",
                              },
                              end: {
                                type: "string",
                                pattern:
                                  "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
                                errorMessage:
                                  "should be in RFC 3339 (YYYY-MM-DDTHH:MN:SS.MSSZ) Format",
                              },
                            },
                            required: ["start", "end"],
                          },
                          timestamp: {
                            type: "string",
                            pattern:
                              "^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$",
                            errorMessage:
                              "should be in RFC 3339 (YYYY-MM-DDTHH:MN:SS.MSSZ) Format",
                          },
                        },
                      },
                      instructions: {
                        code: { type: "string" },
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },
                          short_desc: {
                            type: "string",
                          },
                          long_desc: {
                            type: "string",
                          },
                          images: {
                            type: "array",
                            items: {
                              type: "string",
                            },
                          },
                        },
                      },
                      person: {
                        type: "object",
                        properties: {
                          name: {
                            type: "string",
                          },
                        },
                      },
                      location: {
                        type: "object",
                        properties: {
                          gps: {
                            type: "string",
                            pattern:
                              "^(-?[0-9]{1,3}(?:.[0-9]{6,15})?),( )*?(-?[0-9]{1,3}(?:.[0-9]{6,15})?)$",
                            errorMessage:
                              "Incorrect gps value (min 6 decimal digits required)",
                          },
                          address: {
                            type: "object",
                            properties: {
                              name: {
                                type: "string",
                                minLength: 3,
                                not: { const: { $data: "1/locality" } },
                                errorMessage: "cannot be equal to locality",
                              },
                              building: {
                                type: "string",
                                minLength: 3,
                                not: { const: { $data: "1/locality" } },
                                errorMessage: "cannot be equal to locality",
                              },
                              locality: {
                                type: "string",
                                minLength: 3,
                              },
                              city: {
                                type: "string",
                              },
                              state: {
                                type: "string",
                              },
                              country: {
                                type: "string",
                              },
                              area_code: {
                                type: "string",
                              },
                            },
                            isLengthValid: true,
                          },
                        },
                        required: ["gps", "address"],
                      },
                      contact: {
                        type: "object",
                        properties: {
                          phone: {
                            type: "string",
                          },
                          email: {
                            type: "string",
                            format: "email",
                          },
                        },
                        required: ["phone"],
                      },
                    },
                  },
                  agent: {
                    type: "object",
                    properties: {
                      name: {
                        type: "string",
                      },
                      phone: {
                        type: "string",
                      },
                    },
                  },
                  vehicle: {
                    type: "object",
                    properties: {
                      registration: {
                        type: "string",
                      },
                    },
                    required: ["registration"],
                  },
                  "@ondc/org/ewaybillno": {
                    type: "string",
                  },
                  "@ondc/org/ebnexpirydate": {
                    type: "string",
                  },
                  tags: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        code: {
                          type: "string",
                          enum: [
                            "tracking",
                            "linked_provider",
                            "linked_order",
                            "linked_order_item",
                            "shipping_label",
                            "fulfill_request",
                            "fulfill_response",
                            "rider_details",
                            "cod_collection_detail",
                            "cod_settlement_detail",
                            "rto_event",
                            "ebn",
                            "linked_order_diff_proof",
                            "linked_order_diff",
                            "reverseqc_output",
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
                                type: ["string", "number"],
                              },
                            },
                            required: ["code", "value"],
                          },
                        },
                      },
                      required: ["code", "list"],
                    },
                  },
                },
                allOf: [
                  {
                    if: { properties: { type: { const: "Delivery" } } },
                    then: {
                      properties: {
                        start: {
                          properties: {
                            time: { required: ["range"] },
                          },
                          required: ["time", "person", "location", "contact"],
                        },

                        end: {
                          properties: {
                            time: { required: ["range"] },
                          },
                          required: ["time", "person", "location", "contact"],
                        },
                      },
                      required: [
                        "id",
                        "type",
                        "state",
                        "tracking",
                        "start",
                        "end",
                      ],
                    },
                    else: {
                      properties: {
                        start: {
                          properties: {
                            time: { required: ["timestamp"] },
                          },
                          required: ["time"],
                        },
                      },
                      required: ["id", "type", "state", "start"],
                    },
                  },
                ],
              },
            },
            payment: {
              type: "object",
              properties: {
                "@ondc/org/collection_amount": {
                  type: "string",
                  const: {
                    $data:
                      "/on_confirm/0/message/order/payment/@ondc~1org~1collection_amount",
                  },
                },
                type: {
                  type: "string",
                  const: {
                    $data: "/on_confirm/0/message/order/payment/type",
                  },
                },
                status: {
                  type: "string",
                  enum: ["PAID", "NOT-PAID"],
                },
                collected_by: {
                  type: "string",
                  const: {
                    $data: "/on_confirm/0/message/order/payment/collected_by",
                  },
                },
                "@ondc/org/settlement_details": {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      settlement_counterparty: {
                        type: "string",
                      },
                      settlement_type: {
                        type: "string",
                      },
                      upi_address: {
                        type: "string",
                      },
                      settlement_bank_account_no: {
                        type: "string",
                      },
                      settlement_ifsc_code: {
                        type: "string",
                      },
                      settlement_status: {
                        type: "string",
                      },
                      settlement_reference: {
                        type: "string",
                      },
                      settlement_timestamp: {
                        type: "string",
                      },
                    },
                    required: ["settlement_counterparty", "settlement_type"],
                  },
                },
                "@ondc/org/settlement_basis": {
                  type: "string",
                  enum: ["invoicing", "shipment", "delivery"],
                },
                "@ondc/org/settlement_window": {
                  type: "string",
                  pattern: "^P\\d+D$",
                },
              },
              required: [
                "type",
                "collected_by",
                "status",
                "@ondc/org/settlement_window",
                "@ondc/org/settlement_basis",
              ],
            },
            billing: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  const: {
                    $data: "/confirm/0/message/order/billing/name",
                  },
                  errorMessage:
                    "mismatches in /billing in /confirm and /on_status",
                },
                address: {
                  type: "object",
                  properties: {
                    name: {
                      type: "string",
                      not: { const: { $data: "1/locality" } },
                      const: {
                        $data: "/confirm/0/message/order/billing/address/name",
                      },
                      errorMessage:
                        "mismatches in /billing in /confirm and /on_status",
                    },
                    building: {
                      type: "string",
                      const: {
                        $data:
                          "/confirm/0/message/order/billing/address/building",
                      },
                      errorMessage:
                        "mismatches in /billing in /confirm and /on_status",
                    },
                    locality: {
                      type: "string",
                      const: {
                        $data:
                          "/confirm/0/message/order/billing/address/locality",
                      },
                      errorMessage:
                        "mismatches in /billing in /confirm and /on_status",
                    },
                    city: {
                      type: "string",
                      const: {
                        $data: "/confirm/0/message/order/billing/address/city",
                      },
                      errorMessage:
                        "mismatches in /billing in /confirm and /on_status",
                    },
                    state: {
                      type: "string",
                      const: {
                        $data: "/confirm/0/message/order/billing/address/state",
                      },
                      errorMessage:
                        "mismatches in /billing in /confirm and /on_status",
                    },
                    country: {
                      type: "string",
                      const: {
                        $data:
                          "/confirm/0/message/order/billing/address/country",
                      },
                      errorMessage:
                        "mismatches in /billing in /confirm and /on_status",
                    },
                    area_code: {
                      type: "string",
                      const: {
                        $data:
                          "/confirm/0/message/order/billing/address/area code",
                      },
                      errorMessage:
                        "mismatches in /billing in /confirm and /on_status",
                    },
                  },
                  required: [
                    "name",
                    "building",
                    "locality",
                    "city",
                    "state",
                    "country",
                    "area_code",
                  ],
                },
                tax_number: {
                  type: "string",
                  const: {
                    $data: "/confirm/0/message/order/billing/tax_number",
                  },
                  errorMessage:
                    "mismatches in /billing in /confirm and /on_status",
                },
                phone: {
                  type: "string",
                  const: {
                    $data: "/confirm/0/message/order/billing/phone",
                  },
                  errorMessage:
                    "mismatches in /billing in /confirm and /on_status",
                },
                email: {
                  type: "string",
                  const: {
                    $data: "/confirm/0/message/order/billing/email",
                  },
                  errorMessage:
                    "mismatches in /billing in /confirm and /on_status",
                },
              },

              required: ["name", "address", "phone", "email", "tax_number"],
            },
            "@ondc/org/linked_order": {
              allOf: [
                {
                  $ref: "confirmSchema#/properties/message/properties/order/properties/@ondc~1org~1linked_order",
                },
                {
                  $data: "/confirm/0/message/order/@ondc~1org~1linked_order",
                },
              ],
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
          required: [
            "id",
            "state",
            "provider",
            "items",
            "quote",
            "fulfillments",
            "payment",
            "billing",
            "updated_at",
          ],
        },
      },
      required: ["order"],
    },
  },
  required: ["context", "message"],
};
