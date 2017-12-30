"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = bootstrap;

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _stock = require("./stock");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function bootstrap() {
  try {
    const dataS = _fs2.default.readFileSync("_state_.json").toString();
    const data = JSON.parse(dataS);
    console.log("restoring last state from _state_.json file...");
    (0, _stock._set_state_)(data);
    return;
  } catch (ex) {
    // noop
  }

  console.log("bootstrapping with bristol stock exchange example...");

  const st = (0, _stock._get_state_)();

  // example from https://github.com/davecliff/BristolStockExchange/blob/master/BSEguide1.2e.pdf pages 4-5

  const sXYZ = "XYZ";
  st.stocks[sXYZ] = { bids: [], asks: [] };

  // create traders with initial money of 1000
  const t11 = (0, _stock.registerTrader)("t11", "t11", 1000);
  const t02 = (0, _stock.registerTrader)("t02", "t02", 1000);
  const t08 = (0, _stock.registerTrader)("t08", "t08", 1000);
  const t01 = (0, _stock.registerTrader)("t01", "t01", 1000);
  const t03 = (0, _stock.registerTrader)("t03", "t03", 1000);

  // grant 5 stocks to all traders
  const traders = "t11 t02 t08 t01 t03".split(" ");
  traders.forEach(traderName => {
    const tr = st.traders[traderName];
    tr.owns[sXYZ] = 5;
  });

  // place bids and asks...
  (0, _stock.placeBid)(t11, sXYZ, 22, 1);
  (0, _stock.placeBid)(t02, sXYZ, 27, 1);
  (0, _stock.placeAsk)(t08, sXYZ, 77, 1);
  (0, _stock.placeBid)(t01, sXYZ, 27, 1);
  (0, _stock.placeAsk)(t03, sXYZ, 62, 1);
  (0, _stock.placeBid)(t11, sXYZ, 30, 1); // replaces old bid
  (0, _stock.placeBid)(t02, sXYZ, 67, 1); // replaces old bid and should trigger transaction on next step()

  // apply rules...
  //step();

  //const o = getStockLOB(sXYZ); console.log(o);

  //console.log(JSON.stringify(st, null, 2));
}