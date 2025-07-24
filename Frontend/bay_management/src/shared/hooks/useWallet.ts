import { useWallet } from '@solana/wallet-adapter-react'
import { useAtom } from 'jotai'
import { atom } from 'jotai'
import { useEffect } from 'react'
import { toast } from 'sonner'

// Atoms for wallet state
export const walletAddressAtom = atom<string>('')
export const isConnectedAtom = atom((get) => !!get(walletAddressAtom))

export const useWalletConnection = () => {
  const { publicKey, connected, disconnect, connecting } = useWallet()
  const [, setWalletAddress] = useAtom(walletAddressAtom)

  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toBase58()
      setWalletAddress(address)
      toast.success(`지갑 연결됨: ${address.slice(0, 4)}...${address.slice(-4)}`)
    } else {
      setWalletAddress('')
    }
  }, [connected, publicKey, setWalletAddress])

  const handleDisconnect = async () => {
    try {
      await disconnect()
      setWalletAddress('')
      toast.success('지갑 연결이 해제되었습니다.')
    } catch (error) {
      toast.error('지갑 연결 해제 중 오류가 발생했습니다.')
      console.error('Disconnect error:', error)
    }
  }

  return {
    address: publicKey?.toBase58() || '',
    connected,
    connecting,
    disconnect: handleDisconnect,
  }
}