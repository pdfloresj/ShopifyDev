 // Remove Shipping Method Section from Customer Information
 var h3Tags = document.getElementsByTagName("h3");
 var searchText = "Shipping method";
   var found;

   console.log('entra checkout');
 
 for (var i = 0; i < h3Tags.length; i++) {
   if (h3Tags[i].textContent == searchText) {
     found = h3Tags[i];
     found.style.display = 'none';
     found.nextElementSibling.style.display = 'none';
     break;
   }
 }

 // Surcharge Fee
 const surchargeSummary = `
   <tr>
     <th class="total-line__name" scope="row">
       <a href="https://fiftyflowers.com/pages/shippingdetails" target="_blank">{{ 'checkout.surcharge_label' | t }}</a>
     </th>
     <td class="total-line__price">
       <span class="order-summary__emphasis skeleton-while-loading" data-checkout-surcharge-price-target=""></span>
     </td>
   </tr>  
 `;

 var waitForEl = function(selector, callback) {
   if (selector.length) {
     callback();
   } else {
     setTimeout(function() {
       waitForEl(selector, callback);
     }, 100);
   }
 };

 // check if on payment step and render surcharge box
 // insert surcharge details box
 const section = document.getElementsByClassName("section");
 console.log('LA SECCION',section);
 waitForEl(section, function() {
   // calculate surcharge fee
   const lineItems = document.getElementsByClassName("product");
 console.log('LA PRODUCTO',lineItems);
   let totalItemsQuantity = 0;
   let surchargeFeeQuantity = 0;
   let surchargeLineItem;
   for(let i = 0; i < lineItems.length; i++) {
     if(lineItems[i].getAttribute("data-variant-id") !== "40513543667918" && lineItems[i].getAttribute("data-variant-id") !== "40513545797838"){
       const lineItemQuantity = parseInt(lineItems[i].querySelector("td[class='product__quantity'] span").textContent.trim());
       totalItemsQuantity = totalItemsQuantity + lineItemQuantity;
     }else if (lineItems[i].getAttribute("data-variant-id") === "40513543667918") {
       surchargeFeeQuantity = parseInt(lineItems[i].querySelector("td[class='product__quantity'] span").textContent.trim());
       surchargeLineItem = lineItems[i];
     }
   }
   // remove surcharge item from item list
   if(surchargeLineItem) {
     surchargeLineItem.parentNode.removeChild(surchargeLineItem);
   }

   // update shipping with saturday surcharge
   const shippingSpan = document.querySelector("span[data-checkout-total-shipping-target]");
   let saturdaySurcharge = 0;
   if (Shopify.Checkout.step !== "contact_information") {
     for(let i = 0; i < lineItems.length; i++) {
       if (lineItems[i].getAttribute("data-variant-id") === "40513545797838") {
         let lineItemPrice = lineItems[i].querySelector("td[class='product__price'] > span").textContent.trim();
         lineItemPrice = parseInt(lineItemPrice.replace("$", 0));
         saturdaySurcharge += lineItemPrice;
       }
     }

     setTimeout(() => {
       if (saturdaySurcharge > 0) {
         shippingSpan.innerText = "$" + parseFloat(saturdaySurcharge).toFixed(2);
         shippingSpan.setAttribute("data-checkout-total-shipping-target", saturdaySurcharge);
       }
     }, 500);
   }

   // insert summary line
   const subtotalLine = document.querySelector("tr[class='total-line total-line--subtotal']");
   console.log('SUBTOTAL LINE'+subtotalLine)
   let tr = document.createElement('tr');
   tr.innerHTML = surchargeSummary;
   tr.setAttribute("class", "total-line total-line--surcharge");
   insertAfter(subtotalLine, tr);

   let surchargePriceSpan = document.querySelector("span[data-checkout-surcharge-price-target]");
   const surchargeFee = 15 * totalItemsQuantity;
   surchargePriceSpan.innerText = "$" + parseFloat(surchargeFee).toFixed(2);
   console.log('Surcharge All products'+surchargeFee);
   // update subtotal
   setTimeout(() => {
     const subtotalSpan = subtotalLine.querySelector("span[data-checkout-subtotal-price-target]");
     const subtotalPrice = parseFloat(subtotalSpan.textContent.trim().replace("$", "").replace(",", ""));
     const updatedSubtotal = parseFloat(subtotalPrice - surchargeFee - saturdaySurcharge).toFixed(2);
     subtotalSpan.innerText = "$" + updatedSubtotal;
     subtotalSpan.setAttribute("data-checkout-subtotal-price-target", updatedSubtotal.toString().replace("$", "").replace(".", "")) 
   }, 500)


   // check if correct surcharge fee is already added
   if(surchargeFeeQuantity !== totalItemsQuantity) {
     // add surcharge item to cart
     const itemVariantId = 40513543667918;

     let formData = {
       'updates': {
         [itemVariantId]: totalItemsQuantity
       }
     };
     console.log('FormData',formData)
     fetch('/cart/update.js', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json'
       },
       body: JSON.stringify(formData)
     })
     .then(response => {
       location.reload();
     })
     .catch((error) => {
       console.error('Error:', error);
     });
   }
 });

 function insertAfter(referenceNode, newNode) {
   referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
 }
 