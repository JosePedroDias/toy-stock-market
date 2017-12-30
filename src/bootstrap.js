// @flow

import fs from "fs";

import {
  registerTrader,
  loginTrader,
  logoutTrader,
  placeBid,
  placeAsk,
  getStockNames,
  _now,
  _get_state_,
  _set_state_,
  getStockLOB,
  getTraderStatus,
  step
} from "./stock";

import type { Trader } from "./stock";

export default function bootstrap() {
  try {
    const dataS: string = fs.readFileSync("_state_.json").toString();
    const data: any = JSON.parse(dataS);
    console.log("restoring last state from _state_.json file...");
    _set_state_(data);
    return;
  } catch (ex) {
    // noop
  }

  console.log("bootstrapping with bristol stock exchange example...");

  const st = _get_state_();

  // example from https://github.com/davecliff/BristolStockExchange/blob/master/BSEguide1.2e.pdf pages 4-5

  const sXYZ = "XYZ";
  st.stocks[sXYZ] = { bids: [], asks: [] };

  // create traders with initial money of 1000
  const t11 = registerTrader("t11", "t11", 1000);
  const t02 = registerTrader("t02", "t02", 1000);
  const t08 = registerTrader("t08", "t08", 1000);
  const t01 = registerTrader("t01", "t01", 1000);
  const t03 = registerTrader("t03", "t03", 1000);

  // grant 5 stocks to all traders
  const traders = "t11 t02 t08 t01 t03".split(" ");
  traders.forEach((traderName: string) => {
    const tr: Trader = st.traders[traderName];
    tr.owns[sXYZ] = 5;
  });

  // place bids and asks...
  placeBid(t11, sXYZ, 22, 1);
  placeBid(t02, sXYZ, 27, 1);
  placeAsk(t08, sXYZ, 77, 1);
  placeBid(t01, sXYZ, 27, 1);
  placeAsk(t03, sXYZ, 62, 1);
  placeBid(t11, sXYZ, 30, 1); // replaces old bid
  placeBid(t02, sXYZ, 67, 1); // replaces old bid and should trigger transaction on next step()

  // apply rules...
  //step();

  //const o = getStockLOB(sXYZ); console.log(o);

  //console.log(JSON.stringify(st, null, 2));
}
