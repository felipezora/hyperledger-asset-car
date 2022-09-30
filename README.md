# hyperledger-asset-car
Based on Hyperledger guides code. Hyperledger Chaincode and application using it, basic functions to modify assets of a ledger representing cars with the following business rules: 
1. id, registration, model and brand can not be modified.
2. estimatedValue only can be exchanged for the same or a lower value than the actual.
3. color always can be modified.
4. owner got to be modified using the function transferAsset.
