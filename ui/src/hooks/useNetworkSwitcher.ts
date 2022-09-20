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
  const { chain } = useNetwork();

  useEffect(() => {
    if (!chain) return;

    const prevChain = { ...srcChain } as SquidChain;
    const currentChain = chain as SquidChain;

    // update src chain if network supported
    if (currentChain.icon) {
      dispatch(setSrcChain(currentChain));
    }

    // set dest chain to previously cached chain to avoid conflicts
    if (currentChain.id === destChain.id) {
      dispatch(setDestChain(prevChain));
    }
  }, [chain, destChain.id, dispatch, srcChain]);
};
