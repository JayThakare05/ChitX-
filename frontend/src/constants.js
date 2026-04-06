// CTX Token contract details (Sepolia)
export const CTX_ADDRESS = '0x3F78A5476539BfBD529FfEA0e713f887141412e3';
export const TREASURY_ADDRESS = '0x95e9943BB6F8B301Fa465e698a5aAc435DB48C39';
export const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
];
