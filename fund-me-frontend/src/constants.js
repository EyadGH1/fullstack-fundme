export const CONTRACT_ADDRESS = "0x2c9aF95dECa4dccb631fa689558A4CF4a6658235";

export const ABI = [
  "function fund() public payable",
  "function withdraw() public",
  "function getAddressToAmountFunded(address fundingAddress) external view returns (uint256)",
  "function getFunder(uint256 index) external view returns (address)",
  "function getOwner() external view returns (address)"
];