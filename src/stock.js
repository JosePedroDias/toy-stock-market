// @flow

import EventEmitter from "events";

const TOKEN_DURATION = 24 * 60 * 60 * 1000; // 24h

export const BID = "bid";
export const ASK = "ask";

export type ActionName = "bid" | "ask";

export type SETransaction = {
  from: string,
  to: string,
  price: number,
  quantity: number,
  stock: string,
  when: number
};

const TRANSACTIONS: Array<SETransaction> = [];

export type BidAskDataLOB = {
  price: number,
  quantity: number
};

export type StockLOB = {
  bids: Array<BidAskDataLOB>,
  asks: Array<BidAskDataLOB>
};

export type BidAskData = {
  price: number,
  quantity: number,
  trader: string,
  when: number
};

export type Stock = {
  bids: Array<BidAskData>,
  asks: Array<BidAskData>
};

export type StocksHash = { [string]: Stock };
const STOCKS: StocksHash = {};

type HashOfNumber = { [string]: number };

export type Trader = {
  money: number,
  password: string,
  owns: HashOfNumber // stockName -> quantity
};

export type TraderWoPass = {
  money: number,
  owns: HashOfNumber // stockName -> quantity
};

export type TradersHash = { [string]: Trader };
const TRADERS: TradersHash = {};

export type TokenData = {
  trader: string,
  until: number
};

const VALID_TOKENS: { [string]: TokenData } = {};

export function _now(): number {
  return new Date().valueOf();
}

function _randomString(length: number): string {
  return (~~(Math.random() * Math.pow(32, length))).toString(32);
}

function _generateToken(traderName: string, tokenDuration: number): string {
  const data: TokenData = {
    trader: traderName,
    until: _now() + tokenDuration
  };
  let token = _randomString(8);
  while (token in VALID_TOKENS) {
    token = _randomString(8);
  }
  VALID_TOKENS[token] = data;
  return token;
}

export const transactionsEmitter = new EventEmitter();

export function getTraderNameFromToken(token: string): string {
  const data: ?TokenData = VALID_TOKENS[token];
  if (!data) {
    throw new Error("token is not valid");
  }
  const t = _now();
  if (t > data.until) {
    throw new Error("token has expired");
  }
  return data.trader;
}

function _updateTokens() {
  const t = _now();
  const tokens = Object.keys(VALID_TOKENS);
  tokens.forEach((token: string) => {
    const data: TokenData = VALID_TOKENS[token];
    if (t > data.until) {
      delete VALID_TOKENS[token];
    }
  });
}

export function registerTrader(
  name: string,
  password: string,
  money: number
): string {
  if (name in TRADERS) {
    throw new Error("trader already exists");
  }
  if (!isFinite(money) || money < 0) {
    throw new Error("money must be a positive number");
  }
  const trader: Trader = {
    money: money,
    password: password,
    owns: {}
  };
  TRADERS[name] = trader;
  const token = _generateToken(name, TOKEN_DURATION);
  return token;
}

export function loginTrader(name: string, password: string): string {
  const trader: ?Trader = TRADERS[name];
  if (!trader || trader.password !== password) {
    throw new Error("trader failed logging in");
  }
  const token = _generateToken(name, TOKEN_DURATION);
  return token;
}

export function logoutTrader(token: string) {
  delete VALID_TOKENS[token];
}

export function getTraderStatus(token: string): TraderWoPass {
  const traderName: string = getTraderNameFromToken(token);
  const trader: ?Trader = TRADERS[traderName];
  if (!trader) {
    throw new Error("trader does not exist");
  }
  return {
    money: trader.money,
    owns: trader.owns
  };
}

function _getPrice(o: BidAskData) {
  return o.price;
}

function _sigma(n: number) {
  return n < 0 ? -1 : n > 0 ? 1 : 0;
}

function _sortPriceAscending(a: BidAskData, b: BidAskData): number {
  return _sigma(_getPrice(a) - _getPrice(b));
}

function _sortPriceDescending(a: BidAskData, b: BidAskData): number {
  return _sigma(_getPrice(b) - _getPrice(a));
}

function sortByPrice(arr: Array<BidAskData>, isDescending: boolean): void {
  arr.sort(isDescending ? _sortPriceDescending : _sortPriceAscending);
}

/*
 for simplicity let's assume a trader with the same name as a stock
 can issue stock of its company...
*/

function _place(
  token: string,
  stockName: string,
  price: number,
  quantity: number,
  kind: ActionName
): void {
  const traderName: string = getTraderNameFromToken(token);
  const trader: ?Trader = TRADERS[traderName];
  if (!trader) {
    throw new Error("trader does not exist");
  }
  const stock: ?Stock = STOCKS[stockName];
  if (!stock) {
    throw new Error("stock does not exist");
  }
  if (!isFinite(price) || price < 0) {
    throw new Error("price must be a positive number");
  }
  if (!isFinite(quantity) || quantity < 0 || quantity % 0 === 0) {
    throw new Error("quantity must be a positive or 0 integer number"); // zero removes any previous bid/ask
  }
  const intent: BidAskData = {
    trader: traderName,
    price: price,
    quantity: quantity,
    when: _now()
  };

  if (intent.quantity > 0) {
    if (
      (kind === ASK && !trader.owns[stockName]) ||
      trader.owns[stockName] < intent.quantity
    ) {
      throw new Error("trader does not have enough stock quantity");
    }
    if (kind === BID && trader.money < price * quantity) {
      throw new Error("trader does not have enough money");
    }
  }

  // remove previous intent from the same trader to this stock (if one exists)
  const dataArr: Array<BidAskData> = kind === BID ? stock.bids : stock.asks;
  const idx: number = dataArr.findIndex((bad: BidAskData) => {
    return bad.trader === traderName;
  });
  if (idx !== -1) {
    dataArr.splice(idx, 1);
  }

  if (intent.quantity > 0) {
    dataArr.push(intent);
    sortByPrice(dataArr, kind === BID);
  }
}

