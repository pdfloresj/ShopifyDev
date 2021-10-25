/**
 * @fileoverview Custom logic for overriding the default quick cart behaviours
 */

/**
 * Repository of AJAX cart API requests.
 *
 * See https://shopify.dev/docs/themes/ajax-api/reference/cart
 * for more information about each endpoints.
 */
(function (cartService) {
  cartService.addItemToCart = async function (variant_id, qty, deliveryDate, handle, customProperties = {}) {
    const productData = {
      id: variant_id,
      quantity: qty,
      properties: deliveryDate
        ? {
            "Delivery Date": deliveryDate,
            _handle: handle,
            ...customProperties,
          }
        : { _handle: handle, ...customProperties },
    };

    await $.post("/cart/add.js", productData, null, "json");
  };

  cartService.getCartInfo = async function () {
    return await $.get("/cart.js", null, null, "json");
  };

  cartService.updateLineItemQuantity = async function (variant_id, new_quantity) {
    const lineItemData = {
      id: variant_id,
      quantity: new_quantity,
    };

    return await $.post("/cart/change.js", lineItemData, null, "json");
  };
})((window.cartService = window.cartService || {}));

/**
 * Custom methods that override the original quick cart behaviours.
 *
 * The original quick cart provided by the IRA theme does not support custom
 * fields on the product. Also, updating quantity in the quick cart is not
 * compatible with custom fields.
 */
