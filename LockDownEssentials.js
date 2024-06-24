const Order = require("./Order");

const OrderState = Object.freeze({
    WELCOMING: Symbol("welcoming"),
    ASK_ITEM: Symbol("ask_item"),
    PRODUCT: Symbol("product"),
    QUANTITY: Symbol("quantity"),
    UPSALE: Symbol("upsell"),
    ANOTHER_ITEM: Symbol("another_item"),
    CONFIRM: Symbol("confirm"),
    UPSELL_PRODUCT: Symbol("upsell_product"),
    UPSELL_QUANTITY: Symbol("upsell_quantity"),
    ANOTHER_UPSELL_ITEM: Symbol("another_upsell_item"),
    PAYMENT: Symbol("payment")
});

const products = [
    { type: "Oil", price: 30 },
    { type: "Oil filter", price: 10 },
    { type: "Wipers and tires", price: 115 },
    { type: "Light bulbs", price: 8 },
    { type: "Car cleaners", price: 12 },
    { type: "Floor Mats", price: 20 },
];

const upSellItems = [
    { type: "Sun Glasses", price: 25 },
    { type: "Phone Holders", price: 15 },
];

const TAX_RATE = 0.13;

module.exports = class LockDownEssentials extends Order {
    constructor(sNumber, sUrl) {
        super(sNumber, sUrl);
        this.stateCur = OrderState.WELCOMING;
        this.items = [];
        this.currentOrder = {};
        this.upSellAdded = [];
    }

    handleInput(sInput) {
        let aReturn = [];
        switch (this.stateCur) {
            case OrderState.WELCOMING:
                this.stateCur = OrderState.ASK_ITEM;
                aReturn.push("Welcome to Auto Part @Curbside.");
                aReturn.push("Would you like to buy our products like oil, oil filter? (YES or No)");
                aReturn.push("For full details open help link:");
                aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);
                break;

            case OrderState.ASK_ITEM:
                if (sInput.toLowerCase() === "yes") {
                    this.stateCur = OrderState.PRODUCT;
                    aReturn.push("Which product would you like to buy?");
                    aReturn.push("For full details open help link:");
                    aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);
                    aReturn.push("Please enter the number assigned for the item");
                } else if (sInput.toLowerCase() === "no") {
                    aReturn.push("Confirm order with yes ");
                    this.stateCur = OrderState.CONFIRM;
                } else {
                    aReturn.push("Invalid input. Please enter yes or no");
                }
                break;

            case OrderState.PRODUCT:
                const nProductIndex = parseInt(sInput) - 1;
                if (!isNaN(nProductIndex) && nProductIndex >= 0 && nProductIndex < products.length) {
                    this.currentOrder.type = products[nProductIndex].type;
                    this.currentOrder.price = products[nProductIndex].price;
                    this.stateCur = OrderState.QUANTITY;
                    aReturn.push(`You have selected ${this.currentOrder.type}. How many would you like to add?`);
                } else {
                    aReturn.push("Invalid input. Please enter the number assigned for the item");
                }
                break;

            case OrderState.QUANTITY:
                const quantity = parseInt(sInput);
                if (!isNaN(quantity) && quantity > 0) {
                    this.currentOrder.quantity = quantity;
                    this.items.push(this.currentOrder);
                    this.currentOrder = {};
                    this.stateCur = OrderState.ANOTHER_ITEM;
                    aReturn.push("Would you like to add another item? (Yes or No)");
                } else {
                    aReturn.push("Invalid input. Please enter a valid quantity");
                }
                break;

            case OrderState.ANOTHER_ITEM:
                if (sInput.toLowerCase() === "yes") {
                    this.stateCur = OrderState.PRODUCT;
                    aReturn.push("Which product would you like to buy?");
                    aReturn.push("For full details open help link:");
                    aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);
                    aReturn.push("Please enter the number corresponding to the item you want.");
                } else if (sInput.toLowerCase() === "no") {
                    this.stateCur = OrderState.UPSELL;
                    aReturn.push("Would you like to add any up sell items? (Yes or No)");
                } else {
                    aReturn.push("Invalid input. Please enter Yes or No");
                }
                break;

            case OrderState.UPSELL:
                if (sInput.toLowerCase() === "yes") {
                    this.stateCur = OrderState.UPSELL_PRODUCT;
                    aReturn.push("Which up sell product would you like to buy?");
                    aReturn.push("For full details open help link:");
                    aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);
                    aReturn.push("Please enter the number corresponding to the up-sell item you want.");
                } else {
                    aReturn.push("Confirm order with yes ");
                    this.stateCur = OrderState.CONFIRM;
                }
                break;

            case OrderState.UPSELL_PRODUCT:
                const upSellIndex = parseInt(sInput) - 1;
                if (!isNaN(upSellIndex) && upSellIndex >= 0 && upSellIndex < upSellItems.length) {
                    this.currentOrder.type = upSellItems[upSellIndex].type;
                    this.currentOrder.price = upSellItems[upSellIndex].price;
                    this.stateCur = OrderState.UPSELL_QUANTITY;
                    aReturn.push(`You have selected ${this.currentOrder.type}. How many would you like to add?`);
                } else {
                    aReturn.push("Invalid input. Please enter the number assigned for the item");
                }
                break;

            case OrderState.UPSELL_QUANTITY:
                const upSellQuantity = parseInt(sInput);
                if (!isNaN(upSellQuantity) && upSellQuantity > 0) {
                    this.currentOrder.quantity = upSellQuantity;
                    this.upSellAdded.push(this.currentOrder);
                    this.currentOrder = {};
                    this.stateCur = OrderState.ANOTHER_UPSELL_ITEM;
                    aReturn.push("Would you like to add another up sell item? (Yes or No)");
                } else {
                    aReturn.push("Invalid input. Please enter a valid quantity");
                }
                break;

            case OrderState.ANOTHER_UPSELL_ITEM:
                if (sInput.toLowerCase() === "yes") {
                    this.stateCur = OrderState.UPSELL_PRODUCT;
                    aReturn.push("Which up sell product would you like to buy?");
                    aReturn.push("For full details open help link:");
                     aReturn.push(`${this.sUrl}/payment/${this.sNumber}/`);
                    aReturn.push("Please enter the number of corresponding to the up-sell item you want.");
                } else if (sInput.toLowerCase() === "no") {
                    aReturn.push("Confirm order with yes ");
                    this.stateCur = OrderState.CONFIRM;
                } else {
                    aReturn.push("Invalid input. Please enter Yes or No");
                }
                break;

            case OrderState.CONFIRM:
                this.stateCur = OrderState.PAYMENT;
                let totalProductPrice = this.items.reduce((sum, order) => sum + order.price * order.quantity, 0);
                let totalUpSellPrice = this.upSellAdded.reduce((sum, order) => sum + order.price * order.quantity, 0);
                let totalOrderPrice = totalProductPrice + totalUpSellPrice;
                let taxAmount = totalOrderPrice * TAX_RATE;
                let totalPriceWithTax = totalOrderPrice + taxAmount;
                this.sProduct = this.items.map(order => `${order.quantity} ${order.type}`).join(', ');
                if (this.upSellAdded.length > 0) {
                    this.sProduct += `, ${this.upSellAdded.map(order => `${order.quantity} ${order.type}`).join(', ')}`;
                }
                this.nOrder = totalPriceWithTax.toFixed(2);
                aReturn.push("Thank you for your order:");
                this.items.forEach(product => {
                    aReturn.push(`${product.quantity} ${product.type} - $${product.price * product.quantity}`);
                });
                this.upSellAdded.forEach(product => {
                    aReturn.push(`${product.quantity} ${product.type} - $${product.price * product.quantity}`);
                });
                aReturn.push(`Total: $${totalPriceWithTax.toFixed(2)}`);
                aReturn.push(`We will text you from 519-222-2222 when your order is ready or if we have questions.`);
                this.isDone(true);
                break;
        }
        return aReturn;
    
    }


    renderForm(){
      // your client id should be kept private
      return(`
      <html>

<head>
    <meta content="text/html; charset=UTF-8" http-equiv="content-type">
    <style type="text/css">
        ol {
            margin: 0;
            padding: 0
        }

        table td,
        table th {
            padding: 0
        }

        .c7 {
            color: #000000;
            font-weight: 700;
            text-decoration: none;
            vertical-align: baseline;
            font-size: 11pt;
            font-family: "Arial";
            font-style: normal
        }

        .c0 {
            color: #000000;
            font-weight: 400;
            text-decoration: none;
            vertical-align: baseline;
            font-size: 11pt;
            font-family: "Arial";
            font-style: normal
        }

        .c6 {
            color: #000000;
            font-weight: 700;
            text-decoration: none;
            vertical-align: baseline;
            font-size: 18pt;
            font-family: "Arial";
            font-style: normal
        }

        .c2 {
            color: #000000;
            font-weight: 700;
            text-decoration: none;
            vertical-align: baseline;
            font-size: 13pt;
            font-family: "Arial";
            font-style: normal
        }

        .c5 {
            padding-top: 0pt;
            padding-bottom: 0pt;
            line-height: 1.15;
            orphans: 2;
            widows: 2;
            text-align: center
        }

        .c1 {
            padding-top: 0pt;
            padding-bottom: 0pt;
            line-height: 1.15;
            orphans: 2;
            widows: 2;
            text-align: left
        }

        .c4 {
            background-color: #ffffff;
            max-width: 451.4pt;
            padding: 72pt 72pt 72pt 72pt
        }

        .c3 {
            height: 11pt
        }

        .title {
            padding-top: 0pt;
            color: #000000;
            font-size: 26pt;
            padding-bottom: 3pt;
            font-family: "Arial";
            line-height: 1.15;
            page-break-after: avoid;
            orphans: 2;
            widows: 2;
            text-align: left
        }

        .subtitle {
            padding-top: 0pt;
            color: #666666;
            font-size: 15pt;
            padding-bottom: 16pt;
            font-family: "Arial";
            line-height: 1.15;
            page-break-after: avoid;
            orphans: 2;
            widows: 2;
            text-align: left
        }

        li {
            color: #000000;
            font-size: 11pt;
            font-family: "Arial"
        }

        p {
            margin: 0;
            color: #000000;
            font-size: 11pt;
            font-family: "Arial"
        }

        h1 {
            padding-top: 20pt;
            color: #000000;
            font-size: 20pt;
            padding-bottom: 6pt;
            font-family: "Arial";
            line-height: 1.15;
            page-break-after: avoid;
            orphans: 2;
            widows: 2;
            text-align: left
        }

        h2 {
            padding-top: 18pt;
            color: #000000;
            font-size: 16pt;
            padding-bottom: 6pt;
            font-family: "Arial";
            line-height: 1.15;
            page-break-after: avoid;
            orphans: 2;
            widows: 2;
            text-align: left
        }

        h3 {
            padding-top: 16pt;
            color: #434343;
            font-size: 14pt;
            padding-bottom: 4pt;
            font-family: "Arial";
            line-height: 1.15;
            page-break-after: avoid;
            orphans: 2;
            widows: 2;
            text-align: left
        }

        h4 {
            padding-top: 14pt;
            color: #666666;
            font-size: 12pt;
            padding-bottom: 4pt;
            font-family: "Arial";
            line-height: 1.15;
            page-break-after: avoid;
            orphans: 2;
            widows: 2;
            text-align: left
        }

        h5 {
            padding-top: 12pt;
            color: #666666;
            font-size: 11pt;
            padding-bottom: 4pt;
            font-family: "Arial";
            line-height: 1.15;
            page-break-after: avoid;
            orphans: 2;
            widows: 2;
            text-align: left
        }

        h6 {
            padding-top: 12pt;
            color: #666666;
            font-size: 11pt;
            padding-bottom: 4pt;
            font-family: "Arial";
            line-height: 1.15;
            page-break-after: avoid;
            font-style: italic;
            orphans: 2;
            widows: 2;
            text-align: left
        }
    </style>
</head>

<body class="c4 doc-content">
    <p class="c5"><span class="c6">Auto Part @Curbside</span></p>
    <p class="c5 c3"><span class="c7"></span></p>
    <p class="c1"><span class="c2">Order your car parts via SMS!</span></p>
    <p class="c1 c3"><span class="c2"></span></p>
    <p class="c1"><span class="c0">Here&#39;s a list of available items:</span></p>
    <p class="c1"><span class="c0">Car Parts:</span></p>
    <p class="c1"><span class="c0">1. Oil-$30</span></p>
    <p class="c1"><span class="c0">2.Oil Filter-$10</span></p>
    <p class="c1"><span class="c0">3.Wiper and tires-$15</span></p>
    <p class="c1"><span class="c0">4. Light-bulbs-$8</span></p>
    <p class="c1"><span class="c0">5.Car Cleaners-$12</span></p>
    <p class="c1"><span class="c0">6. Floor Mats-$20</span></p>
    <p class="c1 c3"><span class="c0"></span></p>
    <p class="c1"><span class="c0">Up-sell Items:</span></p>
    <p class="c1"><span class="c0">1.Sun Glasses-$25</span></p>
    <p class="c1"><span class="c0">2.Phone Holders-$15</span></p>
    <p class="c1"><span class="c0">Text your order to: 123-456-7890</span></p>
    <p class="c1"><span class="c0">We will notify you when your order is ready for curbside pickup.</span></p>
    <p class="c1 c3"><span class="c0"></span></p>
</body>

</html>
       `);
  
    }
}
