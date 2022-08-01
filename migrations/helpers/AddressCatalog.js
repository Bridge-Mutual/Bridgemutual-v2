let mainnetAddress = {
  // 3rd Parties
  aave_lendingPool: "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5",
  aave_token: "0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811",
  comp_comptroller: "0x3d9819210a31b4961b30ef54be2aed79b9c9cd3b",
  comp_cUSDT: "0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9",
  yearn_vault: "0x7Da96a3891Add058AdA2E826306D812C638D87a7",
  amm_router: "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", // SushiSwap: Router
  sushiswap_V2MasterChef: "0xef0881ec094552b2e128cf945ef17a6752b4ec5d",
  bmi_treasury: "0x7562Ce0cdA3535268386E07A4d5C668833dcD9e9",

  // Tokens
  bmi_token: "0x725c263e32c72ddc3a19bea12c5a0479a81ee688",
  usdt_token: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  weth_token: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  amm_bmiEth: "0x53813285cc60b13fCd2105C6472a47af01f8Ac84", // SushiSwap LP Token (SLP)

  //wallets
  proxy_admin: "0x56fEB55FFD9365D42D0a5321a3a029C4640Bd8DC",
  capitalPool_mantainer: "0xE31Ce279581DaaC42cA37bB83957321CE46A1E42",
  team: [
    "0x2C6b033790F3492188A13902a438EF6Ddb6A48b1",
    "0xfe8be8ddcc9b4b022b421c17e16602be48dd4c65",
    "0x2B63c26f08dafFa95f700151B669cb3976eF94Bc",
    "0xEE1558fd89567D662bF62F55990bEbC24852A0f7",
    "0xCDb942Cdf9A393f1309B3D6505C597e9E70ba0a8",
    "0xB98C1Fb3d404e983bc2dEAbCAd5E18B93a10E839",
  ],
};

let bscMainnetAddress = {
  // Tokens
  bmi_token: "0xB371f0EB8DfB3b47FDFC23bBCBC797954d3d4F23",
  usdt_token: "0x55d398326f99059fF775485246999027B3197955",
  wbnb_token: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
  //TODO has to set
  stkbmi_token: "0x2BAe71def55B9dbc2F03179f9868d4384456EED6",
  bmi_treasury: "0x7562Ce0cdA3535268386E07A4d5C668833dcD9e9",

  amm_router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", // SushiSwap: Router

  //proxy_admin: "0x56fEB55FFD9365D42D0a5321a3a029C4640Bd8DC", // * validate finality
  //capitalPool_mantainer: "0xc910BaE4B0a32c35b09F1ca26f42111BC54136DE",
  //TODO has to change
  team: [
    "0x2C6b033790F3492188A13902a438EF6Ddb6A48b1", //Mikce address
    "0xa226e23912df06f02E1f33b8fD98B75191FA1E71", //Lukas address
    "0xEE1558fd89567D662bF62F55990bEbC24852A0f7", // kiril address
  ],
};

let polygonMainnetAddress = {
  // Tokens
  bmi_token: "0x3e1b4Ff4AE3Ab8f0Cb40a34a6ad3fC817F7dA2b6",
  usdt_token: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
  wmatic_token: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
  //TODO has to set
  stkbmi_token: "",
  bmi_treasury: "",

  amm_router: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506", // SushiSwap: Router

  // proxy_admin: "0x56fEB55FFD9365D42D0a5321a3a029C4640Bd8DC",
  // capitalPool_mantainer: "0xc910BaE4B0a32c35b09F1ca26f42111BC54136DE",

  //TODO has to change
  team: [
    "0x2C6b033790F3492188A13902a438EF6Ddb6A48b1", //Mikce address
    "0xa226e23912df06f02E1f33b8fD98B75191FA1E71", //Lukas address
    "0xEE1558fd89567D662bF62F55990bEbC24852A0f7", // kiril address
  ],
};

module.exports = {
  mainnet: mainnetAddress,
  bsc: bscMainnetAddress,
  polygon: polygonMainnetAddress,
};
