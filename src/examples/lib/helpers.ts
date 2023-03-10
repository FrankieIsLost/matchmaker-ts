import { JsonRpcProvider, Network, Wallet } from 'ethers'
import Matchmaker from '../..'
import Env from './env'

export function getProvider() {
    return new JsonRpcProvider(Env.providerUrl, new Network("goerli", 5))
}

export async function initExample(provider: JsonRpcProvider) {
    const authSigner = new Wallet(Env.authKey)
    const network = {chainId: 5, name: "goerli"}
    const matchmaker = new Matchmaker(authSigner, network)
    const wallet = new Wallet(Env.senderKey)
    const feeData = await provider.getFeeData()

    return {
        provider,
        wallet: wallet.connect(provider),
        authSigner: authSigner.connect(provider),
        matchmaker,
        feeData,
    }
}
