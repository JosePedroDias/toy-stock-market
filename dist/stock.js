"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transactionsEmitter = exports.ASK = exports.BID = undefined;
exports._now = _now;
exports.getTraderNameFromToken = getTraderNameFromToken;
exports.registerTrader = registerTrader;
exports.loginTrader = loginTrader;
exports.logoutTrader = logoutTrader;
exports.getTraderStatus = getTraderStatus;
exports.placeBid = placeBid;
exports.placeAsk = placeAsk;
exports.getStockLOB = getStockLOB;
exports.getStockNames = getStockNames;
exports._get_state_ = _get_state_;
exports._set_state_ = _set_state_;
exports.getTransactions = getTransactions;
exports.getStats = getStats;
exports.step = step;

var _events = require("events");

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const TOKEN_DURATION = 24 * 60 * 60 * 1000; // 24h

const BID = exports.BID = "bid";
const ASK = exports.ASK = "ask";

const TRANSACTIONS = [];

const STOCKS = {};

const TRADERS = {};

const VALID_TOKENS = {};

function _now() {
  return new Date().valueOf();
}

function _randomString(length) {
  return (~~(Math.random() * Math.pow(32, length))).toString(32);
}

function _generateToken(traderName, tokenDuration) {
  const data = {
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

const transactionsEmitter = exports.transactionsEmitter = new _events2.default();

function getTraderNameFromToken(token) {
  const data = VALID_TOKENS[token];
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
  tokens.forEach(token => {
    const data = VALID_TOKENS[token];
    if (t > data.until) {
      delete VALID_TOKENS[token];
    }
  });
}

function registerTrader(name, password, money) {
  if (name in TRADERS) {
    throw new Error("trader already exists");
  }
  if (!isFinite(money) || money < 0) {
    throw new Error("money must be a positive number");
  }
  const trader = {
    money: money,
    password: password,
    owns: {}
  };
  TRADERS[name] = trader;
  const token = _generateToken(name, TOKEN_DURATION);
  return token;
}

function loginTrader(name, password) {
  const trader = TRADERS[name];
  if (!trader || trader.password !== password) {
    throw new Error("trader failed logging in");
  }
  const token = _generateToken(name, TOKEN_DURATION);
  return token;
}

function logoutTrader(token) {
  delete VALID_TOKENS[token];
}

function getTraderStatus(token) {
  const traderName = getTraderNameFromToken(token);
  const trader = TRADERS[traderName];
  if (!trader) {
    throw new Error("trader does not exist");
  }
  return {
    money: trader.money,
    owns: trader.owns
  };
}

function _getPrice(o) {
  return o.price;
}

function _sigma(n) {
  return n < 0 ? -1 : n > 0 ? 1 : 0;
}

function _sortPriceAscending(a, b) {
  return _sigma(_getPrice(a) - _getPrice(b));
}

function _sortPriceDescending(a, b) {
  return _sigma(_getPrice(b) - _getPrice(a));
}

function sortByPrice(arr, isDescending) {
  arr.sort(isDescending ? _sortPriceDescending : _sortPriceAscending);
}

/*
 for simplicity let's assume a trader with the same name as a stock
 can issue stock of its company...
*/

function _place(token, stockName, price, quantity, kind) {
  const traderName = getTraderNameFromToken(token);
  const trader = TRADERS[traderName];
  if (!trader) {
    throw new Error("trader does not exist");
  }
  const stock = STOCKS[stockName];
  if (!stock) {
    throw new Error("stock does not exist");
  }
  if (!isFinite(price) || price < 0) {
    throw new Error("price must be a positive number");
  }
  if (!isFinite(quantity) || quantity < 0 || quantity % 0 === 0) {
    throw new Error("quantity must be a positive or 0 integer number"); // zero removes any previous bid/ask
  }
  const intent = {
    trader: traderName,
    price: price,
    quantity: quantity,
    when: _now()
  };

  if (intent.quantity > 0) {
    if (kind === ASK && !trader.owns[stockName] || trader.owns[stockName] < intent.quantity) {
      throw new Error("trader does not have enough stock quantity");
    }
    if (kind === BID && trader.money < price * quantity) {
      throw new Error("trader does not have enough money");
    }
  }

  // remove previous intent from the same trader to this stock (if one exists)
  const dataArr = kind === BID ? stock.bids : stock.asks;
  const idx = dataArr.findIndex(bad => {
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

function placeBid(token, stockName, price, quantity) {
  _place(token, stockName, price, quantity, BID);
}

function placeAsk(token, stockName, price, quantity) {
  _place(token, stockName, price, quantity, ASK);
}

function _simplifyData(arr) {
  const arr2 = arr.map(bad => {
    return { price: bad.price, quantity: bad.quantity };
  });
  let prevRow = { price: 0, quantity: 0 };
  const arr3 = [];
  arr2.forEach(row => {
    if (row.price !== prevRow.price) {
      prevRow = row;
      arr3.push(row);
    } else {
      prevRow.quantity += row.quantity;
    }
  });
  return arr3;
}

function getStockLOB(stockName) {
  const stock = STOCKS[stockName];
  if (!stock) {
    throw new Error("stock does not exist");
  }
  return {
    bids: _simplifyData(stock.bids),
    asks: _simplifyData(stock.asks)
  };
}

function getStockNames() {
  return Object.keys(STOCKS);
}

function _emptyArray(arr) {
  arr.splice(0, arr.length);
}

function _emptyObject(o) {
  for (let k in o) {
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

function _get_state_() {
  return {
    stocks: STOCKS,
    traders: TRADERS,
    transactions: TRANSACTIONS
  };
}

function _set_state_(st) {
  Object.assign(STOCKS, st.stocks);
  Object.assign(TRADERS, st.traders);
  st.transactions.forEach(tr => {
    TRANSACTIONS.push(tr);
  });
}

function _updateOwns(owns, stockName, quantity) {
  if (stockName in owns) {
    owns[stockName] += quantity;
  } else {
    owns[stockName] = quantity;
  }
}

function getTransactions() {
  return TRANSACTIONS;
}

function getStats() {
  return {
    traders: Object.keys(TRADERS).length,
    tokens: Object.keys(VALID_TOKENS).length,
    stocks: Object.keys(STOCKS).length,
    queuedActions: Object.keys(STOCKS).reduce((prev, curr) => {
      const st = STOCKS[curr];
      return st.bids.length + st.asks.length;
    }, 0)
  };
}

function step() {
  getStockNames().forEach(stockName => {
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
      const trans = {
        from: lowestAsk.trader,
        to: highestBid.trader,
        quantity: Math.min(lowestAsk.quantity, highestBid.quantity),
        price: lowestAsk.price,
        stock: stockName,
        when: _now()
      };

      let isValid = true;
      const traderFrom = TRADERS[trans.from];
      const traderTo = TRADERS[trans.to];
      const transFromOwnedQuantity = traderFrom.owns[stockName] || 0;
      const transactionMoney = trans.price * trans.quantity;

      if (true) {
        if (trans.from === trans.to) {
          isValid = false;
          // console.log('trader should not trade with himself')
        }

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