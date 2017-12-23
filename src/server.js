// @flow

const PORT = 3000;
const STEP_DELTA_MS = 1000;

import express from "express";
import cors from "cors";

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
  step
} from "./stock";

import bootstrap from "./bootstrap";

const app = express();

app.use(cors());

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
    placeBid(
      p.token,
      p.stockName,
      parseFloat(p.price),
      parseInt(p.quantity, 10)
    );
    res.send({ ok: true });
    res.end();
  }
);

app.get(
  "/ask/:token/:stockName/:price/:quantity",
  (req: express$Request, res: express$Response) => {
    const p = req.params;
    placeAsk(
      p.token,
      p.stockName,
      parseFloat(p.price),
      parseInt(p.quantity, 10)
    );
    res.send({ ok: true });
    res.end();
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

if (false) {
  bootstrap();
}

console.log("toy-stock-market running on port %s...", PORT);
app.listen(PORT);

setInterval(() => {
  step();
}, STEP_DELTA_MS);
