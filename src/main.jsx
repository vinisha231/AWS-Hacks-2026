import React from 'react'
import ReactDOM from 'react-dom/client'
import { Auth0Provider } from '@auth0/auth0-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import '@solana/wallet-adapter-react-ui/styles.css'
import App from './App'
import './index.css'

const network = WalletAdapterNetwork.Devnet
const endpoint = clusterApiUrl(network)
const wallets = [new PhantomWalletAdapter()]

ReactDOM.createRoot(document.getElementById('root')).render(
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <Auth0Provider
          domain={import.meta.env.VITE_AUTH0_DOMAIN}
          clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
          authorizationParams={{
            redirect_uri: window.location.origin,
            scope: 'openid profile email'
          }}
          cacheLocation="localstorage"
        >
          <App />
        </Auth0Provider>
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
)
