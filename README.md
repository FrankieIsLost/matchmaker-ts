# Flashbots Matchmaker

Client library for Flashbots `MEV-share` Matchmaker.

Based on [prospective API docs](https://flashbots.notion.site/PUBLIC-Prospective-MEV-Share-API-docs-28610c583e5b485d92b62daf6e0cc874).

## quickstart

Install from npm:

```sh
yarn add @flashbots/matchmaker-ts
# or
npm i @flashbots/matchmaker-ts
```

Alternatively, clone the library & build from source:

```sh
git clone https://github.com/flashbots/matchmaker-ts
cd matchmaker-ts
yarn install && yarn build
```

### use matchmaker in your project

> :warning: Variables denoted in `ALL_CAPS` are placeholders; the code does not compile. [examples/](#examples) contains compilable demos.

In your project:

```typescript
import { Wallet, JsonRpcProvider } from "ethers"
import Matchmaker, {
    BundleParams,
    HintPreferences,
    IPendingBundle,
    IPendingTransaction,
    StreamEvent,
    TransactionOptions
} from "@flashbots/matchmaker-ts"

const provider = new JsonRpcProvider(RPC_URL)
const authSigner = new Wallet(FB_REPUTATION_PRIVATE_KEY, provider)
```

The `Matchmaker` class has built-in initializers for networks supported by Flashbots.

#### Connect to Ethereum Mainnet

```typescript
const matchmaker = Matchmaker.useEthereumMainnet(authSigner)
```

#### Connect to Ethereum Goerli

```typescript
const matchmaker = Matchmaker.useEthereumGoerli(authSigner)
```

#### Connect with an Ethers Provider or Chain ID

Networks supported by Flashbots have presets built-in. If it's more convenient, you can instantiate a Matchmaker using a `chainId` (or a ethers.js `Network` object, which has a `chainId` param).

```typescript
import { JsonRpcProvider } from "ethers" // ethers v6

/** connects to Flashbots matchmaker on goerli */
function connectMatchmaker(provider: JsonRpcProvider) {
    return Matchmaker.fromNetwork(provider._network)
}

// manually with a chainId:
const matchmaker = Matchmaker.fromNetwork({chainId: 5})
```

#### Connect to a custom network

To use custom network parameters, you can instantiate a new Matchmaker directly. This example is what the client uses to connect to mainnet:

```typescript
const matchmaker = new Matchmaker(authSigner, {
    name: "mainnet",
    chainId: 1,
    streamUrl: "https://mev-share.flashbots.net",
    apiUrl: "https://relay.flashbots.net"
})
```

See [MatchmakerNetwork](/src/api/interfaces.ts#L15) for more details.

### examples

_[Source code](./src/examples/)_

> :information_source: Examples require a `.env` file (or that you populate your environment directly with the appropriate variables).

```sh
cd src/examples
cp .env.example .env
vim .env
```

#### send a tx with hints

This example sends a transaction to the Flashbots Goerli Matchmaker from the account specified by SENDER_PRIVATE_KEY with a hex-encoded string as calldata.

```sh
yarn example.tx
```

#### backrun a pending tx

This example watches the mev-share streaming endpoint for pending mev-share transactions and attempts to backrun them all. The example runs until a backrun has been included on-chain.

```sh
yarn example.backrun
```

## Usage

See [src/api/interfaces.ts](src/api/interfaces.ts) for interface definitions.

### `on`

Use `on` to start listening for events on mev-share. The function registers the provided callback to be called when a new event is detected.

```typescript
const handler = matchmaker.on(StreamEvent.Transaction, (tx: IPendingTransaction) => {
    // handle pending tx
})

// before terminating program
handler.close()
```

### `sendTransaction`

Sends a private transaction to the Flashbots Matchmaker with specified hint parameters.

```typescript
const shareTxParams: TransactionOptions = {
    hints: {
        logs: true,
        calldata: false,
        functionSelector: true,
        contractAddress: true,
    },
    maxBlockNumber: undefined,
}
await matchmaker.sendTransaction(SIGNED_TX, shareTxParams)
```

### `sendBundle`

Sends a bundle; an array of transactions with parameters to specify conditions for inclusion and MEV kickbacks. Transactions are placed in the `body` parameter with wrappers to indicate whether they're a new signed transaction or a pending transaction from the event stream.

See [MEV-Share Docs](https://github.com/flashbots/mev-share/blob/main/src/mev_sendBundle.md) for detailed descriptions of these parameters.

```typescript
const bundleParams: BundleParams = {
    inclusion: {
        block: TARGET_BLOCK,
    },
    body: [
        {hash: TX_HASH_FROM_EVENT_STREAM},
        {tx: SIGNED_TX, canRevert: false},
    ],
    validity: {
        refund: [
            {address: SEARCHER_ADDRESS, percent: 10}
        ]
    },
    privacy: {
        hints: {
            calldata: false,
            logs: false,
            functionSelector: true,
            contractAddress: true,
        },
        targetBuilders: ["all"]
    }
}
await matchmaker.sendBundle(bundleParams)
```