export function placeBid(
  token: string,
  stockName: string,
  price: number,
  quantity: number
) {
  _place(token, stockName, price, quantity, BID);
}

export function placeAsk(
  token: string,
  stockName: string,
  price: number,
  quantity: number
) {
  _place(token, stockName, price, quantity, ASK);
}

function _simplifyData(arr: Array<BidAskData>): Array<BidAskDataLOB> {
  const arr2: Array<BidAskDataLOB> = arr.map((bad: BidAskData) => {
    return { price: bad.price, quantity: bad.quantity };
  });
  let prevRow: BidAskDataLOB = { price: 0, quantity: 0 };
  const arr3: Array<BidAskDataLOB> = [];
  arr2.forEach((row: BidAskDataLOB) => {
    if (row.price !== prevRow.price) {
      prevRow = row;
      arr3.push(row);
    } else {
      prevRow.quantity += row.quantity;
    }
  });
  return arr3;
}

export function getStockLOB(stockName: string): StockLOB {
  const stock: ?Stock = STOCKS[stockName];
  if (!stock) {
    throw new Error("stock does not exist");
  }
  return {
    bids: _simplifyData(stock.bids),
    asks: _simplifyData(stock.asks)
  };
}

export function getStockNames(): Array<string> {
  return Object.keys(STOCKS);
}

type StockMarketState = {
  stocks: StocksHash,
  traders: TradersHash,
  transactions: Array<SETransaction>
};

function _emptyArray(arr: Array<any>) {
  arr.splice(0, arr.length);
}

function _emptyObject(o: { [string]: any }) {
  for (let k: string in o) {
    if (o.hasOwnProperty(k)) {
      delete o[k];
    }
  }
}

function _clean_state_() {
  _emptyObject(STOCKS);
  _emptyObject(TRADERS);
  _emptyArray(TRANSACTIONS);
}

export function _get_state_(): StockMarketState {
  return {
    stocks: STOCKS,
    traders: TRADERS,
    transactions: TRANSACTIONS
  };
}

export function _set_state_(st: StockMarketState) {
  Object.assign(STOCKS, st.stocks);
  Object.assign(TRADERS, st.traders);
  st.transactions.forEach(tr => {
    TRANSACTIONS.push(tr);
  });
}

function _updateOwns(owns: HashOfNumber, stockName, quantity) {
  if (stockName in owns) {
    owns[stockName] += quantity;
  } else {
    owns[stockName] = quantity;
  }
}

export function getTransactions(): Array<SETransaction> {
  return TRANSACTIONS;
}

export function getStats() {
  return {
    traders: Object.keys(TRADERS).length,
    tokens: Object.keys(VALID_TOKENS).length,
    stocks: Object.keys(STOCKS).length,
    queued: Object.keys(STOCKS).reduce((prev, curr) => {
      const st = STOCKS[curr];
      return st.bids.length + st.asks.length;
    }, 0)
  };
}

export function step(): void {
  getStockNames().forEach((stockName: string) => {
    const stock = STOCKS[stockName];
    let retry;

    //console.log(stock);

    do {
      retry = false;

      if (stock.bids.length === 0 || stock.asks.length === 0) {
        break;
      }

      const highestBid = stock.bids[0];
      const lowestAsk = stock.asks[0];

      // at this time this is just a potential transaction
      const trans: SETransaction = {
        from: lowestAsk.trader,
        to: highestBid.trader,
        quantity: Math.min(lowestAsk.quantity, highestBid.quantity),
        price: lowestAsk.price,
        stock: stockName,
        when: _now()
      };

      let isValid = true;
      const traderFrom: Trader = TRADERS[trans.from];
      const traderTo: Trader = TRADERS[trans.to];
      const transFromOwnedQuantity: number = traderFrom.owns[stockName] || 0;
      const transactionMoney: number = trans.price * trans.quantity;

      if (true) {
        // these should not be necessary to enforce as they're enforced on placement of bids and asks
        if (transFromOwnedQuantity < trans.quantity) {
          isValid = false;
          // console.log("seller does not have enough stock");
        } else if (traderTo.money < transactionMoney) {
          isValid = false;
          // console.log("buyer does not have enough money");
        }
      }

      if (isValid && highestBid.price >= lowestAsk.price) {
        retry = true;

        TRANSACTIONS.push(trans);

        if (highestBid.quantity === trans.quantity) {
          stock.bids.splice(0, 1);
        } else {
          highestBid.quantity -= trans.quantity;
        }

        if (lowestAsk.quantity === trans.quantity) {
          stock.asks.splice(0, 1);
        } else {
          lowestAsk.quantity -= trans.quantity;
        }

        traderFrom.money += transactionMoney;
        traderTo.money -= transactionMoney;
        _updateOwns(traderFrom.owns, stockName, -trans.quantity);
        _updateOwns(traderTo.owns, stockName, trans.quantity);

        transactionsEmitter.emit("transaction", trans);

        //console.log(trans);
        //console.log(traderFrom);
        //console.log(traderTo);
      }
    } while (retry);
  });
}
