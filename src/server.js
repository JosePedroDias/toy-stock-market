// @flow

const PORT = 3030;
const STEP_DELTA_MS = 1000;
const SSE_CONNECTIONS = [];

// $FlowFixMe
const VERSION = require("../package.json").version;

import express from "express";
import cors from "cors";
import sse from "./sse";

import {
  registerTrader,
  loginTrader,
  logoutTrader,
  getTraderStatus,
  placeBid,
  placeAsk,
  getStockNames,
  getStockLOB,
  getTransactions,
  getStats,
  step,
  BID,
  ASK,
  getTraderNameFromToken,
  transactionsEmitter
} from "./stock";

import type { SETransaction } from "./stock";

import bootstrap from "./bootstrap";

const app = express();

const startTime = new Date();

app.use(cors());
app.use(sse);

function publishToStream(o: any): void {
  SSE_CONNECTIONS.forEach(res => {
    // $FlowFixMe
    res.sseSend(o);
  });
}

// TRADER AUTH

app.get(
  "/register/:name/:password/:money",
  (req: express$Request, res: express$Response) => {
    const p = req.params;
    const token: string = registerTrader(
      p.name,
      p.password,
      parseFloat(p.money)
    );
    res.send({ token: token });
    res.end();
  }
);

app.get(
  "/login/:name/:password",
  (req: express$Request, res: express$Response) => {
    const p = req.params;
    const token: string = loginTrader(p.name, p.password);
    res.send({ token: token });
    res.end();
  }
);

app.get("/logout/:token", (req: express$Request, res: express$Response) => {
  logoutTrader(req.params.token);
  res.send({ ok: true });
  res.end();
});

// TRADER GETTERS

app.get("/trader/:token", (req: express$Request, res: express$Response) => {
  res.send(getTraderStatus(req.params.token));
  res.end();
});

// TRADER ACTIONS

app.get(
  "/bid/:token/:stockName/:price/:quantity",
  (req: express$Request, res: express$Response) => {
    const p = req.params;
    const price = parseFloat(p.price);
    const quantity = parseInt(p.quantity, 10);

    placeBid(p.token, p.stockName, price, quantity);
    res.send({ ok: true });
    res.end();

    publishToStream({
      kind: BID,
      price: price,
      quantity: quantity,
      from: getTraderNameFromToken(p.token)
    });
  }
);

app.get(
  "/ask/:token/:stockName/:price/:quantity",
  (req: express$Request, res: express$Response) => {
    const p = req.params;
    const price = parseFloat(p.price);
    const quantity = parseInt(p.quantity, 10);

    placeAsk(p.token, p.stockName, price, quantity);
    res.send({ ok: true });
    res.end();

    publishToStream({
      kind: ASK,
      price: price,
      quantity: quantity,
      from: getTraderNameFromToken(p.token)
    });
  }
);

// OPEN ENDPOINTS

app.get("/stock", (req: express$Request, res: express$Response) => {
  res.send(getStockNames());
  res.end();
});

app.get("/stock/:stockName", (req: express$Request, res: express$Response) => {
  res.send(getStockLOB(req.params.stockName));
  res.end();
});

app.get("/transactions", (req: express$Request, res: express$Response) => {
  res.send(getTransactions());
  res.end();
});

app.get("/stats", (req: express$Request, res: express$Response) => {
  res.send(getStats());
  res.end();
});

app.get("/stream", (req: express$Request, res: express$Response) => {
  // $FlowFixMe
  res.sseSetup();
  SSE_CONNECTIONS.push(res);
});

app.get("/", (req: express$Request, res: express$Response) => {
  res.send({
    version: VERSION,
    since: startTime.toString(),
    sinceN: startTime.valueOf()
  });
  res.end();
});

if (true) {
  bootstrap();
}

console.log("toy-stock-market %s running on port %s...", VERSION, PORT);
app.listen(PORT);

setInterval(() => {
  step();
}, STEP_DELTA_MS);

transactionsEmitter.on("transaction", (trans: SETransaction) => {
  publishToStream({
    kind: "transaction",
    from: trans.from,
    to: trans.to,
    price: trans.price,
    quantity: trans.quantity,
    stock: trans.stock
  });
});
