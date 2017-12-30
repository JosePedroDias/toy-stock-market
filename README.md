# toy stock market

Trying to grasp the concept of the stock market,
this is the most straightforward implementation that I could come up with.

I may have misinterpreted concepts and/or rules. Can take hints from you.

I modeled the engine to behave similarly to what is described in the
[Bristol Stock Exchange](https://github.com/davecliff/BristolStockExchange).
Haven't copied the code itself, just relied on the simple description [here](https://github.com/davecliff/BristolStockExchange/blob/master/BSEguide1.2e.pdf).

## how to install it

if you just run it and not edit the code, you can install without dev dependencies like this:

    npm install --production

otherwise:

    npm install

## how to run it

requires a recent version of node.js and npm. this should suffice:

    npm start

(delete or rename the `prestart` script if you installed with `--production` flag)

then visit: <http://127.0.0.1:3030>

## interacting with the stock market instance

## HTTP API

The stock market server runs a simple HTPP server with CORS.

All endpoints accept GETs, receive argument in the path and return JSON data.

    /register (name / pass / money) -> token
    /login (name / pass) -> token
    /logout (token)

    /bid (token, stockName, price, quantity)
    /ask (token, stockName, price, quantity)

    /stock () -> array of stock names
    /stock (stockName) -> lob, consisting of: array of binds, array of asks
    /transactions () -> array of transactions
    /stats () -> closing ts, nr stocks

    /stream () -> server sent events JSON stream (for bids, asks, transactions)

## some notes

The stock data structures, types and core functions live in `stock.js`.
All of these are simple structures in memory. Performance is not a big concern in this exploratory initiative.

The HTTP server is set up from `server.js`.

To prepare an initial state populating content, edit `bootstrap.js`.
Notice that the `bootstrap()` call is disabled in `server.js`. Enable it.

Should be trivial to serialize and restore the state. The relevant content can be obtained
via `stock.js`'s `_get_state_()`. Didn't because I have no relevant state yet to save.

Even though trader's money and how many shares of each stock
the trader has, the code isn't enforcing:

* the bidding trader has enough money to buy
* the asking trader has enough quantity to sell

The purpose of tracking these is convenience and to aid bot keeping state.

Kept these rules loose to simplify the bootstrap process.
Enforcing these is trivial but would require the initial shares to be issued with more ceremony.

## further work

* add a basic HTML UI to interact with the stock market -> ongoing, see [toy-stock-market-ui](#TODO)
* create 1 or more bots to simulate it working and possibly different strategies
