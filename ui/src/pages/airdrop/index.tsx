import {
  InputContainer,
  AmountInput,
  TokenInput,
  ApproveButton,
  ChainInput,
} from "components/swap";
import { MaxButton } from "components/common";
import { SwapContainer } from "components/swap";
import { useAppDispatch, useAppSelector } from "hooks/useAppSelector";
import type { NextPage } from "next";
import {
  selectAmount,
  selectSrcChain,
  selectSrcToken,
} from "slices/swapInputSlice";
import {
  removeAliasAddress,
  selectAliasAddresses,
} from "slices/dropInputSlice";
import { useEffect } from "react";
import useAmountValidator from "hooks/useAmountValidator";
import { resetSwapStatus } from "slices/swapStatusSlice";
import { TokenInputModalKey, ChainInputModalKey } from "components/modals";
import { chains } from "config/constants";
import { TextInput } from "components/airdrop";
import { DropButton } from "components/airdrop";
import useApproveChecker from "hooks/useApproveChecker";
import { Badge } from "components/common";

const AirdropHome: NextPage = () => {
  const dispatch = useAppDispatch();
  const amount = useAppSelector(selectAmount);
  const aliasAddresses = useAppSelector(selectAliasAddresses);
  const srcChain = useAppSelector(selectSrcChain);
  const srcToken = useAppSelector(selectSrcToken);
  const amountValidation = useAmountValidator(amount, srcToken);
  const isRequiredApproval = useApproveChecker();

  useEffect(() => {
    dispatch(resetSwapStatus());
  }, [dispatch]);

  return (
    <SwapContainer>
      <InputContainer>
        <h2>Source chain</h2>
        <div className="flex flex-col mt-4">
          <ChainInput
            selectedChain={srcChain}
            label="From"
            modalKey={ChainInputModalKey.ModalChainFrom}
            isSrcChain={true}
          />
          <TokenInput
            label="Send"
            className="mt-2"
            modalKey={TokenInputModalKey.ModalTokenInput}
            selectedToken={srcToken}
          />
          {srcToken && (
            <>
              <AmountInput
                className="mt-4"
                selectedToken={srcToken}
                validState={amountValidation}
              />
              <MaxButton selectedToken={srcToken} />
            </>
          )}
        </div>
      </InputContainer>
      <br />
      <br />
      <InputContainer className="mt-2">
        <h2>Comma-separated ENS address(s)</h2>
        <div className="flex flex-col mt-4">
          <ChainInput
            selectedChain={chains[0]}
            label="To"
            modalKey={ChainInputModalKey.ModalChainTo}
          />
          <br />
          {aliasAddresses && (
            <div className="flex flex-row flex-wrap">
              {aliasAddresses?.map((addr, i) => {
                return (
                  <Badge
                    key={`alias-badge-${i}`}
                    text={addr}
                    onclick={() => dispatch(removeAliasAddress(addr))}
                  />
                );
              })}
            </div>
          )}
          <TextInput className="mt-4" />
        </div>
      </InputContainer>
      <div className="flex flex-col mt-4">
        {isRequiredApproval ? (
          <ApproveButton />
        ) : (
          <DropButton
            amount={amount}
            aliasAddresses={aliasAddresses}
            amountValidation={amountValidation}
          />
        )}
      </div>
    </SwapContainer>
  );
};

export default AirdropHome;
