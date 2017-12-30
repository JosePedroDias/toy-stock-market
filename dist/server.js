"use strict";

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _cors = require("cors");

var _cors2 = _interopRequireDefault(_cors);

var _sse = require("./sse");

var _sse2 = _interopRequireDefault(_sse);

var _stock = require("./stock");

var _bootstrap = require("./bootstrap");

var _bootstrap2 = _interopRequireDefault(_bootstrap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PORT = 3030;
const STEP_DELTA_MS = 1000;
const SSE_CONNECTIONS = [];

// $FlowFixMe
const VERSION = require("../package.json").version;

const app = (0, _express2.default)();

const startTime = new Date();

app.use((0, _cors2.default)());
app.use(_sse2.default);

function publishToStream(o) {
  SSE_CONNECTIONS.forEach(res => {
    // $FlowFixMe
    res.sseSend(o);
  });
}

// TRADER AUTH

app.get("/register/:name/:password/:money", (req, res) => {
  const p = req.params;
  try {
    const token = (0, _stock.registerTrader)(p.name, p.password, parseFloat(p.money));
    res.send({ ok: true, token: token });
  } catch (ex) {
    res.send({ ok: false, error: ex.message });
  }
  res.end();
});

app.get("/login/:name/:password", (req, res) => {
  const p = req.params;
  try {
    const token = (0, _stock.loginTrader)(p.name, p.password);
    res.send({ ok: true, token: token });
  } catch (ex) {
    res.send({ ok: false, error: ex.message });
  }
  res.end();
});

app.get("/logout/:token", (req, res) => {
  (0, _stock.logoutTrader)(req.params.token);
  res.send({ ok: true });
  res.end();
});

// TRADER GETTERS

app.get("/trader/:token", (req, res) => {
  res.send((0, _stock.getTraderStatus)(req.params.token));
  res.end();
});

// TRADER ACTIONS

app.get("/bid/:token/:stockName/:price/:quantity", (req, res) => {
  const p = req.params;
  const price = parseFloat(p.price);
  const quantity = parseInt(p.quantity, 10);

  try {
    (0, _stock.placeBid)(p.token, p.stockName, price, quantity);
    res.send({ ok: true });

    publishToStream({
      kind: _stock.BID,
      price: price,
      quantity: quantity,
      from: (0, _stock.getTraderNameFromToken)(p.token)
    });
  } catch (ex) {
    res.send({ ok: false, error: ex.message });
  }
  res.end();
});

app.get("/ask/:token/:stockName/:price/:quantity", (req, res) => {
  const p = req.params;
  const price = parseFloat(p.price);
  const quantity = parseInt(p.quantity, 10);

  try {
    (0, _stock.placeAsk)(p.token, p.stockName, price, quantity);
    res.send({ ok: true });

    publishToStream({
      kind: _stock.ASK,
      price: price,
      quantity: quantity,
      from: (0, _stock.getTraderNameFromToken)(p.token)
    });
  } catch (ex) {
    res.send({ ok: false, error: ex.message });
  }
  res.end();
});

// OPEN ENDPOINTS

app.get("/stock", (req, res) => {
  res.send((0, _stock.getStockNames)());
  res.end();
});

app.get("/stock/:stockName", (req, res) => {
  res.send((0, _stock.getStockLOB)(req.params.stockName));
  res.end();
});

app.get("/transactions", (req, res) => {
  res.send((0, _stock.getTransactions)());
  res.end();
});

app.get("/stats", (req, res) => {
  res.send((0, _stock.getStats)());
  res.end();
});

app.get("/stream", (req, res) => {
  // $FlowFixMe
  res.sseSetup();
  SSE_CONNECTIONS.push(res);
});

app.get("/", (req, res) => {
  res.send({
    version: VERSION,
    since: startTime.toString(),
    sinceN: startTime.valueOf()
  });
  res.end();
});

app.all("*", (req, res) => {
  res.send({ ok: false, error: "unsupported endpoint" });
  res.end();
});

(0, _bootstrap2.default)();

console.log("toy-stock-market %s running on port %s...", VERSION, PORT);
app.listen(PORT);

setInterval(() => {
  (0, _stock.step)();
}, STEP_DELTA_MS);

_stock.transactionsEmitter.on("transaction", trans => {
  publishToStream({
    kind: "transaction",
    from: trans.from,
    to: trans.to,
    price: trans.price,
    quantity: trans.quantity,
    stock: trans.stock
  });
});

// on exit, with workaround for windows to work (https://stackoverflow.com/a/14861513)
if (process.platform === "win32") {
  const rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.on("SIGINT", () => {
    process.emit("SIGINT");
  });
}

process.on("SIGINT", () => {
  console.log("Exiting...");
  _fs2.default.writeFileSync("_state_.json", JSON.stringify((0, _stock._get_state_)(), null, 2));
  process.exit();
});