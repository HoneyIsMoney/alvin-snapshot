const { ethers } = require("ethers");
const BN = ethers.BigNumber;

const alvinAddress  = "0x50DBde932A94b0c23D27cdd30Fbc6B987610c831";
const fromBlock     = 14834211;
const toBlock       = 18032324; // <-- this is not the real snaphot block
const cutoffAmount  = 1000000000
const ZERO_ADDRESS  = "0x" + "0".repeat(40);
const rpc           = "https://rpc.xdaichain.com/";

const blackList = [
	"0x0000000000000000000000000000000000000000",
	"0xe8adaea0ba507a28d1309051beceb4db7fe377af",
	"0x57cace2793069f2e58b6da2977d39fd257087b57",
	"0xee4685d9f2e2ea05fe61dcb9c31b1b07b4fd7121",
	"0xb8432d4c985c1a17a50ce0676b97dbd157737c37",
	"0xc2d4603b07ddb725b97cbcac8bcf98e051ea80aa",
	"0x20F5640639094e4c4E9522113786cF0788f7dCcA",
];

const run = async () => {
	const provider = ethers.getDefaultProvider(rpc);
	const Alvin = new ethers.Contract(
		alvinAddress,
		["event Transfer(address indexed from, address indexed to, uint256 value)"],
		provider
	);

	const snapshot = {};
	snapshot[ZERO_ADDRESS] = BN.from(0);
	const transferFilter = Alvin.filters.Transfer();

	// 1. get events
	const events = await Alvin.queryFilter(transferFilter, fromBlock, toBlock);

	// 2. for event in events
	for (const e in events) {
		// 3. get values from event
		const [from, to, amount] = events[e].args;
		// 4.    snapshot[from] -= amount
		snapshot[from] = snapshot[from].sub(amount);
		// 5. check if the 'to' address has a balance, if not initialise
		snapshot[to] === undefined ? (snapshot[to] = BN.from(0)) : null;
		// 6. snapshot[to] = vale
		snapshot[to] = snapshot[to].add(amount);
	}


    // 7. remove blacklisted addresses
    for (const address in blackList) {
        const remove = blackList[address]
        delete snapshot[remove]
    }

    // 8. remove addresses with less than cutoff amount
    //    put into an array and convert BN to string
    const filteredList = []
    for (address in snapshot) {
        if (snapshot[address].gt(cutoffAmount)) {
            filteredList.push([address, snapshot[address].toString()])
        }
    }

    // turn array to csv
    let csv = filteredList.map(e => e.join(",")).join("\n");

    console.log(csv);


};

run()
	.then(() => process.exit(0))
	.catch((e) => {
		console.log(e);
		process.exit(1);
	});
