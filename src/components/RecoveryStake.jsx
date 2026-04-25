import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useEmberStore } from '../store/emberStore'
import { depositToVault, getWalletBalance } from '../services/solana'

const SOL_PRICE_USD = 140  // approximate — display only

function solToUSD(sol) { return (sol * SOL_PRICE_USD).toFixed(2) }
function usdToSOL(usd) { return (usd / SOL_PRICE_USD).toFixed(4) }

export default function RecoveryStake() {
  const wallet = useWallet()
  const { stakedSOL, rewardPerSession, earnedSOL, stakeDepositSig, setStake } = useEmberStore()

  const [balance, setBalance] = useState(null)
  const [depositUSD, setDepositUSD] = useState('20')
  const [rewardUSD, setRewardUSD] = useState('2')
  const [depositing, setDepositing] = useState(false)
  const [error, setError] = useState('')
  const [txSig, setTxSig] = useState(stakeDepositSig || '')

  useEffect(() => {
    if (!wallet.publicKey) return
    getWalletBalance(wallet.publicKey.toString()).then(setBalance)
  }, [wallet.publicKey])

  const depositSOL = parseFloat(usdToSOL(parseFloat(depositUSD) || 0))
  const rewardSOL  = parseFloat(usdToSOL(parseFloat(rewardUSD)  || 0))
  const sessionsToEarn = rewardSOL > 0 ? Math.ceil(depositSOL / rewardSOL) : 0

  const isActive = stakedSOL > 0
  const remaining = Math.max(0, stakedSOL - earnedSOL)
  const progressPct = stakedSOL > 0 ? Math.min(100, (earnedSOL / stakedSOL) * 100) : 0

  const handleDeposit = async () => {
    setError('')
    if (!wallet.connected) { setError('Connect your wallet first.'); return }
    if (depositSOL <= 0) { setError('Enter a valid amount.'); return }
    if (rewardSOL > depositSOL) { setError('Reward per session can\'t exceed total deposit.'); return }
    if (balance !== null && depositSOL > balance) {
      setError(`Insufficient balance. You have ${balance.toFixed(3)} SOL.`); return
    }
    setDepositing(true)
    try {
      const sig = await depositToVault(wallet, depositSOL)
      setStake(depositSOL, rewardSOL, sig)
      setTxSig(sig)
    } catch (e) {
      setError(e.message?.includes('rejected') ? 'Transaction cancelled.' : 'Deposit failed — try again.')
    }
    setDepositing(false)
  }

  const handleReset = () => {
    if (!window.confirm('Reset your stake? This clears local tracking only — on-chain deposit remains.')) return
    setStake(0, 0, null)
    setTxSig('')
  }

  if (!wallet.connected) {
    return (
      <div className="flex flex-col gap-4 p-5 bg-stone-50 border border-stone-200 rounded-2xl">
        <p className="text-stone-500 text-sm leading-relaxed">
          Connect your Phantom or Solana wallet to stake SOL and earn it back session by session.
        </p>
        <WalletMultiButton style={{
          background: '#f59e0b', color: '#000', fontWeight: '700',
          borderRadius: '14px', fontSize: '13px', width: '100%', justifyContent: 'center'
        }} />
      </div>
    )
  }

  if (isActive) {
    return (
      <div className="flex flex-col gap-4">
        {/* Progress card */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-amber-600 font-semibold uppercase tracking-widest mb-0.5">Stake active</p>
              <p className="text-stone-800 font-black text-2xl">{stakedSOL.toFixed(4)} SOL</p>
              <p className="text-stone-400 text-xs">≈ ${solToUSD(stakedSOL)} deposited</p>
            </div>
            <div className="text-right">
              <p className="text-emerald-600 font-black text-2xl">{earnedSOL.toFixed(4)} SOL</p>
              <p className="text-stone-400 text-xs">earned back</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-amber-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-stone-400">
            <span>{progressPct.toFixed(0)}% recovered</span>
            <span>{remaining.toFixed(4)} SOL remaining</span>
          </div>
        </div>

        {/* Per-session reward */}
        <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
          <div>
            <p className="text-stone-700 text-sm font-medium">Reward per session</p>
            <p className="text-stone-400 text-xs">Each craving you survive earns this back</p>
          </div>
          <div className="text-right">
            <p className="text-emerald-600 font-bold">{rewardPerSession.toFixed(4)} SOL</p>
            <p className="text-stone-400 text-xs">≈ ${solToUSD(rewardPerSession)}</p>
          </div>
        </div>

        {/* On-chain proof */}
        {txSig && (
          <a href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`}
            target="_blank" rel="noopener noreferrer"
            className="text-xs text-stone-400 hover:text-amber-600 transition-colors text-center underline underline-offset-2">
            View deposit on Solana Explorer ↗
          </a>
        )}

        <button onClick={handleReset}
          className="text-stone-400 hover:text-red-500 text-xs text-center transition-colors">
          Reset stake tracking
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Wallet info */}
      <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-xl px-4 py-3">
        <div>
          <p className="text-stone-500 text-xs">Connected wallet</p>
          <p className="text-stone-700 text-sm font-mono">
            {wallet.publicKey?.toString().slice(0, 6)}…{wallet.publicKey?.toString().slice(-4)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-stone-500 text-xs">Balance</p>
          <p className="text-stone-700 text-sm font-semibold">
            {balance !== null ? `${balance.toFixed(3)} SOL` : '—'}
          </p>
        </div>
      </div>

      {/* Deposit amount */}
      <div>
        <label className="text-stone-600 text-sm font-medium block mb-1.5">Total deposit amount</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
            <input
              type="number" min="1" step="1"
              value={depositUSD}
              onChange={e => setDepositUSD(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-7 pr-4 py-3 text-stone-800 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex items-center px-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 text-xs whitespace-nowrap">
            ≈ {depositSOL} SOL
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          {[5, 10, 20, 50].map(v => (
            <button key={v} onClick={() => setDepositUSD(String(v))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${depositUSD === String(v) ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
              ${v}
            </button>
          ))}
        </div>
      </div>

      {/* Reward per session */}
      <div>
        <label className="text-stone-600 text-sm font-medium block mb-1.5">Earn back per session survived</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
            <input
              type="number" min="0.5" step="0.5"
              value={rewardUSD}
              onChange={e => setRewardUSD(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-7 pr-4 py-3 text-stone-800 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex items-center px-3 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 text-xs whitespace-nowrap">
            ≈ {rewardSOL} SOL
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          {[1, 2, 5, 10].map(v => (
            <button key={v} onClick={() => setRewardUSD(String(v))}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all
                ${rewardUSD === String(v) ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-500 hover:border-stone-300'}`}>
              ${v}
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      {sessionsToEarn > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
          <p className="text-emerald-700 text-sm font-medium">
            Survive <span className="font-black">{sessionsToEarn} sessions</span> to earn your full ${depositUSD} back.
          </p>
          <p className="text-emerald-600 text-xs mt-0.5">
            Each craving you defeat returns ${rewardUSD} to you — automatically.
          </p>
        </div>
      )}

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <button
        onClick={handleDeposit}
        disabled={depositing || !depositUSD || !rewardUSD}
        className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-40 text-black font-bold py-4 rounded-2xl transition-all text-sm">
        {depositing ? 'Awaiting wallet approval…' : `Deposit $${depositUSD} and start earning it back`}
      </button>

      <p className="text-stone-400 text-xs text-center leading-relaxed">
        SOL sent to Flare vault on devnet. Rewards credited after each survived session.
        Withdrawal available once your full stake is earned.
      </p>
    </div>
  )
}
