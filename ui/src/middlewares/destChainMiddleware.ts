import {
  createListenerMiddleware,
  TypedStartListening,
} from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "store";
import { setDestToken } from "slices/swapInputSlice";
import { tokenApi } from "slices/tokenSlice";

export const destChainMiddleware = createListenerMiddleware();

type DestChainStartListening = TypedStartListening<RootState, AppDispatch>;

const destChainStartListening =
  destChainMiddleware.startListening as DestChainStartListening;

destChainStartListening({
  predicate: (_action, currentState, previousState) => {
    return (
      previousState.swapInputs.destChain.id !==
      currentState.swapInputs.destChain.id
    );
  },
  effect: async (_action, listenerApi) => {
    const state = listenerApi.getState();
    const currentToken = state.swapInputs.destToken;
    const destChain = state.swapInputs.destChain;
    const tokens = tokenApi.endpoints.getTokens.select()(state)?.data;
    const newToken = tokens?.find(
      (token) =>
        token.chainId === destChain.id && token.symbol === currentToken?.symbol
    );
    if (newToken && newToken?.address !== currentToken?.address) {
      listenerApi.dispatch(setDestToken(newToken));
    }
  },
});