(function (quickCart) {
  quickCart.updateCart = ({ subtotal, itemCount, items, updateHeader = true, openCart = false }) => {
    const isEmpty = itemCount === 0;
    updateSubtotal(subtotal);
    updateCartItems(items);
    updateHeader && updateHeaderCart(itemCount);
    openCart ? displayCart(isEmpty) : displayEmptyOrFooter(isEmpty);
  };

  /**
   * Format price value from endpoints by adding a decimal point
   * @param {number} val
   * @return {string} formatted price value
   */
  const convertPrice = function (val) {
    const price = val.toString();
    if (price === "0") return "$0.00";
    const position = price.length - 2;
    return `$${[price.slice(0, position), ".", price.slice(position)].join("")}`;
  };

  const displayCart = function (isEmpty) {
    $(".quick-cart")
      .addClass("active")
      .delay(200)
      .queue(() => $(".quick-cart").addClass("visible").dequeue());
    displayEmptyOrFooter(isEmpty);
  };

  const displayEmptyOrFooter = function (isEmpty) {
    if (isEmpty) {
      $(".quick_cart__empty").addClass("visible");
      $(".quick-cart__footer").removeClass("visible");
      document.getElementById("reminder-message").style.display = "none";
    } else {
      $(".quick_cart__empty").removeClass("visible");
      $(".quick-cart__footer").addClass("visible");
    }
  };

  var kitInCart;
  var productTypes = [];

  const updateCartItems = function (cartItems) {
    productTypes = [];

    const itemContainer = $("div[data-items-custom]");
    itemContainer.empty();
    cartItems.forEach((item, id) => {
      const itemData = {
        variantId: item.variant_id,
        url: item.url,
        image: item.image,
        title: item.product_title,
        linePrice: item.final_price,
        optionsWithValues: item.options_with_values,
        properties: item.properties,
        quantity: item.quantity,
        line: id + 1,
      };

      if (!productTypes.includes(item.product_type)) {
        productTypes.push(item.product_type);
      }

      if (item.variant_id === 39557608407202) {
        itemContainer.append(renderSaturdaySurchargeItem(itemData));
      } else {
        itemContainer.append(renderCartItem(itemData));
      }
    });

    kitInCart = productTypes.includes("Kits");

    var containerMediaQuery = window.matchMedia("(min-width: 60em)");
    var smallerContainerMediaQuery = window.matchMedia("(max-width: 59em");

    if (kitInCart) {
      document.getElementById("reminder-message").style.display = "none";

      if (containerMediaQuery.matches) {
        document.getElementById("quick-cart__items").style.maxHeight = "385px";
      }

      if (smallerContainerMediaQuery.matches) {
        document.getElementById("quick-cart__items").style.maxHeight = "450px";
      }
    } else {
      document.getElementById("reminder-message").style.display = "block";

      if (containerMediaQuery.matches) {
        document.getElementById("quick-cart__items").style.maxHeight = "230px";
      }

      if (smallerContainerMediaQuery.matches) {
        document.getElementById("quick-cart__items").style.maxHeight = "320px";
      }
    }
  };

  const updateSubtotal = (newSubtotal) => $("span[data-subtotal]").text(convertPrice(newSubtotal));

  /** Update item count in header cart element and animate the indicator */
  const updateHeaderCart = async function (newQuantity) {
    const cartIndicator = $("div[data-js-cart-indicator]");
    if (newQuantity === 0) {
      cartIndicator.removeClass("visible");
    } else {
      $("span[data-js-cart-count]").text(newQuantity);
    }
  };

  const renderSaturdaySurchargeItem = ({
    variantId,
    url,
    image,
    title,
    linePrice,
    optionsWithValues,
    properties,
    quantity,
  }) => `<div class="quick-cart__item ff-body fs-body-base" data-id="${variantId}">
    <div class="quick-cart__item-left">
      <a href="${url}">
        <div class="quick-cart__image"><img class="image__img ls-is-cached lazyloaded" data-src="${image}" src="${image}"></div>
      </a>
      <div class="quick-cart__control">
        <div class="quick-cart__qty ff-body fs-body-base ta-c" data-qty="" style="text-align: center; margin: 0 auto;">${quantity}</div>
      </div>
    </div>
    <div class="quick-cart__item-right">
      <h4><a href="${url}">${title}</a></h4>
      <div>
        ${convertPrice(linePrice)}
        ${quantity > 1 ? `<span class="c-subdued">x ${quantity}</span>` : ""}
      </div>
      ${renderOptionsWithValues(optionsWithValues)}
      ${renderProperties(properties)}
    </div>  
  </div>`;

  const renderCartItem = ({
    variantId,
    url,
    image,
    title,
    linePrice,
    optionsWithValues,
    properties,
    quantity,
    line,
  }) => `<div class="quick-cart__item ff-body fs-body-base" data-id="${variantId}">
      <div class="quick-cart__item-left">
        <a href="${url}">
          <div class="quick-cart__image"><img class="image__img ls-is-cached lazyloaded" data-src="${image}" src="${image}"></div>
        </a>
        <div class="quick-cart__control">
          <button class="quick-cart__button" onclick="decreaseQuantity(${variantId}, ${quantity})" href="#">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M0 0h24v24H0z" fill="none"></path>
              <path d="M19 13H5v-2h14v2z" fill="currentColor"></path>
            </svg>
          </button>
          <div class="quick-cart__qty ff-body fs-body-base ta-c" data-qty="">${quantity}</div>
          <button class="quick-cart__button" onclick="increaseQuantity(${variantId}, ${quantity})" href="#">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M0 0h24v24H0z" fill="none"></path>
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="currentColor"></path>
            </svg>
          </button>
        </div>
      </div>
      <div class="quick-cart__item-right">
        <h4><a href="${url}">${title}</a></h4>
        <div>
          ${convertPrice(linePrice)}
          ${quantity > 1 ? `<span class="c-subdued">x ${quantity}</span>` : ""}
        </div>
        ${renderOptionsWithValues(optionsWithValues)}
        ${renderProperties(properties)}
      </div>  
    </div>`;

  const renderOptionsWithValues = function (optionsWithValues) {
    let options = "";
    if (!optionsWithValues || optionsWithValues.length === 0) return options;
    optionsWithValues.forEach((obj) => {
      options += `<div>${obj["name"]}: ${obj["value"]}</div>`;
    });
    return options;
  };

  const renderProperties = function (properties) {
    let propertyInfo = "";
    if (!properties) return propertyInfo;
    const propertyArray = Object.entries(properties);
    if (propertyArray.length === 0) return propertyInfo;
    propertyArray
      .filter(([key]) => key[0] !== "_")
      .forEach(([key, value]) => {
        propertyInfo += `<div>${key}: ${value}</div>`;
      });
    return propertyInfo;
  };
})((window.quickCart = window.quickCart || {}));
