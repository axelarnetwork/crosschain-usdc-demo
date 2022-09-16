import React from "react";
import Image from "next/image";
import { useAccount, useConnect, useNetwork } from "wagmi";
import { NativeBalance, ConnectButton } from "components/common";
import Link from "next/link";
import { SquidChain } from "types/chain";

export const Header = () => {
  const { data: account } = useAccount();
  const { isConnected } = useConnect();
  const network = useNetwork();
  const activeChain = network.activeChain as SquidChain;
  const icon = activeChain?.icon;
  return (
    <div className="fixed z-50 w-full border-b border-[#192431] backdrop-blur-sm bg-black/10">
      <div className="h-20 max-w-screen-xl mx-auto navbar">
        <Link href={"/"} passHref>
          <a className="flex">
            <Image
              src="/assets/png/squid-logo.png"
              width={32}
              height={32}
              alt="logo"
            />
            <span className="hidden ml-4 text-2xl font-light text-white sm:flex">
              SquiDex
            </span>
          </a>
        </Link>
        <div className="flex items-center ml-auto gap-x-4">
          {isConnected && account?.address && <NativeBalance />}
          {isConnected && (
            <Image
              className="p-1 bg-gray-200 rounded-full"
              src={icon || "/ic-unknown.svg"}
              width={30}
              height={30}
              alt="chain icon"
            />
          )}
          <ConnectButton />
        </div>
      </div>
    </div>
  );
};
