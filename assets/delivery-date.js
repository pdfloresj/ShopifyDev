/**
 * Helper for implementing delivery date picker
 */
(function (deliveryDateUtil) {
  const DELIVERY_DAYS_BEFORE_EVENT_LIMIT = 5;
  deliveryDateUtil.DELIVERY_DAYS_BEFORE_EVENT_LIMIT = DELIVERY_DAYS_BEFORE_EVENT_LIMIT;

  deliveryDateUtil.deliveryDateInfo = {};

  /**
   * Validate a date with the following criteria
   *  - one of available days
   *  - within available range
   *  - within minimum and maximum date
   */
  const validateDate = (date, deliveryDateInfo) => {
    if (!deliveryDateInfo) return false;

    const day = date.getDay();
    const availableDays = deliveryDateInfo["available_days_mapped"];
    const isAvailableDay = availableDays.includes(day);

    const ranges = deliveryDateInfo["available_ranges"];
    const isYearAllRound = ranges.length === 0;
    const isWithinRange = isYearAllRound || validateWithinRange(date, ranges);

    const minDate = getMinDate(deliveryDateInfo);
    const maxDate = getMaxDateFromMinDate(minDate);
    const isWithinMinMax = date >= minDate && date <= maxDate;

    const exclusionDates = deliveryDateInfo["exclusion_dates"];
    const isNotExclusionDate = exclusionDates.every((dateStr) => {
      const exclusionDate = new Date(`${date.getFullYear()}-${dateStr}`);
      return exclusionDate.setHours(24, 0, 0, 0) !== date.setHours(0, 0, 0, 0);
    });

    const lockRanges = deliveryDateInfo["lock_ranges"];
    const isWithinLockRanges = validateWithinRange(date, lockRanges);

    return isAvailableDay && isWithinRange && isWithinMinMax && isNotExclusionDate && !isWithinLockRanges;
  };
  deliveryDateUtil.validateDate = validateDate;

  const isSaturdayDate = (date) => date.getDay() === 6;
  deliveryDateUtil.isSaturdayDate = isSaturdayDate;

  const validateWithinRange = (date, ranges) => {
    for (range of ranges) {
      const fromDate = new Date(new Date(range[0]).setHours(24, 0, 0, 0));
      const toDate = new Date(new Date(range[1]).setHours(24, 0, 0, 0));
      const compareDate = new Date(date.setHours(0, 0, 0, 0));

      if (compareDate >= fromDate && compareDate <= toDate) return true;
    }
    return false;
  };

  const addDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  };
  deliveryDateUtil.addDays = addDays;

  const subtractDays = (date, days) => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  };
  deliveryDateUtil.subtractDays = subtractDays;

  const getMinDate = (deliveryDateInfo) => {
    if (!deliveryDateInfo) return;
    const minDeliveryDate = deliveryDateInfo.available_num_days
      ? addDays(new Date(), deliveryDateInfo.available_num_days)
      : new Date();

    const ranges = deliveryDateInfo.available_ranges;
    if (ranges.length === 0) return minDeliveryDate;

    const minDateFromRange = new Date(ranges[0][0]);
    return minDeliveryDate < minDateFromRange ? minDateFromRange : minDeliveryDate;
  };
  const getMaxDateFromMinDate = (minDate) => {
    if (!minDate) return;
    return new Date(minDate.getFullYear() + 2, minDate.getMonth(), minDate.getDate());
  };

  const getDeliveryDateInfo = async (handle) =>
    await $.get(`${window.theme.api_url}/delivery-dates?handle=${handle}`, null, null, "json");
  deliveryDateUtil.getDeliveryDateInfo = getDeliveryDateInfo;

  /**
   * Fetch the delivery date info of the product using the handle. Then,
   * store the delivery date info as an item inside the global object.
   */
  const fetchDeliveryDateInfo = async (handle) => {
    if (!deliveryDateUtil.deliveryDateInfo[handle]) {
      deliveryDateUtil.deliveryDateInfo[handle] = { state: "loading" };

      try {
        const deliveryDateInfo = await getDeliveryDateInfo(handle);
        deliveryDateUtil.deliveryDateInfo[handle] = {
          state: "success",
          data: deliveryDateInfo,
        };
      } catch {
        deliveryDateUtil.deliveryDateInfo[handle] = { state: "failed" };
      }
    }
  };

  const enableInputElement = (inputElem, selectMsg) => {
    inputElem.prop("disabled", false).prop("placeholder", selectMsg).removeClass("disabled");
  };

  function mobileCheck() {
    let check = false;
    // prettier-ignore
    (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
    console.log("CHECK", check);
    return check;
  }

  /**
   * Set the default as the best delivery date before the event date.
   *
   * @returns {boolean} true if event date doesn't exist or event date exists
   * and is within the available range. false if available ranges doesn't match
   * the event date.
   */
  const setDefaultDeliveryDate = (handle, customerId, inputElem) => {
    const deliveryDateInfo = deliveryDateUtil.deliveryDateInfo[handle].data;
    if (!deliveryDateInfo) return null;

    const bestDeliveredBefore = deliveryDateInfo.best_delivery_day;
    const eventDateStr = localStorage.getItem(`event-date-${customerId}`);
    if (!eventDateStr) return true;
    const eventDate = new Date(eventDateStr);
    const optimalDate = subtractDays(eventDate, bestDeliveredBefore);

    // Check few days before the optimal date
    for (let i = 0; i < DELIVERY_DAYS_BEFORE_EVENT_LIMIT; i++) {
      const suggestedDate = subtractDays(optimalDate, i);

      if (validateDate(suggestedDate, deliveryDateInfo) && !isSaturdayDate(suggestedDate)) {
        inputElem.val($.datepicker.formatDate("mm/dd/yy", suggestedDate));
        inputElem.change();
        return true;
      }
    }

    // Check days after the optimal date up to a day before the event day
    for (let i = 1; i < bestDeliveredBefore; i++) {
      const suggestedDate = addDays(optimalDate, i);
      if (validateDate(suggestedDate, deliveryDateInfo)) {
        inputElem.val($.datepicker.formatDate("mm/dd/yy", suggestedDate));
        inputElem.change();
        return true;
      }
    }

    return false;
  };

  deliveryDateUtil.formatRecommendedDate = (date) =>
    date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  /**
   * Callback that shows the best delivery day message below the input
   *
   * @callback showBestDeliveryDayCallback
   * @param {number} handle identifies the product
   */

  /**
   * Callback that shows a warning message if product is not available for the
   * selected event date
   *
   * @callback showWarningMessage
   */

  /**
   * Fetch available delivery day for the product and store it.
   * Then, attach a date picker.
   *
   * @param {string} selector CSS selector to get the input element to attach datepicker on
   * @param {number} handle Product handle which identifies a product
   * @param {Object} options Localized strings for loading and select message
   * @param {number} customerId used to get the default delivery date from local storage
   * @param {showBestDeliveryDayCallback} onShowBestDeliveryDay
   * @param {showWarningMessage} onShowWarningMessage
   */
  deliveryDateUtil.datepicker = async (
    selector,
    handle,
    options = {
      loadingMsg: "Loading Delivery Date...",
      selectMsg: "Please select a valid delivery date",
    },
    customerId,
    onShowBestDeliveryDay,
    onShowWarningMessage
  ) => {
    // Mobile detection
    const inputElem = $(selector);
    if (mobileCheck()) inputElem.prop("readonly", true);

    // Fetch delivery date info and parse props
    await fetchDeliveryDateInfo(handle);
    const selectedDeliveryDateInfo = deliveryDateUtil.deliveryDateInfo[handle].data;
    const minDate = getMinDate(selectedDeliveryDateInfo);
    const maxDate = getMaxDateFromMinDate(minDate);

    // Render date picker
    inputElem.datepicker({
      minDate: minDate,
      maxDate: maxDate,
      changeMonth: true,
      changeYear: true,
      beforeShowDay: (date) => [validateDate(date, deliveryDateUtil.deliveryDateInfo[handle].data)],
    });

    // Render input fieid
    enableInputElement(inputElem, options.selectMsg);
    const isEventDateWithinAvailableRange = setDefaultDeliveryDate(handle, customerId, inputElem);
    if (isEventDateWithinAvailableRange) onShowBestDeliveryDay && onShowBestDeliveryDay(handle);
    else onShowWarningMessage && onShowWarningMessage();
  };

  /**
   * Validate delivery date string from input. A dateStr must be
   *  - not empty
   *  - in valid format
   *  - one of the available dates
   *  - not black-out dates
   *
   * @param {string} dateStr date string to validate
   */
  deliveryDateUtil.validateDateStr = (dateStr, handle) => {
    if (dateStr.length === 0) return false;
    try {
      $.datepicker.parseDate("mm/dd/yy", dateStr);
    } catch (e) {
      return false;
    }

    const date = new Date(dateStr);
    return validateDate(date, deliveryDateUtil.deliveryDateInfo[handle].data);
  };
})((window.deliveryDateUtil = window.deliveryDateUtil || {}));
