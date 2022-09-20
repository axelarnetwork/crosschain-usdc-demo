import { InputContainer } from "components/swap";
import * as swap from "components/swap";
import { useAppDispatch, useAppSelector } from "hooks/useAppSelector";
import type { NextPage } from "next";
import {
  selectAmount,
  selectDestChain,
  selectDestToken,
  selectSrcChain,
  selectSrcToken,
  setDestToken,
  setSrcToken,
} from "slices/swapInputSlice";
import { useEffect } from "react";
import useAmountValidator from "hooks/useAmountValidator";
import useApproveChecker from "hooks/useApproveChecker";
import { SwapEstimator } from "components/swap";
import { TokenInputModalKey, ChainInputModalKey } from "components/modals";
import { SwapRoute } from "components/utils";
import { useNetworkSwitcher } from "hooks";
import useTokens from "hooks/useTokens";

const Home: NextPage = () => {
  const dispatch = useAppDispatch();
  const amount = useAppSelector(selectAmount);
  const srcChain = useAppSelector(selectSrcChain);
  const srcToken = useAppSelector(selectSrcToken);
  const destChain = useAppSelector(selectDestChain);
  const destToken = useAppSelector(selectDestToken);
  const srcTokens = useTokens(srcChain);
  const destTokens = useTokens(destChain);
  const isRequiredApproval = useApproveChecker();
  const amountValidation = useAmountValidator(amount, srcToken);

  // Automatically update `srcChain` and `destChain` whenever connected wallet's network has changed.
  useNetworkSwitcher();

  useEffect(() => {
    if (!srcToken && !destToken) {
      dispatch(setSrcToken(srcTokens.find((token) => !token.crosschain)));
      dispatch(setDestToken(destTokens.find((token) => !token.crosschain)));
    }
  }, [destToken, destTokens, dispatch, srcToken, srcTokens]);

  return (
    <swap.SwapContainer>
      <h1 className="text-3xl font-thin text-center text-white">
        Swap Native Tokens ✨
      </h1>
      <div className="mt-5">
        <div className="mb-2 font-light text-white">From</div>
        <InputContainer>
          <div className="flex justify-center">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <swap.ChainInput
                  selectedChain={srcChain}
                  label="From"
                  modalKey={ChainInputModalKey.ModalChainFrom}
                  isSrcChain={true}
                />
              </div>
              <div>
                <swap.TokenInput
                  label="Send"
                  modalKey={TokenInputModalKey.ModalTokenInput}
                  selectedToken={srcToken}
                />
              </div>
            </div>
          </div>
          <div className="mt-5">
            <div>
              <swap.AmountInput
                className="mt-4"
                selectedToken={srcToken}
                validState={amountValidation}
              />
            </div>
          </div>
        </InputContainer>
      </div>

      <div className="mt-5">
        <div className="mb-2 font-light text-white">To</div>
        <InputContainer>
          <div className="flex justify-center">
            <div className="grid grid-cols-2 gap-5">
              <div>
                <swap.ChainInput
                  selectedChain={destChain}
                  label="To"
                  modalKey={ChainInputModalKey.ModalChainTo}
                />
              </div>
              <div>
                <swap.TokenInput
                  label="Receive"
                  modalKey={TokenInputModalKey.ModalTokenOutput}
                  selectedToken={destToken}
                />
              </div>
            </div>
          </div>

          <div className="mt-5">
            <swap.AddressInput />
          </div>
        </InputContainer>
      </div>
      <div className="mt-10">
        <InputContainer>
          <SwapEstimator amount={amount} />
        </InputContainer>
        <SwapRoute />
      </div>
      <div className="flex flex-col mt-8">
        {isRequiredApproval ? (
          <swap.ApproveButton />
        ) : (
          <swap.SwapButton
            amount={amount}
            amountValidation={amountValidation}
          />
        )}
      </div>
    </swap.SwapContainer>
  );
};

export default Home;
