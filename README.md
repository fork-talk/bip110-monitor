# BIP-110 Adoption Monitor

Live dashboard tracking BIP-110 node adoption and block signaling across the Bitcoin network.

**Dashboard**: [fork-talk.github.io/bip110-monitor](https://fork-talk.github.io/bip110-monitor/)

## What it tracks

- Node implementation breakdown (Core vs Knots vs others)
- BIP-110 node signaling (NODE_REDUCED_DATA service flag)
- OP_RETURN relay policy adoption
- Block version bit 4 signaling
- Current retarget period progress toward 55% threshold
- Activation timeline with estimated dates

## Data sources

- [btcnodes.io](https://btcnodes.io) - Node crawler with BIP-110 tracking
- [mempool.space](https://mempool.space) - Block explorer API for version bits

## CLI usage

```
npm run monitor          # full report
npm run nodes            # node data only
npm run blocks           # block signaling only
```

Requires Node.js 18+ (uses native fetch).

## Web dashboard

The dashboard is a static page with no build step. All ES modules, fetches live data client-side.

Served via GitHub Pages from the `gh-pages` branch.

## License

MIT
