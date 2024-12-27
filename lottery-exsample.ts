import Web3 from "web3";
import { AbiItem } from "web3-utils";

// Provider setup
const provider = new Web3.providers.HttpProvider("https://base.llamarpc.com");
const web3 = new Web3(provider);

// Token configuration
interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}

const tokenInfo: TokenInfo[] = [
  {
    symbol: "USDC",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6
  },
  {
    symbol: "WBTC",
    address: "0x0555E30da8f98308EdB960aa94C0Db47230d2B9c",
    decimals: 8
  },
  {
    symbol: "WETH",
    address: "0x4200000000000000000000000000000000000006",
    decimals: 18
  }
];

const erc20ABI: AbiItem[] = [
  {
    constant: true,
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  }
];

// Mock data for testing  , if will get all holde  -> user api base https://docs.basescan.org/support/rate-limits  have rate-limit 
const mockHolders = [
  { address: "0x1111111111111111111111111111111111111111", name: "Alice" },
  { address: "0x0E093622ab0233697b706DC4AD1b08551BE0fCC9", name: "Bob" },
  { address: "0xE3025D4f2b97086C1D52eA51DC0427D76d28fAFD" ,name: "Godzilla gem gems"}
];

interface HolderBalance {
  address: string;
  name: string;
  balances: {
    [key: string]: string;  // Token symbol -> balance
  };
  totalWeight: number;
}

class TokenLottery {
  private holders: HolderBalance[] = [];
  private totalWeight: number = 0;

  async initialize(addresses: typeof mockHolders) {
    for (const holder of addresses) {
      const balances: {[key: string]: string} = {};
      let totalWeight = 0;

      for (const token of tokenInfo) {
        const contract = new web3.eth.Contract(erc20ABI, token.address);
        const balance = await contract.methods.balanceOf(holder.address).call();
        const normalizedBalance = Number(balance) / Math.pow(10, token.decimals);
        balances[token.symbol] = normalizedBalance.toString();
        totalWeight += normalizedBalance;
      }

      this.holders.push({
        address: holder.address,
        name: holder.name,
        balances,
        totalWeight
      });
      
      this.totalWeight += totalWeight;
    }
  }

  selectWinners(count: number): HolderBalance[] {
    const winners: HolderBalance[] = [];
    const selectedAddresses = new Set<string>();

    while (winners.length < count && winners.length < this.holders.length) {
      const randomPoint = Math.random() * this.totalWeight;
      let cumulativeWeight = 0;
      
      for (const holder of this.holders) {
        if (selectedAddresses.has(holder.address)) continue;
        
        cumulativeWeight += holder.totalWeight;
        if (randomPoint <= cumulativeWeight) {
          winners.push(holder);
          selectedAddresses.add(holder.address);
          break;
        }
      }
    }

    return winners;
  }

  printHolderStats() {
    console.log("\nHolder Statistics:");
    console.log("=================");
    
    for (const holder of this.holders) {
      console.log(`\n${holder.name} (${holder.address})`);
      console.log("Token Balances:");
      for (const [symbol, balance] of Object.entries(holder.balances)) {
        console.log(`  ${symbol}: ${balance}`);
      }
      console.log(`Total Weight: ${holder.totalWeight}`);
      console.log(`Win Probability: ${((holder.totalWeight / this.totalWeight) * 100).toFixed(2)}%`);
    }
  }
}

async function main() {
  try {
    console.log("Initializing lottery system...");
    const lottery = new TokenLottery();
    await lottery.initialize(mockHolders);
    
    lottery.printHolderStats();
    
    console.log("\nSelecting 100 winners...");
    const winners = lottery.selectWinners(100);
    
    console.log("\nWinners:");
    console.log("========");
    winners.forEach((winner, index) => {
      console.log(`${index + 1}. ${winner.name} (${winner.address})`);
    });
    
  } catch (error) {
    console.error("Error running lottery:", error);
  }
}

main();