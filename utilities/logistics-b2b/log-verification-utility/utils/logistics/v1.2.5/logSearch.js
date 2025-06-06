const _ = require("lodash");
const fs = require("fs");
const path = require("path");
const dao = require("../../../dao/dao.js");
const constants = require("../../constants");
const utils = require("../../utils.js");
const { reverseGeoCodingCheck } = require("../../reverseGeoCoding");

const checkSearch = async (data, msgIdSet) => {
  let srchObj = {};
  let search = data;
  const version = search?.context?.core_version;
  let contextTime = search.context.timestamp;
  search = search.message.intent;
  let linkedOrder = search["@ondc/org/payload_details"];
  let orderPrice = linkedOrder?.value?.value;
  dao.setValue("orderPrice", orderPrice);
  const {
    start: { location: startLocation },
    end: { location: endLocation },
    tags,
  } = data.message.intent.fulfillment;

  try {
    tags?.map((tag) => {
      if (tag?.code === "linked_order") {
        tag?.list?.map((list) => {
          if (list?.code === "cod_order") {
            dao.setValue("cod_order", list?.value ?? "no");
          }
        });
      }
    });
  } catch (error) {
    console.error("Error while checking fulfillment tags:", error.stack);
  }

  if (
    search?.tags?.some((tag) => tag?.list?.some((item) => item?.code === "016"))
  ) {
    dao.setValue("Dynamic_otp_verification_rto", true);
  }

  if (
    search?.tags?.some((tag) => tag?.list?.some((item) => item?.code === "011"))
  ) {
    dao.setValue("Update_delivery_address", true);
  }

  if (dao.getValue("Dynamic_otp_verification_rto")) {
    const startType = search?.fulfillment?.start?.authorization?.type;
    const endType = search?.fulfillment?.end?.authorization?.type;

    if (startType !== "OTP" || endType !== "OTP") {
      if (startType !== "OTP" && endType !== "OTP") {
        srchObj["dynamic_flow_authorization_error"] =
          "Authorization type should be OTP for Dynamic OTP verification RTO flow in both start and end object of fulfillment.";
      } else if (startType !== "OTP") {
        srchObj["dynamic_flow_authorization_error"] =
          "Authorization type should be OTP for Dynamic OTP verification RTO flow in start object of fulfillment.";
      } else if (endType !== "OTP") {
        srchObj["dynamic_flow_authorization_error"] =
          "Authorization type should be OTP for Dynamic OTP verification RTO flow in end object of fulfillment.";
      }
    }
  }

  try {
    if (version === "1.2.5") {
      if (!startLocation?.id)
        srchObj["startLocationId-Err"] = "Start location 'id' is mandatory";

      if (!data?.message?.intent?.fulfillment?.tags)
        srchObj["fulfillment_tags-Err"] =
          "Tags are mandatory in the fulfillment";

      if (!data?.message?.intent?.tags)
        srchObj["tags-Err"] = "Tags are mandatory in the message";
    }
  } catch (error) {
    console.error("Error while checking location_id:", error.stack);
  }

  try {
    console.log(`Checking if holidays are in past date or not`);
    let holidays = search?.provider?.time?.schedule?.holidays;
    if (holidays && holidays.length > 0) {
      holidays.forEach((holiday, i) => {
        holidayDate = new Date(holiday);
        if (!utils.compareDates(holidayDate, contextTime)) {
          let itemKey = `holidayErr${i}`;
          srchObj[
            itemKey
          ] = `Holiday date '${holiday}' should not be past dated`;
        }
      });
    }
  } catch (error) {
    console.log("Error while checking holidays", error);
  }

  console.log(
    "Checking Reverse Geocoding for `start` location in `fullfilment`"
  );
  try {
    const [lat, long] = startLocation.gps.split(",");
    const area_code = startLocation.address.area_code;
    const match = await reverseGeoCodingCheck(lat, long, area_code);
    if (!match)
      srchObj[
        "RGC-start-Err"
      ] = `Reverse Geocoding for \`start\` failed. Area Code ${area_code} not matching with ${lat},${long} Lat-Long pair.`;
  } catch (error) {
    console.log("Error in start location", error);
  }

  // check for context cityCode and fulfillment start location
  try {
    const pinToStd = JSON.parse(
      fs.readFileSync(path.join(__dirname, "pinToStd.json"), "utf8")
    );
    const stdCode =
      data?.context?.city === "*"
        ? data?.context?.city
        : data?.context?.city.split(":")[1];
    console.log("stdCode", stdCode);
    const area_code = startLocation?.address?.area_code;
    if (pinToStd[area_code] && pinToStd[area_code] != stdCode) {
      srchObj[
        "CityCode-Err"
      ] = `CityCode ${stdCode} should match the city for the fulfillment start location ${area_code}, ${pinToStd[area_code]}`;
    }
  } catch (err) {
    console.error("Error in city code check: ", err.message);
  }

  console.log("Checking Reverse Geocoding for `end` location in `fullfilment`");
  try {
    const [lat, long] = endLocation.gps.split(",");
    const area_code = endLocation.address.area_code;
    const match = await reverseGeoCodingCheck(lat, long, area_code);
    if (!match)
      srchObj[
        "RGC-end-Err"
      ] = `Reverse Geocoding for \`end\` failed. Area Code ${area_code} not matching with ${lat},${long} Lat-Long pair.`;
  } catch (error) {
    console.log("Error in end location", error);
  }

  dao.setValue("searchObj", search);
  return srchObj;
};
module.exports = checkSearch;
