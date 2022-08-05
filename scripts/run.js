const hre = require("hardhat");

async function main() {
  //deploying the function locally with hardhat
  const rsvpContractFactory = await hre.ethers.getContractFactory("Web3RSVP");
  const rsvpContract = await rsvpContractFactory.deploy();
  await rsvpContract.deployed();
  console.log("Contract deployed to:", rsvpContract.address);

  //method to get the deployer wallet address and test wallets to simulate wallet interaction
  const [deployer, address1, address2] = await hre.ethers.getSigners();

  //-----testing our contract functions-----

  //creating a new event

  let deposit = hre.ethers.utils.parseEther("1");
  let maxCapacity = 3;
  let timestamp = 1718926200;
  let eventDataCID =
    "bafybeibhwfzx6oo5rymsxmkdxpmkfwyvbjrrwcl7cekmbzlupmp5ypkyfi";

  let txn = await rsvpContract.createNewEvent(
    timestamp,
    deposit,
    maxCapacity,
    eventDataCID
  );
  let wait = await txn.wait(); //will return data about the transaction including an array of emitted events
  console.log("NEW EVENT CREATED:", wait.events[0].event, wait.events[0].args);

  let eventID = wait.events[0].args.eventID; //saving the event ID to RSVP later
  console.log("EVENT ID:", eventID);

  //RSVP to the event, by default its called with the deployer wallet.
  txn = await rsvpContract.createNewRSVP(eventID, { value: deposit });
  wait = await txn.wait();
  console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

  //The .connect(address) modifier is used to call the contract functions with the test wallets
  txn = await rsvpContract
    .connect(address1)
    .createNewRSVP(eventID, { value: deposit });
  wait = await txn.wait();
  console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

  txn = await rsvpContract
    .connect(address2)
    .createNewRSVP(eventID, { value: deposit });
  wait = await txn.wait();
  console.log("NEW RSVP:", wait.events[0].event, wait.events[0].args);

  //confirm all of the RSVPs, the event was created from the deployer wallet so the function has to be called from the same address
  txn = await rsvpContract.confirmAllAttendees(eventID);
  wait = await txn.wait();
  wait.events.forEach((event) =>
    console.log("CONFIRMED:", event.args.attendeeAddress)
  );

  //withdrawing unclaimed deposits

  //The event owner needs to wait 7 days after the event happened to claim unclaimed deposits. We're going to simulate 10 years using hardhat
  await hre.network.provider.send("evm_increaseTime", [15778800000000]);

  txn = await rsvpContract.withdrawUnclaimedDeposits(eventID);
  wait = await txn.wait();
  console.log("WITHDRAWN:", wait.events[0].event, wait.events[0].args);
}

async function runMain() {
  try {
    await main();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

runMain();
