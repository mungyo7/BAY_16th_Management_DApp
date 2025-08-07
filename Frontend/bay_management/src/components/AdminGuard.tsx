import { useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { Navigate } from 'react-router'
import { ReactNode } from 'react'

const ADMIN_WALLET_ADDRESS = 'bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u'

interface AdminGuardProps {
  children: ReactNode
}

export function AdminGuard({ children }: AdminGuardProps) {
  const { publicKey } = useWallet()
  
  const adminPublicKey = new PublicKey(ADMIN_WALLET_ADDRESS)
  
  if (!publicKey || !publicKey.equals(adminPublicKey)) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}