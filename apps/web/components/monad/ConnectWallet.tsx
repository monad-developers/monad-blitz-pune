"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";

interface ConnectWalletProps {
  openModal?: boolean;
  closeModal?: () => void;
}

/**
 * RainbowKit ConnectButton wrapper component
 * The openModal and closeModal props are kept for backward compatibility
 * but RainbowKit handles its own modal state internally
 */
export function ConnectWallet({ openModal, closeModal }: ConnectWalletProps) {
  return <ConnectButton />;
}

export default ConnectWallet;

