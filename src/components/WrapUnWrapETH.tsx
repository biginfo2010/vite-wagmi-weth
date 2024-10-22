import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    Button,
    Flex,
    Spinner,
    useDisclosure,
    useToast
} from "@chakra-ui/react"
import React, {useEffect, useRef, useState} from "react"
import {BaseError, useAccount, useBalance, useWriteContract, useBlockNumber} from "wagmi"
import SwapInput from "./SwapInput";
import Navbar from "./Navbar";
import {parseAbi, parseEther} from "viem";
import {useSwapAmount} from "../context/SwapAmountContext";
import {config} from "../wagmi";
import {waitForTransactionReceipt, WriteContractErrorType} from "wagmi/actions";

const WETH_CONTRACT_ADDRESS = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';

const WrapUnwrapETH: React.FC = () => {
    const toast = useToast();
    const {address} = useAccount();
    const {amount} = useSwapAmount();
    const [currentFrom, setCurrentFrom] = useState<"eth" | "weth">("eth");
    const {data: ethBalance, refetch: ethRefetch} = useBalance({address});
    const {data: wethBalance, refetch: wethRefetch} = useBalance({address, token: WETH_CONTRACT_ADDRESS});
    const {data: blockNumber} = useBlockNumber({watch: true});

    const [isConfirming, setIsConfirming] = useState<boolean>(false);
    const {error, isPending, writeContract} = useWriteContract()

    const {isOpen, onOpen, onClose} = useDisclosure();
    const cancelRef = useRef<HTMLLIElement | null>(null);
    const handleConfirm = () => {
        onClose();
        executeSwap()
    };

    useEffect(() => {
        ethRefetch();
        wethRefetch();
    }, [blockNumber]);

    const handleTransactionSubmitted = async (txHash: string) => {
        setIsConfirming(true);
        const transactionReceipt = await waitForTransactionReceipt(config, {
            hash: txHash as `0x${string}`,
        });

        setIsConfirming(false);
        // at this point the tx was mined

        if (transactionReceipt.status === "success") {
            // execute your logic here
            toast({
                title: currentFrom === "eth" ? "Wrap ETH" : "Unwrap WETH",
                description: "Successfully swapped.",
                status: "success",
                position: "bottom-right",
            })
        } else {
            toast({
                title: currentFrom === "eth" ? "Wrap ETH" : "Unwrap WETH",
                description: (error as BaseError).shortMessage || error?.message,
                status: "error",
                position: "bottom-right",
            })
        }
    }

    const handleTransactionError = async (txError: WriteContractErrorType) => {
        toast({
            title: currentFrom === "eth" ? "Wrap ETH" : "Unwrap WETH",
            description: (txError as BaseError).shortMessage || txError?.message,
            status: "error",
            position: "bottom-right",
        })
    }

    const executeSwap = async () => {
        if (currentFrom === "eth") {
            writeContract(
                {
                    address: WETH_CONTRACT_ADDRESS,
                    abi: parseAbi(["function deposit() public payable"]),
                    functionName: 'deposit',
                    value: parseEther(amount || '0')
                },
                {
                    onSuccess: handleTransactionSubmitted,
                    onError: handleTransactionError,
                }
            )
        } else {
            writeContract(
                {
                    address: WETH_CONTRACT_ADDRESS,
                    abi: parseAbi(["function withdraw(uint wad) public"]),
                    functionName: 'withdraw',
                    args: [parseEther(amount || '0')]
                },
                {
                    onSuccess: handleTransactionSubmitted,
                    onError: handleTransactionError,
                }
            )
        }
    };

    return (
        <Flex
            direction="column"
            gap="5"
            my="auto"
            p="5"
            mx="auto"
            maxW={{base: "sm", md: "xl"}}
            w="full"
            rounded="2xl"
            borderWidth="1px"
            borderColor="gray.300"
        >
            <Navbar/>
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
                {(isConfirming || isPending) ? <Spinner/> : "Confirm"}
            </Button>
            <AlertDialog
                isOpen={isOpen}
                onClose={onClose}
                leastDestructiveRef={cancelRef}
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
                            <Button onClick={onClose}>
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

