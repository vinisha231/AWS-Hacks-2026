import {
  Connection, PublicKey, Transaction, SystemProgram,
  TransactionInstruction, clusterApiUrl, LAMPORTS_PER_SOL
} from '@solana/web3.js'

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

// Flare recovery vault on devnet — replace with your funded escrow wallet before mainnet
const VAULT_ADDRESS = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS')

export async function getWalletBalance(publicKey) {
  try {
    const lamports = await connection.getBalance(new PublicKey(publicKey))
    return lamports / LAMPORTS_PER_SOL
  } catch {
    return null
  }
}

export async function depositToVault(wallet, solAmount) {
  if (!wallet.publicKey) throw new Error('Wallet not connected')
  const lamports = Math.round(solAmount * LAMPORTS_PER_SOL)

  const { blockhash } = await connection.getLatestBlockhash()
  const tx = new Transaction()
  tx.recentBlockhash = blockhash
  tx.feePayer = wallet.publicKey

  // Transfer SOL to vault
  tx.add(SystemProgram.transfer({
    fromPubkey: wallet.publicKey,
    toPubkey: VAULT_ADDRESS,
    lamports,
  }))

  // Attach memo recording the stake terms
  tx.add(new TransactionInstruction({
    keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(JSON.stringify({
      app: 'flare-v1', type: 'deposit',
      solAmount, ts: Date.now()
    }), 'utf-8'),
  }))

  const signed = await wallet.signTransaction(tx)
  const sig = await connection.sendRawTransaction(signed.serialize())
  await connection.confirmTransaction(sig, 'confirmed')
  return sig
}

export async function recordRewardOnChain(wallet, earnedSOL, sessionCount) {
  if (!wallet.publicKey) return null
  try {
    const { blockhash } = await connection.getLatestBlockhash()
    const tx = new Transaction()
    tx.recentBlockhash = blockhash
    tx.feePayer = wallet.publicKey
    tx.add(new TransactionInstruction({
      keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: false }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(JSON.stringify({
        app: 'flare-v1', type: 'reward',
        earnedSOL, sessionCount, ts: Date.now()
      }), 'utf-8'),
    }))
    const signed = await wallet.signTransaction(tx)
    const sig = await connection.sendRawTransaction(signed.serialize())
    await connection.confirmTransaction(sig, 'confirmed')
    return sig
  } catch { return null }
}

export async function mintMilestone(wallet, milestoneType, dayCount) {
  if (!wallet.publicKey) throw new Error('Wallet not connected')

  const memo = JSON.stringify({
    app: 'ember-v1',
    milestone: milestoneType,
    day: dayCount,
    ts: Date.now()
  })

  const ix = new TransactionInstruction({
    keys: [{ pubkey: wallet.publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(memo, 'utf-8')
  })

  const { blockhash } = await connection.getLatestBlockhash()
  const tx = new Transaction()
  tx.recentBlockhash = blockhash
  tx.feePayer = wallet.publicKey
  tx.add(ix)

  const signed = await wallet.signTransaction(tx)
  const sig = await connection.sendRawTransaction(signed.serialize())
  await connection.confirmTransaction(sig, 'confirmed')
  return sig
}

export async function getMilestones(walletAddress) {
  const pubkey = new PublicKey(walletAddress)
  const sigs = await connection.getSignaturesForAddress(pubkey, { limit: 50 })
  const milestones = []

  for (const s of sigs) {
    const tx = await connection.getTransaction(s.signature, {
      maxSupportedTransactionVersion: 0
    })
    const logs = tx?.meta?.logMessages || []
    const memoLog = logs.find(l => l.includes('"app":"ember-v1"'))
    if (memoLog) {
      try {
        const json = memoLog.match(/\{.*\}/)?.[0]
        if (json) milestones.push(JSON.parse(json))
      } catch (_) {}
    }
  }
  return milestones
}
