import {
  Connection, PublicKey, Transaction,
  TransactionInstruction, clusterApiUrl
} from '@solana/web3.js'

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed')
const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr')

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
