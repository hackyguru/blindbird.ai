# BlindBird.ai - Avalanche C-Chain Integration

This project integrates the BlindBird.ai platform with Avalanche C-Chain for secure and decentralized AI inference payments.

## Features

- Operator registration and management
- Pay-per-token inference requests
- Secure payment handling using smart contracts
- Real-time balance tracking and withdrawals
- Integration with Avalanche C-Chain

## Prerequisites

- Node.js v16 or later
- MetaMask wallet with AVAX tokens
- Access to Avalanche C-Chain (Testnet or Mainnet)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/blindbird.ai.git
cd blindbird.ai
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Create a `.env.local` file:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
NEXT_PUBLIC_AVALANCHE_TESTNET_RPC=https://api.avax-test.network/ext/bc/C/rpc
NEXT_PUBLIC_AVALANCHE_MAINNET_RPC=https://api.avax.network/ext/bc/C/rpc
PRIVATE_KEY=your_deployment_wallet_private_key
```

## Smart Contract Deployment

1. Compile the contracts:
```bash
npx hardhat compile
```

2. Deploy to Avalanche Testnet:
```bash
npx hardhat run scripts/deploy.ts --network avalanche-testnet
```

3. Deploy to Avalanche Mainnet:
```bash
npx hardhat run scripts/deploy.ts --network avalanche-mainnet
```

4. Update the `NEXT_PUBLIC_CONTRACT_ADDRESS` in your `.env.local` file with the deployed contract address.

## Development

1. Start the development server:
```bash
npm run dev
```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### For Operators

1. Connect your MetaMask wallet
2. Register as an operator by setting:
   - Minimum payment amount
   - Cost per token
   - Model details
3. Monitor your earnings and complete inference requests
4. Withdraw your earnings when ready

### For Users

1. Connect your MetaMask wallet
2. Select an operator from the available list
3. Specify the number of tokens needed
4. Review the estimated cost
5. Submit payment and wait for inference completion

## Smart Contract Architecture

The `AIInferenceMarketplace` contract handles:
- Operator registration and management
- Payment processing
- Request tracking
- Fund distribution
- Platform fee management

## Security Considerations

- All transactions are secured by the Avalanche C-Chain
- Smart contract includes access controls and input validation
- Funds are held in escrow until inference completion
- Platform fees are automatically calculated and distributed

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
