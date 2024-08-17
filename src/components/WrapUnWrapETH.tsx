import {
  AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay,
  Button,
  Flex,
  Spinner, useDisclosure,
} from "@chakra-ui/react"
import React, { useEffect, useState } from "react"
import { BaseError, useAccount, useBalance, useWriteContract } from "wagmi"
import SwapInput from "./SwapInput";
import Navbar from "./Navbar";
import { useWaitForTransactionReceipt } from "wagmi";
import { parseAbi, parseEther } from "viem";
import { useBlockNumber } from "wagmi";
import { useSwapAmount } from "../context/SwapAmountContext";

const WETH_CONTRACT_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

const WrapUnwrapETH: React.FC = () => {
  const { address } = useAccount();
  const { amount } = useSwapAmount();
  const [currentFrom, setCurrentFrom] = useState<string>("eth");
  const { data: ethBalance, refetch: ethRefetch } = useBalance({ address });
  const { data: wethBalance, refetch: wethRefetch } = useBalance({ address, token: WETH_CONTRACT_ADDRESS });
  const { data: blockNumber } = useBlockNumber({ watch: true });

  const { data: hash, error, isPending, writeContract } = useWriteContract()

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = React.useRef();

  const handleConfirm = () => {
    // Add your confirmation logic here
    console.log("Confirmed!");
    onClose();
    executeSwap()
  };

  useEffect(() => {
    ethRefetch();
    wethRefetch();
  }, [blockNumber]);

  const executeSwap = async () => {
    if (currentFrom === "eth") {
      writeContract({
        address: WETH_CONTRACT_ADDRESS,
        abi: parseAbi(["function deposit() public payable"]),
        functionName: 'deposit',
        value: parseEther(amount || '0')
      })
    } else {
      writeContract({
        address: WETH_CONTRACT_ADDRESS,
        abi: parseAbi(["function withdraw(uint wad) public"]),
        functionName: 'withdraw',
        args: [parseEther(amount || '0')]
      })
    }
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
  useWaitForTransactionReceipt({
    hash
  })

  return (
    <Flex
      direction="column"
      gap="5"
      my="auto"
      p="5"
      mx="auto"
      maxW={{ base: "sm", md: "xl" }}
      w="full"
      rounded="2xl"
      borderWidth="1px"
      borderColor="gray.300"
    >
      <Navbar />
      <Flex
        direction={currentFrom === "eth" ? "column" : "column-reverse"}
        gap="3"
      >
        <SwapInput
          current={currentFrom}
          type="eth"
          max={ethBalance?.formatted}
          tokenSymbol="ETH"
          tokenBalance={ethBalance?.formatted || "0"}
        />

        <Button
          onClick={() =>
            currentFrom === "eth"
              ? setCurrentFrom("weth")
              : setCurrentFrom("eth")
          }
          maxW="5"
          mx="auto"
          className="wrap-btn"
        >
          ↓
        </Button>

        <SwapInput
          current={currentFrom}
          type="weth"
          max={wethBalance?.formatted}
          tokenSymbol="WETH"
          tokenBalance={wethBalance?.formatted || "0"}
          />
      </Flex>
      <Button
        onClick={onOpen}
        py="7"
        fontSize="2xl"
        colorScheme="twitter"
        rounded="xl"
        isDisabled={isConfirming || isPending || amount == '0'}
      >
        {(isConfirming || isPending) ? <Spinner /> : "Confirm"}
      </Button>
      {isConfirming && <div>Waiting for confirmation...</div>} 
      {isConfirmed && <div>Transaction confirmed.</div>} 
      {error && (
        <div>Error: {(error as BaseError).shortMessage || error.message}</div>
      )}
      <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Swap
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="twitter" onClick={handleConfirm} ml={3}>
                Confirm
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Flex>

  )
}

export default WrapUnwrapETH

