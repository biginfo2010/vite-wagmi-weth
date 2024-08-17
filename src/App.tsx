import {useAccount} from 'wagmi'
import WrapUnwrapETH from './components/WrapUnWrapETH'
import {Button, Flex, Spinner, Box, Heading, Text, VStack, useToast} from '@chakra-ui/react';
import {SwapAmountProvider} from './context/SwapAmountContext';
import {useEffect, useState} from "react";


const App: React.FC = () => {
    const {address, isConnected, isConnecting} = useAccount();
    const toast = useToast();
    const [isLoading, setIsLoading] = useState(true); // Loading state
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false); // Set loading to false after initial check
        }, 1000);
        if (isConnected) {
            console.log('Wallet is connected:', address);
            handleConnect()
            // Add any additional logic you want to execute when the wallet connects
        } else {
            console.log('Wallet is disconnected');
            handleDisconnect()
            // Add any logic for when the wallet disconnects
        }
        return () => clearTimeout(timer); // Cleanup the timeout on unmount
    }, [isConnected, address]); // Watch both isConnected and address
    const handleConnect = () => {
        toast({
            title: "Wallet Connected",
            description: "You have successfully connected your wallet.",
            status: "success",
            duration: 5000,
            isClosable: true,
        });
    };

    const handleDisconnect = () => {
        if (!isLoading) {
            toast({
                title: "Wallet Disconnected",
                description: "You have successfully disconnected your wallet.",
                status: "info",
                duration: 5000,
                isClosable: true,
            });
        }

    };
    if (isConnecting)
        return (
            <Flex
                gap="5"
                my="auto"
                p="5"
                mx="auto"
                alignItems="center"
                justifyContent="center"
                maxW={{base: "sm", md: "xl"}}
                rounded="2xl"
                borderWidth="1px"
                borderColor="gray.300"
            >
                <Button
                    py="7"
                    fontSize="2xl"
                    colorScheme="twitter"
                    rounded="xl"
                    isDisabled={true}
                >
                    <Spinner/>
                </Button>
            </Flex>
        );

    return (
        <>
            <Box
                textAlign="center"
                py={10}
                px={6}
                maxW="md"
                mx="auto"
                mt={10}
                borderRadius="lg"
                boxShadow="xl"
                padding="4"
                transition="all 0.3s ease"
                _hover={{
                    boxShadow: '2xl',
                    transform: 'scale(1.05)',
                }}
            >
                <VStack spacing={6}>
                    <Heading as="h1" size="2xl">
                        Welcome to Case Study
                    </Heading>
                    <Text fontSize="lg" color="gray.500">
                        {isConnected
                            ? `Connected as ${address?.substring(0, 6)}...${address?.substring(
                                address?.length - 4
                            )}`
                            : "Connect your wallet to get started."}
                    </Text>

                    {isConnected ? (
                        <SwapAmountProvider>
                            <WrapUnwrapETH/>
                        </SwapAmountProvider>
                    ) : (
                        <Flex
                            gap="5"
                            my="auto"
                            p="5"
                            mx="auto"
                            alignItems="center"
                            justifyContent="center"
                            maxW={{base: "sm", md: "xl"}}
                            rounded="2xl"
                            borderWidth="1px"
                            borderColor="gray.300"
                        >
                            <w3m-connect-button/>
                        </Flex>
                    )}
                </VStack>
            </Box>
        </>
    )
}

export default App
