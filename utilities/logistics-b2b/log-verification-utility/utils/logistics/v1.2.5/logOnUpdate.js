const _ = require("lodash");
const dao = require("../../../dao/dao");
const constants = require("../../constants");
const utils = require("../../utils.js");

const checkOnUpdate = (data, msgIdSet) => {
  let onUpdtObj = {};
  const domain = data?.context?.domain;
  let item_descriptor_code = dao.getValue("item_descriptor_code");
  const shipping_label = dao.getValue("shipping_label");
  let on_update = data;
  const contextDomain = data?.context?.domain;
  let contextTimestamp = on_update?.context?.timestamp;
  let rts = dao.getValue("rts");
  on_update = on_update.message.order;
  let fulfillments = on_update.fulfillments;
  let items = on_update.items;
  const surgeItem = dao.getValue("is_surge_item");
  const surgeItemData = dao.getValue("surge_item");
  let p2h2p = dao.getValue("p2h2p");
  let awbNo = dao.getValue("awbNo");
  let surgeItemFound = null;
  let locationsPresent = dao.getValue("confirm_locations");

  if (on_update?.updated_at > contextTimestamp) {
    onUpdtObj.updatedAtErr = `order/updated_at cannot be future dated w.r.t context/timestamp`;
  }

  if (locationsPresent) {
    if (!_.isEqual(on_update?.provider?.locations, locationsPresent)) {
      onUpdtObj.locationsErr = `order/provider/locations mismatch between /confirm and /on_update`;
    }
  }

  try {
    items?.map((item, i) => {
      if (domain === "ONDC:LOG10" && !item?.time?.timestamp) {
        onUpdtObj[
          `Item${i}_timestamp`
        ] = `Timestamp is mandatory inside time object for item ${item.id} in ${constants.LOG_ONSEARCH} api in order type P2P (ONDC:LOG10)`;
      }
      if (
        surgeItem &&
        item?.id === surgeItemData?.id &&
        Array.isArray(item.tags) &&
        item.tags.length > 0
      ) {
        surgeItemFound = item;
      }
    });

    if (surgeItem && !surgeItemFound) {
      onUpdtObj.surgeItemErr = `Surge item is missing in the order`;
    } else if (!_.isEqual(surgeItemFound?.price, surgeItemData?.price)) {
      onUpdtObj.surgeItemErr = `Surge item price does not match the one sent in on_search call`;
    }
  } catch (error) {
    console.error("Error while checking on update:", error.stack);
  }

  try {
    if (surgeItem) {
      const breakup = on_update?.quote?.breakup || [];

      const hasSurgeItem = breakup.find(
        (item) => item?.["@ondc/org/title_type"] === "surge"
      );

      const hasSurgeTax = breakup.find(
        (item) =>
          item?.["@ondc/org/title_type"] === "tax" &&
          item?.["@ondc/org/item_id"] === surgeItemData?.id
      );

      if (!hasSurgeItem) {
        onUpdtObj.surgequoteItembreakupErr = `Missing title_type "surge" in /on_update breakup when surge item was sent in /on_search`;
      } else if (!_.isEqual(hasSurgeItem?.price, surgeItemData?.price)) {
        onUpdtObj.surgequoteItembreakupErr = `Surge item price mismatch: received ${JSON.stringify(
          hasSurgeItem?.price
        )}, expected ${JSON.stringify(surgeItemData?.price)}`;
      }

      if (!hasSurgeTax) {
        onUpdtObj.surgequoteTaxbreakupErr = `Missing tax item with item_id "${surgeItemData?.id}" in /on_update breakup when surge item was sent in /on_search`;
      }
    }
  } catch (error) {
    console.error("Error checking quote object in /on_update:", error);
  }

  try {
    console.log(
      `Checking if start and end time range required in /on_update api`
    );
    fulfillments?.forEach((fulfillment) => {
      const ffState = fulfillment?.state?.descriptor?.code;
      let avgPickupTime = fulfillment?.start?.time?.duration;
      console.log(
        avgPickupTime,
        dao.getValue(`${fulfillment?.id}-avgPickupTime`)
      );

      if (contextDomain === "ONDC:LOG11") {
        const fulfillment_delay = fulfillment?.tags?.find(
          (tag) => tag.code === "fulfillment_delay"
        );
        const list = fulfillment_delay?.list || [];
        const getByCode = (code) => list.find((item) => item.code === code);

        const state = getByCode("state");

        if (
          fulfillment_delay &&
          state &&
          ["Order-picked-up", "Order-delivered"].includes(state?.value)
        ) {
          const reason_id = getByCode("reason_id");
          const timestamp = getByCode("timestamp");
          const attempt = getByCode("attempt");
          if (ffState !== "Pickup-rescheduled")
            onUpdtObj.fulfillment_delay_fulfillmentState = `fulfillment state should be "Pickup-rescheduled" if there is fulfillment_delay tags.`;
          if (!reason_id) {
            onUpdtObj.fulfillment_delay_reasonErr = `reason_id is required for fulfillment_delay state ${state.value}`;
          } else if (
            !constants?.fulfillment_delay_reason_id?.includes(reason_id.value)
          ) {
            onUpdtObj.fulfillment_delay_reasonErr = `reason_id ${
              reason_id.value
            } is not valid for fulfillment_delay state. Should be one of: ${constants?.fulfillment_delay_reason_id.join(
              ", "
            )}`;
          }

          if (!timestamp) {
            onUpdtObj.fulfillment_delay_timestampErr = `fulfillment_delay timestamp is required for fulfillment_delay state ${state.value}`;
          } else if (timestamp.value > contextTimestamp) {
            onUpdtObj.fulfillment_delay_timestampErr = `fulfillment_delay timestamp cannot be future dated w.r.t context/timestamp`;
          }

          if (!attempt) {
            onUpdtObj.fulfillment_delay_attemptErr = `fulfillment_delay attempt is required for fulfillment_delay state ${state.value}`;
          } else if (!["yes", "no"].includes(attempt.value)) {
            onUpdtObj.fulfillment_delay_attemptErr = `fulfillment_delay attempt should be 'yes' or 'no' for fulfillment_delay state ${state.value}`;
          }
        }
      }

      if (
        avgPickupTime &&
        dao.getValue(`${fulfillment?.id}-avgPickupTime`) &&
        avgPickupTime !== dao.getValue(`${fulfillment?.id}-avgPickupTime`)
      ) {
        onUpdtObj.avgPckupErr = `Average Pickup Time ${avgPickupTime} (fulfillments/start/time/duration) mismatches from the one provided in /on_search (${dao.getValue(
          `${fulfillment?.id}-avgPickupTime`
        )})`;
      }
      if (fulfillment["@ondc/org/awb_no"]) {
        awbNo = true;
      }
      if (!awbNo && p2h2p) {
        onUpdtObj.awbNoErr =
          "AWB No (@ondc/org/awb_no) is required in /fulfillments for P2H2P shipments (may be provided in /confirm or /update by logistics buyer or /on_confirm or /on_update by LSP)";
      }
      if (awbNo && !p2h2p) {
        onUpdtObj.awbNoErr =
          "AWB No (@ondc/org/awb_no) is not required for P2P fulfillments";
      }
      if (rts === "yes" && !fulfillment?.start?.time?.range) {
        onUpdtObj.strtRangeErr = `start/time/range is required in /fulfillments when ready_to_ship = yes in /update`;
      }
      if (
        fulfillment?.start?.time?.timestamp ||
        fulfillment?.end?.time?.timestamp
      ) {
        onUpdtObj.tmpstmpErr = `start/time/timestamp or end/time/timestamp cannot be provided in /fulfillments when fulfillment state is ${ffState}`;
      }
      if (rts === "yes" && !fulfillment?.end?.time?.range) {
        onUpdtObj.endRangeErr = `end/time/range is required in /fulfillments when ready_to_ship = yes in /update`;
      }

      if (
        fulfillment?.type === "Delivery" &&
        item_descriptor_code === "P2H2P" &&
        !shipping_label &&
        (!fulfillment?.start?.instructions?.images ||
          (Array.isArray(fulfillment.start.instructions.images) &&
            (fulfillment.start.instructions.images.length === 0 ||
              fulfillment.start.instructions.images.includes(""))))
      ) {
        onUpdtObj.shipLblErr = `Shipping label (/start/instructions/images) is required for P2H2P shipments.`;
      }

      if(fulfillment?.type== "Delivery")
      {
        if(fulfillment?.hasOwnProperty("tags"))
        {
          fulfillment?.tags?.forEach((tag) => {
            if(tag.code === "linked_provider")
            {
              if(!_.isEqual(JSON.stringify(tag), shipping_label))
              {
                onUpdtObj.linkedPrvdrErr = `linked_provider tag in /on_update does not match with the one provided in /init`;
              }
              if(tag?.list?.length > 0)
              {
                var found=false;
                tag.list.forEach((item) => {
                  if(item.code === "id")
                  {
                    found=true;
                    }
                  });
                  if(!found)
                  {
                    onUpdtObj.linkedPrvdrErr = `linked_provider tag in /on_update does not have id code`;
                  }
                };
              }
              if(tag.code==="linked_order_diff")
              {
                const requiredCodes = [
                  "id",
                  "weight_unit",
                  "weight_value",
                  "dim_unit",
                  "length",
                  "breadth",
                  "height",
                ];
                requiredCodes.forEach((key) => {
                  const found = input.list.find((item) => item.code === key);
                  if (!found) {
                    onUpdtObj.linkedPrvdrErr = `${key} code is missing in list of linked_order_diff tag`;
                  }
                });
              }
              if(tag.code==="linked_order_diff_proof")
                {
                  const requiredCodes = [
                    "id",
                    "url"
                  ];
                  requiredCodes.forEach((key) => {
                    const found = input.list.find((item) => item.code === key);
                    if (!found) {
                      onUpdtObj.linkedPrvdrErr = `${key} code is missing in list of linked_order_diff_proof tag`;
                    }
                  });
                }
            }
          );
        }
      }

      // if (p2h2p && !fulfillment?.start?.instructions?.images) {
      //   onUpdtObj.shipLblErr = `Shipping label (/start/instructions/images) is required for P2H2P shipments`;
      // }
    });
  } catch (error) {
    console.log(`!!Error while checking fulfillments in /on_update api`, error);
  }
if (on_update?.hasOwnProperty("cancellation_terms")) {
          console.log("validating cancellation terms"+on_status);
          const cancellationTerms= on_confirm?.cancellation_terms;
          if (!Array.isArray(cancellationTerms)) {
            onUpdtObj.cancellationTerms='cancellation_terms must be an array';
          } else {
            cancellationTerms.forEach((term, index) => {
              const path = `cancellation_terms[${index}]`;
          
              // fulfillment_state
              const descriptor = term?.fulfillment_state?.descriptor;
              if (!descriptor) {
                onUpdtObj.cancellationTerms=`${path}.fulfillment_state.descriptor is missing`;
              } else {
                if (!descriptor.code) {
                  onUpdtObj.cancellationTerms=`${path}.fulfillment_state.descriptor.code is missing`;
                } 
                else
                {
                  if(!constants.FULFILLMENT_STATE.includes(descriptor.code))
                  {
                    onUpdtObj.cancellationTerms=`${path}.fulfillment_state.descriptor.code is Invalid`;
                  }
                }
                if (!descriptor.short_desc) {
                  onUpdtObj.cancellationTerms=`${path}.fulfillment_state.descriptor.short_desc is missing`;
                }
              }
          
              // cancellation_fee
              const fee = term?.cancellation_fee;
              if (!fee) {
                onUpdtObj.cancellationTerms=`${path}.cancellation_fee is missing`;
              } else {
                if (!fee.percentage) {
                  onUpdtObj.cancellationTerms=`${path}.cancellation_fee.percentage is missing`;
                }
                if (!fee.amount) {
                  onUpdtObj.cancellationTerms=`${path}.cancellation_fee.amount is missing`;
                } else {
                  if (!fee.amount.currency) {
                    onUpdtObj.cancellationTerms=`${path}.cancellation_fee.amount.currency is missing`;
                  }
                  if (!fee.amount.value) {
                    onUpdtObj.cancellationTerms=`${path}.cancellation_fee.amount.value is missing`;
                  }
                }
              }
            });
          }
      
    }
  return onUpdtObj;
};

module.exports = checkOnUpdate;
