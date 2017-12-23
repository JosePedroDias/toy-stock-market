"use strict";

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _cors = require("cors");

var _cors2 = _interopRequireDefault(_cors);

var _stock = require("./stock");

var _bootstrap = require("./bootstrap");

var _bootstrap2 = _interopRequireDefault(_bootstrap);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const PORT = 3000;
const STEP_DELTA_MS = 1000;

const app = (0, _express2.default)();

app.use((0, _cors2.default)());

// TRADER AUTH

app.get("/register/:name/:password/:money", (req, res) => {
  const p = req.params;
  const token = (0, _stock.registerTrader)(p.name, p.password, parseFloat(p.money));
  res.send({ token: token });
  res.end();
});

app.get("/login/:name/:password", (req, res) => {
  const p = req.params;
  const token = (0, _stock.loginTrader)(p.name, p.password);
  res.send({ token: token });
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
  (0, _stock.placeBid)(p.token, p.stockName, parseFloat(p.price), parseInt(p.quantity, 10));
  res.send({ ok: true });
  res.end();
});

app.get("/ask/:token/:stockName/:price/:quantity", (req, res) => {
  const p = req.params;
  (0, _stock.placeAsk)(p.token, p.stockName, parseFloat(p.price), parseInt(p.quantity, 10));
  res.send({ ok: true });
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

if (false) {
  (0, _bootstrap2.default)();
}

console.log("toy-stock-market running on port %s...", PORT);
app.listen(PORT);

setInterval(() => {
  (0, _stock.step)();
}, STEP_DELTA_MS);