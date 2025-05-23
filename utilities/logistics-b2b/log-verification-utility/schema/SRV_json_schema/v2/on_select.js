const constants = require("../../../utils/constants");

module.exports = {
	$id: "http://example.com/schema/onSelectSchema",
	type: "object",
	properties: {
		context: {
			type: "object",
			properties: {
				domain: {
					type: "string",
				},
				location: {
					type: "object",
					properties: {
						city: {
							type: "object",
							properties: {
								code: {
									type: "string",
								},
							},
							required: ["code"],
						},
						country: {
							type: "object",
							properties: {
								code: {
									type: "string",
								},
							},
							required: ["code"],
						},
					},
					required: ["city", "country"],
				},
				action: {
					type: "string",
					const: "on_select",
				},
				version: {
					type: "string",
					const: "2.0.0",
				},
				bap_id: {
					type: "string",
				},
				bap_uri: {
					type: "string",
				},
				bpp_id: {
					type: "string",
				},
				bpp_uri: {
					type: "string",
				},
				transaction_id: {
					type: "string",
					const: { $data: "/select/0/context/transaction_id" },
					errorMessage:
						"Transaction ID should be same across the transaction: ${/select/0/context/transaction_id}",
				},
				message_id: {
					type: "string",
					allOf: [
						{
							const: { $data: "/select/0/context/message_id" },
							errorMessage:
								"Message ID for on_action API should be same as action API: ${/select/0/context/message_id}",
						},
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
				},
			},
			required: [
				"domain",
				"location",
				"action",
				"version",
				"bap_id",
				"bap_uri",
				"bpp_id",
				"bpp_uri",
				"transaction_id",
				"message_id",
				"timestamp",
				"ttl",
			],
		},
		message: {
			type: "object",
			properties: {
				order: {
					type: "object",
					properties: {
						provider: {
							type: "object",
							properties: {
								id: {
									type: "string",
									const: { $data: "/select/0/message/order/provider/id" },
								},
								locations: {
									type: "array",
									items: {
										type: "object",
										properties: {
											id: {
												type: "string",
											},
										},
										required: ["id"],
									},
								},
							},
							required: ["id", "locations"],
						},
						items: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: {
										type: "string",
									},
									parent_item_id: {
										type: "string",
									},
									fulfillment_ids: {
										type: "array",
										items: {
											type: "string",
										},
									},
									location_ids: {
										type: "array",
										items: {
											type: "string",
										},
									},
									category_ids: {
										type: "array",
										items: {
											type: "string",
										},
									},
									quantity: {
										type: "object",
										properties: {
											selected: {
												type: "object",
												properties: {
													count: {
														type: "integer",
													},
												},
												required: ["count"],
											},
										},
										required: ["selected"],
									},
									tags: {
										type: "array",
										items: {
											type: "object",
											properties: {
												descriptor: {
													type: "object",
													properties: {
														code: {
															type: "string",
															enum: ["attribute"],
														},
													},
													required: ["code"],
												},
												list: {
													type: "array",
													items: {
														type: "object",
														properties: {
															descriptor: {
																type: "object",
																properties: {
																	code: {
																		type: "string",
																	},
																},
																required: ["code"],
															},
															value: {
																type: "string",
															},
														},
														required: ["descriptor", "value"],
													},
												},
											},
											required: ["descriptor", "list"],
										},
									},
								},
								if: {
									properties: {
										tags: {
											contains: {
												properties: {
													descriptor: {
														properties: {
															code: {
																const: "attribute",
															},
														},
													},
													list: {
														contains: {
															properties: {
																descriptor: {
																	properties: {
																		code: {
																			const: "type",
																		},
																	},
																},
																value: {
																	const: "customization",
																},
															},
															required: ["descriptor", "value"],
														},
													},
												},
												required: ["descriptor", "list"],
											},
										},
									},
								},
								then: {
									required: [
										"category_ids",
										"parent_item_id",
										"descriptor",
										"price",
										"quantity",
										"tags",
									],
								},
								else: {
									required: [
										"id",
										"quantity",
										"location_ids",
										"fulfillment_ids",
									],
								},
							},
						},

						fulfillments: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: {
										type: "string",
									},
									tracking: {
										type: "boolean",
									},
									state: {
										type: "object",
										properties: {
											descriptor: {
												type: "object",
												properties: {
													code: {
														type: "string",
														enum: ["Serviceable", "Non-serviceable"],
													},
												},
												required: ["code"],
											},
										},
										required: ["descriptor"],
									},
									stops: {
										type: "array",
										items: {
											type: "object",
											properties: {
												type: {
													type: "string",
												},
												location: {
													type: "object",
													properties: {
														gps: {
															type: "string",
														},
														area_code: {
															type: "string",
														},
													},
													required: ["gps", "area_code"],
												},
												time: {
													type: "object",
													properties: {
														label: {
															type: "string",
															enum: ["confirmed", "rejected"],
														},
														range: {
															type: "object",
															properties: {
																start: {
																	type: "string",
																},
																end: {
																	type: "string",
																},
															},
															required: ["start", "end"],
														},
														days: {
															type: "string",
														},
													},
													required: ["label", "range"],
												},
												tags: {
													type: "object",
													properties: {
														descriptor: {
															type: "object",
															properties: {
																code: {
																	type: "string",
																},
															},
															required: ["code"],
														},
														list: {
															type: "array",
															items: {
																type: "object",
																properties: {
																	descriptor: {
																		type: "object",
																		properties: {
																			code: {
																				type: "string",
																			},
																		},
																		required: ["code"],
																	},
																	value: {
																		type: "string",
																	},
																},
																required: ["descriptor", "value"],
															},
														},
													},
													required: ["descriptor", "list"],
												},
											},
											required: ["type", "location", "time"],
										},
									},
								},
								required: ["id", "state", "stops"],
							},
						},
						// quote: {
						//   type: "object",
						//   properties: {
						//     price: {
						//       type: "object",
						//       properties: {
						//         currency: {
						//           type: "string",
						//         },
						//         value: {
						//           type: "string",
						//         },
						//       },
						//       required: ["currency", "value"],
						//     },
						//     breakup: {
						//       type: "array",
						//       items: {
						//         type: "object",
						//         properties: {
						//           title: {
						//             type: "string",
						//           },
						//           price: {
						//             type: "object",
						//             properties: {
						//               currency: {
						//                 type: "string",
						//               },
						//               value: {
						//                 type: "string",
						//               },
						//             },
						//             required: ["currency", "value"],
						//           },
						//           item: {
						//             type: "object",
						//             properties: {
						//               id: {
						//                 type: "string",
						//               },
						//               quantity: {
						//                 type: "object",
						//                 properties: {
						//                   selected: {
						//                     type: "object",
						//                     properties: {
						//                       count: {
						//                         type: "integer",
						//                       },
						//                     },
						//                     required: ["count"],
						//                   },
						//                 },
						//               },
						//               price: {
						//                 type: "object",
						//                 properties: {
						//                   currency: {
						//                     type: "string",
						//                   },
						//                   value: {
						//                     type: "string",
						//                   },
						//                 },
						//                 required: ["currency", "value"],
						//               },
						//             },
						//             required: ["id"],
						//           },
						//           tags: {
						//             type: "array",
						//             items: {
						//               type: "object",
						//               properties: {
						//                 descriptor: {
						//                   type: "object",
						//                   properties: {
						//                     code: {
						//                       type: "string",
						//                       enum:["title"]
						//                     },
						//                   },
						//                   required: ["code"],
						//                 },
						//                 list: {
						//                   type: "array",
						//                   items: {
						//                     type: "object",
						//                     properties: {
						//                       descriptor: {
						//                         type: "object",
						//                         properties: {
						//                           code: {
						//                             type: "string",
						//                             enum: ["type"],
						//                           },
						//                         },
						//                         required: ["code"],
						//                       },
						//                       value: {
						//                         type: "string",
						//                         enum: constants.BREAKUP_TYPE,
						//                       },
						//                     },
						//                     required: ["descriptor", "value"],
						//                   },
						//                 },
						//               },
						//               required: ["descriptor", "list"],
						//             },
						//           },
						//         },
						//         required: ["title", "price", "item", "tags"],
						//       },
						//     },
						//     ttl: {
						//       type: "string",
						//     },
						//   },
						//   isQuoteMatching: true,
						//   required: ["price", "breakup", "ttl"],
						// },

						quote: {
							type: "object",
							properties: {
								price: {
									type: "object",
									properties: {
										currency: { type: "string" },
										value: { type: "string" },
									},
									required: ["currency", "value"],
								},
								breakup: {
									type: "array",
									items: {
										type: "object",
										properties: {
											title: { type: "string" },
											price: {
												type: "object",
												properties: {
													currency: { type: "string" },
													value: { type: "string" },
												},
												required: ["currency", "value"],
											},
											item: {
												type: "object",
												properties: {
													id: { type: "string" },
													quantity: {
														type: "object",
														properties: {
															selected: {
																type: "object",
																properties: {
																	count: { type: "number" },
																},
																required: ["count"],
															},
														},
													},
													price: {
														type: "object",
														properties: {
															currency: { type: "string" },
															value: { type: "string" },
														},
													},
												},
											},
											tags: {
												type: "array",
												items: {
													type: "object",
													properties: {
														descriptor: {
															type: "object",
															properties: {
																code: { type: "string" },
															},
															required: ["code"],
														},
														list: {
															type: "array",
															items: {
																type: "object",
																properties: {
																	descriptor: {
																		type: "object",
																		properties: {
																			code: { type: "string" },
																		},
																		required: ["code"],
																	},
																	value: { type: "string" },
																},
															},
														},
													},
												},
											},
										},
										required: ["title", "price", "item", "tags"],
										allOf: [
											{
												if: {
													properties: {
														tags: {
															type: "array",
															items: {
																properties: {
																	list: {
																		type: "array",
																		items: {
																			properties: {
																				descriptor: {
																					properties: {
																						code: { const: "item" },
																					},
																				},
																			},
																		},
																	},
																},
															},
														},
													},
												},
												then: {
													properties: {
														item: {
															type: "object",
															required: ["id", "price"],
														},
													},
												},
											},
											{
												if: {
													properties: {
														tags: {
															type: "array",
															items: {
																properties: {
																	list: {
																		type: "array",
																		items: {
																			properties: {
																				descriptor: {
																					properties: {
																						code: { const: "customization" },
																					},
																				},
																			},
																		},
																	},
																},
															},
														},
													},
												},
												then: {
													properties: {
														item: {
															type: "object",
															required: ["id", "price", "quantity"],
														},
													},
												},
											},
											{
												if: {
													properties: {
														tags: {
															type: "array",
															items: {
																properties: {
																	list: {
																		type: "array",
																		items: {
																			properties: {
																				descriptor: {
																					properties: {
																						code: {
																							enum: ["tax", "discount", "misc"],
																						},
																					},
																				},
																			},
																		},
																	},
																},
															},
														},
													},
												},
												then: {
													properties: {
														item: {
															type: "object",
															required: ["id"],
														},
													},
												},
											},
										],
									},
								},
								ttl: { type: "string" },
							},
							isQuoteMatching: true,
							required: ["price", "breakup", "ttl"],
						},

						payments: {
							type: "array",
							items: {
								type: "object",
								properties: {
									type: {
										type: "string",
										const: { $data: "/select/0/message/order/payments/0/type" },
									},
									collected_by: {
										type: "string",
										enum: ["BAP", "BPP"],
									},
								},
								required: ["type", "collected_by"],
							},
						},
					},
					required: ["provider", "items", "fulfillments", "quote", "payments"],
				},
			},
			required: ["order"],
		},
		error: {
			type: "object",
			properties: {
				code: {
					type: "string",
				},
				message: {
					type: "string",
				},
			},
			required: ["code", "message"],
		},
	},

	if: {
		properties: {
			message: {
				order: {
					fulfillments: {
						state: { descriptor: { code: { const: "Non-serviceable" } } },
					},
				},
			},
		},
	},
	then: { required: ["context", "message", "error"] },
	else: { required: ["context", "message"] },
};
