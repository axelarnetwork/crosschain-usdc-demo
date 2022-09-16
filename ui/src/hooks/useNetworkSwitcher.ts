import { useEffect } from "react";
import { useNetwork } from "wagmi";
import {
  selectDestChain,
  selectSrcChain,
  setDestChain,
  setSrcChain,
} from "../slices/swapInputSlice";
import { SquidChain } from "../types/chain";
import { useAppDispatch, useAppSelector } from "./useAppSelector";

export const useNetworkSwitcher = () => {
  const srcChain = useAppSelector(selectSrcChain);
  const destChain = useAppSelector(selectDestChain);
  const dispatch = useAppDispatch();
  const { activeChain } = useNetwork();

  useEffect(() => {
    if (!activeChain) return;

    const prevChain = { ...srcChain } as SquidChain;
    const currentChain = activeChain as SquidChain;

    // update src chain if network supported
    if (currentChain.icon) {
      dispatch(setSrcChain(currentChain));
    }

    // set dest chain to previously cached chain to avoid conflicts
    if (currentChain.id === destChain.id) {
      dispatch(setDestChain(prevChain));
    }
  }, [activeChain, destChain.id, dispatch, srcChain]);
};
