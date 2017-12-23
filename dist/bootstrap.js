"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = bootstrap;

var _stock = require("./stock");

function bootstrap() {
  const st = (0, _stock._get_state_)();

  const sXYZ = "XYZ";

  st.stocks[sXYZ] = { bids: [], asks: [] };

  /*
  So, for example, if there are
  two traders each seeking to buy 30 shares in company XYZ for no more than $1.50 per share,
  and one trader hoping to buy 10 for a price of $1.52;
  and at the same time if there was
  one trader offering a 20 shares at $1.55 and
  another trader offering 50 shares at $1.62
  
  the LOB for XYZ would look something like the one illustrated in Figure 1.1, and traders would speak of XYZ being priced at “152-55”.
  */

  /*
  st.stocks["XYZ"] = {
    bids: [
      {
        price: 1.52,
        quantity: 10,
        trader: "z",
        when: _now()
      },
      {
        price: 1.5,
        quantity: 30,
        trader: "a",
        when: _now()
      },
      {
        price: 1.5,
        quantity: 30,
        trader: "b",
        when: _now()
      }
    ],
    asks: [
      {
        price: 1.55,
        quantity: 20,
        trader: "c",
        when: _now()
      },
      {
        price: 1.62,
        quantity: 50,
        trader: "d",
        when: _now()
      }
    ]
  };*/

  // const o = getStockLOB(sXYZ); console.log(o);

  /*const toniToken = registerTrader("toni", "toni", 1000);
  const o = getTraderStatus(toniToken);
  console.log(o);*/

  // const albertoToken = registerTrader("alberto", "alberto", 1000);

  const t11 = (0, _stock.registerTrader)("t11", "t11", 1000);
  const t02 = (0, _stock.registerTrader)("t02", "t02", 1000);
  const t08 = (0, _stock.registerTrader)("t08", "t08", 1000);
  const t01 = (0, _stock.registerTrader)("t01", "t01", 1000);
  const t03 = (0, _stock.registerTrader)("t03", "t03", 1000);

  (0, _stock.placeBid)(t11, sXYZ, 22, 1);
  (0, _stock.placeBid)(t02, sXYZ, 27, 1);
  (0, _stock.placeAsk)(t08, sXYZ, 77, 1);
  (0, _stock.placeBid)(t01, sXYZ, 27, 1);
  (0, _stock.placeAsk)(t03, sXYZ, 62, 1);
  (0, _stock.placeBid)(t11, sXYZ, 30, 1); // replaces old bid

  (0, _stock.placeBid)(t02, sXYZ, 67, 1); // replaces old bid and should trigger transaction

  const o = (0, _stock.getStockLOB)(sXYZ);
  //console.log(o);
}